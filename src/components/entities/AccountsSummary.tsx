import { MetricCard } from '@/components/ui/metric-card';
import { OriginBadge } from '@/components/ui/origin-badge';
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
      <div className="space-y-4 mb-6 animate-fade-in">
        <div>
          <h2 className="text-xl font-semibold mb-2">Resumo das Contas</h2>
          <p className="text-muted-foreground text-sm">Visão geral dos seus saldos e liquidez</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="liquid-glass-subtle rounded-2xl p-6 animate-pulse">
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-8 w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const liquidityVariant = 
    liquidityPercentage >= 150 ? 'success' :
    liquidityPercentage >= 100 ? 'info' :
    liquidityPercentage >= 50 ? 'warning' : 'danger';

  return (
    <TooltipProvider>
      <div className="space-y-4 mb-6 animate-fade-in">
        <div>
          <h2 className="text-xl font-semibold mb-2">Resumo das Contas</h2>
          <p className="text-muted-foreground text-sm">Visão geral dos seus saldos e liquidez</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Total em Ativos */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <MetricCard
                  label="Total em Ativos"
                  value={formatCurrency(totalAssetBalance)}
                  description={`${assetAccounts.length} conta${assetAccounts.length !== 1 ? 's' : ''}`}
                  icon={Wallet}
                  glass
                  className="hover-scale liquid-glass-success"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-xs">
                Soma dos saldos atuais de todas as contas de ativo ativas
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Total em Passivos */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <MetricCard
                  label="Total em Passivos"
                  value={formatCurrency(totalLiabilityBalance)}
                  description={`${liabilityAccounts.length} passivo${liabilityAccounts.length !== 1 ? 's' : ''}`}
                  icon={TrendingDown}
                  glass
                  className="hover-scale liquid-glass-danger"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-xs">
                Valor total de todos os passivos (cartões, empréstimos, etc.)
              </p>
            </TooltipContent>
          </Tooltip>

          {/* Liquidez Imediata */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <MetricCard
                  label="Liquidez Imediata"
                  value={formatCurrency(immediateLiquidity)}
                  description={`${immediateLiquidity >= 0 ? 'Saldo positivo' : 'Saldo negativo'} • ${liquidityPercentage.toFixed(0)}%`}
                  icon={Zap}
                  glass
                  className={`hover-scale ${immediateLiquidity >= 0 ? 'liquid-glass-success' : 'liquid-glass-warning'}`}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-xs">
                Diferença entre ativos e passivos (Ativos - Passivos)
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
