import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DuplicateGroup {
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

// Calcula a distância de Levenshtein entre duas strings (similaridade)
function levenshteinDistance(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  const matrix: number[][] = [];
  
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[s2.length][s1.length];
}

function calculateSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 100;
  return Math.round((1 - distance / maxLength) * 100);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log(`Finding duplicates for user: ${user.id}`);

    // Buscar todas as transações do usuário com joins
    const { data: transactions, error: txError } = await supabaseClient
      .from('transactions')
      .select(`
        id,
        description,
        amount,
        event_date,
        account_id,
        category_id,
        counterparty_id,
        accounts!left(name),
        categories!left(name),
        counterparties!left(name)
      `)
      .eq('user_id', user.id)
      .order('event_date', { ascending: false });

    if (txError) {
      console.error('Error fetching transactions:', txError);
      throw txError;
    }

    console.log(`Found ${transactions?.length || 0} transactions to analyze`);

    // Agrupar por conta
    const byAccount = new Map<string, any[]>();
    transactions?.forEach(tx => {
      if (!tx.account_id) return; // Skip transactions without account
      
      if (!byAccount.has(tx.account_id)) {
        byAccount.set(tx.account_id, []);
      }
      byAccount.get(tx.account_id)!.push(tx);
    });

    console.log(`Grouped into ${byAccount.size} accounts`);

    // Detectar duplicatas dentro de cada conta
    const duplicateGroups: DuplicateGroup[] = [];
    const processedIds = new Set<string>();

    for (const [accountId, accountTxs] of byAccount.entries()) {
      for (let i = 0; i < accountTxs.length; i++) {
        const tx1 = accountTxs[i];
        if (processedIds.has(tx1.id)) continue;

        const potentialDuplicates: any[] = [tx1];

        for (let j = i + 1; j < accountTxs.length; j++) {
          const tx2 = accountTxs[j];
          if (processedIds.has(tx2.id)) continue;

          // Critério 1: Mesmo valor
          if (Math.abs(tx1.amount - tx2.amount) > 0.01) continue;

          // Critério 2: Dentro de 30 dias
          const date1 = new Date(tx1.event_date);
          const date2 = new Date(tx2.event_date);
          const daysDiff = Math.abs((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff > 30) continue;

          potentialDuplicates.push(tx2);
        }

        // Se encontrou duplicatas, criar grupo
        if (potentialDuplicates.length > 1) {
          potentialDuplicates.forEach(tx => processedIds.add(tx.id));

          // Calcular confiança
          const descSimilarity = calculateSimilarity(
            potentialDuplicates[0].description,
            potentialDuplicates[1].description
          );
          
          const categoryBonus = potentialDuplicates.every(tx => 
            tx.category_id === potentialDuplicates[0].category_id && tx.category_id !== null
          ) ? 20 : 0;
          
          const counterpartyBonus = potentialDuplicates.every(tx => 
            tx.counterparty_id === potentialDuplicates[0].counterparty_id && tx.counterparty_id !== null
          ) ? 20 : 0;
          
          const dates = potentialDuplicates.map(tx => new Date(tx.event_date).getTime());
          const daysApart = Math.abs((Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24));
          const daysScore = Math.max(0, 40 - daysApart); // Max 40 pontos, diminui com dias

          const confidence = Math.min(100, descSimilarity * 0.2 + daysScore + categoryBonus + counterpartyBonus);

          duplicateGroups.push({
            id: crypto.randomUUID(),
            account_id: accountId,
            account_name: accountTxs[0].accounts?.name || 'Sem conta',
            transactions: potentialDuplicates.map(tx => ({
              id: tx.id,
              description: tx.description,
              amount: tx.amount,
              event_date: tx.event_date,
              category_name: tx.categories?.name,
              counterparty_name: tx.counterparties?.name,
            })),
            confidence: Math.round(confidence),
            days_apart: Math.round(daysApart),
          });
        }
      }
    }

    // Ordenar grupos por confiança (maior primeiro)
    duplicateGroups.sort((a, b) => b.confidence - a.confidence);

    const totalDuplicatesFound = duplicateGroups.reduce((sum, g) => sum + g.transactions.length - 1, 0);

    console.log(`Found ${duplicateGroups.length} duplicate groups (${totalDuplicatesFound} duplicate transactions)`);

    return new Response(
      JSON.stringify({
        success: true,
        duplicate_groups: duplicateGroups,
        total_duplicates_found: totalDuplicatesFound,
        scanned_transactions: transactions?.length || 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error finding duplicates:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
