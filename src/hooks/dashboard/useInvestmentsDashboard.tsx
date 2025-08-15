
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface InvestmentsDashboardData {
  totalPortfolio: number;
  monthlyReturn: number;
  returnPercentage: number;
  financialIndependenceRatio: number;
  portfolioComposition: Array<{
    type: string;
    value: number;
    percentage: number;
  }>;
  institutionAllocation: Array<{
    institution: string;
    value: number;
    percentage: number;
  }>;
}

export function useInvestmentsDashboard(selectedMonth: Date) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['investments-dashboard', user?.id, selectedMonth.getFullYear(), selectedMonth.getMonth()],
    queryFn: async (): Promise<InvestmentsDashboardData> => {
      if (!user?.id) {
        return {
          totalPortfolio: 0,
          monthlyReturn: 0,
          returnPercentage: 0,
          financialIndependenceRatio: 0,
          portfolioComposition: [],
          institutionAllocation: [],
        };
      }

      const currentMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const previousMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1);
      
      const currentMonthStr = currentMonth.toISOString().split('T')[0];
      const previousMonthStr = previousMonth.toISOString().split('T')[0];

      // Get current month balances with investment details
      const { data: currentBalances, error: currentError } = await supabase
        .from('investment_balances')
        .select(`
          balance,
          investment:investments(
            id,
            name,
            type,
            institution:institutions(name)
          )
        `)
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

      // Get transactions for the selected month
      const { data: transactions, error: transactionsError } = await supabase
        .from('investment_transactions')
        .select('investment_id, type, amount')
        .eq('user_id', user.id)
        .gte('transaction_date', currentMonthStr)
        .lt('transaction_date', new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1).toISOString().split('T')[0]);

      if (transactionsError) throw transactionsError;

      // Get user's monthly cost of living
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('monthly_cost_of_living')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Calculate metrics
      const totalPortfolio = currentBalances?.reduce((sum, b) => sum + Number(b.balance), 0) || 0;
      
      // Calculate monthly return
      let totalReturn = 0;
      let totalPreviousBalance = 0;

      currentBalances?.forEach(current => {
        const investmentId = current.investment?.id;
        const currentBalance = Number(current.balance);
        
        const previousBalance = previousBalances?.find(p => p.investment_id === investmentId);
        const prevBalance = previousBalance ? Number(previousBalance.balance) : 0;
        
        const monthTransactions = transactions?.filter(t => t.investment_id === investmentId) || [];
        const netTransactions = monthTransactions.reduce((sum, t) => {
          return sum + (t.type === 'aporte' ? Number(t.amount) : -Number(t.amount));
        }, 0);
        
        const investmentReturn = currentBalance - prevBalance - netTransactions;
        totalReturn += investmentReturn;
        totalPreviousBalance += prevBalance;
      });

      const returnPercentage = totalPreviousBalance > 0 ? (totalReturn / totalPreviousBalance) * 100 : 0;

      // Calculate financial independence ratio
      const monthlyCostOfLiving = profile?.monthly_cost_of_living || 0;
      const financialIndependenceRatio = monthlyCostOfLiving > 0 ? (totalReturn / monthlyCostOfLiving) * 100 : 0;

      // Portfolio composition by type
      const compositionMap = new Map<string, number>();
      currentBalances?.forEach(balance => {
        const type = balance.investment?.type || 'outro';
        const typeLabel = type === 'renda_fixa' ? 'Renda Fixa' : 
                         type === 'renda_variavel' ? 'Renda Variável' : 'Outros';
        
        compositionMap.set(typeLabel, (compositionMap.get(typeLabel) || 0) + Number(balance.balance));
      });

      const portfolioComposition = Array.from(compositionMap.entries()).map(([type, value]) => ({
        type,
        value,
        percentage: totalPortfolio > 0 ? (value / totalPortfolio) * 100 : 0,
      }));

      // Institution allocation
      const institutionMap = new Map<string, number>();
      currentBalances?.forEach(balance => {
        const institution = balance.investment?.institution?.name || 'Sem Instituição';
        institutionMap.set(institution, (institutionMap.get(institution) || 0) + Number(balance.balance));
      });

      const institutionAllocation = Array.from(institutionMap.entries()).map(([institution, value]) => ({
        institution,
        value,
        percentage: totalPortfolio > 0 ? (value / totalPortfolio) * 100 : 0,
      }));

      return {
        totalPortfolio,
        monthlyReturn: totalReturn,
        returnPercentage,
        financialIndependenceRatio,
        portfolioComposition,
        institutionAllocation,
      };
    },
    enabled: !!user?.id,
  });
}
