
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Tags, Settings } from 'lucide-react';
import { useTags } from '@/hooks/useTags';
import { TagsManagerModal } from './TagsManagerModal';
import { cn } from '@/lib/utils';

interface TagsFilterProps {
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
  className?: string;
}

export function TagsFilter({ selectedTagIds, onTagsChange, className }: TagsFilterProps) {
  const { tags, isLoading } = useTags();
  const [isManagerOpen, setIsManagerOpen] = useState(false);

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
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Tags className="h-4 w-4" />
              Tags
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsManagerOpen(true)}
              className="h-6 px-2 text-xs"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-muted-foreground text-center py-4">
            Nenhuma tag criada ainda
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsManagerOpen(true)}
            className="w-full"
          >
            Criar Tags
          </Button>
        </CardContent>
        
        <TagsManagerModal
          isOpen={isManagerOpen}
          onClose={() => setIsManagerOpen(false)}
        />
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Tags className="h-4 w-4" />
              Filtrar por Tags
            </CardTitle>
            <div className="flex items-center gap-1">
              {selectedTagIds.length > 0 && (
                <button
                  onClick={clearAllTags}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Limpar
                </button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsManagerOpen(true)}
                className="h-6 px-2 text-xs"
              >
                <Settings className="h-3 w-3" />
              </Button>
            </div>
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

      <TagsManagerModal
        isOpen={isManagerOpen}
        onClose={() => setIsManagerOpen(false)}
      />
    </>
  );
}
