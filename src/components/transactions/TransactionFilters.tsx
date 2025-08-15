import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X, AlertTriangle } from 'lucide-react';
import { Category } from '@/hooks/useCategories';
import { Account } from '@/hooks/useAccounts';
import { CreditCard } from '@/hooks/useCreditCards';
import { Institution } from '@/hooks/useInstitutions';

interface TransactionFiltersProps {
  filters: {
    dateBase?: 'event' | 'effective';
    startDate?: string;
    endDate?: string;
    categoryId?: string;
    accountId?: string;
    creditCardId?: string;
    status?: 'pendente' | 'concluido';
  };
  onFiltersChange: (filters: any) => void;
  searchTerm: string;
  onSearchChange: (searchTerm: string) => void;
  categories: Category[];
  accounts: Account[];
  creditCards: CreditCard[];
  institutions: Institution[];
}

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
  // Create institution map for lookup
  const institutionMap = useMemo(() => 
    institutions.reduce((acc, institution) => {
      acc[institution.id] = institution.name;
      return acc;
    }, {} as Record<string, string>), 
  [institutions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por descrição..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Base Filter */}
          <div className="space-y-2">
            <Label htmlFor="dateBase">Base da Data</Label>
            <Select
              value={filters.dateBase || 'event'}
              onValueChange={(value: 'event' | 'effective') =>
                onFiltersChange({ ...filters, dateBase: value })
              }
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

          {/* Date Range */}
          <div className="space-y-2">
            <Label htmlFor="startDate">Data Inicial</Label>
            <Input
              id="startDate"
              type="date"
              value={filters.startDate || ''}
              onChange={(e) =>
                onFiltersChange({ ...filters, startDate: e.target.value || undefined })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">Data Final</Label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate || ''}
              onChange={(e) =>
                onFiltersChange({ ...filters, endDate: e.target.value || undefined })
              }
            />
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  status: value === 'all' ? undefined : (value as 'pendente' | 'concluido'),
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={filters.categoryId || 'all'}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  categoryId: value === 'all' ? undefined : value,
                  withoutCategory: value === 'uncategorized' ? true : undefined,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="uncategorized">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    Sem categoria
                  </div>
                </SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Account Filter */}
          <div className="space-y-2">
            <Label htmlFor="account">Conta</Label>
            <Select
              value={filters.accountId || 'all'}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  accountId: value === 'all' ? undefined : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {institutionMap[account.institution_id]} - {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Credit Card Filter */}
          <div className="space-y-2">
            <Label htmlFor="creditCard">Cartão de Crédito</Label>
            <Select
              value={filters.creditCardId || 'all'}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  creditCardId: value === 'all' ? undefined : value,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {creditCards.map((card) => (
                  <SelectItem key={card.id} value={card.id}>
                    {institutionMap[card.institution_id]} - {card.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onFiltersChange({});
              onSearchChange('');
            }}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Limpar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
