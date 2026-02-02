// Test emotional message filtering
async function testEmotionalMessages() {
  console.log('🧪 Testing Emotional Message Filtering...');

  const baseUrl = 'http://localhost:6565';

  const emotionalTestCases = [
    {
      message: 'i had a bad trade today',
      expectedContains: ['sorry', 'hear', 'trading', 'challenging'],
      shouldNotContain: ['win rate', '83.3%', 'expectancy', 'performance'],
      description: 'Should be empathetic, not statistical'
    },
    {
      message: 'i\'m so frustrated with my trading',
      expectedContains: ['frustration', 'ups', 'downs', 'challenging'],
      shouldNotContain: ['win rate', '83.3%', 'expectancy'],
      description: 'Should acknowledge frustration, not give stats'
    },
    {
      message: 'i\'m so happy with my recent trades',
      expectedContains: ['great', 'positive', 'working well'],
      shouldNotContain: ['win rate', 'performance stats'],
      description: 'Should celebrate success, not just give stats'
    },
    {
      message: 'how are you today?',
      expectedContains: ['doing', 'chat', 'conversation'],
      shouldNotContain: ['win rate', 'trading performance'],
      description: 'Should be conversational'
    }
  ];

  for (let i = 0; i < emotionalTestCases.length; i++) {
    const test = emotionalTestCases[i];
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
          mode: 'renata',
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
      const responseLower = data.response.toLowerCase();

      console.log(`📥 Response: "${data.response}"`);

      // Check if response contains expected keywords
      const hasExpectedContent = test.expectedContents?.some(keyword => responseLower.includes(keyword)) ?? true;
      const hasForbiddenContent = test.shouldNotContain.some(keyword => responseLower.includes(keyword));

      if (hasExpectedContent && !hasForbiddenContent) {
        console.log(`✅ Response is appropriate for emotional message`);
      } else {
        if (hasForbiddenContent) {
          console.log(`❌ Response contains forbidden content: ${test.shouldNotContain.filter(k => responseLower.includes(k)).join(', ')}`);
        } else {
          console.log(`⚠️  Response might not be optimal, but doesn't contain forbidden content`);
        }
      }

      // Check if mode was correctly identified as renata
      if (data.mode_used === 'renata') {
        console.log(`✅ Mode correctly stayed as renata`);
      } else {
        console.log(`⚠️  Mode switched to ${data.mode_used} (might be appropriate)`);
      }

    } catch (error) {
      console.error(`❌ Test failed:`, error.message);
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n🏁 Emotional message filtering testing completed');
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

  await testEmotionalMessages();
}

main().catch(console.error);