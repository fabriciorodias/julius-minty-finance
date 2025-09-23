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
import { QuickDateFilters } from '@/components/transactions/QuickDateFilters';
import { FiltersMobileDrawer } from '@/components/transactions/FiltersMobileDrawer';
import { AnxiousBalancePanel } from '@/components/transactions/AnxiousBalancePanel';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Upload, CreditCard, AlertTriangle, TrendingUp, Plus, MoreHorizontal, Filter } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { CashFlowModal } from '@/components/transactions/CashFlowModal';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Lancamentos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  
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
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithRelations | null>(null);
  const [duplicateOf, setDuplicateOf] = useState<TransactionWithRelations | null>(null);

  // Details sheet state
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const [detailsTransaction, setDetailsTransaction] = useState<TransactionWithRelations | null>(null);

  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const { institutions } = useInstitutions();
  const { balanceMap, isLoading: balancesLoading } = useAccountBalances();

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

  const handleEdit = (transaction: TransactionWithRelations) => {
    setSelectedTransaction(transaction);
    setDuplicateOf(null);
    setIsModalOpen(true);
  };

  const handleDuplicate = (transaction: TransactionWithRelations) => {
    setSelectedTransaction(null);
    setDuplicateOf(transaction);
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
      setDuplicateOf(null);
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
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold tracking-tight">Lançamentos</h1>
              <p className="text-muted-foreground mt-1">
                Gerencie suas receitas e despesas
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Primary CTA */}
              <Button 
                onClick={() => setIsModalOpen(true)} 
                size="default"
                className="hover-scale bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Lançamento
              </Button>
              
              {/* More Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="default" className="hover-scale">
                    <MoreHorizontal className="h-4 w-4 mr-2" />
                    Mais
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 z-50 bg-popover">
                  <DropdownMenuItem onClick={() => window.location.href = '/importar'}>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Extratos/Faturas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsInvoiceModalOpen(true)}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Gerenciar Faturas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsInstallmentModalOpen(true)}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Lançamento Parcelado/Recorrente
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsCashFlowModalOpen(true)}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Fluxo de Caixa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Filters Button */}
              {isMobile && (
                <Button 
                  variant="outline" 
                  size="default"
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="hover-scale"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
              )}
            </div>
          </div>

          {/* Date Filters */}
          <div className="flex justify-end mt-4">
            <QuickDateFilters
              onDateRangeSelect={handleDateRangeSelect}
              currentStartDate={dateFilters.startDate}
              currentEndDate={dateFilters.endDate}
            />
          </div>
        </div>
      </div>

      <div className="p-6 pt-2 space-y-6">
        {/* Alert for uncategorized transactions */}
        {uncategorizedCount > 0 && (
          <div className="animate-fade-in">
            <Alert className="border-amber-200/60 bg-gradient-to-r from-amber-50 to-yellow-50/80 shadow-sm ring-1 ring-amber-100/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100/60 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <AlertDescription className="text-amber-800 font-medium">
                    Você tem <strong>{uncategorizedCount}</strong> lançamento{uncategorizedCount > 1 ? 's' : ''} sem categoria.
                  </AlertDescription>
                  <p className="text-amber-700/80 text-sm mt-1">
                    É recomendado categorizar todos os lançamentos para um melhor controle financeiro.
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-amber-700 hover:text-amber-800 hover:bg-amber-100/60"
                >
                  Abrir Categorias
                </Button>
              </div>
            </Alert>
          </div>
        )}

        {/* Two-Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Filters (Desktop Only) */}
          {!isMobile && (
            <div className="lg:col-span-1 space-y-6 animate-fade-in">
              <AccountsFilterPanel
                accounts={accounts}
                institutions={institutions}
                selectedAccountIds={selectedAccountIds}
                onAccountSelectionChange={setSelectedAccountIds}
                balanceMap={balanceMap}
              />

              <TagsFilter
                selectedTagIds={selectedTags}
                onTagsChange={setSelectedTags}
              />
            </div>
          )}

          {/* Right Panel - Main Content */}
          <div className={`${isMobile ? 'col-span-1' : 'lg:col-span-3'} space-y-6 animate-fade-in`}>
            {/* New Anxious Balance Panel */}
            <AnxiousBalancePanel
              selectedAccountIds={selectedAccountIds}
              dateFilters={dateFilters}
            />

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
      </div>

      {/* Mobile Filters Drawer */}
      <FiltersMobileDrawer
        isOpen={isMobileFiltersOpen}
        onClose={() => setIsMobileFiltersOpen(false)}
        accounts={accounts}
        institutions={institutions}
        selectedAccountIds={selectedAccountIds}
        onAccountSelectionChange={setSelectedAccountIds}
        balanceMap={balanceMap}
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
        onDateRangeSelect={handleDateRangeSelect}
        currentStartDate={dateFilters.startDate}
        currentEndDate={dateFilters.endDate}
      />

      {/* Modals */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        transaction={selectedTransaction}
        duplicateOf={duplicateOf}
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
        onDuplicate={handleDuplicate}
        onTagClick={handleTagClick}
      />
    </div>
  );
}
