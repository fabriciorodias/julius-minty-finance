import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { NotionButton } from '@/components/ui/notion-button';
import { NotionCard } from '@/components/ui/notion-card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDeleteTransactions } from '@/hooks/useDeleteTransactions';
import { DuplicateGroup } from '@/hooks/useFindDuplicates';
import { toast } from '@/hooks/use-toast';

interface DuplicateReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicateGroups: DuplicateGroup[];
  onComplete: () => void;
}

export function DuplicateReviewModal({
  isOpen,
  onClose,
  duplicateGroups,
  onComplete,
}: DuplicateReviewModalProps) {
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processedGroups, setProcessedGroups] = useState(0);
  const [totalDeleted, setTotalDeleted] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const { deleteTransactions } = useDeleteTransactions();

  const currentGroup = duplicateGroups[currentGroupIndex];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleToggleTransaction = (txId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(txId)) {
      newSelected.delete(txId);
    } else {
      newSelected.add(txId);
    }
    setSelectedIds(newSelected);
  };

  const handleNext = async () => {
    if (selectedIds.size > 0) {
      // Excluir transações selecionadas
      const result = await deleteTransactions(Array.from(selectedIds));
      if (result.success) {
        setTotalDeleted(prev => prev + selectedIds.size);
      }
    }

    setProcessedGroups(prev => prev + 1);
    setSelectedIds(new Set());

    if (currentGroupIndex < duplicateGroups.length - 1) {
      setCurrentGroupIndex(prev => prev + 1);
    } else {
      // Completou a revisão
      setIsComplete(true);
    }
  };

  const handlePrevious = () => {
    if (currentGroupIndex > 0) {
      setCurrentGroupIndex(prev => prev - 1);
      setSelectedIds(new Set());
    }
  };

  const handleKeepAll = () => {
    setSelectedIds(new Set());
    setProcessedGroups(prev => prev + 1);
    
    if (currentGroupIndex < duplicateGroups.length - 1) {
      setCurrentGroupIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleFinish = () => {
    onComplete();
    onClose();
    if (totalDeleted > 0) {
      toast({
        title: "Duplicatas removidas!",
        description: `${totalDeleted} lançamento(s) duplicado(s) foram excluídos.`,
      });
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
  };

  if (isComplete) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Revisão Completa</DialogTitle>
            <DialogDescription>
              Resumo da análise de duplicatas
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-full">
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Tudo certo!</h3>
              <p className="text-sm text-muted-foreground">
                {processedGroups} grupo(s) revisado(s)
              </p>
              {totalDeleted > 0 && (
                <p className="text-sm text-muted-foreground">
                  {totalDeleted} duplicata(s) excluída(s)
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <NotionButton onClick={handleFinish}>
              Concluir
            </NotionButton>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!currentGroup) return null;

  const canDeleteAll = currentGroup.transactions.length > selectedIds.size + 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Revisar Duplicatas</DialogTitle>
            <Badge variant="outline">
              Grupo {currentGroupIndex + 1} de {duplicateGroups.length}
            </Badge>
          </div>
          <DialogDescription>
            Selecione os lançamentos duplicados para excluir
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informações do grupo */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="flex items-center gap-1">
              🏦 {currentGroup.account_name}
            </Badge>
            <Badge className={getConfidenceColor(currentGroup.confidence)}>
              Confiança: {currentGroup.confidence}%
            </Badge>
            <Badge variant="outline">
              {currentGroup.days_apart} dias de diferença
            </Badge>
          </div>

          {/* Lista de transações */}
          <div className="space-y-3">
            {currentGroup.transactions.map((tx) => (
              <NotionCard
                key={tx.id}
                className={`cursor-pointer transition-all ${
                  selectedIds.has(tx.id)
                    ? 'border-destructive bg-destructive/5'
                    : 'hover:border-border'
                }`}
                onClick={() => handleToggleTransaction(tx.id)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedIds.has(tx.id)}
                    onCheckedChange={() => handleToggleTransaction(tx.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <div className="font-medium text-sm truncate">
                        {format(parseISO(tx.event_date), 'dd/MM/yyyy', { locale: ptBR })} • {tx.description}
                      </div>
                      <div className="font-semibold text-sm whitespace-nowrap">
                        {formatCurrency(tx.amount)}
                      </div>
                    </div>
                    <div className="flex gap-2 text-xs text-muted-foreground flex-wrap">
                      {tx.category_name && (
                        <span>📂 {tx.category_name}</span>
                      )}
                      {tx.counterparty_name && (
                        <span>👤 {tx.counterparty_name}</span>
                      )}
                    </div>
                  </div>
                </div>
              </NotionCard>
            ))}
          </div>

          {/* Dica */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Dica:</strong> Selecione os lançamentos duplicados que deseja excluir.
              Geralmente, o mais recente ou importado é o correto. Ao menos um lançamento deve permanecer.
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center justify-between pt-4 border-t">
          <NotionButton
            variant="ghost"
            onClick={handleKeepAll}
          >
            Manter Todos
          </NotionButton>

          <div className="flex items-center gap-2">
            <NotionButton
              variant="outline"
              onClick={handlePrevious}
              disabled={currentGroupIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </NotionButton>

            <NotionButton
              onClick={handleNext}
              disabled={!canDeleteAll && selectedIds.size > 0}
              title={!canDeleteAll && selectedIds.size > 0 ? 'Ao menos um lançamento deve permanecer' : ''}
            >
              {selectedIds.size > 0 ? (
                <>
                  Excluir ({selectedIds.size})
                  {currentGroupIndex < duplicateGroups.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
                </>
              ) : (
                <>
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </NotionButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
