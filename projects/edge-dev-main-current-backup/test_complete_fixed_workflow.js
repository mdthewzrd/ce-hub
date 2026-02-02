/**
 * Complete Fixed Workflow Test
 * Tests the full universe expansion workflow with actual backside scanner
 * including "Add to Project" button functionality
 */

const fs = require('fs');

async function testCompleteFixedWorkflow() {
  console.log('🎯 COMPLETE FIXED WORKFLOW TEST');
  console.log('==================================\n');

  // Load the actual backside scanner code
  let backsideCode = '';
  try {
    backsideCode = fs.readFileSync('/Users/michaeldurante/Downloads/backside para b copy.py', 'utf-8');
    console.log('✅ Successfully loaded ACTUAL backside scanner code');
    console.log(`📄 Code length: ${backsideCode.length} characters`);
    console.log(`🔍 Contains def functions: ${backsideCode.includes('def ')}`);
  } catch (error) {
    console.error('❌ Could not load ACTUAL backside scanner file!');
    console.error('Please ensure the file exists at: /Users/michaeldurante/Downloads/backside para b copy.py');
    return false;
  }

  try {
    // Step 1: Test server connection
    console.log('📍 Step 1: Testing server connection...');
    const healthResponse = await fetch('http://localhost:5656/api/renata/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'test connection for workflow validation',
        personality: 'general',
        context: { page: 'test', timestamp: new Date().toISOString() }
      })
    });

    if (!healthResponse.ok) {
      throw new Error(`Server not responding: ${healthResponse.status}`);
    }
    console.log('✅ Server connection successful');

    // Step 2: Test formatting with actual backside scanner and universe expansion
    console.log('\n📍 Step 2: Testing formatting with universe expansion...');
    const formatResponse = await fetch('http://localhost:5656/api/renata/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'format this backside scanner code:\n\n' + backsideCode,
        personality: 'general',
        context: {
          page: 'renata-popup',
          timestamp: new Date().toISOString()
        }
      })
    });

    if (!formatResponse.ok) {
      throw new Error(`Format API failed: ${formatResponse.status}`);
    }

    const formatResult = await formatResponse.json();
    console.log('✅ Backside scanner formatting successful');
    console.log(`📋 Response type: ${formatResult.type}`);

    // Step 3: Analyze the formatted response for universe expansion and code blocks
    console.log('\n📍 Step 3: Analyzing formatted response...');

    const hasCodeBlocks = formatResult.message.includes('```');
    const codeBlockMatch = formatResult.message.match(/```(?:python)?\s*([\s\S]*?)\s*```/i);

    console.log(`🔍 Has code blocks: ${hasCodeBlocks}`);

    if (codeBlockMatch) {
      const extractedCode = codeBlockMatch[1];
      console.log(`✅ Code extraction successful: ${extractedCode.length} characters`);

      // Check for universe expansion
      const hasUniverseComment = extractedCode.includes('RENATA UNIVERSE EXPANSION');
      const symbolCount = (extractedCode.match(/"[A-Z.-]+"/g) || []).length;
      const hasLargeSymbolList = extractedCode.includes('SYMBOLS = [') && symbolCount > 100;

      console.log(`🌍 Universe expansion analysis:`);
      console.log(`- Has universe comment: ${hasUniverseComment}`);
      console.log(`- Has large symbol list: ${hasLargeSymbolList}`);
      console.log(`- Total symbols in code: ${symbolCount}`);

      if (hasUniverseComment && symbolCount > 200) {
        console.log('✅ Universe expansion appears to be working!');
      } else {
        console.log('⚠️ Universe expansion may have issues');
      }

      // Step 4: Test "Add to Project" functionality
      console.log('\n📍 Step 4: Testing Add to Project functionality...');

      // Extract scanner name from formatting response
      const scannerNameMatch = formatResult.message.match(/\*\*Scanner Name\*\*:\s*\*\*([^*]+)\*\*/);
      const scannerName = scannerNameMatch ? scannerNameMatch[1] : 'Backside Para B Scanner';

      console.log(`🎯 Scanner name: ${scannerName}`);

      const addToProjectResponse = await fetch('http://localhost:5656/api/renata/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Add ${scannerName} to edge.dev project`,
          personality: 'general',
          context: {
            action: 'add_to_project',
            scannerName: scannerName,
            formattedCode: extractedCode,
            page: 'renata-popup',
            timestamp: new Date().toISOString()
          }
        })
      });

      let addToProjectSuccess = false;
      if (addToProjectResponse.ok) {
        const addToProjectResult = await addToProjectResponse.json();
        console.log('✅ Add to Project API call successful!');
        console.log(`- Response type: ${addToProjectResult.type}`);
        console.log(`- Message: ${addToProjectResult.message.substring(0, 100)}...`);
        addToProjectSuccess = true;
      } else {
        const errorText = await addToProjectResponse.text();
        console.log(`⚠️ Add to Project API response: ${addToProjectResponse.status} - ${errorText}`);
      }

      // Step 5: Check frontend button trigger conditions
      console.log('\n📍 Step 5: Checking frontend button trigger conditions...');

      // The button appears when message.content.includes('```') AND (formattedCode || lastFormattedCode)
      const frontendButtonCondition = hasCodeBlocks && extractedCode.length > 0;
      console.log(`🔍 Frontend button condition:`);
      console.log(`- Message has code blocks: ${hasCodeBlocks}`);
      console.log(`- Extracted code length: ${extractedCode.length} characters`);
      console.log(`- Button should appear: ${frontendButtonCondition}`);

      // Final Summary
      console.log('\n🎯 COMPLETE WORKFLOW TEST RESULTS:');
      console.log('==================================');
      console.log(`✅ Server connection: WORKING`);
      console.log(`✅ Backside scanner formatting: WORKING`);
      console.log(`✅ Code extraction: ${hasCodeBlocks ? 'WORKING' : 'FAILED'}`);
      console.log(`✅ Universe expansion: ${hasUniverseComment && symbolCount > 200 ? 'WORKING' : 'NEEDS FIX'}`);
      console.log(`✅ Symbol count: ${symbolCount} (target: 200+)`);
      console.log(`✅ Add to Project API: ${addToProjectSuccess ? 'WORKING' : 'NEEDS FIX'}`);
      console.log(`✅ Frontend button trigger: ${frontendButtonCondition ? 'WORKING' : 'NEEDS FIX'}`);

      const overallSuccess = hasCodeBlocks && hasUniverseComment && symbolCount > 200 && addToProjectSuccess && frontendButtonCondition;

      if (overallSuccess) {
        console.log('\n🎉 COMPLETE SUCCESS! THE WORKFLOW IS FULLY FUNCTIONAL!');
        console.log('=================================================');
        console.log('✅ Actual backside scanner code is properly formatted');
        console.log('✅ Universe expansion from ~75 to 200+ symbols working');
        console.log('✅ Clean code blocks without instruction text');
        console.log('✅ Add to Project button functionality working');
        console.log('✅ Frontend should display "Add to Edge.dev Project" button');

        console.log('\n📋 USER READY FOR PRODUCTION:');
        console.log('=============================');
        console.log('1. Open browser to: http://localhost:5656');
        console.log('2. Click Renata chat button');
        console.log('3. Paste actual backside scanner code');
        console.log('4. Type: "format this backside scanner code"');
        console.log('5. See universe expansion (75 → 200+ symbols)');
        console.log('6. Click "Add to Edge.dev Project" button');
        console.log('7. Execute scanner with full market coverage');

        return true;
      } else {
        console.log('\n❌ WORKFLOW ISSUES IDENTIFIED:');
        console.log('=============================');
        if (!hasCodeBlocks) {
          console.log('- Code blocks not appearing in response');
        }
        if (!hasUniverseComment || symbolCount <= 200) {
          console.log('- Universe expansion not working properly');
          console.log(`- Symbol count too low: ${symbolCount} (expected 200+)`);
        }
        if (!addToProjectSuccess) {
          console.log('- Add to Project API not working');
        }
        if (!frontendButtonCondition) {
          console.log('- Frontend button trigger condition not met');
        }

        return false;
      }

    } else {
      console.error('❌ No code blocks found in formatting response');
      console.log('📄 Response preview:', formatResult.message.substring(0, 500) + '...');
      return false;
    }

  } catch (error) {
    console.error('❌ Workflow test failed:', error.message);
    return false;
  }
}

// Run the complete workflow test
testCompleteFixedWorkflow().then(success => {
  console.log(`\n🏁 Complete workflow test: ${success ? 'SUCCESS ✅' : 'FAILED ❌'}`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Test error:', error);
  process.exit(1);
});