import React, { useState } from "react";
import { format, parseISO } from 'date-fns';
import { NotionCard, NotionCardHeader, NotionCardContent } from "@/components/ui/notion-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Calendar, 
  Clock, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  CreditCard
} from "lucide-react";
import { RecurringTransactionWithAnalytics, useRecurringTransactionMutations } from "@/hooks/useRecurringTransactions";
import { formatCurrency } from "@/lib/utils";
import { MarkAsPaidModal } from "./MarkAsPaidModal";

interface RecurringTransactionCardProps {
  transaction: RecurringTransactionWithAnalytics;
  onEdit: () => void;
}

export function RecurringTransactionCard({ 
  transaction, 
  onEdit 
}: RecurringTransactionCardProps) {
  const [showMarkAsPaidModal, setShowMarkAsPaidModal] = useState(false);
  const { 
    updateRecurringTransaction, 
    deleteRecurringTransaction,
    isUpdating,
    isDeleting 
  } = useRecurringTransactionMutations();

  // Determinar cores e estilos baseados no tipo
  const getTransactionTheme = (type: string) => {
    const isRevenue = type === 'receita';
    return {
      isRevenue,
      borderColor: isRevenue ? 'border-l-revenue' : 'border-l-expense',
      bgGradient: isRevenue 
        ? 'bg-gradient-to-br from-revenue-lighter to-white' 
        : 'bg-gradient-to-br from-expense-lighter to-white',
      textColor: isRevenue ? 'text-revenue' : 'text-expense',
      iconBg: isRevenue ? 'bg-revenue/10' : 'bg-expense/10',
      icon: isRevenue ? ArrowUpRight : ArrowDownRight,
      typeLabel: isRevenue ? 'Receita' : 'Despesa',
      accentColor: isRevenue ? 'text-revenue-accent' : 'text-expense-accent'
    };
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

  const getStatusBadge = (status: string, theme: any) => {
    switch (status) {
      case 'active':
        return (
          <Badge 
            variant="outline" 
            className={`${theme.textColor} border-current bg-current/5 font-medium`}
          >
            Ativo
          </Badge>
        );
      case 'paused':
        return (
          <Badge 
            variant="outline" 
            className="text-status-paused border-status-paused bg-status-paused-bg"
          >
            Pausado
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getVarianceInfo = (variance: number, theme: any) => {
    if (variance === 0) return null;
    
    const isHighVariance = variance > 20;
    const color = isHighVariance ? "text-status-upcoming" : theme.textColor;
    const icon = isHighVariance ? AlertTriangle : TrendingUp;
    const IconComponent = icon;
    
    return {
      color,
      icon: IconComponent,
      text: `${variance.toFixed(1)}% variação`
    };
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

  const theme = getTransactionTheme(transaction.type);
  const IconComponent = theme.icon;

  return (
    <NotionCard 
      variant="muted"
      className="group relative transition-all duration-200 hover:shadow-md"
    >
      {/* Gradient Overlay on Hover */}
      <div className={`
        absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300
        bg-gradient-to-r ${theme.isRevenue ? 'from-revenue/5' : 'from-expense/5'} to-transparent pointer-events-none
      `} />
      
      {/* Quick Pay Button - Aparece para lançamentos próximos ao vencimento */}
      {shouldShowQuickPay() && (
        <Button
          size="sm"
          onClick={() => setShowMarkAsPaidModal(true)}
          className={`
            absolute top-4 left-4 z-20
            ${theme.isRevenue 
              ? 'bg-revenue hover:bg-revenue/90 text-white' 
              : transaction.days_until_due < 0
                ? 'bg-status-overdue hover:bg-status-overdue/90 text-white'
                : 'bg-expense hover:bg-expense/90 text-white'
            }
            shadow-md hover:shadow-lg transition-all duration-200
            flex items-center gap-2 font-medium
          `}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Pagar</span>
        </Button>
      )}
      
      {/* Type Icon with Glow Effect */}
      <div className={`
        absolute top-4 right-4 w-10 h-10 rounded-full ${theme.iconBg}
        flex items-center justify-center transition-all duration-300
        group-hover:scale-110 group-hover:shadow-lg
      `}>
        <IconComponent className={`h-5 w-5 ${theme.textColor}`} />
      </div>
      
      <NotionCardHeader className="pb-3 relative z-10 pr-16">
        <div className="space-y-2">
          {/* Header with Type Badge */}
          <div className="flex items-center gap-2 mb-1">
            <Badge 
              variant="outline" 
              className={`
                ${theme.textColor} border-current bg-current/10 text-xs font-semibold
                px-2 py-0.5
              `}
            >
              {theme.typeLabel}
            </Badge>
            {getStatusBadge(transaction.status, theme)}
          </div>
          
          {/* Title */}
          <h3 className={`
            font-bold text-xl leading-tight ${theme.textColor}
            group-hover:scale-105 transition-transform duration-200 origin-left
          `}>
            {transaction.template_name}
          </h3>
          
          {/* Description */}
          {transaction.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {transaction.description}
            </p>
          )}

          {/* Action Menu */}
          <div className="absolute top-3 right-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={`
                    opacity-0 group-hover:opacity-100 transition-all duration-200
                    h-8 w-8 p-0 hover:bg-current/10 ${theme.textColor}
                  `}
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
      </NotionCardHeader>

      <NotionCardContent className="space-y-4 relative z-10">
        {/* Financial Information - Enhanced Design */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`
            space-y-1 p-3 rounded-lg bg-current/5 border border-current/20
            ${theme.textColor}
          `}>
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              <p className="text-xs font-semibold opacity-80">Valor Esperado</p>
            </div>
            <p className="text-lg font-bold">
              {formatCurrency(transaction.expected_amount)}
            </p>
          </div>
          
          <div className="space-y-1 p-3 rounded-lg bg-muted/30 border border-muted">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground">Último Valor</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-foreground">
                {transaction.last_amount ? formatCurrency(transaction.last_amount) : 'N/A'}
              </p>
              {(() => {
                const varianceInfo = getVarianceInfo(transaction.variance_percentage, theme);
                return varianceInfo ? (
                  <div className={`flex items-center gap-1 ${varianceInfo.color}`}>
                    <varianceInfo.icon className="h-3 w-3" />
                    <span className="text-xs font-medium">
                      {varianceInfo.text}
                    </span>
                  </div>
                ) : null;
              })()}
            </div>
          </div>
        </div>

        {/* Due Date Section - Enhanced */}
        <div className={`
          p-3 rounded-lg border transition-all duration-200
          ${transaction.days_until_due < 0 
            ? 'bg-status-overdue-bg border-status-overdue/20' 
            : transaction.days_until_due <= 7 
              ? 'bg-status-upcoming-bg border-status-upcoming/20'
              : 'bg-status-active-bg border-status-active/20'
          }
        `}>
          <div className="flex items-center gap-2 mb-1">
            {(() => {
              const DaysIcon = getDaysUntilDueIcon(transaction.days_until_due);
              return (
                <>
                  <DaysIcon className={`h-4 w-4 ${getDaysUntilDueColor(transaction.days_until_due)}`} />
                  <span className={`text-sm font-semibold ${getDaysUntilDueColor(transaction.days_until_due)}`}>
                    {transaction.days_until_due < 0 
                      ? `${Math.abs(transaction.days_until_due)} dias em atraso`
                      : transaction.days_until_due === 0 
                        ? 'Vence hoje!' 
                        : `${transaction.days_until_due} dias até vencer`
                    }
                  </span>
                </>
              );
            })()}
          </div>
          <div className="text-xs text-muted-foreground">
            Próximo vencimento: {format(parseISO(transaction.next_due_date), 'dd/MM/yyyy')}
          </div>
        </div>

        {/* Category and Account Info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex flex-col">
            <span className="text-muted-foreground font-medium">Categoria</span>
            <span className="font-semibold text-foreground truncate">{transaction.category_name}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground font-medium">Conta</span>
            <span className="font-semibold text-foreground truncate">{transaction.account_name}</span>
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