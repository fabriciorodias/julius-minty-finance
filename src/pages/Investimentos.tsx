
import React, { useState, useEffect } from 'react';
import { NotionCard, NotionCardContent } from "@/components/ui/notion-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotionButton } from "@/components/ui/notion-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useInvestments } from '@/hooks/useInvestments';
import { useInvestmentTransactions } from '@/hooks/useInvestmentTransactions';
import { useInvestmentBalances } from '@/hooks/useInvestmentBalances';
import { useInvestmentsDashboard } from '@/hooks/dashboard/useInvestmentsDashboard';
import { useCurrentBalances } from '@/hooks/useCurrentBalances';
import { InvestmentModal } from '@/components/investments/InvestmentModal';
import { TransactionModal } from '@/components/investments/TransactionModal';
import { BalanceUpdateModal } from '@/components/investments/BalanceUpdateModal';
import { InvestmentPortfolioChart } from '@/components/investments/InvestmentPortfolioChart';
import { MonthSelector } from '@/components/planning/MonthSelector';
import { DeleteConfirmationDialog } from '@/components/transactions/DeleteConfirmationDialog';
import { RefreshCw, TrendingUp, TrendingDown, Trash2, Wallet, Percent, Target } from 'lucide-react';

const Investimentos = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Initialize with current month in YYYY-MM-01 format
  const currentDate = new Date();
  const currentMonthString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonthString);
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<any>(null);

  const { 
    investments, 
    isLoading: investmentsLoading, 
    createInvestment, 
    isCreating,
    deleteInvestment,
    isDeleting
  } = useInvestments();
  
  const { createTransaction, isCreating: isCreatingTransaction } = useInvestmentTransactions();
  const { upsertBalance, isUpdating: isUpdatingBalance } = useInvestmentBalances();
  const { data: currentBalances } = useCurrentBalances(selectedMonth);
  
  // Convert selectedMonth string to Date for dashboard hook
  const selectedMonthDate = new Date(selectedMonth);
  
  const { 
    data: dashboardData, 
    isLoading: dashboardLoading 
  } = useInvestmentsDashboard(selectedMonthDate);

  // Real-time updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('investment-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'investment_transactions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['investment-transactions'] });
          queryClient.invalidateQueries({ queryKey: ['investments-dashboard'] });
          queryClient.invalidateQueries({ queryKey: ['current-balances'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'investment_balances',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['investment-balances'] });
          queryClient.invalidateQueries({ queryKey: ['investments-dashboard'] });
          queryClient.invalidateQueries({ queryKey: ['current-balances'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getTypeLabel = (type: string) => {
    const labels = {
      renda_fixa: 'Renda Fixa',
      renda_variavel: 'Renda Variável',
      outro: 'Outros'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      renda_fixa: 'default',
      renda_variavel: 'secondary',
      outro: 'outline'
    };
    return colors[type as keyof typeof colors] || 'outline';
  };

  const handleOpenTransactionModal = (investment: any) => {
    setSelectedInvestment(investment);
    setShowTransactionModal(true);
  };

  const handleOpenBalanceModal = (investment: any) => {
    setSelectedInvestment(investment);
    setShowBalanceModal(true);
  };

  const handleOpenDeleteDialog = (investment: any) => {
    setSelectedInvestment(investment);
    setShowDeleteDialog(true);
  };

  const handleDeleteInvestment = () => {
    if (selectedInvestment) {
      deleteInvestment(selectedInvestment.id);
      setShowDeleteDialog(false);
      setSelectedInvestment(null);
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['investments-dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['current-balances'] });
  };

  const getCurrentBalance = (investmentId: string) => {
    return currentBalances?.find(b => b.investment_id === investmentId);
  };

  const formatSelectedMonth = () => {
    const date = new Date(selectedMonth);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  if (investmentsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-notion-h1 text-notion-gray-900">Investimentos</h1>
            <p className="text-notion-caption text-notion-gray-600 mt-1">
              Gerencie sua carteira de investimentos
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-notion-h1 text-notion-gray-900">Investimentos</h1>
          <p className="text-notion-caption text-notion-gray-600 mt-1">
            Gerencie sua carteira de investimentos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MonthSelector 
            selectedMonth={selectedMonth} 
            onMonthChange={setSelectedMonth} 
          />
          <NotionButton
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={dashboardLoading}
          >
            <RefreshCw className={`h-4 w-4 ${dashboardLoading ? 'animate-spin' : ''}`} />
          </NotionButton>
          <NotionButton onClick={() => setShowInvestmentModal(true)}>
            <span className="material-icons text-sm mr-2">add</span>
            Adicionar Investimento
          </NotionButton>
        </div>
      </div>

      {/* Month indicator */}
      <div className="text-center">
        <p className="text-notion-caption text-notion-gray-600">
          Dados referentes a {formatSelectedMonth()}
        </p>
      </div>

      {/* Dashboard KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <NotionCard variant="hoverable" className="transition-notion">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-notion-caption text-notion-gray-600">Patrimônio Total</p>
                <p className="text-notion-value tabular-nums text-notion-gray-900">
                  {dashboardLoading ? '...' : formatCurrency(dashboardData?.totalPortfolio || 0)}
                </p>
              </div>
              <div className="bg-notion-gray-100 rounded-md p-2">
                <Wallet className="h-6 w-6 text-notion-gray-700" />
              </div>
            </div>
          </div>
        </NotionCard>

        <NotionCard variant="hoverable" className="transition-notion">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <p className="text-notion-caption text-notion-gray-600">Rendimento Mensal</p>
                <p className={`text-notion-value tabular-nums ${
                  (dashboardData?.returnPercentage || 0) >= 0 ? 'text-notion-success' : 'text-notion-danger'
                }`}>
                  {dashboardLoading ? '...' : formatCurrency(dashboardData?.monthlyReturn || 0)}
                </p>
                {!dashboardLoading && (
                  <p className="text-notion-caption text-notion-gray-600">
                    {dashboardData?.returnPercentage.toFixed(2) || '0.00'}%
                  </p>
                )}
              </div>
              <div className="bg-notion-gray-100 rounded-md p-2">
                <TrendingUp className="h-6 w-6 text-notion-gray-700" />
              </div>
            </div>
          </div>
        </NotionCard>

        <NotionCard variant="hoverable" className="transition-notion">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-notion-caption text-notion-gray-600">Independência Financeira</p>
                <p className="text-notion-value tabular-nums text-notion-gray-900">
                  {dashboardLoading ? '...' : `${dashboardData?.financialIndependenceRatio.toFixed(1) || '0.0'}%`}
                </p>
                <p className="text-notion-caption text-notion-gray-600">Do custo de vida mensal</p>
              </div>
              <div className="bg-notion-gray-100 rounded-md p-2">
                <Target className="h-6 w-6 text-notion-gray-700" />
              </div>
            </div>
          </div>
        </NotionCard>

        <NotionCard variant="hoverable" className="transition-notion">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-notion-caption text-notion-gray-600">Total de Ativos</p>
                <p className="text-notion-value tabular-nums text-notion-gray-900">
                  {investments.length}
                </p>
                <p className="text-notion-caption text-notion-gray-600">Investimentos ativos</p>
              </div>
              <div className="bg-notion-gray-100 rounded-md p-2">
                <Percent className="h-6 w-6 text-notion-gray-700" />
              </div>
            </div>
          </div>
        </NotionCard>
      </div>

      {/* Portfolio Charts */}
      {!dashboardLoading && dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NotionCard variant="default">
            <NotionCardContent className="pt-6">
              <InvestmentPortfolioChart 
                data={dashboardData.portfolioComposition}
                title="Composição da Carteira"
              />
            </NotionCardContent>
          </NotionCard>

          <NotionCard variant="default">
            <NotionCardContent className="pt-6">
              <InvestmentPortfolioChart 
                data={dashboardData.institutionAllocation}
                title="Alocação por Instituição"
              />
            </NotionCardContent>
          </NotionCard>
        </div>
      )}

      {/* Investments Table */}
      <NotionCard>
        <CardHeader>
          <CardTitle className="text-notion-h3 text-notion-gray-900">
            Meus Investimentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {investments.length === 0 ? (
            <div className="text-center py-8">
              <div className="bg-notion-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="material-icons text-notion-gray-600 text-2xl">
                  trending_up
                </span>
              </div>
              <h3 className="text-notion-h3 text-notion-gray-900 mb-2">
                Nenhum investimento cadastrado
              </h3>
              <p className="text-notion-body-sm text-notion-gray-600 mb-4">
                Comece adicionando seu primeiro investimento para acompanhar sua carteira.
              </p>
              <NotionButton onClick={() => setShowInvestmentModal(true)}>
                <span className="material-icons text-sm mr-2">add</span>
                Adicionar Primeiro Investimento
              </NotionButton>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-notion-gray-50">
                <TableRow className="border-b border-notion-gray-200">
                  <TableHead className="text-notion-caption font-semibold text-notion-gray-700">Saldo Atual</TableHead>
                  <TableHead className="text-notion-caption font-semibold text-notion-gray-700">Nome</TableHead>
                  <TableHead className="text-notion-caption font-semibold text-notion-gray-700">Tipo</TableHead>
                  <TableHead className="text-notion-caption font-semibold text-notion-gray-700">Instituição</TableHead>
                  <TableHead className="text-notion-caption font-semibold text-notion-gray-700">Status</TableHead>
                  <TableHead className="text-notion-caption font-semibold text-notion-gray-700 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {investments.map((investment) => {
                  const balance = getCurrentBalance(investment.id);
                  return (
                    <TableRow key={investment.id} className="hover:bg-notion-gray-50 transition-notion border-b border-notion-gray-200">
                      <TableCell className="text-notion-body-sm">
                        <div className="flex flex-col">
                          <span className="font-medium text-notion-gray-900">
                            {balance ? formatCurrency(balance.current_balance) : 'N/A'}
                          </span>
                          {balance && balance.percentage_change !== 0 && (
                            <div className={`flex items-center text-xs ${
                              balance.percentage_change > 0 ? 'text-notion-success' : 'text-notion-danger'
                            }`}>
                              {balance.percentage_change > 0 ? (
                                <TrendingUp className="h-3 w-3 mr-1" />
                              ) : (
                                <TrendingDown className="h-3 w-3 mr-1" />
                              )}
                              {balance.percentage_change.toFixed(2)}%
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-notion-body-sm font-medium text-notion-gray-900">
                        {investment.name}
                        {investment.issuer && (
                          <div className="text-notion-caption text-notion-gray-600">
                            {investment.issuer}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTypeColor(investment.type) as any}>
                          {getTypeLabel(investment.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {investment.institution?.name || 'Sem Instituição'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={investment.status === 'ativo' ? 'default' : 'secondary'}>
                          {investment.status === 'ativo' ? 'Ativo' : 'Liquidado'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <NotionButton
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenTransactionModal(investment)}
                          >
                            <span className="material-icons text-sm mr-1">swap_horiz</span>
                            Movimentar
                          </NotionButton>
                          <NotionButton
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenBalanceModal(investment)}
                          >
                            <span className="material-icons text-sm mr-1">account_balance</span>
                            Atualizar Saldo
                          </NotionButton>
                          <NotionButton
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDeleteDialog(investment)}
                            className="text-notion-danger hover:text-notion-danger hover:bg-notion-danger/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </NotionButton>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </NotionCard>

      {/* Modals */}
      <InvestmentModal
        isOpen={showInvestmentModal}
        onClose={() => setShowInvestmentModal(false)}
        onSave={createInvestment}
        isLoading={isCreating}
      />

      {selectedInvestment && (
        <>
          <TransactionModal
            isOpen={showTransactionModal}
            onClose={() => {
              setShowTransactionModal(false);
              setSelectedInvestment(null);
            }}
            onSave={createTransaction}
            isLoading={isCreatingTransaction}
            investmentId={selectedInvestment.id}
            investmentName={selectedInvestment.name}
          />

          <BalanceUpdateModal
            isOpen={showBalanceModal}
            onClose={() => {
              setShowBalanceModal(false);
              setSelectedInvestment(null);
            }}
            onSave={upsertBalance}
            isLoading={isUpdatingBalance}
            investmentId={selectedInvestment.id}
            investmentName={selectedInvestment.name}
          />
        </>
      )}

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedInvestment(null);
        }}
        onConfirm={handleDeleteInvestment}
        title="Excluir Investimento"
        description={`Tem certeza que deseja excluir o investimento "${selectedInvestment?.name}"? Esta ação não pode ser desfeita e também excluirá todas as transações e saldos relacionados.`}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default Investimentos;
