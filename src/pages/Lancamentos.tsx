
import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTransactions, TransactionFilters } from '@/hooks/useTransactions';
import { TransactionModal } from '@/components/transactions/TransactionModal';
import { TransactionsList } from '@/components/transactions/TransactionsList';
import { TransactionFilters as TransactionFiltersComponent } from '@/components/transactions/TransactionFilters';
import { CounterpartiesFilter } from '@/components/transactions/CounterpartiesFilter';
import { ReviewStatusFilter } from '@/components/transactions/ReviewStatusFilter';
import { TagsFilter } from '@/components/transactions/TagsFilter';
import { QuickDateFilters } from '@/components/transactions/QuickDateFilters';
import { BulkActionsBar } from '@/components/transactions/BulkActionsBar';
import { DeleteConfirmationDialog } from '@/components/transactions/DeleteConfirmationDialog';
import { AccountsFilterPanel } from '@/components/transactions/AccountsFilterPanel';
import { BalancesOverview } from '@/components/transactions/BalancesOverview';
import { DynamicBalanceCard } from '@/components/transactions/DynamicBalanceCard';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export default function Lancamentos() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [deleteTransactionId, setDeleteTransactionId] = useState<string | null>(null);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  
  // Filters state
  const [filters, setFilters] = useState<TransactionFilters>({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  // Persistent filter states
  const [selectedAccountIds, setSelectedAccountIds] = useLocalStorage<string[]>('transactions-selected-accounts', []);
  const [selectedTagIds, setSelectedTagIds] = useLocalStorage<string[]>('transactions-selected-tags', []);

  const {
    transactions,
    isLoading,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    deleteBulkTransactions,
    isCreating,
    isUpdating,
    isDeleting,
  } = useTransactions({
    ...filters,
    accountIds: selectedAccountIds.length > 0 ? selectedAccountIds : undefined,
    tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
  });

  const handleCreateTransaction = (data: any) => {
    createTransaction(data);
  };

  const handleUpdateTransaction = (data: any) => {
    if (editingTransaction) {
      updateTransaction({ id: editingTransaction.id, ...data });
    }
  };

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const handleDelete = (id: string) => {
    setDeleteTransactionId(id);
    setIsBulkDelete(false);
  };

  const handleBulkDelete = () => {
    setIsBulkDelete(true);
  };

  const confirmDelete = () => {
    if (isBulkDelete) {
      deleteBulkTransactions(selectedTransactions);
      setSelectedTransactions([]);
    } else if (deleteTransactionId) {
      deleteTransaction(deleteTransactionId);
    }
    setDeleteTransactionId(null);
    setIsBulkDelete(false);
  };

  const handleFilterChange = (newFilters: Partial<TransactionFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleTagClick = (tagName: string) => {
    if (selectedTagIds.includes(tagName)) {
      setSelectedTagIds(selectedTagIds.filter(id => id !== tagName));
    } else {
      setSelectedTagIds([...selectedTagIds, tagName]);
    }
  };

  const handleCounterpartyClick = (counterpartyId: string) => {
    setFilters(prev => ({ 
      ...prev, 
      counterpartyId: prev.counterpartyId === counterpartyId ? undefined : counterpartyId 
    }));
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lançamentos</h1>
          <p className="text-muted-foreground">
            Gerencie suas receitas e despesas
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Lançamento
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left sidebar with filters */}
        <div className="lg:col-span-1 space-y-6">
          <BalancesOverview accountIds={selectedAccountIds} />
          
          <DynamicBalanceCard filters={filters} />
          
          <QuickDateFilters
            onDateRangeChange={(startDate, endDate) => 
              handleFilterChange({ startDate, endDate })
            }
          />

          <TransactionFiltersComponent
            filters={filters}
            onFiltersChange={handleFilterChange}
          />

          <AccountsFilterPanel
            selectedAccountIds={selectedAccountIds}
            onAccountSelectionChange={setSelectedAccountIds}
          />

          <CounterpartiesFilter
            selectedCounterpartyId={filters.counterpartyId}
            onCounterpartyChange={(counterpartyId) => 
              handleFilterChange({ counterpartyId })
            }
          />

          <ReviewStatusFilter
            selectedStatus={filters.isReviewed}
            onStatusChange={(isReviewed) => 
              handleFilterChange({ isReviewed })
            }
          />

          <TagsFilter
            selectedTagIds={selectedTagIds}
            onTagSelectionChange={setSelectedTagIds}
          />
        </div>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          {selectedTransactions.length > 0 && (
            <BulkActionsBar
              selectedCount={selectedTransactions.length}
              onBulkDelete={handleBulkDelete}
              onClearSelection={() => setSelectedTransactions([])}
            />
          )}

          <TransactionsList
            transactions={transactions}
            onEdit={handleEdit}
            onDelete={handleDelete}
            selectedTransactions={selectedTransactions}
            onSelectionChange={setSelectedTransactions}
            onTagClick={handleTagClick}
            onCounterpartyClick={handleCounterpartyClick}
          />
        </div>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={editingTransaction ? handleUpdateTransaction : handleCreateTransaction}
        transaction={editingTransaction}
        isLoading={isCreating || isUpdating}
      />

      <DeleteConfirmationDialog
        isOpen={!!deleteTransactionId || isBulkDelete}
        onClose={() => {
          setDeleteTransactionId(null);
          setIsBulkDelete(false);
        }}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
        title={isBulkDelete ? "Excluir Lançamentos" : "Excluir Lançamento"}
        description={
          isBulkDelete
            ? `Tem certeza que deseja excluir ${selectedTransactions.length} lançamento(s) selecionado(s)?`
            : "Tem certeza que deseja excluir este lançamento?"
        }
      />
    </div>
  );
}
