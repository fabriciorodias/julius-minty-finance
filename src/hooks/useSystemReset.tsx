import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useSystemReset() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resetTransactionsMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Delete all transactions for the current user
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate all transaction-related queries
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['account-balances', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['uncategorized-count', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['budget-actuals'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['provisioned-totals', user?.id], exact: false });
      
      toast({
        title: "Transações resetadas com sucesso",
        description: "Todas as transações foram removidas do sistema.",
      });
    },
    onError: (error) => {
      console.error('Error resetting transactions:', error);
      toast({
        title: "Erro ao resetar transações",
        description: "Não foi possível resetar as transações. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const resetAccountBalancesMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      // Delete all account initial balances for the current user
      const { error } = await supabase
        .from('account_initial_balances')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate balance-related queries
      queryClient.invalidateQueries({ queryKey: ['account-balances', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['account-initial-balance', user?.id], exact: false });
      
      toast({
        title: "Saldos das contas resetados com sucesso",
        description: "Todos os saldos iniciais das contas foram zerados.",
      });
    },
    onError: (error) => {
      console.error('Error resetting account balances:', error);
      toast({
        title: "Erro ao resetar saldos das contas",
        description: "Não foi possível resetar os saldos das contas. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    resetTransactions: resetTransactionsMutation.mutate,
    resetAccountBalances: resetAccountBalancesMutation.mutate,
    isResettingTransactions: resetTransactionsMutation.isPending,
    isResettingBalances: resetAccountBalancesMutation.isPending,
  };
}