
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, addDays, startOfDay, parseISO } from 'date-fns';

interface CashFlowDataPoint {
  date: string;
  [accountId: string]: number | string; // Account balances by ID
  total: number;
}

interface AccountInfo {
  id: string;
  name: string;
  institution: string;
  color: string;
}

interface UseCashFlowProjectionParams {
  selectedAccountIds: string[];
  dateFilters?: {
    startDate?: string;
    endDate?: string;
  };
}

export function useCashFlowProjection({ selectedAccountIds, dateFilters }: UseCashFlowProjectionParams) {
  const { user } = useAuth();

  const {
    data = { dataPoints: [], accounts: [] },
    isLoading,
  } = useQuery({
    queryKey: ['cash-flow-projection', user?.id, selectedAccountIds, dateFilters],
    queryFn: async (): Promise<{ dataPoints: CashFlowDataPoint[]; accounts: AccountInfo[] }> => {
      if (!user?.id || selectedAccountIds.length === 0) {
        return { dataPoints: [], accounts: [] };
      }

      // Get accounts info
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select(`
          id,
          name,
          institutions!inner(name)
        `)
        .eq('user_id', user.id)
        .in('id', selectedAccountIds);

      if (accountsError) throw accountsError;

      // Get initial balances
      const { data: initialBalances, error: initialError } = await supabase
        .from('account_initial_balances')
        .select('account_id, amount, balance_date')
        .eq('user_id', user.id)
        .in('account_id', selectedAccountIds);

      if (initialError) throw initialError;

      const initialBalanceMap = (initialBalances || []).reduce((acc, balance) => {
        acc[balance.account_id] = {
          amount: balance.amount,
          date: balance.balance_date
        };
        return acc;
      }, {} as Record<string, { amount: number; date: string }>);

      // Get all transactions for selected accounts
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('account_id, amount, type, status, event_date, effective_date')
        .eq('user_id', user.id)
        .in('account_id', selectedAccountIds)
        .order('event_date', { ascending: true });

      if (transactionsError) throw transactionsError;

      // Determine date range
      const startDate = dateFilters?.startDate || format(new Date(), 'yyyy-MM-dd');
      const endDate = dateFilters?.endDate || format(addDays(new Date(), 90), 'yyyy-MM-dd');

      // Generate colors for accounts
      const colors = [
        'hsl(262, 83%, 58%)', // Primary
        'hsl(346, 77%, 49%)', // Destructive
        'hsl(142, 76%, 36%)', // Success
        'hsl(38, 92%, 50%)',  // Warning
        'hsl(217, 91%, 60%)', // Info
        'hsl(280, 100%, 70%)', // Purple
        'hsl(9, 100%, 64%)',   // Red
        'hsl(173, 58%, 39%)',  // Teal
      ];

      const accounts: AccountInfo[] = (accountsData || []).map((account, index) => ({
        id: account.id,
        name: account.name,
        institution: account.institutions?.name || 'Sem instituição',
        color: colors[index % colors.length]
      }));

      // Calculate daily balances
      const dataPointsMap = new Map<string, CashFlowDataPoint>();
      
      // Initialize with start date
      const initDate = startOfDay(parseISO(startDate));
      const currentDataPoint: CashFlowDataPoint = {
        date: format(initDate, 'yyyy-MM-dd'),
        total: 0
      };

      // Set initial balances for each account
      selectedAccountIds.forEach(accountId => {
        const initialBalance = initialBalanceMap[accountId];
        
        // Calculate completed transactions up to start date
        const completedTransactions = (transactions || []).filter(t => 
          t.account_id === accountId &&
          t.status === 'concluido' &&
          t.effective_date &&
          t.effective_date < startDate
        );

        let accountBalance = initialBalance?.amount || 0;
        completedTransactions.forEach(t => {
          if (t.type === 'receita') {
            accountBalance += t.amount;
          } else {
            accountBalance -= Math.abs(t.amount);
          }
        });

        currentDataPoint[accountId] = accountBalance;
        currentDataPoint.total += accountBalance;
      });

      dataPointsMap.set(currentDataPoint.date, { ...currentDataPoint });

      // Process future transactions (from start date onwards)
      const futureTransactions = (transactions || []).filter(t => {
        const transactionDate = t.effective_date || t.event_date;
        return transactionDate >= startDate && transactionDate <= endDate;
      });

      // Sort by date
      futureTransactions.sort((a, b) => {
        const dateA = a.effective_date || a.event_date;
        const dateB = b.effective_date || b.event_date;
        return dateA.localeCompare(dateB);
      });

      // Apply transactions day by day
      futureTransactions.forEach(transaction => {
        const transactionDate = transaction.effective_date || transaction.event_date;
        
        // Get or create data point for this date
        let dataPoint = dataPointsMap.get(transactionDate);
        if (!dataPoint) {
          // Copy previous day's balances
          const previousDate = format(addDays(parseISO(transactionDate), -1), 'yyyy-MM-dd');
          const previousDataPoint = dataPointsMap.get(previousDate) || currentDataPoint;
          
          dataPoint = {
            date: transactionDate,
            total: previousDataPoint.total
          };
          
          selectedAccountIds.forEach(accountId => {
            dataPoint![accountId] = previousDataPoint[accountId] as number || 0;
          });
        }

        // Apply transaction
        const accountId = transaction.account_id!;
        const currentBalance = dataPoint[accountId] as number || 0;
        
        if (transaction.type === 'receita') {
          dataPoint[accountId] = currentBalance + transaction.amount;
          dataPoint.total += transaction.amount;
        } else {
          dataPoint[accountId] = currentBalance - Math.abs(transaction.amount);
          dataPoint.total -= Math.abs(transaction.amount);
        }

        dataPointsMap.set(transactionDate, dataPoint);
      });

      // Convert to array and fill gaps
      const dataPoints: CashFlowDataPoint[] = [];
      let currentDate = parseISO(startDate);
      const finalDate = parseISO(endDate);
      let lastDataPoint = currentDataPoint;

      while (currentDate <= finalDate) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const dataPoint = dataPointsMap.get(dateStr) || { ...lastDataPoint, date: dateStr };
        dataPoints.push(dataPoint);
        lastDataPoint = dataPoint;
        currentDate = addDays(currentDate, 1);
      }

      return { dataPoints, accounts };
    },
    enabled: !!user?.id && selectedAccountIds.length > 0,
  });

  return {
    dataPoints: data.dataPoints,
    accounts: data.accounts,
    isLoading,
  };
}
