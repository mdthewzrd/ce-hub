/**
 * ADVANCED CONVERSATION CHAIN TEST SUITE
 *
 * Enhanced testing for complex interaction patterns:
 * ✅ Multi-scroll sequences with Stay Tuned
 * ✅ Multi-scroll with data analysis
 * ✅ Math calculations and computations
 * ✅ Recommendations and advice scenarios
 * ✅ Complex combination patterns
 */

class AdvancedConversationChainTester {
  constructor() {
    this.baseUrl = 'http://localhost:6565/api/copilotkit';
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
    this.testCategories = {
      multiScrollStayTuned: 0,
      multiScrollDataAnalysis: 0,
      mathCalculations: 0,
      recommendations: 0,
      complexCombinations: 0
    };
  }

  async sendMessage(content, conversationId, expectedActions = []) {
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
          messages: [{ content, role: 'user' }],
          conversationId
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

  async runConversationChain(chainName, messages) {
    console.log(`\n🔗 Testing Advanced Chain: ${chainName}`);
    const conversationId = `advanced_chain_${Date.now()}_${Math.random()}`;
    let chainSuccess = true;

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      console.log(`   [${i + 1}/${messages.length}] "${message.content}"`);

      const result = await this.sendMessage(message.content, conversationId, message.expected);

      if (!result.success) {
        console.log(`   💥 SERVER ERROR: ${result.error}`);
        chainSuccess = false;
        this.results.failed++;
        this.results.errors.push(`${chainName} Step ${i + 1}: Server error - ${result.error}`);
        break;
      }

      const isValid = this.validateActions(result.actions, message.expected);

      if (isValid) {
        console.log(`   ✅ Step ${i + 1}: ${message.expected.length} actions matched`);
        this.results.passed++;
      } else {
        console.log(`   ❌ Step ${i + 1}: Expected ${message.expected.length}, got ${result.actions.length} actions`);
        console.log(`      Got: ${result.actions.map(a => `${a.name}(${JSON.stringify(a.args)})`).join(', ')}`);
        chainSuccess = false;
        this.results.failed++;
        this.results.errors.push(`${chainName} Step ${i + 1}: Action mismatch`);
        break;
      }

      // Brief pause between steps to simulate real user interaction
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    if (chainSuccess) {
      console.log(`   🎯 ${chainName}: COMPLETED SUCCESSFULLY`);
    } else {
      console.log(`   💥 ${chainName}: FAILED`);
    }

    return chainSuccess;
  }

  generateMultiScrollStayTunedChains() {
    return [
      {
        name: "Multi-Scroll Stay Tuned - Dashboard Exploration",
        messages: [
          { content: "Go to dashboard", expected: [{ name: "navigateToPage", args: { page: "dashboard" } }] },
          { content: "What do you see on the screen?", expected: [] }, // Question - no actions
          { content: "Stay tuned, I'm scrolling through the data", expected: [] }, // Stay tuned - no actions
          { content: "Show me this week's data", expected: [{ name: "setDateRange", args: { range: "week" } }] },
          { content: "Hold on, let me scroll down more", expected: [] }, // Multi-scroll - no actions
          { content: "Switch to gross mode", expected: [{ name: "setDisplayMode", args: { mode: "gross" } }] }
        ]
      },
      {
        name: "Multi-Scroll Stay Tuned - Statistics Deep Dive",
        messages: [
          { content: "Take me to statistics", expected: [{ name: "navigateToPage", args: { page: "statistics" } }] },
          { content: "I'm scrolling through the performance metrics", expected: [] },
          { content: "Stay tuned, checking the quarterly data", expected: [] },
          { content: "Display in R multiples", expected: [{ name: "setDisplayMode", args: { mode: "r" } }] },
          { content: "Let me scroll to see the bottom section", expected: [] },
          { content: "Show all time data", expected: [{ name: "setDateRange", args: { range: "all" } }] }
        ]
      },
      {
        name: "Multi-Scroll Stay Tuned - Journal Navigation",
        messages: [
          { content: "Open the journal page", expected: [{ name: "navigateToPage", args: { page: "journal" } }] },
          { content: "I'm scrolling through my trading notes", expected: [] },
          { content: "Stay tuned while I find the right entry", expected: [] },
          { content: "What patterns do you notice?", expected: [] }, // Question
          { content: "Keep scrolling, there's more content below", expected: [] },
          { content: "Switch to net mode", expected: [{ name: "setDisplayMode", args: { mode: "net" } }] },
          { content: "Show today's entries", expected: [{ name: "setDateRange", args: { range: "today" } }] }
        ]
      }
    ];
  }

  generateMultiScrollDataAnalysisChains() {
    return [
      {
        name: "Multi-Scroll Data Analysis - Performance Review",
        messages: [
          { content: "Go to analytics", expected: [{ name: "navigateToPage", args: { page: "analytics" } }] },
          { content: "I'm scrolling through the performance charts", expected: [] },
          { content: "What's the average return rate shown here?", expected: [] }, // Analysis question
          { content: "Let me scroll to see the risk metrics", expected: [] },
          { content: "How does the Sharpe ratio look across these trades?", expected: [] }, // Analysis question
          { content: "Show in dollars for better comparison", expected: [{ name: "setDisplayMode", args: { mode: "dollar" } }] }
        ]
      },
      {
        name: "Multi-Scroll Data Analysis - Risk Assessment",
        messages: [
          { content: "Take me to statistics", expected: [{ name: "navigateToPage", args: { page: "statistics" } }] },
          { content: "I'm analyzing the drawdown data while scrolling", expected: [] },
          { content: "What's the maximum drawdown period visible?", expected: [] }, // Analysis question
          { content: "Scrolling down to see the recovery patterns", expected: [] },
          { content: "How long did it take to recover from the worst losses?", expected: [] }, // Analysis question
          { content: "Switch to gross mode for full picture", expected: [{ name: "setDisplayMode", args: { mode: "gross" } }] },
          { content: "Show 90 day period", expected: [{ name: "setDateRange", args: { range: "90day" } }] }
        ]
      },
      {
        name: "Multi-Scroll Data Analysis - Strategy Comparison",
        messages: [
          { content: "Open dashboard", expected: [{ name: "navigateToPage", args: { page: "dashboard" } }] },
          { content: "Scrolling through different strategy performances", expected: [] },
          { content: "Which strategy shows the most consistent returns?", expected: [] }, // Analysis question
          { content: "Let me scroll to compare the momentum strategies", expected: [] },
          { content: "How do the mean reversion strategies perform in comparison?", expected: [] }, // Analysis question
          { content: "Display in R mode for risk-adjusted view", expected: [{ name: "setDisplayMode", args: { mode: "r" } }] }
        ]
      }
    ];
  }

  generateMathCalculationChains() {
    return [
      {
        name: "Math Calculations - Portfolio Metrics",
        messages: [
          { content: "Go to statistics", expected: [{ name: "navigateToPage", args: { page: "statistics" } }] },
          { content: "What's my total profit and loss for this month?", expected: [] }, // Math question
          { content: "Show this month's data", expected: [{ name: "setDateRange", args: { range: "month" } }] },
          { content: "Can you calculate the percentage gain from the starting balance?", expected: [] }, // Math question
          { content: "Display in dollars", expected: [{ name: "setDisplayMode", args: { mode: "dollar" } }] },
          { content: "What's the average trade size in this period?", expected: [] } // Math question
        ]
      },
      {
        name: "Math Calculations - Risk Ratios",
        messages: [
          { content: "Take me to analytics", expected: [{ name: "navigateToPage", args: { page: "analytics" } }] },
          { content: "Calculate my risk-reward ratio for these trades", expected: [] }, // Math question
          { content: "What's the win rate percentage I'm seeing?", expected: [] }, // Math question
          { content: "Show in R multiples", expected: [{ name: "setDisplayMode", args: { mode: "r" } }] },
          { content: "If I risked 1R per trade, what would my total return be?", expected: [] }, // Math question
          { content: "Show all time data for complete calculation", expected: [{ name: "setDateRange", args: { range: "all" } }] }
        ]
      },
      {
        name: "Math Calculations - Performance Projections",
        messages: [
          { content: "Open dashboard", expected: [{ name: "navigateToPage", args: { page: "dashboard" } }] },
          { content: "Based on this week's performance, what's my monthly projection?", expected: [] }, // Math question
          { content: "Show this week", expected: [{ name: "setDateRange", args: { range: "week" } }] },
          { content: "If I maintain this win rate, what will my annual return be?", expected: [] }, // Math question
          { content: "Switch to net mode", expected: [{ name: "setDisplayMode", args: { mode: "net" } }] },
          { content: "Calculate the compound growth rate at this pace", expected: [] } // Math question
        ]
      }
    ];
  }

  generateRecommendationChains() {
    return [
      {
        name: "Recommendations - Strategy Optimization",
        messages: [
          { content: "Go to analytics", expected: [{ name: "navigateToPage", args: { page: "analytics" } }] },
          { content: "What trading strategies would you recommend based on this data?", expected: [] }, // Recommendation question
          { content: "Show gross profits", expected: [{ name: "setDisplayMode", args: { mode: "gross" } }] },
          { content: "Should I increase my position sizing based on these results?", expected: [] }, // Recommendation question
          { content: "What risk management adjustments do you suggest?", expected: [] }, // Recommendation question
          { content: "Show 90 day period for trend analysis", expected: [{ name: "setDateRange", args: { range: "90day" } }] }
        ]
      },
      {
        name: "Recommendations - Risk Management",
        messages: [
          { content: "Take me to statistics", expected: [{ name: "navigateToPage", args: { page: "statistics" } }] },
          { content: "Based on my drawdown patterns, what would you recommend?", expected: [] }, // Recommendation question
          { content: "Display in R mode", expected: [{ name: "setDisplayMode", args: { mode: "r" } }] },
          { content: "Should I adjust my stop loss levels?", expected: [] }, // Recommendation question
          { content: "What's the optimal risk per trade you'd suggest?", expected: [] }, // Recommendation question
          { content: "Show all time for comprehensive view", expected: [{ name: "setDateRange", args: { range: "all" } }] }
        ]
      },
      {
        name: "Recommendations - Performance Improvement",
        messages: [
          { content: "Open dashboard", expected: [{ name: "navigateToPage", args: { page: "dashboard" } }] },
          { content: "What areas need improvement in my trading?", expected: [] }, // Recommendation question
          { content: "Show in dollars", expected: [{ name: "setDisplayMode", args: { mode: "dollar" } }] },
          { content: "Which time periods should I focus on for better results?", expected: [] }, // Recommendation question
          { content: "What would you recommend for portfolio diversification?", expected: [] }, // Recommendation question
          { content: "Show this month's data", expected: [{ name: "setDateRange", args: { range: "month" } }] }
        ]
      }
    ];
  }

  generateComplexCombinationChains() {
    return [
      {
        name: "Complex Combo - Analysis + Calculations + Recommendations",
        messages: [
          { content: "Go to analytics", expected: [{ name: "navigateToPage", args: { page: "analytics" } }] },
          { content: "I'm scrolling through the performance data", expected: [] }, // Multi-scroll
          { content: "What's the correlation between my win rate and market conditions?", expected: [] }, // Analysis
          { content: "Calculate the statistical significance of these results", expected: [] }, // Math
          { content: "Stay tuned, checking more data points", expected: [] }, // Stay tuned
          { content: "Show in R multiples", expected: [{ name: "setDisplayMode", args: { mode: "r" } }] },
          { content: "Based on this analysis, what's your recommendation for next month?", expected: [] }, // Recommendation
          { content: "Show all time data", expected: [{ name: "setDateRange", args: { range: "all" } }] }
        ]
      },
      {
        name: "Complex Combo - Multi-Scroll + Math + Strategy",
        messages: [
          { content: "Take me to statistics", expected: [{ name: "navigateToPage", args: { page: "statistics" } }] },
          { content: "Scrolling through the monthly breakdowns", expected: [] }, // Multi-scroll
          { content: "Which month had the highest Sharpe ratio?", expected: [] }, // Analysis + Math
          { content: "Let me scroll to see the quarterly summaries", expected: [] }, // Multi-scroll
          { content: "Calculate the average monthly return across all periods", expected: [] }, // Math
          { content: "Display in gross mode", expected: [{ name: "setDisplayMode", args: { mode: "gross" } }] },
          { content: "What pattern adjustments would maximize these returns?", expected: [] }, // Recommendation
          { content: "Show 90 days", expected: [{ name: "setDateRange", args: { range: "90day" } }] }
        ]
      },
      {
        name: "Complex Combo - Deep Analysis Workflow",
        messages: [
          { content: "Open dashboard", expected: [{ name: "navigateToPage", args: { page: "dashboard" } }] },
          { content: "Stay tuned while I analyze the overall performance", expected: [] }, // Stay tuned
          { content: "I'm scrolling through different timeframes", expected: [] }, // Multi-scroll
          { content: "What's the standard deviation of my monthly returns?", expected: [] }, // Math
          { content: "How does this compare to market benchmarks?", expected: [] }, // Analysis
          { content: "Show in net mode for after-costs view", expected: [{ name: "setDisplayMode", args: { mode: "net" } }] },
          { content: "Scrolling down to see the detailed breakdown", expected: [] }, // Multi-scroll
          { content: "Should I adjust my trading frequency based on these metrics?", expected: [] }, // Recommendation
          { content: "Show today's snapshot", expected: [{ name: "setDateRange", args: { range: "today" } }] }
        ]
      },
      {
        name: "Complex Combo - Portfolio Review Sequence",
        messages: [
          { content: "Go to journal", expected: [{ name: "navigateToPage", args: { page: "journal" } }] },
          { content: "I'm reviewing my trading notes while scrolling", expected: [] }, // Multi-scroll
          { content: "What patterns emerge from these journal entries?", expected: [] }, // Analysis
          { content: "Stay tuned, cross-referencing with performance data", expected: [] }, // Stay tuned
          { content: "Navigate to analytics", expected: [{ name: "navigateToPage", args: { page: "analytics" } }] },
          { content: "Calculate the correlation between my mood ratings and trade outcomes", expected: [] }, // Math
          { content: "Show in R mode", expected: [{ name: "setDisplayMode", args: { mode: "r" } }] },
          { content: "What psychological adjustments would you recommend?", expected: [] }, // Recommendation
          { content: "Show this week's data", expected: [{ name: "setDateRange", args: { range: "week" } }] }
        ]
      }
    ];
  }

  async runAdvancedTestSuite() {
    console.log('🚀 ADVANCED CONVERSATION CHAIN TEST SUITE');
    console.log('Testing complex interaction patterns and combinations');
    console.log('='.repeat(70));

    const startTime = Date.now();

    // Generate all test chains
    const multiScrollStayTunedChains = this.generateMultiScrollStayTunedChains();
    const multiScrollDataAnalysisChains = this.generateMultiScrollDataAnalysisChains();
    const mathCalculationChains = this.generateMathCalculationChains();
    const recommendationChains = this.generateRecommendationChains();
    const complexCombinationChains = this.generateComplexCombinationChains();

    console.log('\n🔄 MULTI-SCROLL + STAY TUNED PATTERNS');
    console.log('='.repeat(50));
    for (const chain of multiScrollStayTunedChains) {
      await this.runConversationChain(chain.name, chain.messages);
      this.testCategories.multiScrollStayTuned++;
    }

    console.log('\n📊 MULTI-SCROLL + DATA ANALYSIS PATTERNS');
    console.log('='.repeat(50));
    for (const chain of multiScrollDataAnalysisChains) {
      await this.runConversationChain(chain.name, chain.messages);
      this.testCategories.multiScrollDataAnalysis++;
    }

    console.log('\n🔢 MATH CALCULATIONS PATTERNS');
    console.log('='.repeat(50));
    for (const chain of mathCalculationChains) {
      await this.runConversationChain(chain.name, chain.messages);
      this.testCategories.mathCalculations++;
    }

    console.log('\n💡 RECOMMENDATIONS PATTERNS');
    console.log('='.repeat(50));
    for (const chain of recommendationChains) {
      await this.runConversationChain(chain.name, chain.messages);
      this.testCategories.recommendations++;
    }

    console.log('\n🌟 COMPLEX COMBINATION PATTERNS');
    console.log('='.repeat(50));
    for (const chain of complexCombinationChains) {
      await this.runConversationChain(chain.name, chain.messages);
      this.testCategories.complexCombinations++;
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);

    // Final Report
    console.log('\n📊 ADVANCED TEST SUITE RESULTS');
    console.log('='.repeat(70));
    console.log(`⏱️  Total Duration: ${duration} seconds`);
    console.log(`✅ Tests Passed: ${this.results.passed}`);
    console.log(`❌ Tests Failed: ${this.results.failed}`);

    const totalTests = this.results.passed + this.results.failed;
    const successRate = totalTests > 0 ? ((this.results.passed / totalTests) * 100).toFixed(1) : 0;
    console.log(`📈 Success Rate: ${successRate}%`);

    // Category breakdown
    console.log('\n📋 Advanced Test Categories:');
    Object.entries(this.testCategories).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} chains`);
    });

    if (this.results.errors.length > 0) {
      console.log('\n❌ Error Details:');
      this.results.errors.slice(0, 10).forEach(error => { // Show max 10 errors
        console.log(`   • ${error}`);
      });
      if (this.results.errors.length > 10) {
        console.log(`   ... and ${this.results.errors.length - 10} more errors`);
      }
    }

    // Overall assessment
    if (successRate >= 95) {
      console.log('\n🎉 ADVANCED TESTING RESULT: EXCELLENT');
      console.log('✅ Complex conversation patterns work flawlessly');
      console.log('✅ Multi-scroll sequences handled perfectly');
      console.log('✅ Data analysis requests processed correctly');
      console.log('✅ Math calculations and recommendations working');
      console.log('✅ System ready for advanced user interactions');
      return true;
    } else if (successRate >= 85) {
      console.log('\n⚠️  ADVANCED TESTING RESULT: GOOD');
      console.log('⚠️  Most patterns work, some edge cases need attention');
      return true;
    } else {
      console.log('\n💥 ADVANCED TESTING RESULT: NEEDS IMPROVEMENT');
      console.log('❌ Multiple complex patterns failing, investigation needed');
      return false;
    }
  }
}

// Run the advanced test suite
const tester = new AdvancedConversationChainTester();
tester.runAdvancedTestSuite().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Advanced testing failed:', error);
  process.exit(1);
});