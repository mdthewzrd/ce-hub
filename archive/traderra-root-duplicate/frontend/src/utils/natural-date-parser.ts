/**
 * 🗓️ Natural Language Date Parser
 *
 * Comprehensive date parsing system for Renata AI commands.
 * Handles complex natural language date expressions like:
 * - "July to the end of August"
 * - "15th of January to 13th of March"
 * - "last 3 months", "Q4 2024", "first half of the year"
 * - "October to December", "March through June"
 * - "2025 data", "2024 trades", "this year"
 *
 * @author Renata AI System
 */

export interface ParsedDateRange {
  start: Date
  end: Date
  label: string
  isCustom: boolean
  confidence: number // 0-1 confidence score
}

export interface DateParseResult {
  success: boolean
  dateRange?: ParsedDateRange
  error?: string
  originalText: string
}

/**
 * Main date parsing function - handles all natural language date expressions
 */
export function parseNaturalDateRange(text: string): DateParseResult {
  const originalText = text
  const normalizedText = text.toLowerCase().trim()

  console.log(`📅 NATURAL DATE PARSER: Processing "${text}"`)

  try {
    // Try different parsing strategies in order of complexity
    const strategies = [
      parsePresetRanges,
      parseYearOnlyRanges,    // Move year parsing before relative parsing
      parseRelativeRanges,
      parseSpecificDateRanges,
      parseMonthToMonthRanges,
      parseQuarterRanges,
      parseDateToDateRanges,
      parseMonthYearRanges,
      parseComplexRanges
    ]

    for (const strategy of strategies) {
      const result = strategy(normalizedText)
      if (result.success && result.dateRange) {
        console.log(`✅ PARSED with strategy ${strategy.name}: ${result.dateRange.label}`)
        return { ...result, originalText }
      }
    }

    // If no strategy worked, return failure
    console.log(`❌ PARSING FAILED: No strategy could parse "${text}"`)
    return {
      success: false,
      error: `Could not parse date range: "${text}"`,
      originalText
    }

  } catch (error) {
    console.error(`💥 DATE PARSER ERROR:`, error)
    return {
      success: false,
      error: `Error parsing date: ${error instanceof Error ? error.message : 'Unknown error'}`,
      originalText
    }
  }
}

/**
 * 🎯 Strategy 1: Parse preset ranges (ytd, last month, etc.)
 */
function parsePresetRanges(text: string): DateParseResult {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const presets: Record<string, () => ParsedDateRange> = {
    // Current periods
    'today': () => createRange(today, today, 'Today', false, 1.0),
    'this week': () => createRange(getStartOfWeek(today), today, 'This Week', false, 1.0),
    'this month': () => createRange(new Date(now.getFullYear(), now.getMonth(), 1), today, 'This Month', false, 1.0),
    'this quarter': () => {
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
      return createRange(quarterStart, today, 'This Quarter', false, 1.0)
    },
    'this year': () => createRange(new Date(now.getFullYear(), 0, 1), today, 'This Year', false, 1.0),
    'ytd': () => createRange(new Date(now.getFullYear(), 0, 1), today, 'Year to Date', false, 1.0),
    'year to date': () => createRange(new Date(now.getFullYear(), 0, 1), today, 'Year to Date', false, 1.0),

    // Last periods
    'last week': () => {
      const lastWeekEnd = new Date(today)
      lastWeekEnd.setDate(today.getDate() - 1)
      const lastWeekStart = getStartOfWeek(lastWeekEnd)
      return createRange(lastWeekStart, lastWeekEnd, 'Last Week', false, 1.0)
    },
    'last month': () => {
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
      return createRange(lastMonthStart, lastMonthEnd, 'Last Month', false, 1.0)
    },
    'last quarter': () => {
      const currentQuarter = Math.floor(now.getMonth() / 3)
      const lastQuarterStart = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1)
      const lastQuarterEnd = new Date(now.getFullYear(), currentQuarter * 3, 0)
      return createRange(lastQuarterStart, lastQuarterEnd, 'Last Quarter', false, 1.0)
    },
    'last year': () => {
      const lastYearStart = new Date(now.getFullYear() - 1, 0, 1)
      const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31)
      return createRange(lastYearStart, lastYearEnd, 'Last Year', false, 1.0)
    },

    // All time
    'all time': () => createRange(new Date(2020, 0, 1), today, 'All Time', false, 1.0),
    'all': () => createRange(new Date(2020, 0, 1), today, 'All Time', false, 1.0),
  }

  for (const [key, rangeFunc] of Object.entries(presets)) {
    if (text.includes(key)) {
      const dateRange = rangeFunc()
      return { success: true, dateRange, originalText: text }
    }
  }

  return { success: false, originalText: text }
}

