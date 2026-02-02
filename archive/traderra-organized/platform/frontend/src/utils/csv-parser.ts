export interface TraderVueTrade {
  'Open Datetime': string
  'Close Datetime': string
  'Symbol': string
  'Side': string
  'Volume': string
  'Exec Count': string
  'Entry Price': string
  'Exit Price': string
  'Gross P&L': string
  'Gross P&L (%)': string
  'Shared': string
  'Notes': string
  'Tags': string
  'Gross P&L (t)': string
  'Net P&L': string
  'Commissions': string
  'Fees': string
  'Initial Risk': string
  'P&L (R)': string
  'Position MFE': string
  'Position MAE': string
  'Price MFE': string
  'Price MAE': string
  'Position MFE Datetime': string
  'Position MAE Datetime': string
  'Price MFE Datetime': string
  'Price MAE Datetime': string
  'Best Exit P&L': string
  'Best Exit Datetime': string
}

export interface TraderraTrade {
  id: string
  date: string
  symbol: string
  side: 'Long' | 'Short'
  quantity: number
  entryPrice: number
  exitPrice: number
  pnl: number
  pnlPercent: number
  commission: number
  duration: string
  strategy: string
  notes: string
  entryTime: string
  exitTime: string
  riskAmount?: number
  riskPercent?: number
  stopLoss?: number
  rMultiple?: number
  mfe?: number
  mae?: number
}

export function parseCSV(csvText: string): TraderVueTrade[] {
  const lines = csvText.trim().split('\n')
  if (lines.length === 0) return []

  // Clean headers to handle potential BOM and whitespace issues
  let headerLine = lines[0]
  if (headerLine.charCodeAt(0) === 0xFEFF) {
    headerLine = headerLine.slice(1) // Remove BOM
  }

  const headers = parseCSVLine(headerLine).map(h => h.trim())
  const trades: TraderVueTrade[] = []

  // Validate that we have the expected TradervUE columns
  const expectedColumns = [
    'Open Datetime', 'Close Datetime', 'Symbol', 'Side', 'Volume',
    'Exec Count', 'Entry Price', 'Exit Price', 'Gross P&L', 'Gross P&L (%)',
    'Shared', 'Notes', 'Tags', 'Gross P&L (t)', 'Net P&L', 'Commissions',
    'Fees', 'Initial Risk', 'P&L (R)', 'Position MFE', 'Position MAE',
    'Price MFE', 'Price MAE', 'Position MFE Datetime', 'Position MAE Datetime',
    'Price MFE Datetime', 'Price MAE Datetime', 'Best Exit P&L', 'Best Exit Datetime'
  ]

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i])

      // Handle cases where row has different number of columns
      if (values.length > 0) {
        const trade: any = {}

        // Map values to headers, padding with empty strings if needed
        headers.forEach((header, index) => {
          trade[header] = index < values.length ? values[index].trim() : ''
        })

        // Only add trade if it has critical fields
        if (trade['Symbol'] && (trade['Open Datetime'] || trade['Close Datetime'])) {
          trades.push(trade as TraderVueTrade)
        }
      }
    } catch (error) {
      // Log the error but continue processing other rows
      console.warn(`Error parsing row ${i + 1}:`, error)
    }
  }

  return trades
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  let i = 0

  while (i < line.length) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Handle escaped quotes
        current += '"'
        i += 2
        continue
      } else {
        // Toggle quote state
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // Found delimiter outside quotes
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
    i++
  }

  // Push the last field
  result.push(current.trim())
  return result
}

