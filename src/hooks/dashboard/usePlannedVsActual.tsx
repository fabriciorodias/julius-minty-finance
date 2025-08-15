
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PlannedVsActualData {
  categoryName: string;
  planned: number;
  actual: number;
}

export function usePlannedVsActual(selectedMonth: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['planned-vs-actual', user?.id, selectedMonth],
    queryFn: async (): Promise<PlannedVsActualData[]> => {
      if (!user?.id) throw new Error('User not authenticated');

      const startDate = selectedMonth;
      const endDate = new Date(selectedMonth);
      endDate.setMonth(endDate.getMonth() + 1);
      const endDateStr = endDate.toISOString().slice(0, 10);

      // Get budgets for the month
      const { data: budgets, error: budgetsError } = await supabase
        .from('budgets')
        .select(`
          budgeted_amount,
          categories!inner (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('month', selectedMonth);

      if (budgetsError) throw budgetsError;

      // Get actual expenses for the month
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          amount,
          category_id,
          categories!inner (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('type', 'despesa')
        .gte('event_date', startDate)
        .lt('event_date', endDateStr);

      if (transactionsError) throw transactionsError;

      // Process data
      const categoryData: { [key: string]: PlannedVsActualData } = {};

      // Add budgeted amounts
      (budgets || []).forEach(budget => {
        const category = budget.categories as any;
        if (category) {
          categoryData[category.id] = {
            categoryName: category.name,
            planned: budget.budgeted_amount,
            actual: 0,
          };
        }
      });

      // Add actual amounts
      (transactions || []).forEach(transaction => {
        const category = transaction.categories as any;
        if (category && categoryData[category.id]) {
          categoryData[category.id].actual += transaction.amount;
        }
      });

      // Return top 5 categories by planned amount
      return Object.values(categoryData)
        .sort((a, b) => b.planned - a.planned)
        .slice(0, 5);
    },
    enabled: !!user?.id,
  });
}
