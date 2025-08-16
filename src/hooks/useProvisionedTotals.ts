
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, addDays } from 'date-fns';

interface ProvisionedTotals {
  pendingIncome: number;
  pendingExpense: number;
  pendingNet: number;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

interface UseProvisionedTotalsParams {
  selectedAccountIds: string[];
  dateFilters?: {
    startDate?: string;
    endDate?: string;
  };
}

export function useProvisionedTotals({ selectedAccountIds, dateFilters }: UseProvisionedTotalsParams) {
  const { user } = useAuth();

  const {
    data: totals = {
      pendingIncome: 0,
      pendingExpense: 0,
      pendingNet: 0,
      dateRange: { startDate: '', endDate: '' }
    },
    isLoading,
  } = useQuery({
    queryKey: ['provisioned-totals', user?.id, selectedAccountIds, dateFilters],
    queryFn: async (): Promise<ProvisionedTotals> => {
      if (!user?.id || selectedAccountIds.length === 0) {
        const today = format(new Date(), 'yyyy-MM-dd');
        const futureDate = format(addDays(new Date(), 90), 'yyyy-MM-dd');
        return {
          pendingIncome: 0,
          pendingExpense: 0,
          pendingNet: 0,
          dateRange: { startDate: today, endDate: futureDate }
        };
      }

      // Determine date range - use filters if provided, otherwise use today to +90 days
      const startDate = dateFilters?.startDate || format(new Date(), 'yyyy-MM-dd');
      const endDate = dateFilters?.endDate || format(addDays(new Date(), 90), 'yyyy-MM-dd');

      let query = supabase
        .from('transactions')
        .select('type, amount')
        .eq('user_id', user.id)
        .eq('status', 'pendente')
        .in('account_id', selectedAccountIds)
        .gte('effective_date', startDate)
        .lte('effective_date', endDate);

      const { data, error } = await query;

      if (error) throw error;

      // Calculate totals
      const pendingIncome = (data || [])
        .filter(t => t.type === 'receita')
        .reduce((sum, t) => sum + t.amount, 0);

      const pendingExpense = (data || [])
        .filter(t => t.type === 'despesa')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const pendingNet = pendingIncome - pendingExpense;

      return {
        pendingIncome,
        pendingExpense,
        pendingNet,
        dateRange: { startDate, endDate }
      };
    },
    enabled: !!user?.id && selectedAccountIds.length > 0,
  });

  return {
    ...totals,
    isLoading,
  };
}
