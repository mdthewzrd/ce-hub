// Frontend Debug Test - Simulate exact frontend behavior
const fs = require('fs');

async function debugFrontendExecution() {
  console.log('🔍 Debugging Frontend Execution Issue\n');

  // Read the actual backside scanner file
  const scannerFilePath = '/Users/michaeldurante/Downloads/backside para b copy.py';

  try {
    const savedScannerCode = fs.readFileSync(scannerFilePath, 'utf8');
    console.log(`✅ Scanner file loaded (${savedScannerCode.length} chars)`);

    // Test 1: Check if backend is responding
    console.log('\n🔍 Test 1: Backend Health Check');
    try {
      const healthResponse = await fetch('http://localhost:8000/health');
      console.log(`Backend health: ${healthResponse.status} - ${healthResponse.ok ? 'OK' : 'ERROR'}`);
    } catch (error) {
      console.error('❌ Backend not responding:', error.message);
      return;
    }

    // Test 2: Check API endpoints that frontend might use
    console.log('\n🔍 Test 2: API Endpoint Discovery');
    const endpoints = [
      '/api/scan/execute',
      '/api/scan/execute-saved',
      '/api/scan/direct-execution',
      '/api/systematic/scan',
      '/api/systematic/enhanced-backtest'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`http://localhost:8000${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: true })
        });
        console.log(`${endpoint}: ${response.status}`);
      } catch (error) {
        console.log(`${endpoint}: FAILED - ${error.message}`);
      }
    }

    // Test 3: Try different payload formats that frontend might send
    console.log('\n🔍 Test 3: Different Payload Formats');

    const payloads = [
      {
        name: 'Standard Upload Format',
        payload: {
          start_date: '2025-01-01',
          end_date: '2025-11-01',
          scanner_type: 'uploaded',
          uploaded_code: savedScannerCode
        }
      },
      {
        name: 'Direct Execution Format',
        payload: {
          start_date: '2025-01-01',
          end_date: '2025-11-01',
          scanner_type: 'direct_execution',
          code: savedScannerCode
        }
      },
      {
        name: 'Saved Project Format',
        payload: {
          start_date: '2025-01-01',
          end_date: '2025-11-01',
          project_id: 'test-project',
          scanner_code: savedScannerCode
        }
      }
    ];

    for (const test of payloads) {
      console.log(`\n📡 Testing: ${test.name}`);
      try {
        const response = await fetch('http://localhost:8000/api/scan/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(test.payload)
        });

        console.log(`   Status: ${response.status}`);

        if (response.ok) {
          const result = await response.json();
          console.log(`   ✅ Success: scan_id=${result.scan_id}`);

          // Poll for results
          if (result.scan_id) {
            await pollForResult(result.scan_id, test.name);
          }
        } else {
          const errorText = await response.text();
          console.log(`   ❌ Error: ${errorText.substring(0, 200)}...`);

          // Check for specific error patterns
          if (errorText.includes('function')) {
            console.log('   🚨 Function-related error detected');
          }
          if (errorText.includes('not found')) {
            console.log('   🔍 Endpoint not found error');
          }
        }
      } catch (error) {
        console.log(`   ❌ Request failed: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Failed to read scanner file:', error.message);
  }
}

async function pollForResult(scanId, testName) {
  console.log(`   ⏳ Polling for ${testName} results...`);

  const maxAttempts = 30;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`http://localhost:8000/api/scan/status/${scanId}`);

      if (response.ok) {
        const status = await response.json();

        if (status.status === 'completed') {
          console.log(`   ✅ ${testName} COMPLETED: ${status.total_found || 0} results`);
          return;
        } else if (status.status === 'error') {
          console.log(`   ❌ ${testName} FAILED: ${status.error || 'Unknown error'}`);
          return;
        }
      }
    } catch (error) {
      console.log(`   ⚠️ Poll error: ${error.message}`);
    }

    attempts++;
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`   ⏱️ ${testName} TIMEOUT`);
}

debugFrontendExecution();