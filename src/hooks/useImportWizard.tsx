import { useState } from 'react';

export interface PreviewTransaction {
  index: number;
  description: string;
  amount: number;
  date: string;
  editedDate?: string; // Para armazenar data editada pelo usuário
  hasDateIssue?: boolean; // Para marcar transações com datas suspeitas
}

export interface CategorizedTransaction extends PreviewTransaction {
  category_id?: string;
  category_name?: string;
  confidence?: number;
}

export interface ImportState {
  step: 'file-selection' | 'transaction-selection' | 'ai-categorization' | 'confirmation';
  importType: 'file' | 'image';
  file: File | null;
  sourceAccount: string;
  allTransactions: PreviewTransaction[];
  selectedTransactionIds: string[];
  categorizedTransactions: CategorizedTransaction[];
  isProcessing: boolean;
  errors: string[];
  extractedText?: string;
  editedDates: { [transactionIndex: string]: string }; // Para armazenar datas editadas
}

export function useImportWizard() {
  const [state, setState] = useState<ImportState>({
    step: 'file-selection',
    importType: 'file',
    file: null,
    sourceAccount: '',
    allTransactions: [],
    selectedTransactionIds: [],
    categorizedTransactions: [],
    isProcessing: false,
    errors: [],
    editedDates: {},
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

  const setImportType = (importType: 'file' | 'image') => {
    setState(prev => ({ ...prev, importType }));
  };

  const setExtractedText = (extractedText?: string) => {
    setState(prev => ({ ...prev, extractedText }));
  };

  const setEditedDates = (editedDates: { [transactionIndex: string]: string }) => {
    setState(prev => ({ ...prev, editedDates }));
  };

  const updateTransactionDate = (transactionIndex: string, newDate: string) => {
    setState(prev => ({
      ...prev,
      editedDates: {
        ...prev.editedDates,
        [transactionIndex]: newDate
      }
    }));
  };

  const reset = () => {
    setState({
      step: 'file-selection',
      importType: 'file',
      file: null,
      sourceAccount: '',
      allTransactions: [],
      selectedTransactionIds: [],
      categorizedTransactions: [],
      isProcessing: false,
      errors: [],
      editedDates: {},
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
    setImportType,
    setExtractedText,
    setEditedDates,
    updateTransactionDate,
    reset,
  };
}