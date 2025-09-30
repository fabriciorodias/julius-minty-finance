import { NotionCard, NotionCardHeader, NotionCardTitle, NotionCardContent } from "@/components/ui/notion-card";
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
      <NotionCard variant="default" padding="md">
        <NotionCardHeader>
          <div className="animate-pulse">
            <Skeleton className="h-6 w-48" />
          </div>
        </NotionCardHeader>
        <NotionCardContent>
          <div className="animate-pulse space-y-4">
            <Skeleton className="h-2 w-full" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </NotionCardContent>
      </NotionCard>
    );
  }

  if (data.targetAmount === 0) {
    return (
      <NotionCard variant="muted" padding="md">
        <NotionCardHeader>
          <NotionCardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-notion-blue" />
            Reserva de Emergência
          </NotionCardTitle>
        </NotionCardHeader>
        <NotionCardContent>
          <div className="text-center py-8 text-notion-gray-500">
            Nenhum plano de reserva de emergência encontrado
          </div>
        </NotionCardContent>
      </NotionCard>
    );
  }

  const progressColor = data.progressPercentage >= 100 ? 'bg-notion-success' : 
                        data.progressPercentage >= 50 ? 'bg-notion-blue' : 'bg-notion-warning';

  return (
    <NotionCard variant="hoverable" padding="md">
      <NotionCardHeader>
        <NotionCardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-notion-blue" />
          Reserva de Emergência
        </NotionCardTitle>
      </NotionCardHeader>
      <NotionCardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-notion-caption text-notion-gray-600">
            <span>Progresso</span>
            <span>{data.progressPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full h-3 bg-notion-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${progressColor} rounded-full transition-notion`}
              style={{ width: `${Math.min(data.progressPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NotionCard variant="muted" padding="sm">
            <div className="text-center p-2">
              <Target className="h-5 w-5 text-notion-blue mx-auto mb-1" />
              <div className="text-notion-caption text-notion-gray-600">Meta Mensal</div>
              <div className="font-semibold text-notion-body text-notion-gray-900">
                {formatCurrency(data.monthlyTarget)}
              </div>
            </div>
          </NotionCard>

          <NotionCard variant="muted" padding="sm">
            <div className="text-center p-2">
              <Clock className="h-5 w-5 text-notion-gray-700 mx-auto mb-1" />
              <div className="text-notion-caption text-notion-gray-600">Meses Restantes</div>
              <div className="font-semibold text-notion-body text-notion-gray-900">
                {data.monthsRemaining}
              </div>
            </div>
          </NotionCard>

          <NotionCard variant="muted" padding="sm">
            <div className="text-center p-2">
              <Shield className="h-5 w-5 text-notion-success mx-auto mb-1" />
              <div className="text-notion-caption text-notion-gray-600">Valor Atual</div>
              <div className="font-semibold text-notion-body text-notion-gray-900">
                {formatCurrency(data.currentAmount)}
              </div>
            </div>
          </NotionCard>
        </div>
      </NotionCardContent>
    </NotionCard>
  );
}
