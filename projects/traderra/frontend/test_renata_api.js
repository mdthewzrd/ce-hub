// Direct API test for Renata without browser automation
async function testRenataAPI() {
  console.log('🧪 Testing Renata API directly...');

  const baseUrl = 'http://localhost:6565';

  const testCases = [
    {
      mode: 'renata',
      message: 'hello',
      expected: 'Should be conversational, not stats-focused'
    },
    {
      mode: 'renata',
      message: 'hey there',
      expected: 'Should be conversational, not stats-focused'
    },
    {
      mode: 'renata',
      message: 'how are you doing?',
      expected: 'Should be conversational, not stats-focused'
    },
    {
      mode: 'renata',
      message: 'can you help me with trading strategies?',
      expected: 'Should respond to strategy question, not force stats'
    },
    {
      mode: 'renata',
      message: 'i had a bad trade today',
      expected: 'Should be empathetic, not immediately bring up win rate'
    },
    {
      mode: 'coach',
      message: 'hello',
      expected: 'This might show stats, which is expected for coach mode'
    },
    {
      mode: 'renata',
      message: 'show me my performance',
      expected: 'Should actually respond with stats since explicitly asked'
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const test = testCases[i];
    console.log(`\n📤 Test ${i + 1}: Mode=${test.mode}, Message="${test.message}"`);
    console.log(`📝 Expected: ${test.expected}`);

    try {
      const response = await fetch(`${baseUrl}/api/renata/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: test.message,
          mode: test.mode,
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
      console.log(`📥 Response (${response.status}):`, data.response);

      // Analyze response
      const responseLower = data.response.toLowerCase();

      // Check for stats keywords
      const statsKeywords = ['win rate', 'winrate', 'percentage', '%', '83.3%', 'performance', 'stats'];
      const hasStatsKeywords = statsKeywords.some(keyword => responseLower.includes(keyword));

      // Check for generic filtered response
      const isGenericResponse = data.response.includes("I'm Renata, your AI assistant") &&
                              data.response.includes("What would you like to explore together?");

      // Check for problematic pattern
      const hasProblematicPattern = responseLower.includes('ready to work on improving') &&
                                   responseLower.includes('win rate');

      console.log(`🔍 Analysis:`);
      console.log(`  - Has stats keywords: ${hasStatsKeywords}`);
      console.log(`  - Is generic filtered: ${isGenericResponse}`);
      console.log(`  - Has problematic pattern: ${hasProblematicPattern}`);

      if (test.mode === 'renata') {
        if (test.message.includes('performance') || test.message.includes('show me')) {
          // These should actually get stats
          if (!hasStatsKeywords) {
            console.log(`⚠️  Expected stats for "${test.message}" but didn't get them`);
          } else {
            console.log(`✅ Correctly provided stats when explicitly asked`);
          }
        } else {
          // These should NOT get forced stats
          if (hasProblematicPattern) {
            console.log(`❌ PROBLEM: Still showing forced stats pattern`);
          } else if (isGenericResponse && test.message.length < 10) {
            console.log(`⚠️  Generic response for simple message - might be over-filtering`);
          } else if (hasStatsKeywords && responseLower.length < 100) {
            console.log(`⚠️  Stats in short response - possibly unwanted`);
          } else {
            console.log(`✅ Good response - not forcing stats`);
          }
        }
      }

    } catch (error) {
      console.error(`❌ API call failed:`, error.message);
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n🏁 API testing completed');
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

  await testRenataAPI();
}

main().catch(console.error);