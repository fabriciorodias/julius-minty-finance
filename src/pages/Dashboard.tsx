
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MonthSelector } from "@/components/planning/MonthSelector";
import { BalanceSummary } from "@/components/dashboards/BalanceSummary";
import { AnnualIncomeExpenseChart } from "@/components/dashboards/AnnualIncomeExpenseChart";
import { PlannedVsActualChart } from "@/components/dashboards/PlannedVsActualChart";
import { ExpenseDistributionPie } from "@/components/dashboards/ExpenseDistributionPie";
import { InvestmentsSummary } from "@/components/dashboards/InvestmentsSummary";
import { PortfolioCompositionChart } from "@/components/dashboards/PortfolioCompositionChart";
import { EmergencyFundProgress } from "@/components/dashboards/EmergencyFundProgress";
import { useMonthlyBalance, useAnnualData } from "@/hooks/dashboard/useMonthlyBalance";
import { usePlannedVsActual } from "@/hooks/dashboard/usePlannedVsActual";
import { useExpenseDistribution } from "@/hooks/dashboard/useExpenseDistribution";
import { usePlansCommitment, usePendingPlans, useSavingsAccumulated } from "@/hooks/dashboard/usePlansDashboard";
import { useInvestmentsDashboard } from "@/hooks/dashboard/useInvestmentsDashboard";
import { useEmergencyFund } from "@/hooks/dashboard/useEmergencyFund";
import { TrendingUp, Target, PiggyBank } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Dashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`;
  });

  const year = parseInt(selectedMonth.slice(0, 4), 10);
  const selectedMonthDate = new Date(selectedMonth);

  // Monthly Balance hooks
  const { data: monthlyBalance, isLoading: isBalanceLoading } = useMonthlyBalance(selectedMonth);
  const { data: annualData, isLoading: isAnnualLoading } = useAnnualData(year);
  const { data: plannedVsActual, isLoading: isPlannedLoading } = usePlannedVsActual(selectedMonth);
  const { data: expenseDistribution, isLoading: isDistributionLoading } = useExpenseDistribution(selectedMonth);

  // Plans hooks
  const { data: plansCommitment, isLoading: isCommitmentLoading } = usePlansCommitment(selectedMonth);
  const { data: pendingPlans, isLoading: isPendingLoading } = usePendingPlans(selectedMonth);
  const { data: savingsAccumulated, isLoading: isSavingsLoading } = useSavingsAccumulated();
  const { data: emergencyFund, isLoading: isEmergencyLoading } = useEmergencyFund();

  // Investments hooks
  const { data: investmentsDashboard, isLoading: isInvestmentsLoading } = useInvestmentsDashboard(selectedMonthDate);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd 'de' MMMM", { locale: ptBR });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-mint-text-primary">Dashboards</h1>
          <p className="text-mint-text-secondary mt-1 font-normal">
            Visão panorâmica das suas finanças
          </p>
        </div>
        
        <MonthSelector 
          selectedMonth={selectedMonth} 
          onMonthChange={setSelectedMonth} 
        />
      </div>

      <Tabs defaultValue="balance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="balance" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Balanço Mensal
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Planos e Metas
          </TabsTrigger>
          <TabsTrigger value="investments" className="flex items-center gap-2">
            <PiggyBank className="h-4 w-4" />
            Investimentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="balance" className="space-y-6">
          <BalanceSummary
            totalIncome={monthlyBalance?.totalIncome || 0}
            totalExpenses={monthlyBalance?.totalExpenses || 0}
            balance={monthlyBalance?.balance || 0}
            isLoading={isBalanceLoading}
          />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AnnualIncomeExpenseChart 
              data={annualData || []} 
              isLoading={isAnnualLoading}
            />
            
            <PlannedVsActualChart 
              data={plannedVsActual || []} 
              isLoading={isPlannedLoading}
            />
          </div>

          <ExpenseDistributionPie 
            data={expenseDistribution || []} 
            isLoading={isDistributionLoading}
          />
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="mint-card mint-hover-lift border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-mint-text-secondary flex items-center">
                  <Target className="h-4 w-4 text-primary mr-2" />
                  Compromisso Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isCommitmentLoading ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-muted rounded w-32 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-40"></div>
                  </div>
                ) : (
                  <div>
                    <div className="text-2xl font-bold text-primary mb-1">
                      {plansCommitment?.commitmentPercentage.toFixed(1)}%
                    </div>
                    <p className="text-sm text-mint-text-secondary">
                      {formatCurrency(plansCommitment?.settledAmount || 0)} de{' '}
                      {formatCurrency(plansCommitment?.plannedAmount || 0)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mint-card mint-hover-lift">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-mint-text-secondary">
                  Pendências do Mês
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isPendingLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </div>
                ) : pendingPlans && pendingPlans.length > 0 ? (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {pendingPlans.map((plan, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-mint-text-primary font-medium">{plan.planName}</span>
                        <span className="text-mint-text-secondary">
                          {formatCurrency(plan.dueAmount)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-mint-text-secondary">
                    Nenhuma pendência para este mês
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <EmergencyFundProgress 
            data={emergencyFund || { targetAmount: 0, currentAmount: 0, progressPercentage: 0, monthlyTarget: 0, monthsRemaining: 0 }}
            isLoading={isEmergencyLoading}
          />

          <Card className="mint-card">
            <CardHeader>
              <CardTitle className="text-mint-text-primary">Montante Acumulado (Poupanças)</CardTitle>
            </CardHeader>
            <CardContent>
              {isSavingsLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : savingsAccumulated && savingsAccumulated.length > 0 ? (
                <div className="space-y-4">
                  {savingsAccumulated.map((savings, index) => (
                    <div key={index} className="flex justify-between items-center p-4 bg-mint-surface rounded-lg">
                      <span className="font-medium text-mint-text-primary">{savings.planName}</span>
                      <span className="text-xl font-bold text-primary">
                        {formatCurrency(savings.accumulatedAmount)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-mint-text-secondary">
                  Nenhum plano de poupança com saldo acumulado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investments" className="space-y-6">
          <p className="text-sm text-mint-text-secondary mb-4">
            Dados referentes ao mês de {format(selectedMonthDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </p>

          <InvestmentsSummary
            totalPortfolio={investmentsDashboard?.totalPortfolio || 0}
            monthlyReturn={investmentsDashboard?.monthlyReturn || 0}
            returnPercentage={investmentsDashboard?.returnPercentage || 0}
            financialIndependenceRatio={investmentsDashboard?.financialIndependenceRatio || 0}
            isLoading={isInvestmentsLoading}
          />

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <PortfolioCompositionChart 
              data={investmentsDashboard?.portfolioComposition || []} 
              isLoading={isInvestmentsLoading}
            />

            <Card className="mint-card">
              <CardHeader>
                <CardTitle className="text-mint-text-primary">Alocação por Instituição</CardTitle>
              </CardHeader>
              <CardContent>
                {isInvestmentsLoading ? (
                  <div className="h-80 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : investmentsDashboard?.institutionAllocation && investmentsDashboard.institutionAllocation.length > 0 ? (
                  <div className="space-y-4">
                    {investmentsDashboard.institutionAllocation.map((allocation, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-mint-surface rounded-lg">
                        <span className="font-medium text-mint-text-primary">{allocation.institution}</span>
                        <div className="text-right">
                          <div className="font-semibold text-mint-text-primary">
                            {formatCurrency(allocation.value)}
                          </div>
                          <div className="text-sm text-mint-text-secondary">
                            {allocation.percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-mint-text-secondary">
                    Nenhum investimento encontrado
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
