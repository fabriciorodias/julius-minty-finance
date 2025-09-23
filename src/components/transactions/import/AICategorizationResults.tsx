import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CategoryEditDropdown } from './CategoryEditDropdown';
import { CategorizationConfidence } from './CategorizationConfidence';
import { CategorizedTransaction } from '@/hooks/useImportWizard';
import { safeFormatDate } from '@/lib/date-utils';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface AICategorizationResultsProps {
  categorizedTransactions: CategorizedTransaction[];
  onCategorizedTransactionsChange: (transactions: CategorizedTransaction[]) => void;
  onProceedToImport: () => void;
}

export function AICategorizationResults({
  categorizedTransactions,
  onCategorizedTransactionsChange,
  onProceedToImport
}: AICategorizationResultsProps) {
  const handleCategoryChange = (transactionIndex: number, categoryId: string, categoryName: string) => {
    const updatedTransactions = categorizedTransactions.map(transaction => {
      if (transaction.index === transactionIndex) {
        return {
          ...transaction,
          category_id: categoryId,
          category_name: categoryName,
          confidence: undefined, // Reset confidence when manually changed
        };
      }
      return transaction;
    });
    
    onCategorizedTransactionsChange(updatedTransactions);
  };

  const categorizedCount = categorizedTransactions.filter(t => t.category_id).length;
  const uncategorizedCount = categorizedTransactions.length - categorizedCount;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">Categorizadas</p>
              <p className="text-2xl font-bold text-green-600">{categorizedCount}</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-800">Sem categoria</p>
              <p className="text-2xl font-bold text-amber-600">{uncategorizedCount}</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-800">Total</p>
              <p className="text-2xl font-bold text-blue-600">{categorizedTransactions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800">
          <strong>Revise as categorias sugeridas pela IA.</strong> Você pode alterar qualquer categoria antes de importar. 
          Transações sem categoria serão importadas sem categorização.
        </p>
      </div>

      {/* Results Table */}
      <div className="border rounded-lg">
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead className="w-32">Valor</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-48">Categoria Sugerida</TableHead>
                <TableHead className="w-24">Confiança</TableHead>
                <TableHead className="w-24">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categorizedTransactions.map((transaction) => (
                <TableRow key={transaction.index}>
                  <TableCell>
                    <span className={`font-medium ${
                      transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount >= 0 ? '+' : ''}
                      R$ {Math.abs(transaction.amount).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                  </TableCell>
                  
                  <TableCell>
                    <span className="font-medium">{transaction.description}</span>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-2">
                      {transaction.category_id ? (
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={transaction.confidence === undefined ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {transaction.category_name}
                          </Badge>
                          {transaction.confidence === undefined && (
                            <span className="text-xs text-muted-foreground">(Manual)</span>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Sem categoria
                        </Badge>
                      )}
                      
                      <CategoryEditDropdown
                        selectedCategoryId={transaction.category_id || ''}
                        onCategoryChange={(categoryId, categoryName) => 
                          handleCategoryChange(transaction.index, categoryId, categoryName)
                        }
                        transactionType={transaction.amount >= 0 ? 'receita' : 'despesa'}
                      />
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {transaction.confidence !== undefined && (
                      <CategorizationConfidence confidence={transaction.confidence} />
                    )}
                  </TableCell>
                  
                  <TableCell className="text-muted-foreground">
                    {safeFormatDate(transaction.date, 'dd/MM/yy')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Action Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={onProceedToImport} size="lg" className="px-8">
          Prosseguir para Importação
        </Button>
      </div>
    </div>
  );
}