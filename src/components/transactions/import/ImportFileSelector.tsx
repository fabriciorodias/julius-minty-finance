import React, { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAccounts } from '@/hooks/useAccounts';
import { useInstitutions } from '@/hooks/useInstitutions';
import { supabase } from '@/integrations/supabase/client';
import { PreviewTransaction } from '@/hooks/useImportWizard';
import { Upload, FileText, Image } from 'lucide-react';
import { ImagePreview } from './ImagePreview';

interface ImportFileSelectorProps {
  file: File | null;
  sourceAccount: string;
  importType: 'file' | 'image';
  onFileChange: (file: File | null) => void;
  onSourceAccountChange: (accountId: string) => void;
  onImportTypeChange: (type: 'file' | 'image') => void;
  onTransactionsLoaded: (transactions: PreviewTransaction[]) => void;
  isProcessing: boolean;
  onProcessingChange: (isProcessing: boolean) => void;
  onError: (error: string) => void;
}

export function ImportFileSelector({
  file,
  sourceAccount,
  importType,
  onFileChange,
  onSourceAccountChange,
  onImportTypeChange,
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

  const handleOCRProcess = async () => {
    if (!file || !sourceAccount) {
      onError('Por favor, selecione uma conta e uma imagem para continuar.');
      return;
    }

    onProcessingChange(true);
    onError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sourceId', sourceAccount);

      console.log('Sending OCR request:', { fileName: file.name, sourceAccount });

      const { data, error } = await supabase.functions.invoke('ocr-extract-transactions', {
        body: formData,
      });

      if (error) throw error;

      if (data.success && data.transactions) {
        console.log('OCR successful, transactions:', data.transactions);
        onTransactionsLoaded(data.transactions);
      } else {
        throw new Error(data.error || 'Erro ao extrair transações da imagem');
      }
    } catch (error: any) {
      console.error('OCR error:', error);
      onError(error.message || 'Não foi possível processar a imagem. Tente novamente.');
    } finally {
      onProcessingChange(false);
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

  const getAcceptedFileTypes = () => {
    if (importType === 'image') {
      return '.png,.jpg,.jpeg,.pdf';
    }
    return '.csv,.ofx';
  };

  const getFileTypeLabel = () => {
    if (importType === 'image') {
      return 'Imagem/PDF do Extrato';
    }
    return 'Arquivo CSV/OFX';
  };

  const getFileTypeHelp = () => {
    if (importType === 'image') {
      return 'Selecione uma imagem (PNG, JPEG) ou PDF do seu extrato bancário.';
    }
    return 'Selecione um arquivo CSV ou OFX para importar as transações.';
  };

  return (
    <div className="space-y-6">
      {/* Import Type Selection */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Tipo de Importação</Label>
        <RadioGroup value={importType} onValueChange={onImportTypeChange} className="flex gap-6">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="file" id="file" />
            <Label htmlFor="file" className="flex items-center gap-2 cursor-pointer">
              <FileText className="h-4 w-4" />
              Arquivo de Dados (CSV/OFX)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="image" id="image" />
            <Label htmlFor="image" className="flex items-center gap-2 cursor-pointer">
              <Image className="h-4 w-4" />
              Print/Imagem do Extrato (OCR)
            </Label>
          </div>
        </RadioGroup>
      </div>

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
            {getFileTypeLabel()}
          </Label>
          <div className="relative">
            <Input
              id="file_input"
              type="file"
              accept={getAcceptedFileTypes()}
              onChange={handleFileChange}
              className="h-12 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>
          {!file && (
            <p className="text-sm text-muted-foreground">
              {getFileTypeHelp()}
            </p>
          )}
        </div>
      </div>

      {/* File Preview */}
      {file && importType === 'image' && (
        <ImagePreview 
          file={file}
          onRemove={() => onFileChange(null)}
          onProcess={handleOCRProcess}
          isProcessing={isProcessing}
        />
      )}

      {/* File Info for regular files */}
      {file && importType === 'file' && (
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

      {/* Action Button for regular files */}
      {importType === 'file' && (
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
      )}
    </div>
  );
}