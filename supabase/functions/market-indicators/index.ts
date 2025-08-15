
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting market indicators update...');

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // For now, we'll use mock data since we don't have access to Central Bank API
    // In a real implementation, you would fetch from: https://api.bcb.gov.br/dados/serie/bcdata.sgs.{series}/dados
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Mock indicators (in a real app, fetch from Central Bank API)
    const mockIndicators = {
      selic: 10.75, // Taxa Selic atual
      cdi: 10.65,   // CDI
      ipca: 4.62,   // IPCA acumulado 12 meses
    };

    console.log('Updating indicators for date:', todayStr);
    console.log('Indicators:', mockIndicators);

    // Upsert market indicators
    const { data, error } = await supabase
      .from('market_indicators')
      .upsert({
        indicator_date: todayStr,
        selic: mockIndicators.selic,
        cdi: mockIndicators.cdi,
        ipca: mockIndicators.ipca,
      }, {
        onConflict: 'indicator_date'
      });

    if (error) {
      console.error('Error updating market indicators:', error);
      throw error;
    }

    console.log('Market indicators updated successfully:', data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Market indicators updated successfully',
        data: mockIndicators,
        date: todayStr
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in market-indicators function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'Failed to update market indicators'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
