/**
 * TRIPLE CONFIRMATION TEST: Verify multi-step commands work perfectly
 * Testing: Dashboard + Display Modes (dollars/R/gross/net) + Date Ranges
 */

async function tripleConfirmationTest() {
  console.log('🎯 TRIPLE CONFIRMATION TEST: Multi-Step Commands');
  console.log('Testing all display modes + navigation + date ranges\n');

  const testCommands = [
    // Original user command
    {
      name: "ORIGINAL USER COMMAND",
      command: "Can we look at the dashboard in dollars and look at all time for the date range?",
      expected: [
        { name: "navigateToPage", args: { page: "dashboard" }},
        { name: "setDisplayMode", args: { mode: "dollar" }},
        { name: "setDateRange", args: { range: "all" }}
      ]
    },

    // G (Gross) Mode Tests
    {
      name: "GROSS MODE - Dashboard",
      command: "Show me the dashboard in gross mode for this week",
      expected: [
        { name: "navigateToPage", args: { page: "dashboard" }},
        { name: "setDisplayMode", args: { mode: "gross" }},
        { name: "setDateRange", args: { range: "week" }}
      ]
    },
    {
      name: "GROSS MODE - Statistics",
      command: "Go to statistics and display gross profits for today",
      expected: [
        { name: "navigateToPage", args: { page: "statistics" }},
        { name: "setDisplayMode", args: { mode: "gross" }},
        { name: "setDateRange", args: { range: "today" }}
      ]
    },
    {
      name: "GROSS MODE - Letter G",
      command: "Dashboard showing G values for all time",
      expected: [
        { name: "navigateToPage", args: { page: "dashboard" }},
        { name: "setDisplayMode", args: { mode: "gross" }},
        { name: "setDateRange", args: { range: "all" }}
      ]
    },

    // N (Net) Mode Tests
    {
      name: "NET MODE - Dashboard",
      command: "Show me the dashboard in net mode for this month",
      expected: [
        { name: "navigateToPage", args: { page: "dashboard" }},
        { name: "setDisplayMode", args: { mode: "net" }},
        { name: "setDateRange", args: { range: "month" }}
      ]
    },
    {
      name: "NET MODE - Statistics",
      command: "Go to statistics and show net profits for yesterday",
      expected: [
        { name: "navigateToPage", args: { page: "statistics" }},
        { name: "setDisplayMode", args: { mode: "net" }},
        { name: "setDateRange", args: { range: "yesterday" }}
      ]
    },
    {
      name: "NET MODE - Letter N",
      command: "Statistics displaying N values for 90 days",
      expected: [
        { name: "navigateToPage", args: { page: "statistics" }},
        { name: "setDisplayMode", args: { mode: "net" }},
        { name: "setDateRange", args: { range: "90day" }}
      ]
    },

    // R Mode Tests (verification)
    {
      name: "R MODE - Verification",
      command: "Dashboard in R mode for last week",
      expected: [
        { name: "navigateToPage", args: { page: "dashboard" }},
        { name: "setDisplayMode", args: { mode: "r" }},
        { name: "setDateRange", args: { range: "lastWeek" }}
      ]
    },

    // Dollar Mode Tests (verification)
    {
      name: "DOLLAR MODE - Verification",
      command: "Statistics in dollars for last month",
      expected: [
        { name: "navigateToPage", args: { page: "statistics" }},
        { name: "setDisplayMode", args: { mode: "dollar" }},
        { name: "setDateRange", args: { range: "lastMonth" }}
      ]
    }
  ];

  let totalTests = testCommands.length;
  let passedTests = 0;
  const results = [];

  for (const test of testCommands) {
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

      // Check if all expected actions are present
      let allMatched = true;
      const foundActions = [];
      const missingActions = [];

      for (const expectedAction of test.expected) {
        const found = actions.find(action =>
          action.name === expectedAction.name &&
          JSON.stringify(action.args) === JSON.stringify(expectedAction.args)
        );
        if (found) {
          foundActions.push(`${found.name}(${JSON.stringify(found.args)})`);
        } else {
          allMatched = false;
          missingActions.push(`${expectedAction.name}(${JSON.stringify(expectedAction.args)})`);
        }
      }

      const successRate = ((foundActions.length / test.expected.length) * 100).toFixed(1);

      if (allMatched && actions.length === test.expected.length) {
        console.log(`   ✅ PERFECT! ${successRate}% (${foundActions.length}/${test.expected.length})`);
        passedTests++;
      } else {
        console.log(`   ❌ Failed: ${successRate}% (${foundActions.length}/${test.expected.length})`);
        if (missingActions.length > 0) {
          console.log(`      Missing: ${missingActions.join(', ')}`);
        }
        if (actions.length > test.expected.length) {
          const extraActions = actions.filter(action =>
            !test.expected.some(expected =>
              action.name === expected.name &&
              JSON.stringify(action.args) === JSON.stringify(expected.args)
            )
          );
          console.log(`      Extra: ${extraActions.map(a => `${a.name}(${JSON.stringify(a.args)})`).join(', ')}`);
        }
      }

      results.push({
        name: test.name,
        command: test.command,
        success: allMatched && actions.length === test.expected.length,
        successRate: parseFloat(successRate),
        found: foundActions,
        missing: missingActions
      });

    } catch (error) {
      console.log(`   💥 ERROR: ${error.message}`);
      results.push({
        name: test.name,
        command: test.command,
        success: false,
        error: error.message
      });
    }

    console.log('');
  }

  // Final Report
  const overallSuccessRate = ((passedTests / totalTests) * 100).toFixed(1);

  console.log('🏁 TRIPLE CONFIRMATION TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`Overall Success Rate: ${overallSuccessRate}% (${passedTests}/${totalTests})`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}`);

  if (overallSuccessRate === '100.0') {
    console.log('\n🎉 TRIPLE CONFIRMATION SUCCESSFUL! 🎉');
    console.log('✅ Original user command works perfectly');
    console.log('✅ G (gross) mode works perfectly');
    console.log('✅ N (net) mode works perfectly');
    console.log('✅ All multi-step combinations work flawlessly');
  } else {
    console.log('\n🔧 Issues found:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`   • ${result.name}: ${result.command}`);
    });
  }

  return overallSuccessRate === '100.0';
}

tripleConfirmationTest().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});