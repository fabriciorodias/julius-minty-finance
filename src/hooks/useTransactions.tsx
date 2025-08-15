
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
  description: string;
  amount: number;
  event_date: string;
  effective_date: string;
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
}

export interface TransactionFilters {
  dateBase?: 'event' | 'effective';
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  accountId?: string;
  creditCardId?: string;
  status?: 'pendente' | 'concluido';
  q?: string;
}

export interface CreateTransactionData {
  account_id?: string;
  credit_card_id?: string;
  category_id?: string;
  description: string;
  amount: number;
  event_date: string;
  effective_date: string;
  status: 'pendente' | 'concluido';
  type: 'receita' | 'despesa';
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
          )
        `)
        .eq('user_id', user.id);

      // Aplicar filtros
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

      if (filters.accountId) {
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

      const { data, error } = await query.order('event_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (transactionData: CreateTransactionData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          ...transactionData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
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
    mutationFn: async ({ id, ...updates }: Partial<Transaction> & { id: string }) => {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
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
    createInstallments: createInstallmentsMutation.mutate,
    isCreating: createTransactionMutation.isPending,
    isUpdating: updateTransactionMutation.isPending,
    isDeleting: deleteTransactionMutation.isPending,
    isCreatingInstallments: createInstallmentsMutation.isPending,
  };
}
