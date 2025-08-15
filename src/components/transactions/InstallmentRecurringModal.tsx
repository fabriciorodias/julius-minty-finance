
import React from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useCategories } from '@/hooks/useCategories';
import { useAccounts } from '@/hooks/useAccounts';
import { useCreditCards } from '@/hooks/useCreditCards';
import { InstallmentData } from '@/hooks/useTransactions';

const installmentSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.string().min(1, 'Valor é obrigatório'),
  eventDate: z.string().min(1, 'Data da compra é obrigatória'),
  firstEffectiveDate: z.string().min(1, 'Data do vencimento é obrigatória'),
  totalInstallments: z.string().min(1, 'Número de parcelas é obrigatório'),
  category_id: z.string().optional(),
  source_type: z.enum(['account', 'credit_card']),
  account_id: z.string().optional(),
  credit_card_id: z.string().optional(),
  status: z.enum(['pendente', 'concluido']),
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
});

const recurringSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.string().min(1, 'Valor é obrigatório'),
  eventDate: z.string().min(1, 'Data inicial é obrigatória'),
  dayOfMonth: z.string().min(1, 'Dia do mês é obrigatório'),
  totalRepetitions: z.string().min(1, 'Número de repetições é obrigatório'),
  type: z.enum(['receita', 'despesa']),
  category_id: z.string().optional(),
  source_type: z.enum(['account', 'credit_card']),
  account_id: z.string().optional(),  
  credit_card_id: z.string().optional(),
  status: z.enum(['pendente', 'concluido']),
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
});

type InstallmentFormData = z.infer<typeof installmentSchema>;
type RecurringFormData = z.infer<typeof recurringSchema>;

interface InstallmentRecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: InstallmentData) => void;
  isLoading?: boolean;
}

export function InstallmentRecurringModal({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
}: InstallmentRecurringModalProps) {
  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const { creditCards } = useCreditCards();

  const installmentForm = useForm<InstallmentFormData>({
    resolver: zodResolver(installmentSchema),
    defaultValues: {
      description: '',
      amount: '',
      eventDate: '',
      firstEffectiveDate: '',
      totalInstallments: '',
      category_id: '',
      source_type: 'credit_card',
      account_id: '',
      credit_card_id: '',
      status: 'pendente',
    },
  });

  const recurringForm = useForm<RecurringFormData>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      description: '',
      amount: '',
      eventDate: '',
      dayOfMonth: '',
      totalRepetitions: '',
      type: 'despesa',
      category_id: '',
      source_type: 'account',
      account_id: '',
      credit_card_id: '',
      status: 'pendente',
    },
  });

  const onInstallmentSubmit = (data: InstallmentFormData) => {
    const installmentData: InstallmentData = {
      description: data.description,
      amount: parseFloat(data.amount),
      eventDate: data.eventDate,
      firstEffectiveDate: data.firstEffectiveDate,
      totalInstallments: parseInt(data.totalInstallments),
      categoryId: data.category_id,
      accountId: data.source_type === 'account' ? data.account_id : undefined,
      creditCardId: data.source_type === 'credit_card' ? data.credit_card_id : undefined,
      type: 'despesa', // Parcelados são sempre despesas
      status: data.status,
    };

    onSave(installmentData);
  };

  const onRecurringSubmit = (data: RecurringFormData) => {
    // Para recorrentes, calculamos a primeira data de efetivação baseada no dia do mês
    const startDate = new Date(data.eventDate);
    const dayOfMonth = parseInt(data.dayOfMonth);
    
    // Criar a primeira data de efetivação
    const firstEffectiveDate = new Date(startDate.getFullYear(), startDate.getMonth(), dayOfMonth);
    
    // Se o dia já passou no mês atual, começar no próximo mês
    if (firstEffectiveDate < startDate) {
      firstEffectiveDate.setMonth(firstEffectiveDate.getMonth() + 1);
    }

    const amount = data.type === 'receita' ? parseFloat(data.amount) : parseFloat(data.amount);

    const installmentData: InstallmentData = {
      description: data.description,
      amount: amount,
      eventDate: data.eventDate,
      firstEffectiveDate: firstEffectiveDate.toISOString().slice(0, 10),
      totalInstallments: parseInt(data.totalRepetitions),
      categoryId: data.category_id,
      accountId: data.source_type === 'account' ? data.account_id : undefined,
      creditCardId: data.source_type === 'credit_card' ? data.credit_card_id : undefined,
      type: data.type,
      status: data.status,
    };

    onSave(installmentData);
  };

  const parseInputDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const DateField = ({ form, name, label }: { form: any; name: string; label: string }) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{label}</FormLabel>
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
  );

  const SourceFields = ({ form }: { form: any }) => (
    <>
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
                      {account.name}
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
                      {card.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Lançamentos Recorrentes e Parcelados</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="installment" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="installment">Parcelado</TabsTrigger>
            <TabsTrigger value="recurring">Recorrente</TabsTrigger>
          </TabsList>

          <TabsContent value="installment">
            <Form {...installmentForm}>
              <form onSubmit={installmentForm.handleSubmit(onInstallmentSubmit)} className="space-y-4">
                <FormField
                  control={installmentForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Input placeholder="Descrição da compra parcelada" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={installmentForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor da Parcela</FormLabel>
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
                    control={installmentForm.control}
                    name="totalInstallments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nº de Parcelas</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="12"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <DateField form={installmentForm} name="eventDate" label="Data da Compra" />
                  <DateField form={installmentForm} name="firstEffectiveDate" label="Vencimento 1ª Parcela" />
                </div>

                <FormField
                  control={installmentForm.control}
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
                          {categories.map((category) => (
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

                <SourceFields form={installmentForm} />

                <FormField
                  control={installmentForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status Inicial</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="concluido">Concluído</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Criando...' : 'Criar Parcelas'}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="recurring">
            <Form {...recurringForm}>
              <form onSubmit={recurringForm.handleSubmit(onRecurringSubmit)} className="space-y-4">
                <FormField
                  control={recurringForm.control}
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
                            <RadioGroupItem value="receita" id="receita-rec" />
                            <label htmlFor="receita-rec">Receita</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="despesa" id="despesa-rec" />
                            <label htmlFor="despesa-rec">Despesa</label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={recurringForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Input placeholder="Descrição do lançamento recorrente" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={recurringForm.control}
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
                    control={recurringForm.control}
                    name="totalRepetitions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nº de Repetições</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="12"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <DateField form={recurringForm} name="eventDate" label="Data Inicial" />
                  
                  <FormField
                    control={recurringForm.control}
                    name="dayOfMonth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dia do Mês (Efetivação)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="31"
                            placeholder="15"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={recurringForm.control}
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
                          {categories.map((category) => (
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

                <SourceFields form={recurringForm} />

                <FormField
                  control={recurringForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status Inicial</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="concluido">Concluído</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Criando...' : 'Criar Recorrência'}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
