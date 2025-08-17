
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

export interface Counterparty {
  id: string;
  user_id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCounterpartyData {
  name: string;
  document?: string;
  email?: string;
  phone?: string;
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
        .eq('is_active', true)
        .order('name');

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
        title: "Favorecido criado",
        description: "O favorecido foi criado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error creating counterparty:', error);
      toast({
        title: "Erro ao criar favorecido",
        description: "Não foi possível criar o favorecido. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    counterparties,
    isLoading,
    error,
    createCounterparty: createCounterpartyMutation.mutate,
    isCreating: createCounterpartyMutation.isPending,
  };
}
