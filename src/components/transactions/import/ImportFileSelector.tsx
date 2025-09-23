import React, { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useAccounts } from '@/hooks/useAccounts';
import { useInstitutions } from '@/hooks/useInstitutions';
import { supabase } from '@/integrations/supabase/client';
import { PreviewTransaction } from '@/hooks/useImportWizard';
import { Upload } from 'lucide-react';

interface ImportFileSelectorProps {
  file: File | null;
  sourceAccount: string;
  onFileChange: (file: File | null) => void;
  onSourceAccountChange: (accountId: string) => void;
  onTransactionsLoaded: (transactions: PreviewTransaction[]) => void;
  isProcessing: boolean;
  onProcessingChange: (isProcessing: boolean) => void;
  onError: (error: string) => void;
}

export function ImportFileSelector({
  file,
  sourceAccount,
  onFileChange,
  onSourceAccountChange,
  onTransactionsLoaded,
  isProcessing,
  onProcessingChange,
  onError
}: ImportFileSelectorProps) {
  const { accounts } = useAccounts();
  const { institutions } = useInstitutions();

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
      const selectedFile = e.target.files[0];
      onFileChange(selectedFile);
    }
  };

  const handlePreview = async () => {
    if (!file || !sourceAccount) {
      onError('Por favor, selecione uma conta e um arquivo para continuar.');
      return;
    }

    onProcessingChange(true);
    onError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', 'preview');
      formData.append('sourceId', sourceAccount);

      const { data, error } = await supabase.functions.invoke('import-transactions', {
        body: formData,
      });

      if (error) throw error;

      if (data.success && data.transactions) {
        onTransactionsLoaded(data.transactions);
      } else {
        throw new Error(data.error || 'Erro ao processar arquivo');
      }
    } catch (error: any) {
      console.error('Preview error:', error);
      onError(error.message || 'Não foi possível processar o arquivo. Tente novamente.');
    } finally {
      onProcessingChange(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Selection */}
        <div className="space-y-3">
          <Label htmlFor="source_account_id" className="text-base font-medium">
            Conta de Origem
          </Label>
          <Select onValueChange={onSourceAccountChange} value={sourceAccount}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Selecione a conta" />
            </SelectTrigger>
            <SelectContent>
              {sourceOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* File Selection */}
        <div className="space-y-3">
          <Label htmlFor="file_input" className="text-base font-medium">
            Arquivo CSV/OFX
          </Label>
          <div className="relative">
            <Input
              id="file_input"
              type="file"
              accept=".csv,.ofx"
              onChange={handleFileChange}
              className="h-12 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>
          {!file && (
            <p className="text-sm text-muted-foreground">
              Selecione um arquivo CSV ou OFX para importar as transações.
            </p>
          )}
        </div>
      </div>

      {/* File Info */}
      {file && (
        <div className="p-4 bg-secondary rounded-lg">
          <div className="flex items-center gap-3">
            <Upload className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handlePreview}
          disabled={isProcessing || !file || !sourceAccount}
          size="lg"
          className="px-8"
        >
          {isProcessing ? 'Processando...' : 'Processar Arquivo'}
        </Button>
      </div>
    </div>
  );
}