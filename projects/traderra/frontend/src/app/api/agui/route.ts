import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * Load site manifest for dynamic AG-UI knowledge
 */
function loadSiteManifest() {
  try {
    const manifestPath = join(process.cwd(), 'src', 'lib', 'ag-ui', 'site-manifest.json')
    const manifestContent = readFileSync(manifestPath, 'utf-8')
    return JSON.parse(manifestContent)
  } catch (error) {
    console.error('Failed to load site manifest:', error)
    return null
  }
}

/**
 * Load site prompt for dynamic AG-UI knowledge
 */
function loadSitePrompt(): string {
  try {
    const promptPath = join(process.cwd(), 'src', 'lib', 'ag-ui', 'site-prompt.txt')
    return readFileSync(promptPath, 'utf-8')
  } catch (error) {
    console.error('Failed to load site prompt:', error)
    return ''
  }
}

/**
 * Build dynamic tools from site manifest
 */
function buildDynamicTools(manifest: any): any[] {
  const pageRoutes = manifest.pages
    .map((p: any) => p.route.replace(/^\//, ''))
    .filter((r: string) => r && !r.includes('[') && !r.includes('...'))

  return [
    {
      type: 'function',
      function: {
        name: 'navigateToPage',
        description: `Navigate to a specific page. Available pages: ${pageRoutes.slice(0, 15).join(', ')}${pageRoutes.length > 15 ? '...' : ''}

**⚠️ CRITICAL: CONTEXT-FIRST NAVIGATION**
NEVER navigate based on keyword matching alone. Always analyze USER INTENT from the full sentence context.

**Context Rules:**
- "stats IN the dashboard" → Navigate to /dashboard (location = dashboard)
- "go TO stats page" → Navigate to /statistics (action = go to stats)
- Prepositions reveal intent: "in", "on", "at" = location | "to", "for" = destination
- Look for PRIMARY action verb: "go to", "take me to", "show me" = what they want

**TOP NAV BAR ITEMS** (exact names users see):
Dashboard, Trades, Stats, Summary, Calendar, Journal, Settings, Renata (AI button)

**⚠️ IMPORTANT: DASHBOARD vs LANDING PAGE**
There are TWO different pages:
- "/" = Landing/marketing page (shown to new users)
- "/dashboard" = Actual dashboard (the main app interface)

**USER ALIASES & VARIATIONS:**
- "dashboard", "home", "main", "the dash" → "dashboard" (the app, NOT landing)
- "landing page", "marketing page", "home page" → "" (only if explicitly requesting landing page)
- "trades", "trade history", "my trades", "trading", "positions", "trade log" → trades
- "journal", "trading journal", "trade journal", "notes", "diary", "log" → journal
- "statistics", "stats", "analytics", "performance", "metrics", "the numbers" → statistics
- "summary", "daily summary", "recap", "daily recap" → daily-summary
- "calendar", "trading calendar", "market calendar", "cal" → calendar
- "settings", "preferences", "config", "account settings", "setup" → settings
- "analytics" → analytics (separate from statistics)

**COMMON USER PHRASINGS:**
Users might say "take me to", "go to", "navigate to", "open", "show me", "I want to see", "let's check", etc.`,
        parameters: {
          type: 'object',
          properties: {
            page: {
              type: 'string',
              enum: ['', ...pageRoutes],
              description: `The page route to navigate to. Map user INTENT (not just keywords) to exact route:

**⚠️ CONTEXT EXAMPLES:**
- "stats in the dashboard" → "dashboard" (the app, NOT statistics)
- "go to stats" → "statistics" (actual navigation)
- "trades from last week" → "trades"
- "settings for notifications" → "settings"

**PAGE MAPPINGS:**
- Dashboard/home/main → "dashboard" (the app interface at /dashboard)
- Landing page → "" (ONLY if explicitly requesting landing/marketing page)
- Stats/statistics/analytics/performance → "statistics" (unless context says otherwise)
- Trades/trading/positions → "trades"
- Journal/notes/trade journal/diary → "journal"
- Summary/daily summary/recap → "daily-summary"
- Calendar/trading calendar → "calendar"
- Settings/preferences/config → "settings"
- Analytics (data analytics) → "analytics"

**CRITICAL:** Use "dashboard" for the main app, NOT "". Use "" only for explicit landing page requests.`
            }
          },
          required: ['page']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'setDisplayMode',
        description: 'Set how values are displayed. Options: dollar (show $ amounts), r_multiple (show R-multiples), percentage (show % changes). Users might say "in R", "in dollars", "show percentages", "switch to R mode", etc.',
        parameters: {
          type: 'object',
          properties: {
            mode: {
              type: 'string',
              enum: ['dollar', 'r_multiple', 'percentage'],
              description: 'Display mode'
            }
          },
          required: ['mode']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'setViewMode',
        description: 'Switch between table and chart views for data. Users might say "show table", "show chart", "switch to table view", "display as chart", etc.',
        parameters: {
          type: 'object',
          properties: {
            mode: {
              type: 'string',
              enum: ['table', 'chart'],
              description: 'View mode: table or chart'
            }
          },
          required: ['mode']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'setSortField',
        description: 'Change how results are sorted. Available fields: ticker (symbol), date, gapPercent (gap %), volume, score. Users might say "sort by ticker", "order by date", "sort by gap percent", etc.',
        parameters: {
          type: 'object',
          properties: {
            field: {
              type: 'string',
              enum: ['ticker', 'date', 'gapPercent', 'volume', 'score'],
              description: 'Field to sort by'
            }
          },
          required: ['field']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'setSortDirection',
        description: 'Set sort direction - ascending (lowest to highest) or descending (highest to lowest). Users might say "sort ascending", "descending order", "reverse the sort", etc.',
        parameters: {
          type: 'object',
          properties: {
            direction: {
              type: 'string',
              enum: ['asc', 'desc'],
              description: 'Sort direction: asc (ascending) or desc (descending)'
            }
          },
          required: ['direction']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'toggleAISidebar',
        description: 'Toggle the Renata AI sidebar open or closed. Users might say "open chat", "close AI", "show Renata", "hide sidebar", etc.',
        parameters: {
          type: 'object',
          properties: {
            open: {
              type: 'boolean',
              description: 'true to open sidebar, false to close it, undefined to toggle'
            }
          },
          required: []
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'setDateRange',
        description: `Set the date range for displayed data.

**PRESET RANGES** (use these exact values):
- today, yesterday, this week, last week, this month, last month, this year, last year, all

**CUSTOM RANGES** (range: "custom" + startDate + endDate required):
You MUST convert user date expressions into YYYY-MM-DD format.

**COMMON PATTERNS & CONVERSIONS:**

Month Names → Month Numbers:
Jan=01, Feb=02, Mar=03, Apr=04, May=05, Jun=06, Jul=07, Aug=08, Sep=09, Oct=10, Nov=11, Dec=12

**Examples of user expressions → tool arguments:**
- "July 2025" → {range: "custom", startDate: "2025-07-01", endDate: "2025-07-31"}
- "December 2025" → {range: "custom", startDate: "2025-12-01", endDate: "2025-12-31"}
- "July to December 2025" → {range: "custom", startDate: "2025-07-01", endDate: "2025-12-31"}
- "January to March 2024" → {range: "custom", startDate: "2024-01-01", endDate: "2024-03-31"}
- "Q2 2025" → {range: "custom", startDate: "2025-04-01", endDate: "2025-06-30"}
- "last 3 months" → Calculate from current date
- "from June 1st to July 15th" → {range: "custom", startDate: "2025-06-01", endDate: "2025-07-15"}

**Date Formatting Rules:**
- ALWAYS use YYYY-MM-DD format (4-digit year, 2-digit month, 2-digit day)
- For month ranges: startDate = 1st day, endDate = last day
- When user says "July to December 2025": startDate = "2025-07-01", endDate = "2025-12-31"
- When user says "July 2025": Use full month (2025-07-01 to 2025-07-31)

**Important:** If user provides month names or relative dates, YOU must convert them to exact YYYY-MM-DD dates.`,
        parameters: {
          type: 'object',
          properties: {
            range: {
              type: 'string',
              enum: ['today', 'yesterday', 'this week', 'last week', 'this month', 'last month', 'this year', 'last year', 'all', 'custom'],
              description: 'Preset date range, or "custom" for custom date range'
            },
            startDate: {
              type: 'string',
              description: 'Start date in YYYY-MM-DD format (REQUIRED when range="custom"). Example: "2025-07-01" for July 1st, 2025'
            },
            endDate: {
              type: 'string',
              description: 'End date in YYYY-MM-DD format (REQUIRED when range="custom"). Example: "2025-12-31" for December 31st, 2025'
            }
          },
          required: ['range']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'setStatsTab',
        description: 'Switch between tabs on the Statistics page. Available tabs: overview (summary metrics and key statistics), analytics (detailed analysis and charts), performance (performance metrics and trading analytics). Users might say "show analytics", "go to analytics tab", "switch to overview", "show performance tab", etc.',
        parameters: {
          type: 'object',
          properties: {
            tab: {
              type: 'string',
              enum: ['overview', 'analytics', 'performance'],
              description: 'Tab to switch to on the statistics page: overview (summary), analytics (detailed analysis), or performance (metrics)'
            }
          },
          required: ['tab']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'activateComponent',
        description: `Activate any UI component on the current page. This is a generic tool that works with tabs, buttons, accordions, panels, cards, and other interactive elements.

**COMPONENT IDENTIFICATION FORMAT:**
Use the pattern: \`page-area.component-name\` or \`page-name.component-type\`

**COMMON COMPONENTS BY PAGE:**

**Statistics Page (/statistics):**
- statistics.tabs.analytics - Analytics tab
- statistics.tabs.overview - Overview tab
- statistics.tabs.performance - Performance tab
- statistics.filters - Filter panel
- statistics.charts - Chart section
- statistics.metrics - Metrics section

**Trades Page (/trades):**
- trades.filters - Filter panel
- trades.table - Trades table
- trades.new-trade-modal - New trade modal
- trades.import-modal - Import modal

**Dashboard (/dashboard):**
- dashboard.stats - Stats section
- dashboard.charts - Chart section
- dashboard.summary - Daily summary card
- dashboard.metrics - Additional metrics

**Journal Page (/journal):**
- journal.folder-tree - Folder tree
- journal.editor - Journal editor
- journal.entries - Entries list

**Calendar Page (/calendar):**
- calendar.view - Calendar view
- calendar.events - Events section

**ACTIONS:**
- click - Click a button or link
- expand - Expand an accordion or panel
- collapse - Collapse an accordion or panel
- open - Open a modal or dropdown
- close - Close a modal or dropdown
- select - Select an option
- activate - Activate a tab or view
- toggle - Toggle a switch or checkbox

**EXAMPLES:**
- "switch to analytics tab" → {component: "statistics.tabs.analytics", action: "activate"}
- "expand the filters" → {component: "trades.filters", action: "expand"}
- "open the new trade modal" → {component: "trades.new-trade-modal", action: "open"}
- "scroll to the chart section" → Use scrollToElement instead

**IMPORTANT:** Always identify the current page first, then use the appropriate component ID for that page.`,
        parameters: {
          type: 'object',
          properties: {
            component: {
              type: 'string',
              description: 'Component identifier in format: page.component (e.g., "statistics.tabs.analytics", "trades.filters", "dashboard.charts")'
            },
            action: {
              type: 'string',
              enum: ['click', 'expand', 'collapse', 'open', 'close', 'select', 'activate', 'toggle'],
              description: 'Action to perform on the component (defaults to "click")'
            },
            value: {
              type: 'string',
              description: 'Optional value to set (for selects, inputs, etc.)'
            }
          },
          required: ['component']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'scrollToElement',
        description: `Scroll to any specific section or component on the current page.

**COMMON SCROLL TARGETS BY PAGE:**

**Statistics Page:**
- statistics.metrics - Stats summary section
- statistics.charts - Chart section
- statistics.performance - Performance metrics
- statistics.analytics - Analytics section

**Trades Page:**
- trades.table - Trades table
- trades.summary - Trade summary

**Dashboard:**
- dashboard.summary - Daily summary card
- dashboard.charts - Chart section
- dashboard.stats - Stats section

**Journal:**
- journal.editor - Editor section
- journal.entries - Journal entries list

**SCROLL BEHAVIOR:**
- smooth - Smooth scrolling animation (default)
- instant - Jump immediately
- auto - Browser default

**EXAMPLES:**
- "scroll to the chart section" → {element: "dashboard.charts"}
- "scroll down to the stats" → {element: "statistics.metrics"}
- "show me the performance metrics" → {element: "statistics.performance"}`,
        parameters: {
          type: 'object',
          properties: {
            element: {
              type: 'string',
              description: 'Element identifier to scroll to (e.g., "dashboard.charts", "statistics.performance", "trades.table")'
            },
            behavior: {
              type: 'string',
              enum: ['smooth', 'instant', 'auto'],
              description: 'Scroll behavior: smooth (animated), instant (jump), auto (browser default)'
            }
          },
          required: ['element']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'setComponentState',
        description: `Change the state of any component on the current page. Works with toggles, switches, dropdowns, filters, inputs, and other stateful components.

**COMMON STATE CHANGES BY PAGE:**

**Statistics Page:**
- statistics.display-mode - Change display mode (dollar/r_multiple/percentage)
- statistics.date-range - Change date range filter
- statistics.sort-field - Change sort field
- statistics.sort-direction - Change sort direction

**Trades Page:**
- trades.display-mode - Change display mode
- trades.date-range - Change date range
- trades.filters.symbol - Filter by symbol
- trades.filters.tags - Filter by tags
- trades.filters.side - Filter by side (buy/sell)

**Dashboard:**
- dashboard.display-mode - Change display mode
- dashboard.date-range - Change date range

**Journal:**
- journal.selected-folder - Change selected folder
- journal.search - Search query

**EXAMPLES:**
- "change to R mode" → {component: "statistics.display-mode", state: "r_multiple"}
- "filter by AAPL" → {component: "trades.filters.symbol", state: "AAPL"}
- "show last 30 days" → {component: "trades.date-range", state: "last 30 days"}
- "sort by date" → {component: "statistics.sort-field", state: "date"}`,
        parameters: {
          type: 'object',
          properties: {
            component: {
              type: 'string',
              description: 'Component identifier (e.g., "statistics.display-mode", "trades.filters.symbol")'
            },
            state: {
              description: 'New state value (can be string, number, boolean, object, etc.)'
            },
            property: {
              type: 'string',
              description: 'Optional property name to set (if component has multiple properties)'
            }
          },
          required: ['component', 'state']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'createSnapshot',
        description: `Capture the current page state as a named snapshot for later comparison. Snapshots save all current filters, statistics, and metrics so you can compare different configurations or date ranges.

**USE CASES:**
- Save current filter state before making changes
- Capture performance metrics for specific date ranges
- Record statistics for different trading strategies
- Create baseline comparisons for analysis

**EXAMPLES:**
- "Save this as a snapshot called Long-only trades"
- "Create a snapshot called Q4 2024 performance"
- "Save current state as Last 30 days baseline"

**SNAPSHOT LIMITS:**
- Maximum 10 snapshots (oldest automatically deleted)
- Snapshots persist across sessions
- Each snapshot includes: filters, statistics, trade IDs, timestamp`,
        parameters: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Descriptive name for the snapshot (e.g., "Long-only trades", "Q4 2024", "Last 30 days")',
              minLength: 1,
              maxLength: 50
            }
          },
          required: ['name']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'listSnapshots',
        description: `List all saved snapshots with their names, timestamps, and key statistics. Use this to see what snapshots are available before comparing them.

**RETURNS:**
- Snapshot names and IDs
- Creation timestamps
- Trade counts
- Win rates
- Total P&L
- Page where snapshot was created

**EXAMPLES:**
- "What snapshots do I have saved?"
- "Show me all my saved snapshots"
- "List available snapshots"`,
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'compareSnapshots',
        description: `Compare two saved snapshots and generate insights about performance differences. This reveals how different filters, date ranges, or strategies affect trading performance.

**USE CASES:**
- Compare Long-only vs All trades performance
- Analyze performance differences between date ranges
- Compare results of different filter configurations
- Evaluate strategy changes over time

**EXAMPLES:**
- "Compare Long-only trades with All trades snapshot"
- "Compare Q3 2024 with Q4 2024"
- "Show me the difference between Last 30 days and Last 90 days"

**COMPARISON METRICS:**
- Trade count changes
- Win rate differences
- Total P&L comparison
- Profit factor changes
- Expectancy differences
- Risk metrics (max drawdown, largest win/loss)`,
        parameters: {
          type: 'object',
          properties: {
            snapshot1: {
              type: 'string',
              description: 'Name or ID of the first snapshot to compare'
            },
            snapshot2: {
              type: 'string',
              description: 'Name or ID of the second snapshot to compare'
            }
          },
          required: ['snapshot1', 'snapshot2']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'compareCurrentWithSnapshot',
        description: `Compare the current page state with a previously saved snapshot. This is useful for seeing how recent changes affect performance compared to a saved baseline.

**USE CASES:**
- Compare current filters with saved baseline
- Evaluate recent performance changes
- Check if current settings improve vs previous configuration

**EXAMPLES:**
- "Compare current state with my Long-only snapshot"
- "How does the current state compare to Last 30 days?"
- "Show me the difference between now and Q4 2024"`,
        parameters: {
          type: 'object',
          properties: {
            snapshotName: {
              type: 'string',
              description: 'Name or ID of the snapshot to compare with current state'
            }
          },
          required: ['snapshotName']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'deleteSnapshot',
        description: `Delete a previously saved snapshot. Use this to remove old or outdated snapshots.

**USE CASES:**
- Remove outdated snapshots
- Clear old baselines
- Manage snapshot storage

**EXAMPLES:**
- "Delete the Long-only snapshot"
- "Remove the Q3 2024 snapshot"
- "Clear the Last 30 days snapshot"`,
        parameters: {
          type: 'object',
          properties: {
            snapshotName: {
              type: 'string',
              description: 'Name or ID of the snapshot to delete'
            }
          },
          required: ['snapshotName']
        }
      }
    }
  ]
}

// Tool call format
interface ToolCall {
  tool: string
  args: any
}

/**
 * Format CopilotKit context for inclusion in AI prompt
 * Converts structured context data into readable format for the AI
 */
function formatContextForPrompt(context: Record<string, any>): string {
  const lines: string[] = []

  // Group context by page/component
  const dashboardMetrics: string[] = []
  const calendarData: string[] = []
  const tradesData: string[] = []
  const statsData: string[] = []
  const dailySummaryData: string[] = []
  const otherData: string[] = []

  Object.entries(context).forEach(([key, value]) => {
    // Skip undefined or null values
    if (value === undefined || value === null) return

    // Categorize by key prefix
    if (key.startsWith('totalPnL') || key.startsWith('winRate') || key.startsWith('profitFactor') ||
        key.startsWith('expectancy') || key.startsWith('maxDrawdown') || key.startsWith('average')) {
      dashboardMetrics.push(`  - ${key}: ${formatValue(value)}`)
    } else if (key.startsWith('currentYear') || key.startsWith('selectedMonth') ||
               key.startsWith('viewMode') || key.startsWith('monthlyMonths')) {
      calendarData.push(`  - ${key}: ${formatValue(value)}`)
    } else if (key.startsWith('totalTrades') || key.startsWith('winningTrades') ||
               key.startsWith('losingTrades') || key.startsWith('largest')) {
      statsData.push(`  - ${key}: ${formatValue(value)}`)
    } else if (key === 'currentPage') {
      otherData.push(`  - ${key}: ${value}`)
    } else {
      otherData.push(`  - ${key}: ${formatValue(value)}`)
    }
  })

  // Build formatted sections
  if (dashboardMetrics.length > 0) {
    lines.push('**Dashboard Metrics:**')
    lines.push(...dashboardMetrics)
  }

  if (statsData.length > 0) {
    lines.push('**Statistics:**')
    lines.push(...statsData)
  }

  if (calendarData.length > 0) {
    lines.push('**Calendar Data:**')
    lines.push(...calendarData)
  }

  if (tradesData.length > 0) {
    lines.push('**Trades Data:**')
    lines.push(...tradesData)
  }

  if (dailySummaryData.length > 0) {
    lines.push('**Daily Summary:**')
    lines.push(...dailySummaryData)
  }

  if (otherData.length > 0) {
    lines.push('**Other Context:**')
    lines.push(...otherData)
  }

  return lines.length > 0 ? lines.join('\n') : 'No context data available'
}

/**
 * Format a value for display in the prompt
 */
function formatValue(value: any): string {
  if (typeof value === 'number') {
    // Format numbers nicely
    if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`
    } else if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`
    } else if (Math.abs(value) < 10 && value !== 0) {
      return value.toFixed(2)
    } else {
      return value.toString()
    }
  } else if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  } else if (Array.isArray(value)) {
    return `${value.length} items`
  } else if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('\n=== AG-UI API: REQUEST RECEIVED ===')
    console.log('Message (first 100 chars):', body.message?.substring(0, 100))
    console.log('Has attachedFile?', !!body.attachedFile)
    console.log('Attached file name:', body.attachedFile?.name)
    console.log('Has file content?', !!body.attachedFile?.content)
    console.log('File content length:', body.attachedFile?.content?.length || 0)
    console.log('===================================\n')

    // Handle file upload if attached
    if (body.attachedFile && body.attachedFile.name && body.attachedFile.content) {
      console.log('✅✅✅ FILE DETECTED - Processing:', body.attachedFile.name)

      try {
        console.log('📝 Starting file processing...')

        // Decode base64 content to analyze the CSV
        const base64Content = body.attachedFile.content
        console.log('   base64 length:', base64Content.length)

        const csvBytes = Buffer.from(base64Content, 'base64')
        console.log('   decoded byte length:', csvBytes.length)

        // Node.js doesn't support 'utf-8-sig', so we use utf-8 and manually remove BOM if present
        let csvText = csvBytes.toString('utf-8')

        // Remove UTF-8 BOM if present (EF BB BF)
        if (csvBytes.length >= 3 && csvBytes[0] === 0xEF && csvBytes[1] === 0xBB && csvBytes[2] === 0xBF) {
          csvText = csvText.slice(1) // Remove the BOM character
          console.log('   BOM detected and removed')
        }

        console.log('   decoded text length:', csvText.length)
        console.log('   first 100 chars:', csvText.substring(0, 100))

        // Parse CSV to get basic info
        const lines = csvText.split('\n').filter(line => line.trim())
        const headerLine = lines[0] || ''
        const tradeCount = Math.max(0, lines.length - 1) // Subtract header row

        console.log('   lines found:', lines.length)
        console.log('   trade count:', tradeCount)
        console.log('   header:', headerLine)

        // Extract column names from header
        const columns = headerLine.split(',').map(col => col.trim())
        console.log('   columns:', columns)

        // Import trades to database
        let importResult = 'Import pending...'
        try {
          console.log('🔄 Starting trade import...')
          const importResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:6565'}/api/trades/upsert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              csvContent: base64Content,
              fileName: body.attachedFile.name,
              userId: body.userId || 'anonymous'
            })
          })

          if (importResponse.ok) {
            const importData = await importResponse.json()
            importResult = importData.message || `Imported ${importData.imported || 0} trades`
            console.log('✅ Trade import successful:', importResult)
          } else {
            importResult = 'Import failed - please try again'
            console.error('❌ Trade import failed:', importResponse.status)
          }
        } catch (importError) {
          importResult = 'Import failed - please try again'
          console.error('❌ Trade import error:', importError)
        }

        // Add file info to the message for AI to acknowledge
        const fileInfo = `\n\n[📎 FILE UPLOADED: ${body.attachedFile.name}]
- Type: CSV file with ${tradeCount} trade(s)
- Columns: ${columns.slice(0, 5).join(', ')}${columns.length > 5 ? '...' : ''}
- Status: ${importResult}`

        // Append file info to message
        if (body.message) {
          body.message = body.message + fileInfo
        } else {
          body.message = fileInfo
        }

        console.log('✅ File info added to message:', { fileName: body.attachedFile.name, tradeCount })
        console.log('📋 Message now contains:', body.message.substring(0, 300))
        console.log('📋 Has file marker?', body.message.includes('📎 FILE UPLOADED'))
      } catch (error) {
        console.error('❌ Error processing file:', error)
        console.error('   Error details:', error instanceof Error ? error.stack : String(error))

        const errorMessage = `\n\n[❌ FILE UPLOAD ERROR: ${body.attachedFile.name}]
${error instanceof Error ? error.message : 'Failed to process file'}`

        if (body.message) {
          body.message = body.message + errorMessage
        } else {
          body.message = errorMessage
        }
      }
    }

    // Load dynamic site knowledge
    const siteManifest = loadSiteManifest()
    const sitePrompt = loadSitePrompt()

    // Extract messages
    let messages = []
    if (body.messages && Array.isArray(body.messages)) {
      messages = body.messages
    } else if (body.message) {
      messages = [{ role: 'user', content: body.message }]
    } else {
      messages = [{ role: 'user', content: 'Hello' }]
    }

    // Extract enhanced context from useCopilotReadable hooks
    const copilotContext = body.copilotContext || {}
    const basicContext = body.context || {}

    // Check if concise mode is requested (default true for brevity)
    const concise = body.concise !== false // Default to true
    const customSystemInstructions = body.systemInstructions || ''

    // Build context section for system prompt
    let contextSection = ''
    if (Object.keys(copilotContext).length > 0) {
      contextSection = `

**📊 LIVE TRADING DATA (Context from useCopilotReadable hooks):**
You have access to REAL-TIME trading metrics and data from the user's current view. Use this information to provide accurate, personalized responses.

${formatContextForPrompt(copilotContext)}

**IMPORTANT:**
- This is LIVE data from what the user is currently viewing
- Use actual numbers when answering questions about performance
- Reference specific metrics when discussing trading results
- The data above is what's currently visible on the user's screen
`
      console.log('[AG-UI] Enhanced context processed:', Object.keys(copilotContext).length, 'items')
    } else {
      console.log('[AG-UI] No enhanced context provided')
    }

    // Build dynamic tools from site manifest
    const AGUI_TOOLS = siteManifest ? buildDynamicTools(siteManifest) : buildDynamicTools({ pages: [{ route: '/dashboard' }] })

    // System prompt with dynamic site knowledge
    const systemPrompt = `You are Renata, an AI trading assistant integrated into Traderra.

${customSystemInstructions ? `**🎯 COMMUNICATION STYLE:**
${customSystemInstructions}

` : ''}${sitePrompt}
${contextSection}

**📎 FILE UPLOADS & TRADE IMPORT:**
When users upload a CSV file, the system AUTOMATICALLY imports the trades to the database. The message will show:
[📎 FILE UPLOADED: filename.csv]
- Type: CSV file with X trade(s)
- Columns: Symbol, Side, Entry Price, etc.
- Status: Import complete: X new trades added, Y duplicates skipped

**IMPORTANT:** The import happens AUTOMATICALLY. Just acknowledge the result:
- "I've received your file: filename.csv with X trades. ✅ Import complete - all trades have been added to your history!"
- "Thanks for uploading! Successfully imported X trades from filename.csv to your trade history."
- "File received: filename.csv. ✅ Import complete - X trades added to your database."

**DO NOT navigate to the trades page** - the import is already done. Just confirm and summarize the result.

**⚠️ CRITICAL: CONTEXT-FIRST NAVIGATION UNDERSTANDING**

Your MOST IMPORTANT task is to understand USER INTENT from CONTEXT, not just match keywords.

**NEVER navigate to a page just because you see its name as a keyword.**

❌ **WRONG PATTERN**:
User: "look at stats in the dashboard"
AI detects keyword: "stats" → Navigates to /statistics
✅ **CORRECT PATTERN**:
User: "look at stats in the dashboard"
AI detects intent: "look at... in the dashboard" → Navigates to /dashboard (where stats are visible)

**How to determine TRUE navigation destination:**

1. **Look for PRIMARY navigation verbs:**
   - "take me to", "go to", "navigate to", "open" = STRONG navigation signal
   - "show me", "view", "display" = Context-dependent (what do they want to see?)

2. **Analyze prepositional phrases:**
   - "in the [page]" → [page] is the LOCATION, go there
   - "on the [page]" → [page] is the LOCATION, go there
   - "from [page]" → [page] is the SOURCE, go elsewhere or filter
   - "about [topic]" → [topic] is what they want to see/learn

3. **Identify the PRIMARY object:**
   - "show me trades" → trades = what they want to see
   - "trades on the dashboard" → dashboard = location, trades = what they're viewing there

**Examples of CORRECT context understanding:**

✅ "stats in the dashboard" → Navigate to dashboard (location = dashboard)
✅ "go to stats page" → Navigate to statistics (action = go to stats)
✅ "show trades from last week" → Navigate to trades (trades = object, from last week = filter)
✅ "settings for notifications" → Navigate to settings (settings = destination)
✅ "my trades on the home screen" → Navigate to home/dashboard (location = home)
✅ "check the journal for today's notes" → Navigate to journal (journal = location for notes)
✅ "view calendar for next week" → Navigate to calendar (calendar = what they want to see)

**Common AMBIGUOUS patterns to handle CORRECTLY:**

- "stats [preposition] dashboard" → dashboard is location, go to dashboard
- "trades from/in [timeframe]" → trades = page, timeframe = filter
- "[page] for [purpose]" → [page] = destination
- "show me [object]" → [object] determines destination
- "on the [page]" → [page] = location to navigate to

**🧭 NAVIGATION ALIASES:**
Users refer to pages in many ways. Map their INTENT to the correct route:
- Home/dashboard/main/app → "dashboard" (the main app interface)
- Landing page/marketing page → "" (ONLY if explicitly requesting landing)
- Stats/analytics/performance/metrics → "statistics"
- Trades/trading/positions/trade history → "trades"
- Journal/notes/trade journal/diary/log → "journal"
- Summary/daily summary/recap → "daily-summary"
- Calendar/trading calendar/market calendar → "calendar"
- Settings/preferences/config/options → "settings"

**TOP NAV BAR ITEMS (exact names users will see):**
- Dashboard, Trades, Stats, Summary, Calendar, Journal, Settings, Renata

**🎛️ DISPLAY MODES:**
- **dollar** - Show $ amounts
- **r_multiple** - Show R-multiples (users say "in R", "R mode", "show R")
- **percentage** - Show % changes (users say "in %", "percent mode")
- IMPORTANT: "R" always means R-multiple display mode, never a stock symbol

**📊 VIEW MODES:**
- **table** - Show results as data table
- **chart** - Show results as visual chart

**🔢 SORT FIELDS:**
- ticker - Sort by stock symbol
- date - Sort by date
- gapPercent - Sort by gap percentage
- volume - Sort by trading volume
- score - Sort by scan score

**🛠️ AVAILABLE TOOLS:**
- navigateToPage: Navigate to different pages
- setDisplayMode: Change dollar/R%/percentage display
- setViewMode: Switch between table/chart views
- setSortField: Change what field to sort by
- setSortDirection: Ascending or descending sort
- toggleAISidebar: Open/close AI chat
- setDateRange: Change date range
- setStatsTab: Switch between tabs on Statistics page (overview/analytics/performance)
- activateComponent: Activate any UI component (tabs, buttons, panels, modals, etc.)
- scrollToElement: Scroll to any section/component on current page
- setComponentState: Change state of any component (filters, toggles, inputs, etc.)
- createSnapshot: Capture current page state as a named snapshot for comparison
- listSnapshots: List all saved snapshots with their statistics
- compareSnapshots: Compare two saved snapshots and show performance differences
- compareCurrentWithSnapshot: Compare current state with a saved snapshot
- deleteSnapshot: Delete a saved snapshot

**📍 HOW TO RESPOND:**
1. When users ask for something that requires a tool call, CALL THE TOOL
2. Be clear about what you're doing
3. Acknowledge the action after execution
4. If something isn't possible, explain why clearly

**🔧 CRITICAL: CALL ALL RELEVANT TOOLS**
When a user request involves MULTIPLE actions, you MUST call ALL relevant tools in a single response:

❌ **WRONG**: User says "show trades in R mode" → Only call navigateToPage
✅ **RIGHT**: User says "show trades in R mode" → Call BOTH navigateToPage AND setDisplayMode

❌ **WRONG**: User says "take me to trades and show last 30 days" → Only call navigateToPage
✅ **RIGHT**: User says "take me to trades and show last 30 days" → Call BOTH navigateToPage AND setDateRange

❌ **WRONG**: User says "go to stats in dollar mode" → Only call navigateToPage
✅ **RIGHT**: User says "go to stats in dollar mode" → Call BOTH navigateToPage AND setDisplayMode

**Common Multi-Tool Patterns:**
- "show [page] in [mode]" → navigateToPage + setDisplayMode
- "take me to [page] and show [timeframe]" → navigateToPage + setDateRange
- "go to [page] in [view mode]" → navigateToPage + setViewMode
- "sort [page] by [field]" → navigateToPage + setSortField (+ setSortDirection)

**⚠️ MOST IMPORTANT RULES:**
- ALWAYS analyze CONTEXT, not just keywords
- When in doubt, look for the PRIMARY action verb and PRIMARY destination
- Prepositional phrases ("in the", "on the") often indicate LOCATION
- Display mode "R" or "r" ALWAYS means r_multiple, never a stock
- Map user phrasing to correct routes (stats → statistics, etc.)
- **CALL ALL TOOLS NEEDED TO COMPLETE THE USER'S REQUEST**
- **Don't be conservative - if the user wants multiple actions, call multiple tools**
`

    // Prepare messages
    const openRouterMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ]

    // Get API key
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
      throw new Error('OpenRouter API key not configured')
    }

    // Debug log the user message being sent to OpenRouter
    const userMessage = messages[messages.length - 1]?.content || 'No message'
    console.log('=== OPENROUTER REQUEST ===')
    console.log('User message (first 200 chars):', userMessage.substring(0, 200))
    console.log('Contains file upload marker?', userMessage.includes('📎 FILE UPLOADED'))
    console.log('==========================')

    console.log('Calling OpenRouter with tools:', {
      messageCount: openRouterMessages.length,
      toolCount: AGUI_TOOLS.length,
      siteManifestLoaded: !!siteManifest
    })

    // Call OpenRouter with tools
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:6565',
        'X-Title': 'Traderra AG-UI'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: openRouterMessages,
        tools: AGUI_TOOLS,
        tool_choice: 'auto',
        max_tokens: 1000,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenRouter error ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    const assistantMessage = data.choices?.[0]?.message

    console.log('AG-UI Response:', {
      hasContent: !!assistantMessage?.content,
      hasToolCalls: !!assistantMessage?.tool_calls,
      toolCallCount: assistantMessage?.tool_calls?.length || 0
    })

    // Extract tool calls if present
    let toolCalls: ToolCall[] = []
    if (assistantMessage?.tool_calls && Array.isArray(assistantMessage.tool_calls)) {
      toolCalls = assistantMessage.tool_calls.map((tc: any) => {
        try {
          return {
            tool: tc.function.name,
            args: tc.function.arguments ? JSON.parse(tc.function.arguments) : {}
          }
        } catch (error) {
          console.error('Failed to parse tool arguments:', {
            tool: tc.function.name,
            arguments: tc.function.arguments,
            error
          })
          return {
            tool: tc.function.name,
            args: {}
          }
        }
      })
    }

    // Get text response
    const textResponse = assistantMessage?.content || (
      toolCalls.length > 0
        ? 'I\'ll make those changes for you.'
        : 'I encountered an issue processing your request.'
    )

    console.log('AG-UI Success:', {
      responseLength: textResponse.length,
      toolCalls: toolCalls.length,
      tools: toolCalls.map(tc => tc.tool)
    })

    // Return response with tool calls
    return NextResponse.json({
      success: true,
      response: textResponse,
      message: textResponse,
      tool_calls: toolCalls,
      tool_count: toolCalls.length
    })

  } catch (error) {
    console.error('=== AG-UI ERROR ===')
    console.error('Error type:', error.constructor.name)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('==================')

    // Check if this is an OpenRouter auth error
    const isAuthError = error instanceof Error && (
      error.message.includes('401') ||
      error.message.includes('User not found') ||
      error.message.includes('Unauthorized') ||
      error.message.includes('authentication')
    )

    // If it's an auth error and we have a message (possibly with file info), return it anyway
    if (isAuthError && body.message) {
      console.log('OpenRouter auth failed, returning message with file info')

      // Extract file info from the message if present
      const fileInfoMatch = body.message.match(/\[📎 FILE UPLOADED:([^\]]+)\]/)
      if (fileInfoMatch) {
        return NextResponse.json({
          success: true,
          response: `I've received your file upload!\n\n${fileInfoMatch[0]}\n\nNote: I'm currently having trouble connecting to my AI service, but your file was received successfully.`,
          message: body.message,
          tool_calls: []
        })
      }

      return NextResponse.json({
        success: true,
        response: body.message || 'I received your message.',
        message: body.message,
        tool_calls: []
      })
    }

    return NextResponse.json({
      success: false,
      error: `AG-UI Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      message: `There was an issue with the AG-UI system: ${error instanceof Error ? error.message : 'Unknown error'}`,
      tool_calls: []
    }, { status: 200 })
  }
}

// Health check
export async function GET(req: NextRequest) {
  const siteManifest = loadSiteManifest()

  return NextResponse.json({
    status: 'operational',
    app: 'Traderra',
    ag_ui: 'active',
    tools_enabled: true,
    site_aware: !!siteManifest,
    site_manifest_loaded: !!siteManifest,
    page_count: siteManifest?.pages?.length || 0,
    component_count: siteManifest?.components?.length || 0,
    tool_count: siteManifest?.pages?.length || 0
  })
}
