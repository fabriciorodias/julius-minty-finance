
import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Card, CardContent } from '@/components/ui/card';
import { useAccounts } from '@/hooks/useAccounts';
import { useInstitutions } from '@/hooks/useInstitutions';
import { useTransactions } from '@/hooks/useTransactions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CreditCard, Calendar, DollarSign, FileText } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const invoiceSchema = z.object({
  creditAccountId: z.string().min(1, 'Selecione um cartão de crédito'),
  month: z.string().min(1, 'Selecione um mês'),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceManagerModal({
  isOpen,
  onClose,
}: InvoiceManagerModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { accounts } = useAccounts();
  const { institutions } = useInstitutions();
  const { transactions, updateTransaction } = useTransactions();

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      creditAccountId: '',
      month: '',
    },
  });

  // Filter only credit accounts (credit cards)
  const creditAccounts = useMemo(() => 
    accounts.filter(account => account.source_type === 'credit'),
    [accounts]
  );

  // Create institution map for lookup
  const institutionMap = useMemo(() => 
    institutions.reduce((acc, institution) => {
      acc[institution.id] = institution.name;
      return acc;
    }, {} as Record<string, string>), 
  [institutions]);

  const watchCreditAccountId = form.watch('creditAccountId');
  const watchMonth = form.watch('month');

  // Generate month options (last 12 months + next 3 months)
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    
    for (let i = -12; i <= 3; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = format(date, 'yyyy-MM');
      const label = format(date, 'MMMM yyyy', { locale: ptBR });
      options.push({ value, label });
    }
    
    return options;
  }, []);

  // Filter transactions for the selected credit account and month
  const invoiceTransactions = useMemo(() => {
    if (!watchCreditAccountId || !watchMonth) return [];

    return transactions.filter(transaction => 
      transaction.account_id === watchCreditAccountId &&
      transaction.status === 'pendente' &&
      transaction.effective_date &&
      transaction.effective_date.startsWith(watchMonth)
    );
  }, [transactions, watchCreditAccountId, watchMonth]);

  const totalAmount = useMemo(() => {
    return invoiceTransactions.reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
  }, [invoiceTransactions]);

  const formatCurrency = (amount: number) => {
    return Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const handleMarkAsPaid = async () => {
    if (invoiceTransactions.length === 0) {
      toast({
        title: "Nenhuma transação encontrada",
        description: "Não há transações pendentes para este cartão e mês.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Update all transactions to 'concluido' status
      for (const transaction of invoiceTransactions) {
        await new Promise<void>((resolve, reject) => {
          updateTransaction(
            { 
              id: transaction.id, 
              status: 'concluido' as const 
            },
            {
              onSuccess: () => resolve(),
              onError: (error) => reject(error)
            }
          );
        });
      }

      toast({
        title: "Fatura marcada como paga",
        description: `${invoiceTransactions.length} transação${invoiceTransactions.length > 1 ? 'ões foram marcadas' : ' foi marcada'} como efetivada.`,
      });

      onClose();
      form.reset();
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      toast({
        title: "Erro ao processar fatura",
        description: "Não foi possível marcar a fatura como paga. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
      form.reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Gerenciar Faturas
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="creditAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cartão de Crédito</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cartão" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {creditAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {institutionMap[account.institution_id]} - {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="month"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mês da Fatura</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um mês" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {monthOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchCreditAccountId && watchMonth && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Transações Pendentes</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {invoiceTransactions.length} item{invoiceTransactions.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Valor Total</span>
                      </div>
                      <span className="text-lg font-bold text-red-600">
                        {formatCurrency(totalAmount)}
                      </span>
                    </div>

                    {invoiceTransactions.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        Nenhuma transação pendente encontrada para este período.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isProcessing}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleMarkAsPaid}
                disabled={isProcessing || invoiceTransactions.length === 0}
                className="flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processando...
                  </>
                ) : (
                  'Marcar como Paga'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
