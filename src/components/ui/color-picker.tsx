import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { QUICK_COLORS } from '@/lib/bank-presets';
import { Check, Pipette } from 'lucide-react';

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function ColorPicker({ 
  value = '', 
  onChange, 
  label,
  placeholder = '#000000',
  className 
}: ColorPickerProps) {
  const [localValue, setLocalValue] = React.useState(value);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    
    // Adiciona # se não começar com #
    if (newValue && !newValue.startsWith('#')) {
      newValue = '#' + newValue;
    }
    
    setLocalValue(newValue);
    
    // Só atualiza o valor pai se for uma cor válida
    if (isValidHexColor(newValue)) {
      onChange(newValue);
    }
  };

  const handleColorSelect = (color: string) => {
    setLocalValue(color);
    onChange(color);
    setIsOpen(false);
  };

  const isValidHexColor = (color: string) => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  };

  const displayColor = isValidHexColor(localValue) ? localValue : '#CCCCCC';

  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label>{label}</Label>}
      <div className="flex gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-10 h-9 p-0 border-2"
              style={{ backgroundColor: displayColor }}
            >
              <span className="sr-only">Escolher cor</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Pipette className="h-4 w-4" />
                Cores rápidas
              </div>
              <div className="grid grid-cols-5 gap-2">
                {QUICK_COLORS.map((quickColor) => (
                  <button
                    key={quickColor.color}
                    type="button"
                    className={cn(
                      'w-8 h-8 rounded-md border-2 transition-all hover:scale-110',
                      localValue === quickColor.color 
                        ? 'border-foreground ring-2 ring-offset-2 ring-primary' 
                        : 'border-border'
                    )}
                    style={{ backgroundColor: quickColor.color }}
                    onClick={() => handleColorSelect(quickColor.color)}
                    title={quickColor.name}
                  >
                    {localValue === quickColor.color && (
                      <Check className="h-4 w-4 text-white mx-auto" />
                    )}
                  </button>
                ))}
              </div>
              <div className="pt-2 border-t">
                <Label className="text-xs text-muted-foreground">
                  Ou digite um código hex:
                </Label>
                <Input
                  type="text"
                  value={localValue}
                  onChange={handleInputChange}
                  placeholder={placeholder}
                  className="mt-1 font-mono text-sm"
                  maxLength={7}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        <Input
          type="text"
          value={localValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="flex-1 font-mono"
          maxLength={7}
        />
      </div>
      
      {localValue && !isValidHexColor(localValue) && (
        <p className="text-xs text-destructive">
          Formato inválido. Use #RRGGBB (ex: #FF5500)
        </p>
      )}
    </div>
  );
}
