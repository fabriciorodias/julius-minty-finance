
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { UpsertBalanceData } from '@/hooks/useInvestmentBalances';

interface BalanceUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UpsertBalanceData) => void;
  isLoading: boolean;
  investmentId: string;
  investmentName: string;
  currentBalance?: number;
}

export function BalanceUpdateModal({ 
  isOpen, 
  onClose, 
  onSave, 
  isLoading, 
  investmentId, 
  investmentName,
  currentBalance 
}: BalanceUpdateModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UpsertBalanceData>({
    defaultValues: {
      investment_id: investmentId,
      balance: currentBalance || 0,
    }
  });

  const handleSaveInternal = (data: UpsertBalanceData) => {
    onSave({
      ...data,
      investment_id: investmentId,
    });
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Default to current month
  const currentMonth = new Date();
  currentMonth.setDate(1);
  const defaultMonth = currentMonth.toISOString().split('T')[0];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-mint-text-primary font-bold">
            Atualizar Saldo - {investmentName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleSaveInternal)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="month" className="text-mint-text-primary font-medium">
              Mês de Referência
            </Label>
            <Input
              id="month"
              type="date"
              {...register('month', { required: 'Mês é obrigatório' })}
              defaultValue={defaultMonth}
              className="mint-input"
            />
            {errors.month && (
              <p className="text-sm text-red-500">{errors.month.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance" className="text-mint-text-primary font-medium">
              Saldo Total
            </Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              min="0"
              {...register('balance', { 
                required: 'Saldo é obrigatório',
                min: { value: 0, message: 'Saldo deve ser maior ou igual a zero' }
              })}
              placeholder="0,00"
              className="mint-input"
            />
            {errors.balance && (
              <p className="text-sm text-red-500">{errors.balance.message}</p>
            )}
          </div>

          <div className="bg-mint-background p-3 rounded-lg">
            <p className="text-sm text-mint-text-secondary">
              <span className="material-icons text-sm mr-1 align-middle">info</span>
              Informe o saldo total do investimento conforme aparece em sua corretora ou banco.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Salvando...' : 'Atualizar Saldo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
