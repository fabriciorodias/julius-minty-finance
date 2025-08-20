
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
      <div className="text-center p-4 bg-mint-background/50 rounded-lg">
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
          className="p-4"
        >
          {transactions.map((transaction) => (
            <div key={transaction.index} className="space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem 
                  value={transaction.index.toString()} 
                  id={`transaction-${transaction.index}`}
                />
                <Label 
                  htmlFor={`transaction-${transaction.index}`}
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-mint-text-primary truncate">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-mint-text-secondary">
                        {safeFormatDate(transaction.date, 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <div className="ml-2 text-right">
                      <p className={`font-medium ${
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
                  </div>
                </Label>
              </div>
              
              {transaction.index < transactions.length - 1 && (
                <hr className="border-mint-border" />
              )}
            </div>
          ))}
        </RadioGroup>
      </ScrollArea>
    </div>
  );
}
