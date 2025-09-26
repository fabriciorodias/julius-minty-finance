
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
  sampleSize?: number; // For performance optimization on long periods
  includeRecurring?: boolean;
}

export function useCashFlowProjection({ 
  selectedAccountIds, 
  dateFilters,
  sampleSize,
  includeRecurring = false
}: UseCashFlowProjectionParams) {
  const { user } = useAuth();

  const {
    data = { dataPoints: [], accounts: [] },
    isLoading,
  } = useQuery({
    queryKey: ['cash-flow-projection', user?.id, selectedAccountIds, dateFilters, sampleSize, includeRecurring],
    queryFn: async (): Promise<{ dataPoints: CashFlowDataPoint[]; accounts: AccountInfo[] }> => {
      if (!user?.id || selectedAccountIds.length === 0) {
        return { dataPoints: [], accounts: [] };
      }

      console.log('=== Cash Flow Projection Debug ===');
      console.log('Selected accounts:', selectedAccountIds);
      console.log('Date filters:', dateFilters);

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

      console.log('Initial balances:', initialBalanceMap);

      // Get all transactions for selected accounts
      const { data: allTransactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('account_id, amount, type, status, event_date, effective_date, description')
        .eq('user_id', user.id)
        .in('account_id', selectedAccountIds)
        .order('event_date', { ascending: true });

      if (transactionsError) throw transactionsError;

      console.log('All transactions:', allTransactions?.length || 0);

      // Determine date range
      const startDate = dateFilters?.startDate || format(new Date(), 'yyyy-MM-dd');
      const endDate = dateFilters?.endDate || format(addDays(new Date(), 90), 'yyyy-MM-dd');

      console.log('Date range:', { startDate, endDate });

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

      // Calculate current balance for each account (initial + all completed transactions)
      const currentAccountBalances: Record<string, number> = {};
      
      selectedAccountIds.forEach(accountId => {
        const initialBalance = initialBalanceMap[accountId];
        let accountBalance = initialBalance?.amount || 0;

        // Add all completed transactions (this gives us the current "Saldo Total")
        const completedTransactions = (allTransactions || []).filter(t => 
          t.account_id === accountId &&
          t.status === 'concluido' &&
          t.effective_date
        );

        completedTransactions.forEach(t => {
          // Normalize transaction signs based on type
          if (t.type === 'receita') {
            accountBalance += Math.abs(t.amount);
          } else {
            accountBalance -= Math.abs(t.amount);
          }
        });

        currentAccountBalances[accountId] = accountBalance;
        console.log(`Account ${accountId} current balance:`, accountBalance);
      });

      const totalCurrentBalance = Object.values(currentAccountBalances).reduce((sum, balance) => sum + balance, 0);
      console.log('Total current balance (should match Saldo Total):', totalCurrentBalance);

      // Initialize the data points map with the starting date and current balances
      const dataPointsMap = new Map<string, CashFlowDataPoint>();
      
      const initDate = startOfDay(parseISO(startDate));
      const initialDataPoint: CashFlowDataPoint = {
        date: format(initDate, 'yyyy-MM-dd'),
        total: totalCurrentBalance
      };

      // Set current balance for each account as the starting point
      selectedAccountIds.forEach(accountId => {
        initialDataPoint[accountId] = currentAccountBalances[accountId];
      });

      dataPointsMap.set(initialDataPoint.date, { ...initialDataPoint });

      // Now process only PENDING transactions within the date range
      const pendingTransactions = (allTransactions || []).filter(t => {
        if (t.status !== 'pendente') return false;
        
        const transactionDate = t.effective_date || t.event_date;
        return transactionDate >= startDate && transactionDate <= endDate;
      });

      console.log('Pending transactions in range:', pendingTransactions.length);
      console.log('Pending transactions:', pendingTransactions);

      // Get recurring transactions if requested
      let recurringTransactions: any[] = [];
      if (includeRecurring) {
        const { data: recurringData, error: recurringError } = await supabase
          .from('recurring_transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active');

        if (recurringError) {
          console.error('Error fetching recurring transactions:', recurringError);
        } else {
          // Filter by selected accounts (including those with null account_id)
          recurringTransactions = (recurringData || []).filter(rt => 
            !rt.account_id || selectedAccountIds.includes(rt.account_id)
          );
          
          console.log('Recurring transactions:', recurringTransactions.length);
        }
      }

      // Generate recurring transaction occurrences
      const generatedRecurringTransactions: any[] = [];
      if (includeRecurring && recurringTransactions.length > 0) {
        recurringTransactions.forEach(rt => {
          const occurrences = generateRecurringOccurrences(rt, startDate, endDate);
          generatedRecurringTransactions.push(...occurrences);
        });
        
        console.log('Generated recurring occurrences:', generatedRecurringTransactions.length);
      }

      // Combine pending and recurring transactions
      const allFutureTransactions = [
        ...pendingTransactions,
        ...generatedRecurringTransactions
      ];

      // Sort all future transactions by date
      allFutureTransactions.sort((a, b) => {
        const dateA = a.effective_date || a.event_date;
        const dateB = b.effective_date || b.event_date;
        return dateA.localeCompare(dateB);
      });

      // Apply all future transactions day by day
      allFutureTransactions.forEach(transaction => {
        const transactionDate = transaction.effective_date || transaction.event_date;
        
        console.log(`Processing transaction on ${transactionDate}:`, {
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.type,
          account_id: transaction.account_id
        });
        
        // Get or create data point for this date
        let dataPoint = dataPointsMap.get(transactionDate);
        if (!dataPoint) {
          // Copy previous day's balances
          const allDates = Array.from(dataPointsMap.keys()).sort();
          const lastDate = allDates[allDates.length - 1];
          const previousDataPoint = dataPointsMap.get(lastDate) || initialDataPoint;
          
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
        
        // Normalize transaction signs based on type
        if (transaction.type === 'receita') {
          const newBalance = currentBalance + Math.abs(transaction.amount);
          dataPoint[accountId] = newBalance;
          dataPoint.total += Math.abs(transaction.amount);
          console.log(`Added income ${Math.abs(transaction.amount)} to account ${accountId}, new balance: ${newBalance}`);
        } else {
          const newBalance = currentBalance - Math.abs(transaction.amount);
          dataPoint[accountId] = newBalance;
          dataPoint.total -= Math.abs(transaction.amount);
          console.log(`Subtracted expense ${Math.abs(transaction.amount)} from account ${accountId}, new balance: ${newBalance}`);
        }

        dataPointsMap.set(transactionDate, dataPoint);
      });

      // Convert to array and fill gaps
      const dataPoints: CashFlowDataPoint[] = [];
      let currentDate = parseISO(startDate);
      const finalDate = parseISO(endDate);
      let lastDataPoint = initialDataPoint;

      while (currentDate <= finalDate) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const dataPoint = dataPointsMap.get(dateStr) || { ...lastDataPoint, date: dateStr };
        dataPoints.push(dataPoint);
        lastDataPoint = dataPoint;
        currentDate = addDays(currentDate, 1);
      }

      // Apply sampling if needed for performance (for long periods like 12 months)
      let finalDataPoints = dataPoints;
      if (sampleSize && dataPoints.length > sampleSize) {
        const step = Math.floor(dataPoints.length / sampleSize);
        finalDataPoints = dataPoints.filter((_, index) => index % step === 0);
        // Always include the last point
        if (finalDataPoints[finalDataPoints.length - 1] !== dataPoints[dataPoints.length - 1]) {
          finalDataPoints.push(dataPoints[dataPoints.length - 1]);
        }
      }

      console.log('Final data points:', finalDataPoints.slice(0, 5)); // Log first 5 points
      console.log('Starting balance:', finalDataPoints[0]?.total);
      console.log('Ending balance:', finalDataPoints[finalDataPoints.length - 1]?.total);

      return { dataPoints: finalDataPoints, accounts };
    },
    enabled: !!user?.id && selectedAccountIds.length > 0,
  });

  return {
    dataPoints: data.dataPoints,
    accounts: data.accounts,
    isLoading,
  };
}

// Helper function to generate recurring transaction occurrences
function generateRecurringOccurrences(
  recurringTransaction: any,
  startDate: string,
  endDate: string
): any[] {
  const occurrences: any[] = [];
  const { recurrence_pattern, next_due_date, day_of_month, expected_amount, type, account_id, template_name } = recurringTransaction;
  
  let currentDate = new Date(Math.max(new Date(next_due_date).getTime(), new Date(startDate).getTime()));
  const finalDate = new Date(endDate);
  
  // Limit to 24 occurrences to prevent infinite loops
  let count = 0;
  const maxOccurrences = 24;
  
  while (currentDate <= finalDate && count < maxOccurrences) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    
    occurrences.push({
      id: `recurring_${recurringTransaction.id}_${dateStr}`,
      account_id: account_id,
      amount: expected_amount,
      type: type,
      status: 'pendente',
      event_date: dateStr,
      effective_date: dateStr,
      description: `[Recorrente] ${template_name}`,
      isRecurring: true
    });
    
    // Calculate next occurrence
    switch (recurrence_pattern) {
      case 'weekly':
        currentDate = addDays(currentDate, 7);
        break;
      case 'monthly':
        const nextMonth = new Date(currentDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextMonth.setDate(day_of_month || 1);
        currentDate = nextMonth;
        break;
      case 'quarterly':
        const nextQuarter = new Date(currentDate);
        nextQuarter.setMonth(nextQuarter.getMonth() + 3);
        nextQuarter.setDate(day_of_month || 1);
        currentDate = nextQuarter;
        break;
      case 'yearly':
        const nextYear = new Date(currentDate);
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        nextYear.setDate(day_of_month || 1);
        currentDate = nextYear;
        break;
      default:
        // Default to monthly if pattern is unknown
        const nextMonthDefault = new Date(currentDate);
        nextMonthDefault.setMonth(nextMonthDefault.getMonth() + 1);
        currentDate = nextMonthDefault;
    }
    
    count++;
  }
  
  return occurrences;
}
