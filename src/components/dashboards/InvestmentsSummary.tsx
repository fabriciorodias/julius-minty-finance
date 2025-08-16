
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, PiggyBank, Target } from "lucide-react";

interface InvestmentsSummaryProps {
  totalPortfolio: number;
  monthlyReturn: number;
  returnPercentage: number;
  financialIndependenceRatio: number;
  isLoading?: boolean;
}

export function InvestmentsSummary({ 
  totalPortfolio, 
  monthlyReturn, 
  returnPercentage, 
  financialIndependenceRatio, 
  isLoading 
}: InvestmentsSummaryProps) {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-4 bg-muted rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <Card className="mint-card mint-hover-lift border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-mint-text-secondary flex items-center">
            <PiggyBank className="h-4 w-4 text-primary mr-2" />
            Patrimônio Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {formatCurrency(totalPortfolio)}
          </div>
        </CardContent>
      </Card>

      <Card className={`mint-card mint-hover-lift border-l-4 ${monthlyReturn >= 0 ? 'border-l-primary' : 'border-l-destructive'}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-mint-text-secondary flex items-center">
            {monthlyReturn >= 0 ? 
              <TrendingUp className="h-4 w-4 text-primary mr-2" /> : 
              <TrendingDown className="h-4 w-4 text-destructive mr-2" />
            }
            Retorno Mensal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${monthlyReturn >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {formatCurrency(monthlyReturn)}
          </div>
        </CardContent>
      </Card>

      <Card className={`mint-card mint-hover-lift border-l-4 ${returnPercentage >= 0 ? 'border-l-primary' : 'border-l-destructive'}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-mint-text-secondary flex items-center">
            {returnPercentage >= 0 ? 
              <TrendingUp className="h-4 w-4 text-primary mr-2" /> : 
              <TrendingDown className="h-4 w-4 text-destructive mr-2" />
            }
            Retorno %
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${returnPercentage >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {returnPercentage.toFixed(2)}%
          </div>
        </CardContent>
      </Card>

      <Card className="mint-card mint-hover-lift border-l-4 border-l-chart-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-mint-text-secondary flex items-center">
            <Target className="h-4 w-4 text-chart-1 mr-2" />
            Independência Financeira
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-chart-1">
            {financialIndependenceRatio.toFixed(1)}%
          </div>
          <p className="text-xs text-mint-text-secondary mt-1">
            do custo mensal
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
