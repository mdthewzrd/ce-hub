/**
 * Test Production Universe Integration
 * Tests the complete 1 symbol universe expansion
 */

const { EnhancedRenataCodeService } = require('./src/services/enhancedRenataCodeService');

async function testProductionUniverse() {
  console.log('🌍 TESTING PRODUCTION UNIVERSE INTEGRATION');
  console.log('========================================\n');

  try {
    // Initialize the service
    const service = new EnhancedRenataCodeService();
    console.log('✅ Enhanced Renata Code Service initialized');

    // Test with a simple 3-symbol backside scanner
    const testCode = `# Simple Test Scanner
SYMBOLS = ["AAPL", "MSFT", "GOOGL"]

def test_function():
    print("This is a test scanner for production universe expansion")
    return True

def main():
    return test_function()
`;

    console.log('📍 Testing universe expansion with production scanner...');
    console.log(`📄 Original code length: ${testCode.length} characters`);
    console.log(`🔍 Original symbols: 3`);

    // Create a mock request
    const mockRequest = {
      message: 'format this backside scanner code:\n\n' + testCode,
      hasCode: true,
      context: {
        page: 'renata-popup',
        timestamp: new Date().toISOString()
      }
    };

    // Process the code formatting request
    const result = await service.processCodeRequest(mockRequest);

    console.log('✅ Code processing successful');
    console.log(`📋 Response type: ${result.type}`);
    console.log(`📄 Message length: ${result.message.length} characters`);

    // Analyze the response for universe expansion
    const codeBlockMatch = result.message.match(/```(?:python)?\s*([\s\S]*?)\s*```/i);

    if (codeBlockMatch) {
      const extractedCode = codeBlockMatch[1];
      const symbolCount = (extractedCode.match(/"[A-Z.-]+"/g) || []).length;

      console.log('\n🌍 PRODUCTION UNIVERSE EXPANSION RESULTS:');
      console.log('===========================================');
      console.log(`✅ Total symbols detected: ${symbolCount}`);
      console.log(`📏 Original symbols: 3`);
      console.log(`📈 Expansion ratio: ${(symbolCount / 3).toFixed(1)}x`);

      // Check for expected symbols
      const hasTechGiants = extractedCode.includes('"AAPL"') && extractedCode.includes('"MSFT"') && extractedCode.includes('"GOOGL"');
      const hasMajorETFs = extractedCode.includes('"SPY"') || extractedCode.includes('"QQQ"') || extractedCode.includes('"VTI"');
      const hasComprehensiveCoverage = symbolCount >= 10000;

      console.log('\n🏢 MARKET COVERAGE ANALYSIS:');
      console.log('===========================');
      console.log(`💻 Tech Giants: ${hasTechGiants ? '✅' : '❌'}`);
      console.log(`📈 Major ETFs: ${hasMajorETFs ? '✅' : '❌'}`);
      console.log(`🌍 Comprehensive Coverage (10k+ symbols): ${hasComprehensiveCoverage ? '✅' : '❌'}`);

      // Check for universe expansion comment
      const hasUniverseComment = extractedCode.includes('PRODUCTION MARKET UNIVERSE');
      console.log(`📝 Universe Expansion Comment: ${hasUniverseComment ? '✅' : '❌'}`);

      // Final evaluation
      const success = symbolCount >= 10000 && hasTechGiants && hasUniverseComment;

      if (success) {
        console.log('\n🎉 SUCCESS: PRODUCTION UNIVERSE EXPANSION WORKING PERFECTLY!');
        console.log('=======================================================');
        console.log(`✅ Expanded from 3 to ${symbolCount} symbols`);
        console.log('✅ Production market coverage achieved');
        console.log('✅ Complete NYSE + NASDAQ + AMEX integration');
        console.log('✅ Universe expansion comment present');
        console.log('✅ Ready for production scanning');

        console.log('\n📋 EXPANSION SUMMARY:');
        console.log('====================');
        console.log(`• Original: 3 symbols (AAPL, MSFT, GOOGL)`);
        console.log(`• Expanded: ${symbolCount} symbols`);
        console.log(`• Coverage: Complete US equity market`);
        console.log(`• Expansion: ${(symbolCount / 3).toFixed(1)}x increase`);
        console.log(`• Status: PRODUCTION READY`);

        return true;
      } else {
        console.log('\n❌ PRODUCTION UNIVERSE EXPANSION FAILED');
        console.log('=======================================');
        console.log(`❌ Only ${symbolCount} symbols (expected 10,000+)`);
        console.log(`❌ Tech Giants: ${hasTechGiants ? 'Found' : 'Missing'}`);
        console.log(`❌ Universe Comment: ${hasUniverseComment ? 'Found' : 'Missing'}`);
        console.log(`❌ Status: NOT PRODUCTION READY`);
        return false;
      }
    } else {
      console.error('❌ No code blocks found in formatting response');
      console.log('📄 Response preview:', result.message.substring(0, 500) + '...');
      return false;
    }

  } catch (error) {
    console.error('❌ Production universe test failed:', error.message);
    console.error('🔍 Stack trace:', error.stack);
    return false;
  }
}

// Run the production universe test
testProductionUniverse().then(success => {
  console.log(`\n🏁 Production universe test: ${success ? 'SUCCESS ✅' : 'FAILED ❌'}`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Test error:', error);
  process.exit(1);
});
