/**
 * Enhanced AI Agent Validation Test Suite
 *
 * Comprehensive testing for the enhanced Traderra AI agent (Renata) capabilities:
 * - Sequential multi-command processing
 * - UI element awareness and interaction
 * - Tab navigation and section scrolling
 * - Error handling and fallbacks
 * - Complex natural language understanding
 */

import { EnhancedSequentialProcessor } from '@/components/enhanced/enhanced-sequential-processor'
import { UIElementFinder, UI_HELPERS } from '@/components/enhanced/ui-element-mapper'

export interface ValidationTestCase {
  id: string
  description: string
  category: 'sequential' | 'ui_interaction' | 'tab_navigation' | 'scrolling' | 'error_handling' | 'complex_nlp' | 'integration'
  input: string
  expectedCommands: string[]
  expectedOutcome: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  timeout?: number
  context?: {
    currentPage?: string
    preConditions?: string[]
  }
}

export const ENHANCED_VALIDATION_TEST_CASES: ValidationTestCase[] = [
  // CRITICAL SEQUENTIAL MULTI-COMMAND TESTS
  {
    id: 'seq_001',
    description: 'Navigate to statistics and show performance tab',
    category: 'sequential',
    input: 'Go to statistics and show me the performance tab',
    expectedCommands: ['navigate', 'ui_interaction'],
    expectedOutcome: 'Navigate to /statistics and click performance tab',
    priority: 'critical',
    context: { currentPage: 'dashboard' }
  },
  {
    id: 'seq_002',
    description: 'Triple compound: dashboard, R-multiples, YTD',
    category: 'sequential',
    input: 'Take me to dashboard, switch to R-multiples, and show year to date',
    expectedCommands: ['navigate', 'display_mode', 'date_range'],
    expectedOutcome: 'Navigate to dashboard, set display mode to R, set date range to year',
    priority: 'critical'
  },
  {
    id: 'seq_003',
    description: 'Complex multi-step with tab and scroll',
    category: 'sequential',
    input: 'Go to analytics, switch to symbols analysis, and scroll to the charts',
    expectedCommands: ['navigate', 'ui_interaction', 'scroll'],
    expectedOutcome: 'Navigate to analytics, click symbols tab, scroll to charts section',
    priority: 'critical'
  },
  {
    id: 'seq_004',
    description: 'Statistics with performance tab and display mode',
    category: 'sequential',
    input: 'Show me statistics with performance tab in dollar view',
    expectedCommands: ['navigate', 'ui_interaction', 'display_mode'],
    expectedOutcome: 'Navigate to statistics, click performance tab, set display mode to dollar',
    priority: 'critical'
  },
  {
    id: 'seq_005',
    description: 'Journal with date range and scrolling',
    category: 'sequential',
    input: 'Open journal for last 90 days and scroll to recent entries',
    expectedCommands: ['navigate', 'date_range', 'scroll'],
    expectedOutcome: 'Navigate to journal, set date range to 90day, scroll to entries list',
    priority: 'high'
  },

  // UI ELEMENT INTERACTION TESTS
  {
    id: 'ui_001',
    description: 'Click performance tab on statistics page',
    category: 'ui_interaction',
    input: 'Click performance tab',
    expectedCommands: ['ui_interaction'],
    expectedOutcome: 'Successfully click performance tab',
    priority: 'high',
    context: { currentPage: 'statistics' }
  },
  {
    id: 'ui_002',
    description: 'Interact with charts zoom controls',
    category: 'ui_interaction',
    input: 'Zoom in on the main chart',
    expectedCommands: ['ui_interaction'],
    expectedOutcome: 'Successfully zoom in on chart',
    priority: 'medium',
    context: { currentPage: 'dashboard' }
  },
  {
    id: 'ui_003',
    description: 'Export data from analytics page',
    category: 'ui_interaction',
    input: 'Export analytics data',
    expectedCommands: ['ui_interaction'],
    expectedOutcome: 'Successfully export analytics data',
    priority: 'medium',
    context: { currentPage: 'analytics' }
  },
  {
    id: 'ui_004',
    description: 'Sort trades table by profit',
    category: 'ui_interaction',
    input: 'Sort trades by profit descending',
    expectedCommands: ['ui_interaction'],
    expectedOutcome: 'Successfully sort trades table by profit',
    priority: 'medium',
    context: { currentPage: 'trades' }
  },
  {
    id: 'ui_005',
    description: 'Open new trade modal',
    category: 'ui_interaction',
    input: 'Create new trade',
    expectedCommands: ['ui_interaction'],
    expectedOutcome: 'Successfully open new trade modal',
    priority: 'high',
    context: { currentPage: 'trades' }
  },

  // TAB NAVIGATION TESTS
  {
    id: 'tab_001',
    description: 'Navigate to overview tab',
    category: 'tab_navigation',
    input: 'Show overview tab',
    expectedCommands: ['ui_interaction'],
    expectedOutcome: 'Successfully switch to overview tab',
    priority: 'high',
    context: { currentPage: 'statistics' }
  },
  {
    id: 'tab_002',
    description: 'Navigate to analytics tab with page change',
    category: 'tab_navigation',
    input: 'Go to statistics and show analytics tab',
    expectedCommands: ['navigate', 'ui_interaction'],
    expectedOutcome: 'Navigate to statistics and click analytics tab',
    priority: 'critical'
  },
  {
    id: 'tab_003',
    description: 'Dashboard symbols analysis tab',
    category: 'tab_navigation',
    input: 'Switch to symbols analysis',
    expectedCommands: ['ui_interaction'],
    expectedOutcome: 'Successfully switch to symbols analysis tab',
    priority: 'high',
    context: { currentPage: 'dashboard' }
  },
  {
    id: 'tab_004',
    description: 'Day of week analysis tab',
    category: 'tab_navigation',
    input: 'Show day of week analysis',
    expectedCommands: ['ui_interaction'],
    expectedOutcome: 'Successfully switch to day of week analysis tab',
    priority: 'medium',
    context: { currentPage: 'dashboard' }
  },
  {
    id: 'tab_005',
    description: 'Settings tabs navigation',
    category: 'tab_navigation',
    input: 'Go to settings and show account tab',
    expectedCommands: ['navigate', 'ui_interaction'],
    expectedOutcome: 'Navigate to settings and click account tab',
    priority: 'medium'
  },

  // SCROLLING TESTS
  {
    id: 'scroll_001',
    description: 'Scroll to trading journal section',
    category: 'scrolling',
    input: 'Scroll to trading journal',
    expectedCommands: ['scroll'],
    expectedOutcome: 'Successfully scroll to trading journal section',
    priority: 'high',
    context: { currentPage: 'dashboard' }
  },
  {
    id: 'scroll_002',
    description: 'Scroll to charts section',
    category: 'scrolling',
    input: 'Show me the charts',
    expectedCommands: ['scroll'],
    expectedOutcome: 'Successfully scroll to charts section',
    priority: 'medium',
    context: { currentPage: 'dashboard' }
  },
  {
    id: 'scroll_003',
    description: 'Scroll to bottom of page',
    category: 'scrolling',
    input: 'Scroll to bottom',
    expectedCommands: ['scroll'],
    expectedOutcome: 'Successfully scroll to bottom of page',
    priority: 'low',
    context: { currentPage: 'trades' }
  },
  {
    id: 'scroll_004',
    description: 'Navigate and scroll to specific section',
    category: 'scrolling',
    input: 'Go to analytics and scroll to distribution chart',
    expectedCommands: ['navigate', 'scroll'],
    expectedOutcome: 'Navigate to analytics and scroll to distribution chart',
    priority: 'high'
  },

  // ERROR HANDLING TESTS
  {
    id: 'error_001',
    description: 'Invalid page navigation with fallback',
    category: 'error_handling',
    input: 'Go to nonexistent page',
    expectedCommands: [],
    expectedOutcome: 'Graceful error with suggestions',
    priority: 'medium'
  },
  {
    id: 'error_002',
    description: 'Invalid tab name with alternatives',
    category: 'error_handling',
    input: 'Show me the invalid tab',
    expectedCommands: [],
    expectedOutcome: 'Error with available tab suggestions',
    priority: 'medium',
    context: { currentPage: 'statistics' }
  },
  {
    id: 'error_003',
    description: 'Unknown UI element interaction',
    category: 'error_handling',
    input: 'Click on nonexistent button',
    expectedCommands: [],
    expectedOutcome: 'Error with available element suggestions',
    priority: 'low'
  },
  {
    id: 'error_004',
    description: 'Failed command dependency handling',
    category: 'error_handling',
    input: 'Go to invalid page and show performance tab',
    expectedCommands: ['navigate'],
    expectedOutcome: 'Navigation fails, tab command skipped gracefully',
    priority: 'high'
  },

  // COMPLEX NATURAL LANGUAGE TESTS
  {
    id: 'nlp_001',
    description: 'Natural language with context',
    category: 'complex_nlp',
    input: 'Can you take me to the statistics page and then show me the performance analysis?',
    expectedCommands: ['navigate', 'ui_interaction'],
    expectedOutcome: 'Navigate to statistics and click performance tab',
    priority: 'high'
  },
  {
    id: 'nlp_002',
    description: 'Conversational multi-command',
    category: 'complex_nlp',
    input: 'I\'d like to see my analytics in R-multiples, can you switch to the symbols tab too?',
    expectedCommands: ['display_mode', 'ui_interaction'],
    expectedOutcome: 'Switch display mode to R and click symbols tab',
    priority: 'high',
    context: { currentPage: 'dashboard' }
  },
  {
    id: 'nlp_003',
    description: 'Complex date range with display mode',
    category: 'complex_nlp',
    input: 'Show me my trading performance for the last 90 days in dollar format on the dashboard',
    expectedCommands: ['navigate', 'date_range', 'display_mode'],
    expectedOutcome: 'Navigate to dashboard, set 90day range, set dollar mode',
    priority: 'critical'
  },
  {
    id: 'nlp_004',
    description: 'Polite request with multiple actions',
    category: 'complex_nlp',
    input: 'Would you mind please navigating to the journal and scrolling down to the recent entries?',
    expectedCommands: ['navigate', 'scroll'],
    expectedOutcome: 'Navigate to journal and scroll to recent entries',
    priority: 'high'
  },
  {
    id: 'nlp_005',
    description: 'Abbreviated trading terminology',
    category: 'complex_nlp',
    input: 'Stats perf tab in R, last 90 days',
    expectedCommands: ['navigate', 'ui_interaction', 'display_mode', 'date_range'],
    expectedOutcome: 'Navigate to statistics, click performance tab, set R mode, set 90day range',
    priority: 'high'
  },

  // INTEGRATION TESTS
  {
    id: 'int_001',
    description: 'Full workflow: Navigate → Tab → Display → Date → Scroll',
    category: 'integration',
    input: 'Go to statistics, click performance tab, switch to dollars, show last month, and scroll to metrics',
    expectedCommands: ['navigate', 'ui_interaction', 'display_mode', 'date_range', 'scroll'],
    expectedOutcome: 'Complete 5-step workflow executed successfully',
    priority: 'critical'
  },
  {
    id: 'int_002',
    description: 'Cross-page analysis workflow',
    category: 'integration',
    input: 'Show analytics page, symbols tab, in R-multiples, for this year, then export data',
    expectedCommands: ['navigate', 'ui_interaction', 'display_mode', 'date_range', 'ui_interaction'],
    expectedOutcome: 'Complete analytics workflow with export',
    priority: 'critical'
  },
  {
    id: 'int_003',
    description: 'Trading journal workflow',
    category: 'integration',
    input: 'Open journal, filter to this week, scroll to entries, and show me in dollar view',
    expectedCommands: ['navigate', 'date_range', 'scroll', 'display_mode'],
    expectedOutcome: 'Complete journal workflow',
    priority: 'high'
  },
  {
    id: 'int_004',
    description: 'Dashboard comprehensive analysis',
    category: 'integration',
    input: 'Dashboard with day of week analysis, R-multiples, last 90 days, scroll to trading journal',
    expectedCommands: ['navigate', 'ui_interaction', 'display_mode', 'date_range', 'scroll'],
    expectedOutcome: 'Complete dashboard analysis workflow',
    priority: 'critical'
  },
  {
    id: 'int_005',
    description: 'Error recovery workflow',
    category: 'integration',
    input: 'Go to analytics, show invalid tab (should fail), then show overview tab (should succeed)',
    expectedCommands: ['navigate'],
    expectedOutcome: 'Navigation succeeds, invalid tab fails gracefully, overall success',
    priority: 'medium'
  }
]

