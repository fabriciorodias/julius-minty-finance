
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type CounterpartyRow = Database['public']['Tables']['counterparties']['Row'];
type CounterpartyInsert = Database['public']['Tables']['counterparties']['Insert'];
type CounterpartyUpdate = Database['public']['Tables']['counterparties']['Update'];

export interface Counterparty extends CounterpartyRow {}

export interface CreateCounterpartyData {
  name: string;
  document?: string;
  email?: string;
  phone?: string;
}

export interface UpdateCounterpartyData extends CreateCounterpartyData {
  id: string;
  is_active?: boolean;
}

export function useCounterparties() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: counterparties = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['counterparties', user?.id],
    queryFn: async (): Promise<Counterparty[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('counterparties')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const createCounterpartyMutation = useMutation({
    mutationFn: async (counterpartyData: CreateCounterpartyData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('counterparties')
        .insert({
          ...counterpartyData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counterparties', user?.id] });
      toast({
        title: "Contraparte criada",
        description: "A contraparte foi criada com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error creating counterparty:', error);
      toast({
        title: "Erro ao criar contraparte",
        description: "Não foi possível criar a contraparte. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateCounterpartyMutation = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateCounterpartyData) => {
      const { data, error } = await supabase
        .from('counterparties')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counterparties', user?.id] });
      toast({
        title: "Contraparte atualizada",
        description: "A contraparte foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error updating counterparty:', error);
      toast({
        title: "Erro ao atualizar contraparte",
        description: "Não foi possível atualizar a contraparte. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteCounterpartyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('counterparties')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counterparties', user?.id] });
      toast({
        title: "Contraparte excluída",
        description: "A contraparte foi excluída com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error deleting counterparty:', error);
      toast({
        title: "Erro ao excluir contraparte",
        description: "Não foi possível excluir a contraparte. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    counterparties,
    isLoading,
    error,
    createCounterparty: createCounterpartyMutation.mutate,
    updateCounterparty: updateCounterpartyMutation.mutate,
    deleteCounterparty: deleteCounterpartyMutation.mutate,
    isCreating: createCounterpartyMutation.isPending,
    isUpdating: updateCounterpartyMutation.isPending,
    isDeleting: deleteCounterpartyMutation.isPending,
  };
}
