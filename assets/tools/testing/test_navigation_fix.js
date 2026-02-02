/**
 * TEST NAVIGATION FIXES: Test the enhanced navigation detection
 */

async function testNavigationFix() {
  console.log('🎯 TESTING ENHANCED NAVIGATION DETECTION');

  const commands = [
    'Take me to the trades page and show in dollars',
    'I want to see the journal in R multiples',
    'Open analytics and switch to gross mode',
    'Calendar view in net mode please'
  ];

  for (const command of commands) {
    console.log(`\nTesting: "${command}"`);

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
              messages: [{ content: command, role: 'user' }]
            }
          }
        })
      });

      const data = await response.json();
      const actions = data?.data?.generateCopilotResponse?.metaEvents || [];
      console.log(`Actions Found: ${actions.length}`);
      actions.forEach(action => {
        console.log(`  ${action.name}(${JSON.stringify(action.args)})`);
      });

    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  }
}

testNavigationFix().catch(console.error);