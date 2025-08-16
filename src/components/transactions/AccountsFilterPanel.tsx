
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Account } from '@/hooks/useAccounts';
import { Institution } from '@/hooks/useInstitutions';

interface AccountsFilterPanelProps {
  accounts: Account[];
  institutions: Institution[];
  selectedAccountIds: string[];
  onAccountSelectionChange: (accountIds: string[]) => void;
}

export function AccountsFilterPanel({
  accounts,
  institutions,
  selectedAccountIds,
  onAccountSelectionChange,
}: AccountsFilterPanelProps) {
  const institutionMap = institutions.reduce((acc, institution) => {
    acc[institution.id] = institution.name;
    return acc;
  }, {} as Record<string, string>);

  const activeAccounts = accounts.filter(account => account.is_active);
  const budgetAccounts = activeAccounts.filter(account => account.type === 'on_budget');
  const creditAccounts = activeAccounts.filter(account => account.type === 'credit');

  const isAllSelected = selectedAccountIds.length === activeAccounts.length;
  const isPartiallySelected = selectedAccountIds.length > 0 && selectedAccountIds.length < activeAccounts.length;

  const handleAllAccountsToggle = (checked: boolean) => {
    if (checked) {
      onAccountSelectionChange(activeAccounts.map(account => account.id));
    } else {
      onAccountSelectionChange([]);
    }
  };

  const handleAccountToggle = (accountId: string, checked: boolean) => {
    if (checked) {
      onAccountSelectionChange([...selectedAccountIds, accountId]);
    } else {
      onAccountSelectionChange(selectedAccountIds.filter(id => id !== accountId));
    }
  };

  const AccountGroup = ({ title, accounts }: { title: string; accounts: Account[] }) => (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      <div className="space-y-1">
        {accounts.map((account) => (
          <div key={account.id} className="flex items-center space-x-3 py-1">
            <Checkbox
              checked={selectedAccountIds.includes(account.id)}
              onCheckedChange={(checked) => handleAccountToggle(account.id, checked as boolean)}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{account.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {institutionMap[account.institution_id] || 'Instituição'}
              </div>
            </div>
          </div>
        ))}
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
        <div className="flex items-center space-x-3 py-2 border-b">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={handleAllAccountsToggle}
            className={isPartiallySelected ? "data-[state=checked]:bg-primary/50" : ""}
          />
          <span className="text-sm font-medium">Todas as Contas</span>
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
