// Test the new Project Execution API route

const fs = require('fs');

async function testProjectExecutionAPI() {
  console.log('🧪 Testing Project Execution API Route\n');

  try {
    // Read the backside scanner file
    const scannerFilePath = '/Users/michaeldurante/Downloads/backside para b copy.py';
    const savedScannerCode = fs.readFileSync(scannerFilePath, 'utf8');
    console.log(`✅ Scanner file loaded (${savedScannerCode.length} chars)`);

    // Test 1: Check if the new API route exists
    console.log('\n🔍 Test 1: Check Project Execution API Route');
    try {
      const healthResponse = await fetch('http://localhost:5656/api/projects/test-project-123/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date_range: {
            start_date: '2025-01-01',
            end_date: '2025-11-01'
          },
          scanner_code: savedScannerCode,
          timeout_seconds: 300
        })
      });

      console.log(`Status: ${healthResponse.status}`);

      if (healthResponse.ok) {
        const result = await healthResponse.json();
        console.log('✅ Project Execution API is working!');
        console.log('Response:', result);

        if (result.scan_id) {
          console.log('\n📡 Testing status endpoint...');
          await pollForProjectStatus(result.scan_id);
        }
      } else {
        const errorText = await healthResponse.text();
        console.log('❌ API Route Error:', errorText.substring(0, 500));
      }
    } catch (error) {
      console.log('❌ API Route Failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
  }
}

async function pollForProjectStatus(scanId) {
  console.log(`⏳ Polling for project execution status...`);

  const maxAttempts = 30;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`http://localhost:5656/api/projects/test-project/execute?scan_id=${scanId}`);

      if (response.ok) {
        const status = await response.json();

        console.log(`📈 Status: ${status.status} - ${status.progress_percent}% - ${status.message}`);

        if (status.status === 'completed') {
          console.log('\n✅ Project Execution COMPLETED!');
          console.log(`Total results: ${status.total_found || 0}`);

          if (status.results && status.results.length > 0) {
            console.log('\n🎉 Project execution found results:');
            status.results.slice(0, 5).forEach((result, index) => {
              console.log(`${index + 1}. ${result.Ticker || result.ticker} - ${result.Date || result.date}`);
            });
          }
          return;
        } else if (status.status === 'error') {
          console.log(`❌ Project execution FAILED: ${status.error}`);
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

testProjectExecutionAPI();