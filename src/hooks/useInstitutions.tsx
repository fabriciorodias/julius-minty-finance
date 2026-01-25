
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

export interface Institution {
  id: string;
  user_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
}

export function useInstitutions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: institutions = [], isLoading, error } = useQuery({
    queryKey: ['institutions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('institutions')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      return data as Institution[];
    },
    enabled: !!user?.id,
  });

  const createInstitutionMutation = useMutation({
    mutationFn: async (institutionData: Omit<Institution, 'id' | 'user_id' | 'created_at'>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('institutions')
        .insert({
          ...institutionData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institutions', user?.id] });
      toast({
        title: "Instituição criada",
        description: "A instituição foi criada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar instituição",
        description: "Não foi possível criar a instituição. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateInstitutionMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Institution> & { id: string }) => {
      const { data, error } = await supabase
        .from('institutions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institutions', user?.id] });
      toast({
        title: "Instituição atualizada",
        description: "A instituição foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar instituição",
        description: "Não foi possível atualizar a instituição. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteInstitutionSafelyMutation = useMutation({
    mutationFn: async (id: string) => {
      // Verificar se há contas associadas
      const { data: accounts } = await supabase
        .from('accounts')
        .select('id')
        .eq('institution_id', id)
        .limit(1);

      if (accounts && accounts.length > 0) {
        throw new Error('HAS_ACCOUNTS');
      }

      // Verificar se há cartões de crédito associados
      const { data: creditCards } = await supabase
        .from('credit_cards')
        .select('id')
        .eq('institution_id', id)
        .limit(1);

      if (creditCards && creditCards.length > 0) {
        throw new Error('HAS_CREDIT_CARDS');
      }

      // Verificar se há investimentos associados
      const { data: investments } = await supabase
        .from('investments')
        .select('id')
        .eq('institution_id', id)
        .limit(1);

      if (investments && investments.length > 0) {
        throw new Error('HAS_INVESTMENTS');
      }

      // Se não há dependências, proceder com a exclusão
      const { error } = await supabase
        .from('institutions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institutions', user?.id] });
      toast({
        title: "Instituição excluída",
        description: "A instituição foi excluída com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting institution:', error);
      
      if (error.message === 'HAS_ACCOUNTS') {
        toast({
          title: "Não é possível excluir a instituição",
          description: "Esta instituição possui contas associadas. Desative-a para manter o histórico ou remova as contas primeiro.",
          variant: "destructive",
        });
      } else if (error.message === 'HAS_CREDIT_CARDS') {
        toast({
          title: "Não é possível excluir a instituição",
          description: "Esta instituição possui cartões de crédito associados. Desative-a para manter o histórico ou remova os cartões primeiro.",
          variant: "destructive",
        });
      } else if (error.message === 'HAS_INVESTMENTS') {
        toast({
          title: "Não é possível excluir a instituição",
          description: "Esta instituição possui investimentos associados. Desative-a para manter o histórico ou remova os investimentos primeiro.",
          variant: "destructive",
        });
      } else if (error.code === '23503') {
        toast({
          title: "Não é possível excluir a instituição",
          description: "Esta instituição possui registros associados. Desative-a para manter o histórico.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao excluir instituição",
          description: "Não foi possível excluir a instituição. Tente novamente.",
          variant: "destructive",
        });
      }
    },
  });

  return {
    institutions,
    isLoading,
    error,
    createInstitution: createInstitutionMutation.mutate,
    updateInstitution: updateInstitutionMutation.mutate,
    deleteInstitution: deleteInstitutionSafelyMutation.mutate,
    deleteInstitutionSafely: deleteInstitutionSafelyMutation.mutate,
    isCreating: createInstitutionMutation.isPending,
    isUpdating: updateInstitutionMutation.isPending,
    isDeleting: deleteInstitutionSafelyMutation.isPending,
  };
}
