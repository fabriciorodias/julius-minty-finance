
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Area, 
  AreaChart,
  ReferenceArea,
  ReferenceLine,
  Brush
} from 'recharts';
import { CashFlowDataPoint } from '@/lib/cashflow-sim';
import { 
  isValidDateString, 
  safeFormatDate, 
  safeFormatDateLong, 
  ultraSafeTickFormatter,
  safeCurrencyFormatter 
} from '@/lib/date-utils';
import { useState } from 'react';

interface CashFlowChartBaseProps {
  data: CashFlowDataPoint[];
  scenarioData?: CashFlowDataPoint[];
  showScenario?: boolean;
  height?: number;
  chartConfig: Record<string, any>;
}

export function CashFlowChartBase({ 
  data, 
  scenarioData, 
  showScenario = false,
  height = 400,
  chartConfig
}: CashFlowChartBaseProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Comprehensive data point validation
  const isValidDataPoint = (item: any): item is CashFlowDataPoint => {
    if (!item || typeof item !== 'object') return false;
    if (!isValidDateString(item.date)) return false;
    if (typeof item.total !== 'number' || !isFinite(item.total)) return false;
    return true;
  };

  // Filter and validate all data upfront
  const safeData = Array.isArray(data) ? data.filter(item => {
    const isValid = isValidDataPoint(item);
    if (!isValid) {
      console.warn('Filtering out invalid data point:', item);
    }
    return isValid;
  }) : [];

  // Use all safe data for display
  const displayData = safeData;

  const safeScenarioData = Array.isArray(scenarioData) ? scenarioData.filter(item => {
    const isValid = isValidDataPoint(item);
    if (!isValid) {
      console.warn('Filtering out invalid scenario data point:', item);
    }
    return isValid;
  }) : [];

  // If no valid data, return empty state immediately
  if (safeData.length === 0) {
    return (
      <ChartContainer config={chartConfig} className="h-full">
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <p className="text-lg mb-2">📊</p>
            <p>Nenhum dado válido para exibir</p>
            <p className="text-sm mt-1">Verifique se os dados possuem datas e valores válidos</p>
          </div>
        </div>
      </ChartContainer>
    );
  }

  // Calculate chart bounds safely using display data
  const allValues = [
    ...displayData.map(d => d.total),
    ...(safeScenarioData.map(d => d.total) || [])
  ];
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const padding = Math.abs(maxValue - minValue) * 0.1 || 100; // Fallback padding

  // Create positive and negative data sets
  const positiveData = displayData.map(d => ({
    ...d,
    total: d.total >= 0 ? d.total : 0,
    originalTotal: d.total
  }));

  const negativeData = displayData.map(d => ({
    ...d,
    total: d.total < 0 ? d.total : 0,
    originalTotal: d.total
  }));


  return (
    <ChartContainer config={chartConfig} className="h-full">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart 
          data={displayData} 
          margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
        >
          <defs>
            <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.8}/>
              <stop offset="30%" stopColor="hsl(150, 70%, 45%)" stopOpacity={0.6}/>
              <stop offset="70%" stopColor="hsl(158, 64%, 52%)" stopOpacity={0.3}/>
              <stop offset="100%" stopColor="hsl(174, 100%, 33%)" stopOpacity={0.1}/>
            </linearGradient>
            <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(346, 77%, 49%)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(346, 77%, 49%)" stopOpacity={0.05}/>
            </linearGradient>
          </defs>

          <XAxis 
            dataKey="date" 
            tickFormatter={ultraSafeTickFormatter}
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tickFormatter={safeCurrencyFormatter}
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            domain={[minValue - padding, maxValue + padding]}
          />

          {/* Zero reference line */}
          <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />

          {/* Negative area highlighting */}
          {minValue < 0 && (
            <ReferenceArea
              y1={Math.min(minValue - padding, -100)}
              y2={0}
              fill="hsl(346, 77%, 49%)"
              fillOpacity={0.05}
            />
          )}

          {/* Positive area */}
          <Area
            type="monotone"
            data={positiveData}
            dataKey="total"
            stroke="hsl(142, 76%, 36%)"
            strokeWidth={0}
            fill="url(#positiveGradient)"
            dot={false}
          />

          {/* Negative area */}
          <Area
            type="monotone"
            data={negativeData}
            dataKey="total"
            stroke="hsl(346, 77%, 49%)"
            strokeWidth={0}
            fill="url(#negativeGradient)"
            dot={false}
          />

          {/* Main line */}
          <Line
            type="monotone"
            dataKey="total"
            stroke="hsl(142, 76%, 36%)"
            strokeWidth={3}
            dot={false}
          />

          {/* Scenario line */}
          {showScenario && safeScenarioData.length > 0 && (
            <Line
              type="monotone"
              dataKey="total"
              data={safeScenarioData}
              stroke="hsl(38, 92%, 50%)"
              strokeWidth={2}
              strokeDasharray="8 4"
              dot={false}
            />
          )}


          <ChartTooltip 
            content={({ active, payload, label }) => {
              try {
                if (!active || !payload?.length || !label) return null;
                
                // Extra validation for tooltip label
                if (!isValidDateString(label)) {
                  console.warn('Invalid tooltip label:', label);
                  return null;
                }
                
                const mainData = payload.find(p => p.dataKey === 'total');
                const scenarioValue = showScenario && safeScenarioData.length > 0 ? 
                  safeScenarioData.find(d => d.date === label)?.total : null;
                
                const formattedDate = safeFormatDateLong(label, 'PPP');
                if (!formattedDate) {
                  console.warn('Could not format tooltip date:', label);
                  return null;
                }
                
                return (
                  <div className="bg-background border rounded-lg shadow-lg p-4 min-w-[200px]">
                    <p className="font-medium mb-3">
                      {formattedDate}
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-0.5 rounded bg-primary"/>
                          <span className="text-sm">Saldo Real</span>
                        </div>
                        <span className={`font-medium ${
                          (mainData?.value as number || 0) < 0 ? 'text-destructive' : 'text-green-600'
                        }`}>
                          {formatCurrency(mainData?.value as number || 0)}
                        </span>
                      </div>
                      
                      {scenarioValue !== null && scenarioValue !== undefined && (
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-0.5 rounded bg-yellow-500" style={{ borderTop: '2px dashed' }}/>
                            <span className="text-sm">Cenário</span>
                          </div>
                          <span className={`font-medium ${
                            scenarioValue < 0 ? 'text-destructive' : 'text-green-600'
                          }`}>
                            {formatCurrency(scenarioValue)}
                          </span>
                        </div>
                      )}
                      
                      {scenarioValue !== null && scenarioValue !== undefined && mainData && (
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="text-sm text-muted-foreground">Diferença:</span>
                          <span className={`font-medium text-sm ${
                            (scenarioValue - (mainData.value as number)) >= 0 ? 'text-green-600' : 'text-destructive'
                          }`}>
                            {(scenarioValue - (mainData.value as number)) >= 0 ? '+' : ''}
                            {formatCurrency(scenarioValue - (mainData.value as number))}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              } catch (error) {
                console.warn('Tooltip rendering error:', error);
                return null;
              }
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
