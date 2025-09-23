import { useState } from 'react';

export interface PreviewTransaction {
  index: number;
  description: string;
  amount: number;
  date: string;
}

export interface CategorizedTransaction extends PreviewTransaction {
  category_id?: string;
  category_name?: string;
  confidence?: number;
}

export interface ImportState {
  step: 'file-selection' | 'transaction-selection' | 'ai-categorization' | 'confirmation';
  file: File | null;
  sourceAccount: string;
  allTransactions: PreviewTransaction[];
  selectedTransactionIds: string[];
  categorizedTransactions: CategorizedTransaction[];
  isProcessing: boolean;
  errors: string[];
}

export function useImportWizard() {
  const [state, setState] = useState<ImportState>({
    step: 'file-selection',
    file: null,
    sourceAccount: '',
    allTransactions: [],
    selectedTransactionIds: [],
    categorizedTransactions: [],
    isProcessing: false,
    errors: [],
  });

  const setStep = (step: ImportState['step']) => {
    setState(prev => ({ ...prev, step }));
  };

  const setFile = (file: File | null) => {
    setState(prev => ({ ...prev, file }));
  };

  const setSourceAccount = (sourceAccount: string) => {
    setState(prev => ({ ...prev, sourceAccount }));
  };

  const setAllTransactions = (allTransactions: PreviewTransaction[]) => {
    setState(prev => ({ ...prev, allTransactions }));
  };

  const setSelectedTransactionIds = (selectedTransactionIds: string[]) => {
    setState(prev => ({ ...prev, selectedTransactionIds }));
  };

  const setCategorizedTransactions = (categorizedTransactions: CategorizedTransaction[]) => {
    setState(prev => ({ ...prev, categorizedTransactions }));
  };

  const setIsProcessing = (isProcessing: boolean) => {
    setState(prev => ({ ...prev, isProcessing }));
  };

  const setErrors = (errors: string[]) => {
    setState(prev => ({ ...prev, errors }));
  };

  const reset = () => {
    setState({
      step: 'file-selection',
      file: null,
      sourceAccount: '',
      allTransactions: [],
      selectedTransactionIds: [],
      categorizedTransactions: [],
      isProcessing: false,
      errors: [],
    });
  };

  return {
    state,
    setStep,
    setFile,
    setSourceAccount,
    setAllTransactions,
    setSelectedTransactionIds,
    setCategorizedTransactions,
    setIsProcessing,
    setErrors,
    reset,
  };
}