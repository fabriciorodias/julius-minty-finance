
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit, Trash2, FileText, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TransactionWithRelations } from '@/hooks/useTransactions';
import { Account } from '@/hooks/useAccounts';
import { CreditCard } from '@/hooks/useCreditCards';
import { Institution } from '@/hooks/useInstitutions';

interface TransactionsListProps {
  transactions: TransactionWithRelations[];
  accounts: Account[];
  creditCards: CreditCard[];
  institutions: Institution[];
  isLoading: boolean;
  onEdit: (transaction: TransactionWithRelations) => void;
  onDelete: (id: string) => void;
  onNewTransaction: () => void;
}

export function TransactionsList({
  transactions,
  accounts,
  creditCards,
  institutions,
  isLoading,
  onEdit,
  onDelete,
  onNewTransaction,
}: TransactionsListProps) {
  // Create institution map for lookup
  const institutionMap = React.useMemo(() => 
    institutions.reduce((acc, institution) => {
      acc[institution.id] = institution.name;
      return acc;
    }, {} as Record<string, string>), 
  [institutions]);

  const getOriginDisplay = (transaction: TransactionWithRelations) => {
    if (transaction.accounts) {
      const account = accounts.find(a => a.id === transaction.account_id);
      return `${institutionMap[account?.institution_id || '']} - ${transaction.accounts.name}`;
    }
    if (transaction.credit_cards) {
      const card = creditCards.find(c => c.id === transaction.credit_card_id);
      return `${institutionMap[card?.institution_id || '']} - ${transaction.credit_cards.name}`;
    }
    return '-';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lançamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Carregando lançamentos...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lançamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="rounded-full bg-muted p-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Nenhum lançamento encontrado</h3>
              <p className="text-muted-foreground max-w-md">
                Não foram encontrados lançamentos com os filtros aplicados. 
                Tente ajustar os filtros ou criar um novo lançamento.
              </p>
            </div>
            <Button onClick={onNewTransaction} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Criar Primeiro Lançamento
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Lançamentos ({transactions.length})</CardTitle>
        <Button onClick={onNewTransaction} size="sm" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Lançamento
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data do Evento</TableHead>
                <TableHead>Data de Efetivação</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {format(new Date(transaction.event_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    {transaction.effective_date
                      ? format(new Date(transaction.effective_date), 'dd/MM/yyyy', { locale: ptBR })
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={transaction.description}>
                      {transaction.description}
                    </div>
                    {transaction.installment_number && (
                      <div className="text-xs text-muted-foreground">
                        {transaction.installment_number}/{transaction.total_installments}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {transaction.categories?.name || 'Sem categoria'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {getOriginDisplay(transaction)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <span className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {transaction.amount >= 0 ? '+' : '-'}R$ {Math.abs(transaction.amount).toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      transaction.status === 'concluido'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {transaction.status === 'concluido' ? 'Efetivado' : 'Pendente'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(transaction)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(transaction.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
