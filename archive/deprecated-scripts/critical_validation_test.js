/**
 * CRITICAL VALIDATION TEST: Test the exact failing command
 * "stats page in R over the last 90 days"
 *
 * This validates our fixes:
 * ✅ Navigation happens FIRST
 * ✅ 90-day detection works with "over the last 90 days"
 * ✅ R mode detection works
 * ✅ Shorter success messages
 * ✅ Correct action ordering
 */

async function testCriticalValidation() {
  console.log('🎯 CRITICAL VALIDATION TEST: Exact User Failure Case');
  console.log('Testing: "stats page in R over the last 90 days"');
  console.log('Expected: Navigate to stats FIRST, then set R mode, then set 90-day range\n');

  const testCommand = "stats page in R over the last 90 days";
  const expectedActions = [
    { name: "navigateToPage", args: { page: "statistics" } },
    { name: "setDisplayMode", args: { mode: "r" } },
    { name: "setDateRange", args: { range: "90day" } }
  ];

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
            messages: [{ content: testCommand, role: 'user' }]
          }
        }
      })
    });

    const data = await response.json();
    const actions = data?.data?.generateCopilotResponse?.metaEvents || [];
    const message = data?.data?.generateCopilotResponse?.messages?.[0]?.content || "";

    console.log('📤 ACTIONS GENERATED:');
    actions.forEach((action, index) => {
      console.log(`   ${index + 1}. ${action.name}(${JSON.stringify(action.args)})`);
    });

    console.log('\n💬 RESPONSE MESSAGE:');
    console.log(`   "${message}"`);

    // Validate action count
    if (actions.length !== expectedActions.length) {
      console.log(`\n❌ FAILED: Expected ${expectedActions.length} actions, got ${actions.length}`);
      return false;
    }

    // Validate action sequence and content
    let allValid = true;
    for (let i = 0; i < expectedActions.length; i++) {
      const expected = expectedActions[i];
      const actual = actions[i];

      const isValid = actual.name === expected.name &&
                     JSON.stringify(actual.args) === JSON.stringify(expected.args);

      if (isValid) {
        console.log(`\n✅ Action ${i + 1} PERFECT: ${actual.name}(${JSON.stringify(actual.args)})`);
      } else {
        console.log(`\n❌ Action ${i + 1} FAILED:`);
        console.log(`   Expected: ${expected.name}(${JSON.stringify(expected.args)})`);
        console.log(`   Got:      ${actual.name}(${JSON.stringify(actual.args)})`);
        allValid = false;
      }
    }

    // Validate message is shorter
    const isMessageShort = message.length < 50; // Much shorter than before
    if (isMessageShort) {
      console.log(`\n✅ MESSAGE LENGTH PERFECT: ${message.length} characters (short and simple)`);
    } else {
      console.log(`\n⚠️  MESSAGE TOO LONG: ${message.length} characters`);
    }

    if (allValid && isMessageShort) {
      console.log('\n🎉 CRITICAL VALIDATION: COMPLETE SUCCESS! 🎉');
      console.log('✅ Navigation happens FIRST (statistics page)');
      console.log('✅ 90-day detection works with "over the last 90 days"');
      console.log('✅ R mode detection works');
      console.log('✅ Actions are in correct order');
      console.log('✅ Message is short and simple');
      console.log('\n🔥 The exact user failure case is now FIXED! 🔥');
      return true;
    } else {
      console.log('\n💥 CRITICAL VALIDATION FAILED');
      console.log('The user\'s exact failure case still has issues');
      return false;
    }

  } catch (error) {
    console.log(`\n💥 ERROR: ${error.message}`);
    return false;
  }
}

// Additional edge case tests
async function testAdditionalCases() {
  console.log('\n\n🧪 ADDITIONAL EDGE CASE TESTS');
  console.log('='.repeat(50));

  const additionalTests = [
    {
      command: "go to dashboard in dollars for the past 90 days",
      expected: [
        { name: "navigateToPage", args: { page: "dashboard" } },
        { name: "setDisplayMode", args: { mode: "dollar" } },
        { name: "setDateRange", args: { range: "90day" } }
      ],
      description: "Dashboard + dollars + past 90 days"
    },
    {
      command: "show me trades in R mode for last 90 days",
      expected: [
        { name: "navigateToPage", args: { page: "trades" } },
        { name: "setDisplayMode", args: { mode: "r" } },
        { name: "setDateRange", args: { range: "90day" } }
      ],
      description: "Trades + R mode + last 90 days"
    }
  ];

  let allPassed = true;
  for (const test of additionalTests) {
    console.log(`\n🧪 Testing: "${test.command}"`);

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

      const isValid = actions.length === test.expected.length &&
                     test.expected.every((expectedAction, index) =>
                       actions[index] &&
                       actions[index].name === expectedAction.name &&
                       JSON.stringify(actions[index].args) === JSON.stringify(expectedAction.args)
                     );

      if (isValid) {
        console.log(`   ✅ ${test.description}: PASSED`);
      } else {
        console.log(`   ❌ ${test.description}: FAILED`);
        console.log(`      Got: ${actions.map(a => `${a.name}(${JSON.stringify(a.args)})`).join(', ')}`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`   💥 ${test.description}: ERROR - ${error.message}`);
      allPassed = false;
    }
  }

  return allPassed;
}

// Run all tests
async function runAllTests() {
  const criticalTest = await testCriticalValidation();
  const edgeTests = await testAdditionalCases();

  console.log('\n\n🏁 FINAL RESULTS');
  console.log('='.repeat(50));

  if (criticalTest && edgeTests) {
    console.log('🎉 ALL TESTS PASSED! The validation fixes are working perfectly!');
    console.log('✅ User\'s exact failure case is now fixed');
    console.log('✅ All edge cases work correctly');
    console.log('✅ Navigation-first ordering implemented');
    console.log('✅ 90-day detection enhanced');
    console.log('✅ Simple success messages implemented');
    return true;
  } else {
    console.log('💥 SOME TESTS FAILED - Further fixes needed');
    return false;
  }
}

runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});