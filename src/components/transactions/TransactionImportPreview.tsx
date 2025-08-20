
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
          className="p-4 space-y-4"
        >
          {transactions.map((transaction) => (
            <div key={transaction.index} className="w-full">
              <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-mint-light/50 transition-colors">
                <RadioGroupItem 
                  value={transaction.index.toString()} 
                  id={`transaction-${transaction.index}`}
                  className="mt-1 flex-shrink-0"
                />
                <Label 
                  htmlFor={`transaction-${transaction.index}`}
                  className="flex-1 cursor-pointer min-w-0"
                >
                  <div className="w-full">
                    <div className="flex justify-between items-start gap-3 mb-1">
                      <p className="font-medium text-mint-text-primary truncate flex-1 min-w-0">
                        {transaction.description}
                      </p>
                      <p className={`font-medium text-sm flex-shrink-0 ${
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
                    <p className="text-sm text-mint-text-secondary">
                      {safeFormatDate(transaction.date, 'dd/MM/yyyy')}
                    </p>
                  </div>
                </Label>
              </div>
              
              {transaction.index < transactions.length - 1 && (
                <hr className="border-border mx-4" />
              )}
            </div>
          ))}
        </RadioGroup>
      </ScrollArea>
    </div>
  );
}
