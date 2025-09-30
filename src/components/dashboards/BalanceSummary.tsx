import { NotionCard } from "@/components/ui/notion-card";
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <NotionCard key={i} padding="md" className="animate-pulse">
            <Skeleton className="h-4 w-24 mb-4" />
            <Skeleton className="h-8 w-32" />
          </NotionCard>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <NotionCard variant="hoverable" className="transition-notion">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-notion-caption text-notion-gray-600">Total de Receitas</p>
              <p className="text-notion-value tabular-nums text-notion-gray-900">
                {formatCurrency(totalIncome)}
              </p>
            </div>
            <div className="bg-notion-gray-100 rounded-md p-2">
              <TrendingUp className="h-6 w-6 text-notion-success" />
            </div>
          </div>
        </div>
      </NotionCard>

      <NotionCard variant="hoverable" className="transition-notion">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-notion-caption text-notion-gray-600">Total de Despesas</p>
              <p className="text-notion-value tabular-nums text-notion-gray-900">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
            <div className="bg-notion-gray-100 rounded-md p-2">
              <TrendingDown className="h-6 w-6 text-notion-danger" />
            </div>
          </div>
        </div>
      </NotionCard>

      <NotionCard variant="hoverable" className="transition-notion">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-notion-caption text-notion-gray-600">Saldo do Mês</p>
              <p className={`text-notion-value tabular-nums ${balance >= 0 ? 'text-notion-success' : 'text-notion-danger'}`}>
                {formatCurrency(balance)}
              </p>
              {Math.abs(balance) > 0 && (
                <div className={`flex items-center gap-1 text-sm font-medium ${balance >= 0 ? 'text-notion-success' : 'text-notion-danger'}`}>
                  <span>{balance >= 0 ? "↑" : "↓"}</span>
                  <span>{Math.abs(balance).toFixed(1)}%</span>
                </div>
              )}
            </div>
            <div className="bg-notion-gray-100 rounded-md p-2">
              <Wallet className="h-6 w-6 text-notion-gray-700" />
            </div>
          </div>
        </div>
      </NotionCard>
    </div>
  );
}
