
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Account } from '@/hooks/useAccounts';
import { Institution } from '@/hooks/useInstitutions';

interface DynamicBalanceCardProps {
  selectedAccountIds: string[];
  accounts: Account[];
  institutions: Institution[];
  balanceMap: Record<string, number>;
}

export function DynamicBalanceCard({
  selectedAccountIds,
  accounts,
  institutions,
  balanceMap,
}: DynamicBalanceCardProps) {
  const selectedAccounts = accounts.filter(account => 
    selectedAccountIds.includes(account.id)
  );

  const institutionMap = institutions.reduce((acc, institution) => {
    acc[institution.id] = institution.name;
    return acc;
  }, {} as Record<string, string>);

  const totalBalance = selectedAccountIds.reduce((sum, accountId) => {
    return sum + (balanceMap[accountId] || 0);
  }, 0);

  const formatCurrency = (amount: number) => {
    return Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getCardTitle = () => {
    if (selectedAccountIds.length === 0) {
      return 'Nenhuma Conta Selecionada';
    }
    
    if (selectedAccountIds.length === 1) {
      const account = selectedAccounts[0];
      const institutionName = institutionMap[account.institution_id] || 'Instituição';
      return `${institutionName} - ${account.name}`;
    }
    
    if (selectedAccountIds.length === accounts.filter(a => a.is_active).length) {
      return 'Saldo Total';
    }
    
    return `${selectedAccountIds.length} Contas Selecionadas`;
  };

  const getIcon = () => {
    if (totalBalance > 0) {
      return <TrendingUp className="h-5 w-5 text-green-600" />;
    } else if (totalBalance < 0) {
      return <TrendingDown className="h-5 w-5 text-red-600" />;
    }
    return <Wallet className="h-5 w-5 text-muted-foreground" />;
  };

  const getBalanceColor = () => {
    if (totalBalance > 0) return 'text-green-600';
    if (totalBalance < 0) return 'text-red-600';
    return 'text-foreground';
  };

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {getCardTitle()}
        </CardTitle>
        {getIcon()}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${getBalanceColor()}`}>
          {formatCurrency(totalBalance)}
        </div>
        {selectedAccountIds.length > 1 && (
          <p className="text-xs text-muted-foreground mt-1">
            Soma de {selectedAccountIds.length} conta{selectedAccountIds.length > 1 ? 's' : ''}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
