// Test the actual frontend endpoint that your project is calling

const fs = require('fs');

async function testFrontendActualEndpoint() {
  console.log('🧪 Testing Actual Frontend Endpoint (port 5658)\n');

  try {
    // Read the backside scanner file
    const scannerFilePath = '/Users/michaeldurante/Downloads/backside para b copy.py';
    const savedScannerCode = fs.readFileSync(scannerFilePath, 'utf8');
    console.log(`✅ Scanner file loaded (${savedScannerCode.length} chars)`);

    // Test the exact endpoint your frontend is calling
    console.log('\n🔍 Testing Project Execution on port 5658');
    try {
      const response = await fetch('http://localhost:5658/api/projects/test-project/execute', {
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
        console.log('✅ Frontend endpoint working!');
        console.log('Response:', result);
      } else {
        const errorText = await response.text();
        console.log('❌ Frontend endpoint error:');
        console.log('Status:', response.status);
        console.log('Error:', errorText.substring(0, 1000));

        // Try different request formats
        console.log('\n🔍 Testing alternative request formats...');

        const alternativeFormats = [
          {
            name: 'Code in different field',
            body: {
              date_range: { start_date: '2025-01-01', end_date: '2025-11-01' },
              code: savedScannerCode,
              scanner_type: 'uploaded'
            }
          },
          {
            name: 'uploaded_code field',
            body: {
              date_range: { start_date: '2025-01-01', end_date: '2025-11-01' },
              uploaded_code: savedScannerCode,
              scanner_type: 'uploaded'
            }
          },
          {
            name: 'Minimal format',
            body: {
              start_date: '2025-01-01',
              end_date: '2025-11-01',
              scanner_type: 'uploaded',
              uploaded_code: savedScannerCode
            }
          }
        ];

        for (const format of alternativeFormats) {
          console.log(`\n📡 Testing: ${format.name}`);
          try {
            const altResponse = await fetch('http://localhost:5658/api/projects/test-project/execute', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(format.body)
            });

            console.log(`   Status: ${altResponse.status}`);
            if (altResponse.ok) {
              const altResult = await altResponse.json();
              console.log('   ✅ Success:', altResult);
              break;
            } else {
              const altError = await altResponse.text();
              console.log(`   ❌ Error: ${altError.substring(0, 200)}...`);
            }
          } catch (error) {
            console.log(`   ❌ Request failed: ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.log('❌ Request failed:', error.message);
    }

    // Test direct backend connectivity
    console.log('\n🔍 Testing Direct Backend Connectivity');
    try {
      const backendResponse = await fetch('http://localhost:8000/api/scan/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: '2025-01-01',
          end_date: '2025-11-01',
          scanner_type: 'uploaded',
          uploaded_code: savedScannerCode
        })
      });

      console.log(`Direct backend status: ${backendResponse.status}`);
      if (backendResponse.ok) {
        const backendResult = await backendResponse.json();
        console.log('✅ Direct backend working:', backendResult.scan_id);
      } else {
        const backendError = await backendResponse.text();
        console.log('❌ Direct backend error:', backendError.substring(0, 200));
      }
    } catch (error) {
      console.log('❌ Direct backend failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
  }
}

testFrontendActualEndpoint();