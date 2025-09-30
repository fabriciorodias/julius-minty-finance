
import { useState, useMemo } from 'react';
import { NotionCard, NotionCardHeader, NotionCardTitle } from '@/components/ui/notion-card';
import { NotionButton } from '@/components/ui/notion-button';
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
import { format, addDays, isValid } from 'date-fns';
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

  // Safe date formatting helper
  const safeFormatDateString = (dateInput: any, formatStr: string = 'yyyy-MM-dd'): string => {
    try {
      if (!dateInput) return format(new Date(), formatStr);
      
      let dateToFormat: Date;
      if (dateInput instanceof Date) {
        dateToFormat = dateInput;
      } else if (typeof dateInput === 'string') {
        dateToFormat = new Date(dateInput);
      } else {
        dateToFormat = new Date();
      }
      
      if (!isValid(dateToFormat)) {
        console.warn('Invalid date in safeFormatDateString:', dateInput);
        return format(new Date(), formatStr);
      }
      
      return format(dateToFormat, formatStr);
    } catch (error) {
      console.warn('Error formatting date:', error, 'Input:', dateInput);
      return format(new Date(), formatStr);
    }
  };

  // Calculate date filters based on horizon
  const dateFilters = useMemo(() => {
    const today = new Date();
    const startDate = safeFormatDateString(today, 'yyyy-MM-dd');
    let endDate: string;
    
    try {
      switch (horizon) {
        case '30d':
          endDate = safeFormatDateString(addDays(today, 30), 'yyyy-MM-dd');
          break;
        case '90d':
          endDate = safeFormatDateString(addDays(today, 90), 'yyyy-MM-dd');
          break;
        case '180d':
          endDate = safeFormatDateString(addDays(today, 180), 'yyyy-MM-dd');
          break;
        case '12m':
          endDate = safeFormatDateString(addDays(today, 365), 'yyyy-MM-dd');
          break;
        default:
          endDate = safeFormatDateString(addDays(today, 90), 'yyyy-MM-dd');
      }
    } catch (error) {
      console.warn('Error calculating end date:', error);
      endDate = safeFormatDateString(addDays(today, 90), 'yyyy-MM-dd');
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
      <NotionCard variant="muted" padding="lg">
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-notion-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Selecione pelo menos uma conta para ver a projeção</p>
          </div>
        </div>
      </NotionCard>
    );
  }

  return (
    <NotionCard variant="hoverable" padding="none" className="transition-notion">
      <div className="p-6 pb-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-notion-h2 text-notion-gray-900 flex items-center gap-3">
              <TrendingUp className="h-7 w-7 text-notion-blue" />
              Projeção de Fluxo de Caixa
            </h2>
            <p className="text-notion-caption text-notion-gray-600 mt-1">
              Visualize o futuro das suas finanças e tome decisões mais conscientes
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Mode Toggle */}
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'calm' | 'analytical')}>
              <TabsList className="bg-notion-gray-100">
                <TabsTrigger value="calm" className="text-xs data-[state=active]:bg-white">
                  <Eye className="h-3 w-3 mr-1" />
                  Calmo
                </TabsTrigger>
                <TabsTrigger value="analytical" className="text-xs data-[state=active]:bg-white">
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
              <NotionButton variant="outline" size="sm">
                <Lightbulb className="h-4 w-4" />
                E se eu...?
              </NotionButton>
            </CashFlowScenarioPanel>
          </div>
        </div>

        {/* Horizon Selector */}
        <div className="flex items-center gap-2 mt-4">
          <Calendar className="h-4 w-4 text-notion-gray-600" />
          <span className="text-notion-body-sm text-notion-gray-600 mr-2">Período:</span>
          {(['30d', '90d', '180d', '12m'] as const).map((h) => (
            <NotionButton
              key={h}
              variant={horizon === h ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setHorizon(h)}
            >
              {getHorizonLabel(h)}
            </NotionButton>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NotionCard variant="muted" padding="sm">
            <div className="text-center p-2">
              <p className="text-notion-caption text-notion-gray-600 mb-1">Liquidez Atual</p>
              <p className={`text-notion-value tabular-nums ${
                completedBalance >= 0 ? 'text-notion-success' : 'text-notion-danger'
              }`}>
                {formatCurrency(completedBalance)}
              </p>
            </div>
          </NotionCard>

          <NotionCard variant="muted" padding="sm">
            <div className="text-center p-2">
              <p className="text-notion-caption text-notion-gray-600 mb-1">Pior Momento</p>
              <p className={`text-notion-value tabular-nums ${
                metrics.worstDayBalance >= 0 ? 'text-notion-success' : 'text-notion-danger'
              }`}>
                {formatCurrency(metrics.worstDayBalance)}
              </p>
              <p className="text-xs text-notion-gray-600">
                {safeFormatDate(metrics.worstDayDate, 'dd/MM')}
              </p>
            </div>
          </NotionCard>

          <NotionCard variant="muted" padding="sm">
            <div className="text-center p-2">
              <p className="text-notion-caption text-notion-gray-600 mb-1">Saldo Final</p>
              <p className={`text-notion-value tabular-nums ${
                metrics.projectedEndBalance >= 0 ? 'text-notion-success' : 'text-notion-danger'
              }`}>
                {formatCurrency(metrics.projectedEndBalance)}
              </p>
            </div>
          </NotionCard>

          <NotionCard variant="muted" padding="sm">
            <div className="text-center flex flex-col items-center p-2">
              <p className="text-notion-caption text-notion-gray-600 mb-1">Risco</p>
              <div className="flex items-center gap-2">
                {(() => {
                  const RiskIcon = getRiskIcon(metrics.riskScore);
                  return <RiskIcon className={`h-5 w-5 ${getRiskColor(metrics.riskScore)}`} />;
                })()}
                <Badge variant={metrics.riskScore === 'high' ? 'destructive' : 'outline'} className="text-xs">
                  {metrics.riskScore === 'high' ? 'Alto' : 
                   metrics.riskScore === 'medium' ? 'Médio' : 'Baixo'}
                </Badge>
              </div>
            </div>
          </NotionCard>
        </div>

        {/* Chart */}
        <NotionCard variant="default" padding="sm">
          <div className="h-96">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-notion-blue"></div>
              </div>
            ) : (
              <CashFlowChartBase
                data={dataPoints}
                scenarioData={simulationResult?.scenarioDataPoints}
                showScenario={scenarioAdjustments.length > 0}
                height={384}
                chartConfig={chartConfig}
              />
            )}
          </div>
        </NotionCard>

        {/* Risk Alerts */}
        {mode === 'analytical' && (
          <RiskBadges metrics={metrics} />
        )}

        {/* Pending Transactions Summary */}
        {(pendingIncome > 0 || pendingExpense > 0) && (
          <NotionCard variant="muted" padding="md">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-notion-caption text-notion-gray-600">Receitas Pendentes</p>
                <p className="text-notion-body font-semibold text-notion-success">
                  {formatCurrency(pendingIncome)}
                </p>
              </div>
              <div>
                <p className="text-notion-caption text-notion-gray-600">Despesas Pendentes</p>
                <p className="text-notion-body font-semibold text-notion-danger">
                  {formatCurrency(pendingExpense)}
                </p>
              </div>
              <div>
                <p className="text-notion-caption text-notion-gray-600">Provisões Líquidas</p>
                <p className={`text-notion-body font-semibold ${
                  provisionsAmount >= 0 ? 'text-notion-success' : 'text-notion-danger'  
                }`}>
                  {formatCurrency(provisionsAmount)}
                </p>
              </div>
            </div>
          </NotionCard>
        )}
      </div>
    </NotionCard>
  );
}
