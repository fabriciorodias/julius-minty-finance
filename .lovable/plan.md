

# Ajuste do Super Prompt: Remover Saldo Inicial

Remoção da tabela `account_initial_balances` e toda lógica associada. O saldo de uma conta passa a ser simplesmente a soma de todas as suas transações.

## Alterações no Prompt

### 1. Remover da seção "Foreign Keys OBRIGATORIAS"
- Remover a linha: `account_initial_balances.account_id -> accounts.id ON DELETE CASCADE`

### 2. Remover a seção inteira da tabela `account_initial_balances`
- Toda a definição da tabela sai do prompt

### 3. Simplificar a função `get_account_balances`
De:
```sql
COALESCE(ib.amount, 0) + COALESCE(SUM(t.amount) FILTER (...), 0)
FROM accounts a
LEFT JOIN account_initial_balances ib ...
LEFT JOIN transactions t ...
```
Para:
```sql
SELECT a.id AS account_id,
  COALESCE(SUM(t.amount), 0) AS current_balance
FROM accounts a
LEFT JOIN transactions t ON t.account_id = a.id AND t.user_id = a.user_id
  AND t.event_date <= p_as_of_date
WHERE a.user_id = p_user_id AND a.is_active = true
GROUP BY a.id;
```

### 4. Ajustar invalidação de cache
- Remover `['account-initial-balance', user.id]` de todas as listas de invalidação
- Manter apenas `['accounts', user.id]` e `['account-balances', user.id]`

### 5. Ajustar seção "Contas" (página)
- Remover menção a "Modal criar/editar conta com saldo inicial"
- Substituir por "Modal criar/editar conta"

### 6. Ajustar "Notas sobre o prompt"
- Remover a linha sobre UNIQUE constraint em account_initial_balances
- Adicionar nota: "Saldo inicial eliminado -- saldo = soma de transações. Para contas com saldo existente, cadastrar transação de receita."

### 7. Ajustar "Principios de Código"
- A linha "Nunca duplicar logica de calculo de saldo" permanece, mas agora o cálculo é ainda mais simples (soma pura)

---

## Prompt Atualizado Completo

Abaixo o prompt com todas as alterações aplicadas (as mudanças estão integradas, sem marcações):

````text
# Julius 2.0 - Aplicacao de Financas Pessoais

Crie uma aplicacao de financas pessoais chamada "Julius" com as seguintes especificacoes.

## Stack e Design

- React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- Supabase para backend (auth, database, RLS)
- Tema escuro premium estilo fintech:
  - Background principal: #111827 (Gray-900)
  - Sidebar/Header: #1F2937 (Gray-800) com bordas white/10
  - Cards de conta: cor solida da instituicao (primary_color) com texto branco
  - Tipografia: branca para titulos, gray-400 para secundarios
  - Layout ADHD-friendly: alta densidade, minimo scroll vertical, sem titulos redundantes
  - Grid de cards de contas: 2 cols mobile, 3 md, 4 lg, 5 xl
  - Saldos em text-xl bold tabular-nums
  - Acoes em dropdown menu (tres pontinhos) para economizar espaco

## Autenticacao

- Login com email/senha via Supabase Auth
- Tabela `profiles` (id uuid PK references auth.users ON DELETE CASCADE, first_name text, last_name text, avatar_url text, gender text, monthly_cost_of_living numeric, favorite_expense_account_id uuid, favorite_income_account_id uuid, updated_at timestamptz default now())
- Trigger auto-create profile on signup
- RLS: users can only CRUD their own profile (no DELETE)
- Paginas: Login, Register, ForgotPassword, ResetPassword
- ProtectedRoute wrapper

## Modelo de Dados - REGRAS CRITICAS

### Convencao de Sinais
- Despesas sao armazenadas como valores NEGATIVOS no campo `amount`
- Receitas sao armazenadas como valores POSITIVOS no campo `amount`
- O campo `type` ('receita' | 'despesa') e derivado do sinal: amount >= 0 = receita, amount < 0 = despesa
- Calculo de saldo: soma direta de todos os amounts (sem necessidade de CASE/WHEN)
- Na UI, exibir despesas sem sinal negativo (usar Math.abs para display) e diferenciar por cor (verde receita, vermelho despesa)

### Saldo de Contas
- NAO existe tabela de saldo inicial. O saldo de uma conta e sempre a soma de todas as suas transacoes.
- Para registrar um saldo pre-existente ao cadastrar uma nova conta, o usuario deve criar uma transacao de receita (ou despesa, para passivos) com o valor correspondente.
- Isso garante que o saldo e sempre derivado e auditavel a partir do historico de transacoes.

