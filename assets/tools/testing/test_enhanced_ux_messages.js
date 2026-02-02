/**
 * TEST: Enhanced UX Completion Messages
 * Validates that Renata now provides helpful, specific completion messages
 */

async function testEnhancedUXMessages() {
  console.log('🎯 TESTING ENHANCED UX COMPLETION MESSAGES');
  console.log('Validating new smart completion feedback system\n');

  const tests = [
    {
      name: "Single Navigation Command",
      command: "Go to dashboard",
      expectedMessage: "navigated to dashboard",
      description: "Simple navigation should provide specific feedback"
    },
    {
      name: "Display Mode Change",
      command: "Switch to dollars",
      expectedMessage: "switched to dollars display",
      description: "Display mode changes should be clearly confirmed"
    },
    {
      name: "Date Range Change",
      command: "Show all time data",
      expectedMessage: "set date range to all time",
      description: "Date range changes should be explicitly stated"
    },
    {
      name: "Multi-Step Command - Your Original Example",
      command: "Can we look at the dashboard in dollars and look at all time for the date range?",
      expectedActions: [
        { name: "navigateToPage", args: { page: "dashboard" } },
        { name: "setDisplayMode", args: { mode: "dollar" } },
        { name: "setDateRange", args: { range: "all" } }
      ],
      expectedPhrases: ["navigated to dashboard", "switched to dollars display", "set date range to all time"],
      description: "Complex multi-action commands should provide comprehensive feedback"
    },
    {
      name: "Question (No Actions)",
      command: "How is my performance looking?",
      expectedMessage: "I understand. I'm here to help",
      description: "Questions should receive acknowledgment message"
    }
  ];

  let totalTests = tests.length;
  let passedTests = 0;

  for (const test of tests) {
    console.log(`🧪 Testing: ${test.name}`);
    console.log(`   Command: "${test.command}"`);

    try {
      const response = await fetch('http://localhost:6565/api/copilotkit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operationName: 'generateCopilotResponse',
          query: `mutation generateCopilotResponse($data: CopilotResponseInput!) {
            generateCopilotResponse(data: $data) {
              metaEvents { name args }
              messages { content role }
            }
          }`,
          variables: {
            data: {
              messages: [{ content: test.command, role: 'user' }]
            }
          }
        })
      });

      const data = await response.json();
      const actions = data?.data?.generateCopilotResponse?.metaEvents || [];
      const message = data?.data?.generateCopilotResponse?.messages?.[0]?.content || "";

      console.log(`   📤 Actions Generated: ${actions.length}`);
      console.log(`   💬 Message: "${message}"`);

      // Validate the message content
      let messageValid = false;

      if (test.expectedPhrases) {
        // Multi-step command: check for all expected phrases
        messageValid = test.expectedPhrases.every(phrase =>
          message.toLowerCase().includes(phrase.toLowerCase())
        );

        if (messageValid) {
          console.log(`   ✅ EXCELLENT! All expected phrases found:`);
          test.expectedPhrases.forEach(phrase => {
            console.log(`      - "${phrase}" ✓`);
          });
        } else {
          console.log(`   ❌ Missing expected phrases:`);
          test.expectedPhrases.forEach(phrase => {
            const found = message.toLowerCase().includes(phrase.toLowerCase());
            console.log(`      - "${phrase}" ${found ? '✓' : '❌'}`);
          });
        }
      } else if (test.expectedMessage) {
        // Single expectation: check for specific message
        messageValid = message.toLowerCase().includes(test.expectedMessage.toLowerCase());

        if (messageValid) {
          console.log(`   ✅ PERFECT! Expected message found: "${test.expectedMessage}"`);
        } else {
          console.log(`   ❌ Expected "${test.expectedMessage}" but got different message`);
        }
      }

      if (messageValid) {
        passedTests++;
        console.log(`   🎯 ${test.description}: PASSED\n`);
      } else {
        console.log(`   💥 ${test.description}: FAILED\n`);
      }

    } catch (error) {
      console.log(`   💥 ERROR: ${error.message}\n`);
    }
  }

  // Final Results
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);

  console.log('🏁 ENHANCED UX TESTING RESULTS');
  console.log('='.repeat(50));
  console.log(`Overall Success Rate: ${successRate}% (${passedTests}/${totalTests})`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}`);

  if (successRate === '100.0') {
    console.log('\n🎉 ENHANCED UX SYSTEM PERFECT! 🎉');
    console.log('✅ Smart completion messages working flawlessly');
    console.log('✅ Users will now get clear, helpful feedback');
    console.log('✅ "Typing indicator feel" achieved through instant smart responses');
    console.log('✅ No more generic "Navigating and applying..." messages');
    console.log('✅ Specific, actionable completion confirmations delivered');
  } else {
    console.log('\n🔧 Enhancement needed:');
    console.log('Some UX messages may need refinement for optimal user experience');
  }

  return successRate === '100.0';
}

testEnhancedUXMessages().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});