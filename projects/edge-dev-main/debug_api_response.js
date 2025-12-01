#!/usr/bin/env node

/**
 * Debug API response format for Backside B scanner
 */

const fs = require('fs');

function makeRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const http = require('http');

    const options = {
      hostname: 'localhost',
      port: 5656,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log(`🌐 HTTP Status: ${res.statusCode}`);
        console.log(`📦 Response Headers:`, res.headers);
        console.log(`📄 Raw Response (${responseData.length} chars):`);
        console.log(responseData);
        console.log('\n' + '='.repeat(50) + '\n');

        try {
          const parsed = JSON.parse(responseData);
          console.log(`✅ Valid JSON parsed successfully`);
          resolve(parsed);
        } catch (e) {
          console.log(`❌ Invalid JSON: ${e.message}`);
          resolve(responseData);
        }
      });
    });

    req.on('error', (e) => {
      console.error('❌ Request error:', e.message);
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

async function debugAPI() {
  console.log('🔍 Debugging API Response Format');
  console.log('==================================');

  try {
    // Read the Backside B file
    const filePath = '/Users/michaeldurante/Downloads/backside para b copy.py';
    const codeContent = fs.readFileSync(filePath, 'utf8');

    console.log('📝 Test 1: Format Request');
    console.log('Sending format request...');

    const formatMessage = `format this code\n\n--- File: backside para b copy.py ---\n${codeContent}`;

    const formatResponse = await makeRequest('/api/renata/chat', {
      message: formatMessage,
      context: {
        action: 'format'
      }
    });

    console.log('🎯 Test 2: Project Integration Request');
    console.log('Sending project integration request...');

    const projectResponse = await makeRequest('/api/renata/chat', {
      message: 'Add Backside B to edge.dev project',
      context: {
        action: 'add_to_project',
        scannerName: 'Backside B'
      }
    });

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugAPI();