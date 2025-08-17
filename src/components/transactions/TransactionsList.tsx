
import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useColumnOrder } from '@tanstack/react-table';
import { TransactionWithRelations } from '@/hooks/useTransactions';
import { TransactionTags } from './TransactionTags';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface TransactionsListProps {
  transactions: TransactionWithRelations[];
  onEdit: (transaction: TransactionWithRelations) => void;
  onDelete: (id: string) => void;
  selectedTransactions: string[];
  onSelectionChange: (transactionIds: string[]) => void;
  onTagClick?: (tagName: string) => void;
  onCounterpartyClick?: (counterpartyId: string) => void;
}

export function TransactionsList({
  transactions,
  onEdit,
  onDelete,
  selectedTransactions,
  onSelectionChange,
  onTagClick,
  onCounterpartyClick,
}: TransactionsListProps) {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(transactions.map(t => t.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectTransaction = (transactionId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedTransactions, transactionId]);
    } else {
      onSelectionChange(selectedTransactions.filter(id => id !== transactionId));
    }
  };

  const allSelected = transactions.length > 0 && selectedTransactions.length === transactions.length;
  const someSelected = selectedTransactions.length > 0 && selectedTransactions.length < transactions.length;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                ref={(ref) => {
                  if (ref) ref.indeterminate = someSelected;
                }}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Favorecido/Devedor</TableHead>
            <TableHead>Conta</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Revisão</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead className="w-24">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                Nenhuma transação encontrada
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedTransactions.includes(transaction.id)}
                    onCheckedChange={(checked) => 
                      handleSelectTransaction(transaction.id, checked as boolean)
                    }
                  />
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {format(new Date(transaction.event_date), 'dd/MM/yy', { locale: ptBR })}
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <div className="truncate" title={transaction.description}>
                    {transaction.description}
                  </div>
                </TableCell>
                <TableCell>
                  {transaction.categories?.name || (
                    <span className="text-muted-foreground italic">Sem categoria</span>
                  )}
                </TableCell>
                <TableCell>
                  {transaction.counterparties?.name ? (
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto text-left"
                      onClick={() => onCounterpartyClick?.(transaction.counterparty_id!)}
                    >
                      {transaction.counterparties.name}
                    </Button>
                  ) : (
                    <span className="text-muted-foreground italic">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {transaction.accounts?.name || transaction.credit_cards?.name || (
                      <span className="text-muted-foreground italic">Sem conta</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className={cn(
                  "text-right font-mono",
                  transaction.amount >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatCurrency(transaction.amount)}
                </TableCell>
                <TableCell>
                  <Badge variant={transaction.status === 'concluido' ? 'default' : 'secondary'}>
                    {transaction.status === 'concluido' ? 'Concluído' : 'Pendente'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center">
                    {transaction.is_reviewed ? (
                      <Eye className="h-4 w-4 text-green-600" title="Revisado" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" title="Não revisado" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <TransactionTags 
                    tags={transaction.tags || []} 
                    onTagClick={onTagClick}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(transaction)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(transaction.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
