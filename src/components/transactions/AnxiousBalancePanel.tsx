
import React from 'react';
import { NotionCard, NotionCardContent } from '@/components/ui/notion-card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useProvisionedTotals } from '@/hooks/useProvisionedTotals';
import { useCashFlowProjection } from '@/hooks/useCashFlowProjection';
import { useAccounts } from '@/hooks/useAccounts';
import { useInstitutions } from '@/hooks/useInstitutions';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { safeCurrencyFormatter, safeFormatDate, safeFormatDateLong } from '@/lib/date-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { BalanceCardSkeleton } from '@/components/ui/enhanced-skeleton';
import { TrendingUp, TrendingDown, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface AnxiousBalancePanelProps {
  selectedAccountIds: string[];
  dateFilters?: {
    startDate?: string;
    endDate?: string;
  };
}

export function AnxiousBalancePanel({ selectedAccountIds, dateFilters }: AnxiousBalancePanelProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { accounts } = useAccounts();
  const { institutions } = useInstitutions();

  // Set up real-time subscriptions to invalidate cache when data changes
  React.useEffect(() => {
    if (!user?.id) return;

    console.log('🔄 Setting up realtime subscriptions for balance chart');

    const transactionsChannel = supabase
      .channel('balance-chart-transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        (payload) => {
          console.log('💰 Transaction changed, invalidating balance chart queries:', payload);
          queryClient.invalidateQueries({ queryKey: ['provisioned-totals', user.id] });
          queryClient.invalidateQueries({ queryKey: ['cash-flow-projection', user.id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'account_initial_balances'
        },
        (payload) => {
          console.log('🏦 Initial balance changed, invalidating balance chart queries:', payload);
          queryClient.invalidateQueries({ queryKey: ['provisioned-totals', user.id] });
          queryClient.invalidateQueries({ queryKey: ['cash-flow-projection', user.id] });
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up realtime subscriptions for balance chart');
      supabase.removeChannel(transactionsChannel);
    };
  }, [user?.id, queryClient]);

  // Get current balance (only completed transactions)
  const { completedBalance, totalBalance, isLoading: totalsLoading } = useProvisionedTotals({
    selectedAccountIds,
    dateFilters
  });

  // Get cash flow projection for the chart
  const { dataPoints, isLoading: projectionLoading } = useCashFlowProjection({
    selectedAccountIds,
    dateFilters,
    sampleSize: 100 // Limit points for performance
  });

  const isLoading = totalsLoading || projectionLoading;

  // Filter to only asset accounts for "today's balance"
  const assetAccounts = accounts.filter(account => 
    selectedAccountIds.includes(account.id) && account.kind === 'asset'
  );

  // Calculate today's balance for asset accounts only
  const todaysAssetBalance = React.useMemo(() => {
    if (!dataPoints.length || !assetAccounts.length) return 0;
    
    const firstDataPoint = dataPoints[0];
    let assetTotal = 0;
    
    assetAccounts.forEach(account => {
      const accountBalance = firstDataPoint[account.id] as number || 0;
      assetTotal += accountBalance;
    });
    
    return assetTotal;
  }, [dataPoints, assetAccounts]);

  // Get final projected balance
  const finalProjectedBalance = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].total : 0;

  // Determine trend
  const balanceChange = finalProjectedBalance - todaysAssetBalance;
  const isPositiveTrend = balanceChange >= 0;

  // Chart configuration
  const chartConfig = {
    total: {
      label: "Saldo Projetado",
      color: "hsl(var(--primary))",
    },
  };

  // Format data for chart
  const chartData = dataPoints.map((point, index) => {
    const previousPoint = index > 0 ? dataPoints[index - 1] : null;
    const dailyVariation = previousPoint ? point.total - previousPoint.total : 0;
    
    return {
      date: point.date,
      total: point.total,
      formattedDate: safeFormatDate(point.date, 'dd/MM'),
      fullDate: safeFormatDateLong(point.date, 'PPPP'),
      dailyVariation
    };
  });

  if (isLoading) {
    return (
      <NotionCard variant="muted" className="transition-notion">
        <NotionCardContent>
          <BalanceCardSkeleton />
        </NotionCardContent>
      </NotionCard>
    );
  }

  return (
    <NotionCard variant="hoverable" className="transition-notion">
      <NotionCardContent>
        <div className="space-y-6">
          {/* Balance Display */}
          <div className="flex items-start justify-between">
            {/* Today's Balance */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-notion-gray-600">
                <Calendar className="h-4 w-4" />
                <span className="text-notion-caption font-medium">Saldo Atual</span>
              </div>
              <div className="space-y-1">
                <div className="text-notion-value tabular-nums text-notion-gray-900">
                  R$ {safeCurrencyFormatter(todaysAssetBalance)}
                </div>
                <p className="text-notion-caption text-notion-gray-500">
                  Baseado em transações efetivadas
                </p>
              </div>
            </div>

            {/* Projected Balance */}
            <div className="space-y-2 text-right">
              <div className="flex items-center gap-2 text-notion-gray-600 justify-end">
                {isPositiveTrend ? (
                  <TrendingUp className="h-4 w-4 text-notion-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-notion-danger" />
                )}
                <span className="text-notion-caption font-medium">Saldo Projetado</span>
              </div>
              <div className="space-y-1">
                <div className={`text-notion-value tabular-nums ${
                  finalProjectedBalance >= 0 ? 'text-notion-gray-900' : 'text-notion-danger'
                }`}>
                  R$ {safeCurrencyFormatter(finalProjectedBalance)}
                </div>
                <p className="text-notion-caption text-notion-gray-500">
                  {dateFilters?.endDate ? `até ${safeFormatDate(dateFilters.endDate)}` : 'Fim do período'}
                </p>
              </div>
            </div>
          </div>

          {/* Balance Change Indicator */}
          <div className="flex items-center justify-center">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-notion-caption font-medium border transition-notion ${
              isPositiveTrend 
                ? 'bg-notion-success-light text-notion-success border-notion-success-border' 
                : 'bg-notion-danger-light text-notion-danger border-notion-danger-border'
            }`}>
              {isPositiveTrend ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>
                {isPositiveTrend ? '+' : ''}R$ {safeCurrencyFormatter(Math.abs(balanceChange))}
              </span>
            </div>
          </div>

          {/* Timeline Chart */}
          {chartData.length > 0 && (
            <div className="h-20 w-full">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  >
                    <XAxis 
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={false}
                    />
                    <YAxis hide />
                    <ChartTooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        
                        const data = payload[0].payload;
                        const balance = data.total as number;
                        const variation = data.dailyVariation as number;
                        const isPositiveVariation = variation >= 0;
                        
                        return (
                          <div className="bg-background border border-border rounded-lg shadow-lg p-4 min-w-[240px]">
                            <div className="space-y-3">
                              {/* Date */}
                              <div className="text-center">
                                <p className="text-sm font-medium text-foreground">
                                  {data.fullDate}
                                </p>
                              </div>
                              
                              {/* Balance */}
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground mb-1">Saldo Projetado</p>
                                <p className={`text-lg font-bold ${
                                  balance >= 0 ? 'text-foreground' : 'text-destructive'
                                }`}>
                                  R$ {safeCurrencyFormatter(balance)}
                                </p>
                              </div>
                              
                              {/* Daily Variation */}
                              {Math.abs(variation) > 0.01 && (
                                <div className="flex items-center justify-center gap-2 pt-2 border-t border-border">
                                  <div className={`flex items-center gap-1 text-xs font-medium ${
                                    isPositiveVariation ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {isPositiveVariation ? (
                                      <ArrowUpRight className="h-3 w-3" />
                                    ) : (
                                      <ArrowDownRight className="h-3 w-3" />
                                    )}
                                    <span>
                                      {isPositiveVariation ? '+' : ''}R$ {safeCurrencyFormatter(Math.abs(variation))}
                                    </span>
                                  </div>
                                  <span className="text-xs text-muted-foreground">no dia</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ 
                        r: 4, 
                        fill: "hsl(var(--primary))",
                        stroke: "hsl(var(--background))",
                        strokeWidth: 2
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          )}

          {/* Period Info */}
          {dateFilters?.startDate && dateFilters?.endDate && (
            <div className="text-center">
              <p className="text-notion-caption text-notion-gray-500">
                Período: {safeFormatDate(dateFilters.startDate)} - {safeFormatDate(dateFilters.endDate)}
              </p>
            </div>
          )}
        </div>
      </NotionCardContent>
    </NotionCard>
  );
}
