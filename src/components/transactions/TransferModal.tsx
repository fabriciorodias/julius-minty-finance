import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { ArrowRightLeft, Calculator } from 'lucide-react';

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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CurrencyInputBRL } from '@/components/ui/currency-input-brl';

import { CreateTransferData, TransferGroup } from '@/hooks/useTransfers';
import { Account } from '@/hooks/useAccounts';

const transferSchema = z.object({
  from_account_id: z.string().min(1, 'Selecione a conta de origem'),
  to_account_id: z.string().min(1, 'Selecione a conta de destino'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  event_date: z.string().min(1, 'Data é obrigatória'),
  notes: z.string().optional(),
}).refine((data) => data.from_account_id !== data.to_account_id, {
  message: 'Conta de origem e destino devem ser diferentes',
  path: ['to_account_id'],
});

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateTransferData) => void;
  transfer?: TransferGroup;
  isLoading?: boolean;
  accounts: Account[];
  accountBalances: Record<string, number>;
}

export function TransferModal({
  isOpen,
  onClose,
  onSave,
  transfer,
  isLoading = false,
  accounts,
  accountBalances,
}: TransferModalProps) {
  const form = useForm<CreateTransferData>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      from_account_id: transfer?.from_account.id || '',
      to_account_id: transfer?.to_account.id || '',
      amount: transfer?.amount || 0,
      description: transfer?.description || '',
      event_date: transfer?.event_date || format(new Date(), 'yyyy-MM-dd'),
      notes: transfer?.notes || '',
    },
  });

  const watchedFromAccount = form.watch('from_account_id');
  const watchedToAccount = form.watch('to_account_id');
  const watchedAmount = form.watch('amount');

  const fromAccount = accounts.find(acc => acc.id === watchedFromAccount);
  const toAccount = accounts.find(acc => acc.id === watchedToAccount);
  const fromBalance = accountBalances[watchedFromAccount] || 0;
  const toBalance = accountBalances[watchedToAccount] || 0;

  const willHaveInsufficientFunds = fromBalance - watchedAmount < 0;

  const handleSave = (data: CreateTransferData) => {
    onSave(data);
    if (!transfer) {
      form.reset();
    }
  };

  const handleClose = () => {
    if (!transfer) {
      form.reset();
    }
    onClose();
  };

  const handleAmountChange = (value: string, numericValue: number) => {
    form.setValue('amount', numericValue);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            {transfer ? 'Editar Transferência' : 'Nova Transferência'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="from_account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conta de Origem</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar conta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts
                          .filter(account => account.id !== watchedToAccount)
                          .map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{account.name}</span>
                              <Badge variant="outline" className="ml-2">
                                R$ {(accountBalances[account.id] || 0).toLocaleString('pt-BR', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </Badge>
                            </div>
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
                name="to_account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conta de Destino</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar conta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts
                          .filter(account => account.id !== watchedFromAccount)
                          .map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{account.name}</span>
                              <Badge variant="outline" className="ml-2">
                                R$ {(accountBalances[account.id] || 0).toLocaleString('pt-BR', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <CurrencyInputBRL
                        value={field.value}
                        onChange={handleAmountChange}
                        placeholder="0,00"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="event_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Descrição da transferência" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observações adicionais sobre a transferência"
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preview da Transferência */}
            {watchedFromAccount && watchedToAccount && watchedAmount > 0 && (
              <>
                <Separator />
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calculator className="h-4 w-4" />
                    Preview da Transferência
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Saldo atual: {fromAccount?.name}</p>
                      <p className="font-medium">
                        R$ {fromBalance.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <p className={`text-sm ${willHaveInsufficientFunds ? 'text-destructive' : 'text-muted-foreground'}`}>
                        Após: R$ {(fromBalance - watchedAmount).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-muted-foreground">Saldo atual: {toAccount?.name}</p>
                      <p className="font-medium">
                        R$ {toBalance.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Após: R$ {(toBalance + watchedAmount).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>

                  {willHaveInsufficientFunds && (
                    <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                      ⚠️ Atenção: Esta transferência resultará em saldo negativo na conta de origem.
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Salvando...' : transfer ? 'Atualizar' : 'Criar Transferência'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}