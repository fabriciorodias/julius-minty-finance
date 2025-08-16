
import React, { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface CurrencyInputBRLProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: string | number;
  onChange?: (value: string, numericValue: number) => void;
}

export const CurrencyInputBRL = forwardRef<HTMLInputElement, CurrencyInputBRLProps>(
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

    const parseValue = (formattedValue: string) => {
      const numbers = formattedValue.replace(/\D/g, '');
      return numbers ? parseInt(numbers) / 100 : 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatCurrency(e.target.value);
      const numeric = parseValue(formatted);
      onChange?.(formatted, numeric);
    };

    const getRawValue = (inputValue: string | number) => {
      if (typeof inputValue === 'number') {
        return inputValue.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      }
      return inputValue.toString();
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
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

CurrencyInputBRL.displayName = 'CurrencyInputBRL';
