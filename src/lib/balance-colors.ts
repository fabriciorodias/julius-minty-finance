import { Account } from '@/hooks/useAccounts';

// Interface para configuração de cores de saldo
export interface BalanceColorConfig {
  balance: number;
  accountKind: Account['kind'];
  intensity?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
}

// Interface para o resultado das cores
export interface BalanceColorResult {
  textColor: string;
  bgColor: string;
  borderColor: string;
  bgGradient: string;
  borderGradient: string;
  intensity: number;
  showNegativeSign: boolean;
}

/**
 * Calcula a intensidade da cor baseada no valor absoluto do saldo
 * e em percentis calculados a partir de uma lista de saldos
 */
export function calculateColorIntensity(
  balance: number,
  allBalances: number[] = [],
  accountKind: Account['kind']
): number {
  const absBalance = Math.abs(balance);
  
  // Se não há dados suficientes, usa uma intensidade baseada em valor fixo
  if (allBalances.length < 3) {
    if (absBalance === 0) return 1;
    if (absBalance < 1000) return 2;
    if (absBalance < 5000) return 4;
    if (absBalance < 10000) return 6;
    if (absBalance < 50000) return 8;
    return 10;
  }

  // Filtra apenas saldos do mesmo tipo de conta para comparação
  const relevantBalances = allBalances.map(Math.abs).sort((a, b) => a - b);
  
  // Calcula percentis
  const percentiles = [10, 20, 30, 40, 50, 60, 70, 80, 90, 95].map(p => {
    const index = Math.floor((p / 100) * (relevantBalances.length - 1));
    return relevantBalances[index] || 0;
  });

  // Determina a intensidade baseada nos percentis
  if (absBalance === 0) return 1;
  if (absBalance <= percentiles[0]) return 2;
  if (absBalance <= percentiles[1]) return 3;
  if (absBalance <= percentiles[2]) return 4;
  if (absBalance <= percentiles[3]) return 5;
  if (absBalance <= percentiles[4]) return 6;
  if (absBalance <= percentiles[5]) return 7;
  if (absBalance <= percentiles[6]) return 8;
  if (absBalance <= percentiles[7]) return 9;
  return 10;
}

/**
 * Gera as classes de cor apropriadas baseadas no saldo e tipo de conta
 */
export function getBalanceColors(config: BalanceColorConfig): BalanceColorResult {
  const { balance, accountKind } = config;
  const isPositive = balance >= 0;
  const intensity = config.intensity || calculateColorIntensity(balance, [], accountKind);
  
  // Para contas de ativo
  if (accountKind === 'asset') {
    if (isPositive) {
      // Verde progressivo para saldos positivos de ativos
      return {
        textColor: `text-balance-asset-positive-${intensity}`,
        bgColor: `bg-balance-asset-positive-bg-${intensity}`,
        borderColor: `border-balance-asset-positive-${intensity}`,
        bgGradient: `bg-gradient-to-br from-balance-asset-positive-bg-${intensity} to-balance-asset-positive-bg-${Math.min(intensity + 2, 10)}`,
        borderGradient: `bg-gradient-to-r from-balance-asset-positive-${intensity} to-balance-asset-positive-${Math.min(intensity + 1, 10)}`,
        intensity,
        showNegativeSign: false
      };
    } else {
      // Amarelo-vermelho para saldos negativos de ativos (problemático)
      return {
        textColor: `text-balance-negative-${intensity}`,
        bgColor: `bg-balance-negative-bg-${intensity}`,
        borderColor: `border-balance-negative-${intensity}`,
        bgGradient: `bg-gradient-to-br from-balance-negative-bg-${intensity} to-balance-negative-bg-${Math.min(intensity + 2, 10)}`,
        borderGradient: `bg-gradient-to-r from-balance-negative-${intensity} to-balance-negative-${Math.min(intensity + 1, 10)}`,
        intensity,
        showNegativeSign: true
      };
    }
  } 
  
  // Para contas de passivo
  if (accountKind === 'liability') {
    // Sempre mostra sinal negativo e usa escala amarelo-vermelho
    return {
      textColor: `text-balance-liability-${intensity}`,
      bgColor: `bg-balance-liability-bg-${intensity}`,
      borderColor: `border-balance-liability-${intensity}`,
      bgGradient: `bg-gradient-to-br from-balance-liability-bg-${intensity} to-balance-liability-bg-${Math.min(intensity + 2, 10)}`,
      borderGradient: `bg-gradient-to-r from-balance-liability-${intensity} to-balance-liability-${Math.min(intensity + 1, 10)}`,
      intensity,
      showNegativeSign: true
    };
  }

  // Fallback
  return {
    textColor: 'text-foreground',
    bgColor: 'bg-muted',
    borderColor: 'border-muted',
    bgGradient: 'bg-muted',
    borderGradient: 'bg-muted',
    intensity: 1,
    showNegativeSign: balance < 0
  };
}

/**
 * Calcula todas as intensidades para uma lista de contas
 * para garantir consistência visual
 */
export function calculateBalanceIntensities(
  accounts: Account[],
  balanceMap: Record<string, number>
): Record<string, number> {
  // Separa saldos por tipo de conta
  const assetBalances = accounts
    .filter(acc => acc.kind === 'asset')
    .map(acc => balanceMap[acc.id] || 0);
    
  const liabilityBalances = accounts
    .filter(acc => acc.kind === 'liability')
    .map(acc => Math.abs(balanceMap[acc.id] || 0));

  const intensityMap: Record<string, number> = {};
  
  accounts.forEach(account => {
    const balance = balanceMap[account.id] || 0;
    const relevantBalances = account.kind === 'asset' ? assetBalances : liabilityBalances;
    intensityMap[account.id] = calculateColorIntensity(balance, relevantBalances, account.kind);
  });

  return intensityMap;
}

/**
 * Formata um valor monetário considerando o tipo de conta e configuração de sinal
 */
export function formatBalanceWithSign(
  balance: number,
  accountKind: Account['kind'],
  showNegativeSign: boolean = false
): string {
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  // Para passivos, sempre mostra valor absoluto com sinal negativo
  if (accountKind === 'liability') {
    const absValue = Math.abs(balance);
    return `-${formatter.format(absValue)}`;
  }

  // Para ativos, mostra normalmente
  if (accountKind === 'asset') {
    if (balance < 0 && showNegativeSign) {
      return `-${formatter.format(Math.abs(balance))}`;
    }
    return formatter.format(balance);
  }

  // Fallback
  return formatter.format(balance);
}