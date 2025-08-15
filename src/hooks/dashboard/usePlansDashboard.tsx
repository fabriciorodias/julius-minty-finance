
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PlansCommitment {
  plannedAmount: number;
  settledAmount: number;
  commitmentPercentage: number;
}

export interface PendingPlan {
  planName: string;
  dueAmount: number;
  dueDate: string;
}

export interface SavingsAccumulated {
  planName: string;
  accumulatedAmount: number;
}

export function usePlansCommitment(selectedMonth: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['plans-commitment', user?.id, selectedMonth],
    queryFn: async (): Promise<PlansCommitment> => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('plan_installments')
        .select('planned_amount, settled_amount')
        .eq('user_id', user.id)
        .like('due_date', `${selectedMonth.slice(0, 7)}%`);

      if (error) throw error;

      const plannedAmount = (data || []).reduce((sum, inst) => sum + inst.planned_amount, 0);
      const settledAmount = (data || []).reduce((sum, inst) => sum + inst.settled_amount, 0);

      return {
        plannedAmount,
        settledAmount,
        commitmentPercentage: plannedAmount > 0 ? (settledAmount / plannedAmount) * 100 : 0,
      };
    },
    enabled: !!user?.id,
  });
}

export function usePendingPlans(selectedMonth: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pending-plans', user?.id, selectedMonth],
    queryFn: async (): Promise<PendingPlan[]> => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('plan_installments')
        .select(`
          planned_amount,
          due_date,
          plans!inner (
            name
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'pendente')
        .like('due_date', `${selectedMonth.slice(0, 7)}%`);

      if (error) throw error;

      return (data || []).map(item => ({
        planName: (item.plans as any).name,
        dueAmount: item.planned_amount,
        dueDate: item.due_date,
      }));
    },
    enabled: !!user?.id,
  });
}

export function useSavingsAccumulated() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['savings-accumulated', user?.id],
    queryFn: async (): Promise<SavingsAccumulated[]> => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('plan_installments')
        .select(`
          settled_amount,
          plans!inner (
            name,
            type
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'quitado');

      if (error) throw error;

      const planTotals: { [key: string]: number } = {};

      (data || []).forEach(item => {
        const plan = item.plans as any;
        if (plan.type === 'poupanca') {
          planTotals[plan.name] = (planTotals[plan.name] || 0) + item.settled_amount;
        }
      });

      // Get withdrawals to subtract from savings
      const { data: withdrawals, error: withdrawalsError } = await supabase
        .from('plan_withdrawals')
        .select(`
          amount,
          plans!inner (
            name,
            type
          )
        `)
        .eq('user_id', user.id);

      if (withdrawalsError) throw withdrawalsError;

      (withdrawals || []).forEach(withdrawal => {
        const plan = withdrawal.plans as any;
        if (plan.type === 'poupanca' && planTotals[plan.name]) {
          planTotals[plan.name] -= withdrawal.amount;
        }
      });

      return Object.entries(planTotals)
        .map(([planName, accumulatedAmount]) => ({
          planName,
          accumulatedAmount: Math.max(0, accumulatedAmount),
        }))
        .filter(item => item.accumulatedAmount > 0)
        .sort((a, b) => b.accumulatedAmount - a.accumulatedAmount);
    },
    enabled: !!user?.id,
  });
}
