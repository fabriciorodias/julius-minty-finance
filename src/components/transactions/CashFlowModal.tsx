
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceArea } from 'recharts';
import { useCashFlowProjection } from '@/hooks/useCashFlowProjection';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, Eye, EyeOff } from 'lucide-react';

interface CashFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAccountIds: string[];
  accounts: Array<{ id: string; name: string }>;
  institutions: Array<{ id: string; name: string }>;
  dateFilters?: {
    startDate?: string;
    endDate?: string;
  };
}

export function CashFlowModal({ 
  isOpen, 
  onClose, 
  selectedAccountIds, 
  accounts,
  institutions,
  dateFilters 
}: CashFlowModalProps) {
  const { dataPoints, accounts: accountsInfo, isLoading } = useCashFlowProjection({
    selectedAccountIds,
    dateFilters
  });

  const [visibleAccounts, setVisibleAccounts] = useState<Set<string>>(
    new Set(selectedAccountIds)
  );
  const [showTotal, setShowTotal] = useState(true);

  const toggleAccountVisibility = (accountId: string) => {
    const newVisible = new Set(visibleAccounts);
    if (newVisible.has(accountId)) {
      newVisible.delete(accountId);
    } else {
      newVisible.add(accountId);
    }
    setVisibleAccounts(newVisible);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return format(parseISO(dateStr), 'dd/MM', { locale: ptBR });
  };

  // Calculate min and max values for the reference area
  const allValues = dataPoints.flatMap(point => [
    point.total,
    ...accountsInfo.map(account => point[account.id] as number || 0)
  ]);
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);

  const chartConfig = {
    total: {
      label: 'Total Geral',
      color: 'hsl(var(--primary))',
    },
    ...accountsInfo.reduce((acc, account) => {
      acc[account.id] = {
        label: account.name,
        color: account.color,
      };
      return acc;
    }, {} as Record<string, any>),
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Projeção de Fluxo de Caixa
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Legend and Controls */}
          <div className="flex flex-wrap gap-3 p-4 bg-muted/30 rounded-lg">
            {/* Total Line Toggle */}
            <div className="flex items-center gap-2">
              <Checkbox
                checked={showTotal}
                onCheckedChange={(checked) => setShowTotal(checked === true)}
                id="total-line"
              />
              <Badge 
                variant="outline" 
                className="flex items-center gap-1"
                style={{ borderColor: 'hsl(var(--primary))' }}
              >
                <div 
                  className="w-3 h-0.5 rounded" 
                  style={{ backgroundColor: 'hsl(var(--primary))' }}
                />
                Total Geral
                {showTotal ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </Badge>
            </div>

            {/* Account Lines Toggles */}
            {accountsInfo.map((account) => (
              <div key={account.id} className="flex items-center gap-2">
                <Checkbox
                  checked={visibleAccounts.has(account.id)}
                  onCheckedChange={(checked) => {
                    if (checked === true) {
                      toggleAccountVisibility(account.id);
                    } else if (checked === false) {
                      toggleAccountVisibility(account.id);
                    }
                  }}
                  id={`account-${account.id}`}
                />
                <Badge 
                  variant="outline" 
                  className="flex items-center gap-1 text-xs"
                  style={{ borderColor: account.color }}
                >
                  <div 
                    className="w-3 h-0.5 rounded" 
                    style={{ backgroundColor: account.color }}
                  />
                  {account.name}
                  {visibleAccounts.has(account.id) ? 
                    <Eye className="h-3 w-3" /> : 
                    <EyeOff className="h-3 w-3" />
                  }
                </Badge>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="flex-1 min-h-0">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dataPoints} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(value).replace('R$', '').trim()}
                      tick={{ fontSize: 12 }}
                      width={80}
                    />

                    {/* Reference area for negative values */}
                    {minValue < 0 && (
                      <ReferenceArea
                        y1={minValue}
                        y2={0}
                        fill="hsl(var(--destructive))"
                        fillOpacity={0.1}
                        stroke="none"
                      />
                    )}

                    <ChartTooltip 
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-3 min-w-[200px]">
                            <p className="font-medium mb-2">
                              {format(parseISO(label), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                            <div className="space-y-1">
                              {payload
                                .filter(entry => {
                                  if (entry.dataKey === 'total') return showTotal;
                                  return visibleAccounts.has(entry.dataKey as string);
                                })
                                .map((entry) => (
                                  <div key={entry.dataKey} className="flex justify-between items-center gap-4">
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-3 h-0.5 rounded"
                                        style={{ backgroundColor: entry.color }}
                                      />
                                      <span className="text-sm">
                                        {entry.dataKey === 'total' ? 'Total' : 
                                          accountsInfo.find(a => a.id === entry.dataKey)?.name
                                        }
                                      </span>
                                    </div>
                                    <span className={`font-medium ${
                                      (entry.value as number) < 0 ? 'text-destructive' : ''
                                    }`}>
                                      {formatCurrency(entry.value as number)}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        );
                      }}
                    />

                    {/* Total Line */}
                    {showTotal && (
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
                      />
                    )}

                    {/* Account Lines */}
                    {accountsInfo.map((account) => 
                      visibleAccounts.has(account.id) && (
                        <Line
                          key={account.id}
                          type="monotone"
                          dataKey={account.id}
                          stroke={account.color}
                          strokeWidth={2}
                          strokeDasharray={account.id !== 'total' ? '5 5' : undefined}
                          dot={false}
                          activeDot={{ r: 3, fill: account.color }}
                        />
                      )
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </div>

          {/* Summary Stats */}
          {!isLoading && dataPoints.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Saldo Inicial</p>
                <p className="font-bold text-lg">
                  {formatCurrency(dataPoints[0]?.total || 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Saldo Final</p>
                <p className="font-bold text-lg">
                  {formatCurrency(dataPoints[dataPoints.length - 1]?.total || 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Variação</p>
                <p className={`font-bold text-lg ${
                  ((dataPoints[dataPoints.length - 1]?.total || 0) - (dataPoints[0]?.total || 0)) >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {formatCurrency(
                    (dataPoints[dataPoints.length - 1]?.total || 0) - (dataPoints[0]?.total || 0)
                  )}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Período</p>
                <p className="font-bold text-sm">
                  {dataPoints.length} dias
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
