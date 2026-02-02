// Test dynamic mode switching functionality
async function testDynamicModeSwitching() {
  console.log('🧪 Testing Dynamic Mode Switching...');

  const baseUrl = 'http://localhost:6565';

  const testCases = [
    {
      message: 'hello',
      expectedMode: 'renata',
      description: 'Conversational greeting should stay in renata mode'
    },
    {
      message: 'show me my performance stats',
      expectedMode: 'analyst',
      description: 'Performance request should switch to analyst mode'
    },
    {
      message: 'analyze my trading data',
      expectedMode: 'analyst',
      description: 'Data analysis request should switch to analyst mode'
    },
    {
      message: 'how can i improve my trading',
      expectedMode: 'coach',
      description: 'Improvement request should switch to coach mode'
    },
    {
      message: 'what should i focus on for long term success',
      expectedMode: 'mentor',
      description: 'Long-term guidance should switch to mentor mode'
    },
    {
      message: 'can you mentor me',
      expectedMode: 'mentor',
      description: 'Direct mentor request should switch to mentor mode'
    },
    {
      message: 'i had a bad trade today',
      expectedMode: 'renata',
      description: 'Emotional conversation should stay in renata mode'
    },
    {
      message: 'what are my win rates',
      expectedMode: 'analyst',
      description: 'Stats request should switch to analyst mode'
    },
    {
      message: 'help me get better at trading',
      expectedMode: 'coach',
      description: 'Coaching request should switch to coach mode'
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const test = testCases[i];
    console.log(`\n📤 Test ${i + 1}: "${test.message}"`);
    console.log(`📝 Expected: ${test.description}`);

    try {
      const response = await fetch(`${baseUrl}/api/renata/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: test.message,
          mode: 'renata', // Always start with renata mode
          context: {
            currentDateRange: {
              start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
              end: new Date().toISOString(),
              label: 'Last 90 Days'
            },
            displayMode: 'dollar',
            page: 'dashboard'
          }
        })
      });

      const data = await response.json();

      console.log(`🔍 Mode Analysis:`);
      console.log(`  - Original mode: ${data.original_mode}`);
      console.log(`  - Optimal mode: ${data.optimal_mode}`);
      console.log(`  - Effective mode: ${data.mode_used}`);
      console.log(`  - Mode switched: ${data.mode_switched}`);
      console.log(`  - Expected: ${test.expectedMode}`);

      // Check if mode switching worked correctly
      if (data.mode_used === test.expectedMode) {
        console.log(`✅ Mode switching worked correctly`);
      } else {
        console.log(`❌ Mode switching failed - expected ${test.expectedMode}, got ${data.mode_used}`);
      }

      console.log(`📥 Response: "${data.response}"`);

      // Check if response is appropriate for the mode
      const responseLower = data.response.toLowerCase();

      if (test.expectedMode === 'analyst') {
        const hasStats = responseLower.includes('win rate') || responseLower.includes('performance') || responseLower.includes('83.3%');
        console.log(`  - Has appropriate stats: ${hasStats}`);
      } else if (test.expectedMode === 'renata') {
        const isConversational = responseLower.includes('how are you') || responseLower.includes('hello') || responseLower.includes('chat');
        console.log(`  - Is conversational: ${isConversational}`);
      }

    } catch (error) {
      console.error(`❌ Test failed:`, error.message);
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n🏁 Dynamic mode switching testing completed');
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:6565');
    return response.ok;
  } catch (error) {
    console.error('❌ Server not responding on http://localhost:6565');
    return false;
  }
}

async function main() {
  const isRunning = await checkServer();
  if (!isRunning) {
    console.log('Please make sure Traderra is running on http://localhost:6565');
    return;
  }

  await testDynamicModeSwitching();
}

main().catch(console.error);