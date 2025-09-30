import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, DollarSign } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useRecurringTransactionMutations } from "@/hooks/useRecurringTransactions";
import { cn } from "@/lib/utils";
import type { RecurringTransactionWithAnalytics } from "@/hooks/useRecurringTransactions";

const formSchema = z.object({
  amount: z.number().positive("Valor deve ser positivo"),
  event_date: z.date(),
});

type FormData = z.infer<typeof formSchema>;

interface MarkAsPaidModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: RecurringTransactionWithAnalytics;
}

export function MarkAsPaidModal({
  open,
  onOpenChange,
  transaction,
}: MarkAsPaidModalProps) {
  const { markAsPaid, isMarkingAsPaid } = useRecurringTransactionMutations();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: transaction.expected_amount,
      event_date: new Date(),
    },
  });

  const onSubmit = (data: FormData) => {
    markAsPaid({
      id: transaction.id,
      amount: data.amount,
      event_date: format(data.event_date, 'yyyy-MM-dd'),
    });

    onOpenChange(false);
    form.reset({
      amount: transaction.expected_amount,
      event_date: new Date(),
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset({
      amount: transaction.expected_amount,
      event_date: new Date(),
    });
  };

  const suggestedAmounts = [
    transaction.expected_amount,
    transaction.last_amount > 0 ? transaction.last_amount : null,
    transaction.avg_last_3_months > 0 ? transaction.avg_last_3_months : null,
  ].filter((amount): amount is number => amount !== null && amount > 0);

  // Remove duplicates and sort
  const uniqueSuggestedAmounts = Array.from(new Set(suggestedAmounts))
    .sort((a, b) => Math.abs(a - transaction.expected_amount) - Math.abs(b - transaction.expected_amount))
    .slice(0, 3);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md glass-card-origin backdrop-blur-xl animate-scale-in">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Marcar como Pago
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transaction Info */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold text-sm text-foreground mb-1">
              {transaction.template_name}
            </h4>
            <p className="text-sm text-muted-foreground">
              {transaction.description}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Pago *</FormLabel>
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

              {/* Suggested Amounts */}
              {uniqueSuggestedAmounts.length > 1 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Valores Sugeridos:
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {uniqueSuggestedAmounts.map((amount, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => form.setValue('amount', amount)}
                        className="text-xs"
                      >
                        R$ {amount.toLocaleString('pt-BR', { 
                          minimumFractionDigits: 2 
                        })}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Date */}
              <FormField
                control={form.control}
                name="event_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data do Pagamento *</FormLabel>
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
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isMarkingAsPaid}
                >
                  {isMarkingAsPaid ? 'Registrando...' : 'Registrar Pagamento'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}