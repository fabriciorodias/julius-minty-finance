import React, { useEffect, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CalendarIcon, InfoIcon, CreditCard, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import { useInstitutions } from '@/hooks/useInstitutions';
import { CreateTransactionData, Transaction } from '@/hooks/useTransactions';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { CurrencyInputBRL } from '@/components/ui/currency-input-brl';

const transactionSchema = z.object({
  type: z.enum(['receita', 'despesa']),
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.string().min(1, 'Valor é obrigatório'),
  event_date: z.string().min(1, 'Data do evento é obrigatória'),
  is_effective: z.boolean(),
  effective_date: z.string().optional(),
  category_id: z.string().optional(),
  source_type: z.enum(['account', 'credit_card']),
  account_id: z.string().optional(),
}).refine((data) => {
  return !!data.account_id;
}, {
  message: 'Selecione uma conta ou cartão de crédito',
  path: ['account_id'],
}).refine((data) => {
  if (data.is_effective) {
    return !!data.effective_date;
  }
  return true;
}, {
  message: 'Data de efetivação é obrigatória quando o lançamento está efetivado',
  path: ['effective_date'],
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateTransactionData) => void;
  transaction?: Transaction & {
    categories: { name: string } | null;
    accounts: { name: string } | null;
    credit_cards: { name: string } | null;
  };
  isLoading?: boolean;
  prefilledAccountId?: string;
}

export function TransactionModal({
  isOpen,
  onClose,
  onSave,
  transaction,
  isLoading = false,
  prefilledAccountId,
}: TransactionModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const { institutions } = useInstitutions();

  // State for controlling date picker popovers
  const [eventDateOpen, setEventDateOpen] = useState(false);
  const [effectiveDateOpen, setEffectiveDateOpen] = useState(false);

  // Create maps for institution lookup
  const institutionMap = institutions.reduce((acc, institution) => {
    acc[institution.id] = institution.name;
    return acc;
  }, {} as Record<string, string>);

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'despesa',
      description: '',
      amount: '',
      event_date: new Date().toISOString().slice(0, 10), // Today's date
      is_effective: false,
      effective_date: '',
      category_id: undefined,
      source_type: 'account',
      account_id: undefined,
    },
  });

  const transactionType = form.watch('type');
  const isEffective = form.watch('is_effective');
  const sourceType = form.watch('source_type');

  // Filter categories based on transaction type
  const filteredCategories = categories.flatMap(category => 
    category.subcategories && category.subcategories.length > 0 
      ? category.subcategories.filter(sub => sub.type === transactionType)
      : category.parent_id && category.type === transactionType ? [category] : []
  );

  // Filter accounts based on source type and status
  const availableAccounts = accounts.filter(account => {
    // For editing, show the current account even if inactive
    if (transaction && transaction.account_id === account.id) {
      return true;
    }
    
    // Filter by source type and active status
    if (sourceType === 'account') {
      return account.is_active && account.type === 'on_budget';
    } else if (sourceType === 'credit_card') {
      return account.is_active && account.type === 'credit';
    }
    
    return false;
  });

  // Auto-select account if only one option is available
  useEffect(() => {
    if (availableAccounts.length === 1 && !form.getValues('account_id')) {
      form.setValue('account_id', availableAccounts[0].id);
    }
  }, [availableAccounts, form]);

  // Auto-fill effective date when marking as effective
  useEffect(() => {
    if (isEffective && !form.getValues('effective_date')) {
      form.setValue('effective_date', form.getValues('event_date'));
    }
  }, [isEffective, form]);

  // Force refresh data when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened, refreshing data...');
      queryClient.invalidateQueries({ queryKey: ['accounts', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['categories', user?.id] });
      
      // Force immediate refetch of accounts
      queryClient.refetchQueries({ queryKey: ['accounts', user?.id] });
    }
  }, [isOpen, queryClient, user?.id]);

  // Reset form properly when modal opens
  useEffect(() => {
    if (isOpen) {
      if (transaction) {
        // Determine source type based on account type
        const transactionAccount = accounts.find(acc => acc.id === transaction.account_id);
        const sourceType = transactionAccount?.type === 'credit' ? 'credit_card' : 'account';
        
        // Editing existing transaction
        form.reset({
          type: transaction.type,
          description: transaction.description,
          amount: Math.abs(transaction.amount).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
          event_date: transaction.event_date,
          is_effective: transaction.status === 'concluido',
          effective_date: transaction.effective_date || '',
          category_id: transaction.category_id || undefined,
          source_type: sourceType,
          account_id: transaction.account_id || undefined,
        });
      } else {
        // Creating new transaction - reset to clean state with prefilled account
        const defaultAccount = prefilledAccountId || undefined;
        const defaultSourceType = defaultAccount 
          ? (accounts.find(acc => acc.id === defaultAccount)?.type === 'credit' ? 'credit_card' : 'account')
          : 'account';

        form.reset({
          type: 'despesa',
          description: '',
          amount: '',
          event_date: new Date().toISOString().slice(0, 10),
          is_effective: false,
          effective_date: '',
          category_id: undefined,
          source_type: defaultSourceType,
          account_id: defaultAccount,
        });
      }
    }
  }, [isOpen, transaction, form, accounts, prefilledAccountId]);

  const handleSubmit = (data: TransactionFormData, saveAndNew: boolean = false) => {
    // Parse the formatted currency value
    const numericAmount = parseFloat(data.amount.replace(/\./g, '').replace(',', '.'));
    const finalAmount = data.type === 'receita' ? numericAmount : -numericAmount;

    const transactionData: CreateTransactionData = {
      type: data.type,
      description: data.description,
      amount: finalAmount,
      event_date: data.event_date,
      effective_date: data.is_effective ? data.effective_date : undefined,
      category_id: data.category_id,
      status: data.is_effective ? 'concluido' : 'pendente',
      account_id: data.account_id,
      credit_card_id: undefined,
    };

    onSave(transactionData);

    if (saveAndNew && !transaction) {
      // Reset form for new transaction, keeping some defaults
      form.reset({
        type: data.type,
        description: '',
        amount: '',
        event_date: new Date().toISOString().slice(0, 10),
        is_effective: false,
        effective_date: '',
        category_id: undefined,
        source_type: data.source_type,
        account_id: data.account_id,
      });
    } else {
      onClose();
    }
  };

  const parseInputDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const handleDateSelect = (date: Date | undefined, fieldOnChange: (value: string) => void, setOpen: (open: boolean) => void) => {
    if (date) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      fieldOnChange(`${year}-${month}-${day}`);
      setOpen(false);
    }
  };

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {transaction ? 'Editar Lançamento' : 'Novo Lançamento'}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form className="space-y-6">
              {/* Transaction Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Tipo de Lançamento</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex space-x-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="receita" id="receita" />
                          <label htmlFor="receita" className="font-medium text-green-600">Receita</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="despesa" id="despesa" />
                          <label htmlFor="despesa" className="font-medium text-red-600">Despesa</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description and Amount in same row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Input placeholder="Descrição do lançamento" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor</FormLabel>
                      <FormControl>
                        <CurrencyInputBRL
                          value={field.value}
                          onChange={(formatted) => field.onChange(formatted)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Event Date */}
              <FormField
                control={form.control}
                name="event_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data do Evento</FormLabel>
                    <Popover open={eventDateOpen} onOpenChange={setEventDateOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(parseInputDate(field.value), "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? parseInputDate(field.value) : undefined}
                          onSelect={(date) => handleDateSelect(date, field.onChange, setEventDateOpen)}
                          locale={ptBR}
                          className="p-3"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Categoria {transactionType === 'receita' ? 'de Receita' : 'de Despesa'}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Sem categoria</SelectItem>
                        {filteredCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Source Type */}
              <FormField
                control={form.control}
                name="source_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origem do Lançamento</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue('account_id', undefined);
                        }}
                        value={field.value}
                        className="flex space-x-6"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="account" id="account" />
                          <Wallet className="h-4 w-4" />
                          <label htmlFor="account">Conta</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="credit_card" id="credit_card" />
                          <CreditCard className="h-4 w-4" />
                          <label htmlFor="credit_card">Cartão de Crédito</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Account Selection */}
              <FormField
                control={form.control}
                name="account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {sourceType === 'credit_card' ? 'Cartão de Crédito' : 'Conta'}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={
                            sourceType === 'credit_card' 
                              ? "Selecione um cartão" 
                              : "Selecione uma conta"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableAccounts.length === 0 ? (
                          <SelectItem value="no-accounts" disabled>
                            {sourceType === 'credit_card' 
                              ? 'Nenhum cartão ativo encontrado' 
                              : 'Nenhuma conta ativa encontrada'}
                          </SelectItem>
                        ) : (
                          availableAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              <div className="flex items-center gap-2">
                                {sourceType === 'credit_card' ? <CreditCard className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
                                <span>
                                  {institutionMap[account.institution_id] || 'Instituição'} - {account.name}
                                  {!account.is_active && ' (Inativa)'}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Effective Status and Date */}
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <FormField
                  control={form.control}
                  name="is_effective"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="flex items-center gap-2">
                          Lançamento Efetivado
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InfoIcon className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Marque se o valor já foi debitado/creditado na conta</p>
                            </TooltipContent>
                          </Tooltip>
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {isEffective && (
                  <FormField
                    control={form.control}
                    name="effective_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data de Efetivação</FormLabel>
                        <Popover open={effectiveDateOpen} onOpenChange={setEffectiveDateOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(parseInputDate(field.value), "dd/MM/yyyy", { locale: ptBR })
                                ) : (
                                  <span>Selecione a data</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? parseInputDate(field.value) : undefined}
                              onSelect={(date) => handleDateSelect(date, field.onChange, setEffectiveDateOpen)}
                              locale={ptBR}
                              className="p-3"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                
                {!transaction && (
                  <Button 
                    type="button" 
                    variant="secondary"
                    disabled={isLoading}
                    onClick={form.handleSubmit((data) => handleSubmit(data, true))}
                  >
                    {isLoading ? 'Salvando...' : 'Salvar e criar novo'}
                  </Button>
                )}
                
                <Button 
                  type="button" 
                  disabled={isLoading}
                  onClick={form.handleSubmit((data) => handleSubmit(data, false))}
                >
                  {isLoading ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
