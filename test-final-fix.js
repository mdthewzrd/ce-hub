// Final test of the complete fix - project execution API on port 8000

const fs = require('fs');

async function testFinalFix() {
  console.log('🔧 Testing Final Fix - Complete Project Execution API\n');

  try {
    // Read the backside scanner file
    const scannerFilePath = '/Users/michaeldurante/Downloads/backside para b copy.py';
    const savedScannerCode = fs.readFileSync(scannerFilePath, 'utf8');
    console.log(`✅ Scanner file loaded (${savedScannerCode.length} chars)`);

    // Test the new project execution endpoint on port 8000
    console.log('\n🚀 Testing Project Execution on Port 8000');
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
        console.log('✅ Project execution API working!');
        console.log('Response:', result);

        if (result.scan_id) {
          console.log('\n📡 Polling for execution status...');
          await pollForStatus(result.scan_id);
        }
      } else {
        const errorText = await response.text();
        console.log('❌ Project execution failed:');
        console.log('Status:', response.status);
        console.log('Error:', errorText.substring(0, 1000));
      }
    } catch (error) {
      console.log('❌ Request failed:', error.message);
    }

    // Test project API service connectivity
    console.log('\n🔍 Testing Project API Service Configuration');
    try {
      const projectsResponse = await fetch('http://localhost:8000/api/projects');
      console.log(`Projects API status: ${projectsResponse.status}`);
      if (projectsResponse.ok) {
        const projects = await projectsResponse.json();
        console.log('✅ Projects API working, found', projects.length, 'projects');
      }
    } catch (error) {
      console.log('❌ Projects API failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
  }
}

async function pollForStatus(scanId) {
  console.log(`⏳ Polling for execution status: ${scanId}`);

  const maxAttempts = 30;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`http://localhost:8000/api/projects/test-project/execute?scan_id=${scanId}`);

      if (response.ok) {
        const status = await response.json();

        console.log(`📈 Status: ${status.status} - ${status.progress_percent}% - ${status.message}`);

        if (status.status === 'completed') {
          console.log('\n🎉 EXECUTION COMPLETED SUCCESSFULLY!');
          console.log(`Total results: ${status.total_found || 0}`);

          if (status.results && status.results.length > 0) {
            console.log('\n✅ Results found:');
            status.results.slice(0, 5).forEach((result, index) => {
              console.log(`${index + 1}. ${result.Ticker || result.ticker} - ${result.Date || result.date}`);
            });
          }
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

testFinalFix();