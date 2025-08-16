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

interface ImportTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: { source_account_id: string; csv_file: File }) => Promise<void>;
  isLoading: boolean;
}

interface AccountOption {
  value: string;
  label: string;
  type: string;
}

export function ImportTransactionsModal({ isOpen, onClose, onImport, isLoading }: ImportTransactionsModalProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const { accounts } = useAccounts();
  const { institutions } = useInstitutions();
  const { toast } = useToast()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<{ source_account_id: string; csv_file: File }>();

  const institutionMap = useMemo(() => 
    institutions.reduce((acc, institution) => {
      acc[institution.id] = institution.name;
      return acc;
    }, {} as Record<string, string>), 
  [institutions]);

  const sourceOptions = accounts
    .filter(account => account.type === 'checking' || account.type === 'savings' || account.type === 'credit')
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

  const handleSaveInternal = async (data: { source_account_id: string; csv_file: File }) => {
    if (!csvFile) {
      toast({
        title: "Nenhum arquivo CSV selecionado.",
        description: "Por favor, selecione um arquivo para importar.",
        variant: "destructive",
      })
      return;
    }

    await onImport({
      ...data,
      csv_file: csvFile,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-mint-text-primary font-bold">Importar Transações via CSV</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleSaveInternal)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="source_account_id" className="text-mint-text-primary font-medium">
              Conta de Origem
            </Label>
            <Select onValueChange={(value) => setValue('source_account_id', value)}>
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
              Arquivo CSV
            </Label>
            <Input
              id="csv_file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="mint-input"
            />
            {errors.csv_file && (
              <p className="text-sm text-red-500">Arquivo CSV é obrigatório</p>
            )}
            {!csvFile && (
              <p className="text-sm text-mint-text-secondary">
                Selecione um arquivo CSV para importar as transações.
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !csvFile}
              className="flex-1"
            >
              {isLoading ? 'Importando...' : 'Importar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
