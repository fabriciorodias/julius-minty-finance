import { MetricCard } from "@/components/ui/metric-card";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface BalanceSummaryProps {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  isLoading?: boolean;
}

export function BalanceSummary({ totalIncome, totalExpenses, balance, isLoading }: BalanceSummaryProps) {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
        {[1, 2, 3].map((i) => (
          <div key={i} className="liquid-glass-subtle rounded-2xl p-6 animate-pulse">
            <Skeleton className="h-4 w-24 mb-4" />
            <Skeleton className="h-8 w-32" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
      <MetricCard
        label="Total de Receitas"
        value={formatCurrency(totalIncome)}
        icon={TrendingUp}
        glass
        className="hover-scale liquid-glass-success"
      />

      <MetricCard
        label="Total de Despesas"
        value={formatCurrency(totalExpenses)}
        icon={TrendingDown}
        glass
        className="hover-scale liquid-glass-danger"
      />

      <MetricCard
        label="Saldo do Mês"
        value={formatCurrency(balance)}
        icon={Wallet}
        trend={
          Math.abs(balance) > 0 
            ? {
                value: Math.abs(balance),
                isPositive: balance >= 0
              }
            : undefined
        }
        glass
        className={`hover-scale ${balance >= 0 ? 'liquid-glass-success' : 'liquid-glass-danger'}`}
      />
    </div>
  );
}
