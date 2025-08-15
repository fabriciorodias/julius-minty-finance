
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Category } from '@/hooks/useCategories';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (type: 'fixed' | 'variable', amount?: number, monthlyAmounts?: number[]) => void;
  category: Category | null;
  isLoading?: boolean;
  initialValues?: {
    type: 'fixed' | 'variable';
    fixedAmount?: number;
    monthlyAmounts?: number[];
  };
}

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function BudgetModal({ isOpen, onClose, onSubmit, category, isLoading, initialValues }: BudgetModalProps) {
  const [budgetType, setBudgetType] = useState<'fixed' | 'variable'>('fixed');
  const [fixedAmount, setFixedAmount] = useState<string>('');
  const [monthlyAmounts, setMonthlyAmounts] = useState<string[]>(Array(12).fill(''));

  useEffect(() => {
    if (isOpen && category) {
      if (initialValues) {
        // Pre-fill with existing values
        setBudgetType(initialValues.type);
        if (initialValues.type === 'fixed' && initialValues.fixedAmount !== undefined) {
          setFixedAmount(initialValues.fixedAmount.toString());
        }
        if (initialValues.type === 'variable' && initialValues.monthlyAmounts) {
          setMonthlyAmounts(initialValues.monthlyAmounts.map(amount => amount.toString()));
        }
      } else {
        // Reset form when modal opens without initial values
        setBudgetType('fixed');
        setFixedAmount('');
        setMonthlyAmounts(Array(12).fill(''));
      }
    }
  }, [isOpen, category, initialValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (budgetType === 'fixed') {
      const amount = parseFloat(fixedAmount) || 0;
      onSubmit('fixed', amount);
    } else {
      const amounts = monthlyAmounts.map(amount => parseFloat(amount) || 0);
      onSubmit('variable', undefined, amounts);
    }
    
    onClose();
  };

  const handleMonthlyAmountChange = (index: number, value: string) => {
    const newAmounts = [...monthlyAmounts];
    newAmounts[index] = value;
    setMonthlyAmounts(newAmounts);
  };

  if (!category) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Definir Orçamento - {category.name}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de Planejamento */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Tipo de Planejamento</Label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="budget-type"
                  checked={budgetType === 'variable'}
                  onCheckedChange={(checked) => setBudgetType(checked ? 'variable' : 'fixed')}
                />
                <Label htmlFor="budget-type">
                  {budgetType === 'fixed' ? 'Planejamento Fixo' : 'Planejamento Variável'}
                </Label>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {budgetType === 'fixed' 
                ? 'O mesmo valor será aplicado para todos os meses do ano.'
                : 'Você pode definir valores diferentes para cada mês do ano.'
              }
            </p>
          </div>

          {/* Planejamento Fixo */}
          {budgetType === 'fixed' && (
            <div className="space-y-2">
              <Label htmlFor="fixed-amount">Valor Mensal (R$)</Label>
              <Input
                id="fixed-amount"
                type="number"
                step="0.01"
                min="0"
                value={fixedAmount}
                onChange={(e) => setFixedAmount(e.target.value)}
                placeholder="0,00"
                required
              />
            </div>
          )}

          {/* Planejamento Variável */}
          {budgetType === 'variable' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Valores por Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {monthNames.map((month, index) => (
                    <div key={month} className="space-y-1">
                      <Label htmlFor={`month-${index}`} className="text-sm">
                        {month}
                      </Label>
                      <Input
                        id={`month-${index}`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={monthlyAmounts[index]}
                        onChange={(e) => handleMonthlyAmountChange(index, e.target.value)}
                        placeholder="0,00"
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seção de Referência Histórica - Por enquanto placeholder */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">Referência Histórica</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Dados históricos serão exibidos aqui quando o módulo de lançamentos estiver implementado.
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              Salvar Orçamento
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
