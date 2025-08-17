
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTransactions, TransactionFilters, TransactionWithRelations, CreateTransactionData } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import { useInstitutions } from '@/hooks/useInstitutions';
import { useAccountBalances } from '@/hooks/useAccountBalances';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { TransactionModal } from '@/components/transactions/TransactionModal';
import { InstallmentRecurringModal } from '@/components/transactions/InstallmentRecurringModal';
import { ImportTransactionsModal } from '@/components/transactions/ImportTransactionsModal';
import { InvoiceManagerModal } from '@/components/transactions/InvoiceManagerModal';
import { TransactionsList } from '@/components/transactions/TransactionsList';
import { TransactionDetailsSheet } from '@/components/transactions/TransactionDetailsSheet';
import { AccountsFilterPanel } from '@/components/transactions/AccountsFilterPanel';
import { TagsFilter } from '@/components/transactions/TagsFilter';
import { DynamicBalanceCard } from '@/components/transactions/DynamicBalanceCard';
import { QuickDateFilters } from '@/components/transactions/QuickDateFilters';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CreditCard, AlertTriangle, TrendingUp } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { CashFlowModal } from '@/components/transactions/CashFlowModal';
import { BalancesOverview } from '@/components/transactions/BalancesOverview';

export default function Lancamentos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Local storage for selected accounts, tags and search
  const [selectedAccountIds, setSelectedAccountIds] = useLocalStorage<string[]>('selected-account-ids', []);
  const [selectedTags, setSelectedTags] = useLocalStorage<string[]>('selected-tags', []);
  const [searchTerm, setSearchTerm] = useLocalStorage<string>('transaction-search', '');
  const [dateFilters, setDateFilters] = useLocalStorage<{ startDate?: string; endDate?: string }>('transaction-date-filters', {});
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isCashFlowModalOpen, setIsCashFlowModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithRelations | null>(null);

  // Details sheet state
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const [detailsTransaction, setDetailsTransaction] = useState<TransactionWithRelations | null>(null);

  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const { institutions } = useInstitutions();
  const { balanceMap, isLoading: balancesLoading } = useAccountBalances();

  // Initialize selected accounts with all active accounts if none selected
  useEffect(() => {
    if (accounts.length > 0 && selectedAccountIds.length === 0) {
      const activeAccountIds = accounts.filter(account => account.is_active).map(account => account.id);
      setSelectedAccountIds(activeAccountIds);
    }
  }, [accounts, selectedAccountIds.length, setSelectedAccountIds]);

  // Handle URL synchronization for details view
  useEffect(() => {
    const viewTxId = searchParams.get('viewTx');
    if (viewTxId && transactions.length > 0) {
      const transaction = transactions.find(tx => tx.id === viewTxId);
      if (transaction) {
        setDetailsTransaction(transaction);
        setIsDetailsSheetOpen(true);
      }
    }
  }, [searchParams, transactions]);

  // Build transaction filters
  const filters: TransactionFilters = useMemo(() => {
    const baseFilters: TransactionFilters = {
      accountIds: selectedAccountIds.length > 0 ? selectedAccountIds : undefined,
      tagIds: selectedTags.length > 0 ? selectedTags : undefined,
    };

    if (dateFilters.startDate) baseFilters.startDate = dateFilters.startDate;
    if (dateFilters.endDate) baseFilters.endDate = dateFilters.endDate;

    return baseFilters;
  }, [selectedAccountIds, selectedTags, dateFilters]);

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
    queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['account-balances', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['uncategorized-count', user?.id] });
  };

  const handleDateRangeSelect = (startDate: string, endDate: string) => {
    setDateFilters({ startDate, endDate });
  };

  // Handle tag click from transaction list
  const handleTagClick = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter(tag => tag !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  // Handle row click to open details
  const handleRowClick = (transaction: TransactionWithRelations) => {
    setDetailsTransaction(transaction);
    setIsDetailsSheetOpen(true);
    // Update URL with transaction ID
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('viewTx', transaction.id);
    setSearchParams(newSearchParams);
  };

  // Handle details sheet close
  const handleDetailsSheetClose = (open: boolean) => {
    setIsDetailsSheetOpen(open);
    if (!open) {
      setDetailsTransaction(null);
      // Remove viewTx from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('viewTx');
      setSearchParams(newSearchParams);
    }
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

  // Invalidate account balances when transactions change
  useEffect(() => {
    return () => {
      queryClient.invalidateQueries({ queryKey: ['account-balances', user?.id] });
    };
  }, [transactions, queryClient, user?.id]);

  // Determine pre-filled account for new transaction modal
  const prefilledAccountId = selectedAccountIds.length === 1 ? selectedAccountIds[0] : undefined;

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
          <Button 
            onClick={() => setIsCashFlowModalOpen(true)} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2 text-xs"
          >
            <TrendingUp className="h-3 w-3" />
            Fluxo de Caixa
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
          </AlertDescription>
        </Alert>
      )}

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Panel - Filters */}
        <div className="lg:col-span-1 space-y-4">
          {/* Account Filter */}
          <AccountsFilterPanel
            accounts={accounts}
            institutions={institutions}
            selectedAccountIds={selectedAccountIds}
            onAccountSelectionChange={setSelectedAccountIds}
            balanceMap={balanceMap}
          />

          {/* Tags Filter */}
          <TagsFilter
            selectedTagIds={selectedTags}
            onTagsChange={setSelectedTags}
          />
        </div>

        {/* Right Panel - Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Enhanced Balances Overview - Now with 3 cards */}
          <BalancesOverview
            selectedAccountIds={selectedAccountIds}
            accounts={accounts}
            institutions={institutions}
            balanceMap={balanceMap}
            dateFilters={dateFilters}
          />

          {/* Header with Add Button and Quick Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Button onClick={() => setIsModalOpen(true)} size="lg" className="w-full sm:w-auto">
              Adicionar Lançamento
            </Button>
            
            <QuickDateFilters
              onDateRangeSelect={handleDateRangeSelect}
              currentStartDate={dateFilters.startDate}
              currentEndDate={dateFilters.endDate}
            />
          </div>

          {/* Transactions List */}
          <TransactionsList
            transactions={filteredTransactions}
            accounts={accounts}
            institutions={institutions}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onBulkDelete={handleBulkDelete}
            onNewTransaction={() => setIsModalOpen(true)}
            isDeleting={isDeleting}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onTagClick={handleTagClick}
            onRowClick={handleRowClick}
          />
        </div>
      </div>

      {/* Modals */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        transaction={selectedTransaction}
        isLoading={isCreating || isUpdating}
        prefilledAccountId={prefilledAccountId}
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

      <CashFlowModal
        isOpen={isCashFlowModalOpen}
        onClose={() => setIsCashFlowModalOpen(false)}
        selectedAccountIds={selectedAccountIds}
        accounts={accounts}
        institutions={institutions}
        dateFilters={dateFilters}
      />

      {/* Transaction Details Sheet */}
      <TransactionDetailsSheet
        open={isDetailsSheetOpen}
        onOpenChange={handleDetailsSheetClose}
        transaction={detailsTransaction}
        accounts={accounts}
        institutions={institutions}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onTagClick={handleTagClick}
      />
    </div>
  );
}
