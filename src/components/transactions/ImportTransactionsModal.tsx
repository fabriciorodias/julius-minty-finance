
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAccounts } from '@/hooks/useAccounts';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useInstitutions } from '@/hooks/useInstitutions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Upload, FileText } from 'lucide-react';

const importSchema = z.object({
  importType: z.enum(['account', 'credit_card']),
  sourceId: z.string().min(1, 'Selecione uma conta ou cartão'),
  file: z.instanceof(File).refine((file) => {
    const allowedTypes = [
      'text/csv',
      'application/x-ofx',
      'text/plain'
    ];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    return allowedTypes.includes(file.type) || 
           ['csv', 'ofx'].includes(fileExtension || '');
  }, 'Apenas arquivos CSV e OFX são suportados'),
});

type ImportFormData = z.infer<typeof importSchema>;

interface ImportTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportTransactionsModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportTransactionsModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { accounts } = useAccounts();
  const { creditCards } = useCreditCards();
  const { institutions } = useInstitutions();

  const form = useForm<ImportFormData>({
    resolver: zodResolver(importSchema),
    defaultValues: {
      importType: 'account',
      sourceId: '',
      file: undefined,
    },
  });

  // Create institution map for lookup
  const institutionMap = React.useMemo(() => 
    institutions.reduce((acc, institution) => {
      acc[institution.id] = institution.name;
      return acc;
    }, {} as Record<string, string>), 
  [institutions]);

  const watchImportType = form.watch('importType');

  const handleSubmit = async (data: ImportFormData) => {
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('importType', data.importType);
      formData.append('sourceId', data.sourceId);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      const SUPABASE_URL = "https://kdmalulbcqnothgxyrnc.supabase.co";
      const response = await fetch(`${SUPABASE_URL}/functions/v1/import-transactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      console.log('Import response status:', response.status);
      console.log('Import response headers:', Object.fromEntries(response.headers.entries()));

      let result;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const textResponse = await response.text();
        console.error('Non-JSON response:', textResponse);
        throw new Error(`Erro no servidor: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        throw new Error(result.error || `Erro HTTP ${response.status}: ${response.statusText}`);
      }

      toast({
        title: "Importação concluída",
        description: `${result.count} transações importadas com sucesso`,
      });

      onSuccess();
      onClose();
      form.reset();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Não foi possível importar o arquivo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      onClose();
      form.reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Extratos/Faturas</DialogTitle>
          <DialogDescription>
            Envie um arquivo CSV ou OFX do seu banco para importar lançamentos automaticamente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="importType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Importação</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="account">Extrato de Conta</SelectItem>
                      <SelectItem value="credit_card">Fatura de Cartão</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sourceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {watchImportType === 'account' ? 'Conta' : 'Cartão de Crédito'}
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={`Selecione ${watchImportType === 'account' ? 'uma conta' : 'um cartão'}`} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {watchImportType === 'account' 
                        ? accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {institutionMap[account.institution_id]} - {account.name}
                            </SelectItem>
                          ))
                        : creditCards.map((card) => (
                            <SelectItem key={card.id} value={card.id}>
                              {institutionMap[card.institution_id]} - {card.name}
                            </SelectItem>
                          ))
                      }
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="file"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel>Arquivo</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="file"
                        accept=".csv,.ofx"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onChange(file);
                          }
                        }}
                        {...field}
                      />
                      {value && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <FileText className="h-4 w-4 mr-1" />
                          {value.name}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                  <div className="text-xs text-muted-foreground">
                    Formatos suportados: CSV, OFX
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isUploading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Importar
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
