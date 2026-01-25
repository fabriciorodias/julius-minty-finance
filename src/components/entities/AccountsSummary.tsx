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

  // Cálculos dos dados do resumo
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
  
  const liquidityPercentage = totalLiabilityBalance > 0 
    ? (totalAssetBalance / totalLiabilityBalance) * 100 
    : totalAssetBalance > 0 ? 100 : 0;

  if (isLoading) {
    return (
      <div className="space-y-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Resumo das Contas</h2>
          <p className="text-sm text-muted-foreground">Visão geral dos seus saldos e liquidez</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className="rounded-xl p-6 border border-white/10"
              style={{ backgroundColor: '#1F2937' }}
            >
              <Skeleton className="h-4 w-24 mb-4 bg-white/20" />
              <Skeleton className="h-8 w-32 bg-white/20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const summaryCards = [
    {
      label: 'Total em Ativos',
      value: formatCurrency(totalAssetBalance),
      subtext: `${assetAccounts.length} conta${assetAccounts.length !== 1 ? 's' : ''}`,
      icon: Wallet,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/20',
      tooltip: 'Soma dos saldos atuais de todas as contas de ativo ativas'
    },
    {
      label: 'Total em Passivos',
      value: formatCurrency(totalLiabilityBalance),
      subtext: `${liabilityAccounts.length} passivo${liabilityAccounts.length !== 1 ? 's' : ''}`,
      icon: TrendingDown,
      iconColor: 'text-red-400',
      iconBg: 'bg-red-500/20',
      tooltip: 'Valor total de todos os passivos (cartões, empréstimos, etc.)'
    },
    {
      label: 'Liquidez Imediata',
      value: formatCurrency(immediateLiquidity),
      subtext: `${immediateLiquidity >= 0 ? 'Saldo positivo' : 'Saldo negativo'} • ${liquidityPercentage.toFixed(0)}%`,
      icon: Zap,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/20',
      tooltip: 'Diferença entre ativos e passivos (Ativos - Passivos)',
      valueClass: immediateLiquidity < 0 ? 'text-red-400' : 'text-white'
    }
  ];

  return (
    <TooltipProvider>
      <div className="space-y-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Resumo das Contas</h2>
          <p className="text-sm text-gray-400">Visão geral dos seus saldos e liquidez</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <Tooltip key={card.label}>
                <TooltipTrigger asChild>
                  <div 
                    className="rounded-xl p-6 transition-all duration-200 hover:scale-[1.02] cursor-default border border-white/10"
                    style={{ backgroundColor: '#1F2937' }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <p className="text-sm font-medium text-white/70">{card.label}</p>
                        <p className={`text-2xl font-bold tabular-nums ${card.valueClass || 'text-white'}`}>
                          {card.value}
                        </p>
                        <p className="text-sm text-white/50">
                          {card.subtext}
                        </p>
                      </div>
                      <div className={`${card.iconBg} rounded-xl p-3`}>
                        <Icon className={`h-6 w-6 ${card.iconColor}`} />
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900 text-white border-gray-700">
                  <p className="text-xs max-w-xs">{card.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
