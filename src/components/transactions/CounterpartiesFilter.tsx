
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCounterparties } from '@/hooks/useCounterparties';

interface CounterpartiesFilterProps {
  selectedCounterpartyId?: string;
  onCounterpartyChange: (counterpartyId?: string) => void;
}

export function CounterpartiesFilter({ 
  selectedCounterpartyId, 
  onCounterpartyChange 
}: CounterpartiesFilterProps) {
  const { counterparties, isLoading } = useCounterparties();

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Favorecido/Devedor</Label>
      <Select
        value={selectedCounterpartyId || ""}
        onValueChange={(value) => onCounterpartyChange(value === "all" ? undefined : value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Todos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="none">Sem contraparte</SelectItem>
          {counterparties.map((counterparty) => (
            <SelectItem key={counterparty.id} value={counterparty.id}>
              {counterparty.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
