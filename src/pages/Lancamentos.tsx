import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { NotionButton } from '@/components/ui/notion-button';
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
import { Upload, CreditCard, AlertTriangle, TrendingUp, Plus, MoreHorizontal, Filter, Repeat, ArrowRightLeft, Brain, Loader2 } from 'lucide-react';
import { TransferModal } from '@/components/transactions/TransferModal';
import { useTransfers, CreateTransferData } from '@/hooks/useTransfers';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { CashFlowModal } from '@/components/transactions/CashFlowModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { AICategorizeModal } from '@/components/transactions/AICategorizeModal';
import { useUncategorizedCount } from '@/hooks/useUncategorizedCount';
import { toast } from '@/components/ui/use-toast';

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
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithRelations | null>(null);
  const [duplicateOf, setDuplicateOf] = useState<TransactionWithRelations | null>(null);

  // Details sheet state
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const [detailsTransaction, setDetailsTransaction] = useState<TransactionWithRelations | null>(null);
  
  // AI Categorization state
  const [isAICategorizeModalOpen, setIsAICategorizeModalOpen] = useState(false);
  const [uncategorizedTransactions, setUncategorizedTransactions] = useState<TransactionWithRelations[]>([]);
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const { institutions } = useInstitutions();
  const { balanceMap, isLoading: balancesLoading } = useAccountBalances();
  const { count: uncategorizedCountFromHook } = useUncategorizedCount();

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

  const { createTransfer, isCreating: isCreatingTransfer } = useTransfers();

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

  // Handle AI categorization click
  const handleAICategorizationClick = () => {
    const uncategorized = transactions.filter(t => !t.category_id);
    setUncategorizedTransactions(uncategorized);
    setIsAICategorizeModalOpen(true);
  };

  // Handle applying AI categorizations
  const handleApplyCategorizations = async (categorizations: { transaction_id: string; category_id: string }[]) => {
    setIsProcessingAI(true);
    try {
      // Apply categorizations in parallel
      await Promise.all(
        categorizations.map(cat => 
          updateTransaction({
            id: cat.transaction_id,
            category_id: cat.category_id,
          })
        )
      );
      
      toast({
        title: "Categorização aplicada",
        description: `${categorizations.length} transação${categorizations.length !== 1 ? 'ões foram' : ' foi'} categorizada${categorizations.length !== 1 ? 's' : ''} com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível aplicar algumas categorizações.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingAI(false);
    }
  };

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

  const handleSaveTransfer = (data: CreateTransferData) => {
    createTransfer.mutate(data, {
      onSuccess: () => {
        setIsTransferModalOpen(false);
      }
    });
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

  // Use uncategorized count from hook
  const uncategorizedCount = uncategorizedCountFromHook;

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
    <div className="min-h-screen bg-notion-gray-25">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-notion-gray-200 shadow-notion-sm">
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-notion-h1">Lançamentos</h1>
              <p className="text-notion-caption text-notion-gray-600 mt-1">
                Gerencie suas receitas e despesas
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Recurring Transactions Button */}
              <NotionButton 
                onClick={() => window.location.href = '/lancamentos/recorrentes'} 
                variant="outline"
                size="md"
              >
                <Repeat className="h-4 w-4 mr-2" />
                Contas Recorrentes
              </NotionButton>
              
              {/* Primary CTA */}
              <NotionButton 
                onClick={() => setIsModalOpen(true)} 
                size="md"
                variant="primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Lançamento
              </NotionButton>
              
              {/* More Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <NotionButton variant="outline" size="md">
                    <MoreHorizontal className="h-4 w-4 mr-2" />
                    Mais
                  </NotionButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 z-50 bg-white shadow-notion-lg border border-notion-gray-200">
                  <DropdownMenuItem onClick={() => window.location.href = '/importar'} className="text-notion-body-sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Extratos/Faturas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsInvoiceModalOpen(true)} className="text-notion-body-sm">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Gerenciar Faturas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsTransferModalOpen(true)} className="text-notion-body-sm">
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Nova Transferência
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsInstallmentModalOpen(true)} className="text-notion-body-sm">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Lançamento Parcelado/Recorrente
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsCashFlowModalOpen(true)} className="text-notion-body-sm">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Fluxo de Caixa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Filters Button */}
              {isMobile && (
                <NotionButton 
                  variant="outline" 
                  size="md"
                  onClick={() => setIsMobileFiltersOpen(true)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </NotionButton>
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
          <Alert className="border-notion-warning-border bg-notion-warning-bg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-notion-warning" />
              </div>
              <div className="flex-1">
                <AlertDescription className="text-notion-gray-900 font-medium text-notion-body-sm">
                  Você tem <strong>{uncategorizedCount}</strong> lançamento{uncategorizedCount > 1 ? 's' : ''} sem categoria.
                </AlertDescription>
                <p className="text-notion-gray-600 text-notion-caption mt-1">
                  É recomendado categorizar todos os lançamentos para um melhor controle financeiro.
                </p>
              </div>
              <NotionButton 
                variant="ghost" 
                size="sm"
                className="text-notion-warning hover:bg-amber-100"
                onClick={handleAICategorizationClick}
                disabled={isProcessingAI}
              >
                {isProcessingAI ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Categorizar com IA
                  </>
                )}
              </NotionButton>
            </div>
          </Alert>
        )}

        {/* Two-Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Filters (Desktop Only) */}
          {!isMobile && (
            <div className="lg:col-span-1 space-y-6">
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
          <div className={`${isMobile ? 'col-span-1' : 'lg:col-span-3'} space-y-6`}>
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

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSave={handleSaveTransfer}
        isLoading={isCreatingTransfer}
        accounts={accounts}
        accountBalances={balanceMap}
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

      {/* AI Categorize Modal */}
      <AICategorizeModal
        open={isAICategorizeModalOpen}
        onOpenChange={setIsAICategorizeModalOpen}
        transactions={uncategorizedTransactions}
        categories={categories}
        onApplyCategorizations={handleApplyCategorizations}
      />
    </div>
  );
}
