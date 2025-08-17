
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, CheckCircle, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Account, RECONCILIATION_METHOD_LABELS } from '@/hooks/useAccounts';

interface ReconcileAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reconciledAt: Date) => void;
  account?: Account;
  isLoading?: boolean;
}

export function ReconcileAccountModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  account,
  isLoading = false
}: ReconcileAccountModalProps) {
  const [reconciledAt, setReconciledAt] = useState<Date>(new Date());

  const handleConfirm = () => {
    onConfirm(reconciledAt);
    onClose();
  };

  if (!account) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Conciliar Conta
          </DialogTitle>
          <DialogDescription>
            Registre a data e hora em que você verificou e confirmou o saldo desta conta.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="p-4 bg-muted/20 rounded-lg">
            <h3 className="font-medium text-base mb-2">{account.name}</h3>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <User className="h-3 w-3 mr-1" />
                Forma: Manual
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              A conciliação ajuda a manter seus registros atualizados e identificar possíveis discrepâncias.
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">
              Data e Hora da Conciliação
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-12 justify-start text-left font-normal",
                    !reconciledAt && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {reconciledAt ? (
                    format(reconciledAt, "PPP 'às' HH:mm", { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={reconciledAt}
                  onSelect={(date) => {
                    if (date) {
                      // Manter o horário atual quando selecionamos uma nova data
                      const newDateTime = new Date(date);
                      const currentTime = new Date();
                      newDateTime.setHours(currentTime.getHours());
                      newDateTime.setMinutes(currentTime.getMinutes());
                      setReconciledAt(newDateTime);
                    }
                  }}
                  initialFocus
                  className="pointer-events-auto"
                />
                <div className="p-3 border-t">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Horário:</Label>
                    <input
                      type="time"
                      value={format(reconciledAt, 'HH:mm')}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':');
                        const newDateTime = new Date(reconciledAt);
                        newDateTime.setHours(parseInt(hours));
                        newDateTime.setMinutes(parseInt(minutes));
                        setReconciledAt(newDateTime);
                      }}
                      className="px-2 py-1 border rounded text-sm"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {account.last_reconciled_at && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Última conciliação:</strong>{' '}
                {format(new Date(account.last_reconciled_at), "PPP 'às' HH:mm", { locale: ptBR })}
                {account.last_reconciliation_method && (
                  <span className="ml-2">
                    ({RECONCILIATION_METHOD_LABELS[account.last_reconciliation_method]})
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onClose} className="px-6">
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isLoading || !reconciledAt} 
            className="px-6"
          >
            {isLoading ? 'Salvando...' : 'Confirmar Conciliação'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
