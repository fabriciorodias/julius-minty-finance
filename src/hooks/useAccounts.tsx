
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

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', user?.id] });
      toast({
        title: "Conta excluída",
        description: "A conta foi excluída com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir conta",
        description: "Não foi possível excluir a conta. Verifique se não há lançamentos associados.",
        variant: "destructive",
      });
    },
  });

  return {
    accounts,
    isLoading,
    error,
    createAccount: createAccountMutation.mutate,
    updateAccount: updateAccountMutation.mutate,
    deleteAccount: deleteAccountMutation.mutate,
    isCreating: createAccountMutation.isPending,
    isUpdating: updateAccountMutation.isPending,
    isDeleting: deleteAccountMutation.isPending,
  };
}
