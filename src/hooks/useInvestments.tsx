
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Investment {
  id: string;
  user_id: string;
  institution_id?: string;
  name: string;
  type: 'renda_fixa' | 'renda_variavel' | 'outro';
  issuer?: string;
  due_date?: string;
  status: 'ativo' | 'liquidado';
  display_order?: number;
  created_at: string;
  updated_at: string;
  institution?: {
    id: string;
    name: string;
  };
}

export interface InvestmentTransaction {
  id: string;
  investment_id: string;
  user_id: string;
  type: 'aporte' | 'resgate';
  amount: number;
  transaction_date: string;
  created_at: string;
}

export interface InvestmentBalance {
  id: string;
  investment_id: string;
  user_id: string;
  month: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface CreateInvestmentData {
  name: string;
  type: 'renda_fixa' | 'renda_variavel' | 'outro';
  institution_id?: string;
  issuer?: string;
  due_date?: string;
  initial_amount: number;
  initial_date: string;
}

export function useInvestments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: investments = [], isLoading, error } = useQuery({
    queryKey: ['investments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('investments')
        .select(`
          *,
          institution:institutions(id, name)
        `)
        .eq('user_id', user.id)
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Investment[];
    },
    enabled: !!user?.id,
  });

  const createInvestmentMutation = useMutation({
    mutationFn: async (investmentData: CreateInvestmentData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { initial_amount, initial_date, due_date, ...investmentFields } = investmentData;

      // Sanitize and prepare data
      const sanitizedData = {
        ...investmentFields,
        user_id: user.id,
        // Only include due_date if it's not empty
        ...(due_date && due_date.trim() !== '' ? { due_date } : {}),
      };

      console.log('Creating investment with data:', sanitizedData);

      // Create investment
      const { data: investment, error: investmentError } = await supabase
        .from('investments')
        .insert(sanitizedData)
        .select()
        .single();

      if (investmentError) {
        console.error('Investment creation error:', investmentError);
        throw investmentError;
      }

      console.log('Investment created:', investment);

      // Convert initial_amount to number
      const amountAsNumber = typeof initial_amount === 'string' 
        ? parseFloat(initial_amount) 
        : initial_amount;

      // Create initial transaction
      const { error: transactionError } = await supabase
        .from('investment_transactions')
        .insert({
          investment_id: investment.id,
          user_id: user.id,
          type: 'aporte',
          amount: amountAsNumber,
          transaction_date: initial_date,
        });

      if (transactionError) {
        console.error('Transaction creation error:', transactionError);
        throw transactionError;
      }

      // Create initial balance with proper month formatting (YYYY-MM-01)
      const initialDate = new Date(initial_date);
      const monthFormatted = `${initialDate.getFullYear()}-${String(initialDate.getMonth() + 1).padStart(2, '0')}-01`;
      
      console.log('Creating balance for month:', monthFormatted);

      const { error: balanceError } = await supabase
        .from('investment_balances')
        .insert({
          investment_id: investment.id,
          user_id: user.id,
          month: monthFormatted,
          balance: amountAsNumber,
        });

      if (balanceError) {
        console.error('Balance creation error:', balanceError);
        throw balanceError;
      }

      return investment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['investment-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['investment-balances'] });
      queryClient.invalidateQueries({ queryKey: ['investments-dashboard'] });
      toast({
        title: "Investimento criado",
        description: "O investimento foi criado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error creating investment:', error);
      toast({
        title: "Erro ao criar investimento",
        description: "Não foi possível criar o investimento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateInvestmentMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Investment> & { id: string }) => {
      const { data, error } = await supabase
        .from('investments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['investments-dashboard'] });
      toast({
        title: "Investimento atualizado",
        description: "O investimento foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error updating investment:', error);
      toast({
        title: "Erro ao atualizar investimento",
        description: "Não foi possível atualizar o investimento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteInvestmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('investments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['investment-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['investment-balances'] });
      queryClient.invalidateQueries({ queryKey: ['investments-dashboard'] });
      toast({
        title: "Investimento excluído",
        description: "O investimento foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error deleting investment:', error);
      toast({
        title: "Erro ao excluir investimento",
        description: "Não foi possível excluir o investimento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    investments,
    isLoading,
    error,
    createInvestment: createInvestmentMutation.mutate,
    updateInvestment: updateInvestmentMutation.mutate,
    deleteInvestment: deleteInvestmentMutation.mutate,
    isCreating: createInvestmentMutation.isPending,
    isUpdating: updateInvestmentMutation.isPending,
    isDeleting: deleteInvestmentMutation.isPending,
  };
}
