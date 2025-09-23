import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Calendar,
  DollarSign 
} from "lucide-react";
import type { RecurringTransactionWithAnalytics } from "@/hooks/useRecurringTransactions";

interface RecurringTransactionsDashboardProps {
  transactions: RecurringTransactionWithAnalytics[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d', '#ffc658'];

export function RecurringTransactionsDashboard({ 
  transactions 
}: RecurringTransactionsDashboardProps) {
  const dashboardData = useMemo(() => {
    const activeTransactions = transactions.filter(t => t.status === 'active');
    
    // Category distribution
    const categoryDistribution = activeTransactions.reduce((acc, transaction) => {
      const categoryName = transaction.category_name || 'Sem categoria';
      if (!acc[categoryName]) {
        acc[categoryName] = { name: categoryName, value: 0, count: 0 };
      }
      acc[categoryName].value += transaction.expected_amount;
      acc[categoryName].count += 1;
      return acc;
    }, {} as Record<string, { name: string; value: number; count: number }>);

    const categoryChartData = Object.values(categoryDistribution);

    // Monthly timeline
    const monthlyData = activeTransactions.reduce((acc, transaction) => {
      const dueDate = new Date(transaction.next_due_date);
      const monthKey = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, receita: 0, despesa: 0 };
      }
      
      if (transaction.type === 'receita') {
        acc[monthKey].receita += transaction.expected_amount;
      } else {
        acc[monthKey].despesa += transaction.expected_amount;
      }
      
      return acc;
    }, {} as Record<string, { month: string; receita: number; despesa: number }>);

    const timelineData = Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(0, 6); // Next 6 months

    // Statistics
    const totalIncome = activeTransactions
      .filter(t => t.type === 'receita')
      .reduce((sum, t) => sum + t.expected_amount, 0);
    
    const totalExpenses = activeTransactions
      .filter(t => t.type === 'despesa')
      .reduce((sum, t) => sum + t.expected_amount, 0);

    const highVarianceTransactions = activeTransactions.filter(t => t.variance_percentage > 25);
    const upcomingTransactions = activeTransactions.filter(t => t.days_until_due <= 7 && t.days_until_due >= 0);
    const overdueTransactions = activeTransactions.filter(t => t.days_until_due < 0);

    return {
      categoryChartData,
      timelineData,
      totalIncome,
      totalExpenses,
      netCashFlow: totalIncome - totalExpenses,
      highVarianceTransactions,
      upcomingTransactions,
      overdueTransactions,
      activeCount: activeTransactions.length
    };
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum dado disponível</h3>
            <p className="text-muted-foreground">
              Crie algumas contas recorrentes para ver o dashboard
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Receitas Mensais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">
              R$ {dashboardData.totalIncome.toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Despesas Mensais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-red-600">
              R$ {dashboardData.totalExpenses.toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Fluxo Líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold ${
              dashboardData.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              R$ {dashboardData.netCashFlow.toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Alta Variação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-amber-600">
              {dashboardData.highVarianceTransactions.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.categoryChartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData.categoryChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dashboardData.categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={[(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Projeção Próximos Meses</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.timelineData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.timelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tickFormatter={(value) => {
                        const [year, month] = value.split('-');
                        return `${month}/${year.slice(-2)}`;
                      }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `R$ ${value.toLocaleString('pt-BR')}`, 
                        name === 'receita' ? 'Receitas' : 'Despesas'
                      ]}
                      labelFormatter={(label) => {
                        const [year, month] = label.split('-');
                        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                                          'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                        return `${monthNames[parseInt(month) - 1]} ${year}`;
                      }}
                    />
                    <Bar dataKey="receita" fill="hsl(var(--primary))" />
                    <Bar dataKey="despesa" fill="hsl(var(--destructive))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Overdue */}
        {dashboardData.overdueTransactions.length > 0 && (
          <Card className="border-destructive/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Contas em Atraso ({dashboardData.overdueTransactions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {dashboardData.overdueTransactions.slice(0, 3).map((transaction) => (
                <div key={transaction.id} className="text-sm">
                  <div className="font-medium">{transaction.template_name}</div>
                  <div className="text-muted-foreground">
                    {Math.abs(transaction.days_until_due)} dias de atraso
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Upcoming */}
        {dashboardData.upcomingTransactions.length > 0 && (
          <Card className="border-amber-500/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-amber-600 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Próximos Vencimentos ({dashboardData.upcomingTransactions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {dashboardData.upcomingTransactions.slice(0, 3).map((transaction) => (
                <div key={transaction.id} className="text-sm">
                  <div className="font-medium">{transaction.template_name}</div>
                  <div className="text-muted-foreground">
                    {transaction.days_until_due === 0 ? 'Hoje' : `${transaction.days_until_due} dias`}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* High Variance */}
        {dashboardData.highVarianceTransactions.length > 0 && (
          <Card className="border-amber-500/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-amber-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Alta Variação ({dashboardData.highVarianceTransactions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {dashboardData.highVarianceTransactions.slice(0, 3).map((transaction) => (
                <div key={transaction.id} className="text-sm">
                  <div className="font-medium">{transaction.template_name}</div>
                  <div className="text-muted-foreground">
                    {transaction.variance_percentage.toFixed(1)}% de variação
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}