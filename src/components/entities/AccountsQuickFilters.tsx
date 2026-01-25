import { Badge } from '@/components/ui/badge';
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
    {
      id: 'all' as const,
      label: 'Todas',
      icon: Layers,
      count: filterCounts.all,
    },
    {
      id: 'recently_reconciled' as const,
      label: 'Conciliadas (3 dias)',
      icon: CheckCircle,
      count: filterCounts.recently_reconciled,
    },
    {
      id: 'stale_reconciliation' as const,
      label: 'Conciliação Atrasada',
      icon: Clock,
      count: filterCounts.stale_reconciliation,
    },
    {
      id: 'never_reconciled' as const,
      label: 'Nunca Conciliadas',
      icon: AlertTriangle,
      count: filterCounts.never_reconciled,
    },
    {
      id: 'credit_cards' as const,
      label: 'Cartões de Crédito',
      icon: CreditCard,
      count: filterCounts.credit_cards,
    },
    {
      id: 'inactive' as const,
      label: 'Inativas',
      icon: EyeOff,
      count: filterCounts.inactive,
    },
  ];

  return (
    <div 
      className="flex flex-wrap gap-2 p-4 rounded-xl border border-white/10"
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
              inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              transition-all duration-200
              ${isActive 
                ? 'bg-white text-gray-900 shadow-md' 
                : 'bg-white/10 text-white hover:bg-white/20'
              }
            `}
          >
            <Icon className="h-4 w-4" />
            <span>{filter.label}</span>
            <Badge 
              variant="secondary" 
              className={`ml-1 text-xs px-2 py-0.5 ${
                isActive 
                  ? 'bg-gray-200 text-gray-900 border-gray-300' 
                  : 'bg-white/20 text-white border-white/20'
              }`}
            >
              {filter.count}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}
