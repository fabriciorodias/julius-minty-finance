import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
}

interface Category {
  id: string;
  name: string;
  type: 'receita' | 'despesa';
  parent_name?: string;
}

interface CategorizationRequest {
  transactions: Transaction[];
  categories: Category[];
}

interface CategorizedTransaction {
  id: string;
  category_id?: string;
  category_name?: string;
  confidence?: number;
}

interface CategorizationResponse {
  success: boolean;
  categorized_transactions?: CategorizedTransaction[];
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Categorize transactions function called');

    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const body: CategorizationRequest = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    const { transactions, categories } = body;

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      throw new Error('No transactions provided');
    }

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      throw new Error('No categories provided');
    }

    // Get N8N webhook URL from environment
    const n8nWebhookUrl = Deno.env.get('N8N_WEBHOOK_URL');
    
    if (!n8nWebhookUrl) {
      throw new Error('N8N webhook URL not configured');
    }

    console.log('Sending request to N8N webhook...');

    // Send request to N8N
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactions,
        categories
      }),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error('N8N webhook error:', errorText);
      throw new Error(`N8N webhook failed: ${n8nResponse.status} ${n8nResponse.statusText}`);
    }

    const n8nResult = await n8nResponse.json();
    console.log('N8N response:', JSON.stringify(n8nResult, null, 2));

    // Validate N8N response format
    if (!n8nResult || typeof n8nResult !== 'object') {
      throw new Error('Invalid response format from AI service');
    }

    // Transform N8N response to our expected format
    let categorizedTransactions: CategorizedTransaction[] = [];

    if (n8nResult.categorized_transactions && Array.isArray(n8nResult.categorized_transactions)) {
      categorizedTransactions = n8nResult.categorized_transactions.map((ct: any) => ({
        id: ct.id || ct.transaction_id,
        category_id: ct.category_id || undefined,
        category_name: ct.category_name || undefined,
        confidence: ct.confidence || undefined,
      }));
    } else {
      // Fallback: return transactions without categorization
      console.warn('N8N did not return categorized_transactions, returning empty categories');
      categorizedTransactions = transactions.map(t => ({
        id: t.id,
        category_id: undefined,
        category_name: undefined,
        confidence: undefined,
      }));
    }

    const response: CategorizationResponse = {
      success: true,
      categorized_transactions: categorizedTransactions,
    };

    console.log('Returning response:', JSON.stringify(response, null, 2));

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in categorize-transactions function:', error);
    
    const errorResponse: CategorizationResponse = {
      success: false,
      error: error.message || 'Erro interno do servidor',
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});