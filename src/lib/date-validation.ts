/**
 * Utilitários para validação de datas em transações importadas
 */

export function isSuspiciousDate(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  
  // Verifica se a data é válida
  if (isNaN(date.getTime())) {
    return true;
  }
  
  // Data muito no passado (mais de 2 anos)
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(now.getFullYear() - 2);
  
  if (date < twoYearsAgo) {
    return true;
  }
  
  // Data muito no futuro (mais de 1 ano)
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(now.getFullYear() + 1);
  
  if (date > oneYearFromNow) {
    return true;
  }
  
  return false;
}

export function getSuggestedDate(originalDate: string): string {
  // Se a data original é suspeita, sugere a data atual
  if (isSuspiciousDate(originalDate)) {
    return new Date().toISOString().split('T')[0];
  }
  
  return originalDate;
}

export function validateDateForImport(dateString: string): {
  isValid: boolean;
  isSuspicious: boolean;
  message?: string;
} {
  const date = new Date(dateString);
  const now = new Date();
  
  // Verifica se a data é válida
  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      isSuspicious: true,
      message: 'Data inválida'
    };
  }
  
  // Data muito no passado
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(now.getFullYear() - 2);
  
  if (date < twoYearsAgo) {
    return {
      isValid: true,
      isSuspicious: true,
      message: 'Data muito antiga (mais de 2 anos)'
    };
  }
  
  // Data muito no futuro
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(now.getFullYear() + 1);
  
  if (date > oneYearFromNow) {
    return {
      isValid: true,
      isSuspicious: true,
      message: 'Data muito no futuro (mais de 1 ano)'
    };
  }
  
  return {
    isValid: true,
    isSuspicious: false
  };
}

export function formatDateForInput(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}