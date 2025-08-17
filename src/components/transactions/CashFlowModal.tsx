
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CashFlowChartBase } from '@/components/dashboards/CashFlowChartBase';
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
              <CashFlowChartBase
                data={dataPoints}
                height={400}
                showBrush={true}
                chartConfig={chartConfig}
              />
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
