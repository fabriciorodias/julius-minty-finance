
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { InvestmentTransaction } from './useInvestments';

export interface CreateTransactionData {
  investment_id: string;
  type: 'aporte' | 'resgate';
  amount: number;
  transaction_date: string;
}

export function useInvestmentTransactions(investmentId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['investment-transactions', user?.id, investmentId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('investment_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false });

      if (investmentId) {
        query = query.eq('investment_id', investmentId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as InvestmentTransaction[];
    },
    enabled: !!user?.id,
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (transactionData: CreateTransactionData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('investment_transactions')
        .insert({
          ...transactionData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investment-transactions'] });
      toast({
        title: "Movimentação registrada",
        description: "A movimentação foi registrada com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error creating transaction:', error);
      toast({
        title: "Erro ao registrar movimentação",
        description: "Não foi possível registrar a movimentação. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    transactions,
    isLoading,
    createTransaction: createTransactionMutation.mutate,
    isCreating: createTransactionMutation.isPending,
  };
}
