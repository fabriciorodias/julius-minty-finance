
import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { useToast } from "@/components/ui/use-toast"
import { useAccounts } from '@/hooks/useAccounts';
import { useInstitutions } from '@/hooks/useInstitutions';
import { supabase } from '@/integrations/supabase/client';
import { TransactionImportPreview } from './TransactionImportPreview';
import { ArrowLeft } from 'lucide-react';

interface ImportTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface AccountOption {
  value: string;
  label: string;
  type: string;
}

interface PreviewTransaction {
  index: number;
  description: string;
  amount: number;
  date: string;
}

type Step = 'selection' | 'preview';

export function ImportTransactionsModal({ isOpen, onClose, onSuccess }: ImportTransactionsModalProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>('selection');
  const [previewTransactions, setPreviewTransactions] = useState<PreviewTransaction[]>([]);
  const [selectedStartIndex, setSelectedStartIndex] = useState(0);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  
  const { accounts } = useAccounts();
  const { institutions } = useInstitutions();
  const { toast } = useToast();

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<{ source_account_id: string; csv_file: File }>();

  const institutionMap = useMemo(() => 
    institutions.reduce((acc, institution) => {
      acc[institution.id] = institution.name;
      return acc;
    }, {} as Record<string, string>), 
  [institutions]);

  // Filter accounts to show only on_budget and credit accounts for importing transactions
  const sourceOptions = accounts
    .filter(account => account.type === 'on_budget' || account.type === 'credit')
    .map(account => ({
      value: account.id,
      label: `${institutionMap[account.institution_id] || 'Instituição'} - ${account.name}`,
      type: account.type
    }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setCsvFile(file);
      setValue('csv_file', file);
    }
  };

  const handleAccountSelect = (value: string) => {
    setSelectedAccountId(value);
    setValue('source_account_id', value);
  };

  const handlePreview = async () => {
    if (!csvFile || !selectedAccountId) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, selecione uma conta e um arquivo para continuar.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('mode', 'preview');
      formData.append('sourceId', selectedAccountId);

      const { data, error } = await supabase.functions.invoke('import-transactions', {
        body: formData,
      });

      if (error) throw error;

      if (data.success && data.transactions) {
        setPreviewTransactions(data.transactions);
        setSelectedStartIndex(0);
        setCurrentStep('preview');
      } else {
        throw new Error(data.error || 'Erro ao processar arquivo');
      }
    } catch (error) {
      console.error('Preview error:', error);
      toast({
        title: "Erro na prévia",
        description: error.message || "Não foi possível processar o arquivo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!csvFile || !selectedAccountId) return;

    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('mode', 'import');
      formData.append('sourceId', selectedAccountId);
      formData.append('startIndex', selectedStartIndex.toString());

      const { data, error } = await supabase.functions.invoke('import-transactions', {
        body: formData,
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Transações importadas",
          description: data.message || "As transações foram importadas com sucesso.",
        });
        
        onSuccess();
        handleClose();
      } else {
        throw new Error(data.error || 'Erro na importação');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Erro na importação",
        description: error.message || "Não foi possível importar as transações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep('selection');
    setPreviewTransactions([]);
    setSelectedStartIndex(0);
    setSelectedAccountId('');
    setCsvFile(null);
    reset();
    onClose();
  };

  const handleBackToSelection = () => {
    setCurrentStep('selection');
    setPreviewTransactions([]);
    setSelectedStartIndex(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-mint-text-primary font-bold flex items-center gap-2">
            {currentStep === 'preview' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToSelection}
                className="p-1 h-auto"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {currentStep === 'selection' ? 'Importar Transações via CSV' : 'Selecionar Transações'}
          </DialogTitle>
        </DialogHeader>

        {currentStep === 'selection' && (
          <form onSubmit={handleSubmit(handlePreview)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="source_account_id" className="text-mint-text-primary font-medium">
                Conta de Origem
              </Label>
              <Select onValueChange={handleAccountSelect} value={selectedAccountId}>
                <SelectTrigger className="mint-input">
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {sourceOptions.map((option: AccountOption) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.source_account_id && (
                <p className="text-sm text-red-500">Conta de origem é obrigatória</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="csv_file" className="text-mint-text-primary font-medium">
                Arquivo CSV/OFX
              </Label>
              <Input
                id="csv_file"
                type="file"
                accept=".csv,.ofx"
                onChange={handleFileChange}
                className="mint-input"
              />
              {errors.csv_file && (
                <p className="text-sm text-red-500">Arquivo é obrigatório</p>
              )}
              {!csvFile && (
                <p className="text-sm text-mint-text-secondary">
                  Selecione um arquivo CSV ou OFX para importar as transações.
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !csvFile || !selectedAccountId}
                className="flex-1"
              >
                {isLoading ? 'Processando...' : 'Avançar'}
              </Button>
            </div>
          </form>
        )}

        {currentStep === 'preview' && (
          <div className="space-y-4">
            <TransactionImportPreview
              transactions={previewTransactions}
              selectedStartIndex={selectedStartIndex}
              onStartIndexChange={setSelectedStartIndex}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBackToSelection}
                disabled={isLoading}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button
                onClick={handleImport}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Importando...' : 'Importar Transações'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
