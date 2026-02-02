/**
 * COMPREHENSIVE CONVERSATION CHAIN TESTING SYSTEM
 * Tests 3-10 message chains with state changes and informational requests
 * Ensures 100% bulletproof performance across long conversations
 */

class ConversationChainTester {
  constructor() {
    this.baseUrl = 'http://localhost:6565/api/copilotkit';
    this.conversationHistory = [];
    this.results = [];
    this.delay = 1000; // 1 second delay between messages
  }

  // Send a message and wait for response, tracking the full conversation
  async sendMessage(content, conversationId, expectedActions = []) {
    const message = { content, role: 'user' };
    this.conversationHistory.push(message);

    console.log(`   📤 User: "${content}"`);

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operationName: 'generateCopilotResponse',
          query: `mutation generateCopilotResponse($data: CopilotResponseInput!) {
            generateCopilotResponse(data: $data) {
              threadId
              runId
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

      console.log(`   🤖 Actions: [${actions.map(a => `${a.name}(${JSON.stringify(a.args)})`).join(', ')}]`);

      // Validate expected actions
      let success = true;
      let details = '';

      if (expectedActions.length === 0) {
        // Informational message - should have no actions
        success = actions.length === 0;
        details = actions.length === 0 ? 'Correctly no actions' : `Unexpected actions: ${actions.length}`;
      } else {
        // State-changing message - validate specific actions
        const foundActions = [];
        const missingActions = [];

        for (const expected of expectedActions) {
          const found = actions.find(action =>
            action.name === expected.name &&
            JSON.stringify(action.args) === JSON.stringify(expected.args)
          );
          if (found) {
            foundActions.push(`${found.name}(${JSON.stringify(found.args)})`);
          } else {
            success = false;
            missingActions.push(`${expected.name}(${JSON.stringify(expected.args)})`);
          }
        }

        if (actions.length !== expectedActions.length) {
          success = false;
        }

        details = success ? 'Perfect match' : `Missing: ${missingActions.join(', ')}`;
      }

      console.log(`   ${success ? '✅' : '❌'} ${details}`);

      await this.sleep(this.delay);

      return { success, actions, details, message: assistantMessage };

    } catch (error) {
      console.log(`   💥 ERROR: ${error.message}`);
      return { success: false, error: error.message, actions: [], details: 'Network error' };
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Generate conversation chain patterns
  generateConversationChains() {
    return {
      // 1. Pure Navigation Chains (3-7 messages)
      navigationChains: [
        {
          name: "Dashboard → Stats → Trades Navigation",
          messages: [
            { content: "Go to the dashboard", expected: [{ name: "navigateToPage", args: { page: "dashboard" }}] },
            { content: "Now take me to statistics", expected: [{ name: "navigateToPage", args: { page: "statistics" }}] },
            { content: "Show me the trades page", expected: [{ name: "navigateToPage", args: { page: "trades" }}] }
          ]
        },
        {
          name: "Journal → Analytics → Calendar Navigation",
          messages: [
            { content: "Open the journal", expected: [{ name: "navigateToPage", args: { page: "journal" }}] },
            { content: "Switch to analytics", expected: [{ name: "navigateToPage", args: { page: "analytics" }}] },
            { content: "Go to calendar view", expected: [{ name: "navigateToPage", args: { page: "calendar" }}] }
          ]
        },
        {
          name: "Extended Navigation Chain",
          messages: [
            { content: "Take me to dashboard", expected: [{ name: "navigateToPage", args: { page: "dashboard" }}] },
            { content: "Go to trades", expected: [{ name: "navigateToPage", args: { page: "trades" }}] },
            { content: "Show journal", expected: [{ name: "navigateToPage", args: { page: "journal" }}] },
            { content: "Open analytics", expected: [{ name: "navigateToPage", args: { page: "analytics" }}] },
            { content: "Switch to calendar", expected: [{ name: "navigateToPage", args: { page: "calendar" }}] },
            { content: "Back to statistics", expected: [{ name: "navigateToPage", args: { page: "statistics" }}] }
          ]
        }
      ],

      // 2. Pure Display Mode Chains (3-6 messages)
      displayModeChains: [
        {
          name: "Dollar → R → Gross Mode Switching",
          messages: [
            { content: "Show in dollars", expected: [{ name: "setDisplayMode", args: { mode: "dollar" }}] },
            { content: "Switch to R mode", expected: [{ name: "setDisplayMode", args: { mode: "r" }}] },
            { content: "Change to gross mode", expected: [{ name: "setDisplayMode", args: { mode: "gross" }}] }
          ]
        },
        {
          name: "Net → Dollar → R → Gross Full Cycle",
          messages: [
            { content: "Display in net mode", expected: [{ name: "setDisplayMode", args: { mode: "net" }}] },
            { content: "Switch to dollars", expected: [{ name: "setDisplayMode", args: { mode: "dollar" }}] },
            { content: "Change to R multiples", expected: [{ name: "setDisplayMode", args: { mode: "r" }}] },
            { content: "Show gross profits", expected: [{ name: "setDisplayMode", args: { mode: "gross" }}] }
          ]
        },
        {
          name: "Extended Display Mode Chain",
          messages: [
            { content: "Start with dollars", expected: [{ name: "setDisplayMode", args: { mode: "dollar" }}] },
            { content: "Switch to N mode", expected: [{ name: "setDisplayMode", args: { mode: "net" }}] },
            { content: "Change to G values", expected: [{ name: "setDisplayMode", args: { mode: "gross" }}] },
            { content: "Show R multiples", expected: [{ name: "setDisplayMode", args: { mode: "r" }}] },
            { content: "Back to dollar mode", expected: [{ name: "setDisplayMode", args: { mode: "dollar" }}] },
            { content: "Final switch to gross", expected: [{ name: "setDisplayMode", args: { mode: "gross" }}] }
          ]
        }
      ],

      // 3. Mixed State Change Chains (4-8 messages)
      mixedStateChains: [
        {
          name: "Navigation + Display + Date Mix",
          messages: [
            { content: "Go to dashboard in dollars", expected: [
              { name: "navigateToPage", args: { page: "dashboard" }},
              { name: "setDisplayMode", args: { mode: "dollar" }}
            ]},
            { content: "Show this week", expected: [{ name: "setDateRange", args: { range: "week" }}] },
            { content: "Switch to statistics", expected: [{ name: "navigateToPage", args: { page: "statistics" }}] },
            { content: "Change to R mode for all time", expected: [
              { name: "setDisplayMode", args: { mode: "r" }},
              { name: "setDateRange", args: { range: "all" }}
            ]}
          ]
        },
        {
          name: "Complex State Progression",
          messages: [
            { content: "Trades page in gross mode", expected: [
              { name: "navigateToPage", args: { page: "trades" }},
              { name: "setDisplayMode", args: { mode: "gross" }}
            ]},
            { content: "Show today only", expected: [{ name: "setDateRange", args: { range: "today" }}] },
            { content: "Switch to journal in net mode", expected: [
              { name: "navigateToPage", args: { page: "journal" }},
              { name: "setDisplayMode", args: { mode: "net" }}
            ]},
            { content: "Set to last month", expected: [{ name: "setDateRange", args: { range: "lastMonth" }}] },
            { content: "Dashboard in dollars for all time", expected: [
              { name: "navigateToPage", args: { page: "dashboard" }},
              { name: "setDisplayMode", args: { mode: "dollar" }},
              { name: "setDateRange", args: { range: "all" }}
            ]}
          ]
        }
      ],

      // 4. Informational Interjection Chains (5-10 messages)
      informationalChains: [
        {
          name: "State → Info → State Pattern",
          messages: [
            { content: "Go to dashboard in dollars", expected: [
              { name: "navigateToPage", args: { page: "dashboard" }},
              { name: "setDisplayMode", args: { mode: "dollar" }}
            ]},
            { content: "What do you see on the dashboard?", expected: [] },
            { content: "Switch to R mode", expected: [{ name: "setDisplayMode", args: { mode: "r" }}] },
            { content: "How are the R multiples looking?", expected: [] },
            { content: "Show me statistics", expected: [{ name: "navigateToPage", args: { page: "statistics" }}] }
          ]
        },
        {
          name: "Complex Info Interjection",
          messages: [
            { content: "Trades page in gross mode for this week", expected: [
              { name: "navigateToPage", args: { page: "trades" }},
              { name: "setDisplayMode", args: { mode: "gross" }},
              { name: "setDateRange", args: { range: "week" }}
            ]},
            { content: "What's the best trade this week?", expected: [] },
            { content: "Can you analyze the performance?", expected: [] },
            { content: "Switch to net mode", expected: [{ name: "setDisplayMode", args: { mode: "net" }}] },
            { content: "How do net profits compare?", expected: [] },
            { content: "Go to journal", expected: [{ name: "navigateToPage", args: { page: "journal" }}] },
            { content: "What insights do you have?", expected: [] },
            { content: "Change to all time view", expected: [{ name: "setDateRange", args: { range: "all" }}] }
          ]
        }
      ],

      // 5. Real User Simulation Chains (6-10 messages)
      realUserChains: [
        {
          name: "Typical Trading Session Review",
          messages: [
            { content: "Show me dashboard in dollars", expected: [
              { name: "navigateToPage", args: { page: "dashboard" }},
              { name: "setDisplayMode", args: { mode: "dollar" }}
            ]},
            { content: "How did I do today?", expected: [] },
            { content: "Switch to this week", expected: [{ name: "setDateRange", args: { range: "week" }}] },
            { content: "What's my best day?", expected: [] },
            { content: "Show trades page", expected: [{ name: "navigateToPage", args: { page: "trades" }}] },
            { content: "Which trades were most profitable?", expected: [] },
            { content: "Change to R multiples", expected: [{ name: "setDisplayMode", args: { mode: "r" }}] },
            { content: "Any trades above 2R?", expected: [] },
            { content: "Go to journal", expected: [{ name: "navigateToPage", args: { page: "journal" }}] },
            { content: "What did I learn this week?", expected: [] }
          ]
        },
        {
          name: "Performance Analysis Session",
          messages: [
            { content: "Statistics in gross mode for all time", expected: [
              { name: "navigateToPage", args: { page: "statistics" }},
              { name: "setDisplayMode", args: { mode: "gross" }},
              { name: "setDateRange", args: { range: "all" }}
            ]},
            { content: "What's my overall win rate?", expected: [] },
            { content: "Show last month only", expected: [{ name: "setDateRange", args: { range: "lastMonth" }}] },
            { content: "How did last month compare?", expected: [] },
            { content: "Switch to net profits", expected: [{ name: "setDisplayMode", args: { mode: "net" }}] },
            { content: "What were my actual profits?", expected: [] },
            { content: "Go to analytics", expected: [{ name: "navigateToPage", args: { page: "analytics" }}] },
            { content: "Show me the profit curve", expected: [] },
            { content: "Change to R mode", expected: [{ name: "setDisplayMode", args: { mode: "r" }}] },
            { content: "What's my average R per trade?", expected: [] }
          ]
        }
      ]
    };
  }

  // Run a single conversation chain
  async runConversationChain(chainData) {
    console.log(`\n🎯 Testing Chain: ${chainData.name}`);
    console.log(`   Messages: ${chainData.messages.length}`);

    this.conversationHistory = [];
    const conversationId = Date.now().toString();
    let allSuccess = true;
    const chainResults = [];

    for (let i = 0; i < chainData.messages.length; i++) {
      const message = chainData.messages[i];
      console.log(`\n   📍 Message ${i + 1}/${chainData.messages.length}:`);

      const result = await this.sendMessage(
        message.content,
        conversationId,
        message.expected || []
      );

      chainResults.push(result);
      if (!result.success) {
        allSuccess = false;
      }
    }

    const successCount = chainResults.filter(r => r.success).length;
    const successRate = ((successCount / chainData.messages.length) * 100).toFixed(1);

    console.log(`\n   📊 Chain Result: ${successRate}% (${successCount}/${chainData.messages.length})`);

    if (allSuccess) {
      console.log(`   ✅ PERFECT CHAIN! All ${chainData.messages.length} messages succeeded`);
    } else {
      console.log(`   ❌ Chain failures detected`);
      chainResults.forEach((result, index) => {
        if (!result.success) {
          console.log(`      Message ${index + 1}: ${result.details}`);
        }
      });
    }

    return {
      name: chainData.name,
      success: allSuccess,
      successRate: parseFloat(successRate),
      messageCount: chainData.messages.length,
      results: chainResults
    };
  }

  // Run all conversation chains
  async runAllChains() {
    console.log('🚀 COMPREHENSIVE CONVERSATION CHAIN TESTING');
    console.log('Testing 3-10 message chains with state changes and informational requests\n');

    const chains = this.generateConversationChains();
    const results = {
      navigationChains: [],
      displayModeChains: [],
      mixedStateChains: [],
      informationalChains: [],
      realUserChains: []
    };

    // Test each category
    for (const [category, chainArray] of Object.entries(chains)) {
      console.log(`\n🔥 TESTING ${category.toUpperCase()}`);
      console.log('='.repeat(50));

      for (const chain of chainArray) {
        const result = await this.runConversationChain(chain);
        results[category].push(result);

        // Short delay between chains
        await this.sleep(2000);
      }
    }

    // Generate final report
    this.generateFinalReport(results);
    return results;
  }

  generateFinalReport(results) {
    console.log('\n🏁 COMPREHENSIVE CONVERSATION CHAIN TEST RESULTS');
    console.log('='.repeat(60));

    let totalChains = 0;
    let perfectChains = 0;
    let totalMessages = 0;
    let successfulMessages = 0;

    for (const [category, chainArray] of Object.entries(results)) {
      console.log(`\n📊 ${category.toUpperCase()}`);

      let categoryPerfect = 0;
      let categoryMessages = 0;
      let categorySuccessful = 0;

      for (const chain of chainArray) {
        totalChains++;
        totalMessages += chain.messageCount;

        if (chain.success) {
          perfectChains++;
          categoryPerfect++;
          successfulMessages += chain.messageCount;
          categorySuccessful += chain.messageCount;
        } else {
          const successful = chain.results.filter(r => r.success).length;
          successfulMessages += successful;
          categorySuccessful += successful;
        }

        categoryMessages += chain.messageCount;

        console.log(`   ${chain.success ? '✅' : '❌'} ${chain.name}: ${chain.successRate}% (${chain.messageCount} messages)`);
      }

      const categoryChainRate = ((categoryPerfect / chainArray.length) * 100).toFixed(1);
      const categoryMessageRate = ((categorySuccessful / categoryMessages) * 100).toFixed(1);
      console.log(`   📊 Category Summary: ${categoryChainRate}% perfect chains, ${categoryMessageRate}% message success`);
    }

    const overallChainRate = ((perfectChains / totalChains) * 100).toFixed(1);
    const overallMessageRate = ((successfulMessages / totalMessages) * 100).toFixed(1);

    console.log('\n🎯 OVERALL RESULTS');
    console.log('='.repeat(30));
    console.log(`Perfect Chains: ${overallChainRate}% (${perfectChains}/${totalChains})`);
    console.log(`Message Success: ${overallMessageRate}% (${successfulMessages}/${totalMessages})`);
    console.log(`Total Chains Tested: ${totalChains}`);
    console.log(`Total Messages Tested: ${totalMessages}`);

    if (overallChainRate === '100.0' && overallMessageRate === '100.0') {
      console.log('\n🎉 PERFECT CONVERSATIONAL AI! 🎉');
      console.log('✅ All conversation chains work flawlessly');
      console.log('✅ All individual messages succeed');
      console.log('✅ State persistence works perfectly');
      console.log('✅ Context preservation confirmed');
      console.log('✅ Mixed informational/action patterns validated');
    } else {
      console.log('\n🔧 Areas needing improvement:');
      if (overallChainRate !== '100.0') {
        console.log(`   • Chain completion rate: ${overallChainRate}% (target: 100%)`);
      }
      if (overallMessageRate !== '100.0') {
        console.log(`   • Individual message success: ${overallMessageRate}% (target: 100%)`);
      }
    }

    return {
      perfectChains,
      totalChains,
      successfulMessages,
      totalMessages,
      overallChainRate: parseFloat(overallChainRate),
      overallMessageRate: parseFloat(overallMessageRate)
    };
  }
}

// Run the comprehensive conversation chain test
async function runConversationChainTest() {
  const tester = new ConversationChainTester();

  try {
    const results = await tester.runAllChains();

    const summary = results.overallChainRate === 100.0 && results.overallMessageRate === 100.0;
    process.exit(summary ? 0 : 1);

  } catch (error) {
    console.error('💥 Conversation chain test failed:', error);
    process.exit(1);
  }
}

runConversationChainTest();