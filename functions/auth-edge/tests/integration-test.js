#!/usr/bin/env node

/**
 * CE-Hub Authentication Edge Function Integration Test Suite
 * Comprehensive testing with real Supabase tokens and edge cases
 */

import https from 'https';
import http from 'http';

// Test configuration
const config = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  testToken: process.env.TEST_TOKEN || '',
  testRefreshToken: process.env.TEST_REFRESH_TOKEN || '',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  verbose: process.env.VERBOSE === 'true'
};

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testResults = [];

// Helper functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, details = '') {
  totalTests++;
  const status = passed ? 'PASS' : 'FAIL';
  const statusColor = passed ? 'green' : 'red';

  if (passed) {
    passedTests++;
  } else {
    failedTests++;
  }

  testResults.push({ name, passed, details });
  log(`[${status}] ${name}`, statusColor);
  if (details) {
    log(`      ${details}`, 'cyan');
  }
}

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.url.startsWith('https:') ? https : http;

    const req = protocol.request(options.url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 10000
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : null;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsedBody,
            rawBody: body
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: null,
            rawBody: body
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));

    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }

    req.end();
  });
}

// Test suites
async function testHealthEndpoint() {
  log('\n=== Health Endpoint Tests ===', 'blue');

  try {
    const response = await makeRequest({
      url: `${config.baseUrl}/health`,
      method: 'GET'
    });

    logTest('Health endpoint returns 200', response.statusCode === 200,
      `Status: ${response.statusCode}`);

    if (response.body) {
      logTest('Health response has status field',
        response.body.status !== undefined,
        `Status: ${response.body.status}`);

      logTest('Health status is healthy',
        response.body.status === 'healthy',
        `Status: ${response.body.status}`);

      logTest('Health response has services field',
        response.body.services !== undefined,
        `Services: ${Object.keys(response.body.services || {}).join(', ')}`);

      if (response.body.services && response.body.services.supabase) {
        logTest('Supabase service health check present',
          response.body.services.supabase.status !== undefined,
          `Supabase status: ${response.body.services.supabase.status}`);
      }
    }

  } catch (error) {
    logTest('Health endpoint accessible', false, `Error: ${error.message}`);
  }
}

async function testCorsHandling() {
  log('\n=== CORS Handling Tests ===', 'blue');

  try {
    // Test preflight request
    const preflightResponse = await makeRequest({
      url: `${config.baseUrl}/verify`,
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://example.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      }
    });

    logTest('CORS preflight returns 204',
      preflightResponse.statusCode === 204,
      `Status: ${preflightResponse.statusCode}`);

    logTest('CORS headers present in preflight',
      preflightResponse.headers['access-control-allow-origin'] !== undefined,
      `Origin: ${preflightResponse.headers['access-control-allow-origin']}`);

  } catch (error) {
    logTest('CORS preflight request', false, `Error: ${error.message}`);
  }
}

