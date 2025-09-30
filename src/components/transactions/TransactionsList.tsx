import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { NotionButton } from "@/components/ui/notion-button"
import { NotionCard } from "@/components/ui/notion-card"
import { Input } from "@/components/ui/input"
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils";
import { formatCurrency } from '@/lib/utils';
import { TransactionWithRelations } from '@/hooks/useTransactions';
import { TransactionTags } from './TransactionTags';

interface TransactionsListProps {
  transactions: TransactionWithRelations[];
  accounts: any[];
  institutions: any[];
  isLoading: boolean;
  onEdit: (transaction: TransactionWithRelations) => void;
  onDelete: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onNewTransaction: () => void;
  isDeleting: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onTagClick?: (tagName: string) => void;
  onRowClick?: (transaction: TransactionWithRelations) => void;
}

export function TransactionsList({
  transactions,
  accounts,
  institutions,
  isLoading,
  onEdit,
  onDelete,
  onBulkDelete,
  onNewTransaction,
  isDeleting,
  searchTerm,
  onSearchChange,
  onTagClick,
  onRowClick,
}: TransactionsListProps) {
  const [rowSelection, setRowSelection] = useState({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);

  useEffect(() => {
    const selectedIds = Object.keys(rowSelection).filter(key => rowSelection[key]);
    setSelectedTransactionIds(selectedIds);
  }, [rowSelection]);

  const handleBulkDelete = () => {
    if (selectedTransactionIds.length > 0) {
      onBulkDelete(selectedTransactionIds);
      setRowSelection({});
    }
  };

  const handleRowClick = (transaction: TransactionWithRelations, event: React.MouseEvent) => {
    // Don't trigger row click if clicking on interactive elements
    const target = event.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('[role="menuitem"]') ||
      target.closest('.dropdown-trigger')
    ) {
      return;
    }

    onRowClick?.(transaction);
  };

  const columns: ColumnDef<TransactionWithRelations>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected()
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Selecionar todos"
          disabled={transactions.length === 0}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Selecionar linha"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "event_date",
      header: ({ column }) => (
        <NotionButton
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 lg:px-3"
        >
          Data
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </NotionButton>
      ),
      cell: ({ row }) => {
        const transaction = row.original;
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {format(parseISO(transaction.event_date), 'dd/MM/yyyy')}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: ({ column }) => (
        <NotionButton
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 lg:px-3"
        >
          Descrição
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </NotionButton>
      ),
      cell: ({ row }) => {
        const transaction = row.original;
        const account = accounts.find(acc => acc.id === transaction.account_id);
        const institution = institutions.find(inst => inst.id === account?.institution_id);
        
        return (
          <div className="flex flex-col min-w-0 max-w-[250px]">
            <div className="font-medium text-sm truncate" title={transaction.description}>
              {transaction.description}
            </div>
            <div className="text-xs text-muted-foreground truncate" title={`${institution?.name} - ${account?.name}`}>
              {institution?.name} - {account?.name}
            </div>
            {transaction.counterparties && (
              <div className="text-xs text-muted-foreground truncate" title={`Fav.: ${transaction.counterparties.name}`}>
                Fav.: {transaction.counterparties.name}
              </div>
            )}
            {transaction.installment_number && transaction.total_installments && (
              <div className="text-xs text-notion-blue-text font-medium truncate">
                Parcela {transaction.installment_number}/{transaction.total_installments}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "categories.name",
      header: "Categoria",
      cell: ({ row }) => {
        const category = row.original.categories;
        return (
          <div className="text-sm">
            {category?.name || (
              <span className="text-muted-foreground italic">Sem categoria</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "tags",
      header: "Tags",
      cell: ({ row }) => {
        const transaction = row.original;
        return (
          <TransactionTags 
            tags={transaction.tags || []} 
            maxVisible={2}
            onTagClick={onTagClick}
          />
        );
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <div className="text-right">
          <NotionButton
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Valor
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </NotionButton>
        </div>
      ),
      cell: ({ row }) => {
        const amount = row.original.amount;
        
        return (
          <div className="text-right">
            <div className={cn(
              "font-medium text-sm tabular-nums",
              row.original.type === 'receita' ? "text-notion-success" : "text-notion-danger"
            )}>
              {row.original.type === 'receita' ? '+' : '-'}{formatCurrency(Math.abs(amount))}
            </div>
            {status === 'pendente' && (
              <div className="text-xs text-notion-warning font-medium">
                Pendente
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Ações</div>,
      cell: ({ row }) => {
        const transaction = row.original;

        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <NotionButton 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 p-0 dropdown-trigger"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="sr-only">Abrir menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </NotionButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white shadow-notion-lg border border-notion-gray-200">
                <DropdownMenuLabel className="text-notion-caption font-semibold">Ações</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onEdit(transaction)} className="text-notion-body-sm">
                  <Pencil className="h-3 w-3 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(transaction.id)} disabled={isDeleting} className="text-notion-body-sm">
                  <Trash2 className="h-3 w-3 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ]

  const table = useReactTable({
    data: transactions,
    columns,
    getRowId: (row) => row.id,
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
      sorting,
      columnFilters,
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-center justify-between py-4">
        <Input
          placeholder="Buscar lançamentos..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          <NotionButton size="sm" variant="outline" onClick={onNewTransaction}>
            Novo Lançamento
          </NotionButton>
          <NotionButton
            size="sm"
            variant="danger"
            onClick={handleBulkDelete}
            disabled={selectedTransactionIds.length === 0 || isDeleting}
          >
            Excluir Selecionados ({selectedTransactionIds.length})
          </NotionButton>
        </div>
      </div>

      <NotionCard padding="none" className="overflow-hidden">
        <Table>
          <TableHeader className="bg-notion-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-notion-gray-200 hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className={cn(
                      "text-notion-caption font-semibold text-notion-gray-700",
                      header.column.id === 'actions' ? 'text-right' : ''
                    )}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="text-center py-4 text-notion-body-sm text-notion-gray-500">
                  Carregando lançamentos...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && transactions.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="text-center py-4 text-notion-body-sm text-notion-gray-500">
                  Nenhum lançamento encontrado.
                </TableCell>
              </TableRow>
            )}
            {!isLoading && transactions.length > 0 && table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className={cn(
                  "cursor-pointer transition-notion border-b border-notion-gray-100 last:border-0",
                  row.getIsSelected() 
                    ? "bg-notion-blue-bg hover:bg-notion-blue-bg/80" 
                    : "hover:bg-notion-gray-50"
                )}
                onClick={(e) => handleRowClick(row.original, e)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className={cn(
                    "text-notion-body-sm",
                    cell.column.id === 'actions' ? 'text-right' : ''
                  )}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </NotionCard>

      <div className="flex items-center justify-between py-4">
        <div className="flex-1 text-notion-body-sm text-notion-gray-600">
          {table.getFilteredRowModel().rows.length} de {transactions.length} lançamentos
        </div>
        <div className="flex items-center space-x-2">
          <NotionButton
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </NotionButton>
          <NotionButton
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Próximo
          </NotionButton>
        </div>
      </div>
    </div>
  )
}
