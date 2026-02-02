/**
 * TEST DOLLAR DETECTION: Test the updated dollar detection logic
 */

async function testDollarDetection() {
  console.log('🔧 TESTING UPDATED DOLLAR DETECTION');
  console.log('Target: Send "show stats in dollars" to API');

  try {
    console.log('📍 Sending direct API request...');

    const response = await fetch('http://localhost:6565/api/copilotkit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operationName: 'generateCopilotResponse',
        query: `
          mutation generateCopilotResponse($data: CopilotResponseInput!) {
            generateCopilotResponse(data: $data) {
              threadId
              runId
              extensions
              messages {
                __typename
                id
                createdAt
                content
                role
                parentMessageId
                status {
                  __typename
                  code
                }
              }
              metaEvents {
                __typename
                id
                name
                args
                timestamp
              }
            }
          }
        `,
        variables: {
          data: {
            messages: [{
              content: 'Can we please look at the stats page in dollars and all times?',
              role: 'user'
            }]
          }
        }
      })
    });

    const data = await response.json();
    console.log('\n🎯 API Response:', JSON.stringify(data, null, 2));

    // Check if we got the expected dollar mode action
    const actions = data?.data?.generateCopilotResponse?.metaEvents || [];
    const hasDollarAction = actions.some(action =>
      action.name === 'setDisplayMode' && action.args?.mode === 'dollar'
    );

    console.log('\n🔍 Analysis:');
    console.log(`  Status Code: ${response.status}`);
    console.log(`  Actions Found: ${actions.length}`);
    console.log(`  Has Dollar Action: ${hasDollarAction ? '✅' : '❌'}`);

    if (actions.length > 0) {
      console.log('  Actions:', actions.map(a => `${a.name}(${JSON.stringify(a.args)})`));
    }

    return hasDollarAction;

  } catch (error) {
    console.error('💥 Dollar detection test failed:', error);
    return false;
  }
}

testDollarDetection().then(success => {
  console.log(`\n🏁 DOLLAR DETECTION TEST: ${success ? 'SUCCESS ✅' : 'FAILED ❌'}`);

  if (success) {
    console.log('💡 Dollar detection is now working! The display mode should change.');
  } else {
    console.log('🔧 Dollar detection still needs debugging');
  }

  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});