
import { useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
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
import { Category } from '@/hooks/useCategories';

interface CategoryParentComboboxProps {
  value: string | null;
  onValueChange: (value: string | null) => void;
  categories: Category[];
  type: 'receita' | 'despesa';
  currentCategoryId?: string;
}

export function CategoryParentCombobox({
  value,
  onValueChange,
  categories,
  type,
  currentCategoryId,
}: CategoryParentComboboxProps) {
  const [open, setOpen] = useState(false);

  const parentCategories = categories.filter(
    cat => 
      cat.type === type && 
      !cat.parent_id && 
      cat.id !== currentCategoryId &&
      cat.is_active
  );

  const selectedCategory = parentCategories.find(cat => cat.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedCategory ? (
            <span className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                type === 'receita' ? 'bg-green-500' : 'bg-red-500'
              }`} />
              {selectedCategory.name}
            </span>
          ) : (
            <span className="text-muted-foreground">
              Nenhuma (categoria principal)
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput 
            placeholder={`Buscar categoria de ${type}...`}
            className="h-9"
          />
          <CommandList>
            <CommandEmpty>Nenhuma categoria encontrada.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="none"
                onSelect={() => {
                  onValueChange(null);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    !value ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="text-muted-foreground">
                  Nenhuma (categoria principal)
                </span>
              </CommandItem>
              {parentCategories.map((category) => (
                <CommandItem
                  key={category.id}
                  value={category.name}
                  onSelect={() => {
                    onValueChange(category.id === value ? null : category.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === category.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      type === 'receita' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    {category.name}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