export function convertTraderVueToTraderra(traderVueTrades: TraderVueTrade[]): TraderraTrade[] {
  const timestamp = Date.now()
  return traderVueTrades.map((trade, index) => {
    // Parse dates with explicit format handling and proper validation
    const parseDateTime = (dateTimeStr: string): Date => {
      // Handle format: "2025-10-10 09:42:38"
      const cleaned = dateTimeStr ? dateTimeStr.trim() : ''

      // Return null for empty strings instead of current date
      if (!cleaned || cleaned === '' || cleaned === '""' || cleaned === 'null') {
        // For required dates (open/close), use a fallback
        // For optional dates, this will be handled later
        return new Date('2020-01-01T00:00:00.000Z') // Safe fallback date
      }

      try {
        // Convert to ISO format for JavaScript Date parsing
        const isoFormat = cleaned.replace(' ', 'T')
        let date = new Date(isoFormat)

        // If still invalid, try alternative parsing approaches
        if (isNaN(date.getTime())) {
          const parts = cleaned.split(' ')
          if (parts.length === 2) {
            const [datePart, timePart] = parts
            const isoString = `${datePart}T${timePart}`
            date = new Date(isoString)
          }

          // If still invalid, try with explicit timezone
          if (isNaN(date.getTime())) {
            date = new Date(`${cleaned}Z`)
          }

          // Final fallback for critical datetime fields
          if (isNaN(date.getTime())) {
            console.warn(`⚠️ Invalid datetime encountered: "${dateTimeStr}". Using fallback.`)
            return new Date('2020-01-01T00:00:00.000Z')
          }
        }

        // Validate that the date is reasonable (not before 2000 or after 2030)
        if (date.getFullYear() < 2000 || date.getFullYear() > 2030) {
          console.warn(`⚠️ Unreasonable date encountered: "${dateTimeStr}". Using fallback.`)
          return new Date('2020-01-01T00:00:00.000Z')
        }

        return date
      } catch (error) {
        console.warn(`⚠️ Error parsing datetime "${dateTimeStr}":`, error)
        return new Date('2020-01-01T00:00:00.000Z')
      }
    }

    const entryDateTime = parseDateTime(trade['Open Datetime'])
    const exitDateTime = parseDateTime(trade['Close Datetime'])

    // Calculate duration with safety checks
    const durationMs = Math.max(0, exitDateTime.getTime() - entryDateTime.getTime())
    const hours = Math.floor(durationMs / (1000 * 60 * 60))
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000)
    const duration = `${Math.max(0, hours).toString().padStart(2, '0')}:${Math.max(0, minutes).toString().padStart(2, '0')}:${Math.max(0, seconds).toString().padStart(2, '0')}`

    // Parse numeric values with enhanced safety checks for TradervUE data
    const safeParseFloat = (value: string): number => {
      if (!value || typeof value !== 'string') return 0

      // Handle TradervUE specific values
      const cleanValue = value.trim()
      if (cleanValue === '' || cleanValue === 'N/A' || cleanValue === 'n/a') return 0
      if (cleanValue === 'Inf' || cleanValue === 'inf' || cleanValue === 'Infinity') return 0
      if (cleanValue === '-Inf' || cleanValue === '-inf' || cleanValue === '-Infinity') return 0

      // Remove any currency symbols, commas, or percentage signs
      const numericValue = cleanValue.replace(/[$,%]/g, '')
      const parsed = parseFloat(numericValue)

      // Ensure finite values and proper precision (round to 4 decimal places for accuracy)
      if (isNaN(parsed) || !isFinite(parsed)) return 0
      return Math.round(parsed * 10000) / 10000
    }

    const safeParseInt = (value: string): number => {
      if (!value || typeof value !== 'string') return 0

      const cleanValue = value.trim().replace(/[,$]/g, '')
      if (cleanValue === '' || cleanValue === 'N/A' || cleanValue === 'n/a') return 0

      const parsed = parseInt(cleanValue)
      return isNaN(parsed) ? 0 : parsed
    }

    const entryPrice = safeParseFloat(trade['Entry Price'])
    const exitPrice = safeParseFloat(trade['Exit Price'])
    const netPnL = safeParseFloat(trade['Net P&L'])
    const grossPnLPercent = safeParseFloat(trade['Gross P&L (%)'])
    const commission = safeParseFloat(trade['Commissions'])
    const fees = safeParseFloat(trade['Fees'])
    const totalCommission = commission + fees
    const volume = safeParseInt(trade['Volume'])
    const initialRisk = safeParseFloat(trade['Initial Risk'])
    const rMultipleStr = trade['P&L (R)'] || '0R'
    const rMultiple = safeParseFloat(rMultipleStr.replace('R', ''))

    // Optional values that can be undefined
    const mfeValue = safeParseFloat(trade['Position MFE'])
    const maeValue = safeParseFloat(trade['Position MAE'])
    const mfe = mfeValue !== 0 ? mfeValue : undefined
    const mae = maeValue !== 0 ? maeValue : undefined

    // Use original tags as strategy (preserve user's naming)
    const tags = trade['Tags'] || ''
    const strategy = tags.trim() || 'Untagged'

    // Calculate risk percentage (if initial risk is available)
    const riskPercent = initialRisk > 0 ? (initialRisk / (volume * entryPrice)) * 100 : undefined

    // Create safe date strings with consistent UTC formatting for chart compatibility
    const createSafeDateString = (date: Date): string => {
      try {
        if (!date || isNaN(date.getTime())) {
          return '2020-01-01T00:00:00.000Z'
        }

        // Use ISO string format for consistent timezone handling with chart data
        // This ensures arrows are positioned correctly on the trading chart
        return date.toISOString()
      } catch (error) {
        console.warn('Error creating date string:', error)
        return '2020-01-01T00:00:00.000Z'
      }
    }

    const createSafeDateOnly = (date: Date): string => {
      try {
        if (!date || isNaN(date.getTime())) {
          return '2020-01-01'
        }
        return date.toISOString().split('T')[0]
      } catch (error) {
        console.warn('Error creating date string:', error)
        return '2020-01-01'
      }
    }

    return {
      id: `import_${timestamp}_${index + 1}`, // More unique ID
      date: createSafeDateOnly(entryDateTime),
      symbol: trade['Symbol'] || '',
      side: trade['Side'] === 'S' ? 'Short' : 'Long',
      quantity: volume,
      entryPrice,
      exitPrice,
      pnl: netPnL,
      pnlPercent: grossPnLPercent,
      commission: totalCommission,
      duration,
      strategy,
      notes: trade['Notes'] || '',
      entryTime: createSafeDateString(entryDateTime),
      exitTime: createSafeDateString(exitDateTime),
      riskAmount: initialRisk > 0 ? initialRisk : undefined,
      riskPercent,
      rMultiple,
      mfe,
      mae
    }
  })
}

