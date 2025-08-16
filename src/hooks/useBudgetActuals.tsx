
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface BudgetActual {
  category_id: string;
  category_type: 'receita' | 'despesa';
  budgeted_amount: number;
  actual_amount: number;
}

export function useBudgetActuals(selectedMonth: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['budget-actuals', user?.id, selectedMonth],
    queryFn: async (): Promise<BudgetActual[]> => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .rpc('get_monthly_budget_actuals', {
          p_month: selectedMonth
        });

      if (error) throw error;

      // Type cast the category_type to ensure it matches our interface
      return (data || []).map(item => ({
        ...item,
        category_type: item.category_type as 'receita' | 'despesa'
      }));
    },
    enabled: !!user?.id,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}
