import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export interface CreateTransferData {
  from_account_id: string;
  to_account_id: string;
  amount: number;
  description: string;
  event_date: string;
  notes?: string;
}

export interface TransferGroup {
  transfer_id: string;
  description: string;
  amount: number;
  event_date: string;
  from_account: { id: string; name: string };
  to_account: { id: string; name: string };
  origin_transaction: any;
  destination_transaction: any;
  notes?: string;
}

export function useTransfers() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createTransfer = useMutation({
    mutationFn: async (data: CreateTransferData) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data: result, error } = await supabase.rpc('create_transfer', {
        p_user_id: user.user.id,
        p_from_account_id: data.from_account_id,
        p_to_account_id: data.to_account_id,
        p_amount: data.amount,
        p_description: data.description,
        p_event_date: data.event_date,
        p_notes: data.notes || null
      });

      if (error) {
        console.error('❌ Error creating transfer:', error);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['account-balances'] });
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      toast({
        title: "Transferência criada",
        description: "A transferência foi criada com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('❌ Error creating transfer:', error);
      toast({
        title: "Erro ao criar transferência",
        description: error.message || "Ocorreu um erro ao criar a transferência.",
        variant: "destructive",
      });
    },
  });

  const updateTransfer = useMutation({
    mutationFn: async ({ transferId, data }: { transferId: string; data: CreateTransferData }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data: result, error } = await supabase.rpc('update_transfer', {
        p_user_id: user.user.id,
        p_transfer_id: transferId,
        p_from_account_id: data.from_account_id,
        p_to_account_id: data.to_account_id,
        p_amount: data.amount,
        p_description: data.description,
        p_event_date: data.event_date,
        p_notes: data.notes || null
      });

      if (error) {
        console.error('❌ Error updating transfer:', error);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['account-balances'] });
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      toast({
        title: "Transferência atualizada",
        description: "A transferência foi atualizada com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('❌ Error updating transfer:', error);
      toast({
        title: "Erro ao atualizar transferência",
        description: error.message || "Ocorreu um erro ao atualizar a transferência.",
        variant: "destructive",
      });
    },
  });

  const deleteTransfer = useMutation({
    mutationFn: async (transferId: string) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data: result, error } = await supabase.rpc('delete_transfer', {
        p_user_id: user.user.id,
        p_transfer_id: transferId
      });

      if (error) {
        console.error('❌ Error deleting transfer:', error);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['account-balances'] });
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      toast({
        title: "Transferência excluída",
        description: "A transferência foi excluída com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('❌ Error deleting transfer:', error);
      toast({
        title: "Erro ao excluir transferência",
        description: error.message || "Ocorreu um erro ao excluir a transferência.",
        variant: "destructive",
      });
    },
  });

  return {
    createTransfer,
    updateTransfer,
    deleteTransfer,
    isCreating: createTransfer.isPending,
    isUpdating: updateTransfer.isPending,
    isDeleting: deleteTransfer.isPending,
  };
}