
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, startOfMonth, endOfMonth, subMonths, subDays } from 'date-fns';
import { Settings, X } from 'lucide-react';

interface QuickDateFiltersProps {
  onDateRangeSelect: (startDate: string, endDate: string) => void;
  currentStartDate?: string;
  currentEndDate?: string;
}

export function QuickDateFilters({ 
  onDateRangeSelect, 
  currentStartDate, 
  currentEndDate 
}: QuickDateFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(currentStartDate || '');
  const [customEndDate, setCustomEndDate] = useState(currentEndDate || '');
  
  const today = new Date();
  
  const dateRanges = [
    {
      label: 'Este Mês',
      startDate: startOfMonth(today),
      endDate: endOfMonth(today),
    },
    {
      label: 'Mês Passado',
      startDate: startOfMonth(subMonths(today, 1)),
      endDate: endOfMonth(subMonths(today, 1)),
    },
    {
      label: 'Últimos 30 dias',
      startDate: subDays(today, 30),
      endDate: today,
    },
    {
      label: 'Últimos 90 dias',
      startDate: subDays(today, 90),
      endDate: today,
    },
  ];

  const handleRangeSelect = (startDate: Date, endDate: Date) => {
    const start = format(startDate, 'yyyy-MM-dd');
    const end = format(endDate, 'yyyy-MM-dd');
    
    // Se já está ativo, desativa o filtro
    if (currentStartDate === start && currentEndDate === end) {
      onDateRangeSelect('', '');
    } else {
      onDateRangeSelect(start, end);
    }
  };

  const isActive = (startDate: Date, endDate: Date) => {
    const start = format(startDate, 'yyyy-MM-dd');
    const end = format(endDate, 'yyyy-MM-dd');
    return currentStartDate === start && currentEndDate === end;
  };

  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      onDateRangeSelect(customStartDate, customEndDate);
      setShowAdvanced(false);
    }
  };

  const handleClearFilters = () => {
    onDateRangeSelect('', '');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const hasActiveFilter = currentStartDate || currentEndDate;

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-wrap gap-2">
        {dateRanges.map((range) => (
          <Button
            key={range.label}
            variant={isActive(range.startDate, range.endDate) ? "default" : "outline"}
            size="sm"
            onClick={() => handleRangeSelect(range.startDate, range.endDate)}
            className="relative"
          >
            {range.label}
          </Button>
        ))}
      </div>

      {/* Botão de opções avançadas */}
      <Popover open={showAdvanced} onOpenChange={setShowAdvanced}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="px-2"
            title="Opções avançadas de data"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Filtro Personalizado</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="custom-start" className="text-xs">Data Inicial</Label>
                <Input
                  id="custom-start"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="text-xs"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="custom-end" className="text-xs">Data Final</Label>
                <Input
                  id="custom-end"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
            
            <div className="flex justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs"
              >
                Limpar Filtros
              </Button>
              
              <Button
                size="sm"
                onClick={handleCustomDateApply}
                disabled={!customStartDate || !customEndDate}
                className="text-xs"
              >
                Aplicar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Indicador de filtro ativo */}
      {hasActiveFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="px-2 text-muted-foreground hover:text-foreground"
          title="Limpar filtros de data"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
