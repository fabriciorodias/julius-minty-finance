
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { CreateTransactionData } from '@/hooks/useInvestmentTransactions';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateTransactionData) => void;
  isLoading: boolean;
  investmentId: string;
  investmentName: string;
}

export function TransactionModal({ 
  isOpen, 
  onClose, 
  onSave, 
  isLoading, 
  investmentId, 
  investmentName 
}: TransactionModalProps) {
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<CreateTransactionData>({
    defaultValues: {
      investment_id: investmentId,
    }
  });

  const handleSaveInternal = (data: CreateTransactionData) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-mint-text-primary font-bold">
            Nova Movimentação - {investmentName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleSaveInternal)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type" className="text-mint-text-primary font-medium">
              Tipo de Movimentação
            </Label>
            <Select onValueChange={(value) => setValue('type', value as 'aporte' | 'resgate')}>
              <SelectTrigger className="mint-input">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aporte">Aporte</SelectItem>
                <SelectItem value="resgate">Resgate</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-500">Tipo é obrigatório</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount" className="text-mint-text-primary font-medium">
              Valor
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              {...register('amount', { 
                required: 'Valor é obrigatório',
                min: { value: 0.01, message: 'Valor deve ser maior que zero' }
              })}
              placeholder="0,00"
              className="mint-input"
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction_date" className="text-mint-text-primary font-medium">
              Data da Movimentação
            </Label>
            <Input
              id="transaction_date"
              type="date"
              {...register('transaction_date', { required: 'Data é obrigatória' })}
              className="mint-input"
            />
            {errors.transaction_date && (
              <p className="text-sm text-red-500">{errors.transaction_date.message}</p>
            )}
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
              {isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
