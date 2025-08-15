
import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Edit } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface BulkActionsBarProps {
  selectedCount: number;
  onBulkDelete: () => void;
  onClearSelection: () => void;
}

export function BulkActionsBar({ selectedCount, onBulkDelete, onClearSelection }: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <Card className="p-4 mb-4 bg-blue-50 border-blue-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">
            {selectedCount} lançamento{selectedCount > 1 ? 's' : ''} selecionado{selectedCount > 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={onBulkDelete}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Excluir selecionados
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled
              className="flex items-center gap-2 opacity-50 cursor-not-allowed"
              title="Edição não disponível para múltiplos lançamentos"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onClearSelection}>
          Limpar seleção
        </Button>
      </div>
    </Card>
  );
}
