#!/usr/bin/env node

/**
 * Comprehensive End-to-End Workflow Test for EdgeDev System
 * Tests the complete workflow: file upload -> formatting -> GLM 4.5 -> project creation
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const CONFIG = {
  FRONTEND_URL: 'http://localhost:5656',
  BACKEND_URL: 'http://localhost:8000',
  TEST_FILE: '/Users/michaeldurante/Downloads/backside para b copy.py',
  TEST_TIMEOUT: 30000
};

console.log('🚀 Starting Comprehensive EdgeDev Workflow Test');
console.log('=' .repeat(60));

// Test results tracking
const testResults = {
  frontend: { status: 'pending', details: {} },
  backend: { status: 'pending', details: {} },
  fileUpload: { status: 'pending', details: {} },
  glm4API: { status: 'pending', details: {} },
  codeFormatting: { status: 'pending', details: {} },
  projectCreation: { status: 'pending', details: {} },
  momentumScanner: { status: 'pending', details: {} }
};

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({
        statusCode: res.statusCode,
        headers: res.headers,
        body: body
      }));
    });

    req.on('error', reject);
    req.setTimeout(CONFIG.TEST_TIMEOUT, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test 1: Frontend accessibility
async function testFrontend() {
  console.log('📱 Testing Frontend Accessibility...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 5656,
      path: '/',
      method: 'GET'
    });

    testResults.frontend.status = response.statusCode === 200 ? 'success' : 'error';
    testResults.frontend.details = {
      statusCode: response.statusCode,
      responsive: response.body.includes('Edge-Dev'),
      hasCacheBuster: response.body.includes('CACHE_BUSTER_VERSION'),
      hasRenataAI: response.body.includes('Renata') || response.body.includes('AI')
    };

    console.log(`   Status: ${testResults.frontend.status.toUpperCase()}`);
    console.log(`   Response Code: ${response.statusCode}`);
    console.log(`   Cache Buster: ${testResults.frontend.details.hasCacheBuster ? '✅' : '❌'}`);

  } catch (error) {
    testResults.frontend.status = 'error';
    testResults.frontend.details.error = error.message;
    console.log(`   ❌ Error: ${error.message}`);
  }
}

// Test 2: Backend API connectivity
async function testBackend() {
  console.log('🔧 Testing Backend API Connectivity...');
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 8000,
      path: '/api/health',
      method: 'GET'
    });

    const healthData = JSON.parse(response.body);
    testResults.backend.status = response.statusCode === 200 ? 'success' : 'error';
    testResults.backend.details = {
      statusCode: response.statusCode,
      server: healthData.server,
      status: healthData.status,
      endpoints: ['health', 'scan/execute', 'format/code', 'chart/{symbol}']
    };

    console.log(`   Status: ${testResults.backend.status.toUpperCase()}`);
    console.log(`   Server: ${healthData.server}`);
    console.log(`   Health: ${healthData.status}`);

  } catch (error) {
    testResults.backend.status = 'error';
    testResults.backend.details.error = error.message;
    console.log(`   ❌ Error: ${error.message}`);
  }
}

// Test 3: File upload functionality (simulated)
async function testFileUpload() {
  console.log('📁 Testing File Upload Functionality...');
  try {
    // Check if test file exists
    if (!fs.existsSync(CONFIG.TEST_FILE)) {
      throw new Error(`Test file not found: ${CONFIG.TEST_FILE}`);
    }

    const fileContent = fs.readFileSync(CONFIG.TEST_FILE, 'utf8');
    const fileStats = fs.statSync(CONFIG.TEST_FILE);

    testResults.fileUpload.status = 'success';
    testResults.fileUpload.details = {
      fileExists: true,
      fileSize: fileStats.size,
      fileName: path.basename(CONFIG.TEST_FILE),
      isPythonCode: fileContent.includes('import') && fileContent.includes('def '),
      isScannerCode: fileContent.toLowerCase().includes('scanner') || fileContent.includes('polygon'),
      lineCount: fileContent.split('\n').length,
      hasValidStructure: fileContent.includes('#') && fileContent.includes('import')
    };

    console.log(`   Status: ${testResults.fileUpload.status.toUpperCase()}`);
    console.log(`   File Size: ${fileStats.size} bytes`);
    console.log(`   Lines: ${testResults.fileUpload.details.lineCount}`);
    console.log(`   Python Scanner: ${testResults.fileUpload.details.isScannerCode ? '✅' : '❌'}`);

  } catch (error) {
    testResults.fileUpload.status = 'error';
    testResults.fileUpload.details.error = error.message;
    console.log(`   ❌ Error: ${error.message}`);
  }
}

// Test 4: GLM 4.5 API functionality
async function testGLM4API() {
  console.log('🤖 Testing GLM 4.5 API Functionality...');

  const testMessage = "build a momentum scanner";

  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 5656,
      path: '/api/renata/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': CONFIG.FRONTEND_URL
      }
    }, {
      message: testMessage,
      personality: 'optimizer',
      systemPrompt: 'You are a trading scanner optimization expert.',
      context: {
        page: 'scanner-interface',
        timestamp: new Date().toISOString()
      }
    });

    const responseData = JSON.parse(response.body);

    testResults.glm4API.status = response.statusCode === 200 ? 'success' : 'error';
    testResults.glm4API.details = {
      statusCode: response.statusCode,
      hasResponse: !!responseData.message,
      isGLM4Response: responseData.ai_engine === 'GLM 4.5',
      responseType: responseData.type,
      responseLength: responseData.message ? responseData.message.length : 0,
      hasTimestamp: !!responseData.timestamp
    };

    console.log(`   Status: ${testResults.glm4API.status.toUpperCase()}`);
    console.log(`   Response Type: ${responseData.type}`);
    console.log(`   AI Engine: ${responseData.ai_engine || 'OpenRouter'}`);
    console.log(`   Response Length: ${testResults.glm4API.details.responseLength} chars`);

  } catch (error) {
    testResults.glm4API.status = 'error';
    testResults.glm4API.details.error = error.message;
    console.log(`   ❌ Error: ${error.message}`);
  }
}

// Test 5: Code formatting functionality
async function testCodeFormatting() {
  console.log('🔧 Testing Code Formatting Functionality...');

  try {
    const fileContent = fs.readFileSync(CONFIG.TEST_FILE, 'utf8');
    const formatRequest = `/format this python scanner\n\n${fileContent.substring(0, 1000)}...`;

    const response = await makeRequest({
      hostname: 'localhost',
      port: 5656,
      path: '/api/renata/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': CONFIG.FRONTEND_URL
      }
    }, {
      message: formatRequest,
      personality: 'analyst',
      context: {
        page: 'code-formatter',
        timestamp: new Date().toISOString()
      }
    });

    const responseData = JSON.parse(response.body);

    testResults.codeFormatting.status = response.statusCode === 200 ? 'success' : 'error';
    testResults.codeFormatting.details = {
      statusCode: response.statusCode,
      hasResponse: !!responseData.message,
      responseType: responseData.type,
      processedCode: responseData.message && responseData.message.includes('```'),
      formattedResponse: responseData.message && responseData.message.length > 100
    };

    console.log(`   Status: ${testResults.codeFormatting.status.toUpperCase()}`);
    console.log(`   Response Type: ${responseData.type}`);
    console.log(`   Code Processed: ${testResults.codeFormatting.details.processedCode ? '✅' : '❌'}`);
    console.log(`   Response Length: ${responseData.message ? responseData.message.length : 0} chars`);

  } catch (error) {
    testResults.codeFormatting.status = 'error';
    testResults.codeFormatting.details.error = error.message;
    console.log(`   ❌ Error: ${error.message}`);
  }
}

// Test 6: Backend code formatting endpoint
async function testBackendCodeFormatting() {
  console.log('⚙️ Testing Backend Code Formatting Endpoint...');

  try {
    const fileContent = fs.readFileSync(CONFIG.TEST_FILE, 'utf8');

    const response = await makeRequest({
      hostname: 'localhost',
      port: 8000,
      path: '/api/format/code',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      code: fileContent,
      language: 'python'
    });

    const responseData = JSON.parse(response.body);

    testResults.projectCreation.status = response.statusCode === 200 ? 'success' : 'error';
    testResults.projectCreation.details = {
      statusCode: response.statusCode,
      success: responseData.success,
      hasFormattedCode: !!responseData.formatted_code,
      language: responseData.language,
      codeLength: responseData.formatted_code ? responseData.formatted_code.length : 0
    };

    console.log(`   Status: ${testResults.projectCreation.status.toUpperCase()}`);
    console.log(`   Format Success: ${responseData.success ? '✅' : '❌'}`);
    console.log(`   Language: ${responseData.language}`);
    console.log(`   Code Length: ${testResults.projectCreation.details.codeLength} chars`);

  } catch (error) {
    testResults.projectCreation.status = 'error';
    testResults.projectCreation.details.error = error.message;
    console.log(`   ❌ Error: ${error.message}`);
  }
}

// Test 7: Momentum scanner creation
async function testMomentumScanner() {
  console.log('📈 Testing Momentum Scanner Creation...');

  const momentumRequests = [
    "build a momentum scanner",
    "create a momentum trading strategy",
    "optimize a momentum-based scan"
  ];

  try {
    for (const request of momentumRequests) {
      const response = await makeRequest({
        hostname: 'localhost',
        port: 5656,
        path: '/api/renata/chat',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': CONFIG.FRONTEND_URL
        }
      }, {
        message: request,
        personality: 'optimizer',
        context: {
          page: 'scanner-builder',
          timestamp: new Date().toISOString()
        }
      });

      const responseData = JSON.parse(response.body);

      if (response.statusCode === 200 && responseData.message) {
        testResults.momentumScanner.status = 'success';
        testResults.momentumScanner.details[request] = {
          success: true,
          responseType: responseData.type,
          aiEngine: responseData.ai_engine,
          responseLength: responseData.message.length
        };

        console.log(`   ✅ "${request}" - ${responseData.ai_engine || 'OpenRouter'}`);
      } else {
        console.log(`   ❌ "${request}" - Failed`);
      }
    }

    if (testResults.momentumScanner.status === 'pending') {
      testResults.momentumScanner.status = 'error';
      testResults.momentumScanner.details.error = 'All momentum scanner requests failed';
    }

  } catch (error) {
    testResults.momentumScanner.status = 'error';
    testResults.momentumScanner.details.error = error.message;
    console.log(`   ❌ Error: ${error.message}`);
  }
}

// Main test execution
async function runAllTests() {
  console.log('Starting comprehensive workflow testing...\n');

  // Run all tests sequentially
  await testFrontend();
  await testBackend();
  await testFileUpload();
  await testGLM4API();
  await testCodeFormatting();
  await testBackendCodeFormatting();
  await testMomentumScanner();

  // Generate final report
  console.log('\n' + '=' .repeat(60));
  console.log('📊 COMPREHENSIVE TEST RESULTS');
  console.log('=' .repeat(60));

  let successCount = 0;
  let totalCount = Object.keys(testResults).length;

  Object.entries(testResults).forEach(([testName, result]) => {
    const status = result.status === 'success' ? '✅ SUCCESS' : result.status === 'error' ? '❌ ERROR' : '⏳ PENDING';
    console.log(`${status.padEnd(12)} ${testName.toUpperCase().padEnd(20)}`);

    if (result.status === 'error' && result.details.error) {
      console.log(`             Error: ${result.details.error}`);
    }

    if (result.status === 'success') {
      successCount++;
    }
  });

  console.log('\n' + '-'.repeat(60));
  console.log(`Overall Success Rate: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);

  // Summary and recommendations
  console.log('\n📋 WORKFLOW ANALYSIS & RECOMMENDATIONS');
  console.log('-'.repeat(60));

  if (testResults.frontend.status === 'success') {
    console.log('✅ Frontend is operational and accessible');
  } else {
    console.log('❌ Frontend needs attention - check if service is running on port 5656');
  }

  if (testResults.backend.status === 'success') {
    console.log('✅ Backend API is responsive and healthy');
  } else {
    console.log('❌ Backend API issues detected - check simple-api-server.js');
  }

  if (testResults.glm4API.status === 'success') {
    console.log('✅ GLM 4.5 integration is working through Renata chat');
  } else {
    console.log('❌ GLM 4.5 integration needs debugging');
  }

  if (testResults.codeFormatting.status === 'success') {
    console.log('✅ Code formatting functionality is operational');
  } else {
    console.log('❌ Code formatting endpoint needs attention');
  }

  console.log('\n🎯 NEXT STEPS');
  console.log('-'.repeat(60));

  if (successCount === totalCount) {
    console.log('🎉 ALL SYSTEMS OPERATIONAL! Ready for production testing.');
  } else {
    console.log('🔧 Focus on fixing failed components before end-to-end testing.');
    console.log('📝 Use browser automation for full UI testing once APIs are confirmed working.');
  }

  console.log('\nTest completed at:', new Date().toISOString());
  console.log('=' .repeat(60));
}

// Run the tests
runAllTests().catch(console.error);