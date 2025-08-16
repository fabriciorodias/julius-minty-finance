
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface PortfolioCompositionData {
  type: string;
  value: number;
  percentage: number;
}

interface PortfolioCompositionChartProps {
  data: PortfolioCompositionData[];
  isLoading?: boolean;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];

export function PortfolioCompositionChart({ data, isLoading }: PortfolioCompositionChartProps) {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (isLoading) {
    return (
      <Card className="mint-card">
        <CardHeader>
          <CardTitle>Composição da Carteira</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="mint-card">
        <CardHeader>
          <CardTitle>Composição da Carteira</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-mint-text-secondary">
            Nenhum investimento encontrado
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mint-card">
      <CardHeader>
        <CardTitle className="text-mint-text-primary">Composição da Carteira</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={({ type, percentage }) => `${type}: ${percentage.toFixed(1)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), 'Valor']}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
