#!/usr/bin/env node

const http = require('http');

function testChatAPI(message) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      message: message,
      personality: 'optimizer',
      context: { page: 'test', timestamp: new Date().toISOString() }
    });

    const options = {
      hostname: 'localhost',
      port: 5656,
      path: '/api/renata/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            response: response
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            error: 'JSON Parse Error',
            rawBody: body
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('Testing GLM 4.5 detection...\n');

  const tests = [
    { message: 'hello', expected: 'openrouter' },
    { message: 'build a momentum scanner', expected: 'glm4' },
    { message: 'create scanner', expected: 'glm4' },
    { message: 'debug my code', expected: 'glm4' },
    { message: 'format this scanner', expected: 'format' }
  ];

  for (const test of tests) {
    try {
      console.log(`Testing: "${test.message}"`);
      const startTime = Date.now();

      const result = await testChatAPI(test.message);
      const endTime = Date.now();

      console.log(`  Status: ${result.statusCode}`);
      console.log(`  Time: ${endTime - startTime}ms`);

      if (result.response) {
        console.log(`  Type: ${result.response.type}`);
        console.log(`  AI Engine: ${result.response.ai_engine || 'OpenRouter'}`);
        console.log(`  Response Length: ${result.response.message ? result.response.message.length : 0} chars`);

        // Check if it matches expected behavior
        const isGLM4 = result.response.ai_engine === 'GLM 4.5';
        const isExpectedGLM4 = test.expected === 'glm4';
        const matches = (isGLM4 && isExpectedGLM4) || (!isGLM4 && !isExpectedGLM4);

        console.log(`  Expected GLM4: ${isExpectedGLM4 ? 'Yes' : 'No'}`);
        console.log(`  Got GLM4: ${isGLM4 ? 'Yes' : 'No'}`);
        console.log(`  Match: ${matches ? '✅' : '❌'}`);
      } else {
        console.log(`  Error: ${result.error}`);
      }

    } catch (error) {
      console.log(`  ❌ Failed: ${error.message}`);
    }

    console.log('');
  }
}

runTests().catch(console.error);