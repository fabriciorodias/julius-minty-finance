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
import { Plus, Calendar, BarChart3, Settings } from "lucide-react";
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
              <h1 className="text-3xl font-bold text-foreground">Contas Recorrentes</h1>
              <p className="text-muted-foreground mt-1">Gerencie suas contas fixas mensais</p>
            </div>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-destructive">Erro ao carregar contas recorrentes</p>
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
          <div>
            <h1 className="text-3xl font-bold text-foreground">Contas Recorrentes</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie suas contas fixas mensais de forma inteligente
            </p>
          </div>
          
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Conta Recorrente
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Contas Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {isLoading ? <Skeleton className="h-8 w-12" /> : activeTransactions.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Vencendo em 7 dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {isLoading ? <Skeleton className="h-8 w-12" /> : upcomingTransactions.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Em Atraso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {isLoading ? <Skeleton className="h-8 w-12" /> : overdueTransactions.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Valor Médio Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  `R$ ${activeTransactions
                    .reduce((sum, t) => sum + (t.expected_amount || 0), 0)
                    .toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
                )}
              </div>
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
          <TabsContent value="cards" className="space-y-4">
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
                      Nenhuma conta recorrente
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Comece criando sua primeira conta recorrente para organizar melhor suas finanças
                    </p>
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar primeira conta
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recurringTransactions.map((transaction) => (
                  <RecurringTransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    onEdit={() => setEditingTransaction(transaction.id)}
                  />
                ))}
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