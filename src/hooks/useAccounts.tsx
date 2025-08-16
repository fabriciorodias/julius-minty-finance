
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

export interface Account {
  id: string;
  user_id: string;
  institution_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export function useAccounts(institutionId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading, error } = useQuery({
    queryKey: ['accounts', user?.id, institutionId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id);

      if (institutionId) {
        query = query.eq('institution_id', institutionId);
      }

      const { data, error } = await query.order('name');

      if (error) throw error;
      return data as Account[];
    },
    enabled: !!user?.id,
  });

  const createAccountMutation = useMutation({
    mutationFn: async (accountData: Omit<Account, 'id' | 'user_id' | 'created_at'>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('accounts')
        .insert({
          ...accountData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['account-balances', user?.id] });
      toast({
        title: "Conta criada",
        description: "A conta foi criada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar conta",
        description: "Não foi possível criar a conta. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Account> & { id: string }) => {
      const { data, error } = await supabase
        .from('accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['account-balances', user?.id] });
      toast({
        title: "Conta atualizada",
        description: "A conta foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar conta",
        description: "Não foi possível atualizar a conta. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteAccountSafelyMutation = useMutation({
    mutationFn: async (id: string) => {
      // Verificar se há lançamentos associados
      const { data: transactions } = await supabase
        .from('transactions')
        .select('id')
        .eq('account_id', id)
        .limit(1);

      if (transactions && transactions.length > 0) {
        throw new Error('HAS_TRANSACTIONS');
      }

      // Se não há dependências, proceder com a exclusão
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['account-balances', user?.id] });
      toast({
        title: "Conta excluída",
        description: "A conta foi excluída com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting account:', error);
      
      if (error.message === 'HAS_TRANSACTIONS') {
        toast({
          title: "Não é possível excluir a conta",
          description: "Esta conta possui lançamentos associados. Desative-a para manter o histórico ou remova os lançamentos primeiro.",
          variant: "destructive",
        });
      } else if (error.code === '23503') {
        toast({
          title: "Não é possível excluir a conta",
          description: "Esta conta possui lançamentos associados. Desative-a para manter o histórico.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao excluir conta",
          description: "Não foi possível excluir a conta. Tente novamente.",
          variant: "destructive",
        });
      }
    },
  });

  return {
    accounts,
    isLoading,
    error,
    createAccount: createAccountMutation.mutate,
    updateAccount: updateAccountMutation.mutate,
    deleteAccount: deleteAccountSafelyMutation.mutate,
    deleteAccountSafely: deleteAccountSafelyMutation.mutate,
    isCreating: createAccountMutation.isPending,
    isUpdating: updateAccountMutation.isPending,
    isDeleting: deleteAccountSafelyMutation.isPending,
  };
}
