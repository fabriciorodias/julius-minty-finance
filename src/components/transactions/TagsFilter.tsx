
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Tags } from 'lucide-react';
import { useTags } from '@/hooks/useTags';
import { cn } from '@/lib/utils';

interface TagsFilterProps {
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  className?: string;
}

export function TagsFilter({ selectedTagIds, onTagsChange, className }: TagsFilterProps) {
  const { tags, isLoading } = useTags();

  const handleTagToggle = (tagName: string) => {
    if (selectedTagIds.includes(tagName)) {
      onTagsChange(selectedTagIds.filter(id => id !== tagName));
    } else {
      onTagsChange([...selectedTagIds, tagName]);
    }
  };

  const clearAllTags = () => {
    onTagsChange([]);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tags.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Tags className="h-4 w-4" />
            Filtrar por Tags
          </CardTitle>
          {selectedTagIds.length > 0 && (
            <button
              onClick={clearAllTags}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Limpar
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const isSelected = selectedTagIds.includes(tag.name);
            return (
              <Badge
                key={tag.id}
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-colors hover:bg-primary/80",
                  isSelected && "bg-primary text-primary-foreground"
                )}
                style={tag.color && !isSelected ? { 
                  borderColor: tag.color, 
                  color: tag.color,
                  backgroundColor: `${tag.color}10`
                } : undefined}
                onClick={() => handleTagToggle(tag.name)}
              >
                {tag.name}
                {isSelected && (
                  <X className="ml-1 h-3 w-3" />
                )}
              </Badge>
            );
          })}
        </div>
        
        {selectedTagIds.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              {selectedTagIds.length} tag{selectedTagIds.length > 1 ? 's' : ''} selecionada{selectedTagIds.length > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