/**
 * 🎯 Strategy 2: Parse relative ranges (last 30 days, etc.)
 */
function parseRelativeRanges(text: string): DateParseResult {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Match "last X days/weeks/months" but avoid years (2020-2030)
  const patterns = [
    { pattern: /last\s+(\d+)\s+days?/, unit: 'days' },
    { pattern: /(\d+)\s*d(?:ays?)?/, unit: 'days' },
    { pattern: /last\s+(\d+)\s+weeks?/, unit: 'weeks' },
    { pattern: /(\d+)\s*w(?:eeks?)?/, unit: 'weeks' },
    { pattern: /last\s+(\d+)\s+months?/, unit: 'months' },
    { pattern: /(\d+)\s*m(?:onths?)?/, unit: 'months' },
  ]

  for (const { pattern, unit } of patterns) {
    const match = text.match(pattern)
    if (match) {
      const amount = parseInt(match[1])

      // Skip if this looks like a year (2020-2030)
      if (amount >= 2020 && amount <= 2030) {
        continue
      }

      let start: Date
      let label: string

      switch (unit) {
        case 'days':
          start = new Date(today)
          start.setDate(today.getDate() - amount)
          label = `Last ${amount} Day${amount > 1 ? 's' : ''}`
          break
        case 'weeks':
          start = new Date(today)
          start.setDate(today.getDate() - (amount * 7))
          label = `Last ${amount} Week${amount > 1 ? 's' : ''}`
          break
        case 'months':
          start = new Date(today)
          start.setMonth(today.getMonth() - amount)
          label = `Last ${amount} Month${amount > 1 ? 's' : ''}`
          break
        default:
          continue
      }

      const dateRange = createRange(start, today, label, false, 0.9)
      return { success: true, dateRange, originalText: text }
    }
  }

  return { success: false, originalText: text }
}

/**
 * 🎯 Strategy 3: Parse specific date ranges (January 15 to March 13, etc.)
 */
function parseSpecificDateRanges(text: string): DateParseResult {
  // Match "15th of January to 13th of March" style
  const specificPatterns = [
    /(\d{1,2})(st|nd|rd|th)?\s+of\s+(\w+)\s+to\s+(?:the\s+)?(\d{1,2})(st|nd|rd|th)?\s+of\s+(\w+)/,
    // Also match "January 15th to March 13th"
    /(\w+)\s+(\d{1,2})(st|nd|rd|th)?\s+to\s+(\w+)\s+(\d{1,2})(st|nd|rd|th)?/
  ]

  for (let i = 0; i < specificPatterns.length; i++) {
    const match = text.match(specificPatterns[i])

    if (match) {
      let startDay: number, startMonth: number, endDay: number, endMonth: number

      if (i === 0) {
        // "15th of January to 13th of March" format
        startDay = parseInt(match[1])
        startMonth = parseMonth(match[3])
        endDay = parseInt(match[4])
        endMonth = parseMonth(match[6])
      } else {
        // "January 15th to March 13th" format
        startMonth = parseMonth(match[1])
        startDay = parseInt(match[2])
        endMonth = parseMonth(match[4])
        endDay = parseInt(match[5])
      }

      if (startMonth !== -1 && endMonth !== -1) {
        const currentYear = new Date().getFullYear()
        const currentDate = new Date()
        const currentMonth = currentDate.getMonth()

        // Smart year determination - default to current year unless clear indication otherwise
        let startYear = currentYear
        let endYear = currentYear

        // Only increment years in specific cases
        if (endMonth < startMonth) {
          // Cross year boundary (e.g., October to March)
          endYear = currentYear + 1
        }
        // For past months like July-August in November, keep current year (2025)

        const start = new Date(startYear, startMonth, startDay)
        const end = new Date(endYear, endMonth, endDay)

        const startMonthName = getMonthName(startMonth)
        const endMonthName = getMonthName(endMonth)
        const label = `${startMonthName} ${startDay} to ${endMonthName} ${endDay}`

        const dateRange = createRange(start, end, label, true, 0.95)
        return { success: true, dateRange, originalText: text }
      }
    }
  }

  return { success: false, originalText: text }
}

/**
 * 🎯 Strategy 4: Parse month-to-month ranges (July to August, etc.)
 */
function parseMonthToMonthRanges(text: string): DateParseResult {
  // Match "July to August", "July to the end of August", "March through June"
  const monthRangePatterns = [
    /(\w+)\s+to\s+(?:the\s+end\s+of\s+)?(\w+)/,
    /(\w+)\s+through\s+(\w+)/,
    /(\w+)\s+thru\s+(\w+)/,
    /from\s+(\w+)\s+to\s+(\w+)/
  ]

  for (const pattern of monthRangePatterns) {
    const match = text.match(pattern)
    if (match) {
      const startMonth = parseMonth(match[1])
      const endMonth = parseMonth(match[2])

      if (startMonth !== -1 && endMonth !== -1) {
        const currentYear = new Date().getFullYear()

        // Determine year logic - default to current year for historical data
        let startYear = currentYear
        let endYear = currentYear

        // Only use next year in specific scenarios
        const currentMonth = new Date().getMonth()

        if (endMonth < startMonth) {
          // Cross year boundary (e.g., October to March)
          endYear = currentYear + 1
        }
        // For July to August in November, use current year (2025) for historical data

        const start = new Date(startYear, startMonth, 1)
        const end = new Date(endYear, endMonth + 1, 0) // Last day of end month

        const startMonthName = getMonthName(startMonth)
        const endMonthName = getMonthName(endMonth)
        const label = `${startMonthName} to ${endMonthName}`

        const dateRange = createRange(start, end, label, true, 0.9)
        return { success: true, dateRange, originalText: text }
      }
    }
  }

  return { success: false, originalText: text }
}

/**
 * 🎯 Strategy 5: Parse quarter ranges (Q1, Q2, etc.)
 */
function parseQuarterRanges(text: string): DateParseResult {
  const quarterPattern = /q(\d)\s*(\d{4})?/
  const match = text.match(quarterPattern)

  if (match) {
    const quarter = parseInt(match[1])
    const year = match[2] ? parseInt(match[2]) : new Date().getFullYear()

    if (quarter >= 1 && quarter <= 4) {
      const startMonth = (quarter - 1) * 3
      const start = new Date(year, startMonth, 1)
      const end = new Date(year, startMonth + 3, 0)

      const label = `Q${quarter} ${year}`

      const dateRange = createRange(start, end, label, true, 0.9)
      return { success: true, dateRange, originalText: text }
    }
  }

  return { success: false, originalText: text }
}

/**
 * 🎯 Strategy 6: Parse date-to-date ranges (2024-01-15 to 2024-03-13, etc.)
 */
function parseDateToDateRanges(text: string): DateParseResult {
  // Match various date formats with "to"
  const dateToDatePatterns = [
    // ISO format: 2024-01-15 to 2024-03-13
    /(\d{4})-(\d{1,2})-(\d{1,2})\s+to\s+(\d{4})-(\d{1,2})-(\d{1,2})/,
    // US format: 01/15/2024 to 03/13/2024
    /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+to\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    // Natural format: January 15, 2024 to March 13, 2024
    /(\w+)\s+(\d{1,2}),?\s+(\d{4})\s+to\s+(\w+)\s+(\d{1,2}),?\s+(\d{4})/
  ]

  for (let i = 0; i < dateToDatePatterns.length; i++) {
    const pattern = dateToDatePatterns[i]
    const match = text.match(pattern)

    if (match) {
      let start: Date
      let end: Date
      let label: string

      if (i === 0) { // ISO format
        start = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]))
        end = new Date(parseInt(match[4]), parseInt(match[5]) - 1, parseInt(match[6]))
        label = `${match[1]}-${match[2]}-${match[3]} to ${match[4]}-${match[5]}-${match[6]}`
      } else if (i === 1) { // US format
        start = new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]))
        end = new Date(parseInt(match[6]), parseInt(match[4]) - 1, parseInt(match[5]))
        label = `${match[1]}/${match[2]}/${match[3]} to ${match[4]}/${match[5]}/${match[6]}`
      } else { // Natural format
        const startMonth = parseMonth(match[1])
        const endMonth = parseMonth(match[4])
        if (startMonth === -1 || endMonth === -1) continue

        start = new Date(parseInt(match[3]), startMonth, parseInt(match[2]))
        end = new Date(parseInt(match[6]), endMonth, parseInt(match[5]))
        label = `${match[1]} ${match[2]}, ${match[3]} to ${match[4]} ${match[5]}, ${match[6]}`
      }

      const dateRange = createRange(start, end, label, true, 0.95)
      return { success: true, dateRange, originalText: text }
    }
  }

  return { success: false, originalText: text }
}