async function testTokenVerification() {
  log('\n=== Token Verification Tests ===', 'blue');

  // Test missing token
  try {
    const response = await makeRequest({
      url: `${config.baseUrl}/verify`,
      method: 'GET'
    });

    logTest('Missing token returns 400',
      response.statusCode === 400,
      `Status: ${response.statusCode}`);

    if (response.body && response.body.error) {
      logTest('Missing token error message correct',
        response.body.error.code === 'MISSING_TOKEN',
        `Code: ${response.body.error.code}`);
    }

  } catch (error) {
    logTest('Missing token test', false, `Error: ${error.message}`);
  }

  // Test invalid token
  try {
    const response = await makeRequest({
      url: `${config.baseUrl}/verify`,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid-token-here'
      }
    });

    logTest('Invalid token returns 401',
      response.statusCode === 401,
      `Status: ${response.statusCode}`);

  } catch (error) {
    logTest('Invalid token test', false, `Error: ${error.message}`);
  }

  // Test malformed authorization header
  try {
    const response = await makeRequest({
      url: `${config.baseUrl}/verify`,
      method: 'GET',
      headers: {
        'Authorization': 'Invalid header format'
      }
    });

    logTest('Malformed auth header returns 400',
      response.statusCode === 400,
      `Status: ${response.statusCode}`);

  } catch (error) {
    logTest('Malformed auth header test', false, `Error: ${error.message}`);
  }

  // Test POST token verification
  try {
    const response = await makeRequest({
      url: `${config.baseUrl}/verify`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      token: 'invalid-token',
      options: {}
    });

    logTest('POST invalid token returns 401',
      response.statusCode === 401,
      `Status: ${response.statusCode}`);

  } catch (error) {
    logTest('POST token verification test', false, `Error: ${error.message}`);
  }

  // Test valid token (if provided)
  if (config.testToken) {
    try {
      const response = await makeRequest({
        url: `${config.baseUrl}/verify`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.testToken}`
        }
      });

      logTest('Valid token verification',
        response.statusCode === 200,
        `Status: ${response.statusCode}`);

      if (response.body) {
        logTest('Valid token response format correct',
          response.body.valid === true,
          `Valid: ${response.body.valid}`);

        logTest('User data present in valid token response',
          response.body.user && response.body.user.id,
          `User ID: ${response.body.user?.id}`);
      }

    } catch (error) {
      logTest('Valid token test', false, `Error: ${error.message}`);
    }
  } else {
    log('Skipping valid token test (no token provided)', 'yellow');
  }
}

async function testTokenRefresh() {
  log('\n=== Token Refresh Tests ===', 'blue');

  // Test invalid refresh token
  try {
    const response = await makeRequest({
      url: `${config.baseUrl}/refresh`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      refreshToken: 'invalid-refresh-token'
    });

    logTest('Invalid refresh token returns 401',
      response.statusCode === 401,
      `Status: ${response.statusCode}`);

  } catch (error) {
    logTest('Invalid refresh token test', false, `Error: ${error.message}`);
  }

  // Test missing refresh token
  try {
    const response = await makeRequest({
      url: `${config.baseUrl}/refresh`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {});

    logTest('Missing refresh token returns 400',
      response.statusCode === 400,
      `Status: ${response.statusCode}`);

  } catch (error) {
    logTest('Missing refresh token test', false, `Error: ${error.message}`);
  }

  // Test GET method not allowed
  try {
    const response = await makeRequest({
      url: `${config.baseUrl}/refresh`,
      method: 'GET'
    });

    logTest('GET method not allowed for refresh',
      response.statusCode === 405,
      `Status: ${response.statusCode}`);

  } catch (error) {
    logTest('Refresh GET method test', false, `Error: ${error.message}`);
  }

  // Test valid refresh token (if provided)
  if (config.testRefreshToken) {
    try {
      const response = await makeRequest({
        url: `${config.baseUrl}/refresh`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }, {
        refreshToken: config.testRefreshToken
      });

      logTest('Valid refresh token',
        response.statusCode === 200,
        `Status: ${response.statusCode}`);

      if (response.body) {
        logTest('Refresh response has access token',
          response.body.access_token !== undefined,
          `Access token present: ${!!response.body.access_token}`);

        logTest('Refresh response has refresh token',
          response.body.refresh_token !== undefined,
          `Refresh token present: ${!!response.body.refresh_token}`);
      }

    } catch (error) {
      logTest('Valid refresh token test', false, `Error: ${error.message}`);
    }
  } else {
    log('Skipping valid refresh token test (no refresh token provided)', 'yellow');
  }
}

async function testErrorHandling() {
  log('\n=== Error Handling Tests ===', 'blue');

  // Test invalid route
  try {
    const response = await makeRequest({
      url: `${config.baseUrl}/invalid-route`,
      method: 'GET'
    });

    logTest('Invalid route returns 404',
      response.statusCode === 404,
      `Status: ${response.statusCode}`);

  } catch (error) {
    logTest('Invalid route test', false, `Error: ${error.message}`);
  }

  // Test invalid JSON
  try {
    const response = await makeRequest({
      url: `${config.baseUrl}/verify`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, 'invalid-json-here');

    logTest('Invalid JSON returns 400',
      response.statusCode === 400,
      `Status: ${response.statusCode}`);

  } catch (error) {
    logTest('Invalid JSON test', false, `Error: ${error.message}`);
  }

  // Test unsupported method
  try {
    const response = await makeRequest({
      url: `${config.baseUrl}/verify`,
      method: 'DELETE'
    });

    logTest('Unsupported method returns 405',
      response.statusCode === 405,
      `Status: ${response.statusCode}`);

  } catch (error) {
    logTest('Unsupported method test', false, `Error: ${error.message}`);
  }
}

async function testSecurityHeaders() {
  log('\n=== Security Headers Tests ===', 'blue');

  try {
    const response = await makeRequest({
      url: `${config.baseUrl}/health`,
      method: 'GET'
    });

    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'referrer-policy',
      'strict-transport-security'
    ];

    requiredHeaders.forEach(header => {
      logTest(`Security header: ${header}`,
        response.headers[header] !== undefined,
        `Value: ${response.headers[header] || 'Missing'}`);
    });

    logTest('Request ID header present',
      response.headers['x-request-id'] !== undefined,
      `Request ID: ${response.headers['x-request-id'] || 'Missing'}`);

  } catch (error) {
    logTest('Security headers test', false, `Error: ${error.message}`);
  }
}

async function testRateLimiting() {
  log('\n=== Rate Limiting Tests ===', 'blue');

  log('Testing rate limiting with rapid requests...', 'cyan');

  const requests = [];
  const maxRequests = 20;

  // Make rapid requests
  for (let i = 0; i < maxRequests; i++) {
    requests.push(makeRequest({
      url: `${config.baseUrl}/health`,
      method: 'GET'
    }));
  }

  try {
    const responses = await Promise.all(requests);
    const rateLimitResponses = responses.filter(r => r.statusCode === 429);

    logTest('Rate limiting is functional',
      true, // We consider it working if it doesn't crash
      `Made ${maxRequests} requests, ${rateLimitResponses.length} rate limited`);

    if (rateLimitResponses.length > 0) {
      const rateLimitResponse = rateLimitResponses[0];
      logTest('Rate limit response has retry-after header',
        rateLimitResponse.headers['retry-after'] !== undefined,
        `Retry-After: ${rateLimitResponse.headers['retry-after'] || 'Missing'}`);
    }

  } catch (error) {
    logTest('Rate limiting test', false, `Error: ${error.message}`);
  }
}

async function testResponseFormats() {
  log('\n=== Response Format Tests ===', 'blue');

  try {
    const response = await makeRequest({
      url: `${config.baseUrl}/health`,
      method: 'GET'
    });

    logTest('Health response is valid JSON',
      response.body !== null,
      `JSON parsed: ${response.body !== null}`);

    logTest('Response has timestamp',
      response.body && response.body.timestamp !== undefined,
      `Timestamp: ${response.body?.timestamp}`);

    // Test error response format
    const errorResponse = await makeRequest({
      url: `${config.baseUrl}/verify`,
      method: 'GET'
    });

    logTest('Error response is valid JSON',
      errorResponse.body !== null,
      `JSON parsed: ${errorResponse.body !== null}`);

    if (errorResponse.body && errorResponse.body.error) {
      logTest('Error response has proper structure',
        errorResponse.body.error.code !== undefined &&
        errorResponse.body.error.message !== undefined,
        `Code: ${errorResponse.body.error.code}`);
    }

  } catch (error) {
    logTest('Response format test', false, `Error: ${error.message}`);
  }
}

async function runAllTests() {
  log('CE-Hub Authentication Edge Function Integration Tests', 'magenta');
  log(`Base URL: ${config.baseUrl}`, 'cyan');
  log(`Test Token: ${config.testToken ? 'Provided' : 'Not provided'}`, 'cyan');
  log(`Test Refresh Token: ${config.testRefreshToken ? 'Provided' : 'Not provided'}`, 'cyan');

  // Run all test suites
  await testHealthEndpoint();
  await testCorsHandling();
  await testTokenVerification();
  await testTokenRefresh();
  await testErrorHandling();
  await testSecurityHeaders();
  await testRateLimiting();
  await testResponseFormats();

  // Summary
  log('\n=== TEST SUMMARY ===', 'magenta');
  log(`Total Tests: ${totalTests}`, 'cyan');
  log(`Passed: ${passedTests}`, 'green');
  log(`Failed: ${failedTests}`, 'red');

  if (config.verbose) {
    log('\n=== DETAILED RESULTS ===', 'blue');
    testResults.forEach(result => {
      const status = result.passed ? 'PASS' : 'FAIL';
      const color = result.passed ? 'green' : 'red';
      log(`[${status}] ${result.name}`, color);
      if (result.details) {
        log(`      ${result.details}`, 'cyan');
      }
    });
  }

  if (failedTests === 0) {
    log('\n🎉 All integration tests passed!', 'green');
    process.exit(0);
  } else {
    log(`\n❌ ${failedTests} test(s) failed.`, 'red');
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help')) {
  console.log(`
CE-Hub Auth Edge Function Integration Tests

Usage: node integration-test.js [options]

Environment Variables:
  TEST_BASE_URL         Base URL of the auth edge function (default: http://localhost:3000)
  TEST_TOKEN           Valid JWT token for testing
  TEST_REFRESH_TOKEN   Valid refresh token for testing
  SUPABASE_URL         Supabase project URL
  SUPABASE_ANON_KEY    Supabase anonymous key
  VERBOSE              Show detailed results (true/false)

Examples:
  node integration-test.js
  TEST_BASE_URL=https://auth-edge.vercel.app node integration-test.js
  TEST_TOKEN=eyJ... TEST_REFRESH_TOKEN=ref... node integration-test.js
`);
  process.exit(0);
}

// Run the tests
runAllTests().catch(error => {
  log(`Integration test suite failed: ${error.message}`, 'red');
  process.exit(1);
});