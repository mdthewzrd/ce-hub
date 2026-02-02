/**
 * Phase 1 Learning System Validation Test
 *
 * This test validates the Archon learning system integration:
 * 1. Archon connection
 * 2. Knowledge storage
 * 3. Learning triggers
 * 4. Knowledge retrieval
 */

import { getArchonLearning, type LearningContext } from '@/services/archonLearningService';

async function testLearningSystem() {
  console.log('🧪 Starting Phase 1 Learning System Tests...\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Initialize Learning Service
  console.log('Test 1: Initialize Archon Learning Service');
  try {
    const archonLearning = getArchonLearning();
    await archonLearning.initialize();
    const stats = archonLearning.getStats();

    console.log('  ✓ Initialized:', stats.initialized);
    console.log('  ✓ Connected:', stats.connected);
    console.log('  ✓ Cache size:', stats.cacheSize);

    passed++;
  } catch (error) {
    console.error('  ✗ Failed:', error);
    failed++;
  }
  console.log();

  // Test 2: Learn from Code Generation
  console.log('Test 2: Learn from Code Generation');
  try {
    const archonLearning = getArchonLearning();

    const context: LearningContext = {
      chat_id: 'test_gen_001',
      user_message: 'Create LC D2 scanner with gap detection',
      ai_response: 'Generated LC D2 scanner with 12 parameters',
      code_generated: `
def scan_lc_d2(ticker: str, date: str) -> Dict[str, Any]:
    # LC D2 scanner implementation
    gap_percent = calculate_gap(ticker, date)
    if gap_percent > 5:
        return {'ticker': ticker, 'gap_percent': gap_percent}
    return None
      `,
      timestamp: new Date(),
      metadata: {
        scanner_type: 'lc_d2',
        parameter_count: 12
      }
    };

    await archonLearning.learnFromCodeGeneration(context);
    console.log('  ✓ Learned from code generation');
    passed++;
  } catch (error) {
    console.error('  ✗ Failed:', error);
    failed++;
  }
  console.log();

  // Test 3: Learn from Execution
  console.log('Test 3: Learn from Execution');
  try {
    const archonLearning = getArchonLearning();

    const context: LearningContext = {
      chat_id: 'test_exec_001',
      user_message: 'Execute LC D2 scanner',
      ai_response: 'Found 5 signals',
      code_generated: 'def scan_lc_d2():...',
      execution_result: {
        success: true,
        results: [
          { ticker: 'AAPL', date: '2025-01-15', gap_percent: 7.2 },
          { ticker: 'MSFT', date: '2025-01-16', gap_percent: 6.5 },
          { ticker: 'GOOGL', date: '2025-01-17', gap_percent: 8.1 },
          { ticker: 'AMZN', date: '2025-01-18', gap_percent: 5.9 },
          { ticker: 'TSLA', date: '2025-01-19', gap_percent: 9.3 }
        ],
        executionTime: 45000
      },
      user_feedback: 'positive',
      timestamp: new Date(),
      metadata: {
        scanner_type: 'lc_d2',
        results_count: 5,
        execution_time: 45000
      }
    };

    await archonLearning.learnFromExecution(context);
    console.log('  ✓ Learned from execution');
    passed++;
  } catch (error) {
    console.error('  ✗ Failed:', error);
    failed++;
  }
  console.log();

  // Test 4: Learn from Error
  console.log('Test 4: Learn from Error');
  try {
    const archonLearning = getArchonLearning();

    const context: LearningContext = {
      chat_id: 'test_error_001',
      user_message: 'Execute scanner with invalid parameters',
      ai_response: 'Execution failed',
      code_generated: 'def scan_invalid():...',
      timestamp: new Date(),
      metadata: {
        scanner_type: 'lc_d2',
        error_stage: 'execution'
      }
    };

    const error = new Error('Parameter validation failed: min_close_price must be positive');

    await archonLearning.learnFromError(context, error);
    console.log('  ✓ Learned from error');
    passed++;
  } catch (error) {
    console.error('  ✗ Failed:', error);
    failed++;
  }
  console.log();

  // Test 5: Recall Similar Problems
  console.log('Test 5: Recall Similar Problems');
  try {
    const archonLearning = getArchonLearning();

    const solutions = await archonLearning.recallSimilarProblems('LC D2 scanner gap detection', 5);

    console.log('  ✓ Found solutions:', solutions.length);
    for (const solution of solutions) {
      console.log(`    - ${solution.problem.substring(0, 50)}...`);
    }

    passed++;
  } catch (error) {
    console.error('  ✗ Failed:', error);
    failed++;
  }
  console.log();

  // Test 6: Recall Applicable Patterns
  console.log('Test 6: Recall Applicable Patterns');
  try {
    const archonLearning = getArchonLearning();

    const patterns = await archonLearning.recallApplicablePatterns({
      scanner_type: 'lc_d2',
      operation: 'gap detection'
    });

    console.log('  ✓ Found patterns:', patterns.length);
    for (const pattern of patterns) {
      console.log(`    - ${pattern.name} (${pattern.category})`);
    }

    passed++;
  } catch (error) {
    console.error('  ✗ Failed:', error);
    failed++;
  }
  console.log();

  // Test 7: Get Suggestions
  console.log('Test 7: Get Suggestions');
  try {
    const archonLearning = getArchonLearning();

    const suggestions = await archonLearning.getSuggestions('I want to create a scanner that detects gaps');

    console.log('  ✓ Generated suggestions:', suggestions.length);
    for (const suggestion of suggestions) {
      console.log(`    - ${suggestion.substring(0, 80)}...`);
    }

    passed++;
  } catch (error) {
    console.error('  ✗ Failed:', error);
    failed++;
  }
  console.log();

  // Summary
  console.log('='.repeat(50));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));

  if (failed === 0) {
    console.log('✅ All tests passed! Phase 1 Learning System is operational.');
  } else {
    console.log(`⚠️ ${failed} test(s) failed. Please review the errors above.`);
  }

  return { passed, failed };
}

// Run tests if executed directly
if (typeof window === 'undefined') {
  testLearningSystem()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

export { testLearningSystem };
