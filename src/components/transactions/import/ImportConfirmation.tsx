import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAccounts } from '@/hooks/useAccounts';
import { useInstitutions } from '@/hooks/useInstitutions';
import { supabase } from '@/integrations/supabase/client';
import { CategorizedTransaction, PreviewTransaction } from '@/hooks/useImportWizard';
import { safeFormatDate } from '@/lib/date-utils';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { validateDateForImport } from '@/lib/date-validation';

interface ImportConfirmationProps {
  transactions: (CategorizedTransaction | PreviewTransaction)[];
  sourceAccount: string;
  onImportComplete: () => void;
  isProcessing: boolean;
  onProcessingChange: (isProcessing: boolean) => void;
  onError: (error: string) => void;
  editedDates?: { [transactionIndex: string]: string };
}

export function ImportConfirmation({
  transactions,
  sourceAccount,
  onImportComplete,
  isProcessing,
  onProcessingChange,
  onError,
  editedDates = {}
}: ImportConfirmationProps) {
  const { accounts } = useAccounts();
  const { institutions } = useInstitutions();

  const sourceAccountData = accounts.find(acc => acc.id === sourceAccount);
  const institutionData = institutions.find(inst => inst.id === sourceAccountData?.institution_id);

  const categorizedCount = transactions.filter(t => 
    'category_id' in t && t.category_id
  ).length;
  
  const uncategorizedCount = transactions.length - categorizedCount;

  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

  // Validar datas suspeitas antes da importação
  const suspiciousDateTransactions = transactions.filter(t => {
    const currentDate = editedDates[t.index.toString()] || t.date;
    return validateDateForImport(currentDate).isSuspicious;
  });

  const hasSuspiciousDates = suspiciousDateTransactions.length > 0;

  const handleImport = async () => {
    onProcessingChange(true);
    onError('');

    try {
      // For transactions with AI categorization, we'll import them with categories
      // For regular transactions, we'll use the existing import flow
      
      if (transactions.some(t => 'category_id' in t)) {
        // Import with categorization data
        const importData = {
          transactions: transactions.map(t => ({
            index: t.index,
            description: t.description,
            amount: t.amount,
            date: editedDates[t.index.toString()] || t.date,
            category_id: 'category_id' in t ? t.category_id : null
          })),
          sourceAccountId: sourceAccount
        };

        const { data, error } = await supabase.functions.invoke('import-categorized-transactions', {
          body: importData,
        });

        if (error) throw error;

        if (!data.success) {
          throw new Error(data.error || 'Erro na importação');
        }
      } else {
        // Use existing import flow
        const formData = new FormData();
        formData.append('mode', 'import');
        formData.append('sourceId', sourceAccount);
        formData.append('startIndex', '0');
        
        // Create a minimal CSV for the selected transactions
        const csvContent = transactions.map(t => 
          `"${t.description}","${t.amount}","${editedDates[t.index.toString()] || t.date}"`
        ).join('\n');
        const csvBlob = new Blob([csvContent], { type: 'text/csv' });
        formData.append('file', csvBlob, 'import.csv');

        const { data, error } = await supabase.functions.invoke('import-transactions', {
          body: formData,
        });

        if (error) throw error;

        if (!data.success) {
          throw new Error(data.error || 'Erro na importação');
        }
      }

      onImportComplete();
    } catch (error: any) {
      console.error('Import error:', error);
      onError(error.message || 'Não foi possível importar as transações. Tente novamente.');
    } finally {
      onProcessingChange(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-center">
            <p className="text-sm font-medium text-blue-800">Total de Transações</p>
            <p className="text-2xl font-bold text-blue-600">{transactions.length}</p>
          </div>
        </div>
        
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-center">
            <p className="text-sm font-medium text-green-800">Categorizadas</p>
            <p className="text-2xl font-bold text-green-600">{categorizedCount}</p>
          </div>
        </div>
        
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="text-center">
            <p className="text-sm font-medium text-amber-800">Sem Categoria</p>
            <p className="text-2xl font-bold text-amber-600">{uncategorizedCount}</p>
          </div>
        </div>
        
        <div className="p-4 bg-secondary rounded-lg">
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
            <p className={`text-2xl font-bold ${totalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {Math.abs(totalAmount).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="p-4 bg-secondary rounded-lg">
        <h3 className="font-medium mb-2">Conta de Destino</h3>
        <p className="text-muted-foreground">
          {institutionData?.name} - {sourceAccountData?.name}
        </p>
      </div>

      {/* Warnings */}
      {hasSuspiciousDates && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Erro: Datas suspeitas detectadas</p>
              <p className="text-red-700 text-sm">
                {suspiciousDateTransactions.length} transação{suspiciousDateTransactions.length > 1 ? 'ões possuem' : ' possui'} 
                {suspiciousDateTransactions.length > 1 ? ' datas' : ' data'} suspeita{suspiciousDateTransactions.length > 1 ? 's' : ''}. 
                Volte para a seleção de transações e corrija as datas antes de importar.
              </p>
            </div>
          </div>
        </div>
      )}

      {uncategorizedCount > 0 && !hasSuspiciousDates && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Atenção</p>
              <p className="text-amber-700 text-sm">
                {uncategorizedCount} transação{uncategorizedCount > 1 ? 'ões' : ''} 
                {uncategorizedCount > 1 ? ' serão importadas' : ' será importada'} sem categoria. 
                Você poderá categorizar depois na página de lançamentos.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Preview */}
      <div className="border rounded-lg">
        <div className="p-4 border-b bg-secondary/50">
          <h3 className="font-medium">Resumo das Transações</h3>
        </div>
        
        <ScrollArea className="h-[300px]">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead className="w-32">Valor</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-48">Categoria</TableHead>
                <TableHead className="w-24">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
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
                    {'category_name' in transaction && transaction.category_name ? (
                      <Badge variant="secondary" className="text-xs">
                        {transaction.category_name}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Sem categoria
                      </Badge>
                    )}
                  </TableCell>
                  
                  <TableCell className="text-muted-foreground">
                    {safeFormatDate(editedDates[transaction.index.toString()] || transaction.date, 'dd/MM/yy')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Final Confirmation */}
      {!hasSuspiciousDates && (
        <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-green-800">Pronto para importar</p>
              <p className="text-green-700 text-sm">
                Clique no botão abaixo para confirmar a importação. Esta ação não pode ser desfeita.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleImport}
          disabled={isProcessing || hasSuspiciousDates}
          size="lg"
          className="px-8"
        >
          {isProcessing ? 'Importando...' : hasSuspiciousDates ? 'Corrija as datas antes de importar' : 'Confirmar Importação'}
        </Button>
      </div>
    </div>
  );
}