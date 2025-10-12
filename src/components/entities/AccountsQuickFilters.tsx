import { NotionButton } from '@/components/ui/notion-button';
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
      return hoursDiff <= 72 && a.is_active; // 3 days = 72 hours
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
      icon: <Layers className="h-4 w-4" />,
      count: filterCounts.all,
    },
    {
      id: 'recently_reconciled' as const,
      label: 'Conciliadas (3 dias)',
      icon: <CheckCircle className="h-4 w-4" />,
      count: filterCounts.recently_reconciled,
    },
    {
      id: 'stale_reconciliation' as const,
      label: 'Conciliação Atrasada',
      icon: <Clock className="h-4 w-4" />,
      count: filterCounts.stale_reconciliation,
    },
    {
      id: 'never_reconciled' as const,
      label: 'Nunca Conciliadas',
      icon: <AlertTriangle className="h-4 w-4" />,
      count: filterCounts.never_reconciled,
    },
    {
      id: 'credit_cards' as const,
      label: 'Cartões de Crédito',
      icon: <CreditCard className="h-4 w-4" />,
      count: filterCounts.credit_cards,
    },
    {
      id: 'inactive' as const,
      label: 'Inativas',
      icon: <EyeOff className="h-4 w-4" />,
      count: filterCounts.inactive,
    },
  ];

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-notion-gray-50 rounded-lg border border-notion-gray-200">
      {filters.map((filter) => (
        <NotionButton
          key={filter.id}
          variant="ghost"
          size="sm"
          onClick={() => onFilterChange(filter.id)}
          className={`gap-2 ${
            activeFilter === filter.id
              ? 'bg-notion-gray-900 text-white hover:bg-notion-gray-900'
              : 'bg-white text-notion-gray-700 hover:bg-notion-gray-100'
          }`}
        >
          {filter.icon}
          <span>{filter.label}</span>
          <Badge 
            variant="secondary" 
            className={`ml-1 ${
              activeFilter === filter.id 
                ? 'bg-white/20 text-white border-white/20' 
                : 'bg-notion-gray-100 text-notion-gray-700 border-notion-gray-200'
            }`}
          >
            {filter.count}
          </Badge>
        </NotionButton>
      ))}
    </div>
  );
}