/**
 * 🎯 Strategy 7: Parse month-year combinations (January 2024, etc.)
 */
function parseMonthYearRanges(text: string): DateParseResult {
  const monthYearPattern = /(\w+)\s+(\d{4})/
  const match = text.match(monthYearPattern)

  if (match) {
    const month = parseMonth(match[1])
    const year = parseInt(match[2])

    if (month !== -1) {
      const start = new Date(year, month, 1)
      const end = new Date(year, month + 1, 0) // Last day of month

      const label = `${getMonthName(month)} ${year}`

      const dateRange = createRange(start, end, label, true, 0.8)
      return { success: true, dateRange, originalText: text }
    }
  }

  return { success: false, originalText: text }
}

/**
 * 🎯 Strategy 8: Parse year-only ranges (2025, 2024 data, etc.)
 */
function parseYearOnlyRanges(text: string): DateParseResult {
  // Match patterns like "2025 data", "2024 trades", "look at 2023"
  const yearPatterns = [
    /(\d{4})\s+(?:data|trades|year|stats|statistics|performance)/,
    /(?:look\s+at|show|display)\s+(\d{4})/,
    /(\d{4})\s*$/,  // Just the year by itself
    /in\s+(\d{4})/
  ]

  for (const pattern of yearPatterns) {
    const match = text.match(pattern)
    if (match) {
      const year = parseInt(match[1])

      // Validate year range (2020-2030)
      if (year >= 2020 && year <= 2030) {
        const start = new Date(year, 0, 1)
        const end = new Date(year, 11, 31)
        const label = `${year}`

        const dateRange = createRange(start, end, label, false, 0.85)
        return { success: true, dateRange, originalText: text }
      }
    }
  }

  return { success: false, originalText: text }
}

/**
 * 🎯 Strategy 9: Parse complex ranges (first half, second half, etc.)
 */
function parseComplexRanges(text: string): DateParseResult {
  const now = new Date()
  const currentYear = now.getFullYear()

  const complexPatterns: Record<string, () => ParsedDateRange> = {
    'first half': () => {
      const start = new Date(currentYear, 0, 1)
      const end = new Date(currentYear, 5, 30)
      return createRange(start, end, 'First Half', false, 0.8)
    },
    'second half': () => {
      const start = new Date(currentYear, 6, 1)
      const end = new Date(currentYear, 11, 31)
      return createRange(start, end, 'Second Half', false, 0.8)
    },
    'first quarter': () => {
      const start = new Date(currentYear, 0, 1)
      const end = new Date(currentYear, 2, 31)
      return createRange(start, end, 'Q1', false, 0.85)
    },
    'second quarter': () => {
      const start = new Date(currentYear, 3, 1)
      const end = new Date(currentYear, 5, 30)
      return createRange(start, end, 'Q2', false, 0.85)
    },
    'third quarter': () => {
      const start = new Date(currentYear, 6, 1)
      const end = new Date(currentYear, 8, 30)
      return createRange(start, end, 'Q3', false, 0.85)
    },
    'fourth quarter': () => {
      const start = new Date(currentYear, 9, 1)
      const end = new Date(currentYear, 11, 31)
      return createRange(start, end, 'Q4', false, 0.85)
    }
  }

  for (const [key, rangeFunc] of Object.entries(complexPatterns)) {
    if (text.includes(key)) {
      const dateRange = rangeFunc()
      return { success: true, dateRange, originalText: text }
    }
  }

  return { success: false, originalText: text }
}

// Helper functions
function createRange(start: Date, end: Date, label: string, isCustom: boolean, confidence: number): ParsedDateRange {
  return {
    start,
    end,
    label,
    isCustom,
    confidence
  }
}

function parseMonth(monthStr: string): number {
  const months = [
    'january', 'jan', 'february', 'feb', 'march', 'mar',
    'april', 'apr', 'may', 'june', 'jun',
    'july', 'jul', 'august', 'aug', 'september', 'sep', 'sept',
    'october', 'oct', 'november', 'nov', 'december', 'dec'
  ]

  const monthIndex = months.findIndex(m => monthStr.toLowerCase().startsWith(m.slice(0, 3)))
  return monthIndex >= 0 ? Math.floor(monthIndex / 2) : -1
}

function getMonthName(monthIndex: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return months[monthIndex] || 'Unknown'
}

function getStartOfWeek(date: Date): Date {
  const start = new Date(date)
  const day = start.getDay()
  const diff = start.getDate() - day
  start.setDate(diff)
  return start
}