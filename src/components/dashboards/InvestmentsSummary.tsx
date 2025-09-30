import { MetricCard } from "@/components/ui/metric-card";
import { TrendingUp, TrendingDown, PiggyBank, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 animate-fade-in">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="liquid-glass-subtle rounded-2xl p-6 animate-pulse">
            <Skeleton className="h-4 w-24 mb-4" />
            <Skeleton className="h-8 w-32" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 animate-fade-in">
      <MetricCard
        label="Patrimônio Total"
        value={formatCurrency(totalPortfolio)}
        icon={PiggyBank}
        textured="blue-gray"
        className="hover-scale"
      />

      <MetricCard
        label="Retorno Mensal"
        value={formatCurrency(monthlyReturn)}
        icon={monthlyReturn >= 0 ? TrendingUp : TrendingDown}
        trend={
          Math.abs(monthlyReturn) > 0
            ? {
                value: Math.abs(monthlyReturn),
                isPositive: monthlyReturn >= 0
              }
            : undefined
        }
        textured="earth"
        className="hover-scale"
      />

      <MetricCard
        label="Retorno %"
        value={`${returnPercentage.toFixed(2)}%`}
        icon={returnPercentage >= 0 ? TrendingUp : TrendingDown}
        trend={
          Math.abs(returnPercentage) > 0
            ? {
                value: Math.abs(returnPercentage),
                isPositive: returnPercentage >= 0
              }
            : undefined
        }
        textured="ocean"
        className="hover-scale"
      />

      <MetricCard
        label="Independência Financeira"
        value={`${financialIndependenceRatio.toFixed(1)}%`}
        description="do custo mensal"
        icon={Target}
        textured="mint"
        className="hover-scale"
      />
    </div>
  );
}
