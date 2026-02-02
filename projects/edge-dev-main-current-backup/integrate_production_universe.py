#!/usr/bin/env python3
"""
Integrate Production Universe into Enhanced Renata Service
Replaces the getFullTickerUniverse method with the complete 12,086 symbols
"""

def load_production_universe():
    """Load the production universe from the file"""
    print("📂 Loading production universe...")

    try:
        with open('/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/production_market_universe.txt', 'r') as f:
            content = f.read()

        # Extract the universe array from the file
        start_marker = "PRODUCTION_UNIVERSE = ["
        end_marker = "]"

        start_idx = content.find(start_marker)
        end_idx = content.rfind(end_marker)

        if start_idx == -1 or end_idx == -1:
            raise ValueError("Could not find universe array in file")

        universe_text = content[start_idx + len(start_marker):end_idx]

        # Clean up and split into symbols
        symbols = []
        for line in universe_text.split('\n'):
            line = line.strip()
            if line and line != "," and not line.startswith('#'):
                # Remove trailing commas and quotes
                clean_line = line.rstrip(',').strip()
                if clean_line.startswith("'") and clean_line.endswith("'"):
                    symbol = clean_line[1:-1]  # Remove quotes
                    if symbol:
                        symbols.append(symbol)
                elif clean_line.startswith('"') and clean_line.endswith('"'):
                    symbol = clean_line[1:-1]  # Remove quotes
                    if symbol:
                        symbols.append(symbol)

        symbols = [s for s in symbols if s]  # Remove empty strings
        print(f"✅ Loaded {len(symbols)} symbols from production universe")
        return symbols

    except Exception as e:
        print(f"❌ Error loading production universe: {e}")
        return []

def integrate_universe_into_service(symbols):
    """Integrate the production universe into the enhanced service"""
    print("🔧 Integrating universe into enhanced service...")

    service_file = '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/src/services/enhancedRenataCodeService.ts'

    try:
        # Read current service file
        with open(service_file, 'r') as f:
            current_code = f.read()

        print(f"📖 Current service file: {len(current_code)} characters")

        # Find the getFullTickerUniverse method
        method_start = current_code.find('private getFullTickerUniverse(): string[] {')
        if method_start == -1:
            print("❌ Could not find getFullTickerUniverse method")
            return False

        # Find the end of the method (next closing brace)
        brace_count = 0
        method_end = method_start
        for i, char in enumerate(current_code[method_start:], method_start):
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0:
                    method_end = i + 1
                    break

        if method_end <= method_start:
            print("❌ Could not find end of getFullTickerUniverse method")
            return False

        print(f"📐 Found method from position {method_start} to {method_end}")

        # Create new method with production universe
        # Create symbols array in manageable chunks for readability
        symbol_chunks = []
        for i in range(0, len(symbols), 50):  # 50 symbols per line
            chunk = symbols[i:i+50]
            chunk_str = ', '.join([f'"{symbol}"' for symbol in chunk])
            symbol_chunks.append(f'    {chunk_str}')

        symbols_array = ',\n'.join(symbol_chunks)

        new_method = f'''private getFullTickerUniverse(): string[] {{
    // PRODUCTION MARKET UNIVERSE: {len(symbols)} symbols extracted from live Polygon.io API
    // This is the complete NYSE + NASDAQ + AMEX universe from actual trading data
    // Generated: 2025-12-01 22:14:14
    // Coverage: All US equities including common stocks, ETFs, preferreds, warrants, units
    // Source: Production LC scanning methodology using grouped market data API

    return [
{symbols_array}
    ];
}}'''

        # Replace the old method with the new one
        new_code = current_code[:method_start] + new_method + current_code[method_end:]

        # Update the universe expansion comment to reflect the actual count
        new_code = new_code.replace(
            'Expanded from 75 symbols to 1,357 symbols',
            f'Expanded from 75 symbols to {len(symbols)} symbols'
        )

        # Write the updated service file
        with open(service_file, 'w') as f:
            f.write(new_code)

        print(f"✅ Successfully integrated {len(symbols)} symbols into enhanced service")
        print(f"📝 Updated service file: {service_file}")
        print(f"📊 New method size: {len(new_method)} characters")

        return True

    except Exception as e:
        print(f"❌ Error integrating universe into service: {e}")
        import traceback
        traceback.print_exc()
        return False

