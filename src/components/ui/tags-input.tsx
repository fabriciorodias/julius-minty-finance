
import React, { useState, useRef, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  suggestions?: string[];
  onCreateTag?: (tagName: string) => Promise<void>;
  maxTags?: number;
}

export function TagsInput({
  value = [],
  onChange,
  placeholder = "Digite uma tag e pressione Enter...",
  className,
  disabled = false,
  suggestions = [],
  onCreateTag,
  maxTags,
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = suggestions.filter(
    suggestion => 
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.includes(suggestion)
  );

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      await addTag(inputValue.trim());
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const addTag = async (tagName: string) => {
    if (maxTags && value.length >= maxTags) {
      return;
    }

    if (!value.includes(tagName)) {
      // Se há uma função para criar tag e a tag não existe nas sugestões
      if (onCreateTag && !suggestions.includes(tagName)) {
        try {
          await onCreateTag(tagName);
        } catch (error) {
          console.error('Error creating tag:', error);
          return;
        }
      }
      
      onChange([...value, tagName]);
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const selectSuggestion = (suggestion: string) => {
    addTag(suggestion);
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative", className)}>
      <div className="flex flex-wrap items-center gap-1 p-2 border rounded-md min-h-[40px] focus-within:ring-2 focus-within:ring-ring">
        {value.map((tag, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="flex items-center gap-1 px-2 py-1"
          >
            <span className="text-sm">{tag}</span>
            {!disabled && (
              <button
                onClick={() => removeTag(tag)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        
        {(!maxTags || value.length < maxTags) && (
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(e.target.value.length > 0);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(inputValue.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={value.length === 0 ? placeholder : ""}
            disabled={disabled}
            className="border-0 shadow-none focus-visible:ring-0 flex-1 min-w-[120px] p-0"
          />
        )}
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-48 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => selectSuggestion(suggestion)}
              className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm"
              type="button"
            >
              {suggestion}
            </button>
          ))}
          
          {onCreateTag && inputValue.trim() && !suggestions.includes(inputValue.trim()) && (
            <button
              onClick={() => addTag(inputValue.trim())}
              className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm border-t flex items-center gap-2"
              type="button"
            >
              <Plus className="h-4 w-4" />
              Criar "{inputValue.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}
