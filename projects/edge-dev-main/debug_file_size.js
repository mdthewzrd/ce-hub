#!/usr/bin/env node

/**
 * Debug File Size Issue
 * Test the exact workflow that's failing with file size error
 */

const fs = require('fs');
const http = require('http');

// Read the actual Python file from user's downloads
const testCode = fs.readFileSync('/Users/michaeldurante/Downloads/backside para b copy.py', 'utf8');

console.log('🔍 DEBUGGING FILE SIZE ISSUE');
console.log('='.repeat(50));
console.log(`📄 File: backside para b copy.py`);
console.log(`📊 Size: ${testCode.length} characters (${(testCode.length / 1024).toFixed(1)} KB)`);
console.log(`📝 Lines: ${testCode.split('\n').length}`);
console.log('');

// Test 1: Direct Next.js API route
function testNextJsRoute() {
  return new Promise((resolve, reject) => {
    console.log('🔧 Test 1: Direct Next.js API Route...');

    const postData = JSON.stringify({
      message: `format this\n\n${testCode}`,
      personality: 'renata',
      systemPrompt: 'You are a helpful AI assistant',
      context: {}
    });

    const options = {
      hostname: 'localhost',
      port: 5657,
      path: '/api/renata/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log(`   Status: ${res.statusCode}`);
          if (response.error) {
            console.log(`   ❌ Error: ${response.error}`);
            resolve({ success: false, error: response.error, source: 'Next.js Route' });
          } else {
            console.log(`   ✅ Success: Message received`);
            resolve({ success: true, response: response, source: 'Next.js Route' });
          }
        } catch (error) {
          console.log(`   ❌ Parse Error: ${error.message}`);
          resolve({ success: false, error: error.message, source: 'Next.js Route' });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ Request Error: ${error.message}`);
      resolve({ success: false, error: error.message, source: 'Next.js Route' });
    });

    req.write(postData);
    req.end();
  });
}

// Test 2: Direct API Gateway call
function testAPIGateway() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Test 2: Direct API Gateway...');

    const postData = JSON.stringify({
      source_code: testCode,
      format_type: 'scan_optimization',
      preserve_logic: true,
      add_documentation: true,
      optimize_performance: true
    });

    const options = {
      hostname: 'localhost',
      port: 8001,
      path: '/api/agent/scan/format',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log(`   Status: ${res.statusCode}`);
          if (response.success === false) {
            console.log(`   ❌ Error: ${response.message}`);
            resolve({ success: false, error: response.message, source: 'API Gateway' });
          } else {
            console.log(`   ✅ Success: AI formatting complete`);
            resolve({ success: true, response: response, source: 'API Gateway' });
          }
        } catch (error) {
          console.log(`   ❌ Parse Error: ${error.message}`);
          console.log(`   Raw: ${data.substring(0, 200)}...`);
          resolve({ success: false, error: error.message, source: 'API Gateway' });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ Request Error: ${error.message}`);
      resolve({ success: false, error: error.message, source: 'API Gateway' });
    });

    req.write(postData);
    req.end();
  });
}

// Run tests sequentially
async function runDebugTests() {
  try {
    console.log('Starting file size debug tests...\n');

    // Test 1: Next.js Route
    const result1 = await testNextJsRoute();
    console.log('');

    // Test 2: API Gateway
    const result2 = await testAPIGateway();
    console.log('');

    // Summary
    console.log('📊 DEBUG SUMMARY');
    console.log('='.repeat(50));
    console.log(`Next.js Route: ${result1.success ? '✅ PASS' : '❌ FAIL'}`);
    if (!result1.success) console.log(`   Error: ${result1.error}`);

    console.log(`API Gateway: ${result2.success ? '✅ PASS' : '❌ FAIL'}`);
    if (!result2.success) console.log(`   Error: ${result2.error}`);

    if (result1.success && result2.success) {
      console.log('\n🎉 BOTH TESTS PASSED - File size is NOT the issue!');
      console.log('The problem must be in the frontend UI validation.');
    } else {
      console.log('\n💥 TESTS FAILED - Backend has actual file size limits');
    }

  } catch (error) {
    console.error('Debug test failed:', error);
  }
}

// Run the debug tests
runDebugTests();