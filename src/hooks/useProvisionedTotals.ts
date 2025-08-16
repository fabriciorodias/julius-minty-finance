
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, addDays } from 'date-fns';

interface ProvisionedTotals {
  pendingIncome: number;
  pendingExpense: number;
  pendingNet: number;
  completedBalance: number;
  totalBalance: number;
  provisionsAmount: number;
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
      completedBalance: 0,
      totalBalance: 0,
      provisionsAmount: 0,
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
          completedBalance: 0,
          totalBalance: 0,
          provisionsAmount: 0,
          dateRange: { startDate: today, endDate: futureDate }
        };
      }

      // Determine date range - use filters if provided, otherwise use today to +90 days
      const startDate = dateFilters?.startDate || format(new Date(), 'yyyy-MM-dd');
      const endDate = dateFilters?.endDate || format(addDays(new Date(), 90), 'yyyy-MM-dd');

      // Get all transactions (both pending and completed) within date range
      let allTransactionsQuery = supabase
        .from('transactions')
        .select('type, amount, status, effective_date')
        .eq('user_id', user.id)
        .in('account_id', selectedAccountIds)
        .gte('effective_date', startDate)
        .lte('effective_date', endDate);

      const { data: allTransactions, error: allError } = await allTransactionsQuery;
      if (allError) throw allError;

      // Calculate pending transactions (status = 'pendente')
      const pendingTransactions = (allTransactions || []).filter(t => t.status === 'pendente');
      const pendingIncome = pendingTransactions
        .filter(t => t.type === 'receita')
        .reduce((sum, t) => sum + t.amount, 0);

      const pendingExpense = pendingTransactions
        .filter(t => t.type === 'despesa')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const pendingNet = pendingIncome - pendingExpense;

      // Calculate completed transactions balance (status = 'concluido' AND has effective_date)
      const completedTransactions = (allTransactions || []).filter(t => 
        t.status === 'concluido' && t.effective_date
      );
      
      const completedIncome = completedTransactions
        .filter(t => t.type === 'receita')
        .reduce((sum, t) => sum + t.amount, 0);

      const completedExpense = completedTransactions
        .filter(t => t.type === 'despesa')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const completedBalance = completedIncome - completedExpense;

      // Calculate total balance (all transactions regardless of status)
      const totalIncome = (allTransactions || [])
        .filter(t => t.type === 'receita')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpense = (allTransactions || [])
        .filter(t => t.type === 'despesa')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const totalBalance = totalIncome - totalExpense;

      // Provisions is the difference between total and completed
      const provisionsAmount = totalBalance - completedBalance;

      return {
        pendingIncome,
        pendingExpense,
        pendingNet,
        completedBalance,
        totalBalance,
        provisionsAmount,
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
