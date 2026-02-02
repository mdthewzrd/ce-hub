const fetch = require('node-fetch');

async function testFunctionRouting() {
  console.log('🔧 TESTING FUNCTION ROUTING FIX');
  console.log('==================================');

  // Load project data to get the exact scanner code and functionName
  const fs = require('fs');
  const path = require('path');
  const projectsData = JSON.parse(fs.readFileSync(
    path.join(__dirname, 'projects/edge-dev-main/data/projects.json'),
    'utf8'
  ));

  const backsideProject = projectsData.find(p => p.id === '1765041068338');

  if (!backsideProject) {
    console.error('❌ Project not found');
    return;
  }

  console.log('📋 Project Details:');
  console.log(`  Name: ${backsideProject.name}`);
  console.log(`  Function Name: ${backsideProject.functionName}`);
  console.log(`  Code Length: ${backsideProject.code.length} chars`);

  // Test the exact request that should be sent
  const requestBody = {
    uploaded_code: backsideProject.code,
    scanner_type: 'uploaded',
    start_date: '2025-01-01',
    end_date: '2025-11-01',
    function_name: backsideProject.functionName, // This should be 'main_sync'
    parallel_execution: true,
    timeout_seconds: 180
  };

  console.log('\n🔍 Request Body:');
  console.log(JSON.stringify(requestBody, null, 2));

  try {
    console.log('\n🚀 Sending direct request to backend...');
    const response = await fetch('http://localhost:8000/api/scan/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      timeout: 180000
    });

    const result = await response.json();

    console.log('\n📊 Backend Response:');
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(result, null, 2));

    if (result.success && result.results && result.results.length > 0) {
      console.log('\n✅ SUCCESS - Real results found!');
      console.log(`Results count: ${result.results.length}`);
      console.log('Sample results:');
      result.results.slice(0, 3).forEach((r, i) => {
        console.log(`  ${i+1}. ${r.ticker} - Gap: ${r.gap_percent}% - Volume: ${r.volume?.toLocaleString() || 'N/A'}`);
      });
    } else {
      console.log('\n❌ FAILED - No results returned');
      if (result.error) console.log('Error:', result.error);
    }

  } catch (error) {
    console.error('\n💥 Request failed:', error.message);
  }
}

// Test both backend direct and frontend API routes
async function testCompleteRouting() {
  console.log('\n\n🌐 TESTING COMPLETE FRONTEND ROUTING');
  console.log('===================================');

  try {
    console.log('🚀 Testing frontend API route...');
    const response = await fetch('http://localhost:5656/api/projects/1765041068338/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        date_range: {
          start_date: '2025-01-01',
          end_date: '2025-11-01'
        },
        timeout_seconds: 180
      }),
      timeout: 180000
    });

    const result = await response.json();

    console.log(`Frontend Status: ${response.status}`);
    console.log('Frontend Response:', JSON.stringify(result, null, 2));

    if (result.success && result.results && result.results.length > 0) {
      console.log('\n✅ FRONTEND SUCCESS - Real results found!');
      console.log(`Results count: ${result.results.length}`);
    } else {
      console.log('\n❌ FRONTEND FAILED - No results returned');
    }

  } catch (error) {
    console.error('\n💥 Frontend request failed:', error.message);
  }
}

// Execute tests
testFunctionRouting()
  .then(() => testCompleteRouting())
  .catch(console.error);