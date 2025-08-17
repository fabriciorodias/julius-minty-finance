
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScenarioAdjustment, SimulationResult } from '@/lib/cashflow-sim';
import { Lightbulb, TrendingUp, TrendingDown, DollarSign, PiggyBank, Zap } from 'lucide-react';

interface CashFlowScenarioPanelProps {
  onScenarioChange: (adjustments: ScenarioAdjustment[]) => void;
  simulationResult?: SimulationResult;
  children: React.ReactNode;
}

export function CashFlowScenarioPanel({ 
  onScenarioChange, 
  simulationResult,
  children 
}: CashFlowScenarioPanelProps) {
  const [expenseReduction, setExpenseReduction] = useState([0]);
  const [incomeIncrease, setIncomeIncrease] = useState([0]);
  const [extraSavings, setExtraSavings] = useState([0]);
  const [oneTimePayment, setOneTimePayment] = useState([0]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleAdjustmentsChange = () => {
    const adjustments: ScenarioAdjustment[] = [];

    if (expenseReduction[0] > 0) {
      adjustments.push({
        type: 'expense_reduction',
        amount: expenseReduction[0],
        description: `Reduzir gastos em ${formatCurrency(expenseReduction[0])}/mês`
      });
    }

    if (incomeIncrease[0] > 0) {
      adjustments.push({
        type: 'income_increase',
        amount: incomeIncrease[0],
        description: `Aumentar renda em ${formatCurrency(incomeIncrease[0])}/mês`
      });
    }

    if (extraSavings[0] > 0) {
      adjustments.push({
        type: 'savings_goal',
        amount: extraSavings[0],
        description: `Poupar ${formatCurrency(extraSavings[0])}/mês extra`
      });
    }

    if (oneTimePayment[0] > 0) {
      adjustments.push({
        type: 'extra_payment',
        amount: oneTimePayment[0],
        description: `Pagamento único de ${formatCurrency(oneTimePayment[0])}`
      });
    }

    onScenarioChange(adjustments);
  };

  // Update adjustments whenever sliders change
  useState(() => {
    handleAdjustmentsChange();
  });

  const resetAll = () => {
    setExpenseReduction([0]);
    setIncomeIncrease([0]);
    setExtraSavings([0]);
    setOneTimePayment([0]);
    onScenarioChange([]);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            E se eu...?
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Impact Summary */}
          {simulationResult && (
            <Card className="border-primary/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Impacto do Cenário
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Melhoria total:</span>
                  <Badge variant={simulationResult.impact.totalImprovement >= 0 ? 'default' : 'destructive'}>
                    {simulationResult.impact.totalImprovement >= 0 ? '+' : ''}
                    {formatCurrency(simulationResult.impact.totalImprovement)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Melhoria no pior dia:</span>
                  <Badge variant={simulationResult.impact.worstDayImprovement >= 0 ? 'default' : 'destructive'}>
                    {simulationResult.impact.worstDayImprovement >= 0 ? '+' : ''}
                    {formatCurrency(simulationResult.impact.worstDayImprovement)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Dias positivos ganhos:</span>
                  <Badge variant="outline">
                    +{simulationResult.impact.daysAboveZeroGained} dias
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Expense Reduction */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                Reduzir Gastos Mensais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Redução mensal: {formatCurrency(expenseReduction[0])}</Label>
                <Slider
                  value={expenseReduction}
                  onValueChange={(value) => {
                    setExpenseReduction(value);
                    setTimeout(handleAdjustmentsChange, 100);
                  }}
                  max={5000}
                  step={100}
                  className="mt-2"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Simule o impacto de reduzir gastos como delivery, streaming, ou compras desnecessárias.
              </div>
            </CardContent>
          </Card>

          {/* Income Increase */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Aumentar Renda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Aumento mensal: {formatCurrency(incomeIncrease[0])}</Label>
                <Slider
                  value={incomeIncrease}
                  onValueChange={(value) => {
                    setIncomeIncrease(value);
                    setTimeout(handleAdjustmentsChange, 100);
                  }}
                  max={10000}
                  step={200}
                  className="mt-2"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Simule freelances, aumento salarial, ou renda extra que você pode conseguir.
              </div>
            </CardContent>
          </Card>

          {/* Extra Savings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <PiggyBank className="h-4 w-4 text-primary" />
                Meta de Poupança Extra
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Poupança mensal: {formatCurrency(extraSavings[0])}</Label>
                <Slider
                  value={extraSavings}
                  onValueChange={(value) => {
                    setExtraSavings(value);
                    setTimeout(handleAdjustmentsChange, 100);
                  }}
                  max={3000}
                  step={50}
                  className="mt-2"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Veja o que acontece se você se comprometer a poupar um valor extra todo mês.
              </div>
            </CardContent>
          </Card>

          {/* One-time Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-amber-600" />
                Pagamento Único
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Valor único: {formatCurrency(oneTimePayment[0])}</Label>
                <Slider
                  value={oneTimePayment}
                  onValueChange={(value) => {
                    setOneTimePayment(value);
                    setTimeout(handleAdjustmentsChange, 100);
                  }}
                  max={20000}
                  step={500}
                  className="mt-2"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Simule o impacto de uma compra grande, investimento, ou pagamento antecipado.
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Reset Button */}
          <Button variant="outline" onClick={resetAll} className="w-full">
            Limpar Simulação
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
