#!/usr/bin/env node

/**
 * Test port 8000 directly for project execution to confirm FastAPI fix works
 */

const fs = require('fs');

async function testPort8000ProjectExecution() {
  console.log('🧪 Testing Port 8000 FastAPI Project Execution Directly\n');

  try {
    // Read the backside scanner file
    const scannerFilePath = '/Users/michaeldurante/Downloads/backside para b copy.py';
    const savedScannerCode = fs.readFileSync(scannerFilePath, 'utf8');
    console.log(`✅ Scanner file loaded (${savedScannerCode.length} chars)`);

    // Test port 8000 FastAPI project execution endpoint directly
    console.log('\n🚀 Testing Port 8000 FastAPI Project Execution');
    try {
      const response = await fetch('http://localhost:8000/api/projects/test-project/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date_range: {
            start_date: '2025-01-01',
            end_date: '2025-11-01'
          },
          scanner_code: savedScannerCode,
          timeout_seconds: 300,
          max_workers: 4
        })
      });

      console.log(`Status: ${response.status}`);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Port 8000 FastAPI working!');
        console.log('Response:', JSON.stringify(result, null, 2));

        if (result.scan_id || result.execution_id) {
          const scanId = result.scan_id || result.execution_id;
          console.log(`\n📡 Polling for execution status: ${scanId}`);
          await pollForStatus(scanId);
        }
      } else {
        const errorText = await response.text();
        console.log('❌ Port 8000 FastAPI error:');
        console.log('Status:', response.status);
        console.log('Error:', errorText);
      }
    } catch (error) {
      console.log('❌ Port 8000 request failed:', error.message);
    }

    // Test if port 5659 Flask is interfering
    console.log('\n🔍 Testing Port 5659 Flask (to confirm conflict)');
    try {
      const flaskResponse = await fetch('http://localhost:5659/api/projects/test-project/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date_range: {
            start_date: '2025-01-01',
            end_date: '2025-11-01'
          },
          scanner_code: savedScannerCode
        })
      });

      console.log(`Flask Status: ${flaskResponse.status}`);
      if (flaskResponse.ok) {
        const flaskResult = await flaskResponse.json();
        console.log('Flask Response:', flaskResult);
      } else {
        const flaskError = await flaskResponse.text();
        console.log('Flask Error:', flaskError.substring(0, 200));
      }
    } catch (error) {
      console.log('❌ Port 5659 Flask request failed:', error.message);
    }

    // Test if port 5658 exists and what it does
    console.log('\n🔍 Testing Port 5658 (unknown server)');
    try {
      const port5658Response = await fetch('http://localhost:5658/api/projects/test-project/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date_range: {
            start_date: '2025-01-01',
            end_date: '2025-11-01'
          },
          scanner_code: savedScannerCode
        })
      });

      console.log(`Port 5658 Status: ${port5658Response.status}`);
      if (port5658Response.ok) {
        const port5658Result = await port5658Response.json();
        console.log('Port 5658 Response:', port5658Result);
      } else {
        const port5658Error = await port5658Response.text();
        console.log('Port 5658 Error:', port5658Error.substring(0, 200));
      }
    } catch (error) {
      console.log('❌ Port 5658 request failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
  }
}

async function pollForStatus(scanId) {
  console.log(`⏳ Polling for execution status: ${scanId}`);

  const maxAttempts = 10;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`http://localhost:8000/api/scan/status/${scanId}`);

      if (response.ok) {
        const status = await response.json();

        console.log(`📈 Status: ${status.status} - ${status.message}`);

        if (status.status === 'completed') {
          console.log('\n🎉 EXECUTION COMPLETED SUCCESSFULLY!');
          console.log(`Results: ${JSON.stringify(status.results || [], null, 2)}`);
          return;
        } else if (status.status === 'error') {
          console.log(`❌ Execution FAILED: ${status.message}`);
          return;
        }
      }
    } catch (error) {
      console.log(`⚠️ Status poll error: ${error.message}`);
    }

    attempts++;
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log('⏱️ Status polling timeout');
}

testPort8000ProjectExecution();