
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<CreateInvestmentData>();
  const { institutions } = useInstitutions();

  const selectedType = watch('type');

  const handleSaveInternal = (data: CreateInvestmentData) => {
    console.log('Form data being submitted:', data);
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
      <DialogContent className="max-w-md glass-card-origin backdrop-blur-xl animate-scale-in">
        <DialogHeader>
          <DialogTitle className="font-bold">Adicionar Investimento</DialogTitle>
          <DialogDescription>
            Preencha os dados do seu novo investimento
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleSaveInternal)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="font-medium">
              Nome do Investimento
            </Label>
            <Input
              id="name"
              {...register('name', { required: 'Nome é obrigatório' })}
              placeholder="Ex: Tesouro Selic 2029"
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type" className="font-medium">
              Tipo de Investimento
            </Label>
            <Select onValueChange={(value) => setValue('type', value as any, { shouldValidate: true })}>
              <SelectTrigger>
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
            {/* Hidden input to ensure type is validated */}
            <input
              type="hidden"
              {...register('type', { required: 'Tipo é obrigatório' })}
              value={selectedType || ''}
            />
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="institution_id" className="font-medium">
              Instituição Financeira
            </Label>
            <Select onValueChange={(value) => setValue('institution_id', value === 'none' ? undefined : value)}>
              <SelectTrigger>
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
            <Label htmlFor="issuer" className="font-medium">
              Emissor (opcional)
            </Label>
            <Input
              id="issuer"
              {...register('issuer')}
              placeholder="Ex: Tesouro Nacional"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date" className="font-medium">
              Data de Vencimento (opcional)
            </Label>
            <Input
              id="due_date"
              type="date"
              {...register('due_date', {
                setValueAs: (value) => value === '' ? undefined : value
              })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="initial_amount" className="font-medium">
                Valor Inicial
              </Label>
              <Input
                id="initial_amount"
                type="number"
                step="0.01"
                min="0"
                {...register('initial_amount', { 
                  required: 'Valor inicial é obrigatório',
                  min: { value: 0.01, message: 'Valor deve ser maior que zero' },
                  valueAsNumber: true
                })}
                placeholder="0,00"
              />
              {errors.initial_amount && (
                <p className="text-sm text-red-500">{errors.initial_amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="initial_date" className="font-medium">
                Data do Aporte
              </Label>
              <Input
                id="initial_date"
                type="date"
                {...register('initial_date', { required: 'Data é obrigatória' })}
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