export class EnhancedAgentValidator {
  private processor: EnhancedSequentialProcessor
  private uiFinder: UIElementFinder
  private results: Map<string, any> = new Map()

  constructor(processor: EnhancedSequentialProcessor) {
    this.processor = processor
    this.uiFinder = new UIElementFinder()
  }

  /**
   * Run all validation tests
   */
  async runAllTests(): Promise<{
    total: number
    passed: number
    failed: number
    skipped: number
    duration: number
    results: Map<string, any>
    summary: string
  }> {
    const startTime = Date.now()
    let passed = 0
    let failed = 0
    let skipped = 0

    console.log('🚀 Starting Enhanced AI Agent Validation Tests...')
    console.log(`📋 Total test cases: ${ENHANCED_VALIDATION_TEST_CASES.length}`)

    // Group tests by priority
    const criticalTests = ENHANCED_VALIDATION_TEST_CASES.filter(t => t.priority === 'critical')
    const highTests = ENHANCED_VALIDATION_TEST_CASES.filter(t => t.priority === 'high')
    const mediumTests = ENHANCED_VALIDATION_TEST_CASES.filter(t => t.priority === 'medium')
    const lowTests = ENHANCED_VALIDATION_TEST_CASES.filter(t => t.priority === 'low')

    // Run tests in priority order
    const allTests = [...criticalTests, ...highTests, ...mediumTests, ...lowTests]

    for (const testCase of allTests) {
      console.log(`\n🧪 Running test: ${testCase.id} - ${testCase.description}`)
      console.log(`📝 Input: "${testCase.input}"`)
      console.log(`📂 Category: ${testCase.category} | Priority: ${testCase.priority}`)

      try {
        const result = await this.runSingleTest(testCase)
        this.results.set(testCase.id, result)

        if (result.status === 'passed') {
          passed++
          console.log(`✅ ${testCase.id}: PASSED (${result.duration}ms)`)
        } else if (result.status === 'failed') {
          failed++
          console.log(`❌ ${testCase.id}: FAILED - ${result.error} (${result.duration}ms)`)
        } else {
          skipped++
          console.log(`⏭️ ${testCase.id}: SKIPPED - ${result.reason} (${result.duration}ms)`)
        }
      } catch (error) {
        failed++
        const errorResult = {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: 0
        }
        this.results.set(testCase.id, errorResult)
        console.log(`💥 ${testCase.id}: ERROR - ${errorResult.error}`)
      }
    }

    const duration = Date.now() - startTime
    const summary = this.generateSummary(passed, failed, skipped, duration)

    console.log('\n🏁 Enhanced AI Agent Validation Complete!')
    console.log(summary)

    return {
      total: ENHANCED_VALIDATION_TEST_CASES.length,
      passed,
      failed,
      skipped,
      duration,
      results: this.results,
      summary
    }
  }

