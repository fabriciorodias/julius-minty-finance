
import { NotionCard, NotionCardContent, NotionCardHeader, NotionCardTitle } from "@/components/ui/notion-card";
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
      <NotionCard variant="muted" className="transition-notion">
        <NotionCardHeader>
          <NotionCardTitle>Distribuição de Despesas</NotionCardTitle>
        </NotionCardHeader>
        <NotionCardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-notion-blue"></div>
          </div>
        </NotionCardContent>
      </NotionCard>
    );
  }

  if (data.length === 0) {
    return (
      <NotionCard variant="muted" className="transition-notion">
        <NotionCardHeader>
          <NotionCardTitle>Distribuição de Despesas</NotionCardTitle>
        </NotionCardHeader>
        <NotionCardContent>
          <div className="h-80 flex items-center justify-center text-notion-gray-600">
            Nenhuma despesa encontrada para este período
          </div>
        </NotionCardContent>
      </NotionCard>
    );
  }

  return (
    <NotionCard variant="hoverable" className="transition-notion">
      <NotionCardHeader>
        <NotionCardTitle>Distribuição de Despesas</NotionCardTitle>
      </NotionCardHeader>
      <NotionCardContent>
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
      </NotionCardContent>
    </NotionCard>
  );
}
