
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Account } from '@/hooks/useAccounts';
import { Wallet, Building } from 'lucide-react';

interface AccountBalancesContainerProps {
  accounts: Account[];
  balanceMap: Record<string, number>;
  selectedAccountId?: string;
  onSelectAccount: (accountId: string) => void;
  isLoading?: boolean;
}

export function AccountBalancesContainer({ 
  accounts, 
  balanceMap, 
  selectedAccountId,
  onSelectAccount, 
  isLoading 
}: AccountBalancesContainerProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const totalBalance = accounts.reduce((sum, account) => {
    return sum + (balanceMap[account.id] || 0);
  }, 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Saldos das Contas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Saldos das Contas
          </div>
          <div className="text-lg font-bold">
            Total: {formatCurrency(totalBalance)}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhuma conta cadastrada
          </p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => {
              const balance = balanceMap[account.id] || 0;
              const isSelected = selectedAccountId === account.id;
              
              return (
                <Button
                  key={account.id}
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => onSelectAccount(account.id)}
                  className="h-auto p-4 justify-between"
                >
                  <div className="flex items-center gap-2 flex-1 text-left">
                    <Building className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{account.name}</div>
                      <div className="text-sm opacity-70">
                        {account.institution_id}
                      </div>
                    </div>
                  </div>
                  <div className={`font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(balance)}
                  </div>
                </Button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
