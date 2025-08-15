
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { CreatePlanData } from '@/hooks/usePlans';

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreatePlanData) => void;
  isLoading: boolean;
}

export function CreatePlanModal({ isOpen, onClose, onSave, isLoading }: CreatePlanModalProps) {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<CreatePlanData>();

  const handleSaveInternal = (data: CreatePlanData) => {
    onSave(data);
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
          <DialogTitle className="text-mint-text-primary font-bold">Criar Novo Plano</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleSaveInternal)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-mint-text-primary font-medium">
              Nome do Plano
            </Label>
            <Input
              id="name"
              {...register('name', { required: 'Nome é obrigatório' })}
              placeholder="Ex: Viagem para o Japão"
              className="mint-input"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type" className="text-mint-text-primary font-medium">
              Tipo de Plano
            </Label>
            <Select onValueChange={(value) => setValue('type', value as 'poupanca' | 'divida')}>
              <SelectTrigger className="mint-input">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="poupanca">Meta para Guardar Dinheiro</SelectItem>
                <SelectItem value="divida">Dívida/Financiamento</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-500">Tipo é obrigatório</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="total_amount" className="text-mint-text-primary font-medium">
              Valor Total
            </Label>
            <Input
              id="total_amount"
              type="number"
              step="0.01"
              min="0"
              {...register('total_amount', { 
                required: 'Valor é obrigatório',
                min: { value: 0.01, message: 'Valor deve ser maior que zero' }
              })}
              placeholder="0,00"
              className="mint-input"
            />
            {errors.total_amount && (
              <p className="text-sm text-red-500">{errors.total_amount.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date" className="text-mint-text-primary font-medium">
                Data de Início
              </Label>
              <Input
                id="start_date"
                type="date"
                {...register('start_date', { required: 'Data de início é obrigatória' })}
                className="mint-input"
              />
              {errors.start_date && (
                <p className="text-sm text-red-500">{errors.start_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date" className="text-mint-text-primary font-medium">
                Data de Fim
              </Label>
              <Input
                id="end_date"
                type="date"
                {...register('end_date', { required: 'Data de fim é obrigatória' })}
                className="mint-input"
              />
              {errors.end_date && (
                <p className="text-sm text-red-500">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-mint-text-primary font-medium">
              Observações (opcional)
            </Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Detalhes sobre o plano..."
              className="mint-input resize-none"
              rows={3}
            />
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
              {isLoading ? 'Criando...' : 'Criar Plano'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
