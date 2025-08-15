
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
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const importType = formData.get('importType') as string // 'account' or 'credit_card'
    const sourceId = formData.get('sourceId') as string

    if (!file || !importType || !sourceId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Upload file to storage
    const fileName = `${user.id}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabaseClient.storage
      .from('imports')
      .upload(fileName, file)

    if (uploadError) {
      return new Response(
        JSON.stringify({ error: 'Failed to upload file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process the file based on its type
    const fileContent = await file.text()
    const transactions = await parseFile(fileContent, file.type, file.name)

    // Insert transactions into database
    const transactionsToInsert = transactions.map(transaction => ({
      user_id: user.id,
      account_id: importType === 'account' ? sourceId : null,
      credit_card_id: importType === 'credit_card' ? sourceId : null,
      category_id: null, // Always null for imported transactions
      description: transaction.description,
      amount: transaction.amount,
      event_date: transaction.date,
      effective_date: null,
      status: 'pendente',
      type: transaction.amount >= 0 ? 'receita' : 'despesa',
    }))

    const { data, error: insertError } = await supabaseClient
      .from('transactions')
      .insert(transactionsToInsert)
      .select()

    if (insertError) {
      // Clean up uploaded file on error
      await supabaseClient.storage.from('imports').remove([fileName])
      return new Response(
        JSON.stringify({ error: 'Failed to insert transactions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Clean up uploaded file after successful processing
    await supabaseClient.storage.from('imports').remove([fileName])

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: data.length,
        message: `${data.length} transações importadas com sucesso` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Import error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

interface ParsedTransaction {
  description: string
  amount: number
  date: string
}

async function parseFile(content: string, mimeType: string, fileName: string): Promise<ParsedTransaction[]> {
  const extension = fileName.split('.').pop()?.toLowerCase()

  if (extension === 'csv' || mimeType.includes('csv')) {
    return parseCSV(content)
  } else if (extension === 'ofx' || mimeType.includes('ofx')) {
    return parseOFX(content)
  } else if (extension === 'xlsx' || extension === 'xls' || mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
    // For Excel files, we'll need to handle them as CSV for now
    // In a real implementation, you'd use a library like xlsx
    return parseCSV(content)
  }

  throw new Error('Unsupported file format')
}

function parseCSV(content: string): ParsedTransaction[] {
  const lines = content.split('\n')
  const transactions: ParsedTransaction[] = []

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const columns = line.split(',').map(col => col.replace(/"/g, '').trim())
    
    if (columns.length >= 3) {
      // Assuming format: date, description, amount
      // You may need to adjust this based on your CSV format
      const date = parseDate(columns[0])
      const description = columns[1] || 'Transação importada'
      const amount = parseFloat(columns[2]) || 0

      if (date && description && !isNaN(amount)) {
        transactions.push({
          date,
          description,
          amount
        })
      }
    }
  }

  return transactions
}

function parseOFX(content: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = []
  
  // Simple OFX parsing - in production you'd use a proper OFX parser
  const transactionRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g
  let match

  while ((match = transactionRegex.exec(content)) !== null) {
    const transactionData = match[1]
    
    const dateMatch = transactionData.match(/<DTPOSTED>(\d{8})/);
    const amountMatch = transactionData.match(/<TRNAMT>([+-]?\d+\.?\d*)/);
    const memoMatch = transactionData.match(/<MEMO>(.*?)</);
    const nameMatch = transactionData.match(/<NAME>(.*?)</);

    if (dateMatch && amountMatch) {
      const date = formatOFXDate(dateMatch[1])
      const amount = parseFloat(amountMatch[1])
      const description = memoMatch?.[1] || nameMatch?.[1] || 'Transação OFX importada'

      transactions.push({
        date,
        description,
        amount
      })
    }
  }

  return transactions
}

function parseDate(dateStr: string): string {
  // Try to parse various date formats and return YYYY-MM-DD
  const date = new Date(dateStr)
  if (!isNaN(date.getTime())) {
    return date.toISOString().slice(0, 10)
  }
  
  // Try DD/MM/YYYY format
  const parts = dateStr.split('/')
  if (parts.length === 3) {
    const day = parseInt(parts[0])
    const month = parseInt(parts[1]) - 1
    const year = parseInt(parts[2])
    const parsedDate = new Date(year, month, day)
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString().slice(0, 10)
    }
  }
  
  return new Date().toISOString().slice(0, 10) // fallback to today
}

function formatOFXDate(ofxDate: string): string {
  // OFX dates are typically YYYYMMDD
  if (ofxDate.length >= 8) {
    const year = ofxDate.slice(0, 4)
    const month = ofxDate.slice(4, 6)
    const day = ofxDate.slice(6, 8)
    return `${year}-${month}-${day}`
  }
  return new Date().toISOString().slice(0, 10)
}
