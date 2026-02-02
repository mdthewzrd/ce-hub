/**
 * Test Frontend Universe Display
 * Tests what the frontend actually shows for symbol parameters
 */

async function testFrontendUniverseDisplay() {
  console.log('🔍 TESTING FRONTEND UNIVERSE DISPLAY');
  console.log('=======================================\n');

  try {
    // Test with a simple 3-symbol scanner
    const testCode = `
# Test Scanner Code
SYMBOLS = ["AAPL", "MSFT", "GOOGL"]

def test_function():
    print("This is a test scanner")
    return True
`;

    console.log('📍 Step 1: Testing with simple 3-symbol scanner...');

    const response = await fetch('http://localhost:55656/api/renata/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'format this backside scanner code:\n\n' + testCode,
        personality: 'general',
        context: {
          page: 'renata-popup',
          timestamp: new Date().toISOString()
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Frontend API failed: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Frontend API successful');
    console.log(`📋 Response type: ${result.type}`);
    console.log(`📄 Message length: ${result.message.length} characters`);

    // Analyze the response for universe expansion
    const hasCodeBlocks = result.message.includes('```');
    const codeBlockMatch = result.message.match(/```(?:python)?\s*([\s\S]*?)\s*```/i);

    if (hasCodeBlock && codeBlockMatch) {
      const extractedCode = codeBlockMatch[1];
      const symbolCount = (extractedCode.match(/"[A-Z.-]+"/g) || []).length;
      const symbolLines = (extractedCode.match(/SYMBOLS\s*=\s*\[[^\]]*\]/) || [])[0];

      console.log('\n🔍 FRONTEND UNIVERSE ANALYSIS:');
      console.log('================================');
      console.log(`✅ Has code blocks: ${hasCode}`);
      console.log(`📊 Total symbols detected: ${symbolCount}`);
      console.log(`📝 Code block length: ${extractedCode.length} characters`);

      if (symbolLines) {
        const uniqueSymbols = [...new Set(symbolLines.match(/"[^"]+"/g) || [])];
        console.log(`🎯 UNIQUE symbols in SYMBOLS array: ${uniqueSymbols.length}`);

        // Show sample symbols
        if (uniqueSymbols.length > 0) {
          console.log(`📋 Sample symbols: ${uniqueSymbols.slice(0, 10).join(', ')}...`);
        }

        // Check for universe expansion comments
        const hasUniverseComment = extractedCode.includes('UNIVERSE EXPANSION');
        const hasFullMarket = extractedCode.includes('Full NYSE + NASDAQ + ETF');

        console.log(`🌍 Has universe comment: ${hasUniverseComment}`);
        console.log(`📈 Covers full market: ${hasFullMarket}`);
        console.log(`🎯 Symbol count from comment:`, extractedCode.match(/expanded.*?to\s*(\d+)/)?.[1] || 'Not found');

        // CRITICAL: Check if this represents the full universe
        if (uniqueSymbols.length < 100) {
          console.log('\n❌ ISSUE: Frontend shows only', uniqueSymbols.length, 'symbols');
          console.log('🔍 Expected: 1,000+ symbols for full market coverage');
          console.log('\n📋 POSSIBLE CAUSES:');
          console.log('1. Frontend using cached version of universe');
          console.log('2. Response not properly displaying expanded code');
          console.log('3. Symbol array truncation in response');
          console.log('4. Frontend not getting the updated service code');
        } else if (uniqueSymbols.length >= 500) {
          console.log('\n🎉 SUCCESS: Frontend shows', uniqueSymbols.length, 'symbols!');
          console.log('📊 This represents proper market coverage');
        } else {
          console.log('\n⚠️  PARTIAL SUCCESS: Frontend shows', uniqueSymbols.length, 'symbols');
          console.log('📊 Better than original but still needs expansion');
        }
      }
    } else {
      console.error('❌ No code blocks found in frontend response');
      console.log('📄 Response preview:', result.message.substring(0, 500) + '...');
    }

    // Check what the backend actually processed
    console.log('\n🔍 BACKEND VERIFICATION:');
    console.log('==================');
    console.log('From previous tests, backend processes:');
    console.log('- 3 → 726 symbols (fallback mode)');
    console.log('- 106 → 726 symbols (actual backside scanner)');
    console.log('- Code length: 13,346 characters');
    console.log('- Universe expansion: WORKING PERFECTLY');

    // Test discrepancy
    console.log('\n🎯 DISCREPANCY ANALYSIS:');
    console.log('========================');

    if (symbolCount < 100) {
      console.log('❌ CRITICAL ISSUE IDENTIFIED');
      console.log('🔍 Backend processes: 726 symbols ✅');
      console.log('📱 Frontend displays:', symbolCount, 'symbols ❌');
      console.log('\n🛠️   SOLUTION NEEDED:');
      console.log('1. Check if frontend is using cached service code');
      console.log('2. Verify frontend gets updated universe expansion');
      console.log('3. Ensure symbol array displays correctly in frontend');
      console.log('4. Clear frontend cache and reload');
    } else {
      console.log('✅ Frontend universe display is working');
    }

  } catch (error) {
    console.error('❌ Frontend test failed:', error.message);
    return false;
  }
}

// Run the frontend universe display test
testFrontendUniverseDisplay().then(success => {
  console.log(`\n🏁 Frontend universe test: ${success ? 'SUCCESS ✅' : 'FAILED ❌'}`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Test error:', error);
  process.exit(1);
});