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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  CalendarIcon, 
  InfoIcon, 
  CreditCard, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  ChevronDown, 
  Plus,
  Sparkles 
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import { useInstitutions } from '@/hooks/useInstitutions';
import { useTags } from '@/hooks/useTags';
import { CreateTransactionData, Transaction } from '@/hooks/useTransactions';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { CurrencyInputBRL } from '@/components/ui/currency-input-brl';
import { TagsInput } from '@/components/ui/tags-input';
import { useCounterparties } from '@/hooks/useCounterparties';
import { CounterpartyCombobox } from './CounterpartyCombobox';
import { useDefaultAccounts } from '@/hooks/useDefaultAccounts';

const transactionSchema = z.object({
  type: z.enum(['receita', 'despesa']),
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.string().min(1, 'Valor é obrigatório'),
  event_date: z.string().min(1, 'Data do evento é obrigatória'),
  category_id: z.string().optional(),
  counterparty_id: z.string().optional(),
  source_type: z.enum(['account', 'credit_card']),
  account_id: z.string().optional(),
  tags: z.array(z.string()).default([]),
}).refine((data) => {
  return !!data.account_id;
}, {
  message: 'Selecione uma conta ou cartão de crédito',
  path: ['account_id'],
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
    counterparties: { id: string; name: string } | null;
    tags?: { name: string; color: string | null }[];
  };
  duplicateOf?: Transaction & {
    categories: { name: string } | null;
    accounts: { name: string } | null;
    credit_cards: { name: string } | null;
    counterparties: { id: string; name: string } | null;
    tags?: { name: string; color: string | null }[];
  } | null;
  isLoading?: boolean;
  prefilledAccountId?: string;
}

