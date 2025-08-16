
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useAccountInitialBalance(accountId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['account-initial-balance', user?.id, accountId],
    queryFn: async () => {
      if (!user?.id || !accountId) return null;
      
      const { data, error } = await supabase
        .from('account_initial_balances')
        .select('*')
        .eq('user_id', user.id)
        .eq('account_id', accountId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    },
    enabled: !!user?.id && !!accountId,
  });
}
