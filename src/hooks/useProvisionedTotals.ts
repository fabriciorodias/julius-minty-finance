
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
        .select('type, amount, status, effective_date, event_date, description')
        .eq('user_id', user.id)
        .in('account_id', selectedAccountIds);

      if (allError) throw allError;

      console.log('useProvisionedTotals: All transactions', allTransactions?.length || 0);

      // Calculate completed transactions (status = 'concluido' AND has effective_date)
      const completedTransactions = (allTransactions || []).filter(t => 
        t.status === 'concluido' && t.effective_date
      );
      
      console.log('useProvisionedTotals: Completed transactions', completedTransactions.length);
      
      const completedIncome = completedTransactions
        .filter(t => t.type === 'receita')
        .reduce((sum, t) => sum + t.amount, 0);

      const completedExpense = completedTransactions
        .filter(t => t.type === 'despesa')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const completedTransactionsBalance = completedIncome - completedExpense;

      // Main balance (Saldo Total) = initial balances + completed transactions
      const completedBalance = totalInitialBalance + completedTransactionsBalance;

      console.log('useProvisionedTotals: Completed balance', completedBalance);

      // Calculate pending transactions - use event_date for date filtering if effective_date is not available
      // and apply date range filter to both event_date and effective_date
      const pendingTransactions = (allTransactions || []).filter(t => {
        if (t.status !== 'pendente') return false;
        
        const dateToCheck = t.effective_date || t.event_date;
        return dateToCheck >= startDate && dateToCheck <= endDate;
      });

      console.log('useProvisionedTotals: Pending transactions', pendingTransactions.length);
      console.log('useProvisionedTotals: Pending transactions details:', pendingTransactions);

      const pendingIncome = pendingTransactions
        .filter(t => t.type === 'receita')
        .reduce((sum, t) => sum + t.amount, 0);

      const pendingExpense = pendingTransactions
        .filter(t => t.type === 'despesa')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const pendingNet = pendingIncome - pendingExpense;

      console.log('useProvisionedTotals: Pending income', pendingIncome);
      console.log('useProvisionedTotals: Pending expense', pendingExpense);
      console.log('useProvisionedTotals: Pending net', pendingNet);

      // Provisioned balance = main balance + pending transactions
      const totalBalance = completedBalance + pendingNet;

      // Provisions = just the net pending transactions
      const provisionsAmount = pendingNet;

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
