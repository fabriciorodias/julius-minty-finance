
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlanWithInstallments } from '@/hooks/usePlans';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { plan_id: string; amount: number; withdrawal_date: string; notes?: string }) => void;
  plan: PlanWithInstallments | null;
  isLoading: boolean;
}

export function WithdrawModal({ isOpen, onClose, onSave, plan, isLoading }: WithdrawModalProps) {
  const [amount, setAmount] = useState('');
  const [withdrawalDate, setWithdrawalDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!plan) return;

    onSave({
      plan_id: plan.id,
      amount: parseFloat(amount),
      withdrawal_date: withdrawalDate,
      notes: notes || undefined,
    });

    setAmount('');
    setWithdrawalDate(new Date().toISOString().slice(0, 10));
    setNotes('');
    onClose();
  };

  const handleClose = () => {
    setAmount('');
    setWithdrawalDate(new Date().toISOString().slice(0, 10));
    setNotes('');
    onClose();
  };

  if (!plan) return null;

  const totalSettled = plan.installments.reduce((sum, inst) => sum + inst.settled_amount, 0);
  const totalWithdrawn = plan.withdrawals.reduce((sum, w) => sum + w.amount, 0);
  const currentBalance = totalSettled - totalWithdrawn;

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-mint-text-primary font-bold">
            Retirar Saldo - {plan.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-mint-secondary bg-opacity-10 rounded-lg">
            <h4 className="font-medium text-mint-text-primary mb-2">Saldo Disponível</h4>
            <p className="text-2xl font-bold text-mint-primary">
              {formatCurrency(currentBalance)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-mint-text-primary font-medium">
              Valor a Retirar
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              max={currentBalance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="mint-input"
            />
            {parseFloat(amount || '0') > currentBalance && (
              <p className="text-sm text-red-500">
                Valor não pode ser maior que o saldo disponível
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="withdrawal_date" className="text-mint-text-primary font-medium">
              Data da Retirada
            </Label>
            <Input
              id="withdrawal_date"
              type="date"
              value={withdrawalDate}
              onChange={(e) => setWithdrawalDate(e.target.value)}
              className="mint-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-mint-text-primary font-medium">
              Motivo da Retirada (opcional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Emergência médica, oportunidade de investimento..."
              className="mint-input resize-none"
              rows={3}
            />
          </div>

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
              disabled={isLoading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > currentBalance}
              className="flex-1"
            >
              {isLoading ? 'Registrando...' : 'Confirmar Retirada'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
