
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TransactionTag {
  name: string;
  color: string | null;
}

interface TransactionTagsProps {
  tags: TransactionTag[];
  className?: string;
  maxVisible?: number;
  onTagClick?: (tagName: string) => void;
}

export function TransactionTags({ tags, className, maxVisible = 3, onTagClick }: TransactionTagsProps) {
  if (!tags || tags.length === 0) {
    return null;
  }

  const visibleTags = tags.slice(0, maxVisible);
  const remainingCount = tags.length - maxVisible;

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {visibleTags.map((tag, index) => (
        <Badge
          key={index}
          variant="outline"
          className={cn(
            "text-xs px-2 py-0.5",
            onTagClick && "cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
          )}
          style={tag.color ? { 
            borderColor: tag.color, 
            color: tag.color,
            backgroundColor: `${tag.color}10`
          } : undefined}
          onClick={onTagClick ? () => onTagClick(tag.name) : undefined}
        >
          {tag.name}
        </Badge>
      ))}
      
      {remainingCount > 0 && (
        <Badge variant="outline" className="text-xs px-2 py-0.5 text-muted-foreground">
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
}
