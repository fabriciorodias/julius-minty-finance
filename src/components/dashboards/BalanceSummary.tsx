
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="mint-card mint-hover-lift border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-mint-text-secondary flex items-center">
            <TrendingUp className="h-4 w-4 text-primary mr-2" />
            Total de Receitas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {formatCurrency(totalIncome)}
          </div>
        </CardContent>
      </Card>

      <Card className="mint-card mint-hover-lift border-l-4 border-l-destructive">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-mint-text-secondary flex items-center">
            <TrendingDown className="h-4 w-4 text-destructive mr-2" />
            Total de Despesas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {formatCurrency(totalExpenses)}
          </div>
        </CardContent>
      </Card>

      <Card className={`mint-card mint-hover-lift border-l-4 ${balance >= 0 ? 'border-l-primary' : 'border-l-destructive'}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-mint-text-secondary flex items-center">
            <Wallet className="h-4 w-4 mr-2" />
            Saldo do Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${balance >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {formatCurrency(balance)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
