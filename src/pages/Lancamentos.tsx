
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Repeat, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { MonthSelector } from '@/components/planning/MonthSelector';
import { TransactionModal } from '@/components/transactions/TransactionModal';
import { InstallmentRecurringModal } from '@/components/transactions/InstallmentRecurringModal';
import { useTransactions, TransactionFilters, CreateTransactionData, InstallmentData, TransactionWithRelations } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import { useCreditCards } from '@/hooks/useCreditCards';

export default function Lancamentos() {
  const [filters, setFilters] = useState<TransactionFilters>({
    dateBase: 'event',
    startDate: '',
    endDate: '',
    categoryId: '',
    accountId: '',
    creditCardId: '',
    status: undefined,
    q: '',
  });

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`;
  });

  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithRelations | undefined>(undefined);

  // Calcular startDate e endDate baseado no mês selecionado
  const currentFilters: TransactionFilters = {
    ...filters,
    startDate: filters.startDate || selectedMonth,
    endDate: filters.endDate || (() => {
      const date = new Date(selectedMonth);
      date.setMonth(date.getMonth() + 1);
      date.setDate(0); // último dia do mês
      return date.toISOString().slice(0, 10);
    })(),
  };

  const {
    transactions,
    isLoading,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createInstallments,
    isCreating,
    isUpdating,
    isDeleting,
    isCreatingInstallments,
  } = useTransactions(currentFilters);

  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const { creditCards } = useCreditCards();

  const handleFilterChange = (key: keyof TransactionFilters, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value || undefined };
      
      // Limpar campos mutuamente exclusivos
      if (key === 'accountId' && value) {
        newFilters.creditCardId = undefined;
      } else if (key === 'creditCardId' && value) {
        newFilters.accountId = undefined;
      }
      
      return newFilters;
    });
  };

  const clearFilters = () => {
    setFilters({
      dateBase: 'event',
      startDate: '',
      endDate: '',
      categoryId: '',
      accountId: '',
      creditCardId: '',
      status: undefined,
      q: '',
    });
  };

  const handleCreateTransaction = (data: CreateTransactionData) => {
    createTransaction(data);
    setIsTransactionModalOpen(false);
  };

  const handleUpdateTransaction = (data: CreateTransactionData) => {
    if (editingTransaction) {
      updateTransaction({ id: editingTransaction.id, ...data });
      setEditingTransaction(undefined);
      setIsTransactionModalOpen(false);
    }
  };

  const handleCreateInstallments = (data: InstallmentData) => {
    createInstallments(data);
    setIsInstallmentModalOpen(false);
  };

  const handleEditTransaction = (transaction: TransactionWithRelations) => {
    setEditingTransaction(transaction);
    setIsTransactionModalOpen(true);
  };

  const handleDeleteTransaction = (id: string) => {
    deleteTransaction(id);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  const getStatusBadgeVariant = (status: string) => {
    return status === 'concluido' ? 'default' : 'secondary';
  };

  const getAmountColor = (amount: number) => {
    return amount >= 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Lançamentos</h1>
        <div className="flex space-x-2">
          <Button
            onClick={() => setIsInstallmentModalOpen(true)}
            variant="outline"
            size="sm"
          >
            <Repeat className="h-4 w-4 mr-2" />
            Recorrentes/Parcelados
          </Button>
          <Button
            onClick={() => {
              setEditingTransaction(undefined);
              setIsTransactionModalOpen(true);
            }}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Lançamento
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-card p-4 rounded-lg border space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Filtros</h3>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Limpar filtros
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Seletor de Mês */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Período</label>
            <MonthSelector
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />
          </div>

          {/* Base de Data */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Base da Data</label>
            <Select
              value={filters.dateBase}
              onValueChange={(value) => handleFilterChange('dateBase', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="event">Data do Evento</SelectItem>
                <SelectItem value="effective">Data de Efetivação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição</label>
            <Input
              placeholder="Buscar por descrição..."
              value={filters.q || ''}
              onChange={(e) => handleFilterChange('q', e.target.value)}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={filters.status || ''}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Categoria</label>
            <Select
              value={filters.categoryId || ''}
              onValueChange={(value) => handleFilterChange('categoryId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Conta */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Conta</label>
            <Select
              value={filters.accountId || ''}
              onValueChange={(value) => handleFilterChange('accountId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cartão */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Cartão</label>
            <Select
              value={filters.creditCardId || ''}
              onValueChange={(value) => handleFilterChange('creditCardId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {creditCards.map((card) => (
                  <SelectItem key={card.id} value={card.id}>
                    {card.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-card rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Data Evento</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Conta/Cartão</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Skeleton loading
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                </TableRow>
              ))
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum lançamento encontrado para os filtros selecionados.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => (
                <TableRow
                  key={transaction.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleEditTransaction(transaction)}
                >
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(transaction.status)}>
                      {transaction.status === 'concluido' ? 'Concluído' : 'Pendente'}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(transaction.event_date)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{transaction.description}</div>
                      {transaction.installment_number && (
                        <div className="text-sm text-muted-foreground">
                          Parcela {transaction.installment_number}/{transaction.total_installments}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {transaction.categories?.name || (
                      <span className="text-muted-foreground italic">Sem categoria</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {transaction.accounts?.name || transaction.credit_cards?.name}
                  </TableCell>
                  <TableCell className={cn("text-right font-medium", getAmountColor(transaction.amount))}>
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir este lançamento? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modais */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setEditingTransaction(undefined);
        }}
        onSave={editingTransaction ? handleUpdateTransaction : handleCreateTransaction}
        transaction={editingTransaction}
        isLoading={isCreating || isUpdating}
      />

      <InstallmentRecurringModal
        isOpen={isInstallmentModalOpen}
        onClose={() => setIsInstallmentModalOpen(false)}
        onSave={handleCreateInstallments}
        isLoading={isCreatingInstallments}
      />
    </div>
  );
}
