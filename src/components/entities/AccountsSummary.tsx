
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Wallet, 
  Info,
  DollarSign,
  Target
} from 'lucide-react';
import { Account, isCreditCard, isBudgetAccount } from '@/hooks/useAccounts';
import { AccountBalance } from '@/hooks/useAccountBalances';

interface AccountsSummaryProps {
  accounts: Account[];
  accountBalances: AccountBalance[];
  isLoading?: boolean;
}

export function AccountsSummary({ accounts, accountBalances, isLoading }: AccountsSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getAccountBalance = (accountId: string) => {
    const balance = accountBalances.find(bal => bal.account_id === accountId);
    return balance?.current_balance || 0;
  };

  // Cálculos dos dados do resumo
  const budgetAccounts = accounts.filter(isBudgetAccount).filter(acc => acc.is_active);
  const creditAccounts = accounts.filter(isCreditCard).filter(acc => acc.is_active);

  const totalAssetBalance = budgetAccounts.reduce((total, account) => {
    return total + getAccountBalance(account.id);
  }, 0);

  const totalCreditUtilized = creditAccounts.reduce((total, account) => {
    const balance = Math.abs(getAccountBalance(account.id));
    return total + balance;
  }, 0);

  const totalCreditLimit = creditAccounts.reduce((total, account) => {
    return total + (account.credit_limit || 0);
  }, 0);

  const totalAvailableCredit = totalCreditLimit - totalCreditUtilized;

  const creditUtilizationPercentage = totalCreditLimit > 0 
    ? (totalCreditUtilized / totalCreditLimit) * 100 
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Resumo das Contas</h2>
          <p className="text-muted-foreground text-sm">Visão geral dos seus saldos e limites</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Resumo das Contas</h2>
          <p className="text-muted-foreground text-sm">Visão geral dos seus saldos e limites</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {/* Total em Ativos */}
          <Card className="bg-gradient-to-br from-blue-50 via-blue-50/50 to-indigo-50/80 border-blue-200/60 shadow-sm ring-1 ring-blue-100/50 hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium text-muted-foreground/90">
                  Total em Ativos
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent className="z-50 bg-popover">
                    <p className="text-xs max-w-xs">
                      Soma dos saldos atuais de todas as contas de ativo ativas
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Wallet className="h-5 w-5 text-blue-600 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold tracking-tight ${totalAssetBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(totalAssetBalance)}
              </div>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {budgetAccounts.length} conta{budgetAccounts.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          {/* Total Utilizado (Passivos) */}
          <Card className="bg-gradient-to-br from-purple-50 via-purple-50/50 to-pink-50/80 border-purple-200/60 shadow-sm ring-1 ring-purple-100/50 hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium text-muted-foreground/90">
                  Total Utilizado
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent className="z-50 bg-popover">
                    <p className="text-xs max-w-xs">
                      Valor total utilizado em cartões de crédito e outros passivos
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <TrendingDown className="h-5 w-5 text-purple-600 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-purple-600">
                {formatCurrency(totalCreditUtilized)}
              </div>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {creditAccounts.length} cartão{creditAccounts.length !== 1 ? 'ões' : ''}
              </p>
            </CardContent>
          </Card>

          {/* Limite Total */}
          <Card className="bg-gradient-to-br from-amber-50 via-amber-50/50 to-orange-50/80 border-amber-200/60 shadow-sm ring-1 ring-amber-100/50 hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium text-muted-foreground/90">
                  Limite Total
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent className="z-50 bg-popover">
                    <p className="text-xs max-w-xs">
                      Soma de todos os limites de cartões de crédito
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <DollarSign className="h-5 w-5 text-amber-600 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-amber-600">
                {formatCurrency(totalCreditLimit)}
              </div>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Limite disponível
              </p>
            </CardContent>
          </Card>

          {/* Crédito Disponível */}
          <Card className="bg-gradient-to-br from-green-50 via-green-50/50 to-emerald-50/80 border-green-200/60 shadow-sm ring-1 ring-green-100/50 hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium text-muted-foreground/90">
                  Crédito Disponível
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent className="z-50 bg-popover">
                    <p className="text-xs max-w-xs">
                      Limite total menos o valor já utilizado nos cartões
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <TrendingUp className="h-5 w-5 text-green-600 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-green-600">
                {formatCurrency(totalAvailableCredit)}
              </div>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Ainda disponível
              </p>
            </CardContent>
          </Card>

          {/* Utilização % */}
          <Card className="bg-gradient-to-br from-slate-50 via-slate-50/50 to-gray-50/80 border-slate-200/60 shadow-sm ring-1 ring-slate-100/50 hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium text-muted-foreground/90">
                  Utilização
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent className="z-50 bg-popover">
                    <p className="text-xs max-w-xs">
                      Percentual do limite total que está sendo utilizado
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Target className="h-5 w-5 text-slate-600 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold tracking-tight ${
                  creditUtilizationPercentage > 80 ? 'text-red-600' : 
                  creditUtilizationPercentage > 50 ? 'text-amber-600' : 
                  'text-green-600'
                }`}>
                  {creditUtilizationPercentage.toFixed(1)}%
                </span>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    creditUtilizationPercentage > 80 ? 'border-red-300/60 bg-red-50/80 text-red-700' : 
                    creditUtilizationPercentage > 50 ? 'border-amber-300/60 bg-amber-50/80 text-amber-700' : 
                    'border-green-300/60 bg-green-50/80 text-green-700'
                  }`}
                >
                  {creditUtilizationPercentage > 80 ? 'Alto' : 
                   creditUtilizationPercentage > 50 ? 'Médio' : 
                   'Baixo'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground/70 mt-1">
                do limite total
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}
