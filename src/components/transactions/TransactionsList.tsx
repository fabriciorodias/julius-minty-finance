
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, FileText, Plus } from 'lucide-react';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TransactionWithRelations } from '@/hooks/useTransactions';
import { Account } from '@/hooks/useAccounts';
import { Institution } from '@/hooks/useInstitutions';
import { BulkActionsBar } from './BulkActionsBar';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';

interface TransactionsListProps {
  transactions: TransactionWithRelations[];
  accounts: Account[];
  institutions: Institution[];
  isLoading: boolean;
  onEdit: (transaction: TransactionWithRelations) => void;
  onDelete: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onNewTransaction: () => void;
  isDeleting?: boolean;
}

export function TransactionsList({
  transactions,
  accounts,
  institutions,
  isLoading,
  onEdit,
  onDelete,
  onBulkDelete,
  onNewTransaction,
  isDeleting = false,
}: TransactionsListProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  // Create institution map for lookup
  const institutionMap = React.useMemo(() => 
    institutions.reduce((acc, institution) => {
      acc[institution.id] = institution.name;
      return acc;
    }, {} as Record<string, string>), 
  [institutions]);

  const getOriginDisplay = (transaction: TransactionWithRelations) => {
    if (transaction.accounts) {
      const account = accounts.find(a => a.id === transaction.account_id);
      return `${institutionMap[account?.institution_id || '']} - ${transaction.accounts.name}`;
    }
    return '-';
  };

  // Helper function to safely parse date strings as local dates
  const parseLocalDate = (dateStr: string) => {
    return parse(dateStr, 'yyyy-MM-dd', new Date());
  };

  const formatDate = (dateStr: string) => {
    return format(parseLocalDate(dateStr), 'dd/MM/yyyy', { locale: ptBR });
  };

  // Format currency value
  const formatCurrency = (amount: number) => {
    return Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Math.abs(amount));
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(transactions.map(t => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectTransaction = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const handleSingleDelete = (id: string) => {
    setTransactionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmSingleDelete = () => {
    if (transactionToDelete) {
      onDelete(transactionToDelete);
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
    }
  };

  const handleBulkDelete = () => {
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = () => {
    onBulkDelete(selectedIds);
    setBulkDeleteDialogOpen(false);
    setSelectedIds([]);
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lançamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Carregando lançamentos...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lançamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="rounded-full bg-muted p-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Nenhum lançamento encontrado</h3>
              <p className="text-muted-foreground max-w-md">
                Não foram encontrados lançamentos com os filtros aplicados. 
                Tente ajustar os filtros ou criar um novo lançamento.
              </p>
            </div>
            <Button onClick={onNewTransaction} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Criar Primeiro Lançamento
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isAllSelected = selectedIds.length === transactions.length;
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < transactions.length;

  return (
    <div className="space-y-4">
      <BulkActionsBar
        selectedCount={selectedIds.length}
        onBulkDelete={handleBulkDelete}
        onClearSelection={clearSelection}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lançamentos ({transactions.length})</CardTitle>
          <Button onClick={onNewTransaction} size="sm" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Lançamento
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      className={isPartiallySelected ? "data-[state=checked]:bg-primary/50" : ""}
                    />
                  </TableHead>
                  <TableHead>Data do Evento</TableHead>
                  <TableHead>Data de Efetivação</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(transaction.id)}
                        onCheckedChange={(checked) => handleSelectTransaction(transaction.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">
                      {formatDate(transaction.event_date)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {transaction.effective_date
                        ? formatDate(transaction.effective_date)
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={transaction.description}>
                        {transaction.description}
                      </div>
                      {transaction.installment_number && (
                        <div className="text-xs text-muted-foreground">
                          {transaction.installment_number}/{transaction.total_installments}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {transaction.categories?.name || 'Sem categoria'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {getOriginDisplay(transaction)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium whitespace-nowrap">
                      <span className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {transaction.amount >= 0 ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                        transaction.status === 'concluido'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {transaction.status === 'concluido' ? 'Efetivado' : 'Pendente'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(transaction)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSingleDelete(transaction.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialogs */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmSingleDelete}
        title="Excluir lançamento"
        description="Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita."
        isLoading={isDeleting}
      />

      <DeleteConfirmationDialog
        isOpen={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Excluir lançamentos selecionados"
        description={`Tem certeza que deseja excluir ${selectedIds.length} lançamento${selectedIds.length > 1 ? 's' : ''}? Esta ação não pode ser desfeita.`}
        isLoading={isDeleting}
      />
    </div>
  );
}
