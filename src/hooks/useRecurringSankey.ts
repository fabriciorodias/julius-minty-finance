import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

export const useRecurringSankey = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recurring-sankey', user?.id],
    queryFn: async (): Promise<SankeyData> => {
      if (!user?.id) {
        return { nodes: [], links: [] };
      }

      // Buscar lançamentos recorrentes ativos (sem join com categories para evitar erros)
      const { data: recurringTransactions, error } = await supabase
        .from('recurring_transactions')
        .select(`
          id,
          type,
          expected_amount,
          template_name,
          category_id
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching recurring transactions for sankey:', error);
        throw error;
      }

      // Buscar categorias separadamente para evitar problemas de join
      const categoryIds = recurringTransactions
        ?.map(t => t.category_id)
        .filter(Boolean) || [];

      let categoriesMap = new Map<string, string>();
      
      if (categoryIds.length > 0) {
        const { data: categories } = await supabase
          .from('categories')
          .select('id, name')
          .eq('user_id', user.id)
          .in('id', categoryIds);
        
        categories?.forEach(cat => {
          categoriesMap.set(cat.id, cat.name);
        });
      }

      console.log('Recurring transactions found:', recurringTransactions?.length || 0);
      console.log('Sample transactions:', recurringTransactions?.slice(0, 3));

      // Processar dados para criar estrutura sankey
      const incomeByCategory = new Map<string, number>();
      const expensesByName = new Map<string, number>();
      let totalIncome = 0;
      let totalExpense = 0;

      recurringTransactions?.forEach(transaction => {
        const amount = Math.abs(Number(transaction.expected_amount));
        
        if (transaction.type === 'receita') {
          // Agrupar receitas por categoria
          let categoryName = 'Sem Categoria';
          
          if (transaction.category_id && categoriesMap.has(transaction.category_id)) {
            categoryName = categoriesMap.get(transaction.category_id)!;
          }
          
          incomeByCategory.set(categoryName, (incomeByCategory.get(categoryName) || 0) + amount);
          totalIncome += amount;
        } else if (transaction.type === 'despesa') {
          // Criar nós individuais para cada despesa usando template_name
          const expenseName = transaction.template_name || 'Despesa Sem Nome';
          expensesByName.set(expenseName, amount);
          totalExpense += amount;
        }
      });

      console.log('Income by category:', Object.fromEntries(incomeByCategory));
      console.log('Expenses by name:', Object.fromEntries(expensesByName));
      console.log('Total income:', totalIncome);
      console.log('Total expense:', totalExpense);

      // Criar nós
      const nodes: SankeyNode[] = [];
      
      // Categorias de receita (lado esquerdo)
      incomeByCategory.forEach((value, category) => {
        nodes.push({
          id: `income-${category}`,
          name: category,
          category: 'income',
          color: 'hsl(142, 76%, 36%)' // Verde para receitas
        });
      });

      // Nó central de saldo - sempre criar
      nodes.push({
        id: 'balance',
        name: 'Saldo Mensal',
        category: 'balance',
        color: 'hsl(var(--muted))'
      });

      // Despesas individuais (lado direito)
      expensesByName.forEach((value, expenseName) => {
        nodes.push({
          id: `expense-${expenseName}`,
          name: expenseName,
          category: 'expense',
          color: 'hsl(0, 84%, 60%)' // Vermelho para despesas
        });
      });

      // Criar links apenas se tivermos dados
      const links: SankeyLink[] = [];

      // Receitas para saldo - apenas se tiver receitas
      if (incomeByCategory.size > 0) {
        incomeByCategory.forEach((value, category) => {
          links.push({
            source: `income-${category}`,
            target: 'balance',
            value
          });
        });
      }

      // Saldo para despesas - apenas se tiver despesas
      if (expensesByName.size > 0) {
        expensesByName.forEach((value, expenseName) => {
          links.push({
            source: 'balance',
            target: `expense-${expenseName}`,
            value
          });
        });
      }

      // Se não temos transações, retornar dados vazios
      if (incomeByCategory.size === 0 && expensesByName.size === 0) {
        console.log('No recurring transactions found for Sankey chart');
        return { nodes: [], links: [] };
      }

      return { nodes, links };
    },
    enabled: !!user?.id,
  });
};