
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { OriginCard, OriginCardHeader, OriginCardTitle, OriginCardContent } from '@/components/ui/origin-card';
import { MetricCard } from '@/components/ui/metric-card';
import { Plus, TrendingUp, Target, CheckCircle } from 'lucide-react';
import { usePlans, PlanWithInstallments } from '@/hooks/usePlans';
import { PlanCard } from '@/components/plans/PlanCard';
import { CreatePlanModal } from '@/components/plans/CreatePlanModal';
import { SettleInstallmentModal } from '@/components/plans/SettleInstallmentModal';
import { WithdrawModal } from '@/components/plans/WithdrawModal';
import { TimelineModal } from '@/components/plans/TimelineModal';
import { EditPlanModal } from '@/components/plans/EditPlanModal';
import { DeleteConfirmationDialog } from '@/components/transactions/DeleteConfirmationDialog';

const Planos = () => {
  const {
    plans,
    isLoading,
    createPlan,
    updatePlan,
    deletePlan,
    settleInstallment,
    createWithdrawal,
    updateInstallments,
    isCreating,
    isUpdating,
    isDeleting,
    isSettling,
    isCreatingWithdrawal,
    isUpdatingInstallments,
  } = usePlans();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanWithInstallments | null>(null);

  const handleEdit = (plan: PlanWithInstallments) => {
    setSelectedPlan(plan);
    setIsEditModalOpen(true);
  };

  const handleDelete = (plan: PlanWithInstallments) => {
    setSelectedPlan(plan);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedPlan) {
      deletePlan(selectedPlan.id);
      setIsDeleteModalOpen(false);
      setSelectedPlan(null);
    }
  };

  const handleViewTimeline = (plan: PlanWithInstallments) => {
    setSelectedPlan(plan);
    setIsTimelineModalOpen(true);
  };

  const handleSettleInstallment = (plan: PlanWithInstallments) => {
    setSelectedPlan(plan);
    setIsSettleModalOpen(true);
  };

  const handleWithdraw = (plan: PlanWithInstallments) => {
    setSelectedPlan(plan);
    setIsWithdrawModalOpen(true);
  };

  // Calculate monthly summary
  const getCurrentMonthSummary = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.toISOString().slice(0, 7); // YYYY-MM format
    
    let monthlyPlanAmount = 0;
    plans.forEach(plan => {
      const monthlyInstallment = plan.installments.find(
        inst => inst.due_date.startsWith(currentMonth) && inst.status === 'pendente'
      );
      if (monthlyInstallment) {
        monthlyPlanAmount += monthlyInstallment.planned_amount;
      }
    });

    return monthlyPlanAmount;
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const monthlyPlanAmount = getCurrentMonthSummary();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-mint-text-primary">Meus Planos</h1>
            <p className="text-mint-text-secondary mt-1">
              Gerencie seus objetivos financeiros
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mint-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-mint-text-primary">Meus Planos</h1>
          <p className="text-mint-text-secondary mt-1">
            Gerencie seus objetivos financeiros
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Criar Novo Plano
        </Button>
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
        <MetricCard
          glass
          label="Parcelas dos Planos"
          value={formatCurrency(monthlyPlanAmount)}
          icon={TrendingUp}
          className="liquid-glass-primary"
        />
        
        <MetricCard
          glass
          label="Total de Planos"
          value={plans.length.toString()}
          icon={Target}
          className="liquid-glass-info"
        />
        
        <MetricCard
          glass
          label="Planos Ativos"
          value={plans.filter(plan => 
            plan.installments.some(inst => inst.status === 'pendente')
          ).length.toString()}
          icon={CheckCircle}
          className="liquid-glass-success"
        />
      </div>

      {/* Plans Grid */}
      {plans.length === 0 ? (
        <OriginCard glass className="liquid-glass-subtle animate-fade-in">
          <OriginCardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-white text-2xl">
                flag
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Nenhum plano criado ainda
            </h3>
            <p className="opacity-90 mb-6 max-w-md mx-auto">
              Comece criando seu primeiro plano financeiro. Defina suas metas de poupança 
              ou organize o pagamento de dívidas e financiamentos.
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 hover-scale">
              <Plus className="h-4 w-4" />
              Criar Primeiro Plano
            </Button>
          </OriginCardContent>
        </OriginCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onViewTimeline={handleViewTimeline}
              onSettleInstallment={handleSettleInstallment}
              onWithdraw={plan.type === 'poupanca' ? handleWithdraw : undefined}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreatePlanModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={createPlan}
        isLoading={isCreating}
      />

      <EditPlanModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPlan(null);
        }}
        onSave={(id, data) => {
          const updates: any = { id };
          if (data.name) updates.name = data.name;
          if (data.type) updates.type = data.type;
          if (data.payment_type) updates.payment_type = data.payment_type;
          if (data.total_amount) updates.total_amount = data.total_amount;
          if (data.start_date) updates.start_date = data.start_date;
          if (data.end_date) updates.end_date = data.end_date;
          if (data.notes !== undefined) updates.notes = data.notes;
          updatePlan(updates);
        }}
        plan={selectedPlan}
        isLoading={isUpdating}
      />

      <DeleteConfirmationDialog
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedPlan(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Excluir Plano"
        description={`Tem certeza que deseja excluir o plano "${selectedPlan?.name}"? Todas as parcelas e retiradas relacionadas também serão removidas. Esta ação não pode ser desfeita.`}
        isLoading={isDeleting}
      />

      <SettleInstallmentModal
        isOpen={isSettleModalOpen}
        onClose={() => {
          setIsSettleModalOpen(false);
          setSelectedPlan(null);
        }}
        onSave={settleInstallment}
        plan={selectedPlan}
        isLoading={isSettling}
      />

      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => {
          setIsWithdrawModalOpen(false);
          setSelectedPlan(null);
        }}
        onSave={createWithdrawal}
        plan={selectedPlan}
        isLoading={isCreatingWithdrawal}
      />

      <TimelineModal
        isOpen={isTimelineModalOpen}
        onClose={() => {
          setIsTimelineModalOpen(false);
          setSelectedPlan(null);
        }}
        onSave={updateInstallments}
        plan={selectedPlan}
        isLoading={isUpdatingInstallments}
      />
    </div>
  );
};

export default Planos;
