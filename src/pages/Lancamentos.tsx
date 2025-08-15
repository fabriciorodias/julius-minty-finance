
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useTransactions, TransactionFilters, TransactionWithRelations, CreateTransactionData } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useInstitutions } from '@/hooks/useInstitutions';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { TransactionModal } from '@/components/transactions/TransactionModal';
import { InstallmentRecurringModal } from '@/components/transactions/InstallmentRecurringModal';
import { TransactionFilters as FiltersComponent } from '@/components/transactions/TransactionFilters';
import { TransactionsList } from '@/components/transactions/TransactionsList';

export default function Lancamentos() {
  // Persist filters in localStorage
  const [filters, setFilters] = useLocalStorage<TransactionFilters>('transaction-filters', {});
  const [searchTerm, setSearchTerm] = useLocalStorage<string>('transaction-search', '');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithRelations | null>(null);

  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const { creditCards } = useCreditCards();
  const { institutions } = useInstitutions();

  const {
    transactions,
    isLoading,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createInstallments,
    isCreating,
    isUpdating,
    isDeleting,
    isCreatingInstallments,
  } = useTransactions(filters);

  const handleEdit = (transaction: TransactionWithRelations) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteTransaction(id);
  };

  const handleSaveTransaction = (data: CreateTransactionData) => {
    if (selectedTransaction) {
      updateTransaction({ id: selectedTransaction.id, ...data });
    } else {
      createTransaction(data);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction =>
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactions, searchTerm]);

  useEffect(() => {
    if (!isModalOpen) {
      setSelectedTransaction(null);
    }
  }, [isModalOpen]);

  // Log error for debugging
  useEffect(() => {
    if (error) {
      console.error('Error loading transactions:', error);
    }
  }, [error]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lançamentos</h1>
          <p className="text-muted-foreground">
            Gerencie suas receitas e despesas
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setIsInstallmentModalOpen(true)} variant="outline">
            Lançamento Parcelado/Recorrente
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            Novo Lançamento
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <FiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        categories={categories}
        accounts={accounts}
        creditCards={creditCards}
        institutions={institutions}
      />

      {/* Lista de lançamentos */}
      <TransactionsList
        transactions={filteredTransactions}
        accounts={accounts}
        creditCards={creditCards}
        institutions={institutions}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onNewTransaction={() => setIsModalOpen(true)}
      />

      {/* Modais */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        transaction={selectedTransaction}
        isLoading={isCreating || isUpdating}
      />

      <InstallmentRecurringModal
        isOpen={isInstallmentModalOpen}
        onClose={() => setIsInstallmentModalOpen(false)}
        onSave={createInstallments}
        isLoading={isCreatingInstallments}
      />
    </div>
  );
}
