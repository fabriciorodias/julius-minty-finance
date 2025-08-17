import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string | null;
  credit_card_id: string | null;
  category_id: string | null;
  counterparty_id: string | null;
  description: string;
  amount: number;
  event_date: string;
  effective_date: string | null;
  status: 'pendente' | 'concluido';
  type: 'receita' | 'despesa';
  installment_id: string | null;
  installment_number: number | null;
  total_installments: number | null;
  created_at: string;
}

export interface TransactionWithRelations extends Transaction {
  categories: { name: string } | null;
  accounts: { name: string } | null;
  credit_cards: { name: string } | null;
  counterparties: { id: string; name: string } | null;
  tags?: { name: string; color: string | null }[];
}

export interface TransactionFilters {
  dateBase?: 'event' | 'effective';
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  accountId?: string;
  accountIds?: string[]; // New field for multiple account filtering
  creditCardId?: string;
  status?: 'pendente' | 'concluido';
  q?: string;
  withoutCategory?: boolean;
  tagIds?: string[]; // New field for tag filtering
}

export interface CreateTransactionData {
  account_id?: string;
  credit_card_id?: string;
  category_id?: string;
  counterparty_id?: string;
  description: string;
  amount: number;
  event_date: string;
  effective_date?: string;
  status: 'pendente' | 'concluido';
  type: 'receita' | 'despesa';
  tags?: string[]; // Tag names to associate
}

