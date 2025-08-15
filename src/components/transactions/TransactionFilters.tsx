
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, X, Filter, Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TransactionFilters as FilterType } from '@/hooks/useTransactions';
import { Category } from '@/hooks/useCategories';
import { Account } from '@/hooks/useAccounts';
import { CreditCard } from '@/hooks/useCreditCards';
import { Institution } from '@/hooks/useInstitutions';
import type { DateRange } from 'react-day-picker';

interface TransactionFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  categories: Category[];
  accounts: Account[];
  creditCards: CreditCard[];
  institutions: Institution[];
}

interface DatePreset {
  label: string;
  getValue: () => { startDate: string; endDate: string };
}

const datePresets: DatePreset[] = [
  {
    label: 'Este mês',
    getValue: () => {
      const now = new Date();
      return {
        startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(now), 'yyyy-MM-dd'),
      };
    },
  },
  {
    label: 'Mês passado',
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1);
      return {
        startDate: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
      };
    },
  },
  {
    label: 'Este ano',
    getValue: () => {
      const now = new Date();
      return {
        startDate: format(startOfYear(now), 'yyyy-MM-dd'),
        endDate: format(endOfYear(now), 'yyyy-MM-dd'),
      };
    },
  },
];

export function TransactionFilters({
  filters,
  onFiltersChange,
  searchTerm,
  onSearchChange,
  categories,
  accounts,
  creditCards,
  institutions,
}: TransactionFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  // Create institution map for lookup
  const institutionMap = React.useMemo(() => 
    institutions.reduce((acc, institution) => {
      acc[institution.id] = institution.name;
      return acc;
    }, {} as Record<string, string>), 
  [institutions]);

  // Get child categories for filter
  const childCategories = React.useMemo(() => 
    categories.flatMap(category => 
      category.subcategories && category.subcategories.length > 0 
        ? category.subcategories 
        : category.parent_id ? [category] : []
    ), 
  [categories]);

  // Combine accounts and credit cards for unified origin selector
  const originOptions = React.useMemo(() => {
    const accountOptions = accounts.map(account => ({
      id: account.id,
      name: `${institutionMap[account.institution_id]} - ${account.name}`,
      type: 'account' as const,
    }));
    
    const creditCardOptions = creditCards.map(card => ({
      id: card.id,
      name: `${institutionMap[card.institution_id]} - ${card.name}`,
      type: 'credit_card' as const,
    }));
    
    return [...accountOptions, ...creditCardOptions];
  }, [accounts, creditCards, institutionMap]);

  const handleFilterChange = (key: keyof FilterType, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value === 'all' || value === '' ? undefined : value,
    });
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      onFiltersChange({
        ...filters,
        startDate: format(range.from, 'yyyy-MM-dd'),
        endDate: format(range.to, 'yyyy-MM-dd'),
      });
    } else if (!range?.from && !range?.to) {
      onFiltersChange({
        ...filters,
        startDate: undefined,
        endDate: undefined,
      });
    }
  };

  const applyDatePreset = (preset: DatePreset) => {
    const { startDate, endDate } = preset.getValue();
    onFiltersChange({
      ...filters,
      startDate,
      endDate,
    });
    setDateRange({
      from: new Date(startDate),
      to: new Date(endDate),
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
    onSearchChange('');
    setDateRange(undefined);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (filters.categoryId) count++;
    if (filters.accountId || filters.creditCardId) count++;
    if (filters.status) count++;
    if (filters.startDate || filters.endDate) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Main search and quick filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por descrição..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            {/* Status toggle buttons */}
            <div className="flex bg-muted rounded-lg p-1">
              <Button
                variant={!filters.status ? "default" : "ghost"}
                size="sm"
                onClick={() => handleFilterChange('status', undefined)}
                className="rounded-md px-3 h-8"
              >
                Todos
              </Button>
              <Button
                variant={filters.status === 'pendente' ? "default" : "ghost"}
                size="sm"
                onClick={() => handleFilterChange('status', 'pendente')}
                className="rounded-md px-3 h-8"
              >
                Pendentes
              </Button>
              <Button
                variant={filters.status === 'concluido' ? "default" : "ghost"}
                size="sm"
                onClick={() => handleFilterChange('status', 'concluido')}
                className="rounded-md px-3 h-8"
              >
                Efetivados
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Active filters chips */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {searchTerm && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Busca: "{searchTerm}"
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => onSearchChange('')}
                />
              </Badge>
            )}
            {filters.categoryId && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Categoria: {childCategories.find(c => c.id === filters.categoryId)?.name}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleFilterChange('categoryId', undefined)}
                />
              </Badge>
            )}
            {(filters.accountId || filters.creditCardId) && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Origem: {originOptions.find(o => o.id === (filters.accountId || filters.creditCardId))?.name}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => {
                    handleFilterChange('accountId', undefined);
                    handleFilterChange('creditCardId', undefined);
                  }}
                />
              </Badge>
            )}
            {(filters.startDate || filters.endDate) && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Período: {filters.startDate && format(new Date(filters.startDate), 'dd/MM/yyyy', { locale: ptBR })} - {filters.endDate && format(new Date(filters.endDate), 'dd/MM/yyyy', { locale: ptBR })}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => {
                    handleFilterChange('startDate', undefined);
                    handleFilterChange('endDate', undefined);
                    setDateRange(undefined);
                  }}
                />
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-6 px-2 text-xs"
            >
              Limpar todos
            </Button>
          </div>
        )}

        {/* Expanded filters */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Base</label>
              <Select
                value={filters.dateBase || 'event'}
                onValueChange={(value) => handleFilterChange('dateBase', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="event">Data do Evento</SelectItem>
                  <SelectItem value="effective">Data de Efetivação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select
                value={filters.categoryId || 'all'}
                onValueChange={(value) => handleFilterChange('categoryId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {childCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Origem (Conta/Cartão)</label>
              <Select
                value={filters.accountId || filters.creditCardId || 'all'}
                onValueChange={(value) => {
                  if (value === 'all') {
                    handleFilterChange('accountId', undefined);
                    handleFilterChange('creditCardId', undefined);
                  } else {
                    const option = originOptions.find(o => o.id === value);
                    if (option?.type === 'account') {
                      handleFilterChange('accountId', value);
                      handleFilterChange('creditCardId', undefined);
                    } else {
                      handleFilterChange('creditCardId', value);
                      handleFilterChange('accountId', undefined);
                    }
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as origens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as origens</SelectItem>
                  {originOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <label className="text-sm font-medium">Período</label>
              <div className="flex flex-wrap gap-2">
                {datePresets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    onClick={() => applyDatePreset(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Personalizado
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="range"
                      selected={dateRange}
                      onSelect={handleDateRangeChange}
                      numberOfMonths={2}
                      locale={ptBR}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
