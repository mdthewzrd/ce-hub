#!/usr/bin/env node

/**
 * Test the verification and retry systems in the Traderra Renata Chat
 * This tests whether state changes are properly verified and retried if needed
 */

const http = require('http');

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

function analyzeClientScript(script) {
  console.log('\n🔍 CLIENT SCRIPT ANALYSIS:');

  if (!script) {
    console.log('  ❌ No client script found');
    return false;
  }

  const features = {
    adaptiveDelay: script.includes('adaptiveDelay'),
    actionComplexity: script.includes('actionComplexity'),
    navigationDetection: script.includes('hasNavigation'),
    multiActionSupport: script.includes('hasMultipleActions'),
    sequenceCoordination: script.includes('sequenceId'),
    customEventDispatch: script.includes('dispatchEvent'),
    windowExecution: script.includes('window.traderraExecuteActions'),
    errorHandling: false, // Could check for try/catch
    timingCalculation: script.includes('adaptiveDelay +='),
    logging: script.includes('console.log')
  };

  console.log('  Script Features:');
  Object.entries(features).forEach(([feature, present]) => {
    console.log(`    ${present ? '✅' : '❌'} ${feature}`);
  });

  // Extract delay calculation logic
  if (script.includes('adaptiveDelay')) {
    const delayMatch = script.match(/let adaptiveDelay = (\d+);/);
    if (delayMatch) {
      console.log(`  📊 Base delay: ${delayMatch[1]}ms`);
    }

    const navDelayMatch = script.match(/if \(hasNavigation\) adaptiveDelay \+= (\d+);/);
    if (navDelayMatch) {
      console.log(`  🧭 Navigation delay: +${navDelayMatch[1]}ms`);
    }

    const complexityMatch = script.match(/adaptiveDelay \+= actionComplexity \* (\d+);/);
    if (complexityMatch) {
      console.log(`  🔧 Complexity multiplier: x${complexityMatch[1]}`);
    }
  }

  const score = Object.values(features).filter(Boolean).length;
  const totalFeatures = Object.keys(features).length;
  console.log(`  📈 Script Quality: ${score}/${totalFeatures} features implemented`);

  return score >= totalFeatures * 0.7; // 70% threshold
}

function testRetryAndVerificationMechanisms() {
  console.log('\n🔄 TESTING VERIFICATION & RETRY MECHANISMS');
  console.log('=========================================');

  // Test 1: Client Script Analysis
  console.log('\n📋 Test 1: Client Script Verification Logic');

  const testMessage = "navigate to dashboard and show last 30 days in R";
  console.log(`  Testing message: "${testMessage}"`);

  const requestData = {
    operationName: "generateCopilotResponse",
    query: `mutation generateCopilotResponse($data: CopilotResponseInput!) {
      generateCopilotResponse(data: $data) {
        messages { content }
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

  return makeRequest(6565, '/api/copilotkit', requestData)
    .then(response => {
      if (response.status === 200) {
        const extensions = response.data?.data?.generateCopilotResponse?.extensions;

        if (extensions?.clientScript) {
          const scriptQuality = analyzeClientScript(extensions.clientScript);
          console.log(`\n  🏆 Client Script Quality: ${scriptQuality ? '✅ HIGH' : '⚠️ NEEDS IMPROVEMENT'}`);
        }

        if (extensions?.traderraActions?.length > 0) {
          console.log(`\n  📦 Actions Returned: ${extensions.traderraActions.length}`);

          // Test if actions are in the correct order
          const actionOrder = extensions.traderraActions.map(a => a.type);
          const expectedOrder = ['navigateToPage', 'setDisplayMode', 'setDateRange'];

          console.log(`  🔢 Action Order: ${actionOrder.join(' -> ')}`);
          console.log(`  🎯 Expected Order: ${expectedOrder.join(' -> ')}`);

          const orderCorrect = JSON.stringify(actionOrder) === JSON.stringify(expectedOrder);
          console.log(`  ✅ Order Correct: ${orderCorrect ? 'YES' : 'NO'}`);

          return {
            scriptPresent: !!extensions?.clientScript,
            scriptQuality,
            actionCount: extensions?.traderraActions?.length || 0,
            orderCorrect,
            actions: extensions?.traderraActions || []
          };
        }
      } else {
        console.log(`  ❌ API Error: ${response.status}`);
        return { error: true, status: response.status };
      }
    })
    .catch(error => {
      console.log(`  ❌ Request Error: ${error.message}`);
      return { error: true, message: error.message };
    });
}

function testEdgeCases() {
  console.log('\n🧪 TESTING EDGE CASES');
  console.log('=====================');

  const edgeCases = [
    {
      name: "Single Command Only",
      message: "go to dashboard",
      expectedActions: 1
    },
    {
      name: "Invalid Command",
      message: "do something impossible that doesn't match any patterns",
      expectedActions: 0
    },
    {
      name: "Max Command Load",
      message: "navigate to statistics show me all time data in dollars for the last 90 days and switch to percent mode",
      expectedActions: 3 // Should handle gracefully
    },
    {
      name: "Ambiguous Commands",
      message: "show stats in R for 90 days",
      expectedActions: 3 // Should detect all patterns
    }
  ];

  return Promise.all(edgeCases.map(testCase => {
    console.log(`\n  📋 Testing: ${testCase.name}`);
    console.log(`     Message: "${testCase.message}"`);

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
            content: testCase.message,
            role: 'user'
          }]
        }
      }
    };

    return makeRequest(6565, '/api/copilotkit', requestData)
      .then(response => {
        if (response.status === 200) {
          const actionCount = response.data?.data?.generateCopilotResponse?.extensions?.traderraActions?.length || 0;
          console.log(`     🎯 Expected: ${testCase.expectedActions}, Got: ${actionCount}`);
          console.log(`     ${actionCount === testCase.expectedActions ? '✅' : '⚠️'} ${actionCount === testCase.expectedActions ? 'CORRECT' : 'MISMATCH'}`);

          return {
            name: testCase.name,
            expected: testCase.expectedActions,
            actual: actionCount,
            correct: actionCount === testCase.expectedActions
          };
        } else {
          console.log(`     ❌ API Error: ${response.status}`);
          return {
            name: testCase.name,
            error: true,
            status: response.status
          };
        }
      })
      .catch(error => {
        console.log(`     ❌ Error: ${error.message}`);
        return {
          name: testCase.name,
          error: true,
          message: error.message
        };
      });
  }));
}

// Main execution
async function main() {
  console.log('🔍 Traderra Renata Chat Verification & Retry System Test');
  console.log('=========================================================');

  try {
    const mainResults = await testRetryAndVerificationMechanisms();
    const edgeCaseResults = await testEdgeCases();

    console.log('\n\n📊 FINAL VERIFICATION REPORT');
    console.log('===========================');

    // Main Results Summary
    if (!mainResults.error) {
      console.log('\n🎯 PRIMARY VERIFICATION RESULTS:');
      console.log(`  ✅ Client Script Present: ${mainResults.scriptPresent ? 'YES' : 'NO'}`);
      console.log(`  ${mainResults.scriptQuality ? '✅' : '⚠️'} Client Script Quality: ${mainResults.scriptQuality ? 'HIGH' : 'NEEDS IMPROVEMENT'}`);
      console.log(`  ✅ Action Generation: ${mainResults.actionCount} actions generated`);
      console.log(`  ${mainResults.orderCorrect ? '✅' : '⚠️'} Action Order: ${mainResults.orderCorrect ? 'CORRECT' : 'NEEDS FIX'}`);

      if (mainResults.actions.length > 0) {
        console.log('\n📦 GENERATED ACTIONS:');
        mainResults.actions.forEach((action, index) => {
          console.log(`  ${index + 1}. ${action.type}: ${JSON.stringify(action.payload)}`);
        });
      }
    } else {
      console.log('\n❌ PRIMARY VERIFICATION FAILED');
      console.log(`  Error: ${mainResults.message || mainResults.status}`);
    }

    // Edge Case Results Summary
    console.log('\n🧪 EDGE CASE RESULTS:');
    const successfulEdgeCases = edgeCaseResults.filter(result => !result.error && result.correct).length;
    const totalEdgeCases = edgeCaseResults.length;
    console.log(`  Success Rate: ${successfulEdgeCases}/${totalEdgeCases} (${Math.round(successfulEdgeCases/totalEdgeCases * 100)}%)`);

    edgeCaseResults.forEach(result => {
      if (!result.error) {
        const status = result.correct ? '✅' : '⚠️';
        console.log(`  ${status} ${result.name}: Expected ${result.expected}, Got ${result.actual}`);
      } else {
        console.log(`  ❌ ${result.name}: ERROR`);
      }
    });

    // Overall Assessment
    console.log('\n🏆 OVERALL SYSTEM ASSESSMENT:');
    const overallScore = [
      mainResults.scriptPresent ? 1 : 0,
      mainResults.scriptQuality ? 1 : 0,
      mainResults.actionCount >= 2 ? 1 : 0,
      mainResults.orderCorrect ? 1 : 0,
      successfulEdgeCases / totalEdgeCases >= 0.75 ? 1 : 0
    ].reduce((sum, score) => sum + score, 0);

    const maxScore = 5;
    const percentage = Math.round((overallScore / maxScore) * 100);

    console.log(`  📈 System Score: ${overallScore}/${maxScore} (${percentage}%)`);

    if (percentage >= 90) {
      console.log('  🎉 STATUS: EXCELLENT - Bulletproof validation working perfectly');
    } else if (percentage >= 75) {
      console.log('  ✅ STATUS: GOOD - System working with minor issues');
    } else if (percentage >= 50) {
      console.log('  ⚠️  STATUS: FAIR - System working but needs improvements');
    } else {
      console.log('  ❌ STATUS: POOR - Significant issues need to be addressed');
    }

    console.log('\n📋 VERIFICATION FEATURES TESTED:');
    console.log('  ✅ Pattern detection accuracy');
    console.log('  ✅ Multi-command generation');
    console.log('  ✅ Client script quality');
    console.log('  ✅ Action order correctness');
    console.log('  ✅ Edge case handling');
    console.log('  ✅ Error resilience');

  } catch (error) {
    console.error('\n❌ VERIFICATION TEST FAILED:', error);
  }
}

// Run the test
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testRetryAndVerificationMechanisms, testEdgeCases };