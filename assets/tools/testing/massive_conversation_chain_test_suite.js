/**
 * MASSIVE CONVERSATION CHAIN TEST SUITE
 * Tests 100+ examples of 3-10 message chains for bulletproof conversational AI
 * Ensures perfect state persistence and context preservation across long conversations
 */

class MassiveConversationChainTester {
  constructor() {
    this.baseUrl = 'http://localhost:6565/api/copilotkit';
    this.conversationHistory = [];
    this.results = [];
    this.delay = 800; // Slightly faster for massive testing
  }

  async sendMessage(content, conversationId, expectedActions = []) {
    const message = { content, role: 'user' };
    this.conversationHistory.push(message);

    console.log(`   📤 "${content}"`);

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operationName: 'generateCopilotResponse',
          query: `mutation generateCopilotResponse($data: CopilotResponseInput!) {
            generateCopilotResponse(data: $data) {
              threadId runId
              messages { id content role }
              metaEvents { name args }
            }
          }`,
          variables: {
            data: {
              messages: this.conversationHistory,
              conversationId
            }
          }
        })
      });

      const data = await response.json();
      const actions = data?.data?.generateCopilotResponse?.metaEvents || [];
      const assistantMessage = data?.data?.generateCopilotResponse?.messages?.[0];

      if (assistantMessage) {
        this.conversationHistory.push(assistantMessage);
      }

      // Validate expected actions
      let success = true;
      if (expectedActions.length === 0) {
        success = actions.length === 0;
      } else {
        success = expectedActions.length === actions.length &&
          expectedActions.every(expected =>
            actions.some(action =>
              action.name === expected.name &&
              JSON.stringify(action.args) === JSON.stringify(expected.args)
            )
          );
      }

      console.log(`   ${success ? '✅' : '❌'} [${actions.map(a => `${a.name}(${JSON.stringify(a.args)})`).join(', ') || 'no actions'}]`);

      await this.sleep(this.delay);
      return { success, actions };

    } catch (error) {
      console.log(`   💥 ERROR: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Generate 100+ conversation chains programmatically
  generateMassiveChainLibrary() {
    const pages = ['dashboard', 'statistics', 'trades', 'journal', 'analytics', 'calendar'];
    const displayModes = ['dollar', 'r', 'gross', 'net'];
    const dateRanges = ['today', 'yesterday', 'week', 'lastWeek', 'month', 'lastMonth', 'all', '90day'];

    const informationalQuestions = [
      "What do you see?", "How are things looking?", "Any insights?", "What's the performance?",
      "Can you analyze this?", "What stands out?", "How am I doing?", "What's the trend?",
      "Any patterns here?", "What should I focus on?", "Best trades?", "Worst performers?",
      "Win rate analysis?", "Risk assessment?", "Monthly comparison?", "Weekly summary?"
    ];

    return {
      // 1. PURE NAVIGATION CHAINS (100+ examples)
      navigationChains: [
        ...this.generateNavigationChains(pages, 3, 25), // 25 chains of 3 messages
        ...this.generateNavigationChains(pages, 4, 25), // 25 chains of 4 messages
        ...this.generateNavigationChains(pages, 5, 25), // 25 chains of 5 messages
        ...this.generateNavigationChains(pages, 6, 25), // 25 chains of 6 messages
      ],

      // 2. PURE DISPLAY MODE CHAINS (100+ examples)
      displayModeChains: [
        ...this.generateDisplayModeChains(displayModes, 3, 25),
        ...this.generateDisplayModeChains(displayModes, 4, 25),
        ...this.generateDisplayModeChains(displayModes, 5, 25),
        ...this.generateDisplayModeChains(displayModes, 6, 25),
      ],

      // 3. MIXED STATE CHAINS (100+ examples)
      mixedStateChains: [
        ...this.generateMixedStateChains(pages, displayModes, dateRanges, 4, 30),
        ...this.generateMixedStateChains(pages, displayModes, dateRanges, 5, 30),
        ...this.generateMixedStateChains(pages, displayModes, dateRanges, 6, 20),
        ...this.generateMixedStateChains(pages, displayModes, dateRanges, 7, 20),
      ],

      // 4. INFORMATIONAL INTERJECTION CHAINS (100+ examples)
      informationalChains: [
        ...this.generateInformationalChains(pages, displayModes, dateRanges, informationalQuestions, 5, 30),
        ...this.generateInformationalChains(pages, displayModes, dateRanges, informationalQuestions, 6, 25),
        ...this.generateInformationalChains(pages, displayModes, dateRanges, informationalQuestions, 7, 25),
        ...this.generateInformationalChains(pages, displayModes, dateRanges, informationalQuestions, 8, 20),
      ],

      // 5. REAL USER SIMULATION CHAINS (100+ examples)
      realUserChains: [
        ...this.generateRealUserChains(pages, displayModes, dateRanges, informationalQuestions, 6, 30),
        ...this.generateRealUserChains(pages, displayModes, dateRanges, informationalQuestions, 7, 25),
        ...this.generateRealUserChains(pages, displayModes, dateRanges, informationalQuestions, 8, 25),
        ...this.generateRealUserChains(pages, displayModes, dateRanges, informationalQuestions, 9, 20),
      ]
    };
  }

  generateNavigationChains(pages, messageCount, chainCount) {
    const chains = [];

    for (let i = 0; i < chainCount; i++) {
      const selectedPages = this.shuffleArray([...pages]).slice(0, messageCount);
      const messages = selectedPages.map((page, index) => ({
        content: this.generateNavigationCommand(page, index),
        expected: [{ name: "navigateToPage", args: { page } }]
      }));

      chains.push({
        name: `Navigation Chain ${i + 1}: ${selectedPages.join(' → ')}`,
        messages
      });
    }

    return chains;
  }

  generateDisplayModeChains(modes, messageCount, chainCount) {
    const chains = [];

    for (let i = 0; i < chainCount; i++) {
      const selectedModes = [];
      for (let j = 0; j < messageCount; j++) {
        selectedModes.push(modes[Math.floor(Math.random() * modes.length)]);
      }

      const messages = selectedModes.map((mode, index) => ({
        content: this.generateDisplayModeCommand(mode, index),
        expected: [{ name: "setDisplayMode", args: { mode } }]
      }));

      chains.push({
        name: `Display Mode Chain ${i + 1}: ${selectedModes.join(' → ')}`,
        messages
      });
    }

    return chains;
  }

  generateMixedStateChains(pages, displayModes, dateRanges, messageCount, chainCount) {
    const chains = [];

    for (let i = 0; i < chainCount; i++) {
      const messages = [];

      for (let j = 0; j < messageCount; j++) {
        const actionType = Math.random();

        if (actionType < 0.4) {
          // Navigation
          const page = pages[Math.floor(Math.random() * pages.length)];
          messages.push({
            content: this.generateNavigationCommand(page, j),
            expected: [{ name: "navigateToPage", args: { page } }]
          });
        } else if (actionType < 0.7) {
          // Display mode
          const mode = displayModes[Math.floor(Math.random() * displayModes.length)];
          messages.push({
            content: this.generateDisplayModeCommand(mode, j),
            expected: [{ name: "setDisplayMode", args: { mode } }]
          });
        } else if (actionType < 0.9) {
          // Date range
          const range = dateRanges[Math.floor(Math.random() * dateRanges.length)];
          messages.push({
            content: this.generateDateRangeCommand(range, j),
            expected: [{ name: "setDateRange", args: { range } }]
          });
        } else {
          // Multi-action
          const page = pages[Math.floor(Math.random() * pages.length)];
          const mode = displayModes[Math.floor(Math.random() * displayModes.length)];
          messages.push({
            content: this.generateMultiActionCommand(page, mode, j),
            expected: [
              { name: "navigateToPage", args: { page } },
              { name: "setDisplayMode", args: { mode } }
            ]
          });
        }
      }

      chains.push({
        name: `Mixed State Chain ${i + 1}`,
        messages
      });
    }

    return chains;
  }

  generateInformationalChains(pages, displayModes, dateRanges, questions, messageCount, chainCount) {
    const chains = [];

    for (let i = 0; i < chainCount; i++) {
      const messages = [];

      for (let j = 0; j < messageCount; j++) {
        if (j % 2 === 0) {
          // State change
          const actionType = Math.random();
          if (actionType < 0.5) {
            const page = pages[Math.floor(Math.random() * pages.length)];
            const mode = displayModes[Math.floor(Math.random() * displayModes.length)];
            messages.push({
              content: this.generateMultiActionCommand(page, mode, j),
              expected: [
                { name: "navigateToPage", args: { page } },
                { name: "setDisplayMode", args: { mode } }
              ]
            });
          } else {
            const range = dateRanges[Math.floor(Math.random() * dateRanges.length)];
            messages.push({
              content: this.generateDateRangeCommand(range, j),
              expected: [{ name: "setDateRange", args: { range } }]
            });
          }
        } else {
          // Informational question
          const question = questions[Math.floor(Math.random() * questions.length)];
          messages.push({
            content: question,
            expected: []
          });
        }
      }

      chains.push({
        name: `Informational Chain ${i + 1}`,
        messages
      });
    }

    return chains;
  }

  generateRealUserChains(pages, displayModes, dateRanges, questions, messageCount, chainCount) {
    const chains = [];

    const userScenarios = [
      "Daily Trading Review",
      "Weekly Performance Analysis",
      "Monthly Profit Assessment",
      "Risk Management Check",
      "Strategy Optimization",
      "Trade Journal Review",
      "Market Analysis Session",
      "Portfolio Review"
    ];

    for (let i = 0; i < chainCount; i++) {
      const scenario = userScenarios[Math.floor(Math.random() * userScenarios.length)];
      const messages = [];

      // Start with navigation + display mode
      const startPage = pages[Math.floor(Math.random() * pages.length)];
      const startMode = displayModes[Math.floor(Math.random() * displayModes.length)];
      messages.push({
        content: `${this.generateMultiActionCommand(startPage, startMode, 0)} for ${scenario.toLowerCase()}`,
        expected: [
          { name: "navigateToPage", args: { page: startPage } },
          { name: "setDisplayMode", args: { mode: startMode } }
        ]
      });

      // Mix of informational and state changes
      for (let j = 1; j < messageCount; j++) {
        if (Math.random() < 0.4) {
          // Informational question
          const question = questions[Math.floor(Math.random() * questions.length)];
          messages.push({
            content: question,
            expected: []
          });
        } else {
          // State change
          const actionType = Math.random();
          if (actionType < 0.4) {
            const page = pages[Math.floor(Math.random() * pages.length)];
            messages.push({
              content: this.generateNavigationCommand(page, j),
              expected: [{ name: "navigateToPage", args: { page } }]
            });
          } else if (actionType < 0.7) {
            const mode = displayModes[Math.floor(Math.random() * displayModes.length)];
            messages.push({
              content: this.generateDisplayModeCommand(mode, j),
              expected: [{ name: "setDisplayMode", args: { mode } }]
            });
          } else {
            const range = dateRanges[Math.floor(Math.random() * dateRanges.length)];
            messages.push({
              content: this.generateDateRangeCommand(range, j),
              expected: [{ name: "setDateRange", args: { range } }]
            });
          }
        }
      }

      chains.push({
        name: `${scenario} Session ${i + 1}`,
        messages
      });
    }

    return chains;
  }

  generateNavigationCommand(page, index) {
    const navigationPhrases = [
      [`Go to ${page}`, `Take me to ${page}`, `Show me ${page}`, `Open ${page}`, `Navigate to ${page}`],
      [`Switch to ${page}`, `Move to ${page}`, `Jump to ${page}`, `Access ${page}`, `Display ${page}`],
      [`I want to see ${page}`, `Show the ${page} page`, `Go to ${page} page`, `Open ${page} section`, `Take me to the ${page}`]
    ];

    const phraseSet = navigationPhrases[index % navigationPhrases.length];
    return phraseSet[Math.floor(Math.random() * phraseSet.length)];
  }

  generateDisplayModeCommand(mode, index) {
    const modeCommands = {
      dollar: [`Show in dollars`, `Display dollars`, `Switch to dollar mode`, `Change to dollars`, `View in dollars`],
      r: [`Switch to R mode`, `Show R multiples`, `Display in R`, `Change to R values`, `R mode please`],
      gross: [`Show gross mode`, `Display gross profits`, `Switch to gross`, `G mode please`, `Gross values`],
      net: [`Show net mode`, `Display net profits`, `Switch to net`, `N mode please`, `Net values`]
    };

    const commands = modeCommands[mode];
    return commands[Math.floor(Math.random() * commands.length)];
  }

  generateDateRangeCommand(range, index) {
    const rangeCommands = {
      today: [`Show today`, `Today only`, `Just today`, `Current day`],
      yesterday: [`Show yesterday`, `Yesterday's data`, `Previous day`],
      week: [`This week`, `Current week`, `Show week`, `Weekly view`],
      lastWeek: [`Last week`, `Previous week`, `Show last week`],
      month: [`This month`, `Current month`, `Monthly view`, `Show month`],
      lastMonth: [`Last month`, `Previous month`, `Show last month`],
      all: [`All time`, `Show everything`, `Full history`, `All data`],
      '90day': [`90 days`, `Three months`, `Quarterly view`, `90 day period`]
    };

    const commands = rangeCommands[range];
    return commands[Math.floor(Math.random() * commands.length)];
  }

  generateMultiActionCommand(page, mode, index) {
    return `${page} in ${mode} mode`;
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  async runConversationChain(chainData) {
    console.log(`\n🎯 ${chainData.name} (${chainData.messages.length} messages)`);

    this.conversationHistory = [];
    const conversationId = `chain_${Date.now()}_${Math.random()}`;
    let allSuccess = true;

    for (let i = 0; i < chainData.messages.length; i++) {
      const message = chainData.messages[i];

      const result = await this.sendMessage(
        message.content,
        conversationId,
        message.expected || []
      );

      if (!result.success) {
        allSuccess = false;
      }
    }

    console.log(`   📊 ${allSuccess ? '✅ PERFECT CHAIN' : '❌ Chain Failed'}`);
    return { name: chainData.name, success: allSuccess, messageCount: chainData.messages.length };
  }

  async runMassiveTestSuite() {
    console.log('🚀 MASSIVE CONVERSATION CHAIN TEST SUITE');
    console.log('Testing 500+ conversation chains with 3-10 message lengths');
    console.log('Validating state persistence and context preservation\n');

    const chains = this.generateMassiveChainLibrary();
    const results = {
      navigationChains: [],
      displayModeChains: [],
      mixedStateChains: [],
      informationalChains: [],
      realUserChains: []
    };

    let totalStartTime = Date.now();

    for (const [category, chainArray] of Object.entries(chains)) {
      console.log(`\n🔥 TESTING ${category.toUpperCase()} (${chainArray.length} chains)`);
      console.log('='.repeat(60));

      let categoryStart = Date.now();

      for (let i = 0; i < chainArray.length; i++) {
        const chain = chainArray[i];
        process.stdout.write(`\n[${i + 1}/${chainArray.length}] `);
        const result = await this.runConversationChain(chain);
        results[category].push(result);

        // Brief pause between chains
        await this.sleep(500);
      }

      let categoryTime = ((Date.now() - categoryStart) / 1000).toFixed(1);
      console.log(`\n📊 ${category} completed in ${categoryTime}s`);
    }

    let totalTime = ((Date.now() - totalStartTime) / 60000).toFixed(1);

    // Generate comprehensive final report
    this.generateMassiveFinalReport(results, totalTime);
    return results;
  }

  generateMassiveFinalReport(results, totalTime) {
    console.log('\n🏁 MASSIVE CONVERSATION CHAIN TEST RESULTS');
    console.log('='.repeat(70));

    let totalChains = 0;
    let perfectChains = 0;
    let totalMessages = 0;

    const categoryStats = {};

    for (const [category, chainArray] of Object.entries(results)) {
      let categoryPerfect = 0;
      let categoryMessages = 0;

      for (const chain of chainArray) {
        totalChains++;
        totalMessages += chain.messageCount;
        categoryMessages += chain.messageCount;

        if (chain.success) {
          perfectChains++;
          categoryPerfect++;
        }
      }

      const categoryChainRate = ((categoryPerfect / chainArray.length) * 100).toFixed(1);

      categoryStats[category] = {
        total: chainArray.length,
        perfect: categoryPerfect,
        messages: categoryMessages,
        rate: parseFloat(categoryChainRate)
      };

      console.log(`\n📊 ${category.toUpperCase()}`);
      console.log(`   Chains: ${categoryPerfect}/${chainArray.length} perfect (${categoryChainRate}%)`);
      console.log(`   Messages: ${categoryMessages} total`);
    }

    const overallChainRate = ((perfectChains / totalChains) * 100).toFixed(1);

    console.log('\n🎯 COMPREHENSIVE RESULTS');
    console.log('='.repeat(40));
    console.log(`Perfect Chains: ${overallChainRate}% (${perfectChains}/${totalChains})`);
    console.log(`Total Messages Tested: ${totalMessages}`);
    console.log(`Total Test Time: ${totalTime} minutes`);
    console.log(`Average Chain Length: ${(totalMessages / totalChains).toFixed(1)} messages`);

    if (overallChainRate === '100.0') {
      console.log('\n🎉 BULLETPROOF CONVERSATIONAL AI ACHIEVED! 🎉');
      console.log('✅ All 500+ conversation chains work perfectly');
      console.log('✅ Complete state persistence across long conversations');
      console.log('✅ Perfect context preservation in 3-10 message chains');
      console.log('✅ Mixed informational/action patterns validated');
      console.log('✅ Real user browsing scenarios confirmed');
      console.log('✅ System ready for production deployment');
    } else {
      console.log('\n🔧 OPTIMIZATION NEEDED:');
      console.log(`   • Chain Success Rate: ${overallChainRate}% (target: 100%)`);

      Object.entries(categoryStats).forEach(([category, stats]) => {
        if (stats.rate < 100) {
          console.log(`   • ${category}: ${stats.rate}% (${stats.perfect}/${stats.total})`);
        }
      });
    }

    return {
      totalChains,
      perfectChains,
      totalMessages,
      overallChainRate: parseFloat(overallChainRate),
      categoryStats,
      testTime: totalTime
    };
  }
}

// Execute the massive conversation chain test
async function runMassiveConversationTest() {
  const tester = new MassiveConversationChainTester();

  try {
    console.log('⚡ Starting massive conversation chain validation...\n');

    const results = await tester.runMassiveTestSuite();

    const success = results.overallChainRate === 100.0;
    console.log(`\n🏆 ${success ? 'COMPLETE SUCCESS' : 'NEEDS OPTIMIZATION'}: ${results.overallChainRate}% chain success rate`);

    process.exit(success ? 0 : 1);

  } catch (error) {
    console.error('💥 Massive conversation test failed:', error);
    process.exit(1);
  }
}

runMassiveConversationTest();