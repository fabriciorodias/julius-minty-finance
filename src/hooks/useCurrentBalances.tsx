
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CurrentBalance {
  investment_id: string;
  current_balance: number;
  previous_balance: number;
  percentage_change: number;
}

export function useCurrentBalances(selectedMonth?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['current-balances', user?.id, selectedMonth],
    queryFn: async (): Promise<CurrentBalance[]> => {
      if (!user?.id || !selectedMonth) return [];

      // Use local date formatting to avoid UTC conversion issues
      const currentDate = new Date(selectedMonth);
      const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;

      const previousDate = new Date(currentDate);
      previousDate.setMonth(previousDate.getMonth() - 1);
      const previousMonthStr = `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, '0')}-01`;

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
    enabled: !!user?.id && !!selectedMonth,
  });
}
