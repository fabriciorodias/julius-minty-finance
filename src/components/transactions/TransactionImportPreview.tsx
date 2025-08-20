
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
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
        <RadioGroup 
          value={selectedStartIndex.toString()} 
          onValueChange={(value) => onStartIndexChange(parseInt(value))}
          className="p-4 space-y-3"
        >
          {transactions.map((transaction) => (
            <div key={transaction.index} className="w-full">
              <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-mint-light/50 transition-colors border border-transparent hover:border-mint-border">
                <RadioGroupItem 
                  value={transaction.index.toString()} 
                  id={`transaction-${transaction.index}`}
                  className="mt-1 flex-shrink-0"
                />
                <Label 
                  htmlFor={`transaction-${transaction.index}`}
                  className="flex-1 cursor-pointer min-w-0"
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Valor em destaque à esquerda */}
                    <div className="flex-shrink-0">
                      <p className={`text-lg font-bold ${
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
                    
                    {/* Descrição e data à direita */}
                    <div className="flex-1 min-w-0 text-right">
                      <p className="font-medium text-mint-text-primary truncate mb-1">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-mint-text-secondary">
                        {safeFormatDate(transaction.date, 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                </Label>
              </div>
              
              {transaction.index < transactions.length - 1 && (
                <hr className="border-border mx-4 mt-3" />
              )}
            </div>
          ))}
        </RadioGroup>
      </ScrollArea>
    </div>
  );
}
