
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Account } from '@/hooks/useAccounts';
import { Institution } from '@/hooks/useInstitutions';
import { Wallet, Building } from 'lucide-react';
import { getBalanceColors, formatBalanceWithSign, calculateBalanceIntensities } from '@/lib/balance-colors';

interface AccountBalancesContainerProps {
  accounts: Account[];
  institutions: Institution[];
  balanceMap: Record<string, number>;
  selectedAccountId?: string;
  onSelectAccount: (accountId: string) => void;
  isLoading?: boolean;
}

export function AccountBalancesContainer({ 
  accounts, 
  institutions,
  balanceMap, 
  selectedAccountId,
  onSelectAccount, 
  isLoading 
}: AccountBalancesContainerProps) {
  const totalBalance = accounts.reduce((sum, account) => {
    return sum + (balanceMap[account.id] || 0);
  }, 0);

  // Create a map for quick institution lookup
  const institutionMap = institutions.reduce((acc, institution) => {
    acc[institution.id] = institution;
    return acc;
  }, {} as Record<string, Institution>);

  // Calcula as intensidades de cor para todos os saldos
  const intensityMap = calculateBalanceIntensities(accounts, balanceMap);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

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
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
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
          <div className="text-lg font-bold text-primary">
            Total: {formatCurrency(totalBalance)}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            Nenhuma conta cadastrada
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => {
              const balance = balanceMap[account.id] || 0;
              const isSelected = selectedAccountId === account.id;
              const institution = institutionMap[account.institution_id];
              const intensity = intensityMap[account.id] || 1;
              const balanceColors = getBalanceColors({
                balance,
                accountKind: account.kind,
                intensity: intensity as any
              });
              
              return (
                <Card
                  key={account.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] border-l-4 ${
                    isSelected 
                      ? 'ring-2 ring-primary shadow-md border-l-primary' 
                      : `hover:bg-muted/50 ${balanceColors.borderColor}`
                  } ${balanceColors.bgColor}`}
                  onClick={() => onSelectAccount(account.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="mt-1">
                          <Building className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm leading-tight truncate">
                            {account.name}
                          </h3>
                          <div className="mt-1">
                            <Badge 
                              variant="secondary" 
                              className="text-xs px-2 py-0.5"
                            >
                              {institution?.name || 'Instituição não encontrada'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <div className={`font-bold text-sm ${balanceColors.textColor}`}>
                          {formatBalanceWithSign(balance, account.kind, balanceColors.showNegativeSign)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {account.kind === 'asset' ? 'Ativo' : 'Passivo'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