  /**
   * Run a single validation test
   */
  private async runSingleTest(testCase: ValidationTestCase): Promise<{
    status: 'passed' | 'failed' | 'skipped'
    result?: any
    error?: string
    reason?: string
    duration: number
  }> {
    const startTime = Date.now()

    try {
      // Check pre-conditions
      if (testCase.context?.preConditions) {
        const preConditionMet = await this.checkPreConditions(testCase.context.preConditions)
        if (!preConditionMet) {
          return {
            status: 'skipped',
            reason: 'Pre-conditions not met',
            duration: Date.now() - startTime
          }
        }
      }

      // Parse the command
      const commands = this.processor.parseComplexCommand(testCase.input)
      console.log(`📋 Parsed ${commands.length} commands:`, commands.map(c => ({ id: c.id, type: c.type, action: c.action })))

      // Validate expected commands
      const actualCommandTypes = commands.map(c => c.type)
      const missingCommands = testCase.expectedCommands.filter(expected => !actualCommandTypes.includes(expected as any))

      if (missingCommands.length > 0) {
        return {
          status: 'failed',
          error: `Missing expected commands: ${missingCommands.join(', ')}`,
          duration: Date.now() - startTime
        }
      }

      // Execute commands (with timeout)
      const timeout = testCase.timeout || 10000
      const executionPromise = this.processor.executeSequentially(commands)

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Test timeout')), timeout)
      })

