import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfMonth, endOfMonth, format } from "date-fns";

export interface SankeyNode {
  id: string;
  name: string;
  category: 'income' | 'expense' | 'balance';
  color: string;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

interface UseCashFlowSankeyParams {
  selectedAccounts: string[];
  startDate?: Date;
  endDate?: Date;
}

export const useCashFlowSankey = ({ 
  selectedAccounts, 
  startDate, 
  endDate 
}: UseCashFlowSankeyParams) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['cashflow-sankey', user?.id, selectedAccounts, startDate, endDate],
    queryFn: async (): Promise<SankeyData> => {
      if (!user?.id || selectedAccounts.length === 0) {
        return { nodes: [], links: [] };
      }

      const actualStartDate = startDate || startOfMonth(new Date());
      const actualEndDate = endDate || endOfMonth(new Date());

      // Fetch transactions for the period - include both completed and pending
      let query = supabase
        .from('transactions')
        .select(`
          *,
          category:categories(id, name, type),
          account:accounts(id, name)
        `)
        .eq('user_id', user.id)
        .in('status', ['efetivado', 'pendente'])
        .gte('event_date', format(actualStartDate, 'yyyy-MM-dd'))
        .lte('event_date', format(actualEndDate, 'yyyy-MM-dd'));

      if (selectedAccounts.length > 0) {
        query = query.in('account_id', selectedAccounts);
      }

      const { data: transactions, error } = await query;

      if (error) {
        console.error('Error fetching transactions for sankey:', error);
        throw error;
      }

      console.log('Sankey transactions found:', transactions?.length || 0);
      console.log('Sample transactions:', transactions?.slice(0, 3));

      // Process data to create sankey structure
      const incomeByCategory = new Map<string, number>();
      const expenseByCategory = new Map<string, number>();
      let totalIncome = 0;
      let totalExpense = 0;

      transactions?.forEach(transaction => {
        const amount = Math.abs(Number(transaction.amount));
        const categoryName = transaction.category?.name || 'Sem Categoria';
        
        if (transaction.type === 'receita') {
          incomeByCategory.set(categoryName, (incomeByCategory.get(categoryName) || 0) + amount);
          totalIncome += amount;
        } else if (transaction.type === 'despesa') {
          expenseByCategory.set(categoryName, (expenseByCategory.get(categoryName) || 0) + amount);
          totalExpense += amount;
        }
      });

      console.log('Income by category:', Object.fromEntries(incomeByCategory));
      console.log('Expense by category:', Object.fromEntries(expenseByCategory));
      console.log('Total income:', totalIncome);
      console.log('Total expense:', totalExpense);

      // Create nodes
      const nodes: SankeyNode[] = [];
      
      // Income categories (left side)
      incomeByCategory.forEach((value, category) => {
        nodes.push({
          id: `income-${category}`,
          name: category,
          category: 'income',
          color: 'hsl(var(--chart-1))'
        });
      });

      // Central balance node
      nodes.push({
        id: 'balance',
        name: 'Saldo',
        category: 'balance',
        color: 'hsl(var(--muted))'
      });

      // Expense categories (right side)
      expenseByCategory.forEach((value, category) => {
        nodes.push({
          id: `expense-${category}`,
          name: category,
          category: 'expense',
          color: 'hsl(var(--chart-2))'
        });
      });

      // Create links
      const links: SankeyLink[] = [];

      // Income to balance
      incomeByCategory.forEach((value, category) => {
        links.push({
          source: `income-${category}`,
          target: 'balance',
          value
        });
      });

      // Balance to expenses
      expenseByCategory.forEach((value, category) => {
        links.push({
          source: 'balance',
          target: `expense-${category}`,
          value
        });
      });

      return { nodes, links };
    },
    enabled: !!user?.id && selectedAccounts.length > 0,
  });
};