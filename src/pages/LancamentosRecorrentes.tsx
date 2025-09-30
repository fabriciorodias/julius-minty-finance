import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useRecurringTransactions } from "@/hooks/useRecurringTransactions";
import { RecurringTransactionCard } from "@/components/transactions/RecurringTransactionCard";
import { RecurringTransactionCardCompact } from "@/components/transactions/RecurringTransactionCardCompact";
import { RecurringTransactionsFilters } from "@/components/transactions/RecurringTransactionsFilters";
import { RecurringTransactionModal } from "@/components/transactions/RecurringTransactionModal";
import { RecurringTransactionsDashboard } from "@/components/transactions/RecurringTransactionsDashboard";
import { RecurringTransactionsTimeline } from "@/components/transactions/RecurringTransactionsTimeline";
import { RecurringSankeyChart } from "@/components/transactions/RecurringSankeyChart";
import { useRecurringSankey } from "@/hooks/useRecurringSankey";
import { NotionButton } from "@/components/ui/notion-button";
import { NotionCard, NotionCardContent } from "@/components/ui/notion-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, BarChart3, Settings, ArrowLeft, TrendingUp, TrendingDown, Clock, AlertTriangle, GitBranch } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function LancamentosRecorrentes() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dueDateFilter, setDueDateFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact');
  
  const { data: recurringTransactions = [], isLoading, error } = useRecurringTransactions();
  const { data: sankeyData, isLoading: isSankeyLoading } = useRecurringSankey();

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return recurringTransactions.filter(transaction => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          transaction.template_name.toLowerCase().includes(searchLower) ||
          transaction.description?.toLowerCase().includes(searchLower) ||
          transaction.category_name?.toLowerCase().includes(searchLower) ||
          transaction.account_name?.toLowerCase().includes(searchLower) ||
          transaction.counterparty_name?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Type filter
      if (typeFilter !== 'all' && transaction.type !== typeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && transaction.status !== statusFilter) {
        return false;
      }

      // Due date filter
      if (dueDateFilter !== 'all') {
        const days = transaction.days_until_due;
        switch (dueDateFilter) {
          case 'overdue':
            if (days >= 0) return false;
            break;
          case 'next-7':
            if (days < 0 || days > 7) return false;
            break;
          case 'next-30':
            if (days < 0 || days > 30) return false;
            break;
        }
      }

      return true;
    });
  }, [recurringTransactions, searchTerm, typeFilter, statusFilter, dueDateFilter]);

  // Statistics for filters and display
  const stats = useMemo(() => {
    const active = recurringTransactions.filter(t => t.status === 'active');
    const upcoming = active.filter(t => t.days_until_due <= 7);
    const overdue = active.filter(t => t.days_until_due < 0);
    
    const filteredRevenue = filteredTransactions.filter(t => t.type === 'receita');
    const filteredExpense = filteredTransactions.filter(t => t.type === 'despesa');
    const filteredOverdue = filteredTransactions.filter(t => t.days_until_due < 0);
    
    return {
      active,
      upcoming,
      overdue,
      filteredRevenue,
      filteredExpense,
      filteredOverdue
    };
  }, [recurringTransactions, filteredTransactions]);

  if (error) {
    console.error('Error loading recurring transactions:', error);
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-notion-h1 text-notion-gray-900">Lançamentos Recorrentes</h1>
              <p className="text-notion-body text-notion-gray-600 mt-1">Gerencie seus lançamentos fixos mensais</p>
            </div>
          </div>
          
          <NotionCard variant="muted" className="border-notion-danger/20">
            <NotionCardContent className="p-6">
              <div className="text-center">
                <p className="text-notion-danger">Erro ao carregar lançamentos recorrentes</p>
                <p className="text-notion-body-sm text-notion-gray-600 mt-1">
                  Tente recarregar a página
                </p>
              </div>
            </NotionCardContent>
          </NotionCard>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <NotionButton 
              variant="ghost" 
              size="sm" 
              onClick={() => window.location.href = '/lancamentos'}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Lançamentos
            </NotionButton>
            <div>
              <h1 className="text-notion-h1 text-notion-gray-900">Lançamentos Recorrentes</h1>
              <p className="text-notion-body text-notion-gray-600 mt-1">
                Gerencie seus lançamentos fixos mensais de forma inteligente
              </p>
            </div>
          </div>
          
          <NotionButton 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Lançamento Recorrente
          </NotionButton>
        </div>

        {/* Enhanced Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Receitas Stats */}
          <NotionCard variant="hoverable" className="transition-notion">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-notion-caption text-notion-gray-600">Receitas Ativas</p>
                  <p className="text-notion-value tabular-nums text-notion-gray-900">
                    {isLoading ? '-' : recurringTransactions.filter(t => t.type === 'receita' && t.status === 'active').length}
                  </p>
                  <p className="text-notion-body-sm text-notion-gray-600">
                    {isLoading ? '-' : `R$ ${recurringTransactions
                      .filter(t => t.type === 'receita' && t.status === 'active')
                      .reduce((sum, t) => sum + (t.expected_amount || 0), 0)
                      .toLocaleString('pt-BR', { maximumFractionDigits: 0 })} / mês`}
                  </p>
                </div>
                <div className="bg-notion-success/10 rounded-md p-2">
                  <TrendingUp className="h-6 w-6 text-notion-success" />
                </div>
              </div>
            </div>
          </NotionCard>

          {/* Despesas Stats */}
          <NotionCard variant="hoverable" className="transition-notion">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-notion-caption text-notion-gray-600">Despesas Ativas</p>
                  <p className="text-notion-value tabular-nums text-notion-gray-900">
                    {isLoading ? '-' : recurringTransactions.filter(t => t.type === 'despesa' && t.status === 'active').length}
                  </p>
                  <p className="text-notion-body-sm text-notion-gray-600">
                    {isLoading ? '-' : `R$ ${recurringTransactions
                      .filter(t => t.type === 'despesa' && t.status === 'active')
                      .reduce((sum, t) => sum + (t.expected_amount || 0), 0)
                      .toLocaleString('pt-BR', { maximumFractionDigits: 0 })} / mês`}
                  </p>
                </div>
                <div className="bg-notion-danger/10 rounded-md p-2">
                  <TrendingDown className="h-6 w-6 text-notion-danger" />
                </div>
              </div>
            </div>
          </NotionCard>

          {/* Upcoming Stats */}
          <NotionCard variant="hoverable" className="transition-notion">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-notion-caption text-notion-gray-600">Vencendo em 7 dias</p>
                  <p className="text-notion-value tabular-nums text-notion-gray-900">
                    {isLoading ? '-' : stats.upcoming.length}
                  </p>
                  <p className="text-notion-body-sm text-notion-gray-600">Requer atenção</p>
                </div>
                <div className="bg-notion-warning/10 rounded-md p-2">
                  <Clock className="h-6 w-6 text-notion-warning" />
                </div>
              </div>
            </div>
          </NotionCard>

          {/* Overdue Stats */}
          <NotionCard variant="hoverable" className="transition-notion">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-notion-caption text-notion-gray-600">Em Atraso</p>
                  <p className="text-notion-value tabular-nums text-notion-gray-900">
                    {isLoading ? '-' : stats.overdue.length}
                  </p>
                  <p className="text-notion-body-sm text-notion-gray-600">
                    {stats.overdue.length > 0 ? 'Ação necessária' : 'Tudo em dia'}
                  </p>
                </div>
                <div className="bg-notion-danger/10 rounded-md p-2">
                  <AlertTriangle className="h-6 w-6 text-notion-danger" />
                </div>
              </div>
            </div>
          </NotionCard>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="cards" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="cards" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Gestão
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="flow" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Fluxo de Recursos
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Análises
            </TabsTrigger>
          </TabsList>

          {/* Cards View - Main Management */}
          <TabsContent value="cards" className="space-y-6">
            {/* Filters */}
            <RecurringTransactionsFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              dueDateFilter={dueDateFilter}
              onDueDateFilterChange={setDueDateFilter}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              totalCount={recurringTransactions.length}
              filteredCount={filteredTransactions.length}
              revenueCount={stats.filteredRevenue.length}
              expenseCount={stats.filteredExpense.length}
              overdueCount={stats.filteredOverdue.length}
            />

            {isLoading ? (
              <div className={`grid gap-4 ${
                viewMode === 'compact' 
                  ? 'grid-cols-1 lg:grid-cols-2' 
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              }`}>
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className={viewMode === 'compact' ? "h-24" : "h-48"} />
                ))}
              </div>
            ) : filteredTransactions.length === 0 ? (
              searchTerm || typeFilter !== 'all' || statusFilter !== 'all' || dueDateFilter !== 'all' ? (
                <NotionCard variant="muted" className="transition-notion">
                  <div className="p-12">
                    <div className="text-center">
                      <Calendar className="h-12 w-12 text-notion-gray-400 mx-auto mb-4" />
                      <h3 className="text-notion-h3 text-notion-gray-900 mb-2">
                        Nenhum lançamento encontrado
                      </h3>
                      <p className="text-notion-body text-notion-gray-600 mb-4">
                        Tente ajustar os filtros de busca
                      </p>
                      <NotionButton 
                        variant="outline"
                        onClick={() => {
                          setSearchTerm('');
                          setTypeFilter('all');
                          setStatusFilter('all');
                          setDueDateFilter('all');
                        }}
                      >
                        Limpar filtros
                      </NotionButton>
                    </div>
                  </div>
                </NotionCard>
              ) : (
                <NotionCard variant="muted" className="transition-notion">
                  <div className="p-12">
                    <div className="text-center">
                      <Calendar className="h-12 w-12 text-notion-gray-400 mx-auto mb-4" />
                      <h3 className="text-notion-h3 text-notion-gray-900 mb-2">
                        Nenhum lançamento recorrente
                      </h3>
                      <p className="text-notion-body text-notion-gray-600 mb-4">
                        Comece criando seu primeiro lançamento recorrente para organizar melhor suas finanças
                      </p>
                      <NotionButton onClick={() => setShowCreateModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Criar primeiro lançamento
                      </NotionButton>
                    </div>
                  </div>
                </NotionCard>
              )
            ) : (
              <div className="space-y-8">
                {/* Receitas Section */}
                {(() => {
                  const receitas = filteredTransactions.filter(t => t.type === 'receita');
                  return receitas.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-1 h-8 bg-revenue rounded-full"></div>
                        <div>
                          <h2 className="text-2xl font-bold text-revenue flex items-center gap-2">
                            <TrendingUp className="h-6 w-6" />
                            Receitas Recorrentes
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            {receitas.length} lançamento{receitas.length > 1 ? 's' : ''} de receita
                          </p>
                        </div>
                      </div>
                      <div className={`grid gap-4 ${
                        viewMode === 'compact' 
                          ? 'grid-cols-1 lg:grid-cols-2' 
                          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                      }`}>
                        {receitas.map((transaction, index) => (
                          <div 
                            key={transaction.id}
                          >
                            {viewMode === 'compact' ? (
                              <RecurringTransactionCardCompact
                                transaction={transaction}
                                onEdit={() => setEditingTransaction(transaction.id)}
                              />
                            ) : (
                              <RecurringTransactionCard
                                transaction={transaction}
                                onEdit={() => setEditingTransaction(transaction.id)}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Despesas Section */}
                {(() => {
                  const despesas = filteredTransactions.filter(t => t.type === 'despesa');
                  return despesas.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-1 h-8 bg-expense rounded-full"></div>
                        <div>
                          <h2 className="text-2xl font-bold text-expense flex items-center gap-2">
                            <TrendingDown className="h-6 w-6" />
                            Despesas Recorrentes
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            {despesas.length} lançamento{despesas.length > 1 ? 's' : ''} de despesa
                          </p>
                        </div>
                      </div>
                      <div className={`grid gap-4 ${
                        viewMode === 'compact' 
                          ? 'grid-cols-1 lg:grid-cols-2' 
                          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                      }`}>
                        {despesas.map((transaction, index) => (
                          <div 
                            key={transaction.id}
                          >
                            {viewMode === 'compact' ? (
                              <RecurringTransactionCardCompact
                                transaction={transaction}
                                onEdit={() => setEditingTransaction(transaction.id)}
                              />
                            ) : (
                              <RecurringTransactionCard
                                transaction={transaction}
                                onEdit={() => setEditingTransaction(transaction.id)}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </TabsContent>

          {/* Timeline View */}
          <TabsContent value="timeline">
            <RecurringTransactionsTimeline transactions={recurringTransactions} />
          </TabsContent>

          {/* Dashboard View */}
          <TabsContent value="dashboard">
            <RecurringTransactionsDashboard transactions={recurringTransactions} />
          </TabsContent>

          {/* Flow View */}
          <TabsContent value="flow">
            {isSankeyLoading ? (
              <NotionCard variant="muted">
                <NotionCardContent className="p-6">
                  <div className="text-center">
                    <p className="text-notion-body text-notion-gray-600">Carregando fluxo de recursos...</p>
                  </div>
                </NotionCardContent>
              </NotionCard>
            ) : (
              <RecurringSankeyChart data={sankeyData || { nodes: [], links: [] }} />
            )}
          </TabsContent>

          {/* Analytics View */}
          <TabsContent value="analytics" className="space-y-4">
            <NotionCard variant="muted" className="transition-notion">
              <NotionCardContent className="p-6">
                <h2 className="text-notion-h2 text-notion-gray-900 mb-4">Análises Detalhadas</h2>
                <div className="text-center p-8">
                  <BarChart3 className="h-12 w-12 text-notion-gray-400 mx-auto mb-4" />
                  <h3 className="text-notion-h3 text-notion-gray-900 mb-2">Analytics Avançado</h3>
                  <p className="text-notion-body text-notion-gray-600">
                    Análises detalhadas de variações, tendências e otimizações em breve
                  </p>
                </div>
              </NotionCardContent>
            </NotionCard>
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <RecurringTransactionModal
          open={showCreateModal || !!editingTransaction}
          onOpenChange={(open) => {
            if (!open) {
              setShowCreateModal(false);
              setEditingTransaction(null);
            }
          }}
          transactionId={editingTransaction}
        />
      </div>
    </AppLayout>
  );
}