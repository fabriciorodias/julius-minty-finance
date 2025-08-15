
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { InvestmentBalance } from './useInvestments';

export interface UpsertBalanceData {
  investment_id: string;
  month: string;
  balance: number;
}

export function useInvestmentBalances(investmentId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: balances = [], isLoading } = useQuery({
    queryKey: ['investment-balances', user?.id, investmentId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('investment_balances')
        .select('*')
        .eq('user_id', user.id)
        .order('month', { ascending: false });

      if (investmentId) {
        query = query.eq('investment_id', investmentId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as InvestmentBalance[];
    },
    enabled: !!user?.id,
  });

  const upsertBalanceMutation = useMutation({
    mutationFn: async (balanceData: UpsertBalanceData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('investment_balances')
        .upsert({
          ...balanceData,
          user_id: user.id,
        }, {
          onConflict: 'investment_id,month'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investment-balances'] });
      toast({
        title: "Saldo atualizado",
        description: "O saldo foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error updating balance:', error);
      toast({
        title: "Erro ao atualizar saldo",
        description: "Não foi possível atualizar o saldo. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    balances,
    isLoading,
    upsertBalance: upsertBalanceMutation.mutate,
    isUpdating: upsertBalanceMutation.isPending,
  };
}
