import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface RecurringTransaction {
  id: string;
  user_id: string;
  template_name: string;
  description: string;
  amount?: number;
  expected_amount: number;
  variance_tolerance: number;
  type: 'receita' | 'despesa';
  category_id?: string;
  account_id?: string;
  counterparty_id?: string;
  recurrence_pattern: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  day_of_month: number;
  next_due_date: string;
  last_payment_date?: string;
  notification_days: number;
  auto_categorize: boolean;
  status: 'active' | 'paused' | 'cancelled';
  created_at: string;
  updated_at: string;
  notes?: string;
}

export interface RecurringTransactionWithAnalytics extends RecurringTransaction {
  type: 'receita' | 'despesa'; // Garantir que o tipo está incluído na interface
  last_amount: number;
  variance_percentage: number;
  days_until_due: number;
  avg_last_3_months: number;
  category_name?: string;
  account_name?: string;
  counterparty_name?: string;
}

export interface CreateRecurringTransactionData {
  template_name: string;
  description: string;
  expected_amount: number;
  variance_tolerance?: number;
  type: 'receita' | 'despesa';
  category_id?: string;
  account_id?: string;
  counterparty_id?: string;
  recurrence_pattern: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  day_of_month?: number;
  next_due_date: string;
  notification_days?: number;
  auto_categorize?: boolean;
  notes?: string;
}

export interface UpdateRecurringTransactionData extends Partial<CreateRecurringTransactionData> {
  status?: 'active' | 'paused' | 'cancelled';
  last_payment_date?: string;
}

// Hook to fetch recurring transactions with analytics
export function useRecurringTransactions() {
  return useQuery({
    queryKey: ['recurring-transactions'],
    queryFn: async () => {
      console.log('Fetching recurring transactions with analytics...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('get_recurring_transactions_analytics', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error fetching recurring transactions:', error);
        throw error;
      }

      console.log('Recurring transactions fetched:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('First transaction type:', data[0]);
        const comissaoTransaction = data.find(t => t.template_name === 'Comissão');
        if (comissaoTransaction) {
          console.log('Comissão transaction from RPC:', {
            template_name: comissaoTransaction.template_name,
            type: comissaoTransaction.type,
            expected_amount: comissaoTransaction.expected_amount
          });
        }
      }
      return data as RecurringTransactionWithAnalytics[];
    },
    staleTime: 0, // Forçar atualização imediata
    refetchOnMount: true
  });
}

// Hook to fetch basic recurring transactions (without analytics)
export function useRecurringTransactionsBasic() {
  return useQuery({
    queryKey: ['recurring-transactions-basic'],
    queryFn: async () => {
      console.log('Fetching basic recurring transactions...');
      
      const { data, error } = await supabase
        .from('recurring_transactions')
        .select('*')
        .order('next_due_date', { ascending: true });

      if (error) {
        console.error('Error fetching basic recurring transactions:', error);
        throw error;
      }

      console.log('Basic recurring transactions fetched:', data?.length || 0);
      return data as RecurringTransaction[];
    }
  });
}

// Hook for CRUD operations
export function useRecurringTransactionMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: CreateRecurringTransactionData) => {
      console.log('Creating recurring transaction:', data);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: result, error } = await supabase
        .from('recurring_transactions')
        .insert([{ ...data, user_id: user.id }])
        .select()
        .single();

      if (error) {
        console.error('Error creating recurring transaction:', error);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions-basic'] });
      toast({
        title: "Sucesso",
        description: "Lançamento recorrente criado com sucesso!"
      });
    },
    onError: (error) => {
      console.error('Error creating recurring transaction:', error);
      toast({
        title: "Erro",
        description: "Falha ao criar lançamento recorrente. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRecurringTransactionData }) => {
      console.log('Updating recurring transaction:', id, data);

      const { data: result, error } = await supabase
        .from('recurring_transactions')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating recurring transaction:', error);
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions-basic'] });
      toast({
        title: "Sucesso",
        description: "Lançamento recorrente atualizado com sucesso!"
      });
    },
    onError: (error) => {
      console.error('Error updating recurring transaction:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar lançamento recorrente. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting recurring transaction:', id);

      const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting recurring transaction:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions-basic'] });
      toast({
        title: "Sucesso",
        description: "Lançamento recorrente excluído com sucesso!"
      });
    },
    onError: (error) => {
      console.error('Error deleting recurring transaction:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir lançamento recorrente. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  // Function to mark as paid (create transaction and update last_payment_date)
  const markAsPaidMutation = useMutation({
    mutationFn: async ({ 
      id, 
      amount, 
      event_date 
    }: { 
      id: string; 
      amount: number; 
      event_date: string; 
    }) => {
      console.log('Marking recurring transaction as paid:', id, amount, event_date);

      // First get the recurring transaction details
      const { data: recurringTransaction, error: fetchError } = await supabase
        .from('recurring_transactions')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Create the transaction
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const transactionData = {
        description: recurringTransaction.description,
        amount: recurringTransaction.type === 'despesa' ? -Math.abs(amount) : Math.abs(amount),
        type: recurringTransaction.type,
        event_date: event_date,
        status: 'concluido' as const,
        category_id: recurringTransaction.category_id,
        account_id: recurringTransaction.account_id,
        counterparty_id: recurringTransaction.counterparty_id,
        notes: `Gerado automaticamente de: ${recurringTransaction.template_name}`,
        user_id: user.id
      };

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([transactionData]);

      if (transactionError) throw transactionError;

      // Update the recurring transaction's last payment date and calculate next due date
      const nextDueDate = await supabase.rpc('calculate_next_due_date', {
        p_recurrence_pattern: recurringTransaction.recurrence_pattern,
        p_current_date: event_date,
        p_day_of_month: recurringTransaction.day_of_month
      });

      if (nextDueDate.error) throw nextDueDate.error;

      const { error: updateError } = await supabase
        .from('recurring_transactions')
        .update({
          last_payment_date: event_date,
          next_due_date: nextDueDate.data,
          amount: amount // Update last amount
        })
        .eq('id', id);

      if (updateError) throw updateError;

      return { transaction: transactionData, nextDueDate: nextDueDate.data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-transactions-basic'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['account-balances'] });
      toast({
        title: "Sucesso",
        description: "Pagamento registrado e próximo vencimento atualizado!"
      });
    },
    onError: (error) => {
      console.error('Error marking as paid:', error);
      toast({
        title: "Erro",
        description: "Falha ao registrar pagamento. Tente novamente.",
        variant: "destructive"
      });
    }
  });

  return {
    createRecurringTransaction: createMutation.mutate,
    updateRecurringTransaction: updateMutation.mutate,
    deleteRecurringTransaction: deleteMutation.mutate,
    markAsPaid: markAsPaidMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isMarkingAsPaid: markAsPaidMutation.isPending
  };
}