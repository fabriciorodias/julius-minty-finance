import React, { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCategories } from '@/hooks/useCategories';

interface CategoryEditDropdownProps {
  selectedCategoryId: string;
  onCategoryChange: (categoryId: string, categoryName: string) => void;
  transactionType: 'receita' | 'despesa';
}

export function CategoryEditDropdown({
  selectedCategoryId,
  onCategoryChange,
  transactionType
}: CategoryEditDropdownProps) {
  const { categories } = useCategories();

  // Flatten categories for the dropdown, filtered by transaction type
  const flatCategories = useMemo(() => {
    const result: Array<{ id: string; name: string; fullName: string }> = [];
    
    categories
      .filter(category => category.type === transactionType)
      .forEach(category => {
        // Add parent category
        result.push({
          id: category.id,
          name: category.name,
          fullName: category.name
        });
        
        // Add subcategories
        if (category.subcategories) {
          category.subcategories.forEach(subcat => {
            result.push({
              id: subcat.id,
              name: subcat.name,
              fullName: `${category.name} > ${subcat.name}`
            });
          });
        }
      });
    
    return result;
  }, [categories, transactionType]);

  const handleCategoryChange = (categoryId: string) => {
    if (categoryId === 'none') {
      onCategoryChange('', '');
      return;
    }
    
    const category = flatCategories.find(cat => cat.id === categoryId);
    if (category) {
      onCategoryChange(category.id, category.fullName);
    }
  };

  return (
    <Select value={selectedCategoryId || 'none'} onValueChange={handleCategoryChange}>
      <SelectTrigger className="h-8 text-xs">
        <SelectValue placeholder="Alterar categoria" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="text-muted-foreground">Sem categoria</span>
        </SelectItem>
        {flatCategories.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            {category.fullName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}