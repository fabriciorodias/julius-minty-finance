
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

export interface CreditCard {
  id: string;
  user_id: string;
  institution_id: string;
  name: string;
  card_limit: number;
  is_active: boolean;
  created_at: string;
}

export function useCreditCards() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: creditCards = [], isLoading, error } = useQuery({
    queryKey: ['credit_cards', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('credit_cards')
        .select(`
          *,
          institutions (
            name
          )
        `)
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      return data as (CreditCard & { institutions: { name: string } })[];
    },
    enabled: !!user?.id,
  });

  const createCreditCardMutation = useMutation({
    mutationFn: async (cardData: Omit<CreditCard, 'id' | 'user_id' | 'created_at'>) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('credit_cards')
        .insert({
          ...cardData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit_cards', user?.id] });
      toast({
        title: "Cartão criado",
        description: "O cartão foi criado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar cartão",
        description: "Não foi possível criar o cartão. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateCreditCardMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CreditCard> & { id: string }) => {
      const { data, error } = await supabase
        .from('credit_cards')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit_cards', user?.id] });
      toast({
        title: "Cartão atualizado",
        description: "O cartão foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar cartão",
        description: "Não foi possível atualizar o cartão. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteCreditCardMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('credit_cards')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit_cards', user?.id] });
      toast({
        title: "Cartão excluído",
        description: "O cartão foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir cartão",
        description: "Não foi possível excluir o cartão. Verifique se não há lançamentos associados.",
        variant: "destructive",
      });
    },
  });

  return {
    creditCards,
    isLoading,
    error,
    createCreditCard: createCreditCardMutation.mutate,
    updateCreditCard: updateCreditCardMutation.mutate,
    deleteCreditCard: deleteCreditCardMutation.mutate,
    isCreating: createCreditCardMutation.isPending,
    isUpdating: updateCreditCardMutation.isPending,
    isDeleting: deleteCreditCardMutation.isPending,
  };
}
