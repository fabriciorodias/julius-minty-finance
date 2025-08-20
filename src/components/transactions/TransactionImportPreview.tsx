
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { safeFormatDate } from '@/lib/date-utils';

interface PreviewTransaction {
  index: number;
  description: string;
  amount: number;
  date: string;
}

interface TransactionImportPreviewProps {
  transactions: PreviewTransaction[];
  selectedStartIndex: number;
  onStartIndexChange: (index: number) => void;
}

export function TransactionImportPreview({ 
  transactions, 
  selectedStartIndex, 
  onStartIndexChange 
}: TransactionImportPreviewProps) {
  const transactionsToImport = transactions.length - selectedStartIndex;

  return (
    <div className="space-y-4">
      <div className="text-center p-4 bg-mint-light rounded-lg">
        <p className="text-sm text-mint-text-secondary mb-2">
          Selecione a partir de qual transação você deseja importar
        </p>
        <p className="text-lg font-semibold text-mint-text-primary">
          {transactionsToImport} transação{transactionsToImport !== 1 ? 'ões' : ''} 
          {transactionsToImport !== 1 ? ' serão importadas' : ' será importada'}
        </p>
      </div>

      <ScrollArea className="h-[400px] w-full border rounded-lg">
        <TooltipProvider>
          <RadioGroup 
            value={selectedStartIndex.toString()} 
            onValueChange={(value) => onStartIndexChange(parseInt(value))}
            className="divide-y divide-border"
          >
            {transactions.map((transaction, idx) => (
              <div 
                key={transaction.index} 
                className={`grid grid-cols-[auto_120px_1fr_80px] gap-3 p-3 items-center hover:bg-mint-light/50 transition-colors ${
                  transaction.index === selectedStartIndex ? 'bg-mint-light/30' : ''
                }`}
              >
                <RadioGroupItem 
                  value={transaction.index.toString()} 
                  id={`transaction-${transaction.index}`}
                  className="flex-shrink-0"
                />
                
                {/* Valor - coluna fixa alinhada à esquerda */}
                <div className="text-left">
                  <p className={`text-sm font-bold ${
                    transaction.amount >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {transaction.amount >= 0 ? '+' : ''}
                    R$ {Math.abs(transaction.amount).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </p>
                </div>
                
                {/* Descrição - coluna flexível com tooltip */}
                <div className="min-w-0">
                  <Label 
                    htmlFor={`transaction-${transaction.index}`}
                    className="cursor-pointer block"
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="font-medium text-mint-text-primary truncate text-sm">
                          {transaction.description}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{transaction.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                </div>
                
                {/* Data - coluna fixa */}
                <div className="text-right">
                  <Label 
                    htmlFor={`transaction-${transaction.index}`}
                    className="cursor-pointer block"
                  >
                    <p className="text-xs text-mint-text-secondary">
                      {safeFormatDate(transaction.date, 'dd/MM/yy')}
                    </p>
                  </Label>
                </div>
              </div>
            ))}
          </RadioGroup>
        </TooltipProvider>
      </ScrollArea>
    </div>
  );
}
