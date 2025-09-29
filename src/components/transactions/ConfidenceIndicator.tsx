import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Brain, AlertTriangle, CheckCircle } from 'lucide-react';

interface ConfidenceIndicatorProps {
  confidence: number;
  className?: string;
}

export function ConfidenceIndicator({ confidence, className }: ConfidenceIndicatorProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-50 text-green-700 border-green-200';
    if (confidence >= 0.6) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'Alta';
    if (confidence >= 0.6) return 'Média';
    return 'Baixa';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle className="h-3 w-3" />;
    if (confidence >= 0.6) return <Brain className="h-3 w-3" />;
    return <AlertTriangle className="h-3 w-3" />;
  };

  const getConfidenceDescription = (confidence: number) => {
    if (confidence >= 0.8) {
      return 'A IA tem alta confiança nesta categorização. Provavelmente está correta.';
    }
    if (confidence >= 0.6) {
      return 'A IA tem confiança moderada nesta categorização. Recomenda-se revisar.';
    }
    return 'A IA tem baixa confiança nesta categorização. Recomenda-se verificar manualmente.';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`text-xs cursor-help flex items-center gap-1 ${getConfidenceColor(confidence)} ${className}`}
          >
            {getConfidenceIcon(confidence)}
            {getConfidenceLabel(confidence)}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">Confiança: {Math.round(confidence * 100)}%</p>
            <p className="text-sm">{getConfidenceDescription(confidence)}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}