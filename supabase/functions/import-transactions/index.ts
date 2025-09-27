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
    const mode = formData.get('mode') as string // 'preview' or 'import'
    const sourceId = formData.get('sourceId') as string
    const startIndex = formData.get('startIndex') ? parseInt(formData.get('startIndex') as string) : 0

    console.log('Import request:', { fileName: file?.name, mode, sourceId, startIndex, fileSize: file?.size })

    if (!file || !mode || !sourceId) {
      return new Response(
        JSON.stringify({ error: 'Arquivo, modo e origem são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process the file directly in memory
    const fileContent = await file.text()
    console.log('File content length:', fileContent.length)
    
    let transactions;
    try {
      transactions = await parseFile(fileContent, file.type, file.name)
      // Sort transactions by date descending (most recent first)
      transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      console.log('Parsed and sorted transactions count:', transactions.length)
    } catch (parseError) {
      console.error('Parse error:', parseError)
      const errorMessage = parseError instanceof Error ? parseError.message : 'Erro desconhecido'
      return new Response(
        JSON.stringify({ error: `Erro ao processar arquivo: ${errorMessage}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (transactions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Nenhuma transação válida encontrada no arquivo' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Preview mode: return parsed transactions for user selection
    if (mode === 'preview') {
      return new Response(
        JSON.stringify({ 
          success: true, 
          transactions: transactions.map((transaction, index) => ({
            index,
            description: transaction.description,
            amount: transaction.amount,
            date: transaction.date
          }))
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Import mode: Check if sourceId is an account or credit card
    console.log('Checking source type for ID:', sourceId)
    
    // First check if it's an account
    const { data: account, error: accountError } = await supabaseClient
      .from('accounts')
      .select('id, name, type')
      .eq('id', sourceId)
      .eq('user_id', user.id)
      .single()

    let isAccount = false
    let isCreditCard = false

    if (account && !accountError) {
      isAccount = true
      console.log('Source is an account:', account.name, account.type)
    } else {
      // Check if it's a credit card
      const { data: creditCard, error: creditCardError } = await supabaseClient
        .from('credit_cards')
        .select('id, name')
        .eq('id', sourceId)
        .eq('user_id', user.id)
        .single()

      if (creditCard && !creditCardError) {
        isCreditCard = true
        console.log('Source is a credit card:', creditCard.name)
      } else {
        console.error('Source not found in accounts or credit_cards:', { accountError, creditCardError })
        return new Response(
          JSON.stringify({ error: 'Conta ou cartão não encontrado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Select transactions from index 0 to startIndex (inclusive) - this imports selected transaction and all newer ones
    const transactionsToImport = transactions.slice(0, startIndex + 1)
    console.log(`Importing ${transactionsToImport.length} transactions from index 0 to ${startIndex} (inclusive)`)

    // Insert transactions into database with correct account/credit card assignment
    const transactionsToInsert = transactionsToImport.map(transaction => ({
      user_id: user.id,
      account_id: isAccount ? sourceId : null,
      credit_card_id: isCreditCard ? sourceId : null,
      category_id: null, // Always null for imported transactions
      description: transaction.description,
      amount: transaction.amount,
      event_date: transaction.date,
      input_source: 'import' as const,
      type: transaction.amount >= 0 ? 'receita' : 'despesa',
    }))

    console.log('Inserting transactions:', transactionsToInsert.length)
    console.log('Sample transaction to insert:', transactionsToInsert[0])

    const { data, error: insertError } = await supabaseClient
      .from('transactions')
      .insert(transactionsToInsert)
      .select()

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar transações no banco de dados' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Successfully inserted transactions:', data.length)

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
      JSON.stringify({ error: 'Erro interno do servidor' }),
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

  if (extension === 'csv' || mimeType.includes('csv') || mimeType === 'text/plain') {
    return parseCSV(content)
  } else if (extension === 'ofx' || mimeType.includes('ofx')) {
    return parseOFX(content)
  }

  throw new Error('Formato de arquivo não suportado. Use CSV ou OFX.')
}

function parseCSV(content: string): ParsedTransaction[] {
  console.log('Parsing CSV content...')
  
  // Remove BOM if present
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1)
  }

  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  if (lines.length === 0) {
    throw new Error('Arquivo CSV está vazio')
  }

  const transactions: ParsedTransaction[] = []
  
  // Detect delimiter by counting occurrences in first line
  const firstLine = lines[0]
  const commaCount = (firstLine.match(/,/g) || []).length
  const semicolonCount = (firstLine.match(/;/g) || []).length
  const delimiter = semicolonCount > commaCount ? ';' : ','
  
  console.log('Detected delimiter:', delimiter)
  console.log('First line raw:', firstLine)
  
  // Split first line to analyze structure
  const firstLineColumns = firstLine.split(delimiter).map(col => col.replace(/"/g, '').trim())
  console.log('First line columns:', firstLineColumns)
  
  // Intelligent header detection
  const headerKeywords = ['date', 'data', 'description', 'descricao', 'descrição', 'memo', 'histórico', 'historico', 
                         'name', 'estabelecimento', 'amount', 'valor', 'credit', 'credito', 'crédito', 
                         'debit', 'debito', 'débito', 'entrada', 'saida', 'saída', 'dt_posted', 'trnamt']
  
  const hasHeaderKeywords = firstLineColumns.some(col => 
    headerKeywords.some(keyword => col.toLowerCase().includes(keyword))
  )
  
  // Check if first line contains actual transaction data
  const hasDateInFirstColumn = isValidDateFormat(firstLineColumns[0])
  const hasAmountInColumns = firstLineColumns.some(col => isValidAmount(col))
  
  const hasHeader = hasHeaderKeywords && !hasDateInFirstColumn
  console.log('Header detection:', { hasHeaderKeywords, hasDateInFirstColumn, hasAmountInColumns, hasHeader })
  
  let headerColumns: string[] = []
  let dataStartIndex = 0
  let columnPatterns: Array<{
    index: number
    isDate: boolean
    isAmount: boolean
    hasNumbers: boolean
    sample: string
  }> = []
  
  if (hasHeader) {
    headerColumns = firstLineColumns.map(col => col.toLowerCase())
    dataStartIndex = 1
    console.log('Using detected header:', headerColumns)
  } else {
    // No header detected, use positional mapping
    headerColumns = []
    dataStartIndex = 0
    console.log('No header detected, using smart column detection')
    
    // Smart detection of column structure by analyzing data patterns
    const sampleSize = Math.min(3, lines.length - dataStartIndex)
    
    for (let colIndex = 0; colIndex < firstLineColumns.length; colIndex++) {
      const columnValues = []
      for (let lineIndex = dataStartIndex; lineIndex < dataStartIndex + sampleSize; lineIndex++) {
        if (lineIndex < lines.length) {
          const cols = lines[lineIndex].split(delimiter).map(col => col.replace(/"/g, '').trim())
          if (cols[colIndex]) {
            columnValues.push(cols[colIndex])
          }
        }
      }
      
      const isDateColumn = columnValues.some(val => isValidDateFormat(val))
      const isAmountColumn = columnValues.every(val => val === '' || isValidAmount(val))
      const hasNumbers = columnValues.some(val => /^[+-]?[\d,.]+$/.test(val.replace(/[R$\s]/g, '')))
      
      columnPatterns.push({
        index: colIndex,
        isDate: isDateColumn,
        isAmount: isAmountColumn,
        hasNumbers: hasNumbers,
        sample: columnValues[0] || ''
      })
      
      console.log(`Column ${colIndex} analysis:`, {
        sample: columnValues[0] || '',
        isDate: isDateColumn,
        isAmount: isAmountColumn,
        hasNumbers: hasNumbers
      })
    }
  }
  
  // Column mapping - either from header or smart detection
  const dateColumns = ['date', 'data', 'dt_posted', 'data de lançamento', 'data lancamento']
  const descColumns = ['description', 'descricao', 'descrição', 'memo', 'histórico', 'historico', 'name', 'estabelecimento']
  const amountColumns = ['amount', 'valor', 'valor_total', 'valor da operação', 'trnamt']
  const creditColumns = ['credit', 'credito', 'crédito', 'entrada']
  const debitColumns = ['debit', 'debito', 'débito', 'saida', 'saída']

  let dateIndex = -1, descIndex = -1, amountIndex = -1, creditIndex = -1, debitIndex = -1

  if (hasHeader) {
    // Map by header names
    headerColumns.forEach((col, index) => {
      if (dateColumns.some(dc => col.includes(dc))) dateIndex = index
      if (descColumns.some(dc => col.includes(dc))) descIndex = index
      if (amountColumns.some(ac => col.includes(ac))) amountIndex = index
      if (creditColumns.some(cc => col.includes(cc))) creditIndex = index
      if (debitColumns.some(dc => col.includes(dc))) debitIndex = index
    })
  } else {
    // Smart detection based on column patterns
    if (columnPatterns.length > 0) {
      // Find date column
      dateIndex = columnPatterns.find(p => p.isDate)?.index ?? -1
      
      // Find amount column (prefer columns with negative numbers)
      const amountCandidates = columnPatterns.filter(p => p.isAmount || p.hasNumbers)
      if (amountCandidates.length > 0) {
        // Prefer columns that look like amounts (with decimals, negative signs, etc.)
        amountIndex = amountCandidates.find(p => p.isAmount)?.index ?? amountCandidates[0].index
      }
      
      // Description is typically the remaining column(s), prefer first non-date, non-amount column
      for (const pattern of columnPatterns) {
        if (pattern.index !== dateIndex && pattern.index !== amountIndex && !pattern.isDate && !pattern.isAmount) {
          descIndex = pattern.index
          break
        }
      }
    }
  }

  // Fallback to positional mapping if smart detection failed
  if (dateIndex === -1) {
    // Try to find date in any position by testing actual values
    for (let i = 0; i < firstLineColumns.length; i++) {
      if (isValidDateFormat(firstLineColumns[i])) {
        dateIndex = i
        break
      }
    }
    // If still no date found, assume last column (common in some formats)
    if (dateIndex === -1 && firstLineColumns.length >= 3) {
      dateIndex = firstLineColumns.length - 1
    } else if (dateIndex === -1) {
      dateIndex = 0 // fallback
    }
  }
  
  if (descIndex === -1) {
    // Description is typically first column if not date
    descIndex = dateIndex === 0 ? 1 : 0
  }
  
  if (amountIndex === -1 && creditIndex === -1 && debitIndex === -1) {
    // Find amount column by looking for numbers
    for (let i = 0; i < firstLineColumns.length; i++) {
      if (i !== dateIndex && i !== descIndex && isValidAmount(firstLineColumns[i])) {
        amountIndex = i
        break
      }
    }
    // If still not found, use middle column or second column
    if (amountIndex === -1) {
      amountIndex = firstLineColumns.length >= 3 ? 1 : (dateIndex === 0 ? 1 : 0)
    }
  }

  console.log('Final column mapping:', { dateIndex, descIndex, amountIndex, creditIndex, debitIndex })

  // Ensure we have enough lines to process
  if (lines.length <= dataStartIndex) {
    throw new Error('Arquivo CSV não contém dados suficientes')
  }

  // Process data rows
  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue

    const columns = line.split(delimiter).map(col => col.replace(/"/g, '').trim())
    console.log(`Processing line ${i + 1}:`, columns)
    
    const minRequiredColumns = Math.max(dateIndex + 1, descIndex + 1, amountIndex + 1, creditIndex + 1, debitIndex + 1)
    if (columns.length < minRequiredColumns) {
      console.warn(`Line ${i + 1} has insufficient columns (has ${columns.length}, needs ${minRequiredColumns}):`, columns)
      continue
    }

    try {
      // Validate and parse date
      const dateValue = columns[dateIndex] || ''
      console.log(`Line ${i + 1} - Date value from column ${dateIndex}: "${dateValue}"`)
      
      if (!isValidDateFormat(dateValue)) {
        console.warn(`Line ${i + 1} has invalid date format "${dateValue}", skipping`)
        continue
      }
      
      const date = parseDate(dateValue)
      const description = columns[descIndex] || 'Transação importada'
      console.log(`Line ${i + 1} - Description from column ${descIndex}: "${description}"`)
      
      let amount = 0
      
      // Handle separate credit/debit columns
      if (creditIndex >= 0 && debitIndex >= 0) {
        const creditValue = parseAmount(columns[creditIndex] || '0')
        const debitValue = parseAmount(columns[debitIndex] || '0')
        amount = creditValue - debitValue
        console.log(`Line ${i + 1} - Credit/Debit: ${creditValue} - ${debitValue} = ${amount}`)
      } else if (creditIndex >= 0) {
        amount = parseAmount(columns[creditIndex] || '0')
        console.log(`Line ${i + 1} - Credit amount: ${amount}`)
      } else if (debitIndex >= 0) {
        amount = -parseAmount(columns[debitIndex] || '0')
        console.log(`Line ${i + 1} - Debit amount: ${amount}`)
      } else if (amountIndex >= 0) {
        amount = parseAmount(columns[amountIndex] || '0')
        console.log(`Line ${i + 1} - Amount from column ${amountIndex}: "${columns[amountIndex]}" -> ${amount}`)
      }

      // Final validation before adding transaction
      console.log(`Line ${i + 1} - Final validation:`, { 
        date, 
        description: description.trim(), 
        amount, 
        isValidDate: !!date,
        isValidDesc: !!description.trim(),
        isValidAmount: !isNaN(amount) && amount !== 0
      })
      
      if (!date || !description.trim() || isNaN(amount) || amount === 0) {
        console.warn(`Line ${i + 1} failed validation:`, { 
          date, 
          description: description.trim(), 
          amount, 
          isValidDate: !!date,
          isValidDesc: !!description.trim(),
          isValidAmount: !isNaN(amount) && amount !== 0
        })
        continue
      }
      
      transactions.push({
        date,
        description: description.trim(),
        amount
      })
      
      console.log(`Successfully parsed transaction ${transactions.length}:`, { date, description: description.trim(), amount })
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      console.warn(`Error parsing line ${i + 1}:`, errorMessage, 'Raw line:', line)
    }
  }

  if (transactions.length === 0) {
    throw new Error('Nenhuma transação válida foi encontrada no arquivo CSV')
  }

  console.log(`Successfully parsed ${transactions.length} valid transactions from CSV`)
  return transactions
}

function isValidDateFormat(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false
  
  // Check for common date patterns
  const datePatterns = [
    /^\d{1,2}\/\d{1,2}\/\d{4}$/,     // DD/MM/YYYY or MM/DD/YYYY  
    /^\d{1,2}-\d{1,2}-\d{4}$/,      // DD-MM-YYYY or MM-DD-YYYY
    /^\d{4}-\d{1,2}-\d{1,2}$/,      // YYYY-MM-DD
    /^\d{1,2}\/\d{1,2}\/\d{2}$/,    // DD/MM/YY or MM/DD/YY
    /^\d{8}$/,                      // YYYYMMDD
  ]
  
  const matchesPattern = datePatterns.some(pattern => pattern.test(dateStr.trim()))
  
  if (!matchesPattern) {
    console.log(`Date "${dateStr}" does not match expected patterns`)
    return false
  }
  
  // Try to parse as date to verify it's actually a valid date
  const date = new Date(dateStr)
  const isValidDate = !isNaN(date.getTime())
  
  console.log(`Date validation for "${dateStr}": pattern=${matchesPattern}, parseable=${isValidDate}`)
  return matchesPattern && isValidDate
}

function isValidAmount(amountStr: string): boolean {
  if (!amountStr || typeof amountStr !== 'string') return false
  
  // Remove common currency symbols and whitespace
  const cleaned = amountStr.trim().replace(/[R$\s]/g, '')
  
  // Check if it looks like a number (including negative, decimals, thousand separators)
  const amountPattern = /^[+-]?[\d,.]+$/
  
  if (!amountPattern.test(cleaned)) return false
  
  // Try to parse it
  const parsed = parseAmount(amountStr)
  return !isNaN(parsed)
}

function parseAmount(amountStr: string): number {
  if (!amountStr || amountStr.trim() === '') return 0
  
  // Handle Brazilian format: remove thousand separators and convert comma to dot
  let cleaned = amountStr.trim()
  
  // Remove currency symbols and extra spaces
  cleaned = cleaned.replace(/[R$\s]/g, '')
  
  // Handle formats like "1.234,56" (Brazilian) vs "1,234.56" (US)
  // If there's both comma and dot, determine which is decimal separator
  const hasComma = cleaned.includes(',')
  const hasDot = cleaned.includes('.')
  
  if (hasComma && hasDot) {
    // Both present - last one is decimal separator
    const lastCommaIndex = cleaned.lastIndexOf(',')
    const lastDotIndex = cleaned.lastIndexOf('.')
    
    if (lastCommaIndex > lastDotIndex) {
      // Comma is decimal separator (Brazilian format)
      cleaned = cleaned.replace(/\./g, '').replace(',', '.')
    } else {
      // Dot is decimal separator (US format)
      cleaned = cleaned.replace(/,/g, '')
    }
  } else if (hasComma && !hasDot) {
    // Only comma - check if it's decimal separator
    const commaIndex = cleaned.lastIndexOf(',')
    const afterComma = cleaned.substring(commaIndex + 1)
    
    if (afterComma.length <= 2 && /^\d+$/.test(afterComma)) {
      // Likely decimal separator
      cleaned = cleaned.replace(',', '.')
    } else {
      // Likely thousand separator
      cleaned = cleaned.replace(/,/g, '')
    }
  }
  
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

function parseOFX(content: string): ParsedTransaction[] {
  console.log('Parsing OFX content...')
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

  if (transactions.length === 0) {
    throw new Error('Nenhuma transação encontrada no arquivo OFX')
  }

  console.log(`Parsed ${transactions.length} transactions from OFX`)
  return transactions
}

function parseDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().slice(0, 10)
  
  console.log('Parsing date:', dateStr)
  
  // Try DD/MM/YYYY format first (Brazilian format)
  let parts = dateStr.split('/')
  if (parts.length === 3) {
    const day = parseInt(parts[0])
    const month = parseInt(parts[1]) - 1  // Month is 0-indexed in Date constructor
    const year = parseInt(parts[2])
    
    // Validate Brazilian date format (DD/MM/YYYY)
    if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900) {
      const date = new Date(year, month, day)
      if (!isNaN(date.getTime())) {
        const result = date.toISOString().slice(0, 10)
        console.log(`Parsed Brazilian date ${dateStr} -> ${result}`)
        return result
      }
    }
  }
  
  // Try DD-MM-YYYY format (Brazilian with dash)
  parts = dateStr.split('-')
  if (parts.length === 3) {
    // First try DD-MM-YYYY (Brazilian format)
    let day = parseInt(parts[0])
    let month = parseInt(parts[1]) - 1
    let year = parseInt(parts[2])
    
    if (year < 100) year += 2000 // Handle 2-digit years
    
    // Validate as Brazilian format first
    if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year >= 1900) {
      const date = new Date(year, month, day)
      if (!isNaN(date.getTime())) {
        const result = date.toISOString().slice(0, 10)
        console.log(`Parsed Brazilian date with dash ${dateStr} -> ${result}`)
        return result
      }
    }
    
    // If Brazilian format fails, try YYYY-MM-DD format
    year = parseInt(parts[0])
    month = parseInt(parts[1]) - 1
    day = parseInt(parts[2])
    
    if (year >= 1900 && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      const date = new Date(year, month, day)
      if (!isNaN(date.getTime())) {
        const result = date.toISOString().slice(0, 10)
        console.log(`Parsed ISO date ${dateStr} -> ${result}`)
        return result
      }
    }
  }
  
  // Try to parse as a standard date string
  const date = new Date(dateStr)
  if (!isNaN(date.getTime())) {
    const result = date.toISOString().slice(0, 10)
    console.log(`Parsed standard date ${dateStr} -> ${result}`)
    return result
  }
  
  console.warn('Could not parse date:', dateStr)
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
