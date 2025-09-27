
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  event_date: string;
  type: 'receita' | 'despesa';
  accounts: { name: string } | null;
  credit_cards: { name: string } | null;
}

interface RealizedTransactionsHoverProps {
  children: React.ReactNode;
  categoryIds: string[];
  selectedMonth: string;
}

export function RealizedTransactionsHover({ 
  children, 
  categoryIds, 
  selectedMonth 
}: RealizedTransactionsHoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['realized-transactions', user?.id, selectedMonth, categoryIds],
    queryFn: async (): Promise<Transaction[]> => {
      if (!user?.id || categoryIds.length === 0) return [];

      const startDate = selectedMonth;
      const endDate = new Date(selectedMonth);
      endDate.setMonth(endDate.getMonth() + 1);
      const endDateStr = endDate.toISOString().slice(0, 10);

      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          description,
          amount,
          event_date,
          type,
          accounts!left (
            name
          ),
          credit_cards!left (
            name
          )
        `)
        .eq('user_id', user.id)
        .in('category_id', categoryIds)
        .gte('event_date', startDate)
        .lt('event_date', endDateStr)
        .order('event_date', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        ...item,
        accounts: item.accounts && !('error' in item.accounts) ? item.accounts : null,
        credit_cards: item.credit_cards && !('error' in item.credit_cards) ? item.credit_cards : null,
      })) as Transaction[];
    },
    enabled: isOpen && !!user?.id && categoryIds.length > 0,
  });

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  return (
    <HoverCard open={isOpen} onOpenChange={setIsOpen}>
      <HoverCardTrigger asChild>
        <span className="cursor-help underline decoration-dotted underline-offset-2">
          {children}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-96 p-0" side="right" align="start">
        <div className="p-4 border-b">
          <h4 className="font-semibold text-mint-text-primary">
            Lançamentos do Período
          </h4>
          <p className="text-sm text-mint-text-secondary">
            {new Date(selectedMonth).toLocaleDateString('pt-BR', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </p>
        </div>
        
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="p-4 text-center text-mint-text-secondary">
              Carregando...
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-4 text-center text-mint-text-secondary">
              Nenhum lançamento encontrado no período
            </div>
          ) : (
            <div className="p-2">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="p-3 rounded-lg hover:bg-mint-hover border border-mint-border/20 mb-2 mx-2"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-mint-text-primary text-sm truncate">
                        {transaction.description}
                      </p>
                      <div className="flex flex-col gap-1 mt-1">
                        <p className="text-xs text-mint-text-secondary">
                          {formatDate(transaction.event_date)}
                        </p>
                        {(transaction.accounts || transaction.credit_cards) && (
                          <p className="text-xs text-mint-text-secondary">
                            {transaction.accounts?.name || transaction.credit_cards?.name}
                            {transaction.credit_cards && ' (Cartão)'}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                            Efetivado
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold text-sm ${
                        transaction.type === 'receita' 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {transaction.type === 'receita' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </HoverCardContent>
    </HoverCard>
  );
}
