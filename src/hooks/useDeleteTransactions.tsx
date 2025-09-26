import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function useDeleteTransactions() {
  const deleteTransactions = async (transactionIds: string[]) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', transactionIds);

      if (error) {
        throw error;
      }

      toast({
        title: 'Transações removidas',
        description: `${transactionIds.length} transação(ões) foram removidas com sucesso.`,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting transactions:', error);
      
      toast({
        title: 'Erro ao remover transações',
        description: error.message || 'Ocorreu um erro ao tentar remover as transações.',
        variant: 'destructive',
      });

      return { success: false, error: error.message };
    }
  };

  return {
    deleteTransactions,
  };
}