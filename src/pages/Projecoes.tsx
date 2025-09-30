import { useState, useEffect } from "react";
import { NotionCard, NotionCardContent, NotionCardHeader, NotionCardTitle } from "@/components/ui/notion-card";
import { Badge } from "@/components/ui/badge";
import { NotionButton } from "@/components/ui/notion-button";
import { Checkbox } from "@/components/ui/checkbox";
import { CashFlowChartBase } from "@/components/dashboards/CashFlowChartBase";
import { FinancialSankeyChart } from "@/components/dashboards/FinancialSankeyChart";
import { useCashFlowProjection } from "@/hooks/useCashFlowProjection";
import { useCashFlowMetrics } from "@/hooks/useCashFlowMetrics";
import { useCashFlowSankey } from "@/hooks/useCashFlowSankey";
import { useAccounts } from "@/hooks/useAccounts";
import { useInstitutions } from "@/hooks/useInstitutions";
import { usePlans } from "@/hooks/usePlans";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, AlertTriangle, Shield, Eye, Calendar } from "lucide-react";
import { format, parseISO, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Projecoes() {
  const { accounts = [] } = useAccounts();
  const { institutions = [] } = useInstitutions();
  const { plans = [] } = usePlans();
  
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [dateFilters, setDateFilters] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 90), 'yyyy-MM-dd')
  });
  const [includeRecurring, setIncludeRecurring] = useState(true);
  const [includeCreditCards, setIncludeCreditCards] = useState(false);
  const [includeLoans, setIncludeLoans] = useState(false);
  const [includePlans, setIncludePlans] = useState(false);
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>([]);

  // Update selected accounts when accounts data loads or liability toggles change
  useEffect(() => {
    if (accounts.length > 0) {
      const budgetAccounts = accounts.filter(acc => acc.type === 'on_budget');
      const creditCardAccounts = includeCreditCards ? accounts.filter(acc => acc.subtype === 'credit_card') : [];
      const loanAccounts = includeLoans ? accounts.filter(acc => acc.subtype === 'loan') : [];
      
      const allSelectedAccounts = [...budgetAccounts, ...creditCardAccounts, ...loanAccounts];
      setSelectedAccountIds(allSelectedAccounts.map(acc => acc.id));
    }
  }, [accounts, includeCreditCards, includeLoans]);
  const [visibleAccounts, setVisibleAccounts] = useState<Set<string>>(new Set());
  const [showTotal, setShowTotal] = useState(true);

  const { dataPoints, accounts: accountsInfo, isLoading } = useCashFlowProjection({
    selectedAccountIds,
    dateFilters,
    includeRecurring,
    includePlans,
    selectedPlanIds,
    includeCreditCards,
    sampleSize: 200
  });

  // Use all data for metrics
  const metricsData = dataPoints;
  const metrics = useCashFlowMetrics(metricsData);

  // Sankey chart data
  const { data: sankeyData = { nodes: [], links: [] }, isLoading: sankeyLoading } = useCashFlowSankey({
    selectedAccounts: selectedAccountIds,
    startDate: new Date(dateFilters.startDate),
    endDate: new Date(dateFilters.endDate)
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const chartConfig = accountsInfo.reduce((config, account) => {
    config[account.id] = {
      label: account.name,
      color: account.color,
    };
    return config;
  }, {} as Record<string, any>);

  const toggleAccountVisibility = (accountId: string) => {
    setVisibleAccounts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accountId)) {
        newSet.delete(accountId);
      } else {
        newSet.add(accountId);
      }
      return newSet;
    });
  };

  const handleDatePeriodChange = (days: number) => {
    setDateFilters({
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(addDays(new Date(), days), 'yyyy-MM-dd')
    });
  };

  const togglePlan = (planId: string) => {
    setSelectedPlanIds(prev => {
      if (prev.includes(planId)) {
        return prev.filter(id => id !== planId);
      } else {
        return [...prev, planId];
      }
    });
  };

  const clearAllPlans = () => {
    setSelectedPlanIds([]);
    setIncludePlans(false);
  };

  const getRiskColor = (score: string) => {
    switch (score) {
      case 'low': return 'text-financial-success-light';
      case 'medium': return 'text-financial-warning-light';
      case 'high': return 'text-financial-expense-light';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskIcon = (score: string) => {
    switch (score) {
      case 'low': return <Shield className="w-4 h-4" />;
      case 'medium': return <Eye className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-notion-h1 text-notion-gray-900">Projeções de Fluxo de Caixa</h1>
          <p className="text-notion-body text-notion-gray-600">
            Visualize como seu dinheiro se comportará no futuro com base nas decisões de hoje
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <NotionButton
            variant={dateFilters.endDate === format(addDays(new Date(), 30), 'yyyy-MM-dd') ? "primary" : "outline"}
            size="sm"
            onClick={() => handleDatePeriodChange(30)}
          >
            30 dias
          </NotionButton>
          <NotionButton
            variant={dateFilters.endDate === format(addDays(new Date(), 90), 'yyyy-MM-dd') ? "primary" : "outline"}
            size="sm"
            onClick={() => handleDatePeriodChange(90)}
          >
            90 dias
          </NotionButton>
          <NotionButton
            variant={dateFilters.endDate === format(addDays(new Date(), 180), 'yyyy-MM-dd') ? "primary" : "outline"}
            size="sm"
            onClick={() => handleDatePeriodChange(180)}
          >
            6 meses
          </NotionButton>
          <NotionButton
            variant={dateFilters.endDate === format(addDays(new Date(), 365), 'yyyy-MM-dd') ? "primary" : "outline"}
            size="sm"
            onClick={() => handleDatePeriodChange(365)}
          >
            1 ano
          </NotionButton>
        </div>
      </div>

      {/* Quick Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NotionCard variant="hoverable" className="transition-notion border-l-4 border-l-financial-success">
          <NotionCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-notion-caption text-notion-gray-600">Liquidez Atual</p>
                <p className="text-notion-value tabular-nums text-financial-success">
                  {formatCurrency(metrics.liquidityNow)}
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-financial-success" />
            </div>
          </NotionCardContent>
        </NotionCard>

        <NotionCard variant="hoverable" className="transition-notion border-l-4 border-l-financial-expense">
          <NotionCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-notion-caption text-notion-gray-600">Pior Dia</p>
                <p className="text-notion-h3 text-financial-expense">
                  {formatCurrency(metrics.worstDayBalance)}
                </p>
                <p className="text-notion-body-sm text-notion-gray-600">
                  {metrics.worstDayDate && format(parseISO(metrics.worstDayDate), 'dd/MM', { locale: ptBR })}
                </p>
              </div>
              <TrendingDown className="h-6 w-6 text-financial-expense" />
            </div>
          </NotionCardContent>
        </NotionCard>

        <NotionCard variant="hoverable" className={`transition-notion border-l-4 ${
          metrics.riskScore === 'low' ? 'border-l-financial-success' :
          metrics.riskScore === 'medium' ? 'border-l-financial-warning' :
          'border-l-financial-expense'
        }`}>
          <NotionCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-notion-caption text-notion-gray-600">Nível de Risco</p>
                <div className="flex items-center gap-2">
                  <span className={`text-notion-h3 ${getRiskColor(metrics.riskScore)}`}>
                    {metrics.riskScore === 'low' ? 'Baixo' : 
                     metrics.riskScore === 'medium' ? 'Médio' : 'Alto'}
                  </span>
                  {getRiskIcon(metrics.riskScore)}
                </div>
                {metrics.daysBelowZero > 0 && (
                  <p className="text-notion-body-sm text-financial-expense">
                    {metrics.daysBelowZero} dias negativos
                  </p>
                )}
              </div>
            </div>
          </NotionCardContent>
        </NotionCard>

        <NotionCard variant="hoverable" className="transition-notion border-l-4 border-l-notion-blue">
          <NotionCardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-notion-caption text-notion-gray-600">Saldo Final</p>
                <p className={`text-notion-value tabular-nums ${
                  metrics.projectedEndBalance >= 0 ? 'text-financial-success' : 'text-financial-expense'
                }`}>
                  {formatCurrency(metrics.projectedEndBalance)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {metrics.trendDirection === 'up' && <TrendingUp className="h-3 w-3 text-financial-success" />}
                  {metrics.trendDirection === 'down' && <TrendingDown className="h-3 w-3 text-financial-expense" />}
                  <span className="text-notion-body-sm text-notion-gray-600">
                    Tendência {metrics.trendDirection === 'up' ? 'crescente' : 
                              metrics.trendDirection === 'down' ? 'decrescente' : 'estável'}
                  </span>
                </div>
              </div>
              <Calendar className="h-6 w-6 text-notion-blue" />
            </div>
          </NotionCardContent>
        </NotionCard>
      </div>

      {/* Main Chart */}
      <NotionCard variant="default">
        <NotionCardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <NotionCardTitle>Projeção de Fluxo de Caixa</NotionCardTitle>
              <p className="text-notion-body-sm text-notion-gray-600">
                Evolução do saldo ao longo do tempo
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-recurring"
                  checked={includeRecurring}
                  onCheckedChange={(checked) => setIncludeRecurring(checked === true)}
                />
                <label
                  htmlFor="include-recurring"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Incluir recorrentes
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-plans"
                  checked={includePlans}
                  onCheckedChange={(checked) => setIncludePlans(checked === true)}
                />
                <label
                  htmlFor="include-plans"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Incluir planos ({plans.length})
                </label>
              </div>
              
              <div className="flex items-center gap-4 pl-4 border-l">
                <span className="text-sm font-medium text-muted-foreground">Incluir Passivos:</span>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-credit-cards"
                    checked={includeCreditCards}
                    onCheckedChange={(checked) => setIncludeCreditCards(checked === true)}
                  />
                  <label
                    htmlFor="include-credit-cards"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Cartões de Crédito ({accounts.filter(acc => acc.subtype === 'credit_card').length})
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-loans"
                    checked={includeLoans}
                    onCheckedChange={(checked) => setIncludeLoans(checked === true)}
                  />
                  <label
                    htmlFor="include-loans"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Empréstimos ({accounts.filter(acc => acc.subtype === 'loan').length})
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Account Visibility Controls */}
          <div className="flex flex-wrap gap-2 mt-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="show-total"
                checked={showTotal}
                onCheckedChange={(checked) => setShowTotal(checked === true)}
              />
              <Badge variant="outline" className="font-medium">
                Total
              </Badge>
            </div>
            
            {accountsInfo.map((account) => (
              <div key={account.id} className="flex items-center gap-2">
                <Checkbox
                  id={`account-${account.id}`}
                  checked={visibleAccounts.has(account.id)}
                  onCheckedChange={() => toggleAccountVisibility(account.id)}
                />
                <Badge 
                  variant="outline"
                  style={{ borderColor: account.color }}
                  className="font-medium"
                >
                  <div 
                    className="w-2 h-2 rounded-full mr-2" 
                    style={{ backgroundColor: account.color }}
                  />
                  {account.name}
                </Badge>
              </div>
            ))}
          </div>

          {/* Plans Selection - Only show when includePlans is enabled */}
          {includePlans && (
            <div className="mt-4 p-4 border rounded-lg bg-muted/20">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-notion-body-sm text-notion-gray-600">Simular Impacto dos Planos:</h4>
                <NotionButton 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAllPlans}
                  className="text-xs"
                >
                  Limpar Todos
                </NotionButton>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {plans.map((plan) => (
                  <div key={plan.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`plan-${plan.id}`}
                      checked={selectedPlanIds.includes(plan.id)}
                      onCheckedChange={() => togglePlan(plan.id)}
                    />
                    <Badge 
                      variant="outline"
                      className={`font-medium ${plan.type === 'poupanca' ? 'border-financial-success' : 'border-financial-expense'}`}
                    >
                      <span className={`mr-2 ${plan.type === 'poupanca' ? 'text-financial-success' : 'text-financial-expense'}`}>
                        {plan.type === 'poupanca' ? '💰' : '📋'}
                      </span>
                      {plan.name} ({formatCurrency(plan.total_amount)})
                    </Badge>
                  </div>
                ))}
              </div>
              
              {plans.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhum plano encontrado. Crie planos na aba "Planos" para simular seu impacto.
                </p>
              )}
            </div>
          )}
        </NotionCardHeader>

        <NotionCardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-64 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-16 flex-1" />
                <Skeleton className="h-16 flex-1" />
                <Skeleton className="h-16 flex-1" />
                <Skeleton className="h-16 flex-1" />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <CashFlowChartBase 
                data={dataPoints}
                height={400}
                chartConfig={chartConfig}
              />
              
              {/* Summary Statistics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Saldo Inicial</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(metricsData[0]?.total || 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Saldo Final</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(metricsData[metricsData.length - 1]?.total || 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Variação</p>
                  <p className={`text-lg font-semibold ${
                    (metricsData[metricsData.length - 1]?.total || 0) - (metricsData[0]?.total || 0) >= 0 
                      ? 'text-financial-success' 
                      : 'text-financial-expense'
                  }`}>
                    {((metricsData[metricsData.length - 1]?.total || 0) - (metricsData[0]?.total || 0)) >= 0 ? '+' : ''}
                    {formatCurrency(
                      (metricsData[metricsData.length - 1]?.total || 0) - (metricsData[0]?.total || 0)
                    )}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Período</p>
                  <p className="text-lg font-semibold">
                    {Math.ceil((new Date(dateFilters.endDate).getTime() - new Date(dateFilters.startDate).getTime()) / (1000 * 60 * 60 * 24))} dias
                  </p>
                </div>
              </div>
            </div>
          )}
        </NotionCardContent>
      </NotionCard>

      {/* Sankey Chart */}
      {sankeyLoading ? (
        <NotionCard variant="muted">
          <NotionCardHeader>
            <NotionCardTitle>Fluxo de Recursos por Categoria</NotionCardTitle>
          </NotionCardHeader>
          <NotionCardContent>
            <Skeleton className="h-96 w-full" />
          </NotionCardContent>
        </NotionCard>
      ) : (
        <FinancialSankeyChart data={sankeyData} height={400} />
      )}

      {/* Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <NotionCard variant="hoverable" className="transition-notion">
          <NotionCardHeader>
            <NotionCardTitle>Insights Financeiros</NotionCardTitle>
          </NotionCardHeader>
          <NotionCardContent className="space-y-4">
            {metrics.daysBelowZero === 0 ? (
              <div className="flex items-center gap-3 p-3 bg-financial-success/10 rounded-lg">
                <Shield className="h-5 w-5 text-financial-success" />
                <div>
                  <p className="text-notion-body font-medium text-financial-success">Excelente!</p>
                  <p className="text-notion-body-sm text-notion-gray-600">
                    Seu saldo permanece positivo durante todo o período
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-financial-expense/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-financial-expense" />
                <div>
                  <p className="text-notion-body font-medium text-financial-expense">Atenção necessária</p>
                  <p className="text-notion-body-sm text-notion-gray-600">
                    Seu saldo ficará negativo por {metrics.daysBelowZero} dias
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-notion-body-sm font-medium text-notion-gray-700">Saldo médio do período:</p>
              <p className="text-notion-h3 text-notion-gray-900">{formatCurrency(metrics.averageBalance)}</p>
            </div>

            {metrics.worstDayBalance < 0 && (
              <div className="space-y-2">
                <p className="text-notion-body-sm font-medium text-financial-expense">Menor saldo:</p>
                <p className="text-notion-h3 text-financial-expense">
                  {formatCurrency(metrics.worstDayBalance)} em {" "}
                  {format(parseISO(metrics.worstDayDate), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            )}
          </NotionCardContent>
        </NotionCard>

        <NotionCard variant="hoverable" className="transition-notion">
          <NotionCardHeader>
            <NotionCardTitle>Recomendações</NotionCardTitle>
          </NotionCardHeader>
          <NotionCardContent className="space-y-4">
            {metrics.riskScore === 'high' && (
              <div className="p-3 bg-financial-warning/10 rounded-lg">
                <p className="text-notion-body font-medium text-financial-warning mb-2">Revisar orçamento</p>
                <p className="text-notion-body-sm text-notion-gray-600">
                  Considere reduzir gastos ou aumentar receitas para evitar saldo negativo
                </p>
              </div>
            )}

            {metrics.trendDirection === 'up' && metrics.riskScore === 'low' && (
              <div className="p-3 bg-financial-success/10 rounded-lg">
                <p className="text-notion-body font-medium text-financial-success mb-2">Oportunidade de investimento</p>
                <p className="text-notion-body-sm text-notion-gray-600">
                  Seu saldo está crescendo. Consider alocar excedentes em investimentos
                </p>
              </div>
            )}

            {metrics.averageBalance > metrics.liquidityNow * 1.5 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-notion-body font-medium text-notion-blue mb-2">Reserva de emergência</p>
                <p className="text-notion-body-sm text-notion-gray-600">
                  Considere manter pelo menos 3-6 meses de gastos como reserva
                </p>
              </div>
            )}
          </NotionCardContent>
        </NotionCard>
      </div>
    </div>
  );
}