### Foreign Keys OBRIGATORIAS
Todas as relacoes devem ter foreign keys explicitas com ON DELETE apropriado:
- accounts.institution_id -> institutions.id ON DELETE RESTRICT
- accounts.user_id -> auth.users(id) ON DELETE CASCADE
- transactions.account_id -> accounts.id ON DELETE RESTRICT
- transactions.category_id -> categories.id ON DELETE SET NULL
- transactions.counterparty_id -> counterparties.id ON DELETE SET NULL
- transaction_tags.transaction_id -> transactions.id ON DELETE CASCADE
- transaction_tags.tag_id -> tags.id ON DELETE CASCADE
- categories.parent_id -> categories.id ON DELETE RESTRICT
- budgets.category_id -> categories.id ON DELETE CASCADE
- recurring_transactions.category_id -> categories.id ON DELETE SET NULL
- recurring_transactions.account_id -> accounts.id ON DELETE SET NULL
- recurring_transactions.counterparty_id -> counterparties.id ON DELETE SET NULL

### RLS em TODAS as tabelas
- Todas as tabelas de usuario devem ter RLS habilitado
- Policies restritivas (NOT permissive): auth.uid() = user_id
- Para INSERT, validar que FKs referenciadas pertencem ao mesmo usuario
- Nunca expor dados entre usuarios

## Tabelas

### institutions
- id uuid PK default gen_random_uuid()
- user_id uuid NOT NULL
- name text NOT NULL
- logo_url text
- primary_color text (hex, ex: '#8B5CF6')
- secondary_color text
- is_active boolean default true
- created_at timestamptz default now()

### accounts
- id uuid PK default gen_random_uuid()
- user_id uuid NOT NULL
- institution_id uuid NOT NULL -> institutions.id
- name text NOT NULL
- kind enum('asset','liability') NOT NULL
- subtype enum('cash','bank','investment','property_rights','other_assets','credit_card','loan','other_liabilities') NOT NULL
- credit_limit numeric (apenas para credit_card)
- is_active boolean default true
- last_reconciled_at timestamptz
- last_reconciliation_method enum('manual','automacao','open_finance')
- next_due_date date
- created_at timestamptz default now()
- NAO usar campo "type" legado. Apenas kind + subtype.

### categories
- id uuid PK default gen_random_uuid()
- user_id uuid NOT NULL
- parent_id uuid -> categories.id ON DELETE RESTRICT
- name text NOT NULL
- type enum('receita','despesa') NOT NULL
- is_active boolean default true
- display_order integer default 0
- created_at timestamptz default now()

### counterparties
- id uuid PK default gen_random_uuid()
- user_id uuid NOT NULL
- name text NOT NULL
- document text
- email text
- phone text
- is_active boolean default true
- created_at timestamptz default now()
- updated_at timestamptz default now()

### tags
- id uuid PK default gen_random_uuid()
- user_id uuid NOT NULL
- name text NOT NULL
- color text
- created_at timestamptz default now()
- updated_at timestamptz default now()
- UNIQUE(user_id, name)

### transactions
- id uuid PK default gen_random_uuid()
- user_id uuid NOT NULL
- account_id uuid -> accounts.id ON DELETE RESTRICT
- category_id uuid -> categories.id ON DELETE SET NULL
- counterparty_id uuid -> counterparties.id ON DELETE SET NULL
- description text NOT NULL
- amount numeric NOT NULL (negativo = despesa, positivo = receita)
- type text NOT NULL GENERATED ALWAYS AS (CASE WHEN amount >= 0 THEN 'receita' ELSE 'despesa' END) STORED
- event_date date NOT NULL
- notes text
- is_reviewed boolean default false
- input_source enum('manual','import','ai_agent','recurring','installment') default 'manual'
- installment_id uuid
- installment_number integer
- total_installments integer
- transfer_id uuid
- transfer_type enum('origem','destino')
- related_account_id uuid
- created_at timestamptz default now()

### transaction_tags
- transaction_id uuid NOT NULL -> transactions.id ON DELETE CASCADE
- tag_id uuid NOT NULL -> tags.id ON DELETE CASCADE
- user_id uuid NOT NULL
- created_at timestamptz default now()
- PRIMARY KEY (transaction_id, tag_id)

