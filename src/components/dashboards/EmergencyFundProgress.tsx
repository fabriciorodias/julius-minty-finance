import { OriginCard, OriginCardHeader, OriginCardTitle, OriginCardContent } from "@/components/ui/origin-card";
import { OriginProgress } from "@/components/ui/origin-progress";
import { Shield, Clock, Target } from "lucide-react";
import { EmergencyFundProgress as EmergencyFundData } from "@/hooks/dashboard/useEmergencyFund";
import { Skeleton } from "@/components/ui/skeleton";

interface EmergencyFundProgressProps {
  data: EmergencyFundData;
  isLoading?: boolean;
}

export function EmergencyFundProgress({ data, isLoading }: EmergencyFundProgressProps) {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (isLoading) {
    return (
      <OriginCard glass className="hover-scale">
        <OriginCardHeader>
          <div className="animate-pulse">
            <Skeleton className="h-6 w-48" />
          </div>
        </OriginCardHeader>
        <OriginCardContent>
          <div className="animate-pulse space-y-4">
            <Skeleton className="h-2 w-full" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </OriginCardContent>
      </OriginCard>
    );
  }

  if (data.targetAmount === 0) {
    return (
      <OriginCard glass className="hover-scale">
        <OriginCardHeader>
          <OriginCardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Reserva de Emergência
          </OriginCardTitle>
        </OriginCardHeader>
        <OriginCardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhum plano de reserva de emergência encontrado
          </div>
        </OriginCardContent>
      </OriginCard>
    );
  }

  const progressGradient = data.progressPercentage >= 100 ? 'green' : 
                          data.progressPercentage >= 50 ? 'blue' : 'orange';

  return (
    <OriginCard glass className="hover-scale">
      <OriginCardHeader>
        <OriginCardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Reserva de Emergência
        </OriginCardTitle>
      </OriginCardHeader>
      <OriginCardContent className="space-y-6">
        <OriginProgress
          value={data.currentAmount}
          max={data.targetAmount}
          showPercentage
          label="Progresso"
          gradient={progressGradient}
          size="lg"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 liquid-glass-subtle rounded-xl hover-scale origin-transition">
            <Target className="h-5 w-5 text-primary mx-auto mb-1" />
            <div className="text-sm text-mint-text-secondary">Meta Mensal</div>
            <div className="font-semibold text-mint-text-primary">
              {formatCurrency(data.monthlyTarget)}
            </div>
          </div>

          <div className="text-center p-4 liquid-glass-subtle rounded-xl hover-scale origin-transition">
            <Clock className="h-5 w-5 text-chart-1 mx-auto mb-1" />
            <div className="text-sm text-mint-text-secondary">Meses Restantes</div>
            <div className="font-semibold text-mint-text-primary">
              {data.monthsRemaining}
            </div>
          </div>

          <div className="text-center p-4 liquid-glass-subtle rounded-xl hover-scale origin-transition">
            <Shield className="h-5 w-5 text-chart-2 mx-auto mb-1" />
            <div className="text-sm text-mint-text-secondary">Valor Atual</div>
            <div className="font-semibold text-mint-text-primary">
              {formatCurrency(data.currentAmount)}
            </div>
          </div>
        </div>
      </OriginCardContent>
    </OriginCard>
  );
}
