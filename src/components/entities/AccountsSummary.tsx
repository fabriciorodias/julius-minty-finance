
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Info,
  Zap
} from 'lucide-react';
import { Account } from '@/hooks/useAccounts';
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
  const assetAccounts = accounts.filter(acc => acc.kind === 'asset' && acc.is_active);
  const liabilityAccounts = accounts.filter(acc => acc.kind === 'liability' && acc.is_active);

  const totalAssetBalance = assetAccounts.reduce((total, account) => {
    return total + getAccountBalance(account.id);
  }, 0);

  const totalLiabilityBalance = liabilityAccounts.reduce((total, account) => {
    const balance = getAccountBalance(account.id);
    // Como os saldos de passivos são negativos, usamos Math.abs para mostrar valor positivo
    return total + Math.abs(balance);
  }, 0);

  // Liquidez imediata = Total de Ativos - Total de Passivos
  const immediateLiquidity = totalAssetBalance - totalLiabilityBalance;
  
  // Percentual de liquidez (Ativos / Passivos * 100)
  const liquidityPercentage = totalLiabilityBalance > 0 
    ? (totalAssetBalance / totalLiabilityBalance) * 100 
    : totalAssetBalance > 0 ? 100 : 0;

  if (isLoading) {
    return (
      <div className="space-y-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Resumo das Contas</h2>
          <p className="text-muted-foreground text-sm">Visão geral dos seus saldos e liquidez</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
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
          <p className="text-muted-foreground text-sm">Visão geral dos seus saldos e liquidez</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
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
                {assetAccounts.length} conta{assetAccounts.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          {/* Total em Passivos */}
          <Card className="bg-gradient-to-br from-red-50 via-red-50/50 to-pink-50/80 border-red-200/60 shadow-sm ring-1 ring-red-100/50 hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium text-muted-foreground/90">
                  Total em Passivos
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent className="z-50 bg-popover">
                    <p className="text-xs max-w-xs">
                      Valor total de todos os passivos (cartões, empréstimos, etc.)
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <TrendingDown className="h-5 w-5 text-red-600 opacity-80" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight text-red-600">
                {formatCurrency(totalLiabilityBalance)}
              </div>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {liabilityAccounts.length} passivo{liabilityAccounts.length !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          {/* Liquidez Imediata */}
          <Card className={`shadow-sm ring-1 hover:shadow-md transition-all duration-200 ${
            immediateLiquidity >= 0 
              ? 'bg-gradient-to-br from-green-50 via-green-50/50 to-emerald-50/80 border-green-200/60 ring-green-100/50'
              : 'bg-gradient-to-br from-amber-50 via-amber-50/50 to-orange-50/80 border-amber-200/60 ring-amber-100/50'
          }`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium text-muted-foreground/90">
                  Liquidez Imediata
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3 w-3 text-muted-foreground/60 hover:text-muted-foreground transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent className="z-50 bg-popover">
                    <p className="text-xs max-w-xs">
                      Diferença entre ativos e passivos (Ativos - Passivos)
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Zap className={`h-5 w-5 opacity-80 ${
                immediateLiquidity >= 0 ? 'text-green-600' : 'text-amber-600'
              }`} />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold tracking-tight ${
                  immediateLiquidity >= 0 ? 'text-green-600' : 'text-amber-600'
                }`}>
                  {formatCurrency(immediateLiquidity)}
                </span>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    liquidityPercentage >= 150 ? 'border-green-300/60 bg-green-50/80 text-green-700' :
                    liquidityPercentage >= 100 ? 'border-blue-300/60 bg-blue-50/80 text-blue-700' :
                    liquidityPercentage >= 50 ? 'border-amber-300/60 bg-amber-50/80 text-amber-700' :
                    'border-red-300/60 bg-red-50/80 text-red-700'
                  }`}
                >
                  {liquidityPercentage.toFixed(0)}%
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {immediateLiquidity >= 0 ? 'Saldo positivo' : 'Saldo negativo'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}