### recurring_transactions
- id uuid PK default gen_random_uuid()
- user_id uuid NOT NULL
- template_name text NOT NULL
- description text NOT NULL
- type text NOT NULL ('receita' | 'despesa')
- expected_amount numeric NOT NULL default 0
- variance_tolerance numeric default 10
- recurrence_pattern enum('weekly','monthly','quarterly','yearly') default 'monthly'
- day_of_month integer default 1
- next_due_date date NOT NULL
- last_payment_date date
- notification_days integer default 3
- auto_categorize boolean default true
- status enum('active','paused','completed') default 'active'
- category_id uuid -> categories.id ON DELETE SET NULL
- account_id uuid -> accounts.id ON DELETE SET NULL
- counterparty_id uuid -> counterparties.id ON DELETE SET NULL
- notes text
- created_at timestamptz default now()
- updated_at timestamptz default now()

## Funcoes de Banco Criticas

### get_account_balances(p_user_id uuid, p_as_of_date date)
O saldo e a soma direta das transacoes (amount ja contem o sinal correto):
```sql
SELECT
  a.id AS account_id,
  COALESCE(SUM(t.amount) FILTER (WHERE t.event_date <= p_as_of_date), 0) AS current_balance
FROM accounts a
LEFT JOIN transactions t ON t.account_id = a.id AND t.user_id = a.user_id
WHERE a.user_id = p_user_id AND a.is_active = true
GROUP BY a.id
ORDER BY a.created_at;
```

### create_transfer / update_transfer / delete_transfer
Transferencias sao pares de transacoes vinculadas por transfer_id:
- Origem: amount negativo (saida)
- Destino: amount positivo (entrada)
- Validar que ambas as contas pertencem ao usuario
- Validar contas diferentes
- Usar SECURITY DEFINER com search_path

## Invalidacao de Cache (React Query)
Toda mutation que altera transacoes DEVE invalidar:
- ['transactions', user.id]
- ['account-balances', user.id]
- ['uncategorized-count', user.id]

Toda mutation que altera contas DEVE invalidar:
- ['accounts', user.id]
- ['account-balances', user.id]

Usar SEMPRE user.id no queryKey para scoping correto.

## Paginas Iniciais

1. **Login/Register** - Auth flow completo
2. **Contas** - Tabs: Contas | Instituicoes
   - Summary bar horizontal (Ativos | Passivos | Liquidez)
   - Quick filters (chips compactos)
   - Grid de cards com cor da instituicao
   - Modal criar/editar conta
   - Modal criar/editar instituicao com preview de branding
   - Conciliacao por click no card
3. **Lancamentos** - Lista de transacoes com filtros
   - Modal criar/editar transacao
   - Filtros por data, conta, categoria, texto, tags
   - Bulk actions (selecao multipla + delete)
   - Modal de transferencia entre contas
4. **Categorias** - Arvore hierarquica pai/filho
   - Drag/reorder por display_order
   - Separacao visual receita vs despesa
5. **Configuracoes** - Perfil do usuario, conta padrao

## Principios de Codigo

- Hooks separados por dominio (useAccounts, useTransactions, useCategories, etc.)
- Nunca duplicar logica de calculo de saldo
- Saldo = soma de transacoes. Nenhuma tabela auxiliar de saldo.
- Formatacao de moeda: Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
- Todas as datas em formato ISO (YYYY-MM-DD) no banco
- Locale pt-BR para exibicao de datas (date-fns)
- Soft delete via is_active para entidades com historico (contas, categorias, instituicoes)
- Hard delete apenas para entidades sem dependencias
- Verificar dependencias antes de deletar (mostrar toast explicativo se houver)

Comece criando toda a estrutura de banco (migrations), auth, e a pagina de Contas com as funcionalidades completas de instituicoes e contas.
````

## Resumo das alteracoes vs versao anterior

1. **Tabela `account_initial_balances` removida** -- nao existe mais no schema
2. **FK de account_initial_balances removida** da lista de foreign keys
3. **Funcao `get_account_balances` simplificada** -- agora e apenas `SUM(t.amount)`, sem JOIN com saldo inicial
4. **Invalidacao de cache simplificada** -- removido `['account-initial-balance', user.id]`
5. **Seção "Saldo de Contas" adicionada** -- documenta explicitamente a regra: saldo = soma de transacoes, sem tabela auxiliar
6. **Modal de conta simplificado** -- sem campos de saldo inicial/data de saldo
7. **Principios de codigo** -- adicionada regra "Nenhuma tabela auxiliar de saldo"

