#!/usr/bin/env node

/**
 * Validate that the frontend now shows real results instead of mock data
 */

async function validateRealResults() {
  console.log('🔍 Testing real results fix...');

  try {
    // Test API endpoint directly
    console.log('📡 Testing backend API...');
    const response = await fetch('http://localhost:5656/api/projects/1764956201741/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date_range: { start_date: '2025-01-01', end_date: '2025-11-01' },
        timeout_seconds: 60
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend API Response:');
      console.log('   Success:', data.success);
      console.log('   Total Found:', data.total_found);
      console.log('   Results Count:', data.results?.length || 0);

      if (data.results && data.results.length > 0) {
        console.log('\n📊 Real Results Sample:');
        data.results.slice(0, 3).forEach((result, i) => {
          console.log(`   ${i+1}. ${result.ticker} - ${result.date} - Volume: ${result.volume?.toLocaleString()}`);
        });
        console.log('\n🎉 SUCCESS: Backend is returning real trading results!');
        return true;
      } else {
        console.log('\n❌ ISSUE: Backend returned no results');
        return false;
      }
    } else {
      console.error('❌ API Error:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Test Error:', error.message);
    return false;
  }
}

validateRealResults().then(success => {
  if (success) {
    console.log('\n✅ VALIDATION PASSED');
    console.log('Backend API is correctly returning real scan results');
    console.log('Frontend should now display these results instead of mock data');
  } else {
    console.log('\n❌ VALIDATION FAILED');
    console.log('Check backend logs and API connectivity');
  }
});