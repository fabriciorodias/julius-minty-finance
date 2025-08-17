
import { parseISO, isValid, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Ultra-safe date validation that prevents ANY invalid date from passing through
 */
export function isValidDateString(dateValue: any): boolean {
  try {
    if (!dateValue) return false;
    if (typeof dateValue !== 'string') return false;
    
    // Check for basic string format
    if (dateValue.length < 8) return false;
    
    // Check for ISO date pattern
    const isoPattern = /^\d{4}-\d{2}-\d{2}(T.*)?$/;
    if (!isoPattern.test(dateValue)) return false;
    
    // Try to parse and validate
    const parsed = parseISO(dateValue);
    if (!isValid(parsed)) return false;
    
    // Additional check: ensure the date is within reasonable bounds
    const year = parsed.getFullYear();
    if (year < 1900 || year > 2100) return false;
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Safe date formatting that NEVER throws
 */
export function safeFormatDate(dateStr: any, formatStr: string = 'dd/MM'): string {
  try {
    if (!isValidDateString(dateStr)) {
      console.warn('Invalid date rejected in safeFormatDate:', dateStr);
      return '';
    }
    
    const parsed = parseISO(dateStr);
    return format(parsed, formatStr, { locale: ptBR });
  } catch (error) {
    console.warn('Date formatting error in safeFormatDate:', error, 'for date:', dateStr);
    return '';
  }
}

/**
 * Safe date formatting for long formats
 */
export function safeFormatDateLong(dateStr: any, formatStr: string = 'PPP'): string {
  try {
    if (!isValidDateString(dateStr)) {
      console.warn('Invalid date rejected in safeFormatDateLong:', dateStr);
      return '';
    }
    
    const parsed = parseISO(dateStr);
    return format(parsed, formatStr, { locale: ptBR });
  } catch (error) {
    console.warn('Date formatting error in safeFormatDateLong:', error, 'for date:', dateStr);
    return '';
  }
}

/**
 * Ultra-safe tick formatter for charts
 */
export function ultraSafeTickFormatter(value: any): string {
  try {
    if (!value) return '';
    const formatted = safeFormatDate(String(value));
    return formatted || '';
  } catch {
    return '';
  }
}

/**
 * Safe currency formatter that never throws
 */
export function safeCurrencyFormatter(value: any): string {
  try {
    if (typeof value !== 'number' || !isFinite(value)) return '0';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value).replace('R$', '').trim();
  } catch {
    return String(value);
  }
}
