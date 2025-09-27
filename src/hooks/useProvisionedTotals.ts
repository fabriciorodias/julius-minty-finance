
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

      console.log('useProvisionedTotals: Date range', { startDate, endDate });
      console.log('useProvisionedTotals: Selected accounts', selectedAccountIds);

      // Get initial balances for selected accounts
      const { data: initialBalances, error: initialError } = await supabase
        .from('account_initial_balances')
        .select('account_id, amount')
        .eq('user_id', user.id)
        .in('account_id', selectedAccountIds);

      if (initialError) throw initialError;

      const initialBalanceMap = (initialBalances || []).reduce((acc, balance) => {
        acc[balance.account_id] = balance.amount;
        return acc;
      }, {} as Record<string, number>);

      const totalInitialBalance = selectedAccountIds.reduce((sum, accountId) => {
        return sum + (initialBalanceMap[accountId] || 0);
      }, 0);

      console.log('useProvisionedTotals: Initial balance', totalInitialBalance);

      // Get all transactions for selected accounts
      const { data: allTransactions, error: allError } = await supabase
        .from('transactions')
        .select('type, amount, event_date, description')
        .eq('user_id', user.id)
        .in('account_id', selectedAccountIds);

      if (allError) throw allError;

      console.log('useProvisionedTotals: All transactions', allTransactions?.length || 0);

      // All transactions are effective now, so we calculate the completed balance
      console.log('useProvisionedTotals: All transactions', allTransactions?.length || 0);
      
      const completedIncome = (allTransactions || [])
        .filter(t => t.type === 'receita')
        .reduce((sum, t) => sum + t.amount, 0);

      const completedExpense = (allTransactions || [])
        .filter(t => t.type === 'despesa')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const completedTransactionsBalance = completedIncome - completedExpense;

      // Main balance (Saldo Total) = initial balances + all transactions
      const completedBalance = totalInitialBalance + completedTransactionsBalance;

      console.log('useProvisionedTotals: Completed balance', completedBalance);

      // Since all transactions are effective, there are no pending transactions
      // But we can still show projections based on recurring transactions if needed
      const pendingIncome = 0;
      const pendingExpense = 0;
      const pendingNet = 0;

      console.log('useProvisionedTotals: Pending income', pendingIncome);
      console.log('useProvisionedTotals: Pending expense', pendingExpense);
      console.log('useProvisionedTotals: Pending net', pendingNet);

      // Total balance = completed balance (no pending transactions)
      const totalBalance = completedBalance;

      // No provisions since all transactions are effective
      const provisionsAmount = 0;

      console.log('useProvisionedTotals: Final results', {
        completedBalance,
        totalBalance,
        provisionsAmount,
        pendingIncome,
        pendingExpense
      });

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
