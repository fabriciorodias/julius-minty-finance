
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AccountBalance {
  account_id: string;
  current_balance: number;
}

export function useAccountBalances() {
  const { user } = useAuth();

  const { data: balances = [], isLoading, error } = useQuery({
    queryKey: ['account-balances', user?.id],
    queryFn: async (): Promise<AccountBalance[]> => {
      if (!user?.id) return [];
      
      const today = new Date().toISOString().slice(0, 10);
      
      const { data, error } = await supabase
        .rpc('get_account_balances', { p_as_of_date: today });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

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
