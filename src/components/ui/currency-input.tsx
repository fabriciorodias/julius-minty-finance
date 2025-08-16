
import React, { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: string | number;
  onChange?: (value: string) => void;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value = '', onChange, ...props }, ref) => {
    const formatCurrency = (inputValue: string) => {
      // Remove tudo que não é dígito
      const numbers = inputValue.replace(/\D/g, '');
      
      // Se não há números, retorna vazio
      if (!numbers) return '';
      
      // Converte para número e divide por 100 para obter centavos
      const amount = parseInt(numbers) / 100;
      
      // Formata para moeda brasileira
      return amount.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatCurrency(e.target.value);
      onChange?.(formatted);
    };

    const getRawValue = (formattedValue: string | number) => {
      if (typeof formattedValue === 'number') {
        return formattedValue.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      }
      return formattedValue.toString();
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
          R$
        </span>
        <Input
          ref={ref}
          className={cn('pl-10', className)}
          value={getRawValue(value)}
          onChange={handleChange}
          placeholder="0,00"
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
