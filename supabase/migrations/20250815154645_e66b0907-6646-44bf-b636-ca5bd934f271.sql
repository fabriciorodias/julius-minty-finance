
-- 1) Tabela central de lançamentos
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,

  -- Exatamente uma origem deve estar presente: conta OU cartão
  account_id uuid,
  credit_card_id uuid,

  category_id uuid,

  description text not null,
  amount numeric(14,2) not null,

  event_date date not null,     -- Data do Evento
  effective_date date not null, -- Data de Efetivação

  status text not null default 'pendente', -- 'pendente' | 'concluido'
  type text not null,                      -- 'receita' | 'despesa'

  -- Parcelados / recorrentes (usado como agrupador)
  installment_id uuid,
  installment_number integer,
  total_installments integer,

  created_at timestamptz not null default now(),

  -- Restrições de domínio
  constraint transactions_status_check
    check (status in ('pendente','concluido')),

  constraint transactions_type_check
    check (type in ('receita','despesa')),

  -- Exatamente UMA origem: conta XOR cartão
  constraint transactions_one_source
    check (
      (account_id is not null and credit_card_id is null)
      or
      (account_id is null and credit_card_id is not null)
    ),

  -- Consistência de parcelamento/recorrência
  constraint transactions_installments_consistency
    check (
      (installment_id is null and installment_number is null and total_installments is null)
      or
      (
        installment_id is not null
        and installment_number is not null
        and total_installments is not null
        and installment_number >= 1
        and total_installments >= 1
        and installment_number <= total_installments
      )
    )
);

-- 2) RLS
alter table public.transactions enable row level security;

-- Visualização
create policy "Users can view their own transactions"
  on public.transactions
  for select
  using (auth.uid() = user_id);

-- Inserção
create policy "Users can insert their own transactions"
  on public.transactions
  for insert
  with check (
    auth.uid() = user_id
    and (
      account_id is null
      or exists (
        select 1 from public.accounts a
        where a.id = transactions.account_id
          and a.user_id = auth.uid()
      )
    )
    and (
      credit_card_id is null
      or exists (
        select 1 from public.credit_cards cc
        where cc.id = transactions.credit_card_id
          and cc.user_id = auth.uid()
      )
    )
    and (
      category_id is null
      or exists (
        select 1 from public.categories c
        where c.id = transactions.category_id
          and c.user_id = auth.uid()
      )
    )
  );

-- Atualização
create policy "Users can update their own transactions"
  on public.transactions
  for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      account_id is null
      or exists (
        select 1 from public.accounts a
        where a.id = transactions.account_id
          and a.user_id = auth.uid()
      )
    )
    and (
      credit_card_id is null
      or exists (
        select 1 from public.credit_cards cc
        where cc.id = transactions.credit_card_id
          and cc.user_id = auth.uid()
      )
    )
    and (
      category_id is null
      or exists (
        select 1 from public.categories c
        where c.id = transactions.category_id
          and c.user_id = auth.uid()
      )
    )
  );

-- Exclusão
create policy "Users can delete their own transactions"
  on public.transactions
  for delete
  using (auth.uid() = user_id);

-- 3) Índices para acelerar filtros e listagem
create index if not exists transactions_user_event_date_idx
  on public.transactions (user_id, event_date);

create index if not exists transactions_user_effective_date_idx
  on public.transactions (user_id, effective_date);

create index if not exists transactions_user_category_idx
  on public.transactions (user_id, category_id);

create index if not exists transactions_user_account_idx
  on public.transactions (user_id, account_id);

create index if not exists transactions_user_card_idx
  on public.transactions (user_id, credit_card_id);

create index if not exists transactions_user_status_idx
  on public.transactions (user_id, status);

create index if not exists transactions_user_installment_idx
  on public.transactions (user_id, installment_id);

create index if not exists transactions_user_type_idx
  on public.transactions (user_id, type);

-- 4) Realtime (opcional, útil para futuras atualizações em tempo real)
alter table public.transactions replica identity full;
alter publication supabase_realtime add table public.transactions;
