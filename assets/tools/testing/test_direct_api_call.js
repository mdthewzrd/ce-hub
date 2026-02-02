/**
 * DIRECT API TEST: Test CopilotKit API directly
 * Verify that the API is working independently of the React component
 */

// Use built-in fetch in Node.js 18+

async function testDirectAPICall() {
  console.log('🔧 TESTING COPILOTKIT API DIRECTLY');
  console.log('Target: Send "show in R" directly to API');

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
              content: 'show in R',
              role: 'user'
            }]
          }
        }
      })
    });

    const data = await response.json();
    console.log('\n🎯 API Response:', JSON.stringify(data, null, 2));

    // Check if we got the expected setDisplayMode action
    const actions = data?.data?.generateCopilotResponse?.metaEvents || [];
    const hasRAction = actions.some(action =>
      action.name === 'setDisplayMode' && action.args?.mode === 'r'
    );

    console.log('\n🔍 Analysis:');
    console.log(`  Status Code: ${response.status}`);
    console.log(`  Actions Found: ${actions.length}`);
    console.log(`  Has R Action: ${hasRAction ? '✅' : '❌'}`);

    if (actions.length > 0) {
      console.log('  Actions:', actions.map(a => `${a.name}(${JSON.stringify(a.args)})`));
    }

    return hasRAction;

  } catch (error) {
    console.error('💥 Direct API test failed:', error);
    return false;
  }
}

testDirectAPICall().then(success => {
  console.log(`\n🏁 DIRECT API TEST: ${success ? 'SUCCESS ✅' : 'FAILED ❌'}`);

  if (success) {
    console.log('💡 API is working! Issue must be in React component message sending');
  } else {
    console.log('🔧 API itself has issues - need to debug API first');
  }

  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});