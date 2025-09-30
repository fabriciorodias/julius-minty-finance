
import React from 'react';
import { NotionCard, NotionCardHeader, NotionCardTitle, NotionCardContent } from '@/components/ui/notion-card';
import { NotionButton } from '@/components/ui/notion-button';
import { Badge } from '@/components/ui/badge';
import { PlanWithInstallments } from '@/hooks/usePlans';

interface PlanCardProps {
  plan: PlanWithInstallments;
  onViewTimeline: (plan: PlanWithInstallments) => void;
  onSettleInstallment: (plan: PlanWithInstallments) => void;
  onWithdraw?: (plan: PlanWithInstallments) => void;
  onEdit: (plan: PlanWithInstallments) => void;
  onDelete: (plan: PlanWithInstallments) => void;
}

export function PlanCard({ plan, onViewTimeline, onSettleInstallment, onWithdraw, onEdit, onDelete }: PlanCardProps) {
  const totalSettled = plan.installments.reduce((sum, inst) => sum + inst.settled_amount, 0);
  const totalWithdrawn = plan.withdrawals.reduce((sum, w) => sum + w.amount, 0);
  const currentBalance = totalSettled - totalWithdrawn;
  const progressPercentage = (totalSettled / plan.total_amount) * 100;
  
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'poupanca':
        return { label: 'Poupança', icon: 'savings', variant: 'default' as const };
      case 'divida':
        return { label: 'Dívida', icon: 'account_balance', variant: 'secondary' as const };
      case 'despesa_planejada':
        return { label: 'Despesa Planejada', icon: 'shopping_cart', variant: 'destructive' as const };
      default:
        return { label: type, icon: 'description', variant: 'outline' as const };
    }
  };

  const typeInfo = getTypeInfo(plan.type);

  return (
    <NotionCard variant="interactive" className="transition-notion">
      <NotionCardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-notion-gray-100 flex items-center justify-center">
              {plan.image_url ? (
                <img 
                  src={plan.image_url} 
                  alt={plan.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <span className="material-icons text-notion-gray-700 text-xl">
                  {typeInfo.icon}
                </span>
              )}
            </div>
            <div>
              <NotionCardTitle className="text-lg">{plan.name}</NotionCardTitle>
              <Badge variant={typeInfo.variant} className="mt-1">
                {typeInfo.label}
              </Badge>
            </div>
          </div>
        </div>
      </NotionCardHeader>

      <NotionCardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-notion-caption text-notion-gray-600">
            <span>Progresso</span>
            <span className="font-medium text-notion-gray-900">
              {progressPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-2 bg-notion-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-notion ${
                plan.type === 'poupanca' ? 'bg-notion-success' : 
                plan.type === 'divida' ? 'bg-notion-warning' : 
                'bg-notion-blue'
              }`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-notion-caption text-notion-gray-600">Meta Total</p>
            <p className="text-notion-body font-semibold text-notion-gray-900">{formatCurrency(plan.total_amount)}</p>
          </div>
          <div>
            <p className="text-notion-caption text-notion-gray-600">
              {plan.type === 'poupanca' ? 'Guardado' : plan.type === 'despesa_planejada' ? 'Valor' : 'Pago'}
            </p>
            <p className="text-notion-body font-semibold text-notion-gray-900">{formatCurrency(totalSettled)}</p>
          </div>
        </div>

        {plan.type === 'poupanca' && totalWithdrawn > 0 && (
          <div>
            <p className="text-notion-caption text-notion-gray-600">Saldo Atual</p>
            <p className="text-notion-body font-semibold text-notion-gray-900">{formatCurrency(currentBalance)}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <NotionButton 
            variant="outline" 
            size="sm" 
            onClick={() => onViewTimeline(plan)}
            className="flex-1"
          >
            <span className="material-icons text-sm mr-1">schedule</span>
            Linha do Tempo
          </NotionButton>
          
          <NotionButton 
            size="sm" 
            onClick={() => onSettleInstallment(plan)}
            className="flex-1"
            disabled={plan.type === 'despesa_planejada'}
          >
            <span className="material-icons text-sm mr-1">payment</span>
            {plan.type === 'despesa_planejada' ? 'Já Realizada' : 'Quitar'}
          </NotionButton>
          
          {plan.type === 'poupanca' && onWithdraw && currentBalance > 0 && (
            <NotionButton 
              variant="outline" 
              size="sm" 
              onClick={() => onWithdraw(plan)}
            >
              <span className="material-icons text-sm mr-1">account_balance_wallet</span>
              Retirar
            </NotionButton>
          )}
        </div>

        {/* Edit and Delete Actions */}
        <div className="flex gap-2 pt-2">
          <NotionButton 
            variant="outline" 
            size="sm" 
            onClick={() => onEdit(plan)}
            className="flex-1"
          >
            <span className="material-icons text-sm mr-1">edit</span>
            Editar
          </NotionButton>
          
          <NotionButton 
            variant="outline" 
            size="sm" 
            onClick={() => onDelete(plan)}
            className="flex-1 text-notion-danger hover:text-notion-danger"
          >
            <span className="material-icons text-sm mr-1">delete</span>
            Excluir
          </NotionButton>
        </div>
      </NotionCardContent>
    </NotionCard>
  );
}
