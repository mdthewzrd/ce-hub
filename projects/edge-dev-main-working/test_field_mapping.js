#!/usr/bin/env node

/**
 * Test the field mapping fix for integrity verification
 */

const http = require('http');

function testFieldMapping() {
  return new Promise((resolve, reject) => {
    const testCode = `def test_scanner():
    gap_threshold = 3.0
    volume_multiplier = 2.0
    min_price = 5.0
    return True`;

    const postData = JSON.stringify({
      code: testCode,
      options: {}
    });

    console.log('🧪 Testing field mapping fix...');

    const req = http.request({
      hostname: 'localhost',
      port: 8003,
      path: '/api/format/code',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ Backend Response:');
          console.log('   Status:', res.statusCode);
          console.log('   Success:', result.success);
          console.log('   integrityVerified:', result.integrityVerified);
          console.log('   scannerType:', result.scannerType);
          console.log('   formattedCode length:', result.formattedCode?.length || 0);
          console.log('   Optimizations:', result.optimizations?.length || 0);

          // Test both naming conventions
          const hasCamelCase = result.integrityVerified !== undefined;
          const hasSnakeCase = result.integrity_verified !== undefined;

          console.log('\n📋 Field Mapping Analysis:');
          console.log('   Has integrityVerified (camelCase):', hasCamelCase);
          console.log('   Has integrity_verified (snake_case):', hasSnakeCase);
          console.log('   Frontend should now read: ✅ Verified');

          if (result.integrityVerified === true) {
            console.log('\n🎉 FIELD MAPPING FIX: SUCCESSFUL!');
            console.log('Users will now see "Parameter Integrity: Verified ✅"');
            resolve(result);
          } else {
            console.log('\n❌ FIELD MAPPING: STILL BROKEN');
            reject(new Error('integrityVerified is still not true'));
          }
        } catch (error) {
          console.error('❌ Parse error:', error.message);
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

testFieldMapping()
  .then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });