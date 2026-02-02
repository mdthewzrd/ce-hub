#!/usr/bin/env node

/**
 * Final Traderra Validation Report
 * Complete validation of the Traderra system functionality
 */

const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:6565';
const API_BASE = 'http://localhost:6500';

// Test configuration
const VALIDATION_TESTS = [
  {
    name: 'Health Checks',
    tests: [
      { url: `${BASE_URL}`, name: 'Frontend Accessibility' },
      { url: `${API_BASE}/health`, name: 'Backend Health' }
    ]
  },
  {
    name: 'API Functionality',
    tests: [
      {
        url: `${BASE_URL}/api/renata/chat`,
        method: 'POST',
        data: {
          message: 'Switch to R-multiple mode and show last 90 days',
          mode: 'coach',
          context: {
            currentDateRange: { label: 'Last 90 Days' },
            displayMode: 'dollar'
          }
        },
        name: 'Multi-command Message',
        expectedCommands: ['setDisplayMode', 'set_date_range']
      },
      {
        url: `${BASE_URL}/api/renata/chat`,
        method: 'POST',
        data: {
          message: 'Switch to dollar mode',
          mode: 'coach'
        },
        name: 'Display Mode Change',
        expectedCommands: ['setDisplayMode']
      },
      {
        url: `${BASE_URL}/api/renata/chat`,
        method: 'POST',
        data: {
          message: 'Show me last 30 days',
          mode: 'coach'
        },
        name: 'Date Range Change',
        expectedCommands: ['set_date_range']
      },
      {
        url: `${BASE_URL}/api/renata/chat`,
        method: 'POST',
        data: {
          message: 'Go to dashboard',
          mode: 'coach'
        },
        name: 'Navigation Command',
        expectedCommands: ['navigate_to_dashboard']
      }
    ]
  },
  {
    name: 'Frontend Pages',
    tests: [
      { url: `${BASE_URL}/`, name: 'Home Page' },
      { url: `${BASE_URL}/dashboard`, name: 'Dashboard Page' },
      { url: `${BASE_URL}/statistics`, name: 'Statistics Page' },
      { url: `${BASE_URL}/calendar`, name: 'Calendar Page' }
    ]
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

function validateCommands(commands, expectedCommands) {
  if (!expectedCommands || expectedCommands.length === 0) {
    return { passed: true, message: 'No specific commands expected' };
  }

  const detectedCommands = commands ? commands.map(cmd => cmd.command) : [];
  const missingCommands = expectedCommands.filter(cmd => !detectedCommands.includes(cmd));
  const unexpectedCommands = detectedCommands.filter(cmd => !expectedCommands.includes(cmd));

  if (missingCommands.length === 0 && unexpectedCommands.length === 0) {
    return { passed: true, message: `All expected commands detected: ${expectedCommands.join(', ')}` };
  } else {
    const issues = [];
    if (missingCommands.length > 0) issues.push(`Missing: ${missingCommands.join(', ')}`);
    if (unexpectedCommands.length > 0) issues.push(`Unexpected: ${unexpectedCommands.join(', ')}`);
    return { passed: false, message: issues.join('; ') };
  }
}

async function runTest(test) {
  try {
    const response = await makeRequest(test.url, test.data, test.method || 'GET');

    if (!response.ok) {
      return {
        name: test.name,
        passed: false,
        status: response.status,
        message: `HTTP ${response.status}: ${response.data}`,
        details: response.data
      };
    }

    let result = {
      name: test.name,
      passed: true,
      status: response.status,
      message: 'Success'
    };

    // Special validation for API responses
    if (test.expectedCommands) {
      const validation = validateCommands(response.data.navigationCommands, test.expectedCommands);
      result.passed = validation.passed;
      result.message = validation.message;
      result.details = {
        commands: response.data.navigationCommands || [],
        response: response.data.response?.substring(0, 100) + '...'
      };
    }

    return result;
  } catch (error) {
    return {
      name: test.name,
      passed: false,
      status: 'ERROR',
      message: error.message,
      details: error.stack
    };
  }
}

async function main() {
  console.log('🚀 Traderra Final Validation Report');
  console.log('====================================');
  console.log(`Frontend URL: ${BASE_URL}`);
  console.log(`Backend URL: ${API_BASE}`);
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log('');

  const allResults = [];

  // Run all test suites
  for (const suite of VALIDATION_TESTS) {
    console.log(`📋 ${suite.name}`);
    console.log('─'.repeat(40));

    const suiteResults = [];

    for (const test of suite.tests) {
      const result = await runTest(test);
      suiteResults.push(result);
      allResults.push(result);

      const status = result.passed ? '✅' : '❌';
      const message = result.message.length > 60 ? result.message.substring(0, 60) + '...' : result.message;
      console.log(`${status} ${result.name}: ${message}`);

      if (result.details && !result.passed) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
      }
    }

    console.log('');
  }

  // Generate final summary
  console.log('📊 FINAL VALIDATION SUMMARY');
  console.log('============================');

  const total = allResults.length;
  const passed = allResults.filter(r => r.passed).length;
  const percentage = Math.round((passed / total) * 100);

  console.log(`\nOverall Score: ${passed}/${total} tests passed (${percentage}%)`);
  console.log('─'.repeat(50));

  // Categorize results
  const healthTests = allResults.filter(r => r.name.includes('Accessibility') || r.name.includes('Health'));
  const apiTests = allResults.filter(r => r.name.includes('Message') || r.name.includes('Change') || r.name.includes('Command'));
  const pageTests = allResults.filter(r => r.name.includes('Page'));

  const healthPassed = healthTests.filter(r => r.passed).length;
  const apiPassed = apiTests.filter(r => r.passed).length;
  const pagePassed = pageTests.filter(r => r.passed).length;

  console.log(`\n🔍 System Health: ${healthPassed}/${healthTests.length} passed`);
  console.log(`🧠 API Functionality: ${apiPassed}/${apiTests.length} passed`);
  console.log(`💻 Frontend Pages: ${pagePassed}/${pageTests.length} passed`);

  // Key findings
  console.log('\n🎯 KEY VALIDATION FINDINGS');
  console.log('==========================');

  // Check if the critical multi-command test passed
  const multiCommandTest = allResults.find(r => r.name === 'Multi-command Message');
  if (multiCommandTest && multiCommandTest.passed) {
    console.log('✅ CRITICAL: Multi-command "Switch to R-multiple mode and show last 90 days" WORKS');
    console.log('✅ State change processing is functional');
  } else {
    console.log('❌ CRITICAL: Multi-command test FAILED');
  }

  // Check API connectivity
  const backendHealth = allResults.find(r => r.name === 'Backend Health');
  if (backendHealth && backendHealth.passed) {
    console.log('✅ Backend API is healthy and responsive');
  } else {
    console.log('❌ Backend API is not responding correctly');
  }

  // Check frontend accessibility
  const frontendTest = allResults.find(r => r.name === 'Frontend Accessibility');
  if (frontendTest && frontendTest.passed) {
    console.log('✅ Frontend is accessible and loading correctly');
  } else {
    console.log('❌ Frontend is not accessible');
  }

  // Overall assessment
  console.log('\n🏆 OVERALL ASSESSMENT');
  console.log('=====================');

  if (percentage === 100) {
    console.log('🎉 PERFECT SCORE! All systems are working correctly.');
    console.log('\n✨ VALIDATION COMPLETE:');
    console.log('  • Backend API is healthy and responsive');
    console.log('  • Frontend loads successfully on all pages');
    console.log('  • Renata AI chat is processing commands correctly');
    console.log('  • Multi-command state changes are working');
    console.log('  • Display mode and date range changes are functional');
    console.log('  • Navigation commands are being processed');
    console.log('\n🚀 The Traderra system is READY for use!');
  } else if (percentage >= 80) {
    console.log('✅ GOOD: Most systems are working correctly.');
    console.log(`⚠️  ${total - passed} minor issues need attention.`);
  } else if (percentage >= 60) {
    console.log('⚠️  FAIR: Some core functionality is working but needs improvement.');
  } else {
    console.log('❌ POOR: Significant issues detected that need immediate attention.');
  }

  console.log('\n📋 Next Steps:');
  if (percentage < 100) {
    const failedTests = allResults.filter(r => !r.passed);
    console.log('1. Review and fix the failed tests:');
    failedTests.forEach(test => {
      console.log(`   • ${test.name}: ${test.message}`);
    });
  } else {
    console.log('1. ✅ System validation complete');
    console.log('2. 🎯 Ready for user testing');
    console.log('3. 📈 Monitor system performance');
  }

  console.log(`\n📅 Validation completed at: ${new Date().toISOString()}`);

  return percentage;
}

// Run the validation
if (require.main === module) {
  main()
    .then(score => {
      process.exit(score === 100 ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Validation failed:', error);
      process.exit(1);
    });
}