
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export interface AccountBalance {
  account_id: string;
  current_balance: number;
}

export function useAccountBalances() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: balances = [], isLoading, error } = useQuery({
    queryKey: ['account-balances', user?.id],
    queryFn: async (): Promise<AccountBalance[]> => {
      if (!user?.id) return [];
      
      const today = new Date().toISOString().slice(0, 10);
      
      console.log('🏦 Fetching account balances for date:', today);
      
      const { data, error } = await supabase
        .rpc('get_account_balances_for_user', { 
          p_user_id: user.id, 
          p_as_of_date: today 
        });

      if (error) {
        console.error('❌ Error fetching account balances:', error);
        throw error;
      }
      
      console.log('✅ Account balances fetched:', data);
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: true,
  });

  // Set up real-time subscriptions to invalidate cache when data changes
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔄 Setting up realtime subscriptions for account balances');

    const transactionsChannel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        (payload) => {
          console.log('💰 Transaction changed, invalidating account balances:', payload);
          queryClient.invalidateQueries({ queryKey: ['account-balances', user.id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'account_initial_balances'
        },
        (payload) => {
          console.log('🏦 Initial balance changed, invalidating account balances:', payload);
          queryClient.invalidateQueries({ queryKey: ['account-balances', user.id] });
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up realtime subscriptions for account balances');
      supabase.removeChannel(transactionsChannel);
    };
  }, [user?.id, queryClient]);

  // Convert to a map for easy lookup
  const balanceMap = balances.reduce((acc, balance) => {
    acc[balance.account_id] = balance.current_balance;
    return acc;
  }, {} as Record<string, number>);

  return {
    balances,
    balanceMap,
    isLoading,
    error,
  };
}
