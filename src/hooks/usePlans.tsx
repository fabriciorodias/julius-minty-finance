
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

export interface Plan {
  id: string;
  user_id: string;
  name: string;
  type: 'poupanca' | 'divida';
  total_amount: number;
  start_date: string;
  end_date: string;
  image_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanInstallment {
  id: string;
  plan_id: string;
  user_id: string;
  due_date: string;
  planned_amount: number;
  settled_amount: number;
  settled_date: string | null;
  status: 'pendente' | 'quitado';
  created_at: string;
  updated_at: string;
}

export interface PlanWithInstallments extends Plan {
  installments: PlanInstallment[];
  withdrawals: PlanWithdrawal[];
}

export interface PlanWithdrawal {
  id: string;
  plan_id: string;
  user_id: string;
  amount: number;
  withdrawal_date: string;
  notes: string | null;
  created_at: string;
}

export interface CreatePlanData {
  name: string;
  type: 'poupanca' | 'divida';
  total_amount: number;
  start_date: string;
  end_date: string;
  image_url?: string;
  notes?: string;
}

export interface SettleInstallmentData {
  installment_id: string;
  settled_amount: number;
  settled_date: string;
  advance_remaining?: boolean;
}

export interface CreateWithdrawalData {
  plan_id: string;
  amount: number;
  withdrawal_date: string;
  notes?: string;
}

export function usePlans() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: plans = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['plans', user?.id],
    queryFn: async (): Promise<PlanWithInstallments[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('plans')
        .select(`
          *,
          installments:plan_installments(*),
          withdrawals:plan_withdrawals(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type assertion to ensure proper typing
      return (data || []) as PlanWithInstallments[];
    },
    enabled: !!user?.id,
  });

  const createPlanMutation = useMutation({
    mutationFn: async (planData: CreatePlanData) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Calculate months between start and end date
      const startDate = new Date(planData.start_date);
      const endDate = new Date(planData.end_date);
      const months = [];
      
      const current = new Date(startDate);
      while (current <= endDate) {
        months.push(new Date(current));
        current.setMonth(current.getMonth() + 1);
      }

      const monthlyAmount = planData.total_amount / months.length;

      // Create plan
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .insert({
          ...planData,
          user_id: user.id,
        })
        .select()
        .single();

      if (planError) throw planError;

      // Create installments
      const installments = months.map((month) => ({
        plan_id: plan.id,
        user_id: user.id,
        due_date: month.toISOString().slice(0, 10),
        planned_amount: monthlyAmount,
      }));

      const { error: installmentsError } = await supabase
        .from('plan_installments')
        .insert(installments);

      if (installmentsError) throw installmentsError;

      return plan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans', user?.id] });
      toast({
        title: "Plano criado",
        description: "O plano foi criado com sucesso e as parcelas foram geradas.",
      });
    },
    onError: (error) => {
      console.error('Error creating plan:', error);
      toast({
        title: "Erro ao criar plano",
        description: "Não foi possível criar o plano. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Plan> & { id: string }) => {
      const { data, error } = await supabase
        .from('plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans', user?.id] });
      toast({
        title: "Plano atualizado",
        description: "O plano foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error updating plan:', error);
      toast({
        title: "Erro ao atualizar plano",
        description: "Não foi possível atualizar o plano. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const settleInstallmentMutation = useMutation({
    mutationFn: async (data: SettleInstallmentData) => {
      const { data: installment, error } = await supabase
        .from('plan_installments')
        .update({
          settled_amount: data.settled_amount,
          settled_date: data.settled_date,
          status: 'quitado',
        })
        .eq('id', data.installment_id)
        .select()
        .single();

      if (error) throw error;

      // Handle advance payment logic if requested
      if (data.advance_remaining && data.settled_amount > installment.planned_amount) {
        const excess = data.settled_amount - installment.planned_amount;
        
        // Get pending installments for the same plan
        const { data: pendingInstallments, error: fetchError } = await supabase
          .from('plan_installments')
          .select('*')
          .eq('plan_id', installment.plan_id)
          .eq('status', 'pendente')
          .gt('due_date', installment.due_date)
          .order('due_date', { ascending: true });

        if (fetchError) throw fetchError;

        let remainingExcess = excess;
        const updates = [];

        for (const pending of pendingInstallments) {
          if (remainingExcess <= 0) break;
          
          const amountToSettle = Math.min(remainingExcess, pending.planned_amount);
          updates.push({
            id: pending.id,
            settled_amount: amountToSettle,
            settled_date: data.settled_date,
            status: amountToSettle >= pending.planned_amount ? 'quitado' : 'pendente',
          });
          
          remainingExcess -= amountToSettle;
        }

        // Update advance payments
        for (const update of updates) {
          await supabase
            .from('plan_installments')
            .update({
              settled_amount: update.settled_amount,
              settled_date: update.settled_date,
              status: update.status,
            })
            .eq('id', update.id);
        }
      }

      return installment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans', user?.id] });
      toast({
        title: "Parcela quitada",
        description: "A parcela foi quitada com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error settling installment:', error);
      toast({
        title: "Erro ao quitar parcela",
        description: "Não foi possível quitar a parcela. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const createWithdrawalMutation = useMutation({
    mutationFn: async (withdrawalData: CreateWithdrawalData) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('plan_withdrawals')
        .insert({
          ...withdrawalData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans', user?.id] });
      toast({
        title: "Retirada registrada",
        description: "A retirada foi registrada com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error creating withdrawal:', error);
      toast({
        title: "Erro ao registrar retirada",
        description: "Não foi possível registrar a retirada. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateInstallmentsMutation = useMutation({
    mutationFn: async (installments: Partial<PlanInstallment>[]) => {
      const updates = installments.map(async (installment) => {
        const { error } = await supabase
          .from('plan_installments')
          .update({ planned_amount: installment.planned_amount })
          .eq('id', installment.id);
        
        if (error) throw error;
      });

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans', user?.id] });
      toast({
        title: "Linha do tempo atualizada",
        description: "As parcelas foram reagendadas com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error updating installments:', error);
      toast({
        title: "Erro ao atualizar linha do tempo",
        description: "Não foi possível atualizar as parcelas. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    plans,
    isLoading,
    error,
    createPlan: createPlanMutation.mutate,
    updatePlan: updatePlanMutation.mutate,
    settleInstallment: settleInstallmentMutation.mutate,
    createWithdrawal: createWithdrawalMutation.mutate,
    updateInstallments: updateInstallmentsMutation.mutate,
    isCreating: createPlanMutation.isPending,
    isUpdating: updatePlanMutation.isPending,
    isSettling: settleInstallmentMutation.isPending,
    isCreatingWithdrawal: createWithdrawalMutation.isPending,
    isUpdatingInstallments: updateInstallmentsMutation.isPending,
  };
}
