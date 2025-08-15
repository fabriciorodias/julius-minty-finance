
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { CreateInvestmentData } from '@/hooks/useInvestments';
import { useInstitutions } from '@/hooks/useInstitutions';

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateInvestmentData) => void;
  isLoading: boolean;
}

export function InvestmentModal({ isOpen, onClose, onSave, isLoading }: InvestmentModalProps) {
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<CreateInvestmentData>();
  const { institutions } = useInstitutions();

  const handleSaveInternal = (data: CreateInvestmentData) => {
    onSave(data);
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const typeOptions = [
    { value: 'renda_fixa', label: 'Renda Fixa' },
    { value: 'renda_variavel', label: 'Renda Variável' },
    { value: 'outro', label: 'Outros' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-mint-text-primary font-bold">Adicionar Investimento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleSaveInternal)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-mint-text-primary font-medium">
              Nome do Investimento
            </Label>
            <Input
              id="name"
              {...register('name', { required: 'Nome é obrigatório' })}
              placeholder="Ex: Tesouro Selic 2029"
              className="mint-input"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type" className="text-mint-text-primary font-medium">
              Tipo de Investimento
            </Label>
            <Select onValueChange={(value) => setValue('type', value as any)}>
              <SelectTrigger className="mint-input">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-500">Tipo é obrigatório</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="institution_id" className="text-mint-text-primary font-medium">
              Instituição Financeira
            </Label>
            <Select onValueChange={(value) => setValue('institution_id', value === 'none' ? undefined : value)}>
              <SelectTrigger className="mint-input">
                <SelectValue placeholder="Selecione a instituição" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {institutions.map((institution) => (
                  <SelectItem key={institution.id} value={institution.id}>
                    {institution.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="issuer" className="text-mint-text-primary font-medium">
              Emissor (opcional)
            </Label>
            <Input
              id="issuer"
              {...register('issuer')}
              placeholder="Ex: Tesouro Nacional"
              className="mint-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date" className="text-mint-text-primary font-medium">
              Data de Vencimento (opcional)
            </Label>
            <Input
              id="due_date"
              type="date"
              {...register('due_date')}
              className="mint-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="initial_amount" className="text-mint-text-primary font-medium">
                Valor Inicial
              </Label>
              <Input
                id="initial_amount"
                type="number"
                step="0.01"
                min="0"
                {...register('initial_amount', { 
                  required: 'Valor inicial é obrigatório',
                  min: { value: 0.01, message: 'Valor deve ser maior que zero' }
                })}
                placeholder="0,00"
                className="mint-input"
              />
              {errors.initial_amount && (
                <p className="text-sm text-red-500">{errors.initial_amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="initial_date" className="text-mint-text-primary font-medium">
                Data do Aporte
              </Label>
              <Input
                id="initial_date"
                type="date"
                {...register('initial_date', { required: 'Data é obrigatória' })}
                className="mint-input"
              />
              {errors.initial_date && (
                <p className="text-sm text-red-500">{errors.initial_date.message}</p>
              )}
            </div>
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
              {isLoading ? 'Criando...' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
