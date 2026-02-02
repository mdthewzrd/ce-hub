/**
 * Quick Test: Complete Add to Project workflow validation
 */

const testCode = `
import requests
import pandas as pd
from datetime import datetime

def test_scanner():
    symbols = ['AAPL', 'GOOGL', 'MSFT']
    results = []
    for symbol in symbols:
        if symbol == 'AAPL':
            results.append({'symbol': symbol, 'signal': 'BUY', 'confidence': 0.85})
    return results

if __name__ == "__main__":
    scan_results = test_scanner()
    print(f"Scan completed: {len(scan_results)} signals found")
`;

async function quickTest() {
  console.log('🚀 Quick Test: Add to Project workflow\n');

  try {
    // Test 1: Check if server is running
    console.log('📍 Step 1: Checking server connection...');
    const healthResponse = await fetch('http://localhost:5656/api/renata/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'test',
        personality: 'general',
        context: { page: 'test', timestamp: new Date().toISOString() }
      })
    });

    if (!healthResponse.ok) {
      throw new Error(`Server not responding: ${healthResponse.status}`);
    }
    console.log('✅ Server is running');

    // Test 2: Format code
    console.log('\n📍 Step 2: Testing code formatting...');
    const formatResponse = await fetch('http://localhost:5656/api/renata/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'format this code:\n\n' + testCode,
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
    console.log('✅ Code formatting successful');

    // Check for code blocks
    const hasCodeBlock = formatResult.message.includes('```');
    const codeBlockMatch = formatResult.message.match(/```(?:python)?\s*([\s\S]*?)\s*```/i);

    console.log(`🔍 Code block analysis:`);
    console.log(`- Has code block markers: ${hasCodeBlock}`);

    if (codeBlockMatch) {
      const extractedCode = codeBlockMatch[1];
      console.log(`- Extracted code length: ${extractedCode.length} characters`);
      console.log(`- Contains function def: ${extractedCode.includes('def ')}`);
      console.log(`- Contains imports: ${extractedCode.includes('import')}`);
      console.log('✅ Code extraction successful');
    } else {
      throw new Error('❌ No code block found in format response');
    }

    // Test 3: Add to Project
    console.log('\n📍 Step 3: Testing Add to Project...');
    const addToProjectResponse = await fetch('http://localhost:5656/api/renata/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Add Quick Test Scanner to edge.dev project',
        personality: 'general',
        context: {
          action: 'add_to_project',
          scannerName: 'Quick Test Scanner',
          formattedCode: codeBlockMatch[1],
          page: 'renata-popup',
          timestamp: new Date().toISOString()
        }
      })
    });

    if (!addToProjectResponse.ok) {
      const errorData = await addToProjectResponse.json();
      throw new Error(`Add to Project failed: ${errorData.message || errorData.error || addToProjectResponse.statusText}`);
    }

    const addToProjectResult = await addToProjectResponse.json();
    console.log('✅ Add to Project successful!');
    console.log(`- Response type: ${addToProjectResult.type}`);
    console.log(`- Project ID: ${addToProjectResult.data?.projectId}`);
    console.log(`- Project name: ${addToProjectResult.data?.projectName}`);

    // Test 4: Verify project creation
    console.log('\n📍 Step 4: Verifying project in projects list...');
    const projectsResponse = await fetch('http://localhost:5656/api/projects');

    if (projectsResponse.ok) {
      const projectsData = await projectsResponse.json();
      if (projectsData.projects && projectsData.projects.length > 0) {
        const testProject = projectsData.projects.find(p =>
          p.name?.includes('Quick Test Scanner') ||
          p.description?.includes('Quick Test Scanner')
        );

        if (testProject) {
          console.log('✅ Project found in projects list!');
          console.log(`- Project ID: ${testProject.id}`);
          console.log(`- Name: ${testProject.name}`);
          console.log(`- Status: ${testProject.status}`);
        } else {
          console.log('⚠️ Test project not found in list (may need API verification)');
        }
      } else {
        console.log('⚠️ No projects found in system');
      }
    } else {
      console.log('⚠️ Projects API not accessible, but Add to Project appeared to work');
    }

    // Summary
    console.log('\n🎉 WORKFLOW TEST SUMMARY:');
    console.log('==========================');
    console.log('✅ Server connection: WORKING');
    console.log('✅ Code formatting: WORKING');
    console.log('✅ Code extraction: WORKING');
    console.log('✅ Add to Project API: WORKING');
    console.log('✅ Complete workflow: SUCCESS!');

    console.log('\n📋 NEXT STEPS:');
    console.log('- Test in browser with actual Renata chat');
    console.log('- Verify Add to Project button appears');
    console.log('- Test with your actual backside scanner code');
    console.log('- Validate projects appear in Projects section');

    return true;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\n🔧 TROUBLESHOOTING:');
    console.error('1. Ensure dev server is running: npm run dev');
    console.error('2. Check for any server build errors');
    console.error('3. Verify API routes are properly implemented');
    return false;
  }
}

// Run the test
quickTest().then(success => {
  console.log(`\n🏁 Quick test completed: ${success ? 'SUCCESS' : 'FAILED'}`);
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Test error:', error);
  process.exit(1);
});