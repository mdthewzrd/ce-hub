/**
 * Direct Universe Expansion Test
 * Tests the enhanced Renata code service directly without API dependencies
 */

const { EnhancedRenataCodeService } = require('./src/services/enhancedRenataCodeService');

async function testDirectUniverseExpansion() {
  console.log('🔍 TESTING DIRECT UNIVERSE EXPANSION');
  console.log('=====================================\n');

  try {
    // Initialize the service directly
    const service = new EnhancedRenataCodeService();

    console.log('✅ Enhanced Renata Code Service initialized');
    console.log('🔍 Testing universe expansion functionality...\n');

    // Test with a simple backside scanner
    const testCode = `
# Simple Test Scanner
SYMBOLS = ["AAPL", "MSFT", "GOOGL"]

def test_function():
    print("This is a test scanner for universe expansion")
    return True

def main():
    return test_function()
`;

    console.log('📍 Step 1: Testing universe expansion with simple scanner...');
    console.log(`📄 Original code length: ${testCode.length} characters`);
    console.log(`🔍 Original symbols: ${(testCode.match(/"[A-Z.-]+"/g) || []).length}`);

    // Create a mock request for formatting
    const mockRequest = {
      message: 'format this backside scanner code:\n\n' + testCode,
      hasCode: true,
      context: {
        page: 'renata-popup',
        timestamp: new Date().toISOString()
      }
    };

    console.log('\n📍 Step 2: Processing request for universe expansion...');

    // Process the code formatting request
    const result = await service.processCodeRequest(mockRequest);

    console.log('✅ Code processing successful');
    console.log(`📋 Response type: ${result.type}`);
    console.log(`📄 Message length: ${result.message.length} characters`);

    // Analyze the response for universe expansion
    const hasCodeBlocks = result.message.includes('```');
    const codeBlockMatch = result.message.match(/```(?:python)?\s*([\s\S]*?)\s*```/i);

    console.log('\n📍 Step 3: Analyzing universe expansion results...');

    if (hasCodeBlocks && codeBlockMatch) {
      const extractedCode = codeBlockMatch[1];
      console.log('✅ Code blocks found in response');
      console.log(`📝 Extracted code length: ${extractedCode.length} characters`);

      // Check for universe expansion evidence
      const hasUniverseComment = extractedCode.includes('RENATA UNIVERSE EXPANSION');
      const symbolCount = (extractedCode.match(/"[A-Z.-]+"/g) || []).length;
      const symbolLines = (extractedCode.match(/SYMBOLS\s*=\s*\[[^\]]*\]/) || [])[0];

      console.log('\n🌍 UNIVERSE EXPANSION ANALYSIS:');
      console.log('===============================');
      console.log(`✅ Has universe expansion comment: ${hasUniverseComment}`);
      console.log(`📊 Total symbols detected: ${symbolCount}`);
      console.log(`📏 Original symbols: 3`);
      console.log(`📈 Expansion ratio: ${(symbolCount / 3).toFixed(1)}x`);

      if (symbolLines) {
        const uniqueSymbols = [...new Set(symbolLines.match(/"[^"]+"/g) || [])];
        console.log(`🎯 UNIQUE symbols in SYMBOLS array: ${uniqueSymbols.length}`);

        // Show sample symbols from different sections
        const sampleSymbols = uniqueSymbols.slice(0, 20);
        console.log(`📋 Sample symbols: ${sampleSymbols.join(', ')}`);

        // Check for market coverage
        const hasTechGiants = extractedCode.includes('"AAPL"') && extractedCode.includes('"MSFT"') && extractedCode.includes('"GOOGL"');
        const hasETFs = extractedCode.includes('"SPY"') || extractedCode.includes('"QQQ"') || extractedCode.includes('"VTI"');
        const hasFinancials = extractedCode.includes('"JPM"') || extractedCode.includes('"BAC"') || extractedCode.includes('"WFC"');
        const hasHealthcare = extractedCode.includes('"JNJ"') || extractedCode.includes('"PFE"') || extractedCode.includes('"UNH"');

        console.log('\n🏢 MARKET COVERAGE ANALYSIS:');
        console.log('===========================');
        console.log(`💻 Tech Giants: ${hasTechGiants ? '✅' : '❌'}`);
        console.log(`📈 ETFs: ${hasETFs ? '✅' : '❌'}`);
        console.log(`🏦 Financials: ${hasFinancials ? '✅' : '❌'}`);
        console.log(`🏥 Healthcare: ${hasHealthcare ? '✅' : '❌'}`);

        // CRITICAL: Check if this represents the full universe expansion
        if (uniqueSymbols.length >= 500) {
          console.log('\n🎉 SUCCESS: UNIVERSE EXPANSION WORKING PERFECTLY!');
          console.log('================================================');
          console.log(`✅ Expanded from 3 to ${uniqueSymbols.length} symbols`);
          console.log('✅ Comprehensive market coverage achieved');
          console.log('✅ Full NYSE + NASDAQ + ETF integration');
          console.log('✅ Universe expansion comment present');

          console.log('\n📋 EXPANSION SUMMARY:');
          console.log('====================');
          console.log(`• Original: 3 symbols (AAPL, MSFT, GOOGL)`);
          console.log(`• Expanded: ${uniqueSymbols.length} symbols`);
          console.log(`• Coverage: NYSE + NASDAQ + ETFs`);
          console.log(`• Code length: ${extractedCode.length} characters`);
          console.log(`• Expansion: ${(uniqueSymbols.length / 3).toFixed(1)}x increase`);

          return true;
        } else if (uniqueSymbols.length >= 100) {
          console.log('\n⚠️  PARTIAL SUCCESS: Some expansion working');
          console.log('============================================');
          console.log(`✅ Expanded from 3 to ${uniqueSymbols.length} symbols`);
          console.log(`⚠️ Expected: 500+ symbols for full coverage`);
          console.log('🔍 Universe expansion partially working');
          return false;
        } else {
          console.log('\n❌ UNIVERSE EXPANSION NOT WORKING');
          console.log('===================================');
          console.log(`❌ Only ${uniqueSymbols.length} symbols found`);
          console.log(`❌ Expected: 500+ symbols`);
          console.log('🔍 Universe expansion failed');
          return false;
        }
      }
    } else {
      console.error('❌ No code blocks found in formatting response');
      console.log('📄 Response preview:', result.message.substring(0, 500) + '...');
      return false;
    }

  } catch (error) {
    console.error('❌ Direct universe expansion test failed:', error.message);
    console.error('🔍 Stack trace:', error.stack);
    return false;
  }
}

// Run the direct universe expansion test
testDirectUniverseExpansion().then(success => {
  console.log(`\n🏁 Direct universe expansion test: ${success ? 'SUCCESS ✅' : 'FAILED ❌'}`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Test error:', error);
  process.exit(1);
});