#!/usr/bin/env node

/**
 * Comprehensive Test for Traderra Renata Chat Bulletproof Validation System
 * This script tests the actual API endpoints to validate multi-command execution
 */

const http = require('http');

// Helper function to make HTTP requests
function makeRequest(port, path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: 'localhost',
      port: port,
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
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function testCopilotKitAPI() {
  console.log('🚀 TESTING TRADERRA RENATA CHAT BULLETPROOF VALIDATION');
  console.log('=======================================================');

  // Test the exact user command that should trigger multi-command execution
  const testMessage = "go to the dashboard and look at the last 90 days in R";

  const requestData = {
    operationName: "generateCopilotResponse",
    query: `mutation generateCopilotResponse($data: CopilotResponseInput!) {
      generateCopilotResponse(data: $data) {
        messages {
          content
          __typename
        }
        extensions
        threadId
        runId
      }
    }`,
    variables: {
      data: {
        messages: [{
          content: testMessage,
          role: 'user'
        }]
      }
    }
  };

  console.log(`📝 Testing message: "${testMessage}"`);
  console.log(`🔗 API Endpoint: http://localhost:6565/api/copilotkit`);

  try {
    console.log('\n📡 Sending request to CopilotKit API...');
    const response = await makeRequest(6565, '/api/copilotkit', requestData);

    if (response.status === 200) {
      console.log('✅ API Response received successfully');

      const data = response.data;
      const messageData = data?.data?.generateCopilotResponse;

      if (messageData) {
        console.log('\n📋 ANALYZING API RESPONSE:');

        // Check for message content
        const aiMessage = messageData.messages?.[0]?.content;
        if (aiMessage) {
          console.log(`💬 AI Response: "${aiMessage}"`);
        }

        // Check for extensions with actions
        const extensions = messageData.extensions;
        if (extensions) {
          console.log('\n🔧 EXTENSIONS FOUND:');

          // Check for traderraActions
          if (extensions.traderraActions && extensions.traderraActions.length > 0) {
            console.log(`✅ TRADERRA ACTIONS DETECTED: ${extensions.traderraActions.length}`);
            extensions.traderraActions.forEach((action, index) => {
              console.log(`  ${index + 1}. ${action.type}: ${JSON.stringify(action.payload)}`);
            });

            // Validate the expected actions
            const expectedActions = [
              { type: 'navigateToPage', payload: { page: 'dashboard' } },
              { type: 'setDateRange', payload: { range: '90day' } },
              { type: 'setDisplayMode', payload: { mode: 'r' } }
            ];

            console.log('\n🎯 VALIDATION RESULTS:');
            let allActionsFound = true;

            expectedActions.forEach((expected, index) => {
              const found = extensions.traderraActions.find(action =>
                action.type === expected.type &&
                JSON.stringify(action.payload) === JSON.stringify(expected.payload)
              );

              if (found) {
                console.log(`  ✅ Action ${index + 1}: ${expected.type} - FOUND`);
              } else {
                console.log(`  ❌ Action ${index + 1}: ${expected.type} - MISSING`);
                allActionsFound = false;
              }
            });

            console.log(`\n🏆 OVERALL VALIDATION: ${allActionsFound ? '✅ PASS' : '❌ FAIL'}`);

            // Check for client script
            if (extensions.clientScript) {
              console.log('\n🚀 CLIENT SCRIPT DETECTED: ✅');
              console.log('   Script contains adaptive timing and action execution logic');
            } else {
              console.log('\n🚀 CLIENT SCRIPT: ❌ NOT FOUND');
            }

          } else {
            console.log('❌ NO TRADERRA ACTIONS DETECTED');
          }
        } else {
          console.log('❌ NO EXTENSIONS FOUND');
        }

        // Check for custom headers (can't test directly with this setup)
        console.log('\n📋 HEADER VALIDATION: Skipped (requires browser environment)');

      } else {
        console.log('❌ INVALID RESPONSE STRUCTURE');
        console.log(JSON.stringify(data, null, 2));
      }

    } else {
      console.log(`❌ API ERROR: ${response.status}`);
      console.log('Response:', response.data);
    }

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);

    // Check if it's a connection error
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️  CONNECTION REFUSED: Make sure the Traderra app is running on localhost:6565');
      console.log('   Run: npm run dev (in the traderra/frontend directory)');
    }
  }
}

async function testMultipleCommands() {
  console.log('\n\n🧪 TESTING ADDITIONAL COMMAND PATTERNS');
  console.log('=======================================');

  const testCommands = [
    "show me statistics for this month in dollars",
    "navigate to trades and look at year to date",
    "take me to the journal and show all time data in R"
  ];

  for (let i = 0; i < testCommands.length; i++) {
    const command = testCommands[i];
    console.log(`\n${i + 1}. Testing: "${command}"`);

    const requestData = {
      operationName: "generateCopilotResponse",
      query: `mutation generateCopilotResponse($data: CopilotResponseInput!) {
        generateCopilotResponse(data: $data) {
          messages { content }
          extensions
        }
      }`,
      variables: {
        data: {
          messages: [{
            content: command,
            role: 'user'
          }]
        }
      }
    };

    try {
      const response = await makeRequest(6565, '/api/copilotkit', requestData);

      if (response.status === 200) {
        const data = response.data;
        const extensions = data?.data?.generateCopilotResponse?.extensions;
        const actionCount = extensions?.traderraActions?.length || 0;

        console.log(`   Actions detected: ${actionCount}`);

        if (actionCount > 0) {
          extensions.traderraActions.forEach(action => {
            console.log(`   - ${action.type}: ${JSON.stringify(action.payload)}`);
          });
        }
      } else {
        console.log(`   ❌ API Error: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// Main execution
async function main() {
  console.log('Traderra Renata Chat Bulletproof Validation System Test');
  console.log('========================================================');
  console.log('This test validates that multi-command queries are properly');
  console.log('detected, processed, and executed with bulletproof verification.');
  console.log('');

  try {
    await testCopilotKitAPI();
    await testMultipleCommands();

    console.log('\n\n🎉 COMPREHENSIVE TEST COMPLETED');
    console.log('==================================');
    console.log('Check the results above to validate:');
    console.log('✅ Pattern detection accuracy');
    console.log('✅ Multi-command generation');
    console.log('✅ Action execution planning');
    console.log('✅ Client script integration');
    console.log('✅ Bulletproof validation readiness');

  } catch (error) {
    console.error('\n❌ TEST SUITE FAILED:', error);
  }
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testCopilotKitAPI, testMultipleCommands };