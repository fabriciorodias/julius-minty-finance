
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Shield, Clock, Target } from "lucide-react";
import { EmergencyFundProgress as EmergencyFundData } from "@/hooks/dashboard/useEmergencyFund";

interface EmergencyFundProgressProps {
  data: EmergencyFundData;
  isLoading?: boolean;
}

export function EmergencyFundProgress({ data, isLoading }: EmergencyFundProgressProps) {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (isLoading) {
    return (
      <Card className="mint-card">
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-48"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-2 bg-muted rounded w-full"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-16 bg-muted rounded"></div>
              <div className="h-16 bg-muted rounded"></div>
              <div className="h-16 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.targetAmount === 0) {
    return (
      <Card className="mint-card">
        <CardHeader>
          <CardTitle className="text-mint-text-primary flex items-center">
            <Shield className="h-5 w-5 text-primary mr-2" />
            Reserva de Emergência
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-mint-text-secondary">
            Nenhum plano de reserva de emergência encontrado
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mint-card">
      <CardHeader>
        <CardTitle className="text-mint-text-primary flex items-center">
          <Shield className="h-5 w-5 text-primary mr-2" />
          Reserva de Emergência
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-mint-text-secondary">Progresso</span>
            <span className="text-sm font-medium text-mint-text-primary">
              {data.progressPercentage.toFixed(1)}%
            </span>
          </div>
          <Progress value={data.progressPercentage} className="h-2" />
          <div className="flex justify-between text-sm">
            <span className="text-mint-text-secondary">
              {formatCurrency(data.currentAmount)}
            </span>
            <span className="text-mint-text-secondary">
              {formatCurrency(data.targetAmount)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-mint-surface rounded-lg">
            <Target className="h-5 w-5 text-primary mx-auto mb-1" />
            <div className="text-sm text-mint-text-secondary">Meta Mensal</div>
            <div className="font-semibold text-mint-text-primary">
              {formatCurrency(data.monthlyTarget)}
            </div>
          </div>

          <div className="text-center p-3 bg-mint-surface rounded-lg">
            <Clock className="h-5 w-5 text-chart-1 mx-auto mb-1" />
            <div className="text-sm text-mint-text-secondary">Meses Restantes</div>
            <div className="font-semibold text-mint-text-primary">
              {data.monthsRemaining}
            </div>
          </div>

          <div className="text-center p-3 bg-mint-surface rounded-lg">
            <Shield className="h-5 w-5 text-chart-2 mx-auto mb-1" />
            <div className="text-sm text-mint-text-secondary">Valor Atual</div>
            <div className="font-semibold text-mint-text-primary">
              {formatCurrency(data.currentAmount)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
