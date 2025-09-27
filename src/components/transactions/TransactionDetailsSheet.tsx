
import React, { useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from '@/components/ui/sheet';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Edit, 
  Trash2, 
  CheckCircle, 
  Circle,
  Building,
  CreditCard,
  Calendar,
  Tag,
  FileText,
  User,
  Hash,
  Clock,
  Copy
} from 'lucide-react';
import { TransactionWithRelations } from '@/hooks/useTransactions';
import { TransactionTags } from './TransactionTags';
import { formatCurrency, cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface TransactionDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: TransactionWithRelations | null;
  accounts: any[];
  institutions: any[];
  onEdit: (transaction: TransactionWithRelations) => void;
  onDelete: (id: string) => void;
  onDuplicate: (transaction: TransactionWithRelations) => void;
  onTagClick?: (tagName: string) => void;
}

export function TransactionDetailsSheet({
  open,
  onOpenChange,
  transaction,
  accounts,
  institutions,
  onEdit,
  onDelete,
  onDuplicate,
  onTagClick,
}: TransactionDetailsSheetProps) {
  const isMobile = useIsMobile();

  // Keyboard shortcuts
  useEffect(() => {
    if (!open || !transaction) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        onEdit(transaction);
      } else if (e.key === 'Delete') {
        e.preventDefault();
        onDelete(transaction.id);
        onOpenChange(false);
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        onDuplicate(transaction);
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, transaction, onOpenChange, onEdit, onDelete, onDuplicate]);

  if (!transaction) return null;

  const account = accounts.find(acc => acc.id === transaction.account_id);
  const institution = institutions.find(inst => inst.id === account?.institution_id);
  const isPositive = transaction.amount > 0;

  const DetailSection = ({ icon: Icon, title, children }: { 
    icon: React.ElementType; 
    title: string; 
    children: React.ReactNode;
  }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h4 className="font-medium text-sm">{title}</h4>
      </div>
      <div className="ml-6 space-y-2">
        {children}
      </div>
    </div>
  );

  const DetailItem = ({ label, value, className }: { 
    label: string; 
    value: React.ReactNode; 
    className?: string;
  }) => (
    <div className="flex justify-between items-start gap-4">
      <span className="text-sm text-muted-foreground min-w-0 flex-shrink-0">{label}:</span>
      <span className={cn("text-sm font-medium text-right", className)}>{value}</span>
    </div>
  );

  const content = (
    <ScrollArea className="h-full">
      <div className="space-y-6 p-6">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1 min-w-0">
              <div className={cn(
                "text-2xl font-bold",
                isPositive ? "text-green-600" : "text-red-600"
              )}>
                {isPositive ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {transaction.description}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              {transaction.status === 'pendente' ? (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  <Circle className="h-3 w-3 mr-1" />
                  Pendente
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Concluído
                </Badge>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(transaction)}
              className="flex items-center gap-2"
            >
              <Edit className="h-3 w-3" />
              Editar (E)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onDuplicate(transaction);
                onOpenChange(false);
              }}
              className="flex items-center gap-2"
            >
              <Copy className="h-3 w-3" />
              Duplicar (D)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onDelete(transaction.id);
                onOpenChange(false);
              }}
              className="flex items-center gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
              Excluir (Del)
            </Button>
          </div>
        </div>

        <Separator />

        {/* Account & Institution */}
        <DetailSection icon={Building} title="Conta & Instituição">
          <DetailItem 
            label="Instituição" 
            value={institution?.name || 'N/A'}
          />
          <DetailItem 
            label="Conta" 
            value={account?.name || 'N/A'}
          />
          {transaction.credit_cards && (
            <DetailItem 
              label="Cartão" 
              value={
                <div className="flex items-center gap-1">
                  <CreditCard className="h-3 w-3" />
                  {transaction.credit_cards.name}
                </div>
              }
            />
          )}
        </DetailSection>

        <Separator />

        {/* Category */}
        <DetailSection icon={Tag} title="Categoria">
          <DetailItem 
            label="Categoria" 
            value={transaction.categories?.name || (
              <span className="text-muted-foreground italic">Sem categoria</span>
            )}
          />
        </DetailSection>

        <Separator />

        {/* Counterparty */}
        {transaction.counterparties && (
          <>
            <DetailSection icon={User} title="Favorecido">
              <DetailItem 
                label="Nome" 
                value={transaction.counterparties.name}
              />
            </DetailSection>
            <Separator />
          </>
        )}

        {/* Dates */}
        <DetailSection icon={Calendar} title="Datas">
          <DetailItem 
            label="Data do Evento" 
            value={format(parseISO(transaction.event_date), 'dd/MM/yyyy', { locale: ptBR })}
          />
          <DetailItem 
            label="Data de Efetivação" 
            value={
              transaction.effective_date ? 
                format(parseISO(transaction.effective_date), 'dd/MM/yyyy', { locale: ptBR }) :
                <span className="text-amber-600 italic">Pendente de liquidação</span>
            }
          />
        </DetailSection>

        <Separator />

        {/* Tags */}
        {transaction.tags && transaction.tags.length > 0 && (
          <>
            <DetailSection icon={Hash} title="Tags">
              <div className="flex flex-wrap gap-2">
                <TransactionTags 
                  tags={transaction.tags} 
                  onTagClick={onTagClick}
                />
              </div>
            </DetailSection>
            <Separator />
          </>
        )}

        {/* Installments */}
        {transaction.installment_number && transaction.total_installments && (
          <>
            <DetailSection icon={FileText} title="Parcelamento">
              <DetailItem 
                label="Parcela" 
                value={`${transaction.installment_number}/${transaction.total_installments}`}
                className="text-blue-600"
              />
              {transaction.installment_id && (
                <DetailItem 
                  label="ID do Grupo" 
                  value={
                    <code className="text-xs bg-muted px-1 rounded">
                      {transaction.installment_id.slice(-8)}
                    </code>
                  }
                />
              )}
            </DetailSection>
            <Separator />
          </>
        )}

        {/* Metadata */}
        <DetailSection icon={Clock} title="Metadados">
          <DetailItem 
            label="Criado em" 
            value={format(parseISO(transaction.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
          />
          <DetailItem 
            label="ID" 
            value={
              <code className="text-xs bg-muted px-1 rounded">
                {transaction.id.slice(-8)}
              </code>
            }
          />
          <DetailItem 
            label="Tipo" 
            value={
              <Badge variant={isPositive ? "outline" : "secondary"}>
                {transaction.type === 'receita' ? 'Receita' : 'Despesa'}
              </Badge>
            }
          />
        </DetailSection>
      </div>
    </ScrollArea>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-left border-b">
            <DrawerTitle>Detalhes da Transação</DrawerTitle>
            <DrawerDescription>
              Visualize e edite os detalhes desta transação
            </DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:max-w-[500px] p-0">
        <SheetHeader className="p-6 border-b">
          <SheetTitle>Detalhes da Transação</SheetTitle>
          <SheetDescription>
            Visualize e edite os detalhes desta transação. 
            Use <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Esc</kbd> para fechar,{' '}
            <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">E</kbd> para editar,{' '}
            <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">D</kbd> para duplicar.
          </SheetDescription>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  );
}
