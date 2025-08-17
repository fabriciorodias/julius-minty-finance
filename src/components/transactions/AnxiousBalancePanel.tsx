
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useProvisionedTotals } from '@/hooks/useProvisionedTotals';
import { useCashFlowProjection } from '@/hooks/useCashFlowProjection';
import { useAccounts } from '@/hooks/useAccounts';
import { useInstitutions } from '@/hooks/useInstitutions';
import { safeCurrencyFormatter, safeFormatDate } from '@/lib/date-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface AnxiousBalancePanelProps {
  selectedAccountIds: string[];
  dateFilters?: {
    startDate?: string;
    endDate?: string;
  };
}

export function AnxiousBalancePanel({ selectedAccountIds, dateFilters }: AnxiousBalancePanelProps) {
  const { accounts } = useAccounts();
  const { institutions } = useInstitutions();

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
  const chartData = dataPoints.map(point => ({
    date: point.date,
    total: point.total,
    formattedDate: safeFormatDate(point.date, 'dd/MM'),
    fullDate: safeFormatDate(point.date, 'dd/MM/yyyy')
  }));

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-48" />
              </div>
              <div className="space-y-2 text-right">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-48" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-gradient-to-br from-background to-muted/30 border-muted/50 shadow-sm">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Balance Display */}
          <div className="flex items-start justify-between">
            {/* Today's Balance */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Saldo Atual</span>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-foreground">
                  R$ {safeCurrencyFormatter(todaysAssetBalance)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Baseado em transações efetivadas
                </p>
              </div>
            </div>

            {/* Projected Balance */}
            <div className="space-y-2 text-right">
              <div className="flex items-center gap-2 text-muted-foreground justify-end">
                {isPositiveTrend ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm font-medium">Saldo Projetado</span>
              </div>
              <div className="space-y-1">
                <div className={`text-2xl font-bold ${
                  finalProjectedBalance >= 0 ? 'text-foreground' : 'text-destructive'
                }`}>
                  R$ {safeCurrencyFormatter(finalProjectedBalance)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dateFilters?.endDate ? `até ${safeFormatDate(dateFilters.endDate)}` : 'Fim do período'}
                </p>
              </div>
            </div>
          </div>

          {/* Balance Change Indicator */}
          <div className="flex items-center justify-center">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              isPositiveTrend 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
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
                        return (
                          <ChartTooltipContent
                            className="w-auto"
                            labelFormatter={() => data.fullDate}
                            formatter={(value) => [
                              `R$ ${safeCurrencyFormatter(value as number)}`,
                              'Saldo Projetado'
                            ]}
                          />
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
              <p className="text-xs text-muted-foreground">
                Período: {safeFormatDate(dateFilters.startDate)} - {safeFormatDate(dateFilters.endDate)}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
