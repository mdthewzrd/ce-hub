/**
 * Debug Pattern Detection for Traderra Renata Chat
 * Run this in browser console to debug why commands aren't being detected
 */

function debugPatternDetection() {
  console.log('🔍 DEBUGGING PATTERN DETECTION')
  console.log('=================================')

  // Test the exact user message
  const testMessage = "go to the dashboard and look at the last 90 days in R"
  console.log(`📝 Testing message: "${testMessage}"`)

  // Recreate the pattern detection logic from the chat component
  const lowerMessage = testMessage.toLowerCase()

  // Navigation patterns
  const navigationPatterns = {
    'dashboard': '/dashboard',
    'main page': '/dashboard',
    'home': '/dashboard',
    'stats': '/statistics',
    'statistics': '/statistics',
    'trades': '/trades',
    'journal': '/journal',
    'trade journal': '/journal'
  }

  // Date range patterns (comprehensive)
  const dateRangePatterns = {
    'today': 'today',
    'today only': 'today',
    'today\'s trades': 'today',
    'just today': 'today',
    'week': 'week',
    'this week': 'week',
    'last week': 'lastWeek',
    'month': 'month',
    'this month': 'month',
    'last month': 'lastMonth',
    'last 30 days': 'month',
    'past 30 days': 'month',
    'previous 30 days': 'month',
    '90 days': '90day',
    'last 90 days': '90day',
    'past 90 days': '90day',
    'previous 90 days': '90day',
    '90 day': '90day',
    'last 90 day': '90day',
    'quarter': 'quarter',
    'this quarter': 'quarter',
    'last quarter': 'lastQuarter',
    'year': 'year',
    'this year': 'year',
    'year to date': 'year',
    'ytd': 'year',
    'all time': 'all',
    'all': 'all'
  }

  // Display mode patterns (comprehensive)
  const displayModePatterns = {
    r: [
      'in r', 'inr', 'in r ', ' inr ', 'in multiple of r', 'r-multiple', 'r multiples', 'r-multiples', 'r multiple',
      'in risk', 'inrisk', 'in risk ', ' inrisk ', 'show in r', 'switch to r', 'change to r', 'use r',
      'r mode', 'r-mode', 'display in r', 'view in r', 'show r', 'r view', 'r display'
    ],
    dollar: [
      'in dollar', 'indollar', 'in dollar ', ' indollar ', 'in dollars', 'indollars', 'in dollars ', ' in dollars ',
      'in $', 'in $ ', 'show in dollar', 'switch to dollar', 'change to dollar', 'use dollar',
      'dollar mode', 'dollar-mode', 'display in dollar', 'view in dollar', 'show dollar',
      'dollar view', 'dollar display', 'actual amount', 'actual amounts', 'dollar amount', 'cash amount'
    ],
    percent: [
      'in percent', 'inpercent', 'in percent ', ' inpercent ', 'in percentage', 'inpercentage', 'in percentage ',
      ' inpercentage ', 'in %', 'in % ', 'show in percent', 'switch to percent', 'change to percent', 'use percent',
      'percent mode', 'percent-mode', 'percentage mode', 'display in percent', 'view in percent', 'show percent',
      'percent view', 'percent display', 'show percentage', 'percentage view'
    ]
  }

  console.log('\n🧪 PATTERN DETECTION RESULTS:')

  // Test navigation detection
  let detectedPage = null
  for (const [pattern, page] of Object.entries(navigationPatterns)) {
    if (lowerMessage.includes(pattern)) {
      detectedPage = page
      console.log(`✅ Navigation detected: "${pattern}" -> ${page}`)
      break
    }
  }
  if (!detectedPage) {
    console.log('❌ No navigation detected')
  }

  // Test date range detection
  let detectedDateRange = null
  for (const [pattern, range] of Object.entries(dateRangePatterns)) {
    if (lowerMessage.includes(pattern)) {
      detectedDateRange = range
      console.log(`✅ Date range detected: "${pattern}" -> ${range}`)
      break
    }
  }
  if (!detectedDateRange) {
    console.log('❌ No date range detected')
  }

  // Test display mode detection
  let detectedDisplayMode = null
  for (const [mode, patterns] of Object.entries(displayModePatterns)) {
    for (const pattern of patterns) {
      if (lowerMessage.includes(pattern)) {
        detectedDisplayMode = mode
        console.log(`✅ Display mode detected: "${pattern}" -> ${mode}`)
        break
      }
    }
    if (detectedDisplayMode) break
  }
  if (!detectedDisplayMode) {
    console.log('❌ No display mode detected')
  }

  // Build commands array
  const commands = []
  if (detectedPage) {
    commands.push({ action_type: 'navigation', parameters: { page: detectedPage } })
  }
  if (detectedDateRange) {
    const rangeMapping = {
      'today': 'today',
      'this_week': 'week',
      'this_month': 'month',
      'last_90_days': '90day',
      'year_to_date': 'year',
      'all_time': 'all'
    }
    commands.push({ action_type: 'date_range', parameters: { date_range: rangeMapping[detectedDateRange] || detectedDateRange } })
  }
  if (detectedDisplayMode) {
    commands.push({ action_type: 'display_mode', parameters: { mode: detectedDisplayMode } })
  }

  console.log('\n📦 GENERATED COMMANDS:')
  console.log(`Total commands: ${commands.length}`)
  commands.forEach((cmd, index) => {
    console.log(`  ${index + 1}. ${cmd.action_type}:`, cmd.parameters)
  })

  // Check if this would trigger multi-command execution
  const wouldExecuteMultiCommand = commands.length > 1
  console.log(`\n🎯 Multi-command execution: ${wouldExecuteMultiCommand ? '✅ YES' : '❌ NO'}`)

  if (!wouldExecuteMultiCommand) {
    console.log('\n⚠️ PROBLEM IDENTIFIED:')
    console.log('   Only single commands detected, so fallback logic is used')
    console.log('   This explains why only navigation happens!')
  }

  return {
    detectedPage,
    detectedDateRange,
    detectedDisplayMode,
    commands,
    wouldExecuteMultiCommand
  }
}

// Test with the user's exact message
debugPatternDetection()

console.log('\n🔧 AVAILABLE DEBUG FUNCTIONS:')
console.log('  - debugPatternDetection() : Test pattern detection logic')
console.log('  - Check window.dateRangeContext and window.displayModeContext for state')