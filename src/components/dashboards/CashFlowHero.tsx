
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CashFlowChartBase } from './CashFlowChartBase';
import { CashFlowScenarioPanel } from './CashFlowScenarioPanel';
import { RiskBadges } from './RiskBadges';
import { useCashFlowProjection } from '@/hooks/useCashFlowProjection';
import { useCashFlowMetrics } from '@/hooks/useCashFlowMetrics';
import { useProvisionedTotals } from '@/hooks/useProvisionedTotals';
import { simulateCashFlowScenario, ScenarioAdjustment } from '@/lib/cashflow-sim';
import { safeFormatDate } from '@/lib/date-utils';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  TrendingUp, 
  Calendar, 
  Lightbulb, 
  BarChart3, 
  Eye,
  AlertTriangle,
  TrendingDown,
  Shield
} from 'lucide-react';

interface CashFlowHeroProps {
  selectedAccountIds: string[];
}

export function CashFlowHero({ selectedAccountIds }: CashFlowHeroProps) {
  const [horizon, setHorizon] = useState<'30d' | '90d' | '180d' | '12m'>('90d');
  const [mode, setMode] = useState<'calm' | 'analytical'>('calm');
  const [scenarioAdjustments, setScenarioAdjustments] = useState<ScenarioAdjustment[]>([]);

  // Calculate date filters based on horizon
  const dateFilters = useMemo(() => {
    const startDate = format(new Date(), 'yyyy-MM-dd');
    let endDate: string;
    
    switch (horizon) {
      case '30d':
        endDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');
        break;
      case '90d':
        endDate = format(addDays(new Date(), 90), 'yyyy-MM-dd');
        break;
      case '180d':
        endDate = format(addDays(new Date(), 180), 'yyyy-MM-dd');
        break;
      case '12m':
        endDate = format(addDays(new Date(), 365), 'yyyy-MM-dd');
        break;
      default:
        endDate = format(addDays(new Date(), 90), 'yyyy-MM-dd');
    }
    
    return { startDate, endDate };
  }, [horizon]);

  // Fetch data
  const { dataPoints, accounts, isLoading } = useCashFlowProjection({
    selectedAccountIds,
    dateFilters
  });

  const { 
    completedBalance, 
    totalBalance, 
    provisionsAmount,
    pendingIncome,
    pendingExpense 
  } = useProvisionedTotals({ selectedAccountIds, dateFilters });

  // Calculate metrics
  const metrics = useCashFlowMetrics(dataPoints);

  // Simulate scenario
  const simulationResult = useMemo(() => {
    if (!dataPoints.length || !scenarioAdjustments.length) return null;
    return simulateCashFlowScenario(dataPoints, scenarioAdjustments);
  }, [dataPoints, scenarioAdjustments]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getHorizonLabel = (h: string) => {
    switch (h) {
      case '30d': return '30 dias';
      case '90d': return '3 meses';
      case '180d': return '6 meses';
      case '12m': return '1 ano';
      default: return '3 meses';
    }
  };

  const getRiskIcon = (riskScore: string) => {
    switch (riskScore) {
      case 'high': return AlertTriangle;
      case 'medium': return TrendingDown;
      case 'low': return Shield;
      default: return Shield;
    }
  };

  const getRiskColor = (riskScore: string) => {
    switch (riskScore) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-warning';
      case 'low': return 'text-green-600';
      default: return 'text-green-600';
    }
  };

  const chartConfig = {
    total: {
      label: 'Saldo Total',
      color: 'hsl(var(--primary))',
    }
  };

  if (selectedAccountIds.length === 0) {
    return (
      <Card className="mint-card">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Selecione pelo menos uma conta para ver a projeção</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mint-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-mint-text-primary flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              Projeção de Fluxo de Caixa
            </CardTitle>
            <p className="text-mint-text-secondary mt-1">
              Visualize o futuro das suas finanças e tome decisões mais conscientes
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Mode Toggle */}
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'calm' | 'analytical')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="calm" className="text-xs">
                  <Eye className="h-3 w-3 mr-1" />
                  Calmo
                </TabsTrigger>
                <TabsTrigger value="analytical" className="text-xs">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Analítico
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Scenario Panel */}
            <CashFlowScenarioPanel 
              onScenarioChange={setScenarioAdjustments}
              simulationResult={simulationResult}
            >
              <Button variant="outline" size="sm" className="gap-2">
                <Lightbulb className="h-4 w-4" />
                E se eu...?
              </Button>
            </CashFlowScenarioPanel>
          </div>
        </div>

        {/* Horizon Selector */}
        <div className="flex items-center gap-2 mt-4">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground mr-2">Período:</span>
          {(['30d', '90d', '180d', '12m'] as const).map((h) => (
            <Button
              key={h}
              variant={horizon === h ? 'default' : 'outline'}
              size="sm"
              onClick={() => setHorizon(h)}
            >
              {getHorizonLabel(h)}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Liquidez Atual</p>
              <p className={`text-xl font-bold ${
                completedBalance >= 0 ? 'text-green-600' : 'text-destructive'
              }`}>
                {formatCurrency(completedBalance)}
              </p>
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Pior Momento</p>
              <p className={`text-xl font-bold ${
                metrics.worstDayBalance >= 0 ? 'text-green-600' : 'text-destructive'
              }`}>
                {formatCurrency(metrics.worstDayBalance)}
              </p>
              <p className="text-xs text-muted-foreground">
                {safeFormatDate(metrics.worstDayDate, 'dd/MM')}
              </p>
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Saldo Final</p>
              <p className={`text-xl font-bold ${
                metrics.projectedEndBalance >= 0 ? 'text-green-600' : 'text-destructive'
              }`}>
                {formatCurrency(metrics.projectedEndBalance)}
              </p>
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-center flex flex-col items-center">
              <p className="text-sm text-muted-foreground mb-1">Risco</p>
              <div className="flex items-center gap-2">
                {(() => {
                  const RiskIcon = getRiskIcon(metrics.riskScore);
                  return <RiskIcon className={`h-5 w-5 ${getRiskColor(metrics.riskScore)}`} />;
                })()}
                <Badge variant={metrics.riskScore === 'high' ? 'destructive' : 'outline'}>
                  {metrics.riskScore === 'high' ? 'Alto' : 
                   metrics.riskScore === 'medium' ? 'Médio' : 'Baixo'}
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Chart */}
        <div className="h-96">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <CashFlowChartBase
              data={dataPoints}
              scenarioData={simulationResult?.scenarioDataPoints}
              showScenario={scenarioAdjustments.length > 0}
              height={384}
              showBrush={mode === 'analytical'}
              chartConfig={chartConfig}
            />
          )}
        </div>

        {/* Risk Alerts */}
        {mode === 'analytical' && (
          <RiskBadges metrics={metrics} />
        )}

        {/* Pending Transactions Summary */}
        {(pendingIncome > 0 || pendingExpense > 0) && (
          <Card className="bg-muted/30">
            <CardContent className="pt-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Receitas Pendentes</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(pendingIncome)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Despesas Pendentes</p>
                  <p className="text-lg font-semibold text-destructive">
                    {formatCurrency(pendingExpense)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Provisões Líquidas</p>
                  <p className={`text-lg font-semibold ${
                    provisionsAmount >= 0 ? 'text-green-600' : 'text-destructive'  
                  }`}>
                    {formatCurrency(provisionsAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
