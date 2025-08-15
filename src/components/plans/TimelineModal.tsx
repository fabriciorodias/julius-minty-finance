
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PlanWithInstallments, PlanInstallment } from '@/hooks/usePlans';

interface TimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (installments: Partial<PlanInstallment>[]) => void;
  plan: PlanWithInstallments | null;
  isLoading: boolean;
}

export function TimelineModal({ isOpen, onClose, onSave, plan, isLoading }: TimelineModalProps) {
  const [editedInstallments, setEditedInstallments] = useState<PlanInstallment[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (plan) {
      setEditedInstallments([...plan.installments].sort((a, b) => a.due_date.localeCompare(b.due_date)));
      setTotalAmount(plan.installments.reduce((sum, inst) => sum + inst.planned_amount, 0));
    }
  }, [plan]);

  const handleAmountChange = (installmentId: string, newAmount: string) => {
    const amount = parseFloat(newAmount) || 0;
    setEditedInstallments(prev => 
      prev.map(inst => 
        inst.id === installmentId 
          ? { ...inst, planned_amount: amount }
          : inst
      )
    );
  };

  const handleSave = () => {
    if (!plan) return;

    const currentTotal = editedInstallments.reduce((sum, inst) => sum + inst.planned_amount, 0);
    
    if (Math.abs(currentTotal - plan.total_amount) > 0.01) {
      alert(`O total das parcelas (${formatCurrency(currentTotal)}) deve ser igual ao valor do plano (${formatCurrency(plan.total_amount)})`);
      return;
    }

    const updatedInstallments = editedInstallments.map(inst => ({
      id: inst.id,
      planned_amount: inst.planned_amount,
    }));

    onSave(updatedInstallments);
    onClose();
  };

  const handleClose = () => {
    if (plan) {
      setEditedInstallments([...plan.installments].sort((a, b) => a.due_date.localeCompare(b.due_date)));
      setTotalAmount(plan.installments.reduce((sum, inst) => sum + inst.planned_amount, 0));
    }
    onClose();
  };

  if (!plan) return null;

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });
  };

  const currentTotal = editedInstallments.reduce((sum, inst) => sum + inst.planned_amount, 0);
  const isValidTotal = Math.abs(currentTotal - plan.total_amount) <= 0.01;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-mint-text-primary font-bold">
            Linha do Tempo - {plan.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden">
          <div className="p-4 bg-mint-secondary bg-opacity-10 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-mint-text-primary">Valor Total do Plano</h4>
                <p className="text-lg font-bold text-mint-primary">
                  {formatCurrency(plan.total_amount)}
                </p>
              </div>
              <div className="text-right">
                <h4 className="font-medium text-mint-text-primary">Total das Parcelas</h4>
                <p className={`text-lg font-bold ${isValidTotal ? 'text-mint-primary' : 'text-red-500'}`}>
                  {formatCurrency(currentTotal)}
                </p>
                {!isValidTotal && (
                  <Badge variant="destructive" className="mt-1">
                    Diferença: {formatCurrency(currentTotal - plan.total_amount)}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 space-y-2 max-h-96">
            {editedInstallments.map((installment) => (
              <div 
                key={installment.id}
                className={`p-3 border rounded-lg ${
                  installment.status === 'quitado' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-mint-text-primary">
                        {formatDate(installment.due_date)}
                      </p>
                      {installment.status === 'quitado' && (
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="default" className="text-xs">Quitado</Badge>
                          <span className="text-xs text-mint-text-secondary">
                            Pago: {formatCurrency(installment.settled_amount)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="w-32">
                    <Input
                      type="number"
                      step="0.01"
                      value={installment.planned_amount}
                      onChange={(e) => handleAmountChange(installment.id, e.target.value)}
                      disabled={installment.status === 'quitado'}
                      className="text-right mint-input"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || !isValidTotal}
              className="flex-1"
            >
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
