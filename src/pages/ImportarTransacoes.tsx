import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ImportFileSelector } from '@/components/transactions/import/ImportFileSelector';
import { TransactionSelectionTable } from '@/components/transactions/import/TransactionSelectionTable';
import { AICategorizationResults } from '@/components/transactions/import/AICategorizationResults';
import { ImportConfirmation } from '@/components/transactions/import/ImportConfirmation';
import { useImportWizard } from '@/hooks/useImportWizard';
import { useTransactionCategorization } from '@/hooks/useTransactionCategorization';
import { useCategories } from '@/hooks/useCategories';

export default function ImportarTransacoes() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { categories } = useCategories();
  
  const {
    state,
    setStep,
    setFile,
    setSourceAccount,
    setAllTransactions,
    setSelectedTransactionIds,
    setCategorizedTransactions,
    setIsProcessing,
    setErrors,
    setImportType,
    updateTransactionDate,
    reset
  } = useImportWizard();

  const {
    categorizeTransactions,
    isProcessing: isCategorizingAI,
    error: categorizationError
  } = useTransactionCategorization();

  const [importSuccess, setImportSuccess] = useState(false);

  useEffect(() => {
    if (categorizationError) {
      setErrors([categorizationError]);
    }
  }, [categorizationError, setErrors]);

  const handleBack = () => {
    if (state.step === 'file-selection') {
      navigate('/lancamentos');
    } else if (state.step === 'transaction-selection') {
      setStep('file-selection');
    } else if (state.step === 'ai-categorization') {
      setStep('transaction-selection');
    } else if (state.step === 'confirmation') {
      setStep('ai-categorization');
    }
  };

  const handleAICategorization = async () => {
    if (!state.selectedTransactionIds.length) {
      toast({
        title: "Nenhuma transação selecionada",
        description: "Selecione pelo menos uma transação para categorizar.",
        variant: "destructive",
      });
      return;
    }

    const selectedTransactions = state.allTransactions.filter(t => 
      state.selectedTransactionIds.includes(t.index.toString())
    );

    setIsProcessing(true);
    setErrors([]);

    try {
      const result = await categorizeTransactions(selectedTransactions, categories);
      
      if (result.success && result.categorized_transactions) {
        setCategorizedTransactions(result.categorized_transactions);
        setStep('ai-categorization');
        
        toast({
          title: "Categorização concluída",
          description: `${result.categorized_transactions.length} transações foram categorizadas pela IA.`,
        });
      } else {
        throw new Error(result.error || 'Erro na categorização');
      }
    } catch (error: any) {
      setErrors([error.message || 'Erro ao categorizar transações']);
      toast({
        title: "Erro na categorização",
        description: "Não foi possível categorizar as transações. Você pode importar sem categorização.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportComplete = () => {
    setImportSuccess(true);
    toast({
      title: "Importação concluída",
      description: "As transações foram importadas com sucesso!",
    });
  };

  const getStepNumber = () => {
    switch (state.step) {
      case 'file-selection': return 1;
      case 'transaction-selection': return 2;
      case 'ai-categorization': return 3;
      case 'confirmation': return 4;
      default: return 1;
    }
  };

  const getStepTitle = () => {
    switch (state.step) {
      case 'file-selection': return 'Selecionar Arquivo e Conta';
      case 'transaction-selection': return 'Selecionar Transações';
      case 'ai-categorization': return 'Categorização com IA';
      case 'confirmation': return 'Confirmar e Importar';
      default: return 'Importar Transações';
    }
  };

  if (importSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="mb-4 flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Importação Concluída!</h2>
            <p className="text-muted-foreground mb-6">
              Suas transações foram importadas com sucesso.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/lancamentos')} 
                className="w-full"
              >
                Ver Lançamentos
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  reset();
                  setImportSuccess(false);
                }} 
                className="w-full"
              >
                Nova Importação
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Importar Transações</h1>
              <p className="text-muted-foreground">
                {getStepTitle()}
              </p>
            </div>
          </div>
          
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Etapa {getStepNumber()} de 4</span>
              <span>{Math.round((getStepNumber() / 4) * 100)}%</span>
            </div>
            <Progress value={(getStepNumber() / 4) * 100} className="h-2" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Error Display */}
          {state.errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-red-800 font-medium mb-2">Erros encontrados:</h3>
              <ul className="text-red-600 text-sm space-y-1">
                {state.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Step Content */}
          <Card>
            <CardHeader>
              <CardTitle>{getStepTitle()}</CardTitle>
            </CardHeader>
            <CardContent>
              {state.step === 'file-selection' && (
                <ImportFileSelector
                  file={state.file}
                  sourceAccount={state.sourceAccount}
                  importType={state.importType}
                  onFileChange={setFile}
                  onSourceAccountChange={setSourceAccount}
                  onImportTypeChange={setImportType}
                  onTransactionsLoaded={(transactions) => {
                    setAllTransactions(transactions);
                    setSelectedTransactionIds(transactions.map(t => t.index.toString()));
                    setStep('transaction-selection');
                  }}
                  isProcessing={state.isProcessing}
                  onProcessingChange={setIsProcessing}
                  onError={(error) => setErrors([error])}
                />
              )}

              {state.step === 'transaction-selection' && (
                <TransactionSelectionTable
                  transactions={state.allTransactions}
                  selectedTransactionIds={state.selectedTransactionIds}
                  onSelectionChange={setSelectedTransactionIds}
                  onProcessWithAI={handleAICategorization}
                  onImportSelected={() => setStep('confirmation')}
                  isProcessingAI={isCategorizingAI || state.isProcessing}
                  editedDates={state.editedDates}
                  onDateChange={updateTransactionDate}
                />
              )}

              {state.step === 'ai-categorization' && (
                <AICategorizationResults
                  categorizedTransactions={state.categorizedTransactions}
                  onCategorizedTransactionsChange={setCategorizedTransactions}
                  onProceedToImport={() => setStep('confirmation')}
                />
              )}

              {state.step === 'confirmation' && (
                <ImportConfirmation
                  transactions={state.categorizedTransactions.length > 0 
                    ? state.categorizedTransactions 
                    : state.allTransactions.filter(t => 
                        state.selectedTransactionIds.includes(t.index.toString())
                      )}
                  sourceAccount={state.sourceAccount}
                  onImportComplete={handleImportComplete}
                  isProcessing={state.isProcessing}
                  onProcessingChange={setIsProcessing}
                  onError={(error) => setErrors([error])}
                  editedDates={state.editedDates}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}