
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Account } from '@/hooks/useAccounts';
import { Institution } from '@/hooks/useInstitutions';

interface AccountsFilterPanelProps {
  accounts: Account[];
  institutions: Institution[];
  selectedAccountIds: string[];
  onAccountSelectionChange: (accountIds: string[]) => void;
  balanceMap?: Record<string, number>;
}

export function AccountsFilterPanel({
  accounts,
  institutions,
  selectedAccountIds,
  onAccountSelectionChange,
  balanceMap = {},
}: AccountsFilterPanelProps) {
  const institutionMap = institutions.reduce((acc, institution) => {
    acc[institution.id] = institution.name;
    return acc;
  }, {} as Record<string, string>);

  const activeAccounts = accounts.filter(account => account.is_active);
  const budgetAccounts = activeAccounts.filter(account => account.type === 'on_budget');
  const creditAccounts = activeAccounts.filter(account => account.type === 'credit');

  const isAllSelected = selectedAccountIds.length === activeAccounts.length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleAllClick = () => {
    onAccountSelectionChange(activeAccounts.map(account => account.id));
  };

  const handleAccountClick = (e: React.MouseEvent, accountId: string) => {
    if (e.metaKey || e.ctrlKey) {
      // Multi-selection: toggle the account
      if (selectedAccountIds.includes(accountId)) {
        onAccountSelectionChange(selectedAccountIds.filter(id => id !== accountId));
      } else {
        onAccountSelectionChange([...selectedAccountIds, accountId]);
      }
    } else {
      // Single selection: select only this account
      onAccountSelectionChange([accountId]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  const AccountGroup = ({ title, accounts }: { title: string; accounts: Account[] }) => (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      <div className="space-y-1">
        {accounts.map((account) => {
          const isSelected = selectedAccountIds.includes(account.id);
          const balance = balanceMap[account.id] ?? 0;
          
          return (
            <button
              key={account.id}
              type="button"
              className={`flex items-center justify-between w-full rounded-lg px-3 py-2 transition-colors text-left ${
                isSelected
                  ? 'bg-accent text-accent-foreground font-medium ring-1 ring-accent'
                  : 'hover:bg-muted/50'
              }`}
              onClick={(e) => handleAccountClick(e, account.id)}
              onKeyDown={(e) => handleKeyDown(e, () => handleAccountClick(e as any, account.id))}
              role="button"
              aria-pressed={isSelected}
            >
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium truncate ${isSelected ? 'font-medium' : ''}`}>
                  {account.name}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {institutionMap[account.institution_id] || 'Instituição'}
                </div>
              </div>
              <div className="text-sm text-muted-foreground ml-2">
                {formatCurrency(balance)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          Contas
          {selectedAccountIds.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selectedAccountIds.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* All Accounts Toggle */}
        <div className="border-b pb-2">
          <button
            type="button"
            className={`flex items-center justify-between w-full rounded-lg px-3 py-2 transition-colors text-left ${
              isAllSelected
                ? 'bg-accent text-accent-foreground font-medium ring-1 ring-accent'
                : 'hover:bg-muted/50'
            }`}
            onClick={handleAllClick}
            onKeyDown={(e) => handleKeyDown(e, handleAllClick)}
            role="button"
            aria-pressed={isAllSelected}
          >
            <span className={`text-sm ${isAllSelected ? 'font-medium' : ''}`}>
              Todas as Contas
            </span>
            {isAllSelected && (
              <div className="text-sm text-muted-foreground ml-2">
                {formatCurrency(
                  activeAccounts.reduce((sum, account) => sum + (balanceMap[account.id] ?? 0), 0)
                )}
              </div>
            )}
          </button>
        </div>

        {/* Budget Accounts */}
        {budgetAccounts.length > 0 && (
          <AccountGroup title="Contas de Orçamento" accounts={budgetAccounts} />
        )}

        {/* Credit Accounts */}
        {creditAccounts.length > 0 && (
          <AccountGroup title="Cartões de Crédito" accounts={creditAccounts} />
        )}
      </CardContent>
    </Card>
  );
}
