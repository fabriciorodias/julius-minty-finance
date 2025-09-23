import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useRecurringTransactionMutations } from "@/hooks/useRecurringTransactions";
import { MarkAsPaidModal } from "./MarkAsPaidModal";
import { 
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Play,
  Pause,
  DollarSign
} from "lucide-react";
import type { RecurringTransactionWithAnalytics } from "@/hooks/useRecurringTransactions";

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

  const getDaysUntilDueColor = (days: number) => {
    if (days < 0) return "text-destructive";
    if (days <= 3) return "text-amber-600";
    if (days <= 7) return "text-amber-500";
    return "text-muted-foreground";
  };

  const getDaysUntilDueIcon = (days: number) => {
    if (days < 0) return <AlertCircle className="h-4 w-4" />;
    if (days <= 3) return <Clock className="h-4 w-4" />;
    return <Calendar className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string, days: number) => {
    if (status !== 'active') {
      return (
        <Badge variant={status === 'paused' ? 'secondary' : 'destructive'}>
          {status === 'paused' ? 'Pausada' : 'Cancelada'}
        </Badge>
      );
    }

    if (days < 0) {
      return <Badge variant="destructive">Em atraso</Badge>;
    }
    if (days <= 3) {
      return <Badge variant="default" className="bg-amber-500">Vence em breve</Badge>;
    }
    if (days <= 7) {
      return <Badge variant="secondary">Próxima semana</Badge>;
    }
    return <Badge variant="outline">Em dia</Badge>;
  };

  const getVarianceInfo = (variance: number) => {
    if (variance === 0) return { icon: null, color: "text-muted-foreground" };
    if (variance <= 10) return { 
      icon: <CheckCircle className="h-4 w-4" />, 
      color: "text-green-600" 
    };
    if (variance <= 25) return { 
      icon: <TrendingUp className="h-4 w-4" />, 
      color: "text-amber-600" 
    };
    return { 
      icon: <TrendingDown className="h-4 w-4" />, 
      color: "text-destructive" 
    };
  };

  const varianceInfo = getVarianceInfo(transaction.variance_percentage);
  const progressValue = Math.min(100, (transaction.variance_percentage / 50) * 100);

  const handleStatusToggle = () => {
    const newStatus = transaction.status === 'active' ? 'paused' : 'active';
    updateRecurringTransaction({
      id: transaction.id,
      data: { status: newStatus }
    });
  };

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja excluir esta conta recorrente?')) {
      deleteRecurringTransaction(transaction.id);
    }
  };

  return (
    <>
      <Card className="h-full hover:ring-2 hover:ring-primary/20 transition-all duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">
                {transaction.template_name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {transaction.description}
              </p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit} className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleStatusToggle}
                  disabled={isUpdating}
                  className="flex items-center gap-2"
                >
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
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2 text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2 mt-2">
            {getStatusBadge(transaction.status, transaction.days_until_due)}
            <Badge variant="outline" className="text-xs">
              {transaction.type === 'receita' ? 'Receita' : 'Despesa'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Amount Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Valor Esperado</span>
              <span className="font-semibold text-foreground">
                R$ {transaction.expected_amount.toLocaleString('pt-BR', { 
                  minimumFractionDigits: 2 
                })}
              </span>
            </div>
            
            {transaction.last_amount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Último Valor</span>
                <span className="text-sm">
                  R$ {transaction.last_amount.toLocaleString('pt-BR', { 
                    minimumFractionDigits: 2 
                  })}
                </span>
              </div>
            )}

            {transaction.variance_percentage > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {varianceInfo.icon}
                    <span className="text-xs text-muted-foreground">Variação</span>
                  </div>
                  <span className={`text-xs ${varianceInfo.color}`}>
                    {transaction.variance_percentage.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={progressValue} 
                  className="h-1" 
                />
              </div>
            )}
          </div>

          {/* Due Date Info */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              {getDaysUntilDueIcon(transaction.days_until_due)}
              <div>
                <p className="text-sm font-medium">
                  {format(new Date(transaction.next_due_date), "dd 'de' MMM", { locale: ptBR })}
                </p>
                <p className={`text-xs ${getDaysUntilDueColor(transaction.days_until_due)}`}>
                  {transaction.days_until_due < 0 
                    ? `${Math.abs(transaction.days_until_due)} dias em atraso`
                    : transaction.days_until_due === 0
                    ? 'Vence hoje'
                    : `${transaction.days_until_due} dias`
                  }
                </p>
              </div>
            </div>

            {transaction.status === 'active' && (
              <Button 
                size="sm" 
                onClick={() => setShowMarkAsPaidModal(true)}
                className="h-8"
              >
                <DollarSign className="h-3 w-3 mr-1" />
                Pagar
              </Button>
            )}
          </div>

          {/* Category & Account Info */}
          {(transaction.category_name || transaction.account_name) && (
            <div className="flex flex-wrap gap-1">
              {transaction.category_name && (
                <Badge variant="secondary" className="text-xs">
                  {transaction.category_name}
                </Badge>
              )}
              {transaction.account_name && (
                <Badge variant="outline" className="text-xs">
                  {transaction.account_name}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <MarkAsPaidModal
        open={showMarkAsPaidModal}
        onOpenChange={setShowMarkAsPaidModal}
        transaction={transaction}
      />
    </>
  );
}