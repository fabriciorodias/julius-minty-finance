import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Brain, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { Transaction } from '@/hooks/useTransactions';
import { Category } from '@/hooks/useCategories';
import { useExistingTransactionCategorization } from '@/hooks/useExistingTransactionCategorization';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CategorizationSuggestion {
  transaction_id: string;
  transaction: Transaction;
  category_id: string;
  category_name: string;
  confidence: number;
  selected: boolean;
}

interface AICategorizeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: Transaction[];
  categories: Category[];
  onApplyCategorizations: (categorizations: { transaction_id: string; category_id: string }[]) => void;
}

export function AICategorizeModal({
  open,
  onOpenChange,
  transactions,
  categories,
  onApplyCategorizations,
}: AICategorizeModalProps) {
  const [suggestions, setSuggestions] = useState<CategorizationSuggestion[]>([]);
  const [hasProcessed, setHasProcessed] = useState(false);
  const { categorizeTransactions, isProcessing, error } = useExistingTransactionCategorization();

  // Process transactions when modal opens
  useEffect(() => {
    if (open && transactions.length > 0 && !hasProcessed) {
      processCategorizations();
    }
  }, [open, transactions, hasProcessed]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSuggestions([]);
      setHasProcessed(false);
    }
  }, [open]);

  const processCategorizations = async () => {
    try {
      const result = await categorizeTransactions(transactions, categories);
      
      if (result.success && result.categorized_transactions) {
        const newSuggestions = result.categorized_transactions.map(cat => {
          const transaction = transactions.find(t => t.id === cat.transaction_id);
          return {
            transaction_id: cat.transaction_id,
            transaction: transaction!,
            category_id: cat.category_id,
            category_name: cat.category_name,
            confidence: cat.confidence,
            selected: cat.confidence >= 0.6, // Auto-select medium and high confidence
          };
        }).filter(s => s.transaction); // Filter out any missing transactions

        setSuggestions(newSuggestions);
      }
      setHasProcessed(true);
    } catch (err) {
      console.error('Error processing categorizations:', err);
      setHasProcessed(true);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSuggestions(prev => 
      prev.map(s => ({ ...s, selected: checked }))
    );
  };

  const handleSelectSuggestion = (transactionId: string, checked: boolean) => {
    setSuggestions(prev =>
      prev.map(s => 
        s.transaction_id === transactionId 
          ? { ...s, selected: checked }
          : s
      )
    );
  };

  const handleCategoryChange = (transactionId: string, categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    setSuggestions(prev =>
      prev.map(s => 
        s.transaction_id === transactionId 
          ? { 
              ...s, 
              category_id: categoryId,
              category_name: category?.name || '',
              confidence: 1.0 // Manual selection gets max confidence
            }
          : s
      )
    );
  };

  const handleApply = () => {
    const selectedCategorizations = suggestions
      .filter(s => s.selected)
      .map(s => ({
        transaction_id: s.transaction_id,
        category_id: s.category_id
      }));

    onApplyCategorizations(selectedCategorizations);
    onOpenChange(false);
  };

  const selectedCount = suggestions.filter(s => s.selected).length;
  const allSelected = suggestions.length > 0 && suggestions.every(s => s.selected);
  const someSelected = suggestions.some(s => s.selected);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Categorização por IA
          </DialogTitle>
          <DialogDescription>
            A IA analisou {transactions.length} transação{transactions.length !== 1 ? 'ões' : ''} e sugeriu categorizações.
            Revise e ajuste conforme necessário antes de aplicar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isProcessing && !hasProcessed && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">
                  Processando transações com IA...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <AlertTriangle className="h-8 w-8 mx-auto text-destructive" />
                <div>
                  <p className="font-medium text-destructive">Erro no processamento</p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
                <Button onClick={processCategorizations} variant="outline" size="sm">
                  Tentar novamente
                </Button>
              </div>
            </div>
          )}

          {hasProcessed && !error && suggestions.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <AlertTriangle className="h-8 w-8 mx-auto text-yellow-600" />
                <div>
                  <p className="font-medium">Nenhuma categorização sugerida</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    A IA não conseguiu sugerir categorias para essas transações.
                  </p>
                </div>
              </div>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="space-y-4">
              {/* Header with select all */}
              <div className="flex items-center justify-between pb-2 border-b">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm font-medium">
                    Selecionar todas ({suggestions.length})
                  </span>
                </div>
                {selectedCount > 0 && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {selectedCount} selecionada{selectedCount !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>

              {/* Suggestions list */}
              <ScrollArea className="max-h-96">
                <div className="space-y-3">
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion.transaction_id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <Checkbox
                        checked={suggestion.selected}
                        onCheckedChange={(checked) => 
                          handleSelectSuggestion(suggestion.transaction_id, !!checked)
                        }
                      />
                      
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                        {/* Transaction info */}
                        <div className="space-y-1">
                          <p className="font-medium text-sm">{suggestion.transaction.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatCurrency(suggestion.transaction.amount)}</span>
                            <span>•</span>
                            <span>
                              {format(parseISO(suggestion.transaction.event_date), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          </div>
                        </div>

                        {/* Category selection */}
                        <div className="space-y-1">
                          <Select
                            value={suggestion.category_id}
                            onValueChange={(value) => handleCategoryChange(suggestion.transaction_id, value)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Confidence indicator */}
                        <div className="flex justify-end">
                          <ConfidenceIndicator confidence={suggestion.confidence} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {selectedCount > 0 && (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                {selectedCount} categorização{selectedCount !== 1 ? 'ões' : ''} será aplicada
              </>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              onClick={handleApply} 
              disabled={selectedCount === 0}
              className="bg-primary hover:bg-primary/90"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Aplicar {selectedCount > 0 ? `(${selectedCount})` : ''}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}