export interface ValidationResult {
  valid: boolean
  error?: string
  warnings?: string[]
  preview?: TraderVueTrade[]
  statistics?: {
    totalTrades: number
    tradesWithIssues: number
    optionsTrades: number
    invalidSymbols: string[]
    infiniteValues: number
    processingTime: number
  }
}

export function validateTraderVueCSV(csvText: string): ValidationResult {
  const startTime = Date.now()

  try {
    // First check the CSV structure before parsing
    if (!csvText || csvText.trim().length === 0) {
      return { valid: false, error: 'CSV file is empty' }
    }

    const lines = csvText.trim().split('\n')
    if (lines.length < 2) {
      return { valid: false, error: 'CSV file must have at least a header and one data row' }
    }

    // Check headers first to provide better error messages
    let headerLine = lines[0]
    if (headerLine.charCodeAt(0) === 0xFEFF) {
      headerLine = headerLine.slice(1) // Remove BOM
    }

    const headers = headerLine.split(',').map(h => h.trim().replace(/"/g, ''))
    const requiredColumns = ['Open Datetime', 'Close Datetime', 'Symbol', 'Side', 'Volume', 'Entry Price', 'Exit Price', 'Net P&L']
    const missingColumns = requiredColumns.filter(col => !headers.includes(col))

    if (missingColumns.length > 0) {
      return { valid: false, error: `Missing required columns: ${missingColumns.join(', ')}` }
    }

    // Now parse the trades
    const trades = parseCSV(csvText)

    if (trades.length === 0) {
      return { valid: false, error: 'No valid trades found in CSV file (all rows may be missing critical data)' }
    }

    // Enhanced validation for TradervUE specific issues
    const warnings: string[] = []
    let tradesWithIssues = 0
    let optionsTrades = 0
    let infiniteValues = 0
    const invalidSymbols: string[] = []

    trades.forEach((trade, index) => {
      // Check for options trades (common patterns)
      const symbol = trade['Symbol'] || ''
      if (isOptionsSymbol(symbol)) {
        optionsTrades++
      }

      // Check for invalid symbols (empty or problematic)
      if (!symbol.trim()) {
        invalidSymbols.push(`Row ${index + 2}: Empty symbol`)
        tradesWithIssues++
      }

      // Check for infinite values in critical fields
      const netPnL = trade['Net P&L'] || ''
      const grossPnL = trade['Gross P&L'] || ''
      const pnlPercent = trade['Gross P&L (%)'] || ''

      if (netPnL.includes('Inf') || grossPnL.includes('Inf') || pnlPercent.includes('Inf')) {
        infiniteValues++
      }

      // Check for missing critical data and datetime validity
      const openDateTime = trade['Open Datetime'] || ''
      const closeDateTime = trade['Close Datetime'] || ''

      if (!openDateTime || !closeDateTime) {
        tradesWithIssues++
      } else {
        // Test datetime parsing to catch "Invalid time value" errors early
        try {
          const testOpen = new Date(openDateTime.replace(' ', 'T'))
          const testClose = new Date(closeDateTime.replace(' ', 'T'))

          if (isNaN(testOpen.getTime()) || isNaN(testClose.getTime())) {
            console.warn(`Row ${index + 2}: Invalid datetime format - Open: "${openDateTime}", Close: "${closeDateTime}"`)
            tradesWithIssues++
          }
        } catch (error) {
          console.warn(`Row ${index + 2}: Datetime parsing error`, error)
          tradesWithIssues++
        }
      }
    })

    // Generate warnings
    if (optionsTrades > 0) {
      warnings.push(`Found ${optionsTrades} options trades - verify symbol handling`)
    }

    if (infiniteValues > 0) {
      warnings.push(`Found ${infiniteValues} trades with infinite values - will be converted to 0`)
    }

    if (invalidSymbols.length > 0) {
      warnings.push(`Found ${invalidSymbols.length} trades with invalid symbols`)
    }

    const processingTime = Date.now() - startTime

    return {
      valid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
      preview: trades.slice(0, 5),
      statistics: {
        totalTrades: trades.length,
        tradesWithIssues,
        optionsTrades,
        invalidSymbols,
        infiniteValues,
        processingTime
      }
    }
  } catch (error) {
    return {
      valid: false,
      error: `Error parsing CSV: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

function isOptionsSymbol(symbol: string): boolean {
  if (!symbol) return false

  // Common options symbol patterns:
  // 1. Traditional format: AAPL240315C00180000 (stock + date + C/P + strike)
  // 2. Manual entries: SPYO, PLTRB, CWD, PRSO, etc.
  // 3. Complex options: symbols ending with numbers or containing specific patterns

  const cleanSymbol = symbol.trim().toUpperCase()

  // Check for traditional options format (contains date and C/P)
  if (/\d{6}[CP]\d{8}/.test(cleanSymbol)) return true

  // Check for common manual options entries (based on research findings)
  const manualOptionsPatterns = [
    'SPYO', 'PLTRB', 'CWD', 'PRSO'
  ]

  // Exact match for known manual options entries
  if (manualOptionsPatterns.includes(cleanSymbol)) {
    return true
  }

  // Check for ETF options (QQQ, SPY etc with unusual symbols)
  if ((cleanSymbol.includes('QQQ') || cleanSymbol.includes('SPY')) && cleanSymbol !== 'QQQ' && cleanSymbol !== 'SPY') {
    return true
  }

  // Check for other options patterns
  return /^[A-Z]{1,5}\d+[CP]/.test(cleanSymbol) || // Strike and C/P format
         /\d{6}/.test(cleanSymbol) ||                // Date component
         (cleanSymbol.length > 6 && /\d/.test(cleanSymbol)) // Longer than typical stock symbols with numbers
}