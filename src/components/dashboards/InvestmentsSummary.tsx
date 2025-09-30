import { NotionCard } from "@/components/ui/notion-card";
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <NotionCard key={i} padding="md" className="animate-pulse">
            <Skeleton className="h-4 w-24 mb-4" />
            <Skeleton className="h-8 w-32" />
          </NotionCard>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <NotionCard variant="hoverable" className="transition-notion">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-notion-caption text-notion-gray-600">Patrimônio Total</p>
              <p className="text-notion-value tabular-nums text-notion-gray-900">
                {formatCurrency(totalPortfolio)}
              </p>
            </div>
            <div className="bg-notion-gray-100 rounded-md p-2">
              <PiggyBank className="h-6 w-6 text-notion-gray-700" />
            </div>
          </div>
        </div>
      </NotionCard>

      <NotionCard variant="hoverable" className="transition-notion">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-notion-caption text-notion-gray-600">Retorno Mensal</p>
              <p className={`text-notion-value tabular-nums ${monthlyReturn >= 0 ? 'text-notion-success' : 'text-notion-danger'}`}>
                {formatCurrency(monthlyReturn)}
              </p>
              {Math.abs(monthlyReturn) > 0 && (
                <div className={`flex items-center gap-1 text-sm font-medium ${monthlyReturn >= 0 ? 'text-notion-success' : 'text-notion-danger'}`}>
                  <span>{monthlyReturn >= 0 ? "↑" : "↓"}</span>
                  <span>{Math.abs(monthlyReturn).toFixed(1)}%</span>
                </div>
              )}
            </div>
            <div className="bg-notion-gray-100 rounded-md p-2">
              {monthlyReturn >= 0 ? (
                <TrendingUp className="h-6 w-6 text-notion-success" />
              ) : (
                <TrendingDown className="h-6 w-6 text-notion-danger" />
              )}
            </div>
          </div>
        </div>
      </NotionCard>

      <NotionCard variant="hoverable" className="transition-notion">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-notion-caption text-notion-gray-600">Retorno %</p>
              <p className={`text-notion-value tabular-nums ${returnPercentage >= 0 ? 'text-notion-success' : 'text-notion-danger'}`}>
                {returnPercentage.toFixed(2)}%
              </p>
              {Math.abs(returnPercentage) > 0 && (
                <div className={`flex items-center gap-1 text-sm font-medium ${returnPercentage >= 0 ? 'text-notion-success' : 'text-notion-danger'}`}>
                  <span>{returnPercentage >= 0 ? "↑" : "↓"}</span>
                  <span>{Math.abs(returnPercentage).toFixed(1)}%</span>
                </div>
              )}
            </div>
            <div className="bg-notion-gray-100 rounded-md p-2">
              {returnPercentage >= 0 ? (
                <TrendingUp className="h-6 w-6 text-notion-success" />
              ) : (
                <TrendingDown className="h-6 w-6 text-notion-danger" />
              )}
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
                {financialIndependenceRatio.toFixed(1)}%
              </p>
              <p className="text-sm text-notion-gray-600">do custo mensal</p>
            </div>
            <div className="bg-notion-gray-100 rounded-md p-2">
              <Target className="h-6 w-6 text-notion-blue" />
            </div>
          </div>
        </div>
      </NotionCard>
    </div>
  );
}
