
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Wallet, Info } from 'lucide-react';
import { Account } from '@/hooks/useAccounts';
import { Institution } from '@/hooks/useInstitutions';
import { useProvisionedTotals } from '@/hooks/useProvisionedTotals';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DynamicBalanceCardProps {
  selectedAccountIds: string[];
  accounts: Account[];
  institutions: Institution[];
  balanceMap: Record<string, number>;
  dateFilters?: {
    startDate?: string;
    endDate?: string;
  };
}

export function DynamicBalanceCard({
  selectedAccountIds,
  accounts,
  institutions,
  balanceMap,
  dateFilters,
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

  const { 
    pendingIncome, 
    pendingExpense, 
    pendingNet, 
    dateRange,
    isLoading: isLoadingProvisioned 
  } = useProvisionedTotals({ 
    selectedAccountIds, 
    dateFilters 
  });

  const balanceWithProvision = totalBalance + pendingNet;

  const formatCurrency = (amount: number) => {
    return Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDateRange = () => {
    if (!dateRange.startDate || !dateRange.endDate) return '';
    
    const start = format(new Date(dateRange.startDate), 'dd/MM', { locale: ptBR });
    const end = format(new Date(dateRange.endDate), 'dd/MM/yyyy', { locale: ptBR });
    return `${start} - ${end}`;
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

  const getBalanceColor = (amount: number) => {
    if (amount > 0) return 'text-green-600';
    if (amount < 0) return 'text-red-600';
    return 'text-foreground';
  };

  return (
    <TooltipProvider>
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {getCardTitle()}
          </CardTitle>
          {getIcon()}
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Saldo Principal */}
          <div className={`text-2xl font-bold ${getBalanceColor(totalBalance)}`}>
            {formatCurrency(totalBalance)}
          </div>
          
          {/* Saldo com Provisão */}
          <div className="flex items-center gap-2">
            {isLoadingProvisioned ? (
              <Skeleton className="h-4 w-48" />
            ) : (
              <>
                <span className="text-sm text-muted-foreground">
                  Saldo c/ provisão:
                </span>
                <span className={`text-sm font-medium ${getBalanceColor(balanceWithProvision)}`}>
                  {formatCurrency(balanceWithProvision)}
                </span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      Saldo atual considerando transações pendentes
                      {dateRange.startDate && (
                        <>
                          <br />
                          Período: {formatDateRange()}
                        </>
                      )}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </div>

          {/* Mini informações em badges */}
          {!isLoadingProvisioned && (pendingIncome > 0 || pendingExpense > 0) && (
            <div className="flex flex-wrap gap-1">
              {pendingIncome > 0 && (
                <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">
                  + Entradas: {formatCurrency(pendingIncome)}
                </Badge>
              )}
              {pendingExpense > 0 && (
                <Badge variant="outline" className="text-xs text-red-600 border-red-200 bg-red-50">
                  - Saídas: {formatCurrency(pendingExpense)}
                </Badge>
              )}
            </div>
          )}

          {/* Total Provisionado */}
          {!isLoadingProvisioned && pendingExpense > 0 && (
            <div className="text-xs text-muted-foreground">
              Total provisionado (saídas): <span className="font-medium text-red-600">{formatCurrency(pendingExpense)}</span>
            </div>
          )}

          {/* Loading states para badges */}
          {isLoadingProvisioned && (
            <div className="flex gap-1">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-20" />
            </div>
          )}

          {selectedAccountIds.length > 1 && (
            <p className="text-xs text-muted-foreground mt-1">
              Soma de {selectedAccountIds.length} conta{selectedAccountIds.length > 1 ? 's' : ''}
            </p>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
