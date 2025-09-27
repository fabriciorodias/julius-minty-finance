
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
    <Card className="mint-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-mint-primary bg-opacity-10 flex items-center justify-center">
              {plan.image_url ? (
                <img 
                  src={plan.image_url} 
                  alt={plan.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <span className="material-icons text-mint-primary text-xl">
                  {typeInfo.icon}
                </span>
              )}
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-mint-text-primary">{plan.name}</CardTitle>
              <Badge variant={typeInfo.variant} className="mt-1">
                {typeInfo.label}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-mint-text-secondary">Progresso</span>
            <span className="text-mint-text-primary font-medium">
              {progressPercentage.toFixed(1)}%
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-mint-text-secondary">Meta Total</p>
            <p className="font-bold text-mint-text-primary">{formatCurrency(plan.total_amount)}</p>
          </div>
          <div>
            <p className="text-mint-text-secondary">
              {plan.type === 'poupanca' ? 'Guardado' : plan.type === 'despesa_planejada' ? 'Valor' : 'Pago'}
            </p>
            <p className="font-bold text-mint-primary">{formatCurrency(totalSettled)}</p>
          </div>
        </div>

        {plan.type === 'poupanca' && totalWithdrawn > 0 && (
          <div className="text-sm">
            <p className="text-mint-text-secondary">Saldo Atual</p>
            <p className="font-bold text-mint-text-primary">{formatCurrency(currentBalance)}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onViewTimeline(plan)}
            className="flex-1"
          >
            <span className="material-icons text-sm mr-1">schedule</span>
            Linha do Tempo
          </Button>
          
          <Button 
            size="sm" 
            onClick={() => onSettleInstallment(plan)}
            className="flex-1"
            disabled={plan.type === 'despesa_planejada'}
          >
            <span className="material-icons text-sm mr-1">payment</span>
            {plan.type === 'despesa_planejada' ? 'Já Realizada' : 'Quitar'}
          </Button>
          
          {plan.type === 'poupanca' && onWithdraw && currentBalance > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onWithdraw(plan)}
            >
              <span className="material-icons text-sm mr-1">account_balance_wallet</span>
              Retirar
            </Button>
          )}
        </div>

        {/* Edit and Delete Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onEdit(plan)}
            className="flex-1"
          >
            <span className="material-icons text-sm mr-1">edit</span>
            Editar
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onDelete(plan)}
            className="flex-1 text-destructive hover:text-destructive"
          >
            <span className="material-icons text-sm mr-1">delete</span>
            Excluir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
