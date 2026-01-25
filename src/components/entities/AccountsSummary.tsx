import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  TrendingDown, 
  Wallet, 
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

  const assetAccounts = accounts.filter(acc => acc.kind === 'asset' && acc.is_active);
  const liabilityAccounts = accounts.filter(acc => acc.kind === 'liability' && acc.is_active);

  const totalAssetBalance = assetAccounts.reduce((total, account) => {
    return total + getAccountBalance(account.id);
  }, 0);

  const totalLiabilityBalance = liabilityAccounts.reduce((total, account) => {
    const balance = getAccountBalance(account.id);
    return total + Math.abs(balance);
  }, 0);

  const immediateLiquidity = totalAssetBalance - totalLiabilityBalance;

  if (isLoading) {
    return (
      <div 
        className="flex items-center gap-6 p-3 rounded-lg border border-white/10"
        style={{ backgroundColor: '#1F2937' }}
      >
        <Skeleton className="h-6 w-32 bg-white/20" />
        <Skeleton className="h-6 w-32 bg-white/20" />
        <Skeleton className="h-6 w-32 bg-white/20" />
      </div>
    );
  }

  const metrics = [
    {
      label: 'Ativos',
      value: formatCurrency(totalAssetBalance),
      count: assetAccounts.length,
      icon: Wallet,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/20',
      tooltip: 'Soma dos saldos de todas as contas de ativo ativas'
    },
    {
      label: 'Passivos',
      value: formatCurrency(totalLiabilityBalance),
      count: liabilityAccounts.length,
      icon: TrendingDown,
      iconColor: 'text-red-400',
      iconBg: 'bg-red-500/20',
      tooltip: 'Valor total de todos os passivos'
    },
    {
      label: 'Liquidez',
      value: formatCurrency(immediateLiquidity),
      icon: Zap,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/20',
      tooltip: 'Ativos - Passivos',
      valueClass: immediateLiquidity < 0 ? 'text-red-400' : 'text-emerald-400'
    }
  ];

  return (
    <TooltipProvider>
      <div 
        className="flex flex-wrap items-center gap-4 lg:gap-6 p-3 rounded-lg border border-white/10"
        style={{ backgroundColor: '#1F2937' }}
      >
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="flex items-center gap-4">
              {index > 0 && (
                <div className="hidden sm:block h-8 w-px bg-white/20" />
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2.5 cursor-default">
                    <div className={`${metric.iconBg} rounded-lg p-1.5`}>
                      <Icon className={`h-4 w-4 ${metric.iconColor}`} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase tracking-wide text-white/50 font-medium">
                        {metric.label}
                        {metric.count !== undefined && (
                          <span className="ml-1 text-white/40">({metric.count})</span>
                        )}
                      </span>
                      <span className={`text-base font-bold tabular-nums ${metric.valueClass || 'text-white'}`}>
                        {metric.value}
                      </span>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900 text-white border-gray-700">
                  <p className="text-xs">{metric.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
