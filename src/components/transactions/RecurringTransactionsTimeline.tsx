import { useMemo } from "react";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, ChevronLeft, ChevronRight, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecurringTransactionWithAnalytics } from "@/hooks/useRecurringTransactions";

interface RecurringTransactionsTimelineProps {
  transactions: RecurringTransactionWithAnalytics[];
}

export function RecurringTransactionsTimeline({ 
  transactions 
}: RecurringTransactionsTimelineProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const timelineData = useMemo(() => {
    const activeTransactions = transactions.filter(t => t.status === 'active');
    
    // Calendar view data
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    const calendarData = daysInMonth.map(day => {
      const dayTransactions = activeTransactions.filter(transaction => {
        const dueDate = new Date(transaction.next_due_date);
        return isSameDay(day, dueDate);
      });
      
      return {
        date: day,
        transactions: dayTransactions,
        totalAmount: dayTransactions.reduce((sum, t) => sum + t.expected_amount, 0),
        hasOverdue: dayTransactions.some(t => t.days_until_due < 0),
        hasUpcoming: dayTransactions.some(t => t.days_until_due <= 7 && t.days_until_due >= 0)
      };
    });

    // List view data - next 30 days
    const next30Days = activeTransactions
      .filter(t => t.days_until_due <= 30)
      .sort((a, b) => new Date(a.next_due_date).getTime() - new Date(b.next_due_date).getTime());

    return {
      calendarData,
      next30Days
    };
  }, [transactions, currentDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDayStyles = (dayData: typeof timelineData.calendarData[0]) => {
    if (dayData.transactions.length === 0) return "text-muted-foreground";
    if (dayData.hasOverdue) return "bg-destructive text-destructive-foreground";
    if (dayData.hasUpcoming) return "bg-amber-500 text-white";
    return "bg-primary text-primary-foreground";
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="calendar" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calendar">Calendário</TabsTrigger>
          <TabsTrigger value="list">Lista</TabsTrigger>
        </TabsList>

        {/* Calendar View */}
        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigateMonth('prev')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Hoje
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigateMonth('next')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                  <div key={day} className="p-2 text-center font-medium text-muted-foreground text-sm">
                    {day}
                  </div>
                ))}
                
                {timelineData.calendarData.map((dayData, index) => (
                  <div key={index} className="min-h-[80px] p-1">
                    <div
                      className={cn(
                        "w-full h-full rounded-lg p-2 text-sm transition-colors",
                        getDayStyles(dayData),
                        dayData.transactions.length > 0 && "cursor-pointer hover:opacity-80"
                      )}
                    >
                      <div className="font-medium">
                        {format(dayData.date, 'd')}
                      </div>
                      {dayData.transactions.length > 0 && (
                        <div className="mt-1 space-y-1">
                          <div className="text-xs">
                            {dayData.transactions.length} conta{dayData.transactions.length > 1 ? 's' : ''}
                          </div>
                          <div className="text-xs font-medium">
                            R$ {dayData.totalAmount.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-destructive rounded"></div>
                  <span>Em atraso</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-amber-500 rounded"></div>
                  <span>Próximos 7 dias</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-primary rounded"></div>
                  <span>Agendado</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* List View */}
        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Próximos 30 dias</CardTitle>
            </CardHeader>
            <CardContent>
              {timelineData.next30Days.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma conta com vencimento nos próximos 30 dias
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {timelineData.next30Days.map((transaction) => (
                    <div
                      key={transaction.id}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-lg border",
                        transaction.days_until_due < 0 && "border-destructive/50 bg-destructive/5",
                        transaction.days_until_due <= 3 && transaction.days_until_due >= 0 && "border-amber-500/50 bg-amber-500/5"
                      )}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <h4 className="font-semibold">{transaction.template_name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {transaction.description}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {transaction.days_until_due < 0 && (
                              <Badge variant="destructive">
                                {Math.abs(transaction.days_until_due)} dias atraso
                              </Badge>
                            )}
                            {transaction.days_until_due === 0 && (
                              <Badge variant="destructive">Hoje</Badge>
                            )}
                            {transaction.days_until_due > 0 && transaction.days_until_due <= 7 && (
                              <Badge variant="default" className="bg-amber-500">
                                {transaction.days_until_due} dias
                              </Badge>
                            )}
                            {transaction.days_until_due > 7 && (
                              <Badge variant="outline">
                                {transaction.days_until_due} dias
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-semibold">
                            R$ {transaction.expected_amount.toLocaleString('pt-BR', { 
                              minimumFractionDigits: 2 
                            })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(parseISO(transaction.next_due_date), "dd/MM/yyyy")}
                          </div>
                        </div>

                        <Button size="sm" variant="outline">
                          <DollarSign className="h-4 w-4 mr-1" />
                          Pagar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Add the missing useState import
import { useState } from "react";