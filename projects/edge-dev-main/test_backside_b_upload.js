#!/usr/bin/env node

/**
 * Test uploading Backside B scanner to the web interface
 */

const fs = require('fs');
const http = require('http');
const path = require('path');

function makeRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

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
        try {
          const parsed = JSON.parse(responseData);
          resolve(parsed);
        } catch (e) {
          resolve(responseData);
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

async function testBacksideBUpload() {
  console.log('🧪 Testing Backside B Scanner Upload');
  console.log('=====================================');

  try {
    // Read the Backside B file
    const filePath = '/Users/michaeldurante/Downloads/backside para b copy.py';
    const codeContent = fs.readFileSync(filePath, 'utf8');

    console.log(`📁 Read file: ${path.basename(filePath)}`);
    console.log(`📊 File size: ${codeContent.length} chars, ${codeContent.split('\n').length} lines`);

    // Step 1: Test formatting the Backside B code
    console.log('\n📝 Step 1: Testing AI Formatting...');
    const formatMessage = `format this code\n\n--- File: backside para b copy.py ---\n${codeContent}`;

    const formatStartTime = Date.now();
    const formatResponse = await makeRequest('/api/renata/chat', {
      message: formatMessage,
      context: {
        action: 'format'
      }
    });
    const formattingTime = Date.now() - formatStartTime;

    console.log(`⏱️ Formatting completed in ${formattingTime}ms`);
    console.log(`🤖 AI Processing: ${formattingTime > 2000 ? 'REAL AI' : 'INSTANT (local formatting)'}`);
    console.log(`📋 Response type: ${formatResponse.type || 'unknown'}`);
    console.log(`✅ Success: ${formatResponse.success || false}`);

    if (formatResponse.formattedCode) {
      console.log(`📝 Formatted code length: ${formatResponse.formattedCode.length} chars`);
    }

    // Step 2: Test project integration
    console.log('\n🎯 Step 2: Testing Project Integration...');
    const projectResponse = await makeRequest('/api/renata/chat', {
      message: 'Add Backside B to edge.dev project',
      context: {
        action: 'add_to_project',
        scannerName: 'Backside B'
      }
    });

    console.log(`📋 Project Integration Response:`);
    console.log(`   Success: ${projectResponse.success || false}`);
    console.log(`   Type: ${projectResponse.type || 'unknown'}`);
    if (projectResponse.context) {
      console.log(`   MCP Used: ${projectResponse.context.archonMCPUsed || false}`);
      console.log(`   Project ID: ${projectResponse.context.projectId || 'N/A'}`);
    }

    // Step 3: Summary
    console.log('\n🎉 Test Summary:');
    console.log(`   Formatting Speed: ${formattingTime}ms (${formattingTime > 2000 ? 'REAL AI' : 'LOCAL'})`);
    console.log(`   Formatting Success: ${formatResponse.success ? 'YES' : 'NO'}`);
    console.log(`   Project Integration: ${projectResponse.success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`   Overall Status: ${formatResponse.success && projectResponse.success ? 'WORKING' : 'NEEDS FIXES'}`);

    // Step 4: Check if projects were created
    console.log('\n📁 Step 4: Checking Project Files...');
    const projectsDir = '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/projects-data';
    if (fs.existsSync(projectsDir)) {
      const files = fs.readdirSync(projectsDir).filter(f => f.endsWith('.json'));
      console.log(`✅ Projects directory exists with ${files.length} project files:`);
      files.forEach(file => {
        const projectPath = path.join(projectsDir, file);
        const projectData = JSON.parse(fs.readFileSync(projectPath, 'utf8'));
        console.log(`   - ${file}: ${projectData.title} (${projectData.scanners?.length || 0} scanners)`);
      });
    } else {
      console.log('❌ Projects directory not found');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testBacksideBUpload();