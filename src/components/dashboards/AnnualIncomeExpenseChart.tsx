
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { MonthlyData } from "@/hooks/dashboard/useMonthlyBalance";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AnnualIncomeExpenseChartProps {
  data: MonthlyData[];
  isLoading?: boolean;
}

export function AnnualIncomeExpenseChart({ data, isLoading }: AnnualIncomeExpenseChartProps) {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatMonth = (monthString: string) => {
    const date = new Date(monthString + '-01');
    return format(date, 'MMM', { locale: ptBR });
  };

  const chartData = data.map(item => ({
    ...item,
    monthLabel: formatMonth(item.month),
  }));

  if (isLoading) {
    return (
      <Card className="mint-card">
        <CardHeader>
          <CardTitle>Evolução Anual - Receitas vs Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mint-card">
      <CardHeader>
        <CardTitle className="text-mint-text-primary">Evolução Anual - Receitas vs Despesas</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="monthLabel" />
            <YAxis tickFormatter={formatCurrency} />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), '']}
              labelFormatter={(label) => `Mês: ${label}`}
            />
            <Legend />
            <Bar 
              dataKey="income" 
              fill="hsl(var(--primary))" 
              name="Receitas"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="expenses" 
              fill="hsl(var(--destructive))" 
              name="Despesas"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
