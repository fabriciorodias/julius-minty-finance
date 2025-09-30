import { useState, useMemo } from "react";
import { OriginCard, OriginCardHeader, OriginCardTitle, OriginCardContent } from "@/components/ui/origin-card";
import { MetricCard } from "@/components/ui/metric-card";
import { Button } from "@/components/ui/button";
import { BalanceSummary } from "@/components/dashboards/BalanceSummary";
import { ExpenseDistributionPie } from "@/components/dashboards/ExpenseDistributionPie";
import { CashFlowHero } from "@/components/dashboards/CashFlowHero";
import { InvestmentsSummary } from "@/components/dashboards/InvestmentsSummary";
import { EmergencyFundProgress } from "@/components/dashboards/EmergencyFundProgress";
import { useAccounts } from "@/hooks/useAccounts";
import { useAccountBalances } from "@/hooks/useAccountBalances";
import { useMonthlyBalance } from "@/hooks/dashboard/useMonthlyBalance";
import { useExpenseDistribution } from "@/hooks/dashboard/useExpenseDistribution";
import { useInvestmentsDashboard } from "@/hooks/dashboard/useInvestmentsDashboard";
import { useEmergencyFund } from "@/hooks/dashboard/useEmergencyFund";
import { 
  TrendingUp, 
  Wallet, 
  CreditCard,
  PlusCircle,
  ArrowUpRight,
  Sparkles
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";

const Dashboard = () => {
  const { accounts } = useAccounts();
  const { balances: accountBalances } = useAccountBalances();
  
  // Get current month for default filter
  const currentDate = new Date();
  const monthStart = format(startOfMonth(currentDate), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(currentDate), 'yyyy-MM-dd');

  // Get active asset accounts for projections
  const assetAccountIds = useMemo(() => 
    accounts.filter(acc => acc.kind === 'asset' && acc.is_active).map(acc => acc.id),
    [accounts]
  );

  // Fetch dashboard data
  const { data: monthlyBalance, isLoading: balanceLoading } = useMonthlyBalance(monthStart);
  const { data: expenseData, isLoading: expenseLoading } = useExpenseDistribution(monthStart);
  const { data: investmentsData, isLoading: investmentsLoading } = useInvestmentsDashboard(currentDate);
  const { data: emergencyFundData, isLoading: emergencyLoading } = useEmergencyFund();

  // Calculate total balance from account balances
  const totalBalance = useMemo(() => 
    accountBalances.reduce((sum, balance) => sum + (balance.current_balance || 0), 0),
    [accountBalances]
  );

  // Calculate asset and liability totals
  const assetTotal = useMemo(() => {
    const assetAccounts = accounts.filter(acc => acc.kind === 'asset' && acc.is_active);
    return assetAccounts.reduce((sum, acc) => {
      const balance = accountBalances.find(b => b.account_id === acc.id);
      return sum + (balance?.current_balance || 0);
    }, 0);
  }, [accounts, accountBalances]);

  const liabilityTotal = useMemo(() => {
    const liabilityAccounts = accounts.filter(acc => acc.kind === 'liability' && acc.is_active);
    return liabilityAccounts.reduce((sum, acc) => {
      const balance = accountBalances.find(b => b.account_id === acc.id);
      return sum + Math.abs(balance?.current_balance || 0);
    }, 0);
  }, [accounts, accountBalances]);

  const netWorth = assetTotal - liabilityTotal;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Section */}
      <OriginCard glass className="overflow-hidden">
        <OriginCardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold text-foreground">Dashboard Financeiro</h1>
              </div>
              <p className="text-muted-foreground text-lg">
                Visão geral completa das suas finanças
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm text-muted-foreground">Patrimônio Líquido</p>
              <p className={`text-3xl font-bold ${netWorth >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(netWorth)}
              </p>
            </div>
          </div>
        </OriginCardContent>
      </OriginCard>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          label="Total em Ativos"
          value={new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
          }).format(assetTotal)}
          icon={Wallet}
          glass
          className="hover-scale"
        />
        
        <MetricCard
          label="Total em Passivos"
          value={new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
          }).format(liabilityTotal)}
          icon={CreditCard}
          glass
          className="hover-scale"
        />
        
        <MetricCard
          label="Saldo do Mês"
          value={new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
          }).format(monthlyBalance?.balance || 0)}
          icon={TrendingUp}
          trend={
            monthlyBalance?.balance && Math.abs(monthlyBalance.balance) > 0
              ? {
                  value: Math.abs(monthlyBalance.balance),
                  isPositive: monthlyBalance.balance >= 0
                }
              : undefined
          }
          glass
          className="hover-scale"
        />
      </div>

      {/* Balance Summary */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Resumo do Mês</h2>
        <BalanceSummary
          totalIncome={monthlyBalance?.totalIncome || 0}
          totalExpenses={monthlyBalance?.totalExpenses || 0}
          balance={monthlyBalance?.balance || 0}
          isLoading={balanceLoading}
        />
      </div>

      {/* Expense Distribution */}
      <ExpenseDistributionPie 
        data={expenseData || []} 
        isLoading={expenseLoading}
      />

      {/* Investments Summary */}
      {investmentsData && (
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Investimentos</h2>
          <InvestmentsSummary
            totalPortfolio={investmentsData.totalPortfolio}
            monthlyReturn={investmentsData.monthlyReturn}
            returnPercentage={investmentsData.returnPercentage}
            financialIndependenceRatio={investmentsData.financialIndependenceRatio}
            isLoading={investmentsLoading}
          />
        </div>
      )}

      {/* Emergency Fund */}
      {emergencyFundData && (
        <EmergencyFundProgress 
          data={emergencyFundData}
          isLoading={emergencyLoading}
        />
      )}

      {/* Cash Flow Projection */}
      {assetAccountIds.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Projeção de Fluxo de Caixa</h2>
          <CashFlowHero selectedAccountIds={assetAccountIds} />
        </div>
      )}

      {/* Quick Actions */}
      <OriginCard glass className="hover-scale">
        <OriginCardHeader>
          <OriginCardTitle>Ações Rápidas</OriginCardTitle>
        </OriginCardHeader>
        <OriginCardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <PlusCircle className="h-6 w-6" />
              <span>Nova Transação</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Wallet className="h-6 w-6" />
              <span>Ver Contas</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <TrendingUp className="h-6 w-6" />
              <span>Investimentos</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <ArrowUpRight className="h-6 w-6" />
              <span>Relatórios</span>
            </Button>
          </div>
        </OriginCardContent>
      </OriginCard>
    </div>
  );
};

export default Dashboard;
