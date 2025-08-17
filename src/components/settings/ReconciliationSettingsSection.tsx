
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, RotateCcw, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useReconciliationSettings } from '@/hooks/useReconciliationSettings';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function ReconciliationSettingsSection() {
  const { settings, updateSettings, resetToDefaults, getThresholdInDays } = useReconciliationSettings();

  const handleThresholdChange = (value: string) => {
    const hours = parseInt(value);
    if (!isNaN(hours) && hours > 0) {
      updateSettings({ alertThresholdHours: hours });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">Alertas de Conciliação</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure quando as contas devem mostrar alertas visuais baseado na última conciliação
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="threshold-hours" className="text-sm font-medium">
              Limite para alerta (em horas)
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">
                    Contas que não foram conciliadas há mais tempo que este limite 
                    mostrarão um alerta visual
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="flex items-center gap-3">
            <Input
              id="threshold-hours"
              type="number"
              min="1"
              max="8760"
              value={settings.alertThresholdHours}
              onChange={(e) => handleThresholdChange(e.target.value)}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">horas</span>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              ≈ {getThresholdInDays()} dias
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Valor atual: {settings.alertThresholdHours} horas ({getThresholdInDays()} dias)
          </p>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Visual Cues de Status
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 p-2 rounded bg-red-50 border border-red-200">
              <Clock className="h-3 w-3 text-red-500" />
              <span className="text-red-700 font-medium">Nunca conciliada</span>
              <span className="text-red-600">- Alerta vermelho</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-amber-50 border border-amber-200">
              <Clock className="h-3 w-3 text-amber-500" />
              <span className="text-amber-700 font-medium">Conciliação antiga</span>
              <span className="text-amber-600">- Alerta laranja ({'>'}{ getThresholdInDays()} dias)</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded bg-green-50 border border-green-200">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span className="text-green-700 font-medium">Conciliada recentemente</span>
              <span className="text-green-600">- Status normal</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefaults}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar Padrão (48h)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
