import { CheckCircle, AlertTriangle, Clock, CreditCard, EyeOff, Layers } from 'lucide-react';
import { Account } from '@/hooks/useAccounts';
import { useReconciliationSettings } from '@/hooks/useReconciliationSettings';

export type AccountFilter = 'all' | 'recently_reconciled' | 'stale_reconciliation' | 'never_reconciled' | 'credit_cards' | 'inactive';

interface AccountsQuickFiltersProps {
  accounts: Account[];
  activeFilter: AccountFilter;
  onFilterChange: (filter: AccountFilter) => void;
}

export function AccountsQuickFilters({ accounts, activeFilter, onFilterChange }: AccountsQuickFiltersProps) {
  const { settings } = useReconciliationSettings();

  const getHoursSinceReconciliation = (reconciledAt: string) => {
    const reconciledDate = new Date(reconciledAt);
    const now = new Date();
    return Math.floor((now.getTime() - reconciledDate.getTime()) / (1000 * 60 * 60));
  };

  const filterCounts = {
    all: accounts.filter(a => a.is_active).length,
    recently_reconciled: accounts.filter(a => {
      if (!a.last_reconciled_at) return false;
      const hoursDiff = getHoursSinceReconciliation(a.last_reconciled_at);
      return hoursDiff <= 72 && a.is_active;
    }).length,
    stale_reconciliation: accounts.filter(a => {
      if (!a.last_reconciled_at) return false;
      const hoursDiff = getHoursSinceReconciliation(a.last_reconciled_at);
      return hoursDiff > settings.alertThresholdHours && a.is_active;
    }).length,
    never_reconciled: accounts.filter(a => !a.last_reconciled_at && a.is_active).length,
    credit_cards: accounts.filter(a => a.subtype === 'credit_card' && a.is_active).length,
    inactive: accounts.filter(a => !a.is_active).length,
  };

  const filters = [
    { id: 'all' as const, label: 'Todas', icon: Layers, count: filterCounts.all },
    { id: 'recently_reconciled' as const, label: 'Conciliadas', icon: CheckCircle, count: filterCounts.recently_reconciled },
    { id: 'stale_reconciliation' as const, label: 'Atrasadas', icon: Clock, count: filterCounts.stale_reconciliation },
    { id: 'never_reconciled' as const, label: 'Nunca', icon: AlertTriangle, count: filterCounts.never_reconciled },
    { id: 'credit_cards' as const, label: 'Cartões', icon: CreditCard, count: filterCounts.credit_cards },
    { id: 'inactive' as const, label: 'Inativas', icon: EyeOff, count: filterCounts.inactive },
  ];

  return (
    <div 
      className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-white/10"
      style={{ backgroundColor: '#1F2937' }}
    >
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.id;
        
        return (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            className={`
              inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium
              transition-all duration-150
              ${isActive 
                ? 'bg-white text-gray-900' 
                : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
              }
            `}
          >
            <Icon className="h-3 w-3" />
            <span>{filter.label}</span>
            <span className={`text-[10px] ${isActive ? 'text-gray-600' : 'text-white/50'}`}>
              {filter.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
