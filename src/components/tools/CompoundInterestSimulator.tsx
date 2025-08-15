
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";

interface SimulationData {
  year: number;
  totalContributed: number;
  totalWithInterest: number;
  interestEarned: number;
}

export function CompoundInterestSimulator() {
  const [initialValue, setInitialValue] = useState<number>(1000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(500);
  const [annualRate, setAnnualRate] = useState<number>(12);
  const [period, setPeriod] = useState<number>(10);
  
  const [results, setResults] = useState({
    finalValue: 0,
    totalContributed: 0,
    totalInterest: 0
  });
  
  const [chartData, setChartData] = useState<SimulationData[]>([]);

  const calculateResults = () => {
    const monthlyRate = annualRate / 100 / 12;
    const totalMonths = period * 12;
    
    let balance = initialValue;
    const data: SimulationData[] = [];
    
    // Add initial year
    data.push({
      year: 0,
      totalContributed: initialValue,
      totalWithInterest: initialValue,
      interestEarned: 0
    });
    
    for (let month = 1; month <= totalMonths; month++) {
      // Add monthly contribution
      balance += monthlyContribution;
      // Apply monthly interest
      balance = balance * (1 + monthlyRate);
      
      // Add data point for each year
      if (month % 12 === 0) {
        const year = month / 12;
        const totalContributed = initialValue + (monthlyContribution * month);
        const interestEarned = balance - totalContributed;
        
        data.push({
          year,
          totalContributed,
          totalWithInterest: balance,
          interestEarned
        });
      }
    }
    
    const finalTotalContributed = initialValue + (monthlyContribution * totalMonths);
    const finalInterest = balance - finalTotalContributed;
    
    setResults({
      finalValue: balance,
      totalContributed: finalTotalContributed,
      totalInterest: finalInterest
    });
    
    setChartData(data);
  };

  useEffect(() => {
    calculateResults();
  }, [initialValue, monthlyContribution, annualRate, period]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-mint-secondary/20 rounded-lg shadow-lg">
          <p className="text-mint-text-primary font-medium">{`Ano ${label}`}</p>
          <p className="text-mint-primary">
            {`Total Aportado: ${formatCurrency(payload[0]?.value || 0)}`}
          </p>
          <p className="text-mint-accent">
            {`Total com Juros: ${formatCurrency(payload[1]?.value || 0)}`}
          </p>
          <p className="text-mint-secondary">
            {`Juros Ganhos: ${formatCurrency((payload[1]?.value || 0) - (payload[0]?.value || 0))}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column - Inputs and Results */}
      <div className="space-y-6">
        {/* Input Fields */}
        <Card className="border-mint-secondary/20">
          <CardHeader>
            <CardTitle className="text-lg text-mint-text-primary">Parâmetros da Simulação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="initial-value" className="text-mint-text-primary font-medium">
                Valor Inicial
              </Label>
              <Input
                id="initial-value"
                type="number"
                value={initialValue}
                onChange={(e) => setInitialValue(Number(e.target.value) || 0)}
                className="mint-input"
                placeholder="1000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly-contribution" className="text-mint-text-primary font-medium">
                Aporte Mensal
              </Label>
              <Input
                id="monthly-contribution"
                type="number"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value) || 0)}
                className="mint-input"
                placeholder="500"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-mint-text-primary font-medium">
                Taxa de Juros Anual: {annualRate}%
              </Label>
              <Slider
                value={[annualRate]}
                onValueChange={(value) => setAnnualRate(value[0])}
                max={30}
                min={1}
                step={0.5}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-mint-text-primary font-medium">
                Período: {period} {period === 1 ? 'ano' : 'anos'}
              </Label>
              <Slider
                value={[period]}
                onValueChange={(value) => setPeriod(value[0])}
                max={50}
                min={1}
                step={1}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="border-mint-secondary/20">
          <CardHeader>
            <CardTitle className="text-lg text-mint-text-primary">Resultados da Projeção</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-mint-primary/5 p-4 rounded-lg">
                <p className="text-sm text-mint-text-secondary">Valor Final</p>
                <p className="text-2xl font-bold text-mint-primary">
                  {formatCurrency(results.finalValue)}
                </p>
              </div>
              
              <div className="bg-mint-accent/5 p-4 rounded-lg">
                <p className="text-sm text-mint-text-secondary">Total Aportado</p>
                <p className="text-xl font-semibold text-mint-accent">
                  {formatCurrency(results.totalContributed)}
                </p>
              </div>
              
              <div className="bg-mint-secondary/5 p-4 rounded-lg">
                <p className="text-sm text-mint-text-secondary">Total em Juros</p>
                <p className="text-xl font-semibold text-mint-secondary">
                  {formatCurrency(results.totalInterest)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Chart */}
      <div>
        <Card className="border-mint-secondary/20 h-full">
          <CardHeader>
            <CardTitle className="text-lg text-mint-text-primary">Evolução do Patrimônio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <XAxis 
                    dataKey="year" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--mint-text-secondary))' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--mint-text-secondary))' }}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="totalContributed"
                    stackId="1"
                    stroke="hsl(var(--mint-primary))"
                    fill="hsl(var(--mint-primary))"
                    fillOpacity={0.6}
                    name="Total Aportado"
                  />
                  <Area
                    type="monotone"
                    dataKey="interestEarned"
                    stackId="1"
                    stroke="hsl(var(--mint-secondary))"
                    fill="hsl(var(--mint-secondary))"
                    fillOpacity={0.8}
                    name="Juros Ganhos"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
