
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
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CashFlowDataPoint } from '@/lib/cashflow-sim';

interface CashFlowChartBaseProps {
  data: CashFlowDataPoint[];
  scenarioData?: CashFlowDataPoint[];
  showScenario?: boolean;
  height?: number;
  showBrush?: boolean;
  chartConfig: Record<string, any>;
}

export function CashFlowChartBase({ 
  data, 
  scenarioData, 
  showScenario = false,
  height = 400,
  showBrush = false,
  chartConfig 
}: CashFlowChartBaseProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const isValidDateString = (dateStr: any): dateStr is string => {
    if (!dateStr || typeof dateStr !== 'string') return false;
    
    // Check basic date format (YYYY-MM-DD)
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(dateStr)) return false;
    
    try {
      const parsedDate = parseISO(dateStr);
      return isValid(parsedDate);
    } catch {
      return false;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!isValidDateString(dateStr)) {
      console.warn('Invalid date in formatDate:', dateStr);
      return 'Data Inválida';
    }
    
    try {
      const parsedDate = parseISO(dateStr);
      return format(parsedDate, 'dd/MM', { locale: ptBR });
    } catch (error) {
      console.warn('Error formatting date:', dateStr, error);
      return 'Data Inválida';
    }
  };

  const formatDateLong = (dateStr: string) => {
    if (!isValidDateString(dateStr)) {
      console.warn('Invalid date in formatDateLong:', dateStr);
      return 'Data Inválida';
    }
    
    try {
      const parsedDate = parseISO(dateStr);
      return format(parsedDate, 'dd/MM/yyyy', { locale: ptBR });
    } catch (error) {
      console.warn('Error formatting long date:', dateStr, error);
      return 'Data Inválida';
    }
  };

  // Validate and filter data to ensure all dates are valid
  const validData = data.filter(d => {
    if (!isValidDateString(d.date)) {
      console.warn('Invalid date found in data:', d);
      return false;
    }
    return true;
  });

  const validScenarioData = scenarioData?.filter(d => {
    if (!isValidDateString(d.date)) {
      console.warn('Invalid date found in scenario data:', d);
      return false;
    }
    return true;
  });

  // If no valid data, return empty state
  if (validData.length === 0) {
    return (
      <ChartContainer config={chartConfig} className="h-full">
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>Nenhum dado válido para exibir</p>
        </div>
      </ChartContainer>
    );
  }

  // Calculate min and max values for better scaling
  const allValues = [
    ...validData.map(d => d.total),
    ...(validScenarioData?.map(d => d.total) || [])
  ];
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const padding = (maxValue - minValue) * 0.1;

  // Split data into positive and negative segments
  const positiveData = validData.map(d => ({
    ...d,
    total: d.total >= 0 ? d.total : 0,
    originalTotal: d.total
  }));

  const negativeData = validData.map(d => ({
    ...d,
    total: d.total < 0 ? d.total : 0,
    originalTotal: d.total
  }));

  // Safe tick formatter that handles any potential invalid dates
  const safeTickFormatter = (value: any) => {
    if (!value) return '';
    return formatDate(String(value));
  };

  return (
    <ChartContainer config={chartConfig} className="h-full">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={validData} margin={{ top: 20, right: 30, left: 20, bottom: showBrush ? 80 : 40 }}>
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
            tickFormatter={safeTickFormatter}
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tickFormatter={(value) => formatCurrency(value).replace('R$', '').trim()}
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            domain={[minValue - padding, maxValue + padding]}
          />

          {/* Zero line */}
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

          {/* Positive area (above zero) */}
          <Area
            type="monotone"
            data={positiveData}
            dataKey="total"
            stroke="hsl(142, 76%, 36%)"
            strokeWidth={0}
            fill="url(#positiveGradient)"
            dot={false}
          />

          {/* Negative area (below zero) */}
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
          {showScenario && validScenarioData && validScenarioData.length > 0 && (
            <Line
              type="monotone"
              dataKey="total"
              data={validScenarioData}
              stroke="hsl(38, 92%, 50%)"
              strokeWidth={2}
              strokeDasharray="8 4"
              dot={false}
            />
          )}

          {/* Brush for zooming */}
          {showBrush && (
            <Brush
              dataKey="date"
              height={30}
              stroke="hsl(var(--primary))"
              tickFormatter={safeTickFormatter}
              startIndex={0}
              endIndex={Math.min(validData.length - 1, 30)}
            />
          )}

          <ChartTooltip 
            content={({ active, payload, label }) => {
              if (!active || !payload?.length || !label) return null;
              
              // Safely handle the label which might be invalid
              if (!isValidDateString(label)) {
                return null;
              }
              
              const mainData = payload.find(p => p.dataKey === 'total');
              const scenarioValue = showScenario && validScenarioData ? 
                validScenarioData.find(d => d.date === label)?.total : null;
              
              return (
                <div className="bg-background border rounded-lg shadow-lg p-4 min-w-[200px]">
                  <p className="font-medium mb-3">
                    {formatDateLong(label)}
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
                    
                    {scenarioValue !== null && (
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
                    
                    {scenarioValue !== null && mainData && (
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
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
