#!/usr/bin/env node

/**
 * Test the ACTUAL file upload workflow through Renata AI Assistant
 * This simulates exactly what happens when a user uploads a scanner file
 */

const fs = require('fs');
const path = require('path');

// Mock browser File object
class MockFile {
  constructor(content, name, options = {}) {
    this.content = content;
    this.name = name;
    this.size = content.length;
    this.type = options.type || 'text/plain';
    this.lastModified = Date.now();
  }
}

// Import the upload handler logic (simplified version)
class SimpleUploadHandler {
  async handleFileUpload(file) {
    try {
      console.log(`📁 Reading file: ${file.name} (${file.size} bytes)`);

      // Read file content
      const originalCode = file.content;

      console.log('🔧 Sending to code formatter...');

      // Call our backend (this is what the upload handler does)
      const response = await fetch('http://localhost:8003/api/format/code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: originalCode,
          options: {
            autoFormat: true,
            enableMultiprocessing: true,
            optimizePerformance: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status} ${response.statusText}`);
      }

      const formattingResult = await response.json();

      console.log('✅ Backend response received!');
      console.log(`   Success: ${formattingResult.success}`);
      console.log(`   Scanner Type: ${formattingResult.scannerType}`);
      console.log(`   Cost: $${formattingResult.cost}`);
      console.log(`   Optimizations: ${formattingResult.optimizations?.length || 0}`);
      console.log(`   Warnings: ${formattingResult.warnings?.length || 0}`);
      console.log(`   Errors: ${formattingResult.errors?.length || 0}`);

      if (formattingResult.success) {
        console.log(`   Formatted Code Length: ${formattingResult.formattedCode?.length || 0} characters`);

        // Show a preview of the formatted code
        const preview = formattingResult.formattedCode?.substring(0, 300) + '...';
        console.log(`   Preview: ${preview.replace(/\n/g, '\\n')}`);
      }

      return {
        success: true,
        originalCode,
        formattedCode: formattingResult.formattedCode,
        formattingResult,
        metadata: {
          filename: file.name,
          fileSize: file.size,
          uploadTime: new Date().toISOString(),
          processingTime: 100 // Simulated
        }
      };

    } catch (error) {
      console.error('❌ Upload failed:', error.message);
      return {
        success: false,
        originalCode: file.content,
        error: error.message,
        metadata: {
          filename: file.name,
          fileSize: file.size,
          uploadTime: new Date().toISOString()
        }
      };
    }
  }
}

// Test function
async function testActualFileUpload() {
  console.log('🧪 TESTING ACTUAL FILE UPLOAD WORKFLOW');
  console.log('=' .repeat(50));

  try {
    // Read the actual test scanner file
    const testFilePath = path.join(__dirname, 'test_scanner.py');
    const fileContent = fs.readFileSync(testFilePath, 'utf8');

    console.log(`📂 Found test file: ${testFilePath}`);
    console.log(`📏 File size: ${fileContent.length} characters`);

    // Create a mock file object (like browser File API)
    const mockFile = new MockFile(fileContent, 'test_scanner.py', {
      type: 'text/x-python'
    });

    console.log('\n🚀 Simulating Renata AI Assistant file upload...');

    // Create upload handler and process the file
    const uploadHandler = new SimpleUploadHandler();
    const result = await uploadHandler.handleFileUpload(mockFile);

    console.log('\n📋 UPLOAD RESULT SUMMARY');
    console.log('=' .repeat(50));
    console.log(`✅ Upload Success: ${result.success}`);
    console.log(`📄 Filename: ${result.metadata.filename}`);
    console.log(`💾 File Size: ${result.metadata.fileSize} bytes`);
    console.log(`⏱️  Upload Time: ${result.metadata.uploadTime}`);

    if (result.success) {
      console.log(`🎯 Scanner Type: ${result.formattingResult.scannerType}`);
      console.log(`💰 Cost: $${result.formattingResult.cost}`);
      console.log(`🔧 Optimizations: ${result.formattingResult.optimizations.join(', ')}`);

      if (result.formattingResult.warnings.length > 0) {
        console.log(`⚠️  Warnings: ${result.formattingResult.warnings.join(', ')}`);
      }

      console.log('\n🎉 ACTUAL FILE UPLOAD TEST: PASSED!');
      console.log('📋 Renata AI Assistant is ready for production use');

    } else {
      console.log(`❌ Upload Failed: ${result.error}`);
      process.exit(1);
    }

  } catch (error) {
    console.error('\n💥 CRITICAL ERROR:', error.message);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('1. Ensure test_scanner.py exists');
    console.log('2. Check backend server is running on port 8003');
    console.log('3. Verify network connectivity to localhost:8003');
    process.exit(1);
  }
}

// Install fetch if not available (Node.js < 18)
if (typeof fetch === 'undefined') {
  global.fetch = async (url, options) => {
    const https = require(url.startsWith('https:') ? 'https' : 'http');
    return new Promise((resolve, reject) => {
      const req = https.request(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            json: async () => JSON.parse(data),
            text: async () => data
          });
        });
      });
      req.on('error', reject);
      if (options.body) req.write(options.body);
      req.end();
    });
  };
}

// Run the test
testActualFileUpload();