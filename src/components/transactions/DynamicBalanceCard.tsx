
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Wallet, Info, CreditCard } from 'lucide-react';
import { Account } from '@/hooks/useAccounts';
import { Institution } from '@/hooks/useInstitutions';
import { useProvisionedTotals } from '@/hooks/useProvisionedTotals';
import { format, parseISO } from 'date-fns';
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
    
    const start = format(parseISO(dateRange.startDate), 'dd/MM', { locale: ptBR });
    const end = format(parseISO(dateRange.endDate), 'dd/MM/yyyy', { locale: ptBR });
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
    if (amount > 0) return 'text-green-600';
    if (amount < 0) return 'text-red-600';
    return 'text-foreground';
  };

  const getCardGradient = () => {
    switch (variant) {
      case 'budget':
        return 'bg-gradient-to-br from-blue-50 via-blue-50/50 to-indigo-50/80 border-blue-200/60 shadow-sm ring-1 ring-blue-100/50';
      case 'credit':
        return 'bg-gradient-to-br from-purple-50 via-purple-50/50 to-pink-50/80 border-purple-200/60 shadow-sm ring-1 ring-purple-100/50';
      case 'consolidated':
        return 'bg-gradient-to-br from-green-50 via-green-50/50 to-emerald-50/80 border-green-200/60 shadow-sm ring-1 ring-green-100/50';
      default:
        return 'bg-gradient-to-br from-blue-50 via-blue-50/50 to-indigo-50/80 border-blue-200/60 shadow-sm ring-1 ring-blue-100/50';
    }
  };

  const getTooltipText = () => {
    if (customTooltip) return customTooltip;
    
    switch (variant) {
      case 'budget':
        return 'Soma dos saldos das contas de ativos (saldos iniciais + transações concluídas)';
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
      <Card className={`${getCardGradient()} transition-all duration-200 hover:shadow-md focus-within:ring-2 focus-within:ring-primary/20`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <CardTitle className="text-sm font-medium text-muted-foreground/90 truncate">
              {getCardTitle()}
            </CardTitle>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3 w-3 text-muted-foreground/60 hover:text-muted-foreground transition-colors flex-shrink-0" />
              </TooltipTrigger>
              <TooltipContent className="z-50 bg-popover max-w-xs">
                <p className="text-xs">{getCardTitle()}</p>
                <p className="text-xs mt-1">{getTooltipText()}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="opacity-80 flex-shrink-0">
            {getIcon()}
          </div>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4">
          {/* Saldo Principal */}
          {isLoadingProvisioned ? (
            <Skeleton className="h-8 w-40" />
          ) : (
            <div className={`text-2xl font-bold tracking-tight truncate ${getBalanceColor(completedBalance)}`}>
              {formatCurrency(completedBalance)}
            </div>
          )}
          
          {/* Saldo Projetado */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            {isLoadingProvisioned ? (
              <Skeleton className="h-4 w-48" />
            ) : (
              <>
                <span className="text-muted-foreground/80">
                  Saldo Projetado:
                </span>
                <span className={`font-medium ${getBalanceColor(totalBalance)}`}>
                  {formatCurrency(totalBalance)}
                </span>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent className="z-50 bg-popover">
                    <p className="text-xs max-w-xs">
                      Saldo em conta + impacto das transações pendentes
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

          {/* Subtotalizadores: Débitos a ocorrer e Créditos previstos */}
          {!isLoadingProvisioned && (pendingExpense > 0 || pendingIncome > 0) && (
            <div className="space-y-2">
              {pendingExpense > 0 && (
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="text-muted-foreground/80">
                    Débitos a ocorrer:
                  </span>
                  <span className="font-medium text-red-600">
                    {formatCurrency(pendingExpense)}
                  </span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent className="z-50 bg-popover">
                      <p className="text-xs max-w-xs">
                        Total de despesas pendentes no período
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
              
              {pendingIncome > 0 && (
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="text-muted-foreground/80">
                    Créditos previstos:
                  </span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(pendingIncome)}
                  </span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent className="z-50 bg-popover">
                      <p className="text-xs max-w-xs">
                        Total de receitas pendentes no período
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>
          )}

          {/* Mini informações em badges - mantidas para compatibilidade visual */}
          {!isLoadingProvisioned && (pendingIncome > 0 || pendingExpense > 0) && (
            <div className="flex flex-wrap gap-2 max-w-full">
              {pendingIncome > 0 && (
                <Badge 
                  variant="outline" 
                  className="text-xs text-green-700 border-green-300/60 bg-green-50/80 hover:bg-green-100/80 transition-colors"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {formatCurrency(pendingIncome)}
                </Badge>
              )}
              {pendingExpense > 0 && (
                <Badge 
                  variant="outline" 
                  className="text-xs text-red-700 border-red-300/60 bg-red-50/80 hover:bg-red-100/80 transition-colors"
                >
                  <TrendingDown className="h-3 w-3 mr-1" />
                  {formatCurrency(pendingExpense)}
                </Badge>
              )}
            </div>
          )}

          {/* Loading states para badges */}
          {isLoadingProvisioned && (
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
          )}

          {selectedAccountIds.length > 1 && (
            <p className="text-xs text-muted-foreground/70 mt-2 pt-2 border-t border-border/50">
              Soma de {selectedAccountIds.length} conta{selectedAccountIds.length > 1 ? 's' : ''}
            </p>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
