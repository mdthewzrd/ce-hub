/**
 * QUICK EDGE CASE TEST: Test the two remaining failures
 */

async function testEdgeCases() {
  console.log('🎯 TESTING REMAINING EDGE CASES');

  const tests = [
    {
      command: "Show 90 day period",
      expected: [{ name: "setDateRange", args: { range: "90day" } }],
      description: "90 day period detection"
    },
    {
      command: "Show 90 day period for trend analysis",
      expected: [{ name: "setDateRange", args: { range: "90day" } }],
      description: "90 day period for analysis detection"
    }
  ];

  for (const test of tests) {
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

      const isValid = test.expected.every(expectedAction =>
        actions.some(action =>
          action.name === expectedAction.name &&
          JSON.stringify(action.args) === JSON.stringify(expectedAction.args)
        )
      ) && actions.length === test.expected.length;

      if (isValid) {
        console.log(`   ✅ PASSED: ${test.description}`);
        console.log(`      Got: ${actions.map(a => `${a.name}(${JSON.stringify(a.args)})`).join(', ')}`);
      } else {
        console.log(`   ❌ FAILED: ${test.description}`);
        console.log(`      Expected: ${test.expected.map(a => `${a.name}(${JSON.stringify(a.args)})`).join(', ')}`);
        console.log(`      Got: ${actions.map(a => `${a.name}(${JSON.stringify(a.args)})`).join(', ')}`);
      }
    } catch (error) {
      console.log(`   💥 ERROR: ${error.message}`);
    }
  }
}

testEdgeCases().catch(console.error);