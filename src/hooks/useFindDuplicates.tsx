import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface DuplicateGroup {
  id: string;
  account_id: string;
  account_name: string;
  transactions: Array<{
    id: string;
    description: string;
    amount: number;
    event_date: string;
    category_name?: string;
    counterparty_name?: string;
  }>;
  confidence: number;
  days_apart: number;
}

interface FindDuplicatesResponse {
  success: boolean;
  duplicate_groups: DuplicateGroup[];
  total_duplicates_found: number;
  scanned_transactions: number;
}

export function useFindDuplicates() {
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalDuplicates, setTotalDuplicates] = useState(0);
  const [scannedCount, setScannedCount] = useState(0);

  const findDuplicates = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Não autenticado');
      }

      const response = await supabase.functions.invoke<FindDuplicatesResponse>('find-duplicate-transactions', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw response.error;
      }

      if (!response.data?.success) {
        throw new Error('Erro ao buscar duplicatas');
      }

      const { duplicate_groups, total_duplicates_found, scanned_transactions } = response.data;
      
      setDuplicateGroups(duplicate_groups || []);
      setTotalDuplicates(total_duplicates_found || 0);
      setScannedCount(scanned_transactions || 0);

      if (duplicate_groups.length === 0) {
        toast({
          title: "Nenhuma duplicata encontrada",
          description: "Seus lançamentos estão organizados!",
        });
      }

    } catch (err: any) {
      console.error('Error finding duplicates:', err);
      const errorMessage = err.message || 'Erro ao buscar duplicatas';
      setError(errorMessage);
      toast({
        title: "Erro ao buscar duplicatas",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    findDuplicates,
    duplicateGroups,
    isLoading,
    error,
    totalDuplicates,
    scannedCount,
  };
}
