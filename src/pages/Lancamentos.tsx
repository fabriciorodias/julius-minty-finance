
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTransactions, TransactionFilters, TransactionWithRelations, CreateTransactionData } from '@/hooks/useTransactions';
import { useCategories, Category } from '@/hooks/useCategories';
import { useAccounts, Account } from '@/hooks/useAccounts';
import { useCreditCards, CreditCard } from '@/hooks/useCreditCards';
import { useInstitutions, Institution } from '@/hooks/useInstitutions';
import { TransactionModal } from '@/components/transactions/TransactionModal';
import { InstallmentRecurringModal } from '@/components/transactions/InstallmentRecurringModal';

export default function Lancamentos() {
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInstallmentModalOpen, setIsInstallmentModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithRelations | null>(null);

  const { categories } = useCategories();
  const { accounts } = useAccounts();
  const { creditCards } = useCreditCards();
  const { institutions } = useInstitutions();

  // Create institution map for lookup
  const institutionMap = useMemo(() => institutions.reduce((acc, institution) => {
    acc[institution.id] = institution.name;
    return acc;
  }, {} as Record<string, string>), [institutions]);

  const {
    transactions,
    isLoading,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createInstallments,
    isCreating,
    isUpdating,
    isDeleting,
    isCreatingInstallments,
  } = useTransactions(filters);

  const handleFilterChange = (key: keyof TransactionFilters, value: string) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [key]: value === 'all' ? undefined : value,
    }));
  };

  const handleEdit = (transaction: TransactionWithRelations) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteTransaction(id);
  };

  const handleSaveTransaction = (data: CreateTransactionData) => {
    if (selectedTransaction) {
      updateTransaction({ id: selectedTransaction.id, ...data });
    } else {
      createTransaction(data);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction =>
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactions, searchTerm]);

  useEffect(() => {
    if (!isModalOpen) {
      setSelectedTransaction(null);
    }
  }, [isModalOpen]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Lançamentos</h1>
        <div className="flex space-x-2">
          <Button onClick={() => setIsInstallmentModalOpen(true)} variant="outline">
            Lançamento Parcelado/Recorrente
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            Novo Lançamento
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <Input
                placeholder="Buscar por descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data Base</label>
              <Select
                value={filters.dateBase || 'event'}
                onValueChange={(value) => handleFilterChange('dateBase', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="event">Data do Evento</SelectItem>
                  <SelectItem value="effective">Data de Efetivação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Get only child categories for the filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select
                value={filters.categoryId || 'all'}
                onValueChange={(value) => handleFilterChange('categoryId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.flatMap(category => 
                    category.subcategories && category.subcategories.length > 0 
                      ? category.subcategories 
                      : category.parent_id ? [category] : []
                  ).map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Conta</label>
              <Select
                value={filters.accountId || 'all'}
                onValueChange={(value) => handleFilterChange('accountId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {institutionMap[account.institution_id]} - {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cartão</label>
              <Select
                value={filters.creditCardId || 'all'}
                onValueChange={(value) => handleFilterChange('creditCardId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {creditCards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {institutionMap[card.institution_id]} - {card.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <div className="flex space-x-2">
                <Input
                  type="date"
                  placeholder="Data inicial"
                  value={filters.startDate || ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="date"
                  placeholder="Data final"
                  value={filters.endDate || ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de lançamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Lançamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Carregando...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data do Evento</TableHead>
                    <TableHead>Data de Efetivação</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {format(new Date(transaction.event_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {transaction.effective_date
                          ? format(new Date(transaction.effective_date), 'dd/MM/yyyy', { locale: ptBR })
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {transaction.description}
                      </TableCell>
                      <TableCell>
                        {transaction.categories?.name || 'Sem categoria'}
                      </TableCell>
                      <TableCell>
                        {transaction.accounts
                          ? `${institutionMap[accounts.find(a => a.id === transaction.account_id)?.institution_id || '']} - ${transaction.accounts.name}`
                          : transaction.credit_cards
                            ? `${institutionMap[creditCards.find(c => c.id === transaction.credit_card_id)?.institution_id || '']} - ${transaction.credit_cards.name}`
                            : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <span className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                          R$ {Math.abs(transaction.amount).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          transaction.status === 'concluido'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {transaction.status === 'concluido' ? 'Efetivado' : 'Pendente'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(transaction)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(transaction.id)}
                            className="text-red-600 hover:text-red-700"
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
          )}
        </CardContent>
      </Card>

      {/* Modais */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        transaction={selectedTransaction}
        isLoading={isCreating || isUpdating}
      />

      <InstallmentRecurringModal
        isOpen={isInstallmentModalOpen}
        onClose={() => setIsInstallmentModalOpen(false)}
        onSave={createInstallments}
        isLoading={isCreatingInstallments}
      />
    </div>
  );
}