      const result = await Promise.race([executionPromise, timeoutPromise]) as any

      // Validate outcome
      if (result.success) {
        return {
          status: 'passed',
          result: result.summary,
          duration: Date.now() - startTime
        }
      } else {
        return {
          status: 'failed',
          error: result.summary || 'Execution failed',
          duration: Date.now() - startTime
        }
      }

    } catch (error) {
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * Check if pre-conditions are met
   */
  private async checkPreConditions(preConditions: string[]): Promise<boolean> {
    for (const condition of preConditions) {
      switch (condition) {
        case 'user_logged_in':
          // Check if user is logged in (implement based on your auth system)
          break
        case 'data_available':
          // Check if trading data is available
          break
        case 'page_loaded':
          // Check if current page is fully loaded
          if (document.readyState !== 'complete') {
            return false
          }
          break
        default:
          console.warn(`Unknown pre-condition: ${condition}`)
      }
    }
    return true
  }

  /**
   * Generate test summary
   */
  private generateSummary(passed: number, failed: number, skipped: number, duration: number): string {
    const total = passed + failed + skipped
    const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0'

    let summary = `\n📊 ENHANCED AI AGENT VALIDATION SUMMARY\n`
    summary += `========================================\n`
    summary += `Total Tests: ${total}\n`
    summary += `Passed: ${passed}\n`
    summary += `Failed: ${failed}\n`
    summary += `Skipped: ${skipped}\n`
    summary += `Pass Rate: ${passRate}%\n`
    summary += `Duration: ${(duration / 1000).toFixed(2)}s\n\n`

    // Results by category
    const categories = ['sequential', 'ui_interaction', 'tab_navigation', 'scrolling', 'error_handling', 'complex_nlp', 'integration']

    summary += `📈 RESULTS BY CATEGORY:\n`
    for (const category of categories) {
      const categoryTests = ENHANCED_VALIDATION_TEST_CASES.filter(t => t.category === category)
      const categoryResults = categoryTests.map(t => this.results.get(t.id)).filter(Boolean)
      const categoryPassed = categoryResults.filter((r: any) => r.status === 'passed').length

      if (categoryResults.length > 0) {
        summary += `${category.toUpperCase()}: ${categoryPassed}/${categoryResults.length} passed\n`
      }
    }

    // Results by priority
    summary += `\n🎯 RESULTS BY PRIORITY:\n`
    const priorities = ['critical', 'high', 'medium', 'low']
    for (const priority of priorities) {
      const priorityTests = ENHANCED_VALIDATION_TEST_CASES.filter(t => t.priority === priority)
      const priorityResults = priorityTests.map(t => this.results.get(t.id)).filter(Boolean)
      const priorityPassed = priorityResults.filter((r: any) => r.status === 'passed').length

      if (priorityResults.length > 0) {
        summary += `${priority.toUpperCase()}: ${priorityPassed}/${priorityResults.length} passed\n`
      }
    }

    // Failed tests details
    const failedTests = Array.from(this.results.entries())
      .filter(([_, result]) => (result as any).status === 'failed')
      .map(([testId, _]) => testId)

    if (failedTests.length > 0) {
      summary += `\n❌ FAILED TESTS:\n`
      for (const testId of failedTests) {
        const test = ENHANCED_VALIDATION_TEST_CASES.find(t => t.id === testId)
        const result = this.results.get(testId) as any
        if (test) {
          summary += `- ${testId}: ${test.description}\n  Error: ${result.error}\n`
        }
      }
    }

    // Enhancement recommendations
    if (failed.length > 0) {
      summary += `\n💡 ENHANCEMENT RECOMMENDATIONS:\n`
      summary += `1. Review failed test cases for pattern recognition issues\n`
      summary += `2. Enhance error handling and fallback mechanisms\n`
      summary += `3. Improve UI element detection and interaction\n`
      summary += `4. Strengthen sequential command dependency resolution\n`
    }

    if (passRate === '100.0') {
      summary += `\n🎉 ALL TESTS PASSED! Enhanced AI agent is working perfectly.\n`
    } else if (parseFloat(passRate) >= 80) {
      summary += `\n✅ GOOD PERFORMANCE! Most features working as expected.\n`
    } else {
      summary += `\n⚠️ NEEDS IMPROVEMENT. Review failed tests and enhance functionality.\n`
    }

    return summary
  }

  /**
   * Get detailed results for a specific test
   */
  getTestResult(testId: string): any {
    return this.results.get(testId)
  }

  /**
   * Get results by category
   */
  getResultsByCategory(category: string): any[] {
    return ENHANCED_VALIDATION_TEST_CASES
      .filter(t => t.category === category)
      .map(t => ({
        testCase: t,
        result: this.results.get(t.id)
      }))
  }

  /**
   * Get results by priority
   */
  getResultsByPriority(priority: string): any[] {
    return ENHANCED_VALIDATION_TEST_CASES
      .filter(t => t.priority === priority)
      .map(t => ({
        testCase: t,
        result: this.results.get(t.id)
      }))
  }
}

/**
 * Export test runner for easy execution
 */
export function runEnhancedValidationTests(processor: EnhancedSequentialProcessor): Promise<{
  total: number
  passed: number
  failed: number
  skipped: number
  duration: number
  results: Map<string, any>
  summary: string
}> {
  const validator = new EnhancedAgentValidator(processor)
  return validator.runAllTests()
}

/**
 * Quick validation for critical functionality
 */
export async function runCriticalValidation(processor: EnhancedSequentialProcessor): Promise<{
  passed: number
  failed: number
  criticalIssues: string[]
}> {
  const criticalTests = ENHANCED_VALIDATION_TEST_CASES.filter(t => t.priority === 'critical')
  const validator = new EnhancedAgentValidator(processor)

  let passed = 0
  let failed = 0
  const criticalIssues: string[] = []

  for (const testCase of criticalTests) {
    try {
      const result = await validator.runSingleTest(testCase)
      if (result.status === 'passed') {
        passed++
      } else {
        failed++
        criticalIssues.push(`${testCase.id}: ${result.error || result.reason}`)
      }
    } catch (error) {
      failed++
      criticalIssues.push(`${testCase.id}: ${error}`)
    }
  }

  return { passed, failed, criticalIssues }
}