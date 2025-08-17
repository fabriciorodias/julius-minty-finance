
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  accountId?: string;
  creditCardId?: string;
  counterpartyId?: string;
  status?: 'pendente' | 'concluido';
  isReviewed?: boolean;
  description?: string;
  amountMin?: number;
  amountMax?: number;
  accountIds?: string[];
  tagIds?: string[];
}

export interface Transaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  event_date: string;
  effective_date?: string;
  type: string;
  category_id?: string;
  account_id?: string;
  credit_card_id?: string;
  counterparty_id?: string;
  status: 'pendente' | 'concluido';
  is_reviewed: boolean;
  notes?: string;
  plan_id?: string;
  installment_number?: number;
  total_installments?: number;
  installment_id?: string;
  created_at: string;
}

export interface TransactionWithRelations extends Transaction {
  categories?: { name: string };
  accounts?: { name: string };
  credit_cards?: { name: string };
  counterparties?: { name: string };
  tags?: Array<{ name: string; color: string | null }>;
}

export interface CreateTransactionData {
  description: string;
  amount: number;
  event_date: string;
  effective_date?: string;
  category_id?: string;
  account_id?: string;
  credit_card_id?: string;
  counterparty_id?: string;
  status?: 'pendente' | 'concluido';
  is_reviewed?: boolean;
  notes?: string;
  tags?: string[];
}

export interface UpdateTransactionData extends CreateTransactionData {
  id: string;
}

export function useTransactions(filters: TransactionFilters = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: transactions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['transactions', user?.id, filters],
    queryFn: async (): Promise<TransactionWithRelations[]> => {
      if (!user?.id) return [];

      let query = supabase
        .from('transactions')
        .select(`
          *,
          categories:category_id(name),
          accounts:account_id(name),
          credit_cards:credit_card_id(name),
          counterparties:counterparty_id(name),
          transaction_tags(
            tags(name, color)
          )
        `)
        .eq('user_id', user.id);

      // Apply filters
      if (filters.startDate) {
        query = query.gte('event_date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('event_date', filters.endDate);
      }
      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters.accountId) {
        query = query.eq('account_id', filters.accountId);
      }
      if (filters.creditCardId) {
        query = query.eq('credit_card_id', filters.creditCardId);
      }
      if (filters.counterpartyId) {
        if (filters.counterpartyId === 'none') {
          query = query.is('counterparty_id', null);
        } else {
          query = query.eq('counterparty_id', filters.counterpartyId);
        }
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.isReviewed !== undefined) {
        query = query.eq('is_reviewed', filters.isReviewed);
      }
      if (filters.description) {
        query = query.ilike('description', `%${filters.description}%`);
      }
      if (filters.amountMin !== undefined) {
        query = query.gte('amount', filters.amountMin);
      }
      if (filters.amountMax !== undefined) {
        query = query.lte('amount', filters.amountMax);
      }
      if (filters.accountIds && filters.accountIds.length > 0) {
        query = query.in('account_id', filters.accountIds);
      }

      query = query.order('event_date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      // Transform the data to include tags properly and cast status type
      const transformedData = data?.map(transaction => ({
        ...transaction,
        status: transaction.status as 'pendente' | 'concluido',
        tags: transaction.transaction_tags?.map((tt: any) => tt.tags).filter(Boolean) || []
      })) || [];

      // Filter by tags if specified
      if (filters.tagIds && filters.tagIds.length > 0) {
        return transformedData.filter(transaction => 
          transaction.tags?.some(tag => filters.tagIds!.includes(tag.name))
        );
      }

      return transformedData;
    },
    enabled: !!user?.id,
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (transactionData: CreateTransactionData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { tags, ...transactionFields } = transactionData;

      // Determine transaction type based on amount
      const transactionType = transactionFields.amount >= 0 ? 'receita' : 'despesa';

      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert({
          ...transactionFields,
          user_id: user.id,
          type: transactionType,
          status: transactionFields.status || 'concluido',
          is_reviewed: transactionFields.is_reviewed || false,
        })
        .select()
        .single();

      if (error) throw error;

      // Add tags if provided
      if (tags && tags.length > 0) {
        const { error: tagsError } = await supabase
          .from('transaction_tags')
          .insert(
            tags.map(tagId => ({
              transaction_id: transaction.id,
              tag_id: tagId,
              user_id: user.id,
            }))
          );

        if (tagsError) throw tagsError;
      }

      return transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      toast({
        title: "Lançamento criado",
        description: "O lançamento foi criado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error creating transaction:', error);
      toast({
        title: "Erro ao criar lançamento",
        description: "Não foi possível criar o lançamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, tags, ...updates }: UpdateTransactionData) => {
      // Determine transaction type based on amount if provided
      const updateData: any = { ...updates };
      if (updates.amount !== undefined) {
        updateData.type = updates.amount >= 0 ? 'receita' : 'despesa';
      }

      const { data, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update tags if provided
      if (tags !== undefined) {
        // Remove existing tags
        await supabase
          .from('transaction_tags')
          .delete()
          .eq('transaction_id', id);

        // Add new tags
        if (tags.length > 0) {
          const { error: tagsError } = await supabase
            .from('transaction_tags')
            .insert(
              tags.map(tagId => ({
                transaction_id: id,
                tag_id: tagId,
                user_id: user!.id,
              }))
            );

          if (tagsError) throw tagsError;
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      toast({
        title: "Lançamento atualizado",
        description: "O lançamento foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error updating transaction:', error);
      toast({
        title: "Erro ao atualizar lançamento",
        description: "Não foi possível atualizar o lançamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      toast({
        title: "Lançamento excluído",
        description: "O lançamento foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Erro ao excluir lançamento",
        description: "Não foi possível excluir o lançamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteBulkTransactionsMutation = useMutation({
    mutationFn: async (transactionIds: string[]) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', transactionIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      toast({
        title: "Lançamentos excluídos",
        description: "Os lançamentos foram excluídos com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error deleting transactions:', error);
      toast({
        title: "Erro ao excluir lançamentos",
        description: "Não foi possível excluir os lançamentos. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    transactions,
    isLoading,
    error,
    createTransaction: createTransactionMutation.mutate,
    updateTransaction: updateTransactionMutation.mutate,
    deleteTransaction: deleteTransactionMutation.mutate,
    deleteBulkTransactions: deleteBulkTransactionsMutation.mutate,
    isCreating: createTransactionMutation.isPending,
    isUpdating: updateTransactionMutation.isPending,
    isDeleting: deleteTransactionMutation.isPending || deleteBulkTransactionsMutation.isPending,
  };
}
