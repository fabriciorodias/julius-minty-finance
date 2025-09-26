import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      console.error('User authentication error:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const sourceId = formData.get('sourceId') as string

    console.log('OCR request:', { 
      fileName: file?.name, 
      sourceId, 
      fileSize: file?.size, 
      fileType: file?.type 
    })

    if (!file || !sourceId) {
      return new Response(
        JSON.stringify({ error: 'Imagem e conta de origem são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Tipo de arquivo não suportado. Use PNG, JPEG ou PDF.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate unique file name
    const timestamp = new Date().getTime()
    const fileExtension = file.name.split('.').pop() || 'png'
    const fileName = `${user.id}/ocr-temp/${timestamp}.${fileExtension}`

    console.log('Uploading file to storage:', fileName)

    // Upload file to temporary storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('imports')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return new Response(
        JSON.stringify({ error: 'Erro ao fazer upload da imagem' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create signed URL for the uploaded file (valid for 10 minutes)
    const { data: signedUrlData, error: signedUrlError } = await supabaseClient.storage
      .from('imports')
      .createSignedUrl(fileName, 600) // 10 minutes expiration

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError)
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar URL de acesso à imagem' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const imageUrl = signedUrlData.signedUrl
    console.log('Signed URL created for N8N access:', imageUrl)

    // Send to N8N webhook for OCR processing
    const n8nWebhookUrl = Deno.env.get('N8N_OCR_WEBHOOK_URL')
    if (!n8nWebhookUrl) {
      console.error('N8N_OCR_WEBHOOK_URL not configured')
      return new Response(
        JSON.stringify({ error: 'Serviço de OCR não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Sending to N8N webhook:', n8nWebhookUrl)
    
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl: imageUrl,
        userId: user.id,
        fileName: file.name,
        timestamp: timestamp
      }),
    })

    if (!n8nResponse.ok) {
      console.error('N8N webhook error:', n8nResponse.status, n8nResponse.statusText)
      throw new Error(`Erro no processamento OCR: ${n8nResponse.status}`)
    }

    const n8nData = await n8nResponse.json()
    console.log('N8N response:', n8nData)

    // Clean up temporary file
    try {
      await supabaseClient.storage
        .from('imports')
        .remove([fileName])
      console.log('Temporary file cleaned up:', fileName)
    } catch (cleanupError) {
      console.warn('Could not clean up temporary file:', cleanupError)
    }

    // Validate N8N response structure
    if (!n8nData.success || !n8nData.transactions) {
      console.error('Invalid N8N response:', n8nData)
      return new Response(
        JSON.stringify({ 
          error: n8nData.error || 'Não foi possível extrair transações da imagem. Verifique se a imagem está legível.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Format transactions for frontend
    const transactions = n8nData.transactions.map((transaction: any, index: number) => ({
      index,
      description: transaction.description || 'Transação extraída via OCR',
      amount: parseFloat(transaction.amount) || 0,
      date: transaction.date || new Date().toISOString().slice(0, 10)
    }))

    // Sort transactions by date descending (most recent first)
    transactions.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

    console.log(`Successfully extracted ${transactions.length} transactions via OCR`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        transactions: transactions,
        extractedText: n8nData.extractedText || '',
        message: `${transactions.length} transações extraídas da imagem`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('OCR extraction error:', error)

    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erro interno no processamento OCR' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})