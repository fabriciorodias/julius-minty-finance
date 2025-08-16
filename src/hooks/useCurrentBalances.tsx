
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CurrentBalance {
  investment_id: string;
  current_balance: number;
  previous_balance: number;
  percentage_change: number;
}

export function useCurrentBalances() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['current-balances', user?.id],
    queryFn: async (): Promise<CurrentBalance[]> => {
      if (!user?.id) return [];

      const currentMonth = new Date();
      currentMonth.setDate(1);
      const currentMonthStr = currentMonth.toISOString().split('T')[0];

      const previousMonth = new Date(currentMonth);
      previousMonth.setMonth(previousMonth.getMonth() - 1);
      const previousMonthStr = previousMonth.toISOString().split('T')[0];

      // Get current month balances
      const { data: currentBalances, error: currentError } = await supabase
        .from('investment_balances')
        .select('investment_id, balance')
        .eq('user_id', user.id)
        .eq('month', currentMonthStr);

      if (currentError) throw currentError;

      // Get previous month balances
      const { data: previousBalances, error: previousError } = await supabase
        .from('investment_balances')
        .select('investment_id, balance')
        .eq('user_id', user.id)
        .eq('month', previousMonthStr);

      if (previousError) throw previousError;

      // Combine and calculate percentage changes
      const result: CurrentBalance[] = [];
      
      currentBalances?.forEach(current => {
        const previous = previousBalances?.find(p => p.investment_id === current.investment_id);
        const currentBalance = Number(current.balance);
        const previousBalance = previous ? Number(previous.balance) : 0;
        const percentageChange = previousBalance > 0 
          ? ((currentBalance - previousBalance) / previousBalance) * 100 
          : 0;

        result.push({
          investment_id: current.investment_id,
          current_balance: currentBalance,
          previous_balance: previousBalance,
          percentage_change: percentageChange,
        });
      });

      return result;
    },
    enabled: !!user?.id,
  });
}
