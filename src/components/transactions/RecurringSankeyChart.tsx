import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SankeyData } from '@/hooks/useRecurringSankey';

interface RecurringSankeyChartProps {
  data: SankeyData;
  height?: number;
}

export const RecurringSankeyChart: React.FC<RecurringSankeyChartProps> = ({ 
  data, 
  height = 400 
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Estados vazios
  if (!data || data.nodes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Fluxo de Receitas e Despesas Recorrentes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p>Nenhum lançamento recorrente ativo encontrado</p>
            <p className="text-sm mt-1">
              Crie lançamentos recorrentes para visualizar o fluxo de recursos
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular totais
  const incomeNodes = data.nodes.filter(n => n.category === 'income');
  const expenseNodes = data.nodes.filter(n => n.category === 'expense');
  const balanceNode = data.nodes.find(n => n.category === 'balance');

  const totalIncome = data.links
    .filter(l => l.target === 'balance')
    .reduce((sum, l) => sum + l.value, 0);

  const totalExpense = data.links
    .filter(l => l.source === 'balance')
    .reduce((sum, l) => sum + l.value, 0);

  const netBalance = totalIncome - totalExpense;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Fluxo de Receitas e Despesas Recorrentes
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Visualize como suas receitas recorrentes são distribuídas entre as despesas mensais
        </p>
      </CardHeader>
      <CardContent>
        {/* Resumo de totais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4 bg-gradient-to-r from-chart-1/10 to-transparent rounded-lg border border-chart-1/20">
            <div className="text-sm text-muted-foreground mb-1">Receitas Mensais</div>
            <div className="text-xl font-bold text-chart-1">{formatCurrency(totalIncome)}</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-chart-2/10 to-transparent rounded-lg border border-chart-2/20">
            <div className="text-sm text-muted-foreground mb-1">Despesas Mensais</div>
            <div className="text-xl font-bold text-chart-2">{formatCurrency(totalExpense)}</div>
          </div>
          <div className={`text-center p-4 rounded-lg border ${
            netBalance >= 0 
              ? 'bg-gradient-to-r from-green-50 to-transparent border-green-200 text-green-800' 
              : 'bg-gradient-to-r from-red-50 to-transparent border-red-200 text-red-800'
          }`}>
            <div className="text-sm text-muted-foreground mb-1">Saldo Líquido</div>
            <div className="text-xl font-bold">{formatCurrency(netBalance)}</div>
          </div>
        </div>

        {/* Visualização simplificada em colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Receitas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-chart-1 flex items-center gap-2">
              <div className="w-3 h-3 bg-chart-1 rounded"></div>
              Receitas Recorrentes
            </h3>
            <div className="space-y-3">
              {incomeNodes.map(node => {
                const link = data.links.find(l => l.source === node.id);
                const percentage = totalIncome > 0 ? (link?.value || 0) / totalIncome * 100 : 0;
                
                return (
                  <div key={node.id} className="bg-muted/50 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm">{node.name}</span>
                      <span className="text-sm text-chart-1 font-semibold">
                        {formatCurrency(link?.value || 0)}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-chart-1 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {percentage.toFixed(1)}% do total de receitas
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Saldo Central */}
          <div className="flex flex-col justify-center items-center space-y-4">
            <div className="text-center p-6 bg-muted/30 rounded-full border-2 border-muted">
              <div className="text-sm text-muted-foreground">Saldo Mensal</div>
              <div className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netBalance)}
              </div>
            </div>
            
            {/* Indicadores de fluxo */}
            <div className="text-center space-y-2">
              <div className="text-xs text-muted-foreground">Fluxo de Recursos</div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-chart-1">Receitas</span>
                <span>→</span>
                <span className="text-muted-foreground">Saldo</span>
                <span>→</span>
                <span className="text-chart-2">Despesas</span>
              </div>
            </div>
          </div>

          {/* Despesas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-chart-2 flex items-center gap-2">
              <div className="w-3 h-3 bg-chart-2 rounded"></div>
              Despesas Recorrentes
            </h3>
            <div className="space-y-3">
              {expenseNodes.map(node => {
                const link = data.links.find(l => l.target === node.id);
                const percentage = totalExpense > 0 ? (link?.value || 0) / totalExpense * 100 : 0;
                
                return (
                  <div key={node.id} className="bg-muted/50 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm">{node.name}</span>
                      <span className="text-sm text-chart-2 font-semibold">
                        {formatCurrency(link?.value || 0)}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-chart-2 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {percentage.toFixed(1)}% do total de despesas
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="mt-8 p-4 bg-muted/30 rounded-lg">
          <h4 className="font-semibold mb-2 text-sm">💡 Insights do Fluxo</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
            <div>
              • Você tem <span className="font-medium text-foreground">{incomeNodes.length}</span> fonte{incomeNodes.length !== 1 ? 's' : ''} de receita recorrente
            </div>
            <div>
              • Você tem <span className="font-medium text-foreground">{expenseNodes.length}</span> categoria{expenseNodes.length !== 1 ? 's' : ''} de despesa recorrente
            </div>
            {netBalance >= 0 ? (
              <div className="text-green-600">
                • Você tem um superávit mensal de <span className="font-medium">{formatCurrency(netBalance)}</span>
              </div>
            ) : (
              <div className="text-red-600">
                • Você tem um déficit mensal de <span className="font-medium">{formatCurrency(Math.abs(netBalance))}</span>
              </div>
            )}
            <div>
              • Taxa de cobertura: <span className="font-medium text-foreground">
                {totalExpense > 0 ? (totalIncome / totalExpense * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};