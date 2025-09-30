
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { ExpenseDistributionData } from "@/hooks/dashboard/useExpenseDistribution";

interface ExpenseDistributionPieProps {
  data: ExpenseDistributionData[];
  isLoading?: boolean;
}

export function ExpenseDistributionPie({ data, isLoading }: ExpenseDistributionPieProps) {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (isLoading) {
    return (
      <Card className="mint-card">
        <CardHeader>
          <CardTitle>Distribuição de Despesas</CardTitle>
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
          <CardTitle>Distribuição de Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-mint-text-secondary">
            Nenhuma despesa encontrada para este período
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="liquid-glass-primary rounded-2xl shadow-origin hover-lift-origin origin-transition animate-fade-in">
      <div className="p-6 pb-4">
        <h3 className="text-origin-title">Distribuição de Despesas</h3>
      </div>
      <div className="px-6 pb-6">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="amount"
              label={({ categoryName, percentage }) => `${categoryName}: ${percentage.toFixed(1)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), 'Valor']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
