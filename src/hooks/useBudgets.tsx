import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  month: string;
  budgeted_amount: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetData {
  category_id: string;
  month: string;
  budgeted_amount: number;
}

export function useBudgets(month?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const currentMonth = month || new Date().toISOString().slice(0, 7) + '-01';

  const {
    data: budgets = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['budgets', user?.id, currentMonth],
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Budget[];
    },
    enabled: !!user?.id,
  });

  // Function to get yearly budget data for a specific category
  const getYearlyBudgets = async (categoryId: string, year: number): Promise<Budget[]> => {
    if (!user?.id) throw new Error('Usuário não autenticado');

    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', user.id)
      .eq('category_id', categoryId)
      .gte('month', `${year}-01-01`)
      .lte('month', `${year}-12-01`)
      .order('month', { ascending: true });

    if (error) throw error;
    return data as Budget[];
  };

  const createBudgetMutation = useMutation({
    mutationFn: async (budgetData: BudgetData) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('budgets')
        .insert({
          user_id: user.id,
          ...budgetData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({
        title: 'Sucesso',
        description: 'Orçamento criado com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar orçamento',
        variant: 'destructive',
      });
    },
  });

  const updateBudgetMutation = useMutation({
    mutationFn: async ({ id, ...budgetData }: { id: string } & Partial<BudgetData>) => {
      const { data, error } = await supabase
        .from('budgets')
        .update(budgetData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({
        title: 'Sucesso',
        description: 'Orçamento atualizado com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar orçamento',
        variant: 'destructive',
      });
    },
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({
        title: 'Sucesso',
        description: 'Orçamento excluído com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir orçamento',
        variant: 'destructive',
      });
    },
  });

  // Função para criar orçamentos fixos (12 meses com o mesmo valor)
  const createFixedBudgetMutation = useMutation({
    mutationFn: async ({ categoryId, amount, year }: { categoryId: string; amount: number; year: number }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const budgets = [];
      for (let month = 1; month <= 12; month++) {
        const monthStr = `${year}-${month.toString().padStart(2, '0')}-01`;
        budgets.push({
          user_id: user.id,
          category_id: categoryId,
          month: monthStr,
          budgeted_amount: amount,
        });
      }

      // Primeiro, deletar orçamentos existentes para esta categoria no ano
      await supabase
        .from('budgets')
        .delete()
        .eq('user_id', user.id)
        .eq('category_id', categoryId)
        .gte('month', `${year}-01-01`)
        .lte('month', `${year}-12-01`);

      // Depois, inserir os novos orçamentos
      const { data, error } = await supabase
        .from('budgets')
        .insert(budgets)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({
        title: 'Sucesso',
        description: 'Orçamento fixo criado para todo o ano!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar orçamento fixo',
        variant: 'destructive',
      });
    },
  });

  // Função para criar orçamentos variáveis (valores específicos por mês)
  const createVariableBudgetMutation = useMutation({
    mutationFn: async ({ categoryId, monthlyAmounts, year }: { categoryId: string; monthlyAmounts: number[]; year: number }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const budgets = monthlyAmounts.map((amount, index) => ({
        user_id: user.id,
        category_id: categoryId,
        month: `${year}-${(index + 1).toString().padStart(2, '0')}-01`,
        budgeted_amount: amount,
      }));

      // Primeiro, deletar orçamentos existentes para esta categoria no ano
      await supabase
        .from('budgets')
        .delete()
        .eq('user_id', user.id)
        .eq('category_id', categoryId)
        .gte('month', `${year}-01-01`)
        .lte('month', `${year}-12-01`);

      // Depois, inserir os novos orçamentos
      const { data, error } = await supabase
        .from('budgets')
        .insert(budgets)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({
        title: 'Sucesso',
        description: 'Orçamento variável criado para todo o ano!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar orçamento variável',
        variant: 'destructive',
      });
    },
  });

  return {
    budgets,
    isLoading,
    error,
    createBudget: createBudgetMutation.mutate,
    updateBudget: updateBudgetMutation.mutate,
    deleteBudget: deleteBudgetMutation.mutate,
    createFixedBudget: createFixedBudgetMutation.mutate,
    createVariableBudget: createVariableBudgetMutation.mutate,
    getYearlyBudgets,
    isCreating: createBudgetMutation.isPending,
    isUpdating: updateBudgetMutation.isPending,
    isDeleting: deleteBudgetMutation.isPending,
    isCreatingFixed: createFixedBudgetMutation.isPending,
    isCreatingVariable: createVariableBudgetMutation.isPending,
  };
}
