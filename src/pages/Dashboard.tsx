import { useState, useMemo } from "react";
import { NotionCard, NotionCardHeader, NotionCardTitle, NotionCardContent } from "@/components/ui/notion-card";
import { NotionButton } from "@/components/ui/notion-button";
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
    <div className="space-y-6">
      {/* Hero Section */}
      <NotionCard variant="hoverable" className="overflow-hidden">
        <NotionCardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-notion-blue" />
                <h1 className="text-notion-h1 text-notion-gray-900">Dashboard Financeiro</h1>
              </div>
              <p className="text-notion-caption text-notion-gray-600">
                Visão geral completa das suas finanças
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-notion-caption text-notion-gray-600">Patrimônio Líquido</p>
              <p className={`text-notion-value tabular-nums ${netWorth >= 0 ? 'text-notion-success' : 'text-notion-danger'}`}>
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(netWorth)}
              </p>
            </div>
          </div>
        </NotionCardContent>
      </NotionCard>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <NotionCard variant="hoverable" className="transition-notion">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-notion-caption text-notion-gray-600">Total em Ativos</p>
                <p className="text-notion-value tabular-nums text-notion-gray-900">
                  {new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  }).format(assetTotal)}
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
              <div className="space-y-2">
                <p className="text-notion-caption text-notion-gray-600">Total em Passivos</p>
                <p className="text-notion-value tabular-nums text-notion-gray-900">
                  {new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  }).format(liabilityTotal)}
                </p>
              </div>
              <div className="bg-notion-gray-100 rounded-md p-2">
                <CreditCard className="h-6 w-6 text-notion-gray-700" />
              </div>
            </div>
          </div>
        </NotionCard>
        
        <NotionCard variant="hoverable" className="transition-notion">
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <p className="text-notion-caption text-notion-gray-600">Saldo do Mês</p>
                <p className={`text-notion-value tabular-nums ${
                  (monthlyBalance?.balance || 0) >= 0 ? 'text-notion-success' : 'text-notion-danger'
                }`}>
                  {new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  }).format(monthlyBalance?.balance || 0)}
                </p>
              </div>
              <div className="bg-notion-gray-100 rounded-md p-2">
                <TrendingUp className="h-6 w-6 text-notion-gray-700" />
              </div>
            </div>
          </div>
        </NotionCard>
      </div>

      {/* Balance Summary */}
      <div>
        <h2 className="text-notion-h2 text-notion-gray-900 mb-4">Resumo do Mês</h2>
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
          <h2 className="text-notion-h2 text-notion-gray-900 mb-4">Investimentos</h2>
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
          <h2 className="text-notion-h2 text-notion-gray-900 mb-4">Projeção de Fluxo de Caixa</h2>
          <CashFlowHero selectedAccountIds={assetAccountIds} />
        </div>
      )}

      {/* Quick Actions */}
      <NotionCard>
        <NotionCardHeader>
          <NotionCardTitle>Ações Rápidas</NotionCardTitle>
        </NotionCardHeader>
        <NotionCardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <NotionButton variant="outline" className="h-20 flex-col gap-2">
              <PlusCircle className="h-6 w-6" />
              <span>Nova Transação</span>
            </NotionButton>
            <NotionButton variant="outline" className="h-20 flex-col gap-2">
              <Wallet className="h-6 w-6" />
              <span>Ver Contas</span>
            </NotionButton>
            <NotionButton variant="outline" className="h-20 flex-col gap-2">
              <TrendingUp className="h-6 w-6" />
              <span>Investimentos</span>
            </NotionButton>
            <NotionButton variant="outline" className="h-20 flex-col gap-2">
              <ArrowUpRight className="h-6 w-6" />
              <span>Relatórios</span>
            </NotionButton>
          </div>
        </NotionCardContent>
      </NotionCard>
    </div>
  );
};

export default Dashboard;
