
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MonthlyBalance {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

export function useMonthlyBalance(selectedMonth: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['monthly-balance', user?.id, selectedMonth],
    queryFn: async (): Promise<MonthlyBalance> => {
      if (!user?.id) throw new Error('User not authenticated');

      // Use local date formatting to avoid UTC conversion issues
      const currentDate = new Date(selectedMonth);
      const startDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
      
      const nextMonth = new Date(currentDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const endDate = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;

      const { data, error } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('user_id', user.id)
        .gte('event_date', startDate)
        .lt('event_date', endDate);

      if (error) throw error;

      const totalIncome = (data || [])
        .filter(t => t.type === 'receita')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpenses = (data || [])
        .filter(t => t.type === 'despesa')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
      };
    },
    enabled: !!user?.id,
  });
}

export function useAnnualData(year: number) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['annual-data', user?.id, year],
    queryFn: async (): Promise<MonthlyData[]> => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('transactions')
        .select('type, amount, event_date')
        .eq('user_id', user.id)
        .gte('event_date', `${year}-01-01`)
        .lte('event_date', `${year}-12-31`);

      if (error) throw error;

      const monthlyData: { [key: string]: MonthlyData } = {};

      for (let month = 1; month <= 12; month++) {
        const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
        monthlyData[monthKey] = {
          month: monthKey,
          income: 0,
          expenses: 0,
        };
      }

      (data || []).forEach(transaction => {
        const monthKey = transaction.event_date.slice(0, 7);
        if (monthlyData[monthKey]) {
          if (transaction.type === 'receita') {
            monthlyData[monthKey].income += transaction.amount;
          } else {
            monthlyData[monthKey].expenses += transaction.amount;
          }
        }
      });

      return Object.values(monthlyData);
    },
    enabled: !!user?.id,
  });
}
