import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Filter, Grid3X3, List, TrendingUp, TrendingDown } from "lucide-react";

interface RecurringTransactionsFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  dueDateFilter: string;
  onDueDateFilterChange: (value: string) => void;
  accountFilter: string;
  onAccountFilterChange: (value: string) => void;
  accounts: Array<{ id: string; name: string }>;
  viewMode: 'compact' | 'detailed';
  onViewModeChange: (mode: 'compact' | 'detailed') => void;
  totalCount: number;
  filteredCount: number;
  revenueCount: number;
  expenseCount: number;
  overdueCount: number;
}

export function RecurringTransactionsFilters({
  searchTerm,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  dueDateFilter,
  onDueDateFilterChange,
  accountFilter,
  onAccountFilterChange,
  accounts,
  viewMode,
  onViewModeChange,
  totalCount,
  filteredCount,
  revenueCount,
  expenseCount,
  overdueCount
}: RecurringTransactionsFiltersProps) {
  const hasActiveFilters = searchTerm || typeFilter !== 'all' || statusFilter !== 'all' || dueDateFilter !== 'all' || accountFilter !== 'all';

  const clearAllFilters = () => {
    onSearchChange('');
    onTypeFilterChange('all');
    onStatusFilterChange('all');
    onDueDateFilterChange('all');
    onAccountFilterChange('all');
  };

  return (
    <div className="space-y-4 p-4 bg-card rounded-lg border border-border/40 shadow-sm">
      {/* Top Row: Search and View Mode Toggle */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, descrição ou categoria..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'compact' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('compact')}
            className="flex items-center gap-2"
          >
            <List className="h-4 w-4" />
            Compacto
          </Button>
          <Button
            variant={viewMode === 'detailed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('detailed')}
            className="flex items-center gap-2"
          >
            <Grid3X3 className="h-4 w-4" />
            Detalhado
          </Button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={typeFilter} onValueChange={onTypeFilterChange}>
          <SelectTrigger className="w-auto min-w-[120px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="receita">Receitas</SelectItem>
            <SelectItem value="despesa">Despesas</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-auto min-w-[120px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="paused">Pausados</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dueDateFilter} onValueChange={onDueDateFilterChange}>
          <SelectTrigger className="w-auto min-w-[160px]">
            <SelectValue placeholder="Vencimento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="overdue">Em atraso</SelectItem>
            <SelectItem value="next-7">Próximos 7 dias</SelectItem>
            <SelectItem value="next-30">Próximos 30 dias</SelectItem>
          </SelectContent>
        </Select>

        <Select value={accountFilter} onValueChange={onAccountFilterChange}>
          <SelectTrigger className="w-auto min-w-[160px]">
            <SelectValue placeholder="Conta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as contas</SelectItem>
            {accounts.map(account => (
              <SelectItem key={account.id} value={account.id}>
                {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>
            {filteredCount === totalCount 
              ? `${totalCount} lançamentos` 
              : `${filteredCount} de ${totalCount} lançamentos`
            }
          </span>
        </div>

        <div className="flex items-center gap-2">
          {revenueCount > 0 && (
            <Badge variant="outline" className="text-revenue border-revenue/30 bg-revenue/5">
              <TrendingUp className="h-3 w-3 mr-1" />
              {revenueCount} receitas
            </Badge>
          )}
          
          {expenseCount > 0 && (
            <Badge variant="outline" className="text-expense border-expense/30 bg-expense/5">
              <TrendingDown className="h-3 w-3 mr-1" />
              {expenseCount} despesas
            </Badge>
          )}
          
          {overdueCount > 0 && (
            <Badge variant="outline" className="text-status-overdue border-status-overdue/30 bg-status-overdue/5">
              {overdueCount} em atraso
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}