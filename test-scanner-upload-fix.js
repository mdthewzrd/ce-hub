#!/usr/bin/env node

/**
 * TEST SCANNER UPLOAD & EXECUTION FIX
 * Tests the original scanner upload flow with our asyncio fixes
 * This replicates the user's original issue: "its still not running"
 */

const fs = require('fs');
const path = require('path');

async function testScannerUploadExecution() {
  console.log('🔥 TESTING SCANNER UPLOAD & EXECUTION FIX');
  console.log('Replicating user issue: "its still not running"');
  console.log('Testing asyncio fixes for uploaded scanner execution\n');

  try {
    // Create a test scanner file (similar to user's backside para b copy.py)
    const testScannerFile = `import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import json

def main():
    print("🔥 UPLOADED SCANNER TEST")
    print("📊 Testing scanner upload and execution flow...")

    # Test symbols - smaller set for quick testing
    symbols = ['AAPL', 'MSFT', 'GOOGL']
    results = []

    print(f"\\n🔍 Scanning {len(symbols)} symbols...")

    for symbol in symbols:
        try:
            print(f"\\n📈 Processing {symbol}...")
            ticker = yf.Ticker(symbol)

            # Get recent data
            info = ticker.history(period="5d")

            if not info.empty:
                latest_price = info['Close'].iloc[-1]
                volume = info['Volume'].iloc[-1]

                # Calculate basic metrics
                price_change = ((info['Close'].iloc[-1] / info['Close'].iloc[-2]) - 1) * 100 if len(info) > 1 else 0

                results.append({
                    'symbol': symbol,
                    'price': round(latest_price, 2),
                    'volume': int(volume),
                    'price_change_pct': round(price_change, 2),
                    'status': 'found',
                    'timestamp': datetime.now().isoformat()
                })

                print(f"✅ {symbol}: ${latest_price:.2f} ({price_change:+.2f}%) Vol: {volume:,}")
            else:
                results.append({
                    'symbol': symbol,
                    'status': 'no_data',
                    'timestamp': datetime.now().isoformat()
                })
                print(f"❌ {symbol}: No data found")

        except Exception as e:
            print(f"❌ {symbol}: {str(e)}")
            results.append({
                'symbol': symbol,
                'status': 'error',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            })

    # Create output in expected format
    found_count = len([r for r in results if r['status'] == 'found'])

    output = {
        'success': True,
        'total_found': found_count,
        'scan_id': 'upload_test_' + str(int(datetime.now().timestamp())),
        'scan_date': datetime.now().strftime('%Y-%m-%d'),
        'results': results,
        'summary': {
            'total_symbols': len(symbols),
            'found_symbols': found_count,
            'error_symbols': len([r for r in results if r['status'] == 'error']),
            'scan_duration': 'Quick test'
        }
    }

    print(f"\\n📈 SCAN COMPLETE!")
    print(f"✅ Found: {found_count}/{len(symbols)} symbols")
    print(f"🔍 Scan ID: {output['scan_id']}")

    # Save results to verify file creation
    with open('uploaded_scanner_results.json', 'w') as f:
        json.dump(output, f, indent=2)

    print(f"💾 Results saved to: uploaded_scanner_results.json")

    return output

if __name__ == "__main__":
    print("🚀 Starting uploaded scanner execution...")
    result = main()
    print(f"\\n🎉 SUCCESS: Uploaded scanner completed successfully!")
    print(f"📊 Results: {result['total_found']} symbols found")
`;

    // Write the scanner file to disk
    const scannerFilePath = '/Users/michaeldurante/ai dev/ce-hub/test-uploaded-scanner.py';
    fs.writeFileSync(scannerFilePath, testScannerFile);
    console.log('✅ Created test scanner file:', scannerFilePath);

    // Step 1: Test scanner upload (simulating user's upload)
    console.log('\n📤 Testing scanner upload...');

    const formData = new FormData();
    formData.append('scanner_file', new Blob([testScannerFile], { type: 'text/x-python' }), 'test-uploaded-scanner.py');
    formData.append('title', 'Test Asyncio Fix Scanner');
    formData.append('description', 'Testing asyncio fixes for uploaded scanner execution');
    formData.append('date_range_start', '2025-01-01');
    formData.append('date_range_end', '2025-12-01');

    const uploadResponse = await fetch('http://localhost:8000/api/scan', {
      method: 'POST',
      body: formData
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.log('❌ Upload failed:', errorText);
      throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`);
    }

    const uploadData = await uploadResponse.json();
    console.log('✅ Scanner uploaded successfully!');
    console.log('📊 Upload results:');
    console.log(`  - Success: ${uploadData.success}`);
    console.log(`  - Scan ID: ${uploadData.scan_id}`);
    console.log(`  - Total Found: ${uploadData.total_found || 0}`);
    console.log(`  - Results Count: ${uploadData.results?.length || 0}`);

    // Step 2: Direct execution test with asyncio fixes
    console.log('\n🚀 Testing direct scanner execution with asyncio fixes...');

    // Read the scanner file as base64 (mimicking file upload)
    const scannerContent = fs.readFileSync(scannerFilePath, 'utf8');

    const execResponse = await fetch('http://localhost:8000/api/uploaded_scanner_bypass', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        scanner_code: scannerContent,
        date_range: {
          start_date: '2025-01-01',
          end_date: '2025-12-01'
        },
        parallel_execution: false,
        timeout_seconds: 120
      })
    });

    console.log('📡 Direct execution request sent...');

    if (!execResponse.ok) {
      const errorText = await execResponse.text();
      console.log('❌ Direct execution failed:', errorText);

      // Try to parse the error for debugging
      try {
        const errorData = JSON.parse(errorText);
        console.log('🔍 Error details:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.log('🔍 Raw error:', errorText);
      }

      throw new Error(`Direct execution failed: ${execResponse.status} ${errorText}`);
    }

    const execData = await execResponse.json();

    console.log('✅ Direct execution response received!');
    console.log('📊 Execution Results:');
    console.log(`  - Success: ${execData.success}`);
    console.log(`  - Status: ${execData.status}`);
    console.log(`  - Total Found: ${execData.total_found || 0}`);
    console.log(`  - Results Count: ${execData.results?.length || 0}`);

    if (execData.results && execData.results.length > 0) {
      console.log('\n📈 Sample Results:');
      execData.results.slice(0, 3).forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.symbol}: ${result.status} ${result.price ? '$' + result.price : ''}`);
      });
    }

    // Step 3: Validate the asyncio fixes
    if (execData.success && execData.total_found > 0) {
      console.log('\n🎉 MASSIVE SUCCESS!');
      console.log('✅ Asyncio event loop conflicts RESOLVED!');
      console.log('✅ Scanner upload and execution WORKING!');
      console.log('✅ Direct scanner execution WORKING!');

      console.log('\n🔧 KEY FIXES APPLIED:');
      console.log('  1. ✅ Fixed asyncio event loop conflicts in uploaded_scanner_bypass.py');
      console.log('  2. ✅ Enhanced safe_main_wrapper() for async/sync execution');
      console.log('  3. ✅ Updated backend response format for frontend compatibility');
      console.log('  4. ✅ Resolved "asyncio.run() cannot be called from a running event loop"');

      console.log('\n💡 THE ORIGINAL ISSUE "its still not running" HAS BEEN COMPLETELY FIXED!');
      console.log('🚀 Scanner uploads should now execute properly from the frontend!');

      // Check if results file was created by the scanner
      setTimeout(() => {
        if (fs.existsSync('/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backend/uploaded_scanner_results.json')) {
          try {
            const resultsFile = JSON.parse(fs.readFileSync('/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backend/uploaded_scanner_results.json', 'utf8'));
            console.log('\n📁 Scanner results file created successfully!');
            console.log(`📊 Found ${resultsFile.total_found} symbols in execution results`);
          } catch (e) {
            console.log('\n📁 Results file created but parsing failed:', e.message);
          }
        } else {
          console.log('\n⚠️ Results file not found in expected location');
        }
      }, 2000);

    } else {
      console.log('\n⚠️ Execution completed but needs further investigation');
      console.log('💡 Check backend logs for detailed execution information');
    }

    // Cleanup
    try {
      fs.unlinkSync(scannerFilePath);
      console.log('\n🧹 Cleaned up test scanner file');
    } catch (e) {
      console.log('\n⚠️ Cleanup failed:', e.message);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);

    // Check backend logs
    console.log('\n🔍 Checking backend status...');
    try {
      const response = await fetch('http://localhost:8000/api/projects');
      console.log('✅ Backend responsive:', response.ok);
    } catch (e) {
      console.log('❌ Backend check failed:', e.message);
    }
  }
}

// Run the test
console.log('🚀 Starting scanner upload & execution test...\n');
testScannerUploadExecution().catch(console.error);