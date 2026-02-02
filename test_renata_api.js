const testRenataAPI = async () => {
  try {
    console.log('🧪 Testing Renata API with multi-command request...');

    const response = await fetch('http://localhost:6565/api/renata/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: "Switch to R-multiple mode and show last 90 days",
        mode: "coach",
        context: {
          currentDateRange: "last_30_days",
          displayMode: "dollar",
          page: "dashboard"
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ API Response received:');
    console.log('📝 Message:', data.response || data.message);
    console.log('🎯 Navigation Commands:', data.navigationCommands);
    console.log('🔢 Commands count:', data.navigationCommands?.length || 0);

    return data;
  } catch (error) {
    console.error('❌ API Test failed:', error);
    return null;
  }
};

testRenataAPI();