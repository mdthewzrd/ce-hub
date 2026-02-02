/**
 * End-to-End Testing for Traderra Renata Chat Commands
 * This script tests the actual execution of "go to the dashboard and look at the last 90 days in R"
 */

// Use puppeteer for real browser testing if available, otherwise fallback to Node.js simulation
const puppeteer = require('puppeteer').catch(() => null);

async function testInRealBrowser() {
  console.log('🌐 STARTING REAL BROWSER TESTING');
  console.log('==================================');

  let browser;
  let page;

  try {
    // Try to launch browser
    if (puppeteer) {
      browser = await puppeteer.launch({
        headless: false, // Show browser for debugging
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      page = await browser.newPage();

      console.log('✅ Browser launched successfully');

      // Enable console logging from the page
      page.on('console', msg => {
        console.log('🖥️  PAGE LOG:', msg.text());
      });

      // Navigate to the app
      await page.goto('http://localhost:6565');
      console.log('✅ Navigated to http://localhost:6565');

      // Wait for the app to load
      await page.waitForSelector('[data-testid="renata-chat-input"]', { timeout: 10000 });
      console.log('✅ Renata chat input found');

      // Get initial state
      const initialState = await page.evaluate(() => {
        return {
          currentPath: window.location.pathname,
          dateRange: window.dateRangeContext?.currentDateRange || 'not-found',
          displayMode: window.displayModeContext?.displayMode || 'not-found'
        };
      });

      console.log('📊 INITIAL STATE:');
      console.log(`  Path: ${initialState.currentPath}`);
      console.log(`  Date Range: ${initialState.dateRange}`);
      console.log(`  Display Mode: ${initialState.displayMode}`);

      // Type the command into the chat
      const command = "go to the dashboard and look at the last 90 days in R";
      await page.type('[data-testid="renata-chat-input"]', command);
      console.log(`📝 Typed command: "${command}"`);

      // Submit the command
      await page.keyboard.press('Enter');
      console.log('🚀 Command submitted');

      // Wait for processing
      await page.waitForTimeout(2000);

      // Check for pattern detection logs
      const patternLogs = await page.evaluate(() => {
        return new Promise((resolve) => {
          const logs = [];
          const originalLog = console.log;
          console.log = (...args) => {
            logs.push(args.join(' '));
            originalLog.apply(console, args);
          };

          setTimeout(() => {
            console.log = originalLog;
            resolve(logs.filter(log => log.includes('🧪') || log.includes('🎯') || log.includes('✅')));
          }, 1000);
        });
      });

      console.log('🔍 PATTERN DETECTION LOGS:');
      patternLogs.forEach(log => console.log(`  ${log}`));

      // Wait for navigation and state changes
      await page.waitForTimeout(3000);

      // Get final state
      const finalState = await page.evaluate(() => {
        return {
          currentPath: window.location.pathname,
          dateRange: window.dateRangeContext?.currentDateRange || 'not-found',
          displayMode: window.displayModeContext?.displayMode || 'not-found'
        };
      });

      console.log('📊 FINAL STATE:');
      console.log(`  Path: ${finalState.currentPath}`);
      console.log(`  Date Range: ${finalState.dateRange}`);
      console.log(`  Display Mode: ${finalState.displayMode}`);

      // Analyze results
      console.log('\n🎯 TEST RESULTS:');

      const navigationSuccess = finalState.currentPath === '/dashboard';
      const dateRangeSuccess = finalState.dateRange === '90day';
      const displayModeSuccess = finalState.displayMode === 'r';

      console.log(`  Navigation: ${navigationSuccess ? '✅ SUCCESS' : '❌ FAILED'} (${initialState.currentPath} → ${finalState.currentPath})`);
      console.log(`  Date Range: ${dateRangeSuccess ? '✅ SUCCESS' : '❌ FAILED'} (${initialState.dateRange} → ${finalState.dateRange})`);
      console.log(`  Display Mode: ${displayModeSuccess ? '✅ SUCCESS' : '❌ FAILED'} (${initialState.displayMode} → ${finalState.displayMode})`);

      const overallSuccess = navigationSuccess && dateRangeSuccess && displayModeSuccess;
      console.log(`\n🏆 OVERALL: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

      return {
        initialState,
        finalState,
        navigationSuccess,
        dateRangeSuccess,
        displayModeSuccess,
        overallSuccess,
        patternLogs
      };

    } else {
      throw new Error('Puppeteer not available for browser testing');
    }

  } catch (error) {
    console.error('❌ BROWSER TESTING FAILED:', error.message);
    return { error: error.message };
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔒 Browser closed');
    }
  }
}

async function testPatternDetectionLogic() {
  console.log('\n🧪 TESTING PATTERN DETECTION LOGIC');
  console.log('===================================');

  // Test the exact same logic as in the chat component
  const testMessage = "go to the dashboard and look at the last 90 days in R";
  const lowerMessage = testMessage.toLowerCase();

  console.log(`📝 Testing message: "${testMessage}"`);

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
  };

  // Date range patterns
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
  };

  // Display mode patterns
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
  };

  // Test each detection
  console.log('\n🔍 DETECTION RESULTS:');

  // Navigation detection
  let detectedPage = null;
  for (const [pattern, page] of Object.entries(navigationPatterns)) {
    if (lowerMessage.includes(pattern)) {
      detectedPage = page;
      console.log(`✅ Navigation: "${pattern}" → ${page}`);
      break;
    }
  }
  if (!detectedPage) {
    console.log('❌ No navigation detected');
  }

  // Date range detection
  let detectedDateRange = null;
  for (const [pattern, range] of Object.entries(dateRangePatterns)) {
    if (lowerMessage.includes(pattern)) {
      detectedDateRange = range;
      console.log(`✅ Date Range: "${pattern}" → ${range}`);
      break;
    }
  }
  if (!detectedDateRange) {
    console.log('❌ No date range detected');
  }

  // Display mode detection
  let detectedDisplayMode = null;
  for (const [mode, patterns] of Object.entries(displayModePatterns)) {
    for (const pattern of patterns) {
      if (lowerMessage.includes(pattern)) {
        detectedDisplayMode = mode;
        console.log(`✅ Display Mode: "${pattern}" → ${mode}`);
        break;
      }
    }
    if (detectedDisplayMode) break;
  }
  if (!detectedDisplayMode) {
    console.log('❌ No display mode detected');
  }

  // Build commands
  const commands = [];
  if (detectedPage) {
    commands.push({ action_type: 'navigation', parameters: { page: detectedPage } });
  }
  if (detectedDateRange) {
    commands.push({ action_type: 'date_range', parameters: { date_range: detectedDateRange } });
  }
  if (detectedDisplayMode) {
    commands.push({ action_type: 'display_mode', parameters: { mode: detectedDisplayMode } });
  }

  console.log(`\n📦 Generated ${commands.length} commands:`);
  commands.forEach((cmd, i) => {
    console.log(`  ${i + 1}. ${cmd.action_type}:`, cmd.parameters);
  });

  const wouldTriggerMultiCommand = commands.length > 1;
  console.log(`\n🎯 Multi-command execution: ${wouldTriggerMultiCommand ? '✅ YES' : '❌ NO'}`);

  return {
    detectedPage,
    detectedDateRange,
    detectedDisplayMode,
    commands,
    wouldTriggerMultiCommand
  };
}

// Manual testing instructions
function printManualTestingInstructions() {
  console.log('\n📋 MANUAL TESTING INSTRUCTIONS');
  console.log('===============================');
  console.log('1. Open http://localhost:6565 in your browser');
  console.log('2. Open Developer Tools (F12 or Cmd+Option+I)');
  console.log('3. Go to the Console tab');
  console.log('4. Paste and run this debug script:');
  console.log('');
  console.log(`// Copy this script into the browser console
const debugScript = \`
function debugRenataCommand() {
  console.log('🔍 DEBUGGING RENATA COMMAND');
  console.log('============================');

  const testMessage = "go to the dashboard and look at the last 90 days in R";
  console.log('📝 Testing:', testMessage);

  // Check if contexts are available
  console.log('🔧 Context Status:');
  console.log('  dateRangeContext:', !!window.dateRangeContext);
  console.log('  displayModeContext:', !!window.displayModeContext);

  if (window.dateRangeContext) {
    console.log('  Current date range:', window.dateRangeContext.currentDateRange);
  }
  if (window.displayModeContext) {
    console.log('  Current display mode:', window.displayModeContext.displayMode);
  }

  // Test pattern detection
  const lowerMessage = testMessage.toLowerCase();
  const hasDashboard = lowerMessage.includes('dashboard');
  const hasLast90Days = lowerMessage.includes('last 90 days');
  const hasInR = lowerMessage.includes('in r');

  console.log('\\n🧪 Pattern Detection:');
  console.log('  Dashboard detected:', hasDashboard);
  console.log('  Last 90 days detected:', hasLast90Days);
  console.log('  In R detected:', hasInR);
  console.log('  Should trigger multi-command:', hasDashboard && hasLast90Days && hasInR);

  return {
    hasDashboard,
    hasLast90Days,
    hasInR,
    shouldTriggerMultiCommand: hasDashboard && hasLast90Days && hasInR
  };
}

debugRenataCommand();
\`;
eval(debugScript);`);
  console.log('');
  console.log('5. Then type "go to the dashboard and look at the last 90 days in R" in the Renata chat');
  console.log('6. Watch the console for pattern detection logs');
  console.log('7. Check if the page navigates and if the UI buttons update');
}

// Main execution
async function runTests() {
  console.log('🚀 STARTING COMPREHENSIVE TESTING');
  console.log('==================================');

  // Test 1: Pattern detection logic
  const patternResults = testPatternDetectionLogic();

  // Test 2: Try real browser testing
  const browserResults = await testInRealBrowser();

  // Test 3: Provide manual instructions
  printManualTestingInstructions();

  console.log('\n📊 SUMMARY OF RESULTS');
  console.log('=====================');
  console.log('Pattern Detection Results:');
  console.log(`  Navigation: ${patternResults.detectedPage ? '✅' : '❌'}`);
  console.log(`  Date Range: ${patternResults.detectedDateRange ? '✅' : '❌'}`);
  console.log(`  Display Mode: ${patternResults.detectedDisplayMode ? '✅' : '❌'}`);
  console.log(`  Multi-Command: ${patternResults.wouldTriggerMultiCommand ? '✅' : '❌'}`);

  if (browserResults.error) {
    console.log(`Browser Testing: ❌ Failed (${browserResults.error})`);
    console.log('Please run the manual testing instructions above');
  } else {
    console.log('Browser Testing Results:');
    console.log(`  Navigation: ${browserResults.navigationSuccess ? '✅' : '❌'}`);
    console.log(`  Date Range: ${browserResults.dateRangeSuccess ? '✅' : '❌'}`);
    console.log(`  Display Mode: ${browserResults.displayModeSuccess ? '✅' : '❌'}`);
    console.log(`  Overall: ${browserResults.overallSuccess ? '✅' : '❌'}`);
  }
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testInRealBrowser,
  testPatternDetectionLogic,
  printManualTestingInstructions
};