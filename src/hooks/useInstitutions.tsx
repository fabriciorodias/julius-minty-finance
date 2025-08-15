
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

  const deleteInstitutionMutation = useMutation({
    mutationFn: async (id: string) => {
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
    onError: (error) => {
      toast({
        title: "Erro ao excluir instituição",
        description: "Não foi possível excluir a instituição. Verifique se não há contas ou cartões associados.",
        variant: "destructive",
      });
    },
  });

  return {
    institutions,
    isLoading,
    error,
    createInstitution: createInstitutionMutation.mutate,
    updateInstitution: updateInstitutionMutation.mutate,
    deleteInstitution: deleteInstitutionMutation.mutate,
    isCreating: createInstitutionMutation.isPending,
    isUpdating: updateInstitutionMutation.isPending,
    isDeleting: deleteInstitutionMutation.isPending,
  };
}
