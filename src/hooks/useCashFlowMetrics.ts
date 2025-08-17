
import { useMemo } from 'react';
import { CashFlowDataPoint } from '@/lib/cashflow-sim';

interface CashFlowMetrics {
  liquidityNow: number;
  worstDayBalance: number;
  worstDayDate: string;
  daysBelowZero: number;
  averageBalance: number;
  volatility: number;
  trendDirection: 'up' | 'down' | 'stable';
  riskScore: 'low' | 'medium' | 'high';
  projectedEndBalance: number;
}

export function useCashFlowMetrics(dataPoints: CashFlowDataPoint[]): CashFlowMetrics {
  return useMemo(() => {
    if (!dataPoints.length) {
      return {
        liquidityNow: 0,
        worstDayBalance: 0,
        worstDayDate: '',
        daysBelowZero: 0,
        averageBalance: 0,
        volatility: 0,
        trendDirection: 'stable',
        riskScore: 'low',
        projectedEndBalance: 0
      };
    }

    const currentBalance = dataPoints[0]?.total || 0;
    const finalBalance = dataPoints[dataPoints.length - 1]?.total || 0;

    // Find worst day
    let worstDay = dataPoints[0];
    dataPoints.forEach(point => {
      if (point.total < worstDay.total) {
        worstDay = point;
      }
    });

    // Count days below zero
    const daysBelowZero = dataPoints.filter(point => point.total < 0).length;

    // Calculate average balance
    const averageBalance = dataPoints.reduce((sum, point) => sum + point.total, 0) / dataPoints.length;

    // Calculate volatility (standard deviation)
    const variance = dataPoints.reduce((sum, point) => {
      return sum + Math.pow(point.total - averageBalance, 2);
    }, 0) / dataPoints.length;
    const volatility = Math.sqrt(variance);

    // Determine trend direction
    let trendDirection: 'up' | 'down' | 'stable' = 'stable';
    const change = finalBalance - currentBalance;
    if (Math.abs(change) > averageBalance * 0.1) {
      trendDirection = change > 0 ? 'up' : 'down';
    }

    // Calculate risk score
    let riskScore: 'low' | 'medium' | 'high' = 'low';
    if (daysBelowZero > 0 || worstDay.total < -1000) {
      riskScore = 'high';
    } else if (worstDay.total < 500 || volatility > averageBalance * 0.5) {
      riskScore = 'medium';
    }

    return {
      liquidityNow: currentBalance,
      worstDayBalance: worstDay.total,
      worstDayDate: worstDay.date,
      daysBelowZero,
      averageBalance,
      volatility,
      trendDirection,
      riskScore,
      projectedEndBalance: finalBalance
    };
  }, [dataPoints]);
}
