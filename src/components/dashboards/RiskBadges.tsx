
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingDown, Shield, Target } from 'lucide-react';
import { CashFlowMetrics } from '@/hooks/useCashFlowMetrics';

interface RiskBadgesProps {
  metrics: CashFlowMetrics;
  className?: string;
}

export function RiskBadges({ metrics, className }: RiskBadgesProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getRiskAlerts = () => {
    const alerts = [];

    if (metrics.daysBelowZero > 0) {
      alerts.push({
        type: 'error' as const,
        icon: AlertTriangle,
        title: 'Períodos Negativos',
        description: `Seu saldo ficará negativo por ${metrics.daysBelowZero} dias. Consider reduzir gastos ou antecipar receitas.`,
        action: 'Simular cortes de gastos'
      });
    }

    if (metrics.worstDayBalance < 500 && metrics.worstDayBalance > 0) {
      alerts.push({
        type: 'warning' as const,
        icon: TrendingDown,
        title: 'Saldo Baixo',
        description: `Seu menor saldo será ${formatCurrency(metrics.worstDayBalance)}. Mantenha uma reserva de emergência.`,
        action: 'Ver estratégias'
      });
    }

    if (metrics.trendDirection === 'down') {
      alerts.push({
        type: 'warning' as const,
        icon: TrendingDown,
        title: 'Tendência Negativa',
        description: 'Suas finanças estão em tendência de queda. Hora de revisar o orçamento.',
        action: 'Analisar gastos'
      });
    }

    if (metrics.riskScore === 'low' && alerts.length === 0) {
      alerts.push({
        type: 'success' as const,
        icon: Shield,
        title: 'Situação Estável',
        description: 'Suas finanças estão equilibradas. Continue assim!',
        action: 'Otimizar investimentos'
      });
    }

    return alerts;
  };

  const alerts = getRiskAlerts();

  if (alerts.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {alerts.map((alert, index) => (
        <Alert key={index} variant={alert.type === 'error' ? 'destructive' : 'default'}>
          <alert.icon className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{alert.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
              </div>
              <Badge variant="outline" className="ml-4 whitespace-nowrap">
                {alert.action}
              </Badge>
            </div>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
