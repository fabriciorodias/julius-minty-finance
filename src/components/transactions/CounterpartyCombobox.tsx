
import React, { useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Counterparty } from '@/hooks/useCounterparties';

interface CounterpartyComboboxProps {
  value: string | null;
  onValueChange: (value: string | null) => void;
  counterparties: Counterparty[];
  onQuickCreate?: (name: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function CounterpartyCombobox({
  value,
  onValueChange,
  counterparties,
  onQuickCreate,
  disabled = false,
  placeholder = "Selecione um favorecido...",
}: CounterpartyComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedCounterparty = counterparties.find(
    (counterparty) => counterparty.id === value
  );

  const filteredCounterparties = counterparties.filter((counterparty) =>
    counterparty.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (counterpartyId: string) => {
    if (counterpartyId === value) {
      onValueChange(null);
    } else {
      onValueChange(counterpartyId);
    }
    setOpen(false);
  };

  const handleQuickCreate = () => {
    if (searchTerm.trim() && onQuickCreate) {
      onQuickCreate(searchTerm.trim());
      setSearchTerm('');
      setOpen(false);
    }
  };

  const showCreateOption = searchTerm.trim() && 
    !filteredCounterparties.some(c => c.name.toLowerCase() === searchTerm.toLowerCase()) &&
    onQuickCreate;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedCounterparty ? selectedCounterparty.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar favorecido..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>
              {searchTerm ? 'Nenhum favorecido encontrado.' : 'Nenhum favorecido cadastrado.'}
            </CommandEmpty>
            
            <CommandGroup>
              <CommandItem
                onSelect={() => handleSelect('')}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    !value ? "opacity-100" : "opacity-0"
                  )}
                />
                Nenhum favorecido
              </CommandItem>
              
              {filteredCounterparties.map((counterparty) => (
                <CommandItem
                  key={counterparty.id}
                  onSelect={() => handleSelect(counterparty.id)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === counterparty.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{counterparty.name}</span>
                    {counterparty.document && (
                      <span className="text-xs text-muted-foreground">
                        {counterparty.document}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
              
              {showCreateOption && (
                <CommandItem
                  onSelect={handleQuickCreate}
                  className="cursor-pointer text-blue-600"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar "{searchTerm}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
