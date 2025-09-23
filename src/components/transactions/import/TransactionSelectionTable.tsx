import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PreviewTransaction } from '@/hooks/useImportWizard';
import { safeFormatDate } from '@/lib/date-utils';
import { Brain, Download, Search, DollarSign } from 'lucide-react';

interface TransactionSelectionTableProps {
  transactions: PreviewTransaction[];
  selectedTransactionIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onProcessWithAI: () => void;
  onImportSelected: () => void;
  isProcessingAI: boolean;
}

export function TransactionSelectionTable({
  transactions,
  selectedTransactionIds,
  onSelectionChange,
  onProcessWithAI,
  onImportSelected,
  isProcessingAI
}: TransactionSelectionTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [amountFilter, setAmountFilter] = useState<'all' | 'positive' | 'negative'>('all');

  // Filter transactions based on search and amount filter
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesAmount = 
        amountFilter === 'all' ||
        (amountFilter === 'positive' && transaction.amount > 0) ||
        (amountFilter === 'negative' && transaction.amount < 0);

      return matchesSearch && matchesAmount;
    });
  }, [transactions, searchTerm, amountFilter]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(filteredTransactions.map(t => t.index.toString()));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectTransaction = (transactionId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedTransactionIds, transactionId]);
    } else {
      onSelectionChange(selectedTransactionIds.filter(id => id !== transactionId));
    }
  };

  const selectedCount = selectedTransactionIds.length;
  const totalAmount = transactions
    .filter(t => selectedTransactionIds.includes(t.index.toString()))
    .reduce((sum, t) => sum + t.amount, 0);

  const allFilteredSelected = filteredTransactions.every(t => 
    selectedTransactionIds.includes(t.index.toString())
  );

  const someFilteredSelected = filteredTransactions.some(t => 
    selectedTransactionIds.includes(t.index.toString())
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={amountFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAmountFilter('all')}
          >
            Todas
          </Button>
          <Button
            variant={amountFilter === 'positive' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAmountFilter('positive')}
            className="text-green-600"
          >
            Receitas
          </Button>
          <Button
            variant={amountFilter === 'negative' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAmountFilter('negative')}
            className="text-red-600"
          >
            Despesas
          </Button>
        </div>
      </div>

      {/* Selection Summary */}
      <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="text-base px-3 py-1">
            {selectedCount} de {transactions.length} selecionadas
          </Badge>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span className={totalAmount >= 0 ? 'text-green-600' : 'text-red-600'}>
              R$ {Math.abs(totalAmount).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onProcessWithAI}
            disabled={isProcessingAI || selectedCount === 0}
            variant="outline"
            className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:from-purple-100 hover:to-blue-100"
          >
            <Brain className="h-4 w-4 mr-2" />
            {isProcessingAI ? 'Processando...' : 'Processar com IA'}
          </Button>
          
          <Button
            onClick={onImportSelected}
            disabled={selectedCount === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Importar Selecionadas
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="border rounded-lg">
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allFilteredSelected && filteredTransactions.length > 0}
                    onCheckedChange={handleSelectAll}
                    className={someFilteredSelected && !allFilteredSelected ? 'opacity-50' : ''}
                  />
                </TableHead>
                <TableHead className="w-32">Valor</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-24">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => {
                const isSelected = selectedTransactionIds.includes(transaction.index.toString());
                
                return (
                  <TableRow 
                    key={transaction.index}
                    className={isSelected ? 'bg-secondary/50' : ''}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => 
                          handleSelectTransaction(transaction.index.toString(), checked as boolean)
                        }
                      />
                    </TableCell>
                    
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
                    
                    <TableCell className="text-muted-foreground">
                      {safeFormatDate(transaction.date, 'dd/MM/yy')}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {filteredTransactions.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhuma transação encontrada com os filtros aplicados.</p>
        </div>
      )}
    </div>
  );
}