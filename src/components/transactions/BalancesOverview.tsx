
import React from 'react';
import { DynamicBalanceCard } from './DynamicBalanceCard';
import { Account } from '@/hooks/useAccounts';
import { Institution } from '@/hooks/useInstitutions';
import { Wallet, CreditCard, TrendingUp } from 'lucide-react';

interface BalancesOverviewProps {
  selectedAccountIds: string[];
  accounts: Account[];
  institutions: Institution[];
  balanceMap: Record<string, number>;
  dateFilters?: {
    startDate?: string;
    endDate?: string;
  };
}

export function BalancesOverview({
  selectedAccountIds,
  accounts,
  institutions,
  balanceMap,
  dateFilters,
}: BalancesOverviewProps) {
  // Filtrar contas selecionadas por tipo
  const selectedAccounts = accounts.filter(account => 
    selectedAccountIds.includes(account.id)
  );
  
  const budgetAccountIds = selectedAccounts
    .filter(account => account.type === 'on_budget')
    .map(account => account.id);
  
  const creditAccountIds = selectedAccounts
    .filter(account => account.type === 'credit')
    .map(account => account.id);

  const hasBudgetAccounts = budgetAccountIds.length > 0;
  const hasCreditAccounts = creditAccountIds.length > 0;
  const hasSelectedAccounts = selectedAccountIds.length > 0;

  // Se não há contas selecionadas, mostra apenas o card consolidado
  if (!hasSelectedAccounts) {
    return (
      <DynamicBalanceCard
        selectedAccountIds={[]}
        accounts={accounts}
        institutions={institutions}
        balanceMap={balanceMap}
        dateFilters={dateFilters}
        title="Nenhuma Conta Selecionada"
        variant="consolidated"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Card de Contas de Orçamento */}
      {hasBudgetAccounts && (
        <DynamicBalanceCard
          selectedAccountIds={budgetAccountIds}
          accounts={accounts}
          institutions={institutions}
          balanceMap={balanceMap}
          dateFilters={dateFilters}
          title="Saldo em Conta"
          variant="budget"
          customIcon={<Wallet className="h-5 w-5 text-blue-600" />}
          customTooltip="Saldo das contas de orçamento (conta corrente, poupança, etc.)"
        />
      )}

      {/* Card de Cartões de Crédito */}
      {hasCreditAccounts && (
        <DynamicBalanceCard
          selectedAccountIds={creditAccountIds}
          accounts={accounts}
          institutions={institutions}
          balanceMap={balanceMap}
          dateFilters={dateFilters}
          title="Saldo Devedor"
          variant="credit"
          customIcon={<CreditCard className="h-5 w-5 text-purple-600" />}
          customTooltip="Saldo devedor dos cartões de crédito (valores negativos indicam dívida)"
        />
      )}

      {/* Card Consolidado - só aparece se há ambos os tipos ou se só há um tipo mas queremos mostrar o total */}
      {(hasBudgetAccounts && hasCreditAccounts) || (selectedAccountIds.length > (budgetAccountIds.length + creditAccountIds.length)) ? (
        <DynamicBalanceCard
          selectedAccountIds={selectedAccountIds}
          accounts={accounts}
          institutions={institutions}
          balanceMap={balanceMap}
          dateFilters={dateFilters}
          title="Consolidado"
          variant="consolidated"
          customIcon={<TrendingUp className="h-5 w-5 text-green-600" />}
          customTooltip="Saldo consolidado de todas as contas selecionadas"
        />
      ) : null}

      {/* Se só há um tipo de conta, o card único já mostra tudo, então não precisamos do consolidado */}
      {/* Mas se há contas de tipos não reconhecidos, mostramos o consolidado */}
      {!hasBudgetAccounts && !hasCreditAccounts && hasSelectedAccounts && (
        <DynamicBalanceCard
          selectedAccountIds={selectedAccountIds}
          accounts={accounts}
          institutions={institutions}
          balanceMap={balanceMap}
          dateFilters={dateFilters}
          title="Saldo Total"
          variant="consolidated"
        />
      )}
    </div>
  );
}
