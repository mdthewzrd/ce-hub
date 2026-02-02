/**
 * TEST: User's Exact Failing Commands
 * Tests the specific commands that failed in the user's sequence
 */

async function testFailingCommands() {
  console.log('🔧 TESTING USER\'S EXACT FAILING COMMANDS');
  console.log('These are the commands that failed in the user\'s actual test\n');

  const failingTests = [
    {
      name: "Net Command That Failed",
      command: "Now can we look at net",
      expectedActions: [
        { name: "setDisplayMode", args: { mode: "net" } }
      ],
      description: "Should detect 'look at net' pattern"
    },
    {
      name: "R Command That Partially Failed",
      command: "Can we look at the trades in R?",
      expectedActions: [
        { name: "navigateToPage", args: { page: "trades" } },
        { name: "setDisplayMode", args: { mode: "r" } }
      ],
      description: "Should detect both navigation and 'in R?' pattern"
    }
  ];

  let allPassed = true;

  for (const test of failingTests) {
    console.log(`🧪 Testing: "${test.command}"`);
    console.log(`   Expected: ${test.expectedActions.length} actions`);

    try {
      const response = await fetch('http://localhost:6565/api/copilotkit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operationName: 'generateCopilotResponse',
          query: `mutation generateCopilotResponse($data: CopilotResponseInput!) {
            generateCopilotResponse(data: $data) {
              metaEvents { name args }
              messages { content }
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

      console.log(`   📤 Generated ${actions.length} actions:`);
      actions.forEach((action, i) => {
        console.log(`      ${i+1}. ${action.name}(${JSON.stringify(action.args)})`);
      });
      console.log(`   💬 Message: "${message}"`);

      // Validate actions
      const isValid = actions.length === test.expectedActions.length &&
                     test.expectedActions.every(expectedAction =>
                       actions.some(action =>
                         action.name === expectedAction.name &&
                         JSON.stringify(action.args) === JSON.stringify(expectedAction.args)
                       )
                     );

      if (isValid) {
        console.log(`   ✅ FIXED! ${test.description}`);
        console.log(`      All expected actions generated correctly\n`);
      } else {
        console.log(`   ❌ STILL FAILING: ${test.description}`);
        console.log(`      Expected: ${test.expectedActions.map(a => `${a.name}(${JSON.stringify(a.args)})`).join(', ')}`);
        console.log(`      Got:      ${actions.map(a => `${a.name}(${JSON.stringify(a.args)})`).join(', ')}\n`);
        allPassed = false;
      }

    } catch (error) {
      console.log(`   💥 ERROR: ${error.message}\n`);
      allPassed = false;
    }
  }

  console.log('🏁 FAILING COMMANDS TEST RESULTS');
  console.log('='.repeat(40));

  if (allPassed) {
    console.log('🎉 ALL FAILING COMMANDS NOW FIXED!');
    console.log('✅ "Now can we look at net" now detects net mode');
    console.log('✅ "Can we look at the trades in R?" now detects both navigation and R mode');
    console.log('🚀 The user\'s exact failing sequence should now work correctly!');
  } else {
    console.log('💥 SOME COMMANDS STILL FAILING');
    console.log('❌ Additional detection pattern fixes needed');
  }

  return allPassed;
}

testFailingCommands().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});