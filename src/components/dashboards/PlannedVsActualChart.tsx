
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { PlannedVsActualData } from "@/hooks/dashboard/usePlannedVsActual";

interface PlannedVsActualChartProps {
  data: PlannedVsActualData[];
  isLoading?: boolean;
}

export function PlannedVsActualChart({ data, isLoading }: PlannedVsActualChartProps) {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (isLoading) {
    return (
      <Card className="mint-card">
        <CardHeader>
          <CardTitle>Planejado vs Realizado</CardTitle>
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
          <CardTitle>Planejado vs Realizado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-mint-text-secondary">
            Nenhum orçamento encontrado para este período
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mint-card">
      <CardHeader>
        <CardTitle className="text-mint-text-primary">Planejado vs Realizado</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={formatCurrency} />
            <YAxis dataKey="categoryName" type="category" width={100} />
            <Tooltip 
              formatter={(value: number) => [formatCurrency(value), '']}
            />
            <Legend />
            <Bar 
              dataKey="planned" 
              fill="hsl(var(--chart-1))" 
              name="Planejado"
              radius={[0, 2, 2, 0]}
            />
            <Bar 
              dataKey="actual" 
              fill="hsl(var(--chart-2))" 
              name="Realizado"
              radius={[0, 2, 2, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
