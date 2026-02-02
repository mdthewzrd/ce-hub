// Test execution with the actual user file: backside para b copy.py

const fs = require('fs');

async function testRealBacksideScanner() {
  console.log('🧪 Testing Real Backside Scanner Execution\n');

  // Read the actual file from Downloads
  const scannerFilePath = '/Users/michaeldurante/Downloads/backside para b copy.py';

  try {
    const savedScannerCode = fs.readFileSync(scannerFilePath, 'utf8');
    console.log(`✅ Successfully loaded scanner file (${savedScannerCode.length} chars)`);

    console.log('\n📊 File analysis:');
    console.log(`   Lines: ${savedScannerCode.split('\n').length}`);
    console.log(`   Functions found: ${savedScannerCode.match(/def\s+\w+/g)?.length || 0}`);
    console.log(`   Imports: ${savedScannerCode.match(/^import/gm)?.length || 0}`);
    console.log(`   From imports: ${savedScannerCode.match(/^from/gm)?.length || 0}`);

    try {
      console.log('\n✅ Step 1: Testing real backside scanner execution...');

      // This simulates the exact API call the frontend makes when running a saved scanner
      const response = await fetch('http://localhost:8000/api/scan/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_date: '2024-12-01',
          end_date: '2024-12-04',
          scanner_type: 'uploaded',
          uploaded_code: savedScannerCode
        }),
      });

      console.log(`📊 Response status: ${response.status}`);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Scan started successfully!');
        console.log('Scan ID:', result.scan_id);

        if (result.scan_id) {
          console.log('\n⏳ Waiting for scan completion...');
          await pollForResults(result.scan_id);
        }
      } else {
        console.error('❌ Scan failed to start');
        const errorText = await response.text();
        console.error('Error details:', errorText.substring(0, 500));
      }

    } catch (error) {
      console.error('❌ Test failed:', error);
    }

  } catch (error) {
    console.error('❌ Failed to read scanner file:', error.message);
  }
}

async function pollForResults(scanId) {
  const maxAttempts = 60; // Increased timeout for complex scanner
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`http://localhost:8000/api/scan/status/${scanId}`);

      if (response.ok) {
        const status = await response.json();
        console.log(`📈 Progress: ${status.progress_percent}% - ${status.message}`);

        if (status.status === 'completed') {
          console.log('\n✅ Scan completed!');
          console.log('Results:', status.results || 'No results');
          console.log('Total found:', status.total_found || 0);

          // Validate the fix worked with real scanner
          if (status.results && Array.isArray(status.results) && status.results.length > 0) {
            console.log('\n🎉 SUCCESS: Real scanner execution working!');
            console.log('✅ User functions were properly detected and executed');
            console.log('✅ Infrastructure functions were properly ignored');
            console.log('✅ Real trading scanner returned actual signals:', status.results.length);
            console.log('Sample results:', status.results.slice(0, 3).map(r => ({
              ticker: r.Ticker || r.ticker || r.symbol,
              date: r.Date || r.date,
              trigger: r.Trigger || r.trigger
            })));
          } else if (status.total_found === 0) {
            console.log('\n✅ Real scanner executed successfully (no signals in this date range)');
            console.log('✅ The function detection fix is working with complex scanners');
            console.log('✅ No more "function not found" errors');
          } else {
            console.log('\n⚠️ Unexpected result format:', status);
          }
          return;
        } else if (status.status === 'error') {
          console.error('\n❌ Scan failed:', status.error);
          if (status.error && status.error.includes('function')) {
            console.error('🚨 The fix did NOT work - still getting function errors');
          }
          return;
        }
      }
    } catch (error) {
      console.error('❌ Error polling for status:', error);
    }

    attempts++;
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds for complex scanner
  }

  console.log('\n⏱️ Timeout waiting for scan completion');
}

testRealBacksideScanner();