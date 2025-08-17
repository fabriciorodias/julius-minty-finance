
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Tags, Settings, Search } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');

  // Filter tags by search term
  const filteredTags = useMemo(() => {
    if (!searchTerm) return tags;
    return tags.filter(tag => 
      tag.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tags, searchTerm]);

  // Get recent tags (last 5 selected)
  const recentTags = useMemo(() => {
    return tags
      .filter(tag => selectedTagIds.includes(tag.name))
      .slice(0, 5);
  }, [tags, selectedTagIds]);

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
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
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
              className="h-6 px-2 text-xs hover:bg-muted/50"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-muted-foreground text-center py-6">
            Nenhuma tag criada ainda
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsManagerOpen(true)}
            className="w-full hover:bg-muted/50"
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
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Tags className="h-4 w-4" />
              Filtrar por Tags
              {selectedTagIds.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectedTagIds.length}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsManagerOpen(true)}
                className="h-6 px-2 text-xs hover:bg-muted/50"
              >
                <Settings className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              placeholder="Buscar tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-4">
          {/* Clear All Button - Always visible when there are selections */}
          {selectedTagIds.length > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {selectedTagIds.length} selecionada{selectedTagIds.length > 1 ? 's' : ''}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllTags}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                <X className="h-3 w-3 mr-1" />
                Limpar
              </Button>
            </div>
          )}

          {/* Recent Tags */}
          {recentTags.length > 0 && !searchTerm && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Recentes
              </h4>
              <div className="flex flex-wrap gap-1">
                {recentTags.map((tag) => (
                  <Badge
                    key={`recent-${tag.id}`}
                    variant="secondary"
                    className="cursor-pointer transition-all hover:scale-105 bg-primary/10 text-primary border-primary/20"
                    onClick={() => handleTagToggle(tag.name)}
                  >
                    <div 
                      className="w-2 h-2 rounded-full mr-1.5" 
                      style={{ backgroundColor: tag.color || '#6b7280' }}
                    />
                    {tag.name}
                    <X className="ml-1 h-3 w-3" />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* All Tags */}
          <div className="space-y-2">
            {!searchTerm && recentTags.length > 0 && (
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Todas
              </h4>
            )}
            <div className="flex flex-wrap gap-1.5">
              {filteredTags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.name);
                const isRecent = recentTags.some(recent => recent.id === tag.id);
                
                return (
                  <Badge
                    key={tag.id}
                    variant={isSelected ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/20",
                      isSelected && "bg-primary text-primary-foreground shadow-sm",
                      !isSelected && "hover:bg-muted/60 hover:border-muted-foreground/40",
                      isRecent && !searchTerm && "opacity-50" // Show recent tags dimmed in main list
                    )}
                    style={tag.color && !isSelected ? { 
                      borderColor: `${tag.color}60`, 
                      color: tag.color,
                      backgroundColor: `${tag.color}08`
                    } : undefined}
                    onClick={() => handleTagToggle(tag.name)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleTagToggle(tag.name);
                      }
                    }}
                    tabIndex={0}
                  >
                    <div 
                      className="w-2 h-2 rounded-full mr-1.5" 
                      style={{ backgroundColor: tag.color || '#6b7280' }}
                    />
                    {tag.name}
                    {isSelected && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                );
              })}
            </div>

            {/* No results */}
            {searchTerm && filteredTags.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-4">
                Nenhuma tag encontrada
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <TagsManagerModal
        isOpen={isManagerOpen}
        onClose={() => setIsManagerOpen(false)}
      />
    </>
  );
}
