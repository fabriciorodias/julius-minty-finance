
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ExpenseDistributionData {
  categoryName: string;
  amount: number;
  percentage: number;
  color: string;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function useExpenseDistribution(selectedMonth: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['expense-distribution', user?.id, selectedMonth],
    queryFn: async (): Promise<ExpenseDistributionData[]> => {
      if (!user?.id) throw new Error('User not authenticated');

      const startDate = selectedMonth;
      const endDate = new Date(selectedMonth);
      endDate.setMonth(endDate.getMonth() + 1);
      const endDateStr = endDate.toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          amount,
          categories (
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('type', 'despesa')
        .gte('event_date', startDate)
        .lt('event_date', endDateStr);

      if (error) throw error;

      // Group by category
      const categoryTotals: { [key: string]: number } = {};
      let totalExpenses = 0;

      (data || []).forEach(transaction => {
        const categoryName = transaction.categories?.name || 'Sem Categoria';
        categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + transaction.amount;
        totalExpenses += transaction.amount;
      });

      // Convert to array and calculate percentages
      const result = Object.entries(categoryTotals)
        .map(([categoryName, amount], index) => ({
          categoryName,
          amount,
          percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
          color: COLORS[index % COLORS.length],
        }))
        .sort((a, b) => b.amount - a.amount);

      return result;
    },
    enabled: !!user?.id,
  });
}
