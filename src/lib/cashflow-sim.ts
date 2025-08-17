
import { format, addDays, startOfDay, parseISO } from 'date-fns';

export interface CashFlowDataPoint {
  date: string;
  [accountId: string]: number | string;
  total: number;
}

export interface ScenarioAdjustment {
  type: 'expense_reduction' | 'income_increase' | 'extra_payment' | 'savings_goal';
  amount: number;
  startDate?: string;
  endDate?: string;
  category?: string;
  description: string;
}

export interface SimulationResult {
  originalDataPoints: CashFlowDataPoint[];
  scenarioDataPoints: CashFlowDataPoint[];
  impact: {
    totalImprovement: number;
    worstDayImprovement: number;
    daysAboveZeroGained: number;
  };
}

export function simulateCashFlowScenario(
  originalDataPoints: CashFlowDataPoint[],
  adjustments: ScenarioAdjustment[]
): SimulationResult {
  if (!originalDataPoints.length) {
    return {
      originalDataPoints,
      scenarioDataPoints: [],
      impact: { totalImprovement: 0, worstDayImprovement: 0, daysAboveZeroGained: 0 }
    };
  }

  // Clone the original data points
  const scenarioDataPoints = originalDataPoints.map(point => ({ ...point }));

  // Apply each adjustment
  adjustments.forEach(adjustment => {
    const startDate = adjustment.startDate || scenarioDataPoints[0].date;
    const endDate = adjustment.endDate || scenarioDataPoints[scenarioDataPoints.length - 1].date;

    scenarioDataPoints.forEach(point => {
      if (point.date >= startDate && point.date <= endDate) {
        let dailyAdjustment = 0;

        switch (adjustment.type) {
          case 'expense_reduction':
            // Spread the monthly reduction across all days in the month
            dailyAdjustment = adjustment.amount / 30;
            break;
          case 'income_increase':
            // Spread the monthly increase across all days in the month
            dailyAdjustment = adjustment.amount / 30;
            break;
          case 'extra_payment':
            // Apply only on the start date for one-time payments
            if (point.date === startDate) {
              dailyAdjustment = -adjustment.amount;
            }
            break;
          case 'savings_goal':
            // Spread the monthly savings goal as a daily reduction
            dailyAdjustment = -adjustment.amount / 30;
            break;
        }

        point.total += dailyAdjustment;
      }
    });
  });

  // Calculate impact metrics
  const originalWorstDay = Math.min(...originalDataPoints.map(p => p.total));
  const scenarioWorstDay = Math.min(...scenarioDataPoints.map(p => p.total));
  
  const originalDaysAboveZero = originalDataPoints.filter(p => p.total > 0).length;
  const scenarioDaysAboveZero = scenarioDataPoints.filter(p => p.total > 0).length;

  const originalFinalBalance = originalDataPoints[originalDataPoints.length - 1]?.total || 0;
  const scenarioFinalBalance = scenarioDataPoints[scenarioDataPoints.length - 1]?.total || 0;

  return {
    originalDataPoints,
    scenarioDataPoints,
    impact: {
      totalImprovement: scenarioFinalBalance - originalFinalBalance,
      worstDayImprovement: scenarioWorstDay - originalWorstDay,
      daysAboveZeroGained: scenarioDaysAboveZero - originalDaysAboveZero
    }
  };
}

export function identifyKeyEvents(dataPoints: CashFlowDataPoint[]): Array<{
  date: string;
  type: 'salary' | 'large_expense' | 'month_end' | 'low_balance';
  description: string;
  amount?: number;
}> {
  const events: Array<{
    date: string;
    type: 'salary' | 'large_expense' | 'month_end' | 'low_balance';
    description: string;
    amount?: number;
  }> = [];

  for (let i = 1; i < dataPoints.length; i++) {
    const current = dataPoints[i];
    const previous = dataPoints[i - 1];
    const change = current.total - previous.total;

    // Large positive change (potential salary)
    if (change > 2000) {
      events.push({
        date: current.date,
        type: 'salary',
        description: 'Possível salário',
        amount: change
      });
    }

    // Large negative change (potential large expense)
    if (change < -1000) {
      events.push({
        date: current.date,
        type: 'large_expense',
        description: 'Grande despesa',
        amount: Math.abs(change)
      });
    }

    // Month end
    const currentDate = parseISO(current.date);
    if (currentDate.getDate() === 1) {
      events.push({
        date: current.date,
        type: 'month_end',
        description: 'Início do mês'
      });
    }

    // Low balance warning
    if (current.total < 500 && current.total > 0) {
      events.push({
        date: current.date,
        type: 'low_balance',
        description: 'Saldo baixo',
        amount: current.total
      });
    }
  }

  return events;
}
