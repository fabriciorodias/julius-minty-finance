
import React from 'react';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, subMonths, subDays } from 'date-fns';

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
    onDateRangeSelect(start, end);
  };

  const isActive = (startDate: Date, endDate: Date) => {
    const start = format(startDate, 'yyyy-MM-dd');
    const end = format(endDate, 'yyyy-MM-dd');
    return currentStartDate === start && currentEndDate === end;
  };

  return (
    <div className="flex flex-wrap gap-2">
      {dateRanges.map((range) => (
        <Button
          key={range.label}
          variant={isActive(range.startDate, range.endDate) ? "default" : "outline"}
          size="sm"
          onClick={() => handleRangeSelect(range.startDate, range.endDate)}
        >
          {range.label}
        </Button>
      ))}
    </div>
  );
}
