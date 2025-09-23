import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CategorizationConfidenceProps {
  confidence: number;
}

export function CategorizationConfidence({ confidence }: CategorizationConfidenceProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 border-green-200 bg-green-50';
    if (confidence >= 0.6) return 'text-yellow-600 border-yellow-200 bg-yellow-50';
    return 'text-red-600 border-red-200 bg-red-50';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'Alta';
    if (confidence >= 0.6) return 'Média';
    return 'Baixa';
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
            className={`text-xs cursor-help ${getConfidenceColor(confidence)}`}
          >
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