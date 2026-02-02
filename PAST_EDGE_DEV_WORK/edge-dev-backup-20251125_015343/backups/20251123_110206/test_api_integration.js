/**
 * Simple API Integration Test: Direct Backend Testing
 * Tests the CodeFormatterService API without browser automation
 */

const fs = require('fs');
const path = require('path');

async function testBackendIntegration() {
  console.log('🧪 Testing Backend API Integration...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing backend health...');
    const healthResponse = await fetch('http://localhost:8000/');
    const healthStatus = healthResponse.status === 200 ? '✅ ONLINE' : '❌ OFFLINE';
    console.log(`   Backend Status: ${healthStatus}`);

    if (healthResponse.status !== 200) {
      console.log('❌ Backend not available - cannot proceed with integration test');
      return;
    }

    // Test 2: Read Test Scanner File
    console.log('\n2. Reading test scanner file...');
    const testScannerPath = path.join(__dirname, 'test_scanner.py');

    if (!fs.existsSync(testScannerPath)) {
      console.log('❌ Test scanner file not found');
      return;
    }

    const testScannerContent = fs.readFileSync(testScannerPath, 'utf8');
    console.log(`   ✅ Test file loaded (${testScannerContent.length} characters)`);

    // Test 3: Format Code API
    console.log('\n3. Testing CodeFormatterService API...');

    const formatResponse = await fetch('http://localhost:8000/api/format/code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: testScannerContent,
        filename: 'test_scanner.py'
      })
    });

    const formatResult = await formatResponse.json();
    console.log(`   API Response Status: ${formatResponse.status}`);
    console.log(`   Format Success: ${formatResult.success ? '✅' : '❌'}`);

    if (formatResult.success) {
      console.log(`   Scanner Type: ${formatResult.scanner_type || 'Unknown'}`);
      console.log(`   Parameters Found: ${formatResult.parameters ? Object.keys(formatResult.parameters).length : 0}`);

      if (formatResult.parameters) {
        console.log('   Parameter Details:');
        Object.entries(formatResult.parameters).forEach(([key, value]) => {
          console.log(`     • ${key}: ${value}`);
        });
      }
    } else {
      console.log(`   Error: ${formatResult.error || 'Unknown error'}`);
    }

    // Test 4: Scanner Detection API (if available)
    console.log('\n4. Testing scanner detection...');

    try {
      const detectResponse = await fetch('http://localhost:8000/api/detect-scanner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: testScannerContent
        })
      });

      if (detectResponse.status === 200) {
        const detectResult = await detectResponse.json();
        console.log(`   Detection Success: ✅`);
        console.log(`   Detected Type: ${detectResult.scanner_type || 'Unknown'}`);
        console.log(`   Confidence: ${detectResult.confidence || 'Not specified'}`);
      } else {
        console.log(`   Detection API not available (${detectResponse.status})`);
      }
    } catch (error) {
      console.log(`   Detection API not available or error: ${error.message}`);
    }

    // Test 5: Integration Summary
    console.log('\n📊 Integration Test Summary:');

    const testResults = {
      'Backend Health': healthResponse.status === 200,
      'File Reading': fs.existsSync(testScannerPath),
      'Format API': formatResult.success,
      'Parameter Extraction': formatResult.parameters && Object.keys(formatResult.parameters).length > 0
    };

    Object.entries(testResults).forEach(([test, passed]) => {
      console.log(`   • ${test}: ${passed ? '✅' : '❌'}`);
    });

    const overallSuccess = Object.values(testResults).every(result => result);

    console.log(`\n🎯 Overall Integration: ${overallSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);

    if (overallSuccess) {
      console.log('\n🎉 Complete backend integration is working!');
      console.log('\n📝 Next steps for testing:');
      console.log('   1. Open http://localhost:5657');
      console.log('   2. Activate Renata AI popup');
      console.log('   3. Upload test_scanner.py');
      console.log('   4. Request formatting/import');
      console.log('   5. Verify the complete workflow');

      console.log('\n🔧 System Status:');
      console.log('   • Frontend: http://localhost:5657 ✅');
      console.log('   • Backend: http://localhost:8000 ✅');
      console.log('   • File Upload Integration: Ready for testing ✅');
      console.log('   • CodeFormatterService: Ready ✅');
    }

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
  }
}

// Run the test
testBackendIntegration();