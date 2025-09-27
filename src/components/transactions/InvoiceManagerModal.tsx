import React, { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAccounts } from '@/hooks/useAccounts';
import { useInstitutions } from '@/hooks/useInstitutions';
import { useTransactions, Transaction } from '@/hooks/useTransactions';
import { CalendarDays, CreditCard, Eye, EyeOff } from 'lucide-react';

interface InvoiceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InvoiceManagerModal({ isOpen, onClose }: InvoiceManagerModalProps) {
  const [showPendingOnly, setShowPendingOnly] = useState(true);
  const { accounts } = useAccounts();
  const { institutions } = useInstitutions();
  const { transactions } = useTransactions();

  // Local currency formatting function
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  // Create institution map for lookup
  const institutionMap = useMemo(() => 
    institutions.reduce((acc, institution) => {
      acc[institution.id] = institution.name;
      return acc;
    }, {} as Record<string, string>), 
  [institutions]);

  // Get credit card accounts only
  const creditCardAccounts = useMemo(() => 
    accounts.filter(account => account.type === 'credit'),
  [accounts]);

  // Group transactions by credit card account and month
  const invoiceData = useMemo(() => {
    const invoices: Record<string, Record<string, Transaction[]>> = {};

    transactions
      .filter(transaction => transaction.account_id && 
        creditCardAccounts.some(account => account.id === transaction.account_id))
      .forEach(transaction => {
        const accountId = transaction.account_id!;
        const month = transaction.event_date.substring(0, 7); // YYYY-MM

        if (!invoices[accountId]) {
          invoices[accountId] = {};
        }
        if (!invoices[accountId][month]) {
          invoices[accountId][month] = [];
        }
        invoices[accountId][month].push(transaction);
      });

    return invoices;
  }, [transactions, creditCardAccounts, showPendingOnly]);

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });
  };

  const calculateInvoiceTotal = (transactionsList: Transaction[]) => {
    return transactionsList.reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Gerenciar Faturas de Cartão
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPendingOnly(!showPendingOnly)}
              className="flex items-center gap-2"
            >
              {showPendingOnly ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {showPendingOnly ? 'Mostrar Todas' : 'Apenas Pendentes'}
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {Object.keys(invoiceData).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {showPendingOnly 
                ? 'Nenhuma fatura pendente encontrada.' 
                : 'Nenhuma fatura encontrada.'}
            </div>
          ) : (
            Object.entries(invoiceData).map(([accountId, months]) => {
              const account = creditCardAccounts.find(acc => acc.id === accountId);
              if (!account) return null;

              return (
                <Card key={accountId}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      {institutionMap[account.institution_id]} - {account.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(months)
                        .sort(([a], [b]) => b.localeCompare(a)) // Sort by month descending
                        .map(([month, transactionsList]) => {
                          const total = calculateInvoiceTotal(transactionsList);
                          const pendingCount = 0; // All transactions are effective now
                          
                          return (
                            <div key={month} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{formatMonth(month)}</span>
                                  {pendingCount > 0 && (
                                    <Badge variant="secondary">
                                      {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-lg font-semibold">
                                  {formatCurrency(total)}
                                </div>
                              </div>
                              
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {transactionsList
                                  .sort((a, b) => b.event_date.localeCompare(a.event_date))
                                  .map(transaction => (
                                    <div key={transaction.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                                      <div className="flex-1">
                                        <div className="font-medium text-sm">{transaction.description}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {format(parseISO(transaction.event_date), 'dd/MM/yyyy')}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="default">
                                          Efetivado
                                        </Badge>
                                        <span className="font-medium">
                                          {formatCurrency(Math.abs(transaction.amount))}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
