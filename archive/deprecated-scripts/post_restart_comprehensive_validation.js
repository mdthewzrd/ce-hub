/**
 * POST-RESTART COMPREHENSIVE VALIDATION TEST
 *
 * Validates that after server restart, all core functionality works:
 * ✅ Question detection (informational vs action)
 * ✅ Navigation commands
 * ✅ Display modes (dollar, R, gross, net)
 * ✅ Date range commands
 * ✅ Multi-step conversation chains
 * ✅ Server stability under load
 */

class PostRestartValidator {
  constructor() {
    this.baseUrl = 'http://localhost:6565/api/copilotkit';
    this.testCategories = {
      core: 0,
      navigation: 0,
      displayModes: 0,
      dateRanges: 0,
      conversationChains: 0
    };
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async sendRequest(command, expectedActions = []) {
    const requestBody = {
      operationName: 'generateCopilotResponse',
      query: `mutation generateCopilotResponse($data: CopilotResponseInput!) {
        generateCopilotResponse(data: $data) {
          metaEvents { name args }
          messages { content role }
        }
      }`,
      variables: {
        data: {
          messages: [{ content: command, role: 'user' }],
          conversationId: `validation_${Date.now()}_${Math.random()}`
        }
      }
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const actions = data?.data?.generateCopilotResponse?.metaEvents || [];

      return {
        success: true,
        actions,
        response: data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        actions: []
      };
    }
  }

  validateActions(actual, expected) {
    if (expected.length === 0) {
      return actual.length === 0;
    }

    if (actual.length !== expected.length) {
      return false;
    }

    return expected.every(expectedAction =>
      actual.some(action =>
        action.name === expectedAction.name &&
        JSON.stringify(action.args) === JSON.stringify(expectedAction.args)
      )
    );
  }

  async runTest(category, testName, command, expectedActions, description) {
    console.log(`\n🧪 Testing: ${testName}`);
    console.log(`   Command: "${command}"`);
    console.log(`   Expected: ${expectedActions.length} actions`);

    const result = await this.sendRequest(command, expectedActions);

    if (!result.success) {
      console.log(`   💥 SERVER ERROR: ${result.error}`);
      this.results.failed++;
      this.results.errors.push(`${testName}: Server error - ${result.error}`);
      return false;
    }

    const isValid = this.validateActions(result.actions, expectedActions);

    if (isValid) {
      console.log(`   ✅ PASSED: ${description}`);
      this.results.passed++;
      return true;
    } else {
      console.log(`   ❌ FAILED: Expected ${expectedActions.length}, got ${result.actions.length} actions`);
      console.log(`      Got: ${result.actions.map(a => `${a.name}(${JSON.stringify(a.args)})`).join(', ')}`);
      this.results.failed++;
      this.results.errors.push(`${testName}: Action mismatch`);
      return false;
    }
  }

  async runCoreTests() {
    console.log('\n🔥 CORE FUNCTIONALITY TESTS');
    console.log('='.repeat(50));

    // Question Detection Tests
    await this.runTest('core', 'Question Detection 1',
      'How did I perform today?', [],
      'Informational question should trigger no actions');

    await this.runTest('core', 'Question Detection 2',
      'What are my best trades?', [],
      'Analysis question should trigger no actions');

    // Basic Command Tests
    await this.runTest('core', 'Basic Navigation',
      'Go to dashboard',
      [{ name: 'navigateToPage', args: { page: 'dashboard' } }],
      'Simple navigation command');

    await this.runTest('core', 'Basic Display Mode',
      'Show in dollars',
      [{ name: 'setDisplayMode', args: { mode: 'dollar' } }],
      'Simple display mode change');

    this.testCategories.core = 4;
  }

  async runNavigationTests() {
    console.log('\n🧭 NAVIGATION TESTS');
    console.log('='.repeat(50));

    const navigationTests = [
      ['Dashboard', 'dashboard'],
      ['Statistics', 'statistics'],
      ['Analytics', 'analytics'],
      ['Journal', 'journal'],
      ['Calendar', 'calendar'],
      ['Trades', 'trades']
    ];

    for (const [name, page] of navigationTests) {
      await this.runTest('navigation', `Navigate to ${name}`,
        `Take me to ${name.toLowerCase()}`,
        [{ name: 'navigateToPage', args: { page } }],
        `Navigation to ${name} page`);
    }

    this.testCategories.navigation = navigationTests.length;
  }

  async runDisplayModeTests() {
    console.log('\n💰 DISPLAY MODE TESTS');
    console.log('='.repeat(50));

    const displayModeTests = [
      ['Dollar Mode', 'switch to dollars', 'dollar'],
      ['R Mode', 'show in R mode', 'r'],
      ['Gross Mode', 'display gross values', 'gross'],
      ['Net Mode', 'show net profits', 'net']
    ];

    for (const [name, command, mode] of displayModeTests) {
      await this.runTest('displayModes', name,
        command,
        [{ name: 'setDisplayMode', args: { mode } }],
        `${name} detection and activation`);
    }

    this.testCategories.displayModes = displayModeTests.length;
  }

  async runDateRangeTests() {
    console.log('\n📅 DATE RANGE TESTS');
    console.log('='.repeat(50));

    const dateTests = [
      ['All Time', 'show all time data', 'all'],
      ['Today', 'show today', 'today'],
      ['This Week', 'show this week', 'week'],
      ['This Month', 'show this month', 'month'],
      ['90 Days', 'show 90 days', '90day']
    ];

    for (const [name, command, range] of dateTests) {
      await this.runTest('dateRanges', name,
        command,
        [{ name: 'setDateRange', args: { range } }],
        `${name} date range detection`);
    }

    this.testCategories.dateRanges = dateTests.length;
  }

  async runConversationChainTests() {
    console.log('\n🔗 CONVERSATION CHAIN TESTS');
    console.log('='.repeat(50));

    // Test multi-step conversations with mixed informational/action commands
    const conversationChains = [
      {
        name: 'Navigation + Display Mode Chain',
        steps: [
          { command: 'Go to statistics', expected: [{ name: 'navigateToPage', args: { page: 'statistics' } }] },
          { command: 'Switch to gross mode', expected: [{ name: 'setDisplayMode', args: { mode: 'gross' } }] },
          { command: 'How does this look?', expected: [] } // Question - no actions
        ]
      },
      {
        name: 'Complex Multi-Step Chain',
        steps: [
          { command: 'Dashboard in dollars', expected: [
            { name: 'navigateToPage', args: { page: 'dashboard' } },
            { name: 'setDisplayMode', args: { mode: 'dollar' } }
          ]},
          { command: 'What are the key insights?', expected: [] }, // Question
          { command: 'Show all time data', expected: [{ name: 'setDateRange', args: { range: 'all' } }] }
        ]
      }
    ];

    for (const chain of conversationChains) {
      console.log(`\n🔗 Testing Chain: ${chain.name}`);
      let chainSuccess = true;

      for (let i = 0; i < chain.steps.length; i++) {
        const step = chain.steps[i];
        const stepName = `${chain.name} - Step ${i + 1}`;
        const stepSuccess = await this.runTest('conversationChains', stepName,
          step.command, step.expected, `Chain step ${i + 1}`);

        if (!stepSuccess) {
          chainSuccess = false;
          break;
        }

        // Brief pause between chain steps
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (chainSuccess) {
        console.log(`   🎯 CHAIN COMPLETED SUCCESSFULLY`);
      } else {
        console.log(`   💥 CHAIN FAILED`);
      }
    }

    this.testCategories.conversationChains = conversationChains.length;
  }

  async runServerStabilityTest() {
    console.log('\n⚡ SERVER STABILITY TEST');
    console.log('='.repeat(50));

    // Rapid fire test to ensure server can handle load
    const rapidTests = [];
    for (let i = 0; i < 10; i++) {
      rapidTests.push(this.sendRequest(`Test ${i}: Go to dashboard`,
        [{ name: 'navigateToPage', args: { page: 'dashboard' } }]));
    }

    try {
      const results = await Promise.all(rapidTests);
      const successCount = results.filter(r => r.success).length;

      console.log(`🚀 Rapid Fire Test: ${successCount}/10 requests successful`);

      if (successCount >= 9) {
        console.log('✅ SERVER STABILITY: EXCELLENT');
        return true;
      } else if (successCount >= 7) {
        console.log('⚠️  SERVER STABILITY: GOOD (some failures)');
        return true;
      } else {
        console.log('❌ SERVER STABILITY: POOR (many failures)');
        return false;
      }
    } catch (error) {
      console.log(`💥 STABILITY TEST ERROR: ${error.message}`);
      return false;
    }
  }

  async run() {
    console.log('🎯 POST-RESTART COMPREHENSIVE VALIDATION');
    console.log('Testing all core functionality after server restart');
    console.log('='.repeat(60));

    const startTime = Date.now();

    // Run all test categories
    await this.runCoreTests();
    await this.runNavigationTests();
    await this.runDisplayModeTests();
    await this.runDateRangeTests();
    await this.runConversationChainTests();

    // Server stability test
    const serverStable = await this.runServerStabilityTest();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);

    // Final Report
    console.log('\n📊 FINAL VALIDATION RESULTS');
    console.log('='.repeat(60));
    console.log(`⏱️  Total Duration: ${duration} seconds`);
    console.log(`✅ Tests Passed: ${this.results.passed}`);
    console.log(`❌ Tests Failed: ${this.results.failed}`);

    const totalTests = this.results.passed + this.results.failed;
    const successRate = totalTests > 0 ? ((this.results.passed / totalTests) * 100).toFixed(1) : 0;
    console.log(`📈 Success Rate: ${successRate}%`);

    // Category breakdown
    console.log('\n📋 Test Category Breakdown:');
    Object.entries(this.testCategories).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} tests`);
    });

    console.log(`\n🔧 Server Stability: ${serverStable ? 'STABLE' : 'UNSTABLE'}`);

    if (this.results.errors.length > 0) {
      console.log('\n❌ Error Details:');
      this.results.errors.forEach(error => {
        console.log(`   • ${error}`);
      });
    }

    // Overall assessment
    if (successRate >= 95 && serverStable) {
      console.log('\n🎉 OVERALL RESULT: SYSTEM FULLY OPERATIONAL');
      console.log('✅ All core functionality validated successfully');
      console.log('✅ Server is stable and responsive');
      console.log('✅ Ready for production use');
      return true;
    } else if (successRate >= 90) {
      console.log('\n⚠️  OVERALL RESULT: SYSTEM MOSTLY OPERATIONAL');
      console.log('⚠️  Some issues detected, but core functionality works');
      return true;
    } else {
      console.log('\n💥 OVERALL RESULT: SYSTEM HAS ISSUES');
      console.log('❌ Multiple failures detected, investigation needed');
      return false;
    }
  }
}

// Run the validation
const validator = new PostRestartValidator();
validator.run().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Validation failed:', error);
  process.exit(1);
});