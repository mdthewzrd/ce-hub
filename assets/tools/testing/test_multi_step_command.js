/**
 * TEST MULTI-STEP COMMAND: Test complex multi-step state changes
 * Command: "dashboard in dollars and look at all time for the date range"
 * Expected: 3 actions - navigate to dashboard, set display mode to dollar, set date range to all
 */

async function testMultiStepCommand() {
  console.log('🎯 TESTING MULTI-STEP COMMAND');
  console.log('Command: "Can we look at the dashboard in dollars and look at all time for the date range?"');
  console.log('Expected Actions:');
  console.log('  1. navigateToPage: dashboard');
  console.log('  2. setDisplayMode: dollar');
  console.log('  3. setDateRange: all');

  try {
    console.log('\n📍 Sending multi-step API request...');

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
              content: 'Can we look at the dashboard in dollars and look at all time for the date range?',
              role: 'user'
            }]
          }
        }
      })
    });

    const data = await response.json();
    console.log('\n🎯 API Response:', JSON.stringify(data, null, 2));

    // Analyze the actions
    const actions = data?.data?.generateCopilotResponse?.metaEvents || [];

    const hasDashboardAction = actions.some(action =>
      action.name === 'navigateToPage' && action.args?.page === 'dashboard'
    );
    const hasDollarAction = actions.some(action =>
      action.name === 'setDisplayMode' && action.args?.mode === 'dollar'
    );
    const hasDateRangeAction = actions.some(action =>
      action.name === 'setDateRange' && action.args?.range === 'all'
    );

    console.log('\n🔍 Analysis:');
    console.log(`  Status Code: ${response.status}`);
    console.log(`  Total Actions: ${actions.length}`);
    console.log(`  Dashboard Navigation: ${hasDashboardAction ? '✅' : '❌'}`);
    console.log(`  Dollar Display Mode: ${hasDollarAction ? '✅' : '❌'}`);
    console.log(`  All Time Date Range: ${hasDateRangeAction ? '✅' : '❌'}`);

    if (actions.length > 0) {
      console.log('  Actions Found:', actions.map(a => `${a.name}(${JSON.stringify(a.args)})`));
    }

    const successCount = [hasDashboardAction, hasDollarAction, hasDateRangeAction].filter(Boolean).length;
    const successRate = (successCount / 3 * 100).toFixed(1);

    console.log(`\n📊 Success Rate: ${successRate}% (${successCount}/3 actions)`);

    return successCount === 3;

  } catch (error) {
    console.error('💥 Multi-step command test failed:', error);
    return false;
  }
}

testMultiStepCommand().then(success => {
  console.log(`\n🏁 MULTI-STEP COMMAND TEST: ${success ? 'SUCCESS ✅' : 'FAILED ❌'}`);

  if (!success) {
    console.log('\n🔧 Issues identified:');
    console.log('  - Complex parsing of multiple state changes in one message');
    console.log('  - Need improved multi-action detection logic');
    console.log('  - Date range detection may be missing');
  }

  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});