import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

export interface Account {
  id: string;
  user_id: string;
  institution_id: string;
  name: string;
  type: 'on_budget' | 'credit'; // Legacy field - mantido para compatibilidade
  kind: 'asset' | 'liability';
  subtype: 'cash' | 'bank' | 'investment' | 'property_rights' | 'other_assets' | 'credit_card' | 'loan' | 'other_liabilities';
  credit_limit?: number;
  is_active: boolean;
  last_reconciled_at?: string;
  last_reconciliation_method?: 'manual' | 'automacao' | 'open_finance';
  next_due_date?: string;
  created_at: string;
}

// Helper functions para manter compatibilidade
export const isCreditCard = (account: Account): boolean => {
  return account.subtype === 'credit_card';
};

export const isBudgetAccount = (account: Account): boolean => {
  return account.kind === 'asset';
};

// Mapeamento de subtipos para labels em português
export const SUBTYPE_LABELS: Record<Account['subtype'], string> = {
  cash: 'Dinheiro',
  bank: 'Conta Bancária',
  investment: 'Investimentos',
  property_rights: 'Bens e Direitos',
  other_assets: 'Outros Ativos',
  credit_card: 'Cartão de Crédito',
  loan: 'Empréstimos',
  other_liabilities: 'Outros Passivos',
};

// Mapeamento de métodos de conciliação para labels em português
export const RECONCILIATION_METHOD_LABELS: Record<NonNullable<Account['last_reconciliation_method']>, string> = {
  manual: 'Manual',
  automacao: 'Automação',
  open_finance: 'Open Finance',
};

// Agrupamento de subtipos por kind
export const ASSET_SUBTYPES: Account['subtype'][] = [
  'cash', 'bank', 'investment', 'property_rights', 'other_assets'
];

export const LIABILITY_SUBTYPES: Account['subtype'][] = [
  'credit_card', 'loan', 'other_liabilities'
];

export function useAccounts(institutionId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading, error } = useQuery({
    queryKey: ['accounts', user?.id, institutionId],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id);

      if (institutionId) {
        query = query.eq('institution_id', institutionId);
      }

      const { data, error } = await query.order('name');

      if (error) throw error;
      return data as Account[];
    },
    enabled: !!user?.id,
  });

  const createAccountMutation = useMutation({
    mutationFn: async (accountData: any) => {
      if (!user?.id) throw new Error('User not authenticated');

      console.log('Creating account with data:', accountData);

      // Separate account data from initial balance data
      const { initial_balance, balance_date, next_due_date, ...cleanAccountData } = accountData;

      // Garantir compatibilidade: se não vier kind/subtype, derivar do type
      if (!cleanAccountData.kind || !cleanAccountData.subtype) {
        if (cleanAccountData.type === 'on_budget') {
          cleanAccountData.kind = 'asset';
          cleanAccountData.subtype = 'bank';
        } else if (cleanAccountData.type === 'credit') {
          cleanAccountData.kind = 'liability';
          cleanAccountData.subtype = 'credit_card';
        }
      }

      // Definir type para compatibilidade
      if (!cleanAccountData.type) {
        cleanAccountData.type = cleanAccountData.kind === 'asset' ? 'on_budget' : 'credit';
      }

      console.log('Clean account data:', cleanAccountData);
      console.log('Initial balance data:', { initial_balance, balance_date });

      // Insert the account first
      const { data: newAccount, error: accountError } = await supabase
        .from('accounts')
        .insert({
          ...cleanAccountData,
          user_id: user.id,
          next_due_date: next_due_date || null,
        })
        .select()
        .single();

      if (accountError) {
        console.error('Account creation error:', accountError);
        throw accountError;
      }

      console.log('Account created successfully:', newAccount);

      // If there's an initial balance, insert it into account_initial_balances
      if ((initial_balance !== null && initial_balance !== undefined) && balance_date) {
        // Convert Date object to YYYY-MM-DD format
        const formattedDate = balance_date instanceof Date 
          ? balance_date.toISOString().split('T')[0]
          : balance_date;

        console.log('Inserting initial balance:', {
          user_id: user.id,
          account_id: newAccount.id,
          amount: initial_balance,
          balance_date: formattedDate,
        });

        const { error: balanceError } = await supabase
          .from('account_initial_balances')
          .insert({
            user_id: user.id,
            account_id: newAccount.id,
            amount: initial_balance,
            balance_date: formattedDate,
          });

        if (balanceError) {
          console.error('Initial balance creation error:', balanceError);
          throw balanceError;
        }

        console.log('Initial balance created successfully');
      }

      return newAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['account-balances', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['account-initial-balance', user?.id] });
      toast({
        title: "Conta criada",
        description: "A conta foi criada com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('Error creating account:', error);
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Não foi possível criar a conta. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: async ({ id, initial_balance, balance_date, next_due_date, ...updates }: Partial<Account> & { id: string; initial_balance?: number; balance_date?: Date; next_due_date?: Date }) => {
      console.log('Updating account with data:', { id, initial_balance, balance_date, next_due_date, updates });

      // Garantir compatibilidade: se não vier kind/subtype, derivar do type
      if (updates.type && (!updates.kind || !updates.subtype)) {
        if (updates.type === 'on_budget') {
          updates.kind = 'asset';
          updates.subtype = 'bank';
        } else if (updates.type === 'credit') {
          updates.kind = 'liability';
          updates.subtype = 'credit_card';
        }
      }

      // Definir type para compatibilidade se não estiver definido
      if (updates.kind && !updates.type) {
        updates.type = updates.kind === 'asset' ? 'on_budget' : 'credit';
      }

      // Update account data
      const { data, error } = await supabase
        .from('accounts')
        .update({
          ...updates,
          next_due_date: next_due_date ? next_due_date.toISOString().split('T')[0] : null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Account update error:', error);
        throw error;
      }

      console.log('Account updated successfully:', data);

      // Handle initial balance update
      if (initial_balance !== undefined) {
        // Convert Date object to YYYY-MM-DD format
        const formattedDate = balance_date instanceof Date 
          ? balance_date.toISOString().split('T')[0]
          : balance_date;

        if ((initial_balance !== null && initial_balance !== undefined) && formattedDate) {
          // Check if initial balance already exists
          console.log('Checking if initial balance exists for account:', id);
          const { data: existingBalance } = await supabase
            .from('account_initial_balances')
            .select('id')
            .eq('account_id', id)
            .eq('user_id', user?.id)
            .single();

          if (existingBalance) {
            // Update existing initial balance
            console.log('Updating existing initial balance:', {
              account_id: id,
              amount: initial_balance,
              balance_date: formattedDate,
            });

            const { error: updateError } = await supabase
              .from('account_initial_balances')
              .update({
                amount: initial_balance,
                balance_date: formattedDate,
              })
              .eq('account_id', id)
              .eq('user_id', user?.id);

            if (updateError) {
              console.error('Initial balance update error:', updateError);
              throw updateError;
            }

            console.log('Initial balance updated successfully');
          } else {
            // Insert new initial balance
            console.log('Inserting new initial balance:', {
              user_id: user?.id,
              account_id: id,
              amount: initial_balance,
              balance_date: formattedDate,
            });

            const { error: insertError } = await supabase
              .from('account_initial_balances')
              .insert({
                user_id: user?.id,
                account_id: id,
                amount: initial_balance,
                balance_date: formattedDate,
              });

            if (insertError) {
              console.error('Initial balance insert error:', insertError);
              throw insertError;
            }

            console.log('Initial balance inserted successfully');
          }
        } else if (initial_balance === null || initial_balance === undefined) {
          // Remove initial balance if explicitly cleared
          console.log('Removing initial balance for account:', id);

          const { error: deleteError } = await supabase
            .from('account_initial_balances')
            .delete()
            .eq('account_id', id)
            .eq('user_id', user?.id);

          if (deleteError) {
            console.error('Initial balance delete error:', deleteError);
            throw deleteError;
          }

          console.log('Initial balance removed successfully');
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['account-balances', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['account-initial-balance', user?.id] });
      toast({
        title: "Conta atualizada",
        description: "A conta foi atualizada com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('Error updating account:', error);
      toast({
        title: "Erro ao atualizar conta",
        description: error.message || "Não foi possível atualizar a conta. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteAccountSafelyMutation = useMutation({
    mutationFn: async (id: string) => {
      // Verificar se há lançamentos associados
      const { data: transactions } = await supabase
        .from('transactions')
        .select('id')
        .eq('account_id', id)
        .limit(1);

      if (transactions && transactions.length > 0) {
        throw new Error('HAS_TRANSACTIONS');
      }

      // Se não há dependências, proceder com a exclusão
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['account-balances', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['account-initial-balance', user?.id] });
      toast({
        title: "Conta excluída",
        description: "A conta foi excluída com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting account:', error);
      
      if (error.message === 'HAS_TRANSACTIONS') {
        toast({
          title: "Não é possível excluir a conta",
          description: "Esta conta possui lançamentos associados. Desative-a para manter o histórico ou remova os lançamentos primeiro.",
          variant: "destructive",
        });
      } else if (error.code === '23503') {
        toast({
          title: "Não é possível excluir a conta",
          description: "Esta conta possui lançamentos associados. Desative-a para manter o histórico.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao excluir conta",
          description: error.message || "Não foi possível excluir a conta. Tente novamente.",
          variant: "destructive",
        });
      }
    },
  });

  const reconcileAccountMutation = useMutation({
    mutationFn: async ({ accountId, reconciledAt, method = 'manual' }: { 
      accountId: string; 
      reconciledAt: Date; 
      method?: 'manual' | 'automacao' | 'open_finance' 
    }) => {
      const { data, error } = await supabase
        .from('accounts')
        .update({ 
          last_reconciled_at: reconciledAt.toISOString(),
          last_reconciliation_method: method
        })
        .eq('id', accountId)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) {
        console.error('Account reconciliation error:', error);
        throw error;
      }

      console.log('Account reconciled successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts', user?.id] });
      toast({
        title: "Conta conciliada",
        description: "A conciliação foi registrada com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('Error reconciling account:', error);
      toast({
        title: "Erro ao conciliar conta",
        description: error.message || "Não foi possível registrar a conciliação. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    accounts,
    isLoading,
    error,
    createAccount: createAccountMutation.mutate,
    updateAccount: updateAccountMutation.mutate,
    deleteAccount: deleteAccountSafelyMutation.mutate,
    deleteAccountSafely: deleteAccountSafelyMutation.mutate,
    reconcileAccount: reconcileAccountMutation.mutate,
    isCreating: createAccountMutation.isPending,
    isUpdating: updateAccountMutation.isPending,
    isDeleting: deleteAccountSafelyMutation.isPending,
    isReconciling: reconcileAccountMutation.isPending,
  };
}
