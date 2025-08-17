
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfMonth, endOfMonth, subMonths, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickDateFiltersProps {
  onDateRangeSelect: (startDate: string, endDate: string) => void;
  currentStartDate?: string;
  currentEndDate?: string;
  className?: string;
}

export function QuickDateFilters({ 
  onDateRangeSelect, 
  currentStartDate, 
  currentEndDate,
  className 
}: QuickDateFiltersProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{
    from?: Date;
    to?: Date;
  }>({});
  
  const today = new Date();
  
  const dateRanges = [
    {
      id: 'this-month',
      label: 'Este Mês',
      startDate: startOfMonth(today),
      endDate: endOfMonth(today),
    },
    {
      id: 'last-month',
      label: 'Mês Passado',
      startDate: startOfMonth(subMonths(today, 1)),
      endDate: endOfMonth(subMonths(today, 1)),
    },
    {
      id: 'last-30',
      label: '30 dias',
      startDate: subDays(today, 30),
      endDate: today,
    },
    {
      id: 'last-90',
      label: '90 dias',
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

  const handleCustomDateSelect = (range: { from?: Date; to?: Date }) => {
    setSelectedRange(range);
    
    if (range.from && range.to) {
      const start = format(range.from, 'yyyy-MM-dd');
      const end = format(range.to, 'yyyy-MM-dd');
      onDateRangeSelect(start, end);
      setShowCalendar(false);
    }
  };

  const handleClearFilters = () => {
    onDateRangeSelect('', '');
    setSelectedRange({});
  };

  const hasActiveFilter = currentStartDate || currentEndDate;
  const isCustomRange = hasActiveFilter && !dateRanges.some(range => isActive(range.startDate, range.endDate));

  const formatDateRange = () => {
    if (!currentStartDate || !currentEndDate) return '';
    
    const start = format(new Date(currentStartDate), 'dd/MM', { locale: ptBR });
    const end = format(new Date(currentEndDate), 'dd/MM/yyyy', { locale: ptBR });
    return `${start} - ${end}`;
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Segmented Control for Quick Ranges */}
      <div className="flex items-center bg-muted/50 rounded-lg p-1 gap-1">
        {dateRanges.map((range) => (
          <Button
            key={range.id}
            variant={isActive(range.startDate, range.endDate) ? "secondary" : "ghost"}
            size="sm"
            onClick={() => handleRangeSelect(range.startDate, range.endDate)}
            className={cn(
              "h-8 px-3 text-xs font-medium transition-all",
              isActive(range.startDate, range.endDate) 
                ? "bg-background shadow-sm text-foreground" 
                : "hover:bg-background/60 text-muted-foreground hover:text-foreground"
            )}
          >
            {range.label}
          </Button>
        ))}
        
        {/* Custom Calendar Trigger */}
        <Popover open={showCalendar} onOpenChange={setShowCalendar}>
          <PopoverTrigger asChild>
            <Button
              variant={isCustomRange ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "h-8 px-3 text-xs font-medium transition-all",
                isCustomRange 
                  ? "bg-background shadow-sm text-foreground" 
                  : "hover:bg-background/60 text-muted-foreground hover:text-foreground"
              )}
            >
              <CalendarIcon className="h-3 w-3 mr-1" />
              Personalizar
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-0 z-50 bg-popover border shadow-md" 
            align="end"
          >
            <Calendar
              mode="range"
              selected={selectedRange}
              onSelect={handleCustomDateSelect}
              numberOfMonths={2}
              className="pointer-events-auto"
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filter Chip */}
      {hasActiveFilter && (
        <Badge 
          variant="secondary" 
          className="h-8 px-3 py-1 text-xs font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-colors"
        >
          <CalendarIcon className="h-3 w-3 mr-1.5" />
          {formatDateRange()}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-auto p-0 ml-1.5 hover:bg-transparent"
          >
            <X className="h-3 w-3 text-primary/70 hover:text-primary" />
          </Button>
        </Badge>
      )}
    </div>
  );
}
