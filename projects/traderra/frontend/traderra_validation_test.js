#!/usr/bin/env node

/**
 * Traderra Frontend Validation Script
 * Tests end-to-end functionality of the Renata AI system
 */

const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:6565';
const API_BASE = 'http://localhost:6500';

// Test configuration
const TEST_MESSAGES = [
  {
    name: 'Multi-command: Switch to R-multiple + 90 days',
    message: 'Switch to R-multiple mode and show last 90 days',
    expectedCommands: ['setDisplayMode', 'set_date_range'],
    expectedParams: {
      displayMode: 'r_multiple',
      dateRange: 'last_90_days'
    }
  },
  {
    name: 'Display mode change only',
    message: 'Switch to dollar mode',
    expectedCommands: ['setDisplayMode'],
    expectedParams: {
      displayMode: 'dollar'
    }
  },
  {
    name: 'Date range change only',
    message: 'Show me last 30 days',
    expectedCommands: ['set_date_range'],
    expectedParams: {
      dateRange: 'last_month'
    }
  },
  {
    name: 'Navigation command',
    message: 'Go to dashboard',
    expectedCommands: ['navigate_to_dashboard'],
    expectedParams: {}
  }
];

function makeRequest(url, data = null, method = 'GET') {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const postData = data ? JSON.stringify(data) : null;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData && { 'Content-Length': Buffer.byteLength(postData) })
      },
      timeout: 30000
    };

    const req = client.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            ok: res.statusCode >= 200 && res.statusCode < 300,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            ok: res.statusCode >= 200 && res.statusCode < 300,
            data: responseData
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (postData) {
      req.write(postData);
    }

    req.end();
  });
}

async function testHealthEndpoints() {
  console.log('\n🔍 Testing Health Endpoints');
  console.log('================================');

  try {
    // Test frontend
    console.log('Testing frontend health...');
    const frontendResponse = await makeRequest(BASE_URL);
    console.log(`✅ Frontend: ${frontendResponse.status} (${frontendResponse.ok ? 'OK' : 'FAIL'})`);

    // Test backend
    console.log('Testing backend health...');
    const backendResponse = await makeRequest(`${API_BASE}/health`);
    console.log(`✅ Backend: ${backendResponse.status} (${backendResponse.ok ? 'OK' : 'FAIL'})`);

    if (backendResponse.data) {
      console.log('📊 Backend services:', JSON.stringify(backendResponse.data.services, null, 2));
    }

    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function testRenataAPI(message, testName) {
  console.log(`\n🧠 Testing: ${testName}`);
  console.log('--------------------------------');
  console.log(`Message: "${message}"`);

  try {
    const response = await makeRequest(`${BASE_URL}/api/renata/chat`, {
      message: message,
      mode: 'coach',
      context: {
        currentDateRange: { label: 'Last 90 Days' },
        displayMode: 'dollar'
      }
    }, 'POST');

    if (!response.ok) {
      console.error(`❌ API Error: ${response.status}`);
      console.error('Response:', response.data);
      return false;
    }

    const data = response.data;
    console.log('✅ Response received');
    console.log(`📝 Response length: ${data.response?.length || 0} characters`);
    console.log(`🎯 Navigation commands: ${data.navigationCommands?.length || 0}`);

    if (data.navigationCommands && data.navigationCommands.length > 0) {
      console.log('\n🚀 Commands detected:');
      data.navigationCommands.forEach((cmd, index) => {
        console.log(`  ${index + 1}. ${cmd.command}:`, JSON.stringify(cmd.params, null, 2));
      });
    }

    if (data.nlpAnalysis) {
      console.log('\n🧠 NLP Analysis:');
      console.log(`  Date Range: ${data.nlpAnalysis.dateRange || 'None'}`);
      console.log(`  Intents: ${data.nlpAnalysis.intents?.length || 0} detected`);
      console.log(`  Advanced Params: ${Object.keys(data.nlpAnalysis.advancedParams || {}).length} detected`);
    }

    return data;
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    return false;
  }
}

async function validateStateChanges(testResult, expected) {
  if (!testResult || !testResult.navigationCommands) {
    console.log('❌ No navigation commands to validate');
    return false;
  }

  console.log('\n✅ Validating State Changes:');
  const commands = testResult.navigationCommands;
  let allPassed = true;

  // Check expected commands are present
  for (const expectedCmd of expected.expectedCommands) {
    const found = commands.find(cmd => cmd.command === expectedCmd);
    if (found) {
      console.log(`  ✅ ${expectedCmd} command found`);

      // Validate parameters for specific commands
      if (expectedCmd === 'setDisplayMode' && expected.expectedParams.displayMode) {
        const actualMode = found.params?.mode;
        if (actualMode === expected.expectedParams.displayMode) {
          console.log(`    ✅ Display mode parameter correct: ${actualMode}`);
        } else {
          console.log(`    ❌ Display mode mismatch. Expected: ${expected.expectedParams.displayMode}, Got: ${actualMode}`);
          allPassed = false;
        }
      }

      if (expectedCmd === 'set_date_range' && expected.expectedParams.dateRange) {
        const actualRange = found.params?.dateRange;
        if (actualRange === expected.expectedParams.dateRange) {
          console.log(`    ✅ Date range parameter correct: ${actualRange}`);
        } else {
          console.log(`    ❌ Date range mismatch. Expected: ${expected.expectedParams.dateRange}, Got: ${actualRange}`);
          allPassed = false;
        }
      }
    } else {
      console.log(`  ❌ ${expectedCmd} command missing`);
      allPassed = false;
    }
  }

  return allPassed;
}

async function main() {
  console.log('🚀 Traderra Frontend Validation');
  console.log('================================');
  console.log(`Frontend URL: ${BASE_URL}`);
  console.log(`Backend URL: ${API_BASE}`);
  console.log(`Started at: ${new Date().toISOString()}`);

  // Test health endpoints
  const healthOk = await testHealthEndpoints();
  if (!healthOk) {
    console.log('\n❌ Health checks failed. Exiting.');
    process.exit(1);
  }

  console.log('\n🎯 Testing Renata AI Functionality');
  console.log('=====================================');

  const results = [];

  // Test each message
  for (const test of TEST_MESSAGES) {
    const result = await testRenataAPI(test.message, test.name);
    const validation = result ? await validateStateChanges(result, test) : false;

    results.push({
      name: test.name,
      success: !!result && validation,
      result: result,
      validation: validation
    });
  }

  // Summary
  console.log('\n📊 VALIDATION SUMMARY');
  console.log('======================');

  const passed = results.filter(r => r.success).length;
  const total = results.length;

  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${result.name}`);
  });

  console.log(`\nOverall: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('🎉 ALL TESTS PASSED! The system is working correctly.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please review the issues above.');
    process.exit(1);
  }
}

// Run the validation
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Validation script failed:', error);
    process.exit(1);
  });
}