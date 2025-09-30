
import React, { useMemo, useState } from 'react';
import { OriginCard, OriginCardContent, OriginCardHeader, OriginCardTitle } from '@/components/ui/origin-card';
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
import { Search, X, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Category } from '@/hooks/useCategories';
import { Account } from '@/hooks/useAccounts';
import { Institution } from '@/hooks/useInstitutions';

interface TransactionFiltersProps {
  filters: {
    startDate?: string;
    endDate?: string;
    categoryId?: string;
    accountId?: string;
  };
  onFiltersChange: (filters: any) => void;
  searchTerm: string;
  onSearchChange: (searchTerm: string) => void;
  categories: Category[];
  accounts: Account[];
  institutions: Institution[];
}

export function TransactionFilters({
  filters,
  onFiltersChange,
  searchTerm,
  onSearchChange,
  categories,
  accounts,
  institutions,
}: TransactionFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Create institution map for lookup
  const institutionMap = useMemo(() => 
    institutions.reduce((acc, institution) => {
      acc[institution.id] = institution.name;
      return acc;
    }, {} as Record<string, string>), 
  [institutions]);

  return (
    <OriginCard glass className="liquid-glass-subtle animate-fade-in">
      <OriginCardHeader>
        <OriginCardTitle>Filtros</OriginCardTitle>
      </OriginCardHeader>
      <OriginCardContent className="space-y-4">
        {/* Search - Always visible */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por descrição..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Toggle Advanced Filters */}
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-2"
          >
            Filtrar por campos
            {showAdvancedFilters ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Advanced Filters - Collapsible */}
        {showAdvancedFilters && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

              {/* Account Filter - Now includes both regular accounts and credit accounts */}
              <div className="space-y-2">
                <Label htmlFor="account">Conta/Cartão</Label>
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
                        {account.type === 'credit' && ' (Cartão)'}
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
                className="flex items-center gap-2 hover-scale"
              >
                <X className="h-4 w-4" />
                Limpar Filtros
              </Button>
            </div>
          </>
        )}
      </OriginCardContent>
    </OriginCard>
  );
}
