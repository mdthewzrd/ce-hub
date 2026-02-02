// Test backend AI directly to see what it's sending
async function testBackendDirectly() {
  console.log('🧪 Testing backend AI directly...');

  const testMessage = {
    message: 'hello',
    mode: 'renata',
    ui_context: {
      currentDateRange: {
        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
        label: 'Last 90 Days'
      },
      displayMode: 'dollar',
      page: 'dashboard',
      timestamp: new Date().toISOString()
    },
    conversation_history: [],
    context: {
      userPreferences: {
        ai_mode: 'renata',
        verbosity: "normal",
        stats_basis: null,
        unit_mode: null,
        conversation_style: 'conversational',
        avoid_auto_stats: true
      }
    }
  };

  try {
    console.log('📤 Sending to backend:', JSON.stringify(testMessage, null, 2));

    const response = await fetch('http://localhost:6500/ai/conversation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage)
    });

    if (!response.ok) {
      console.error(`❌ Backend error: ${response.status} ${response.statusText}`);
      return;
    }

    const data = await response.json();
    console.log('📥 Backend response:', JSON.stringify(data, null, 2));

    // Check what the filter would do
    function filterRenataResponse(response) {
      const responseLower = response.toLowerCase();
      const problematicPatterns = [
        /hello.*ready to work on improving your trading.*\d+\.?\d*%.*win rate/i,
        /your recent.*\d+\.?\d*%.*win rate.*shows/i,
        /ready to work on improving.*\d+\.?\d*%.*win rate/i
      ];

      for (const pattern of problematicPatterns) {
        if (pattern.test(response)) {
          return "Hello! I'm Renata, your AI assistant. I'm here to help with trading insights, strategy discussions, market analysis, or just chat about your trading journey. What would you like to explore together?";
        }
      }
      return response;
    }

    const filtered = filterRenataResponse(data.response);
    console.log('🔄 Filtered result:', filtered);

    if (filtered !== data.response) {
      console.log('⚠️  Response was filtered');
    } else {
      console.log('✅ Response passed through filter');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBackendDirectly().catch(console.error);