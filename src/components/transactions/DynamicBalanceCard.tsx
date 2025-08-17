
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Wallet, Info, CreditCard } from 'lucide-react';
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
  title?: string;
  variant?: 'budget' | 'credit' | 'consolidated';
  customIcon?: React.ReactNode;
  customTooltip?: string;
}

export function DynamicBalanceCard({
  selectedAccountIds,
  accounts,
  institutions,
  balanceMap,
  dateFilters,
  title,
  variant = 'consolidated',
  customIcon,
  customTooltip,
}: DynamicBalanceCardProps) {
  const selectedAccounts = accounts.filter(account => 
    selectedAccountIds.includes(account.id)
  );

  const institutionMap = institutions.reduce((acc, institution) => {
    acc[institution.id] = institution.name;
    return acc;
  }, {} as Record<string, string>);

  const { 
    completedBalance,
    totalBalance,
    provisionsAmount,
    pendingIncome, 
    pendingExpense, 
    dateRange,
    isLoading: isLoadingProvisioned 
  } = useProvisionedTotals({ 
    selectedAccountIds, 
    dateFilters 
  });

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
    if (title) return title;
    
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
    if (customIcon) return customIcon;
    
    if (variant === 'credit') {
      return <CreditCard className="h-5 w-5 text-purple-600" />;
    }
    
    if (completedBalance > 0) {
      return <TrendingUp className="h-5 w-5 text-green-600" />;
    } else if (completedBalance < 0) {
      return <TrendingDown className="h-5 w-5 text-red-600" />;
    }
    return <Wallet className="h-5 w-5 text-muted-foreground" />;
  };

  const getBalanceColor = (amount: number) => {
    if (variant === 'credit') {
      // Para cartão de crédito, invertemos a lógica
      if (amount < 0) return 'text-green-600'; // Menos dívida é melhor
      if (amount > 0) return 'text-red-600';   // Mais dívida é pior
      return 'text-foreground';
    }
    
    if (amount > 0) return 'text-green-600';
    if (amount < 0) return 'text-red-600';
    return 'text-foreground';
  };

  const getCardGradient = () => {
    switch (variant) {
      case 'budget':
        return 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200';
      case 'credit':
        return 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200';
      case 'consolidated':
        return 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200';
      default:
        return 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200';
    }
  };

  const getTooltipText = () => {
    if (customTooltip) return customTooltip;
    
    switch (variant) {
      case 'budget':
        return 'Saldo das contas de orçamento considerando saldos iniciais + transações concluídas';
      case 'credit':
        return 'Saldo devedor dos cartões de crédito (valores negativos indicam dívida)';
      case 'consolidated':
        return 'Saldo consolidado considerando saldos iniciais + transações concluídas';
      default:
        return 'Saldo considerando saldos iniciais + transações concluídas';
    }
  };

  return (
    <TooltipProvider>
      <Card className={`${getCardGradient()}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {getCardTitle()}
            </CardTitle>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3 w-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {getTooltipText()}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          {getIcon()}
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Saldo Principal */}
          {isLoadingProvisioned ? (
            <Skeleton className="h-8 w-40" />
          ) : (
            <div className={`text-2xl font-bold ${getBalanceColor(completedBalance)}`}>
              {formatCurrency(completedBalance)}
            </div>
          )}
          
          {/* Saldo com Provisão */}
          <div className="flex items-center gap-2">
            {isLoadingProvisioned ? (
              <Skeleton className="h-4 w-48" />
            ) : (
              <>
                <span className="text-sm text-muted-foreground">
                  Saldo c/ provisão:
                </span>
                <span className={`text-sm font-medium ${getBalanceColor(totalBalance)}`}>
                  {formatCurrency(totalBalance)}
                </span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      Saldo total + impacto das transações pendentes
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

          {/* Provisões */}
          {!isLoadingProvisioned && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Provisões:
              </span>
              <span className={`text-sm font-medium ${getBalanceColor(provisionsAmount)}`}>
                {formatCurrency(provisionsAmount)}
              </span>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    Soma líquida das transações pendentes
                    <br />
                    (Receitas pendentes - Despesas pendentes)
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Mini informações em badges */}
          {!isLoadingProvisioned && (pendingIncome > 0 || pendingExpense > 0) && (
            <div className="flex flex-wrap gap-1">
              {pendingIncome > 0 && (
                <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">
                  + Entradas pendentes: {formatCurrency(pendingIncome)}
                </Badge>
              )}
              {pendingExpense > 0 && (
                <Badge variant="outline" className="text-xs text-red-600 border-red-200 bg-red-50">
                  - Saídas pendentes: {formatCurrency(pendingExpense)}
                </Badge>
              )}
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
