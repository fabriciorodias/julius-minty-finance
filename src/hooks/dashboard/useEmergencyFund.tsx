
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface EmergencyFundProgress {
  targetAmount: number;
  currentAmount: number;
  progressPercentage: number;
  monthlyTarget: number;
  monthsRemaining: number;
}

export function useEmergencyFund() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['emergency-fund-progress', user?.id],
    queryFn: async (): Promise<EmergencyFundProgress> => {
      if (!user?.id) {
        return {
          targetAmount: 0,
          currentAmount: 0,
          progressPercentage: 0,
          monthlyTarget: 0,
          monthsRemaining: 0,
        };
      }

      // Get emergency fund plan (assuming it's a savings plan with "emergência" in the name)
      const { data: emergencyPlan, error: planError } = await supabase
        .from('plans')
        .select('id, name, total_amount, start_date, end_date')
        .eq('user_id', user.id)
        .eq('type', 'poupanca')
        .ilike('name', '%emergência%')
        .single();

      if (planError || !emergencyPlan) {
        return {
          targetAmount: 0,
          currentAmount: 0,
          progressPercentage: 0,
          monthlyTarget: 0,
          monthsRemaining: 0,
        };
      }

      // Get settled installments for the emergency fund
      const { data: settledInstallments, error: installmentsError } = await supabase
        .from('plan_installments')
        .select('settled_amount')
        .eq('user_id', user.id)
        .eq('plan_id', emergencyPlan.id)
        .eq('status', 'quitado');

      if (installmentsError) throw installmentsError;

      // Get withdrawals to subtract from the current amount
      const { data: withdrawals, error: withdrawalsError } = await supabase
        .from('plan_withdrawals')
        .select('amount')
        .eq('user_id', user.id)
        .eq('plan_id', emergencyPlan.id);

      if (withdrawalsError) throw withdrawalsError;

      const currentAmount = (settledInstallments?.reduce((sum, inst) => sum + inst.settled_amount, 0) || 0) -
                           (withdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0);

      const targetAmount = emergencyPlan.total_amount;
      const progressPercentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;

      // Calculate monthly target and months remaining
      const startDate = new Date(emergencyPlan.start_date);
      const endDate = new Date(emergencyPlan.end_date);
      const totalMonths = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
      const monthlyTarget = totalMonths > 0 ? targetAmount / totalMonths : 0;

      const now = new Date();
      const monthsRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)));

      return {
        targetAmount,
        currentAmount: Math.max(0, currentAmount),
        progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
        monthlyTarget,
        monthsRemaining,
      };
    },
    enabled: !!user?.id,
  });
}
