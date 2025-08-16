
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
import { ImportTransactionsModal } from '@/components/transactions/ImportTransactionsModal';
import { InvoiceManagerModal } from '@/components/transactions/InvoiceManagerModal';
import { TransactionFilters as FiltersComponent } from '@/components/transactions/TransactionFilters';
import { TransactionsList } from '@/components/transactions/TransactionsList';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CreditCard, AlertTriangle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export default function Lancamentos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Persist filters in localStorage
  const [filters, setFilters] = useLocalStorage<TransactionFilters>('transaction-filters', {});
  const [searchTerm, setSearchTerm] = useLocalStorage<string>('transaction-search', '');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
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
    deleteBulkTransactions,
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

  const handleBulkDelete = (ids: string[]) => {
    deleteBulkTransactions(ids);
  };

  const handleSaveTransaction = (data: CreateTransactionData) => {
    if (selectedTransaction) {
      updateTransaction({ id: selectedTransaction.id, ...data });
    } else {
      createTransaction(data);
    }
  };

  const handleImportSuccess = () => {
    // Invalidate and refetch transactions to show newly imported ones
    queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['uncategorized-count', user?.id] });
    
    // Filter to show only uncategorized transactions after import
    setFilters({ ...filters, withoutCategory: true });
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction =>
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactions, searchTerm]);

  // Check for uncategorized transactions
  const uncategorizedCount = useMemo(() => {
    return transactions.filter(t => t.category_id === null).length;
  }, [transactions]);

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
          <Button onClick={() => setIsImportModalOpen(true)} variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Importar Extratos/Faturas
          </Button>
          <Button onClick={() => setIsInvoiceModalOpen(true)} variant="outline" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Gerenciar Faturas
          </Button>
          <Button onClick={() => setIsInstallmentModalOpen(true)} variant="outline">
            Lançamento Parcelado/Recorrente
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            Novo Lançamento
          </Button>
        </div>
      </div>

      {/* Alert for uncategorized transactions */}
      {uncategorizedCount > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Você tem <strong>{uncategorizedCount}</strong> lançamento{uncategorizedCount > 1 ? 's' : ''} sem categoria. 
            É recomendado categorizar todos os lançamentos para um melhor controle financeiro.
            <Button 
              variant="link" 
              className="p-0 h-auto ml-2 text-yellow-800 underline"
              onClick={() => setFilters({ ...filters, withoutCategory: true })}
            >
              Ver lançamentos não categorizados
            </Button>
          </AlertDescription>
        </Alert>
      )}

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
        onBulkDelete={handleBulkDelete}
        onNewTransaction={() => setIsModalOpen(true)}
        isDeleting={isDeleting}
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

      <ImportTransactionsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />

      <InvoiceManagerModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
      />
    </div>
  );
}
