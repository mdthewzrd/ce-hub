/**
 * MULTI-COMMAND EXECUTION FIX
 * Replaces single-action if...else if chains with proper sequence execution
 * Ensures commands like "go to stats page and look at this year's data in R"
 * execute ALL actions in the correct order: Navigation → Date → Display → AI Mode
 */

// BEFORE: Single action execution (BROKEN)
const brokenApproach = `
if (response.intent === 'switch_to_r_display') {
  // Only executes R mode
} else if (response.intent?.includes('date_range')) {
  // Only executes date range
} else if (response.intent === 'navigation') {
  // Only executes navigation
}
// ❌ Result: Only ONE action executed per command
`;

// AFTER: Multi-command sequence execution (FIXED)
const fixedApproach = `
// Parse the complete user input for all actions
const parsed = parseMultiCommand(content)
const executionPlan = generateExecutionPlan(parsed)

// Execute ALL detected actions in the correct order
const results = []

// 1. Navigation FIRST (if detected)
if (parsed.navigation) {
  console.log('🎯 MULTI-COMMAND: Step 1 - Navigation to', parsed.navigation.target)
  const navSuccess = await executeNavigation(parsed.navigation.target)
  results.push({ action: 'navigation', success: navSuccess })

  if (navSuccess) {
    // Wait for page load before continuing
    await new Promise(resolve => setTimeout(resolve, 1500))
  }
}

// 2. Date Range SECOND (if detected)
if (parsed.dateRange) {
  console.log('🎯 MULTI-COMMAND: Step 2 - Date range to', parsed.dateRange.value)
  const dateSuccess = await precisionClick('dateRange', parsed.dateRange.value)
  results.push({ action: 'dateRange', success: dateSuccess })

  if (dateSuccess) {
    await new Promise(resolve => setTimeout(resolve, 800))
  }
}

// 3. Display Mode THIRD (if detected)
if (parsed.displayMode) {
  console.log('🎯 MULTI-COMMAND: Step 3 - Display mode to', parsed.displayMode.value)
  const displaySuccess = await precisionClick('displayMode', parsed.displayMode.value)
  results.push({ action: 'displayMode', success: displaySuccess })

  if (displaySuccess) {
    await new Promise(resolve => setTimeout(resolve, 500))
  }
}

// 4. AI Mode FOURTH (if detected)
if (parsed.aiMode) {
  console.log('🎯 MULTI-COMMAND: Step 4 - AI mode to', parsed.aiMode.value)
  const aiSuccess = await selectAIMode(parsed.aiMode.value)
  results.push({ action: 'aiMode', success: aiSuccess })
}

// Report results
const successCount = results.filter(r => r.success).length
const totalActions = results.length
console.log(\`🎯 MULTI-COMMAND COMPLETE: \${successCount}/\${totalActions} actions executed successfully\`)

return {
  executedActions: results.length,
  successfulActions: successCount,
  executionPlan,
  results
}
`;

module.exports = {
  brokenApproach,
  fixedApproach,

  // Helper function for navigation
  async executeNavigation(target) {
    try {
      // Map targets to actual navigation
      const navigationMap = {
        'dashboard': '/dashboard',
        'stats': '/stats',
        'trades': '/trades',
        'journal': '/journal'
      };

      const path = navigationMap[target];
      if (!path) {
        console.error(`🎯 NAVIGATION: Unknown target: ${target}`);
        return false;
      }

      // Use Next.js router or direct navigation
      if (typeof window !== 'undefined' && window.location) {
        window.location.href = path;
        return true;
      }

      return false;
    } catch (error) {
      console.error(`🎯 NAVIGATION ERROR:`, error);
      return false;
    }
  }
};

/**
 * INTEGRATION PLAN:
 *
 * 1. Replace the if...else if chains in renata-chat.tsx with multi-command execution
 * 2. Use parseMultiCommand() to detect ALL actions from user input
 * 3. Execute actions in the designed order: Navigation → Date → Display → AI Mode
 * 4. Add proper timing delays between actions for UI stability
 * 5. Provide comprehensive feedback on execution results
 *
 * RESULT: Commands like "Can we go to the stats page and look at this year's data in R?"
 * will execute all three parts instead of just one.
 */