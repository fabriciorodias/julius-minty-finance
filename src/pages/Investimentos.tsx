
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useInvestments } from '@/hooks/useInvestments';
import { useInvestmentTransactions } from '@/hooks/useInvestmentTransactions';
import { useInvestmentBalances } from '@/hooks/useInvestmentBalances';
import { useInvestmentsDashboard } from '@/hooks/dashboard/useInvestmentsDashboard';
import { InvestmentModal } from '@/components/investments/InvestmentModal';
import { TransactionModal } from '@/components/investments/TransactionModal';
import { BalanceUpdateModal } from '@/components/investments/BalanceUpdateModal';
import { InvestmentPortfolioChart } from '@/components/investments/InvestmentPortfolioChart';

const Investimentos = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<any>(null);

  const { 
    investments, 
    isLoading: investmentsLoading, 
    createInvestment, 
    isCreating 
  } = useInvestments();
  
  const { createTransaction, isCreating: isCreatingTransaction } = useInvestmentTransactions();
  const { upsertBalance, isUpdating: isUpdatingBalance } = useInvestmentBalances();
  
  const { 
    data: dashboardData, 
    isLoading: dashboardLoading 
  } = useInvestmentsDashboard(selectedMonth);

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

  if (investmentsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-mint-text-primary">Investimentos</h1>
            <p className="text-mint-text-secondary mt-1 font-normal">
              Gerencie sua carteira de investimentos
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="mint-card">
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
          <h1 className="text-3xl font-bold text-mint-text-primary">Investimentos</h1>
          <p className="text-mint-text-secondary mt-1 font-normal">
            Gerencie sua carteira de investimentos
          </p>
        </div>
        <Button onClick={() => setShowInvestmentModal(true)}>
          <span className="material-icons text-sm mr-2">add</span>
          Adicionar Investimento
        </Button>
      </div>

      {/* Dashboard KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="mint-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-mint-text-secondary">
              Patrimônio Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-mint-text-primary">
              {dashboardLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                formatCurrency(dashboardData?.totalPortfolio || 0)
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mint-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-mint-text-secondary">
              Rendimento Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-mint-primary">
              {dashboardLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                formatCurrency(dashboardData?.monthlyReturn || 0)
              )}
            </div>
            <p className="text-sm text-mint-text-secondary mt-1">
              {dashboardLoading ? (
                <Skeleton className="h-4 w-16" />
              ) : (
                `${dashboardData?.returnPercentage.toFixed(2) || '0.00'}%`
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="mint-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-mint-text-secondary">
              Independência Financeira
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-mint-accent">
              {dashboardLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                `${dashboardData?.financialIndependenceRatio.toFixed(1) || '0.0'}%`
              )}
            </div>
            <p className="text-xs text-mint-text-secondary mt-1">
              Do custo de vida mensal
            </p>
          </CardContent>
        </Card>

        <Card className="mint-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-mint-text-secondary">
              Total de Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-mint-text-primary">
              {investments.length}
            </div>
            <p className="text-sm text-mint-text-secondary mt-1">
              Investimentos ativos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Charts */}
      {!dashboardLoading && dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="mint-card">
            <CardContent className="pt-6">
              <InvestmentPortfolioChart 
                data={dashboardData.portfolioComposition}
                title="Composição da Carteira"
              />
            </CardContent>
          </Card>

          <Card className="mint-card">
            <CardContent className="pt-6">
              <InvestmentPortfolioChart 
                data={dashboardData.institutionAllocation}
                title="Alocação por Instituição"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Investments Table */}
      <Card className="mint-card">
        <CardHeader>
          <CardTitle className="text-mint-text-primary font-bold">
            Meus Investimentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {investments.length === 0 ? (
            <div className="text-center py-8">
              <span className="material-icons text-6xl text-mint-text-secondary mb-4 block">
                trending_up
              </span>
              <h3 className="text-lg font-medium text-mint-text-primary mb-2">
                Nenhum investimento cadastrado
              </h3>
              <p className="text-mint-text-secondary mb-4">
                Comece adicionando seu primeiro investimento para acompanhar sua carteira.
              </p>
              <Button onClick={() => setShowInvestmentModal(true)}>
                <span className="material-icons text-sm mr-2">add</span>
                Adicionar Primeiro Investimento
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Instituição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investments.map((investment) => (
                  <TableRow key={investment.id}>
                    <TableCell className="font-medium">
                      {investment.name}
                      {investment.issuer && (
                        <div className="text-sm text-mint-text-secondary">
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenTransactionModal(investment)}
                        >
                          <span className="material-icons text-sm mr-1">swap_horiz</span>
                          Movimentar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenBalanceModal(investment)}
                        >
                          <span className="material-icons text-sm mr-1">account_balance</span>
                          Atualizar Saldo
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
};

export default Investimentos;
