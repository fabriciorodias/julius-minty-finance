import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TransactionToImport {
  index: number;
  description: string;
  amount: number;
  date: string;
  category_id?: string;
}

interface ImportRequest {
  transactions: TransactionToImport[];
  sourceAccountId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Import categorized transactions function called');

    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get user from auth header
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    console.log('Authenticated user:', user.id);

    const body: ImportRequest = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    const { transactions, sourceAccountId } = body;

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      throw new Error('No transactions provided');
    }

    if (!sourceAccountId) {
      throw new Error('Source account ID is required');
    }

    // Verify the account belongs to the user
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, type')
      .eq('id', sourceAccountId)
      .eq('user_id', user.id)
      .single();

    if (accountError || !account) {
      throw new Error('Account not found or access denied');
    }

    console.log('Account verified:', account);

    // Prepare transactions for insertion
    const transactionsToInsert = transactions.map(transaction => {
      // Enhanced date validation for optimized N8N format
      let validDate = transaction.date;
      
      // Handle N8N optimized response formats
      if (validDate === 'INVALID_DATE') {
        console.warn('N8N returned INVALID_DATE, using current date');
        validDate = new Date().toISOString().split('T')[0];
      }
      
      // Convert DD/MM/YYYY to ISO format if needed (backward compatibility)
      if (validDate && validDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [day, month, year] = validDate.split('/');
        validDate = `${year}-${month}-${day}`;
        console.log(`Converted date format during import: ${transaction.date} → ${validDate}`);
      }
      
      // Validate final date
      try {
        const testDate = new Date(validDate);
        if (isNaN(testDate.getTime()) || 
            validDate === 'DD/MM/YYYY' || 
            validDate.includes('DD') || 
            validDate.includes('MM') || 
            validDate.includes('YYYY')) {
          console.warn('Invalid date detected during import, using current date:', validDate);
          validDate = new Date().toISOString().split('T')[0];
        }
      } catch (e) {
        console.warn('Date parsing error during import, using current date:', validDate);
        validDate = new Date().toISOString().split('T')[0];
      }

      // Determine transaction type based on amount and account type
      let transactionType: 'receita' | 'despesa';
      let finalAmount = transaction.amount;

      if (account.type === 'credit') {
        // For credit accounts, positive amounts are expenses (spending), negative are payments
        transactionType = transaction.amount > 0 ? 'despesa' : 'receita';
        finalAmount = Math.abs(transaction.amount);
      } else {
        // For on_budget accounts, positive amounts are income, negative are expenses
        transactionType = transaction.amount >= 0 ? 'receita' : 'despesa';
        finalAmount = Math.abs(transaction.amount);
      }

      return {
        user_id: user.id,
        account_id: sourceAccountId,
        description: transaction.description,
        amount: finalAmount,
        type: transactionType,
        event_date: validDate,
        input_source: 'import' as const,
        category_id: transaction.category_id || null,
        is_reviewed: transaction.category_id ? true : false, // Mark as reviewed if categorized
      };
    });

    console.log('Transactions to insert:', transactionsToInsert.length);

    // Insert transactions in batches (Supabase has a limit on batch size)
    const batchSize = 100;
    const batches = [];
    
    for (let i = 0; i < transactionsToInsert.length; i += batchSize) {
      batches.push(transactionsToInsert.slice(i, i + batchSize));
    }

    let totalInserted = 0;

    for (const batch of batches) {
      const { data: insertedTransactions, error: insertError } = await supabase
        .from('transactions')
        .insert(batch)
        .select('id');

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error(`Failed to insert transactions: ${insertError.message}`);
      }

      totalInserted += insertedTransactions?.length || 0;
      console.log(`Inserted batch of ${insertedTransactions?.length} transactions`);
    }

    console.log(`Successfully imported ${totalInserted} transactions`);

    const response = {
      success: true,
      message: `${totalInserted} transações importadas com sucesso`,
      imported_count: totalInserted,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in import-categorized-transactions function:', error);
    
    const errorResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor',
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});