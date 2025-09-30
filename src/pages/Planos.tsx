
import React, { useState } from 'react';
import { NotionButton } from '@/components/ui/notion-button';
import { NotionCard, NotionCardContent } from '@/components/ui/notion-card';
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
            <h1 className="text-notion-h1 text-notion-gray-900">Meus Planos</h1>
            <p className="text-notion-caption text-notion-gray-600 mt-1">
              Gerencie seus objetivos financeiros
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-notion-blue"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-notion-h1 text-notion-gray-900">Meus Planos</h1>
          <p className="text-notion-caption text-notion-gray-600 mt-1">
            Gerencie seus objetivos financeiros
          </p>
        </div>
        <NotionButton onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Criar Novo Plano
        </NotionButton>
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NotionCard variant="hoverable" className="transition-notion">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-notion-caption text-notion-gray-600">Parcelas dos Planos</p>
                <p className="text-notion-value tabular-nums text-notion-gray-900">
                  {formatCurrency(monthlyPlanAmount)}
                </p>
              </div>
              <div className="bg-notion-gray-100 rounded-md p-2">
                <TrendingUp className="h-6 w-6 text-notion-gray-700" />
              </div>
            </div>
          </div>
        </NotionCard>
        
        <NotionCard variant="hoverable" className="transition-notion">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-notion-caption text-notion-gray-600">Total de Planos</p>
                <p className="text-notion-value tabular-nums text-notion-gray-900">
                  {plans.length}
                </p>
              </div>
              <div className="bg-notion-gray-100 rounded-md p-2">
                <Target className="h-6 w-6 text-notion-gray-700" />
              </div>
            </div>
          </div>
        </NotionCard>
        
        <NotionCard variant="hoverable" className="transition-notion">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-notion-caption text-notion-gray-600">Planos Ativos</p>
                <p className="text-notion-value tabular-nums text-notion-gray-900">
                  {plans.filter(plan => 
                    plan.installments.some(inst => inst.status === 'pendente')
                  ).length}
                </p>
              </div>
              <div className="bg-notion-gray-100 rounded-md p-2">
                <CheckCircle className="h-6 w-6 text-notion-gray-700" />
              </div>
            </div>
          </div>
        </NotionCard>
      </div>

      {/* Plans Grid */}
      {plans.length === 0 ? (
        <NotionCard variant="muted" padding="md">
          <div className="text-center py-12">
            <div className="bg-notion-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="material-icons text-notion-gray-600 text-2xl">
                flag
              </span>
            </div>
            <h3 className="text-notion-h3 text-notion-gray-900 mb-2">
              Nenhum plano criado ainda
            </h3>
            <p className="text-notion-body-sm text-notion-gray-600 mb-6 max-w-md mx-auto">
              Comece criando seu primeiro plano financeiro. Defina suas metas de poupança 
              ou organize o pagamento de dívidas e financiamentos.
            </p>
            <NotionButton onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Criar Primeiro Plano
            </NotionButton>
          </div>
        </NotionCard>
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
