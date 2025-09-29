import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from './useTransactions';
import { Category } from './useCategories';

interface CategorizationResult {
  transaction_id: string;
  category_id: string;
  category_name: string;
  confidence: number;
}

interface CategorizationResponse {
  success: boolean;
  categorized_transactions?: CategorizationResult[];
  error?: string;
}

export function useExistingTransactionCategorization() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categorizeTransactions = async (
    transactions: Transaction[],
    categories: Category[]
  ): Promise<CategorizationResponse> => {
    setIsProcessing(true);
    setError(null);

    try {
      // Prepare categories for AI (flatten hierarchy)
      const flatCategories = categories.reduce((acc: any[], category) => {
        // Add parent category
        acc.push({
          id: category.id,
          name: category.name,
          type: category.type,
          parent_name: null
        });

        // Add subcategories
        if (category.subcategories) {
          category.subcategories.forEach(subcat => {
            acc.push({
              id: subcat.id,
              name: subcat.name,
              type: subcat.type,
              parent_name: category.name
            });
          });
        }

        return acc;
      }, []);

      const payload = {
        transactions: transactions.map(t => ({
          id: t.id,
          description: t.description,
          amount: t.amount,
          date: t.event_date,
        })),
        categories: flatCategories
      };

      console.log('Sending categorization request:', payload);

      const { data, error } = await supabase.functions.invoke('categorize-transactions', {
        body: payload,
      });

      if (error) {
        console.error('Categorization error:', error);
        throw new Error(error.message || 'Erro na comunicação com o serviço de IA');
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro no processamento da IA');
      }

      // Map the results back to our transaction format
      const categorizedTransactions: CategorizationResult[] = data.categorized_transactions?.map((ct: any) => ({
        transaction_id: ct.id,
        category_id: ct.category_id,
        category_name: ct.category_name,
        confidence: ct.confidence || 0,
      })) || [];

      return {
        success: true,
        categorized_transactions: categorizedTransactions
      };

    } catch (err: any) {
      console.error('Categorization failed:', err);
      const errorMessage = err.message || 'Erro desconhecido na categorização';
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    categorizeTransactions,
    isProcessing,
    error,
  };
}