export interface InstallmentData {
  description: string;
  amount: number;
  eventDate: string;
  firstEffectiveDate: string;
  creditCardId?: string;
  accountId?: string;
  categoryId?: string;
  totalInstallments: number;
  type: 'receita' | 'despesa';
  status: 'pendente' | 'concluido';
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
          categories!left (
            name
          ),
          accounts!left (
            name
          ),
          credit_cards!left (
            name
          ),
          counterparties!left (
            id,
            name
          )
        `)
        .eq('user_id', user.id);

      // Apply filters
      if (filters.startDate || filters.endDate) {
        const dateColumn = filters.dateBase === 'effective' ? 'effective_date' : 'event_date';
        
        if (filters.startDate) {
          query = query.gte(dateColumn, filters.startDate);
        }
        
        if (filters.endDate) {
          query = query.lte(dateColumn, filters.endDate);
        }
      }

      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      // Handle multiple account IDs (new functionality)
      if (filters.accountIds && filters.accountIds.length > 0) {
        query = query.in('account_id', filters.accountIds);
      } else if (filters.accountId) {
        // Keep backward compatibility with single accountId
        query = query.eq('account_id', filters.accountId);
      }

      if (filters.creditCardId) {
        query = query.eq('credit_card_id', filters.creditCardId);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.q) {
        query = query.ilike('description', `%${filters.q}%`);
      }

      if (filters.withoutCategory) {
        query = query.is('category_id', null);
      }

      const { data, error } = await query.order('event_date', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our expected type structure
      let transformedData = (data || []).map(item => ({
        ...item,
        categories: item.categories && !('error' in item.categories) ? item.categories : null,
        accounts: item.accounts && !('error' in item.accounts) ? item.accounts : null,
        credit_cards: item.credit_cards && !('error' in item.credit_cards) ? item.credit_cards : null,
        counterparties: item.counterparties && !('error' in item.counterparties) ? item.counterparties : null,
        status: item.status as 'pendente' | 'concluido',
        type: item.type as 'receita' | 'despesa',
      })) as TransactionWithRelations[];

      // Fetch tags for each transaction
      if (transformedData.length > 0) {
        const transactionIds = transformedData.map(t => t.id);
        const { data: tagsData, error: tagsError } = await supabase
          .from('transaction_tags')
          .select(`
            transaction_id,
            tags!inner (
              id,
              name,
              color
            )
          `)
          .in('transaction_id', transactionIds);

        if (tagsError) {
          console.error('Error fetching transaction tags:', tagsError);
        } else {
          // Group tags by transaction
          const tagsByTransaction = (tagsData || []).reduce((acc, item) => {
            if (!acc[item.transaction_id]) {
              acc[item.transaction_id] = [];
            }
            acc[item.transaction_id].push({
              name: item.tags.name,
              color: item.tags.color,
            });
            return acc;
          }, {} as Record<string, { name: string; color: string | null }[]>);

          // Add tags to transactions
          transformedData = transformedData.map(transaction => ({
            ...transaction,
            tags: tagsByTransaction[transaction.id] || [],
          }));
        }
      }

      // Apply tag filters if specified
      if (filters.tagIds && filters.tagIds.length > 0) {
        transformedData = transformedData.filter(transaction => 
          transaction.tags?.some(tag => filters.tagIds!.includes(tag.name)) || false
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

      const { data: transaction, error } = await supabase
        .from('transactions')
        .insert({
          ...transactionFields,
          user_id: user.id,
          type: transactionData.amount >= 0 ? 'receita' : 'despesa',
        })
        .select()
        .single();

      if (error) throw error;

      // Associate tags if provided
      if (tags && tags.length > 0) {
        // Get or create tags
        const tagIds = [];
        for (const tagName of tags) {
          let { data: existingTag, error: tagError } = await supabase
            .from('tags')
            .select('id')
            .eq('user_id', user.id)
            .ilike('name', tagName)
            .maybeSingle();

          if (tagError && tagError.code !== 'PGRST116') {
            throw tagError;
          }

          if (!existingTag) {
            const { data: newTag, error: createTagError } = await supabase
              .from('tags')
              .insert({
                user_id: user.id,
                name: tagName,
              })
              .select('id')
              .single();

            if (createTagError) throw createTagError;
            tagIds.push(newTag.id);
          } else {
            tagIds.push(existingTag.id);
          }
        }

        // Create transaction-tag associations
        if (tagIds.length > 0) {
          const { error: linkError } = await supabase
            .from('transaction_tags')
            .insert(
              tagIds.map(tagId => ({
                transaction_id: transaction.id,
                tag_id: tagId,
                user_id: user.id,
              }))
            );

          if (linkError) throw linkError;
        }
      }

      return transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['account-balances', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['uncategorized-count', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['budget-actuals'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['provisioned-totals', user?.id], exact: false });
      queryClient.invalidateQueries({ queryKey: ['tags', user?.id] });
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
    mutationFn: async ({ id, tags, ...updates }: Partial<Transaction> & { id: string; tags?: string[] }) => {
      // Determine type based on amount if amount is being updated
      const updateData = { ...updates };
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
          const tagIds = [];
          for (const tagName of tags) {
            let { data: existingTag, error: tagError } = await supabase
              .from('tags')
              .select('id')
              .eq('user_id', user!.id)
              .ilike('name', tagName)
              .maybeSingle();

            if (tagError && tagError.code !== 'PGRST116') {
              throw tagError;
            }

            if (!existingTag) {
              const { data: newTag, error: createTagError } = await supabase
                .from('tags')
                .insert({
                  user_id: user!.id,
                  name: tagName,
                })
                .select('id')
                .single();

              if (createTagError) throw createTagError;
              tagIds.push(newTag.id);
            } else {
              tagIds.push(existingTag.id);
            }
          }

          if (tagIds.length > 0) {
            const { error: linkError } = await supabase
              .from('transaction_tags')
              .insert(
                tagIds.map(tagId => ({
                  transaction_id: id,
                  tag_id: tagId,
                  user_id: user!.id,
                }))
              );

            if (linkError) throw linkError;
          }
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['account-balances', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['uncategorized-count', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['budget-actuals'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['provisioned-totals', user?.id], exact: false });
      queryClient.invalidateQueries({ queryKey: ['tags', user?.id] });
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
      queryClient.invalidateQueries({ queryKey: ['account-balances', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['uncategorized-count', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['budget-actuals'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['provisioned-totals', user?.id], exact: false });
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
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', ids);

      if (error) throw error;
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['account-balances', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['uncategorized-count', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['budget-actuals'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['provisioned-totals', user?.id], exact: false });
      toast({
        title: "Lançamentos excluídos",
        description: `${ids.length} lançamento${ids.length > 1 ? 's foram excluídos' : ' foi excluído'} com sucesso.`,
      });
    },
    onError: (error) => {
      console.error('Error deleting transactions:', error);
      toast({
        title: "Erro ao excluir lançamentos",
        description: "Não foi possível excluir os lançamentos selecionados. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const createInstallmentsMutation = useMutation({
    mutationFn: async (installmentData: InstallmentData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const installmentId = crypto.randomUUID();
      const transactions = [];

      for (let i = 1; i <= installmentData.totalInstallments; i++) {
        const effectiveDate = new Date(installmentData.firstEffectiveDate);
        effectiveDate.setMonth(effectiveDate.getMonth() + (i - 1));
        
        const eventDate = i === 1 ? installmentData.eventDate : installmentData.firstEffectiveDate;

        transactions.push({
          user_id: user.id,
          account_id: installmentData.accountId || null,
          credit_card_id: installmentData.creditCardId || null,
          category_id: installmentData.categoryId || null,
          description: `${installmentData.description} (${i}/${installmentData.totalInstallments})`,
          amount: installmentData.amount,
          event_date: eventDate,
          effective_date: effectiveDate.toISOString().slice(0, 10),
          status: installmentData.status,
          type: installmentData.type,
          installment_id: installmentId,
          installment_number: i,
          total_installments: installmentData.totalInstallments,
        });
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert(transactions)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['account-balances', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['uncategorized-count', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['budget-actuals'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['provisioned-totals', user?.id], exact: false });
      toast({
        title: "Lançamentos parcelados criados",
        description: "Todos os lançamentos parcelados foram criados com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error creating installments:', error);
      toast({
        title: "Erro ao criar lançamentos parcelados",
        description: "Não foi possível criar os lançamentos parcelados. Tente novamente.",
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
    createInstallments: createInstallmentsMutation.mutate,
    isCreating: createTransactionMutation.isPending,
    isUpdating: updateTransactionMutation.isPending,
    isDeleting: deleteTransactionMutation.isPending || deleteBulkTransactionsMutation.isPending,
    isCreatingInstallments: createInstallmentsMutation.isPending,
  };
}