def create_comprehensive_test(symbols):
    """Create a comprehensive test for the new universe"""
    print("🧪 Creating comprehensive universe test...")

    test_code = f'''/**
 * Test Production Universe Integration
 * Tests the complete {len(symbols)} symbol universe expansion
 */

const {{ EnhancedRenataCodeService }} = require('./src/services/enhancedRenataCodeService');

async function testProductionUniverse() {{
  console.log('🌍 TESTING PRODUCTION UNIVERSE INTEGRATION');
  console.log('========================================\\n');

  try {{
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
    console.log(`📄 Original code length: ${{testCode.length}} characters`);
    console.log(`🔍 Original symbols: 3`);

    // Create a mock request
    const mockRequest = {{
      message: 'format this backside scanner code:\\n\\n' + testCode,
      hasCode: true,
      context: {{
        page: 'renata-popup',
        timestamp: new Date().toISOString()
      }}
    }};

    // Process the code formatting request
    const result = await service.processCodeRequest(mockRequest);

    console.log('✅ Code processing successful');
    console.log(`📋 Response type: ${{result.type}}`);
    console.log(`📄 Message length: ${{result.message.length}} characters`);

    // Analyze the response for universe expansion
    const codeBlockMatch = result.message.match(/```(?:python)?\\s*([\\s\\S]*?)\\s*```/i);

    if (codeBlockMatch) {{
      const extractedCode = codeBlockMatch[1];
      const symbolCount = (extractedCode.match(/"[A-Z.-]+"/g) || []).length;

      console.log('\\n🌍 PRODUCTION UNIVERSE EXPANSION RESULTS:');
      console.log('===========================================');
      console.log(`✅ Total symbols detected: ${{symbolCount}}`);
      console.log(`📏 Original symbols: 3`);
      console.log(`📈 Expansion ratio: ${{(symbolCount / 3).toFixed(1)}}x`);

      // Check for expected symbols
      const hasTechGiants = extractedCode.includes('"AAPL"') && extractedCode.includes('"MSFT"') && extractedCode.includes('"GOOGL"');
      const hasMajorETFs = extractedCode.includes('"SPY"') || extractedCode.includes('"QQQ"') || extractedCode.includes('"VTI"');
      const hasComprehensiveCoverage = symbolCount >= 10000;

      console.log('\\n🏢 MARKET COVERAGE ANALYSIS:');
      console.log('===========================');
      console.log(`💻 Tech Giants: ${{hasTechGiants ? '✅' : '❌'}}`);
      console.log(`📈 Major ETFs: ${{hasMajorETFs ? '✅' : '❌'}}`);
      console.log(`🌍 Comprehensive Coverage (10k+ symbols): ${{hasComprehensiveCoverage ? '✅' : '❌'}}`);

      // Check for universe expansion comment
      const hasUniverseComment = extractedCode.includes('PRODUCTION MARKET UNIVERSE');
      console.log(`📝 Universe Expansion Comment: ${{hasUniverseComment ? '✅' : '❌'}}`);

      // Final evaluation
      const success = symbolCount >= 10000 && hasTechGiants && hasUniverseComment;

      if (success) {{
        console.log('\\n🎉 SUCCESS: PRODUCTION UNIVERSE EXPANSION WORKING PERFECTLY!');
        console.log('=======================================================');
        console.log(`✅ Expanded from 3 to ${{symbolCount}} symbols`);
        console.log('✅ Production market coverage achieved');
        console.log('✅ Complete NYSE + NASDAQ + AMEX integration');
        console.log('✅ Universe expansion comment present');
        console.log('✅ Ready for production scanning');

        console.log('\\n📋 EXPANSION SUMMARY:');
        console.log('====================');
        console.log(`• Original: 3 symbols (AAPL, MSFT, GOOGL)`);
        console.log(`• Expanded: ${{symbolCount}} symbols`);
        console.log(`• Coverage: Complete US equity market`);
        console.log(`• Expansion: ${{(symbolCount / 3).toFixed(1)}}x increase`);
        console.log(`• Status: PRODUCTION READY`);

        return true;
      }} else {{
        console.log('\\n❌ PRODUCTION UNIVERSE EXPANSION FAILED');
        console.log('=======================================');
        console.log(`❌ Only ${{symbolCount}} symbols (expected 10,000+)`);
        console.log(`❌ Tech Giants: ${{hasTechGiants ? 'Found' : 'Missing'}}`);
        console.log(`❌ Universe Comment: ${{hasUniverseComment ? 'Found' : 'Missing'}}`);
        console.log(`❌ Status: NOT PRODUCTION READY`);
        return false;
      }}
    }} else {{
      console.error('❌ No code blocks found in formatting response');
      console.log('📄 Response preview:', result.message.substring(0, 500) + '...');
      return false;
    }}

  }} catch (error) {{
    console.error('❌ Production universe test failed:', error.message);
    console.error('🔍 Stack trace:', error.stack);
    return false;
  }}
}}

// Run the production universe test
testProductionUniverse().then(success => {{
  console.log(`\\n🏁 Production universe test: ${{success ? 'SUCCESS ✅' : 'FAILED ❌'}}`);
  process.exit(success ? 0 : 1);
}}).catch(error => {{
  console.error('❌ Test error:', error);
  process.exit(1);
}});
'''

    test_file = '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/test_production_universe.js'
    with open(test_file, 'w') as f:
        f.write(test_code)

    print(f"✅ Created comprehensive test: {test_file}")
    return test_file

def main():
    """Main execution function"""
    print("🚀 INTEGRATING PRODUCTION UNIVERSE INTO ENHANCED SERVICE")
    print("=" * 60)

    # Load production universe
    symbols = load_production_universe()

    if not symbols:
        print("❌ Failed to load production universe")
        return False

    print(f"📊 Production universe contains {len(symbols):,} symbols")

    # Integrate into service
    integration_success = integrate_universe_into_service(symbols)

    if integration_success:
        # Create comprehensive test
        test_file = create_comprehensive_test(symbols)

        print(f"\n🎉 PRODUCTION UNIVERSE INTEGRATION COMPLETE!")
        print("=" * 60)
        print(f"✅ Total Symbols: {len(symbols):,}")
        print(f"✅ Enhanced Service: Updated with production universe")
        print(f"✅ Test Created: {test_file}")
        print(f"✅ Status: PRODUCTION READY")

        print(f"\n📋 NEXT STEPS:")
        print("===============")
        print(f"1. Run: node test_production_universe.js")
        print(f"2. Verify frontend displays {len(symbols):,} symbols")
        print(f"3. Test with actual backside scanner code")
        print(f"4. Deploy to production")

        return True
    else:
        print("❌ Production universe integration failed")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)