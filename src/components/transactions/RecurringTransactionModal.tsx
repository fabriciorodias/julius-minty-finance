import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { useRecurringTransactionMutations, useRecurringTransactionsBasic } from "@/hooks/useRecurringTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useAccounts } from "@/hooks/useAccounts";
import { useCounterparties } from "@/hooks/useCounterparties";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  template_name: z.string().min(1, "Nome do template é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  expected_amount: z.number().positive("Valor deve ser positivo"),
  variance_tolerance: z.number().min(0).max(100).default(10),
  type: z.enum(['receita', 'despesa']),
  category_id: z.string().optional(),
  account_id: z.string().optional(),
  counterparty_id: z.string().optional(),
  recurrence_pattern: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']),
  day_of_month: z.number().min(1).max(31).default(1),
  next_due_date: z.date(),
  notification_days: z.number().min(0).max(30).default(3),
  auto_categorize: z.boolean().default(true),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface RecurringTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId?: string | null;
}

export function RecurringTransactionModal({
  open,
  onOpenChange,
  transactionId,
}: RecurringTransactionModalProps) {
  const isEditing = !!transactionId;
  const { data: recurringTransactions = [] } = useRecurringTransactionsBasic();
  const { categories = [] } = useCategories();
  const { accounts = [] } = useAccounts();
  const { counterparties = [] } = useCounterparties();
  
  const {
    createRecurringTransaction,
    updateRecurringTransaction,
    isCreating,
    isUpdating,
  } = useRecurringTransactionMutations();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      template_name: "",
      description: "",
      expected_amount: 0,
      variance_tolerance: 10,
      type: "despesa",
      recurrence_pattern: "monthly",
      day_of_month: 1,
      next_due_date: new Date(),
      notification_days: 3,
      auto_categorize: true,
      notes: "",
    },
  });

  // Load existing transaction data when editing
  useEffect(() => {
    if (isEditing && transactionId && recurringTransactions.length > 0) {
      const transaction = recurringTransactions.find(t => t.id === transactionId);
      if (transaction) {
        form.reset({
          template_name: transaction.template_name,
          description: transaction.description,
          expected_amount: transaction.expected_amount,
          variance_tolerance: transaction.variance_tolerance,
          type: transaction.type,
          category_id: transaction.category_id || undefined,
          account_id: transaction.account_id || undefined,
          counterparty_id: transaction.counterparty_id || undefined,
          recurrence_pattern: transaction.recurrence_pattern,
          day_of_month: transaction.day_of_month,
          next_due_date: new Date(transaction.next_due_date),
          notification_days: transaction.notification_days,
          auto_categorize: transaction.auto_categorize,
          notes: transaction.notes || "",
        });
      }
    }
  }, [isEditing, transactionId, recurringTransactions, form]);

  const onSubmit = (data: FormData) => {
    const submitData = {
      template_name: data.template_name,
      description: data.description,
      expected_amount: data.expected_amount,
      variance_tolerance: data.variance_tolerance,
      type: data.type,
      category_id: data.category_id,
      account_id: data.account_id,
      counterparty_id: data.counterparty_id,
      recurrence_pattern: data.recurrence_pattern,
      day_of_month: data.day_of_month,
      next_due_date: format(data.next_due_date, 'yyyy-MM-dd'),
      notification_days: data.notification_days,
      auto_categorize: data.auto_categorize,
      notes: data.notes,
    };

    if (isEditing && transactionId) {
      updateRecurringTransaction({
        id: transactionId,
        data: submitData,
      });
    } else {
      createRecurringTransaction(submitData);
    }

    onOpenChange(false);
    form.reset();
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
  };

  const filteredCategories = categories.filter(
    category => category.type === form.watch('type')
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Lançamento Recorrente' : 'Novo Lançamento Recorrente'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="template_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Template *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Conta de Luz, Aluguel..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="despesa">Despesa</SelectItem>
                        <SelectItem value="receita">Receita</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Descrição completa da conta"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Financial Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="expected_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Esperado *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="variance_tolerance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tolerância de Variação (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="10"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Categorization */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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

              <FormField
                control={form.control}
                name="account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conta</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
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

              <FormField
                control={form.control}
                name="counterparty_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {counterparties.map((counterparty) => (
                          <SelectItem key={counterparty.id} value={counterparty.id}>
                            {counterparty.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Recurrence Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="recurrence_pattern"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequência *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="day_of_month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia do Mês</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        placeholder="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notification_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notificar (dias antes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="30"
                        placeholder="3"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Next Due Date */}
            <FormField
              control={form.control}
              name="next_due_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Próximo Vencimento *</FormLabel>
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
                            format(field.value, "dd/MM/yyyy")
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
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Settings */}
            <FormField
              control={form.control}
              name="auto_categorize"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Categorização Automática
                    </FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Aplicar categoria automaticamente nas transações futuras
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações adicionais..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isCreating || isUpdating}
              >
                {isCreating || isUpdating ? 'Salvando...' : 
                 isEditing ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}