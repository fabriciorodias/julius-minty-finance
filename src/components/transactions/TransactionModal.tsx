import React, { useEffect } from 'react';
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
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import { useCreditCards } from '@/hooks/useCreditCards';
import { useInstitutions } from '@/hooks/useInstitutions';
import { CreateTransactionData, Transaction } from '@/hooks/useTransactions';

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
  credit_card_id: z.string().optional(),
}).refine((data) => {
  if (data.source_type === 'account') {
    return !!data.account_id;
  }
  if (data.source_type === 'credit_card') {
    return !!data.credit_card_id;
  }
  return false;
}, {
  message: 'Selecione uma conta ou cartão de crédito',
  path: ['source_type'],
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
}

export function TransactionModal({
  isOpen,
  onClose,
  onSave,
  transaction,
  isLoading = false,
}: TransactionModalProps) {
  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const { creditCards } = useCreditCards();
  const { institutions } = useInstitutions();

  // Get only child categories (categories that have a parent_id)
  const childCategories = categories.flatMap(category => 
    category.subcategories && category.subcategories.length > 0 
      ? category.subcategories 
      : category.parent_id ? [category] : []
  );

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
      event_date: '',
      is_effective: false,
      effective_date: '',
      category_id: '',
      source_type: 'account',
      account_id: '',
      credit_card_id: '',
    },
  });

  const isEffective = form.watch('is_effective');

  useEffect(() => {
    if (transaction) {
      form.reset({
        type: transaction.type,
        description: transaction.description,
        amount: Math.abs(transaction.amount).toString(),
        event_date: transaction.event_date,
        is_effective: transaction.status === 'concluido',
        effective_date: transaction.effective_date || '',
        category_id: transaction.category_id || '',
        source_type: transaction.account_id ? 'account' : 'credit_card',
        account_id: transaction.account_id || '',
        credit_card_id: transaction.credit_card_id || '',
      });
    } else {
      form.reset({
        type: 'despesa',
        description: '',
        amount: '',
        event_date: '',
        is_effective: false,
        effective_date: '',
        category_id: '',
        source_type: 'account',
        account_id: '',
        credit_card_id: '',
      });
    }
  }, [transaction, form]);

  const handleSubmit = (data: TransactionFormData, saveAndNew: boolean = false) => {
    const amount = parseFloat(data.amount);
    const finalAmount = data.type === 'receita' ? amount : -amount;

    const transactionData: CreateTransactionData = {
      type: data.type,
      description: data.description,
      amount: finalAmount,
      event_date: data.event_date,
      effective_date: data.is_effective ? data.effective_date : undefined,
      category_id: data.category_id === '' ? undefined : data.category_id,
      status: data.is_effective ? 'concluido' : 'pendente',
      account_id: data.source_type === 'account' ? data.account_id : undefined,
      credit_card_id: data.source_type === 'credit_card' ? data.credit_card_id : undefined,
    };

    onSave(transactionData);

    if (saveAndNew && !transaction) {
      // Reset form for new transaction, keeping some defaults
      form.reset({
        type: data.type, // Keep the same type
        description: '',
        amount: '',
        event_date: '',
        is_effective: false,
        effective_date: '',
        category_id: '',
        source_type: data.source_type, // Keep the same source type
        account_id: data.source_type === 'account' ? data.account_id : '',
        credit_card_id: data.source_type === 'credit_card' ? data.credit_card_id : '',
      });
    } else {
      // Close modal for regular save or when editing
      onClose();
    }
  };

  const parseInputDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {transaction ? 'Editar Lançamento' : 'Novo Lançamento'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="receita" id="receita" />
                        <label htmlFor="receita">Receita</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="despesa" id="despesa" />
                        <label htmlFor="despesa">Despesa</label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      {...field}
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
                <FormItem className="flex flex-col">
                  <FormLabel>Data do Evento</FormLabel>
                  <Popover>
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
                        onSelect={(date) => {
                          if (date) {
                            const year = date.getFullYear();
                            const month = (date.getMonth() + 1).toString().padStart(2, '0');
                            const day = date.getDate().toString().padStart(2, '0');
                            field.onChange(`${year}-${month}-${day}`);
                          }
                        }}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Sem categoria</SelectItem>
                      {childCategories.map((category) => (
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

            <FormField
              control={form.control}
              name="source_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Origem</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Limpar o campo não selecionado
                        if (value === 'account') {
                          form.setValue('credit_card_id', '');
                        } else {
                          form.setValue('account_id', '');
                        }
                      }}
                      value={field.value}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="account" id="account" />
                        <label htmlFor="account">Conta</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="credit_card" id="credit_card" />
                        <label htmlFor="credit_card">Cartão de Crédito</label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('source_type') === 'account' && (
              <FormField
                control={form.control}
                name="account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conta</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma conta" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accounts.map((account) => (
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
            )}

            {form.watch('source_type') === 'credit_card' && (
              <FormField
                control={form.control}
                name="credit_card_id"
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
                        {creditCards.map((card) => (
                          <SelectItem key={card.id} value={card.id}>
                            {institutionMap[card.institution_id]} - {card.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex items-center space-x-4">
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
                    <FormLabel className="text-sm font-normal">
                      Efetivado
                    </FormLabel>
                  </FormItem>
                )}
              />

              {isEffective && (
                <FormField
                  control={form.control}
                  name="effective_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col flex-1">
                      <FormLabel>Data de Efetivação</FormLabel>
                      <Popover>
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
                            onSelect={(date) => {
                              if (date) {
                                const year = date.getFullYear();
                                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                                const day = date.getDate().toString().padStart(2, '0');
                                field.onChange(`${year}-${month}-${day}`);
                              }
                            }}
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
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
  );
}
