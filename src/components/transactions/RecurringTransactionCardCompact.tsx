import React, { useState } from "react";
import { format, parseISO } from 'date-fns';
import { NotionCard, NotionCardContent } from "@/components/ui/notion-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp
} from "lucide-react";
import { RecurringTransactionWithAnalytics, useRecurringTransactionMutations } from "@/hooks/useRecurringTransactions";
import { formatCurrency } from "@/lib/utils";
import { MarkAsPaidModal } from "./MarkAsPaidModal";

interface RecurringTransactionCardCompactProps {
  transaction: RecurringTransactionWithAnalytics;
  onEdit: () => void;
}

export function RecurringTransactionCardCompact({ 
  transaction, 
  onEdit 
}: RecurringTransactionCardCompactProps) {
  const [showMarkAsPaidModal, setShowMarkAsPaidModal] = useState(false);
  const { 
    updateRecurringTransaction, 
    deleteRecurringTransaction,
    isDeleting 
  } = useRecurringTransactionMutations();

  const isRevenue = transaction.type === 'receita';
  const theme = {
    borderColor: isRevenue ? 'border-l-revenue' : 'border-l-expense',
    textColor: isRevenue ? 'text-revenue' : 'text-expense',
    icon: isRevenue ? ArrowUpRight : ArrowDownRight
  };

  const getDaysUntilDueColor = (days: number) => {
    if (days < 0) return "text-status-overdue";
    if (days <= 3) return "text-status-upcoming";
    if (days <= 7) return "text-yellow-600";
    return "text-muted-foreground";
  };

  const getDaysUntilDueIcon = (days: number) => {
    if (days < 0) return AlertTriangle;
    if (days <= 7) return Clock;
    return Calendar;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <Badge variant="outline" className={`${theme.textColor} border-current bg-current/5 text-xs`}>
          Ativo
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-status-paused border-status-paused bg-status-paused-bg text-xs">
        Pausado
      </Badge>
    );
  };

  const handleStatusToggle = async () => {
    const newStatus = transaction.status === 'active' ? 'paused' : 'active';
    updateRecurringTransaction({
      id: transaction.id,
      data: { status: newStatus }
    });
  };

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja excluir este lançamento recorrente?')) {
      deleteRecurringTransaction(transaction.id);
    }
  };

  // Determinar se deve mostrar o botão de ação rápida "Pagar"
  const shouldShowQuickPay = () => {
    return transaction.status === 'active' && 
           (transaction.days_until_due < 0 || transaction.days_until_due <= 7);
  };

  const IconComponent = theme.icon;
  const DaysIcon = getDaysUntilDueIcon(transaction.days_until_due);
  const hasVariance = transaction.variance_percentage > 20;

  return (
    <NotionCard 
      variant="muted"
      className="group relative transition-all duration-200 hover:shadow-md"
    >
      <NotionCardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Icon + Content */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Type Icon */}
            <div className={`
              w-8 h-8 rounded-full ${isRevenue ? 'bg-revenue/10' : 'bg-expense/10'}
              flex items-center justify-center flex-shrink-0 mt-0.5
            `}>
              <IconComponent className={`h-4 w-4 ${theme.textColor}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
              {/* Header: Status + Title */}
              <div className="flex items-center gap-2 mb-1">
                {getStatusBadge(transaction.status)}
                <Badge variant="outline" className={`${theme.textColor} border-current bg-current/5 text-xs`}>
                  {isRevenue ? 'Receita' : 'Despesa'}
                </Badge>
              </div>

              {/* Title */}
              <h3 className={`font-bold text-lg leading-tight ${theme.textColor} truncate`}>
                {transaction.template_name}
              </h3>

              {/* Info Row: Amount + Due Date + Category */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-foreground">
                    {formatCurrency(transaction.expected_amount)}
                  </span>
                  {transaction.last_amount && transaction.last_amount !== transaction.expected_amount && (
                    <span className="text-muted-foreground text-xs">
                      • último: {formatCurrency(transaction.last_amount)}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  <DaysIcon className={`h-3 w-3 ${getDaysUntilDueColor(transaction.days_until_due)}`} />
                  <span className={`text-xs ${getDaysUntilDueColor(transaction.days_until_due)}`}>
                    {transaction.days_until_due < 0 
                      ? `${Math.abs(transaction.days_until_due)}d atraso`
                      : transaction.days_until_due === 0 
                        ? 'Hoje' 
                        : `${transaction.days_until_due}d`
                    }
                  </span>
                </div>

                <span className="text-muted-foreground text-xs truncate">
                  {transaction.category_name}
                </span>
              </div>

              {/* Variance Badge (if significant) */}
              {hasVariance && (
                <div className="flex items-center gap-1 text-status-upcoming">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-xs font-medium">
                    {transaction.variance_percentage.toFixed(1)}% variação
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Quick Pay + Action Menu */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Quick Pay Button */}
            {shouldShowQuickPay() && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMarkAsPaidModal(true);
                }}
                className={`
                  h-8 w-8 p-0
                  ${theme.textColor}
                  hover:bg-current/10
                  transition-all duration-200
                `}
                title="Marcar como pago"
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}

            {/* Action Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 z-50 bg-card border shadow-lg">
                <DropdownMenuItem onClick={onEdit} className="gap-2">
                  <Edit className="h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={handleStatusToggle} className="gap-2">
                  {transaction.status === 'active' ? (
                    <>
                      <Pause className="h-4 w-4" />
                      Pausar
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Ativar
                    </>
                  )}
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => setShowMarkAsPaidModal(true)} 
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Marcar como Pago
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={handleDelete} 
                  className="gap-2 text-destructive focus:text-destructive"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? 'Excluindo...' : 'Excluir'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </NotionCardContent>

      <MarkAsPaidModal
        open={showMarkAsPaidModal}
        onOpenChange={setShowMarkAsPaidModal}
        transaction={transaction}
      />
    </NotionCard>
  );
}