export function TransactionModal({
  isOpen,
  onClose,
  onSave,
  transaction,
  duplicateOf,
  isLoading = false,
  prefilledAccountId,
}: TransactionModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const { institutions } = useInstitutions();
  const { tags, createTag } = useTags();
  const { counterparties, createCounterparty, isCreating: isCreatingCounterparty } = useCounterparties();
  const { getDefaultAccount } = useDefaultAccounts();

  // State for controlling date picker popovers and collapsible sections
  const [eventDateOpen, setEventDateOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

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
      event_date: new Date().toISOString().slice(0, 10),
      category_id: undefined,
      counterparty_id: undefined,
      source_type: 'account',
      account_id: undefined,
      tags: [],
    },
  });

  const transactionType = form.watch('type');
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

  // Create tag suggestions from existing tags
  const tagSuggestions = tags.map(tag => tag.name);

  // Handle tag creation
  const handleCreateTag = async (tagName: string) => {
    await createTag({ name: tagName });
  };

  // Handle counterparty quick creation
  const handleCreateCounterparty = async (name: string) => {
    createCounterparty({ name });
  };

  // Auto-select account based on transaction type and user preferences
  useEffect(() => {
    if (!form.getValues('account_id') && availableAccounts.length > 0) {
      const transactionType = form.getValues('type');
      
      // First priority: prefilled account
      if (prefilledAccountId && availableAccounts.some(acc => acc.id === prefilledAccountId)) {
        form.setValue('account_id', prefilledAccountId);
        return;
      }
      
      // Second priority: user's favorite account for this transaction type
      if (transactionType) {
        const defaultAccount = getDefaultAccount(transactionType);
        if (defaultAccount && availableAccounts.some(acc => acc.id === defaultAccount.id)) {
          form.setValue('account_id', defaultAccount.id);
          return;
        }
      }
      
      // Third priority: only one account available
      if (availableAccounts.length === 1) {
        form.setValue('account_id', availableAccounts[0].id);
      }
    }
  }, [availableAccounts, form, prefilledAccountId, getDefaultAccount]);


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
      const today = new Date().toISOString().slice(0, 10);
      
      if (transaction) {
        // Determine source type based on account type
        const transactionAccount = accounts.find(acc => acc.id === transaction.account_id);
        const sourceType = transactionAccount?.type === 'credit' ? 'credit_card' : 'account';
        
        // Extract tag names from transaction tags
        const transactionTags = transaction.tags?.map(tag => tag.name) || [];
        
        // Editing existing transaction
        form.reset({
          type: transaction.type,
          description: transaction.description,
          amount: Math.abs(transaction.amount).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
          event_date: transaction.event_date,
          category_id: transaction.category_id || undefined,
          counterparty_id: transaction.counterparty_id || undefined,
          source_type: sourceType,
          account_id: transaction.account_id || undefined,
          tags: transactionTags,
        });
      } else if (duplicateOf) {
        // Duplicating transaction - use original data but update dates
        const duplicateAccount = accounts.find(acc => acc.id === duplicateOf.account_id);
        const sourceType = duplicateAccount?.type === 'credit' ? 'credit_card' : 'account';
        
        // Extract tag names from duplicate transaction tags
        const duplicateTags = duplicateOf.tags?.map(tag => tag.name) || [];
        
        form.reset({
          type: duplicateOf.type,
          description: duplicateOf.description,
          amount: Math.abs(duplicateOf.amount).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
          event_date: today,
          category_id: duplicateOf.category_id || undefined,
          counterparty_id: duplicateOf.counterparty_id || undefined,
          source_type: sourceType,
          account_id: duplicateOf.account_id || undefined,
          tags: duplicateTags,
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
          event_date: today,
          category_id: undefined,
          counterparty_id: undefined,
          source_type: defaultSourceType,
          account_id: defaultAccount,
          tags: [],
        });
      }
    }
  }, [isOpen, transaction, duplicateOf, form, accounts, prefilledAccountId]);

  const handleSubmit = (data: TransactionFormData, saveAndNew: boolean = false) => {
    // Parse the formatted currency value
    const numericAmount = parseFloat(data.amount.replace(/\./g, '').replace(',', '.'));
    const finalAmount = data.type === 'receita' ? numericAmount : -numericAmount;

    const transactionData: CreateTransactionData = {
      type: data.type,
      description: data.description,
      amount: finalAmount,
      event_date: data.event_date,
      category_id: data.category_id === "none" || !data.category_id ? undefined : data.category_id,
      counterparty_id: data.counterparty_id === "none" || !data.counterparty_id ? undefined : data.counterparty_id,
      account_id: data.account_id,
      credit_card_id: undefined,
      tags: data.tags || [],
    };

    onSave(transactionData);

    if (saveAndNew && !transaction) {
      // Reset form for new transaction, keeping some defaults
      form.reset({
        type: data.type,
        description: '',
        amount: '',
        event_date: new Date().toISOString().slice(0, 10),
        category_id: undefined,
        counterparty_id: undefined,
        source_type: data.source_type,
        account_id: data.account_id,
        tags: [],
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
        <DialogContent className="sm:max-w-[540px] max-h-[95vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {transaction ? 'Editar Lançamento' : duplicateOf ? 'Duplicar Lançamento' : 'Novo Lançamento'}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form className="px-6 pb-6 space-y-6">
              {/* LANÇAMENTO RÁPIDO - Main Card */}
              <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <div className="h-2 w-2 bg-primary rounded-full"></div>
                    Lançamento Rápido
                    <Badge variant="secondary" className="text-xs">Essencial</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Transaction Type - Enhanced Buttons */}
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Tipo</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              type="button"
                              variant={field.value === 'receita' ? 'default' : 'outline'}
                              size="lg"
                              onClick={() => field.onChange('receita')}
                              className={cn(
                                "h-12 flex items-center justify-center gap-2 transition-all",
                                field.value === 'receita' 
                                  ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
                                  : "hover:border-green-300 hover:bg-green-50"
                              )}
                            >
                              <TrendingUp className="h-4 w-4" />
                              Receita
                            </Button>
                            <Button
                              type="button"
                              variant={field.value === 'despesa' ? 'default' : 'outline'}
                              size="lg"
                              onClick={() => field.onChange('despesa')}
                              className={cn(
                                "h-12 flex items-center justify-center gap-2 transition-all",
                                field.value === 'despesa' 
                                  ? "bg-red-600 hover:bg-red-700 text-white border-red-600" 
                                  : "hover:border-red-300 hover:bg-red-50"
                              )}
                            >
                              <TrendingDown className="h-4 w-4" />
                              Despesa
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Descrição</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Supermercado, Salário, Conta de luz..." 
                            {...field} 
                            className="h-11"
                            autoFocus
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Amount and Date Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Valor</FormLabel>
                          <FormControl>
                            <CurrencyInputBRL
                              value={field.value}
                              onChange={(formatted) => field.onChange(formatted)}
                              className="h-11 text-base font-medium"
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
                          <FormLabel className="text-sm font-medium">Data</FormLabel>
                          <Popover open={eventDateOpen} onOpenChange={setEventDateOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "h-11 w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(parseInputDate(field.value), "dd/MM/yyyy", { locale: ptBR })
                                  ) : (
                                    <span>Hoje</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value ? parseInputDate(field.value) : undefined}
                                onSelect={(date) => handleDateSelect(date, field.onChange, setEventDateOpen)}
                                locale={ptBR}
                                className="p-3 pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Account/Credit Card Selection */}
                  <FormField
                    control={form.control}
                    name="source_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Origem</FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              type="button"
                              variant={field.value === 'account' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => {
                                field.onChange('account');
                                form.setValue('account_id', '');
                              }}
                              className="flex items-center gap-2"
                            >
                              <Wallet className="h-4 w-4" />
                              Conta
                            </Button>
                            <Button
                              type="button"
                              variant={field.value === 'credit_card' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => {
                                field.onChange('credit_card');
                                form.setValue('account_id', '');
                              }}
                              className="flex items-center gap-2"
                            >
                              <CreditCard className="h-4 w-4" />
                              Cartão
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="account_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          {sourceType === 'account' ? 'Conta' : 'Cartão de Crédito'}
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder={`Selecione ${sourceType === 'account' ? 'uma conta' : 'um cartão'}`} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableAccounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                <div className="flex items-center gap-2">
                                  {sourceType === 'account' ? (
                                    <Wallet className="h-4 w-4" />
                                  ) : (
                                    <CreditCard className="h-4 w-4" />
                                  )}
                                  <span>{account.name}</span>
                                  {institutionMap[account.institution_id] && (
                                    <Badge variant="outline" className="ml-auto text-xs">
                                      {institutionMap[account.institution_id]}
                                    </Badge>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* DETALHES ADICIONAIS - Collapsible Card */}
              <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
                <CollapsibleTrigger asChild>
                  <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Plus className={cn("h-4 w-4 transition-transform", detailsOpen && "rotate-45")} />
                          Detalhes Adicionais
                          <Badge variant="outline" className="text-xs">Opcional</Badge>
                        </div>
                        <ChevronDown className={cn("h-4 w-4 transition-transform", detailsOpen && "rotate-180")} />
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Card className="mt-3">
                    <CardContent className="pt-6 space-y-4">
                      {/* Category */}
                      <FormField
                        control={form.control}
                        name="category_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Categoria {transactionType === 'receita' ? 'de Receita' : 'de Despesa'}
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""}>
                              <FormControl>
                                <SelectTrigger className="h-10">
                                  <SelectValue placeholder="Selecione uma categoria" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">Sem categoria</SelectItem>
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

                      {/* Counterparty */}
                      <FormField
                        control={form.control}
                        name="counterparty_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Favorecido/Devedor</FormLabel>
                            <FormControl>
                              <CounterpartyCombobox
                                value={field.value || null}
                                onValueChange={(value) => field.onChange(value || undefined)}
                                counterparties={counterparties}
                                onQuickCreate={handleCreateCounterparty}
                                disabled={isCreatingCounterparty}
                                placeholder="Selecione um favorecido..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Tags */}
                      <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Tags</FormLabel>
                            <FormControl>
                              <TagsInput
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Digite uma tag e pressione Enter..."
                                suggestions={tagSuggestions}
                                onCreateTag={handleCreateTag}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 h-11"
                >
                  Cancelar
                </Button>
                {!transaction && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={form.handleSubmit((data) => handleSubmit(data, true))}
                    disabled={isLoading}
                    className="flex-1 h-11"
                  >
                    Salvar e Novo
                  </Button>
                )}
                <Button
                  type="submit"
                  onClick={form.handleSubmit((data) => handleSubmit(data, false))}
                  disabled={isLoading}
                  className="flex-1 h-11 bg-primary hover:bg-primary/90"
                >
                  {isLoading ? 'Salvando...' : transaction ? 'Atualizar' : 'Salvar'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
