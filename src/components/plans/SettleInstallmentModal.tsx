
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PlanWithInstallments } from '@/hooks/usePlans';

interface SettleInstallmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { installment_id: string; settled_amount: number; settled_date: string; advance_remaining?: boolean }) => void;
  plan: PlanWithInstallments | null;
  isLoading: boolean;
}

export function SettleInstallmentModal({ isOpen, onClose, onSave, plan, isLoading }: SettleInstallmentModalProps) {
  const [settledAmount, setSettledAmount] = useState('');
  const [settledDate, setSettledDate] = useState(new Date().toISOString().slice(0, 10));
  const [advanceRemaining, setAdvanceRemaining] = useState(false);

  const handleSave = () => {
    if (!plan || !currentInstallment) return;

    onSave({
      installment_id: currentInstallment.id,
      settled_amount: parseFloat(settledAmount),
      settled_date: settledDate,
      advance_remaining: advanceRemaining,
    });

    setSettledAmount('');
    setSettledDate(new Date().toISOString().slice(0, 10));
    setAdvanceRemaining(false);
    onClose();
  };

  const handleClose = () => {
    setSettledAmount('');
    setSettledDate(new Date().toISOString().slice(0, 10));
    setAdvanceRemaining(false);
    onClose();
  };

  if (!plan) return null;

  // Find the current month's installment or the next pending one
  const today = new Date();
  const currentMonth = today.toISOString().slice(0, 7); // YYYY-MM format
  
  let currentInstallment = plan.installments.find(
    inst => inst.due_date.startsWith(currentMonth) && inst.status === 'pendente'
  );

  // If no installment for current month, get the next pending one
  if (!currentInstallment) {
    currentInstallment = plan.installments
      .filter(inst => inst.status === 'pendente')
      .sort((a, b) => a.due_date.localeCompare(b.due_date))[0];
  }

  if (!currentInstallment) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-mint-text-primary font-bold">Quitar Parcela</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            <p className="text-mint-text-secondary">
              Não há parcelas pendentes para este plano.
            </p>
          </div>
          <Button onClick={handleClose} className="w-full">
            Fechar
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-mint-text-primary font-bold">
            Quitar Parcela - {plan.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-mint-secondary bg-opacity-10 rounded-lg">
            <h4 className="font-medium text-mint-text-primary mb-2">
              Parcela de {formatDate(currentInstallment.due_date)}
            </h4>
            <p className="text-sm text-mint-text-secondary">
              Valor planejado: <span className="font-medium text-mint-text-primary">
                {formatCurrency(currentInstallment.planned_amount)}
              </span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="settled_amount" className="text-mint-text-primary font-medium">
              Valor Efetivamente {plan.type === 'poupanca' ? 'Guardado' : 'Pago'}
            </Label>
            <Input
              id="settled_amount"
              type="number"
              step="0.01"
              min="0"
              value={settledAmount}
              onChange={(e) => setSettledAmount(e.target.value)}
              placeholder={currentInstallment.planned_amount.toString()}
              className="mint-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="settled_date" className="text-mint-text-primary font-medium">
              Data do Pagamento
            </Label>
            <Input
              id="settled_date"
              type="date"
              value={settledDate}
              onChange={(e) => setSettledDate(e.target.value)}
              className="mint-input"
            />
          </div>

          {parseFloat(settledAmount || '0') > currentInstallment.planned_amount && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="advance_remaining"
                checked={advanceRemaining}
                onCheckedChange={(checked) => setAdvanceRemaining(checked as boolean)}
              />
              <Label htmlFor="advance_remaining" className="text-sm text-mint-text-primary">
                Usar o excedente para adiantar parcelas futuras
              </Label>
            </div>
          )}

          <div className="flex gap-3 pt-4">
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
              disabled={isLoading || !settledAmount}
              className="flex-1"
            >
              {isLoading ? 'Quitando...' : 'Quitar Parcela'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
