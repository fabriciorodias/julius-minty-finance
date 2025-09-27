import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useRecurringTransactions } from "@/hooks/useRecurringTransactions";
import { RecurringTransactionCard } from "@/components/transactions/RecurringTransactionCard";
import { RecurringTransactionModal } from "@/components/transactions/RecurringTransactionModal";
import { RecurringTransactionsDashboard } from "@/components/transactions/RecurringTransactionsDashboard";
import { RecurringTransactionsTimeline } from "@/components/transactions/RecurringTransactionsTimeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, BarChart3, Settings, ArrowLeft, TrendingUp, TrendingDown, Clock, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function LancamentosRecorrentes() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  
  const { data: recurringTransactions = [], isLoading, error } = useRecurringTransactions();

  if (error) {
    console.error('Error loading recurring transactions:', error);
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Lançamentos Recorrentes</h1>
              <p className="text-muted-foreground mt-1">Gerencie seus lançamentos fixos mensais</p>
            </div>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-destructive">Erro ao carregar lançamentos recorrentes</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Tente recarregar a página
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const activeTransactions = recurringTransactions.filter(t => t.status === 'active');
  const upcomingTransactions = activeTransactions.filter(t => t.days_until_due <= 7);
  const overdueTransactions = activeTransactions.filter(t => t.days_until_due < 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.location.href = '/lancamentos'}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Lançamentos
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Lançamentos Recorrentes</h1>
              <p className="text-muted-foreground mt-1">
                Gerencie seus lançamentos fixos mensais de forma inteligente
              </p>
            </div>
          </div>
          
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Lançamento Recorrente
          </Button>
        </div>

        {/* Enhanced Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Receitas Stats */}
          <Card className="border-l-4 border-l-revenue bg-gradient-to-r from-revenue-lighter to-white hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-revenue flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Receitas Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-revenue">
                {isLoading ? <Skeleton className="h-8 w-12" /> : (
                  recurringTransactions.filter(t => t.type === 'receita' && t.status === 'active').length
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isLoading ? '-' : (
                  `R$ ${recurringTransactions
                    .filter(t => t.type === 'receita' && t.status === 'active')
                    .reduce((sum, t) => sum + (t.expected_amount || 0), 0)
                    .toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
                )} / mês
              </p>
            </CardContent>
          </Card>

          {/* Despesas Stats */}
          <Card className="border-l-4 border-l-expense bg-gradient-to-r from-expense-lighter to-white hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-expense flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Despesas Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-expense">
                {isLoading ? <Skeleton className="h-8 w-12" /> : (
                  recurringTransactions.filter(t => t.type === 'despesa' && t.status === 'active').length
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isLoading ? '-' : (
                  `R$ ${recurringTransactions
                    .filter(t => t.type === 'despesa' && t.status === 'active')
                    .reduce((sum, t) => sum + (t.expected_amount || 0), 0)
                    .toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
                )} / mês
              </p>
            </CardContent>
          </Card>

          {/* Upcoming Stats */}
          <Card className="border-l-4 border-l-status-upcoming bg-gradient-to-r from-status-upcoming-bg to-white hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-status-upcoming flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Vencendo em 7 dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-status-upcoming">
                {isLoading ? <Skeleton className="h-8 w-12" /> : upcomingTransactions.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Requer atenção
              </p>
            </CardContent>
          </Card>

          {/* Overdue Stats */}
          <Card className="border-l-4 border-l-status-overdue bg-gradient-to-r from-status-overdue-bg to-white hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-status-overdue flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Em Atraso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-status-overdue">
                {isLoading ? <Skeleton className="h-8 w-12" /> : overdueTransactions.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {overdueTransactions.length > 0 ? 'Ação necessária' : 'Tudo em dia'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="cards" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
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
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Análises
            </TabsTrigger>
          </TabsList>

          {/* Cards View - Main Management */}
          <TabsContent value="cards" className="space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            ) : recurringTransactions.length === 0 ? (
              <Card>
                <CardContent className="p-12">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Nenhum lançamento recorrente
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Comece criando seu primeiro lançamento recorrente para organizar melhor suas finanças
                    </p>
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar primeiro lançamento
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {/* Receitas Section */}
                {(() => {
                  const receitas = recurringTransactions.filter(t => t.type === 'receita');
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {receitas.map((transaction, index) => (
                          <div 
                            key={transaction.id}
                            className="animate-fade-in"
                            style={{ animationDelay: `${index * 100}ms` }}
                          >
                            <RecurringTransactionCard
                              transaction={transaction}
                              onEdit={() => setEditingTransaction(transaction.id)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Despesas Section */}
                {(() => {
                  const despesas = recurringTransactions.filter(t => t.type === 'despesa');
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {despesas.map((transaction, index) => (
                          <div 
                            key={transaction.id}
                            className="animate-fade-in"
                            style={{ animationDelay: `${index * 100}ms` }}
                          >
                            <RecurringTransactionCard
                              transaction={transaction}
                              onEdit={() => setEditingTransaction(transaction.id)}
                            />
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

          {/* Analytics View */}
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Análises Detalhadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Analytics Avançado</h3>
                  <p className="text-muted-foreground">
                    Análises detalhadas de variações, tendências e otimizações em breve
                  </p>
                </div>
              </CardContent>
            </Card>
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