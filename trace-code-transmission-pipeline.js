const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function traceCodePipeline() {
  console.log('🔍 TRACING CODE TRANSMISSION PIPELINE');
  console.log('====================================');

  // Step 1: Load the exact code that frontend should send
  const projectsData = JSON.parse(fs.readFileSync(
    path.join(__dirname, 'projects/edge-dev-main/data/projects.json'),
    'utf8'
  ));

  const backsideProject = projectsData.find(p => p.id === '1765041068338');
  if (!backsideProject) {
    console.error('❌ Project not found');
    return;
  }

  const frontendCode = backsideProject.code;
  const functionName = backsideProject.functionName;

  console.log('📋 STEP 1: FRONTEND PROJECT LOADING');
  console.log(`✅ Project ID: ${backsideProject.id}`);
  console.log(`✅ Function Name: ${functionName}`);
  console.log(`✅ Code Length: ${frontendCode.length} characters`);
  console.log(`✅ Code Header: ${frontendCode.substring(0, 50).replace(/\n/g, '\\n')}...`);

  // Verify this is the correct backside B scanner
  if (frontendCode.includes('FIXED BACKSIDE B SCANNER')) {
    console.log('✅ Frontend has correct backside B scanner code');
  } else {
    console.log('❌ Frontend code is not backside B scanner');
  }

  // Step 2: Intercept what frontend API route actually sends
  console.log('\n📡 STEP 2: TESTING FRONTEND API ROUTE');

  try {
    // First, let's check if we can intercept the frontend API route
    const frontendApiUrl = 'http://localhost:5656/api/projects/1765041068338/execute';

    const requestBody = {
      date_range: {
        start_date: '2025-01-01',
        end_date: '2025-11-01'
      },
      timeout_seconds: 30 // Short timeout for testing
    };

    console.log('🚀 Sending request to frontend API route...');
    console.log('Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(frontendApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Mode': 'true' // Add debug header if supported
      },
      body: JSON.stringify(requestBody),
      timeout: 45000
    });

    const result = await response.json();

    console.log(`\n📊 Frontend API Response Status: ${response.status}`);
    console.log('Response summary:', {
      success: result.success,
      results_count: result.results?.length || 0,
      total_found: result.total_found || 0,
      execution_id: result.execution_id
    });

    if (result.error) {
      console.log('Error details:', result.error);
      if (result.details) console.log('Details:', result.details);
    }

    // Step 3: Test direct backend to see what code it receives
    console.log('\n🔬 STEP 3: TESTING DIRECT BACKEND WITH KNOWN GOOD CODE');

    const backendUrl = 'http://localhost:8000/api/scan/execute';
    const directBackendRequest = {
      uploaded_code: frontendCode, // Send the exact code from frontend project
      scanner_type: 'uploaded',
      start_date: '2025-01-01',
      end_date: '2025-11-01',
      function_name: functionName, // Use the exact function name from project
      parallel_execution: true,
      timeout_seconds: 30
    };

    console.log('🚀 Sending direct request to backend with verified correct code...');
    console.log('Backend request summary:', {
      code_length: directBackendRequest.uploaded_code.length,
      function_name: directBackendRequest.function_name,
      code_preview: directBackendRequest.uploaded_code.substring(0, 100).replace(/\n/g, '\\n') + '...'
    });

    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(directBackendRequest),
      timeout: 45000
    });

    const backendResult = await backendResponse.json();

    console.log(`\n📊 Direct Backend Response Status: ${backendResponse.status}`);
    console.log('Direct backend response summary:', {
      success: backendResult.success,
      results_count: backendResult.results?.length || 0,
      total_found: backendResult.total_found || 0,
      scan_id: backendResult.scan_id
    });

    if (backendResult.error) {
      console.log('Backend error:', backendResult.error);
    }

    // Step 4: Analysis
    console.log('\n🎯 STEP 4: PIPELINE ANALYSIS');
    console.log('================================');

    if (backendResult.success && backendResult.results && backendResult.results.length > 0) {
      console.log('✅ DIRECT BACKEND TEST SUCCESS!');
      console.log('✅ The correct backside B code works when sent directly');
      console.log('❌ PROBLEM: Frontend API route is sending wrong code to backend');
      console.log('\n🔧 SOLUTION NEEDED: Fix frontend API route code transmission');

      console.log('\n📋 Expected vs Actual:');
      console.log(`Expected code: Backside B scanner (${frontendCode.length} chars)`);
      console.log(`Expected function: ${functionName}`);
      console.log(`Expected results: Real trading patterns (SOXL, INTC, XOM, etc.)`);

      console.log(`\nActual results: ${backendResult.results.length} patterns found`);
      console.log('Sample results:');
      backendResult.results.slice(0, 3).forEach((r, i) => {
        console.log(`  ${i+1}. ${r.ticker} - Gap: ${r.gap_percent}% - Volume: ${r.volume?.toLocaleString() || 'N/A'}`);
      });

    } else if (!backendResult.success) {
      console.log('❌ DIRECT BACKEND TEST FAILED');
      console.log('❌ Even the correct code fails when sent directly');
      console.log('🔍 The issue may be in backend execution, not code transmission');

      if (backendResult.error && backendResult.error.includes('scan_symbol')) {
        console.log('🎯 FUNCTION ROUTING ISSUE: Backend is still trying to call scan_symbol');
        console.log('🔧 Need to check if function_name parameter is being processed correctly');
      }

    } else {
      console.log('⚠️  UNCLEAR RESULTS');
      console.log('Direct backend test returned success but no results');
      console.log('This could indicate:');
      console.log('  - Date range issues (no trading days in range)');
      console.log('  - Market data access problems');
      console.log('  - Logic issues in the scanner code');
    }

    // Step 5: Compare responses
    if (result.results && backendResult.results) {
      console.log('\n📊 STEP 5: COMPARING FRONTEND vs DIRECT BACKEND');
      console.log('==================================================');
      console.log(`Frontend API results: ${result.results.length}`);
      console.log(`Direct backend results: ${backendResult.results.length}`);

      if (result.results.length !== backendResult.results.length) {
        console.log('❌ RESULTS MISMATCH: Frontend and direct backend returned different result counts');
        console.log('❌ This confirms the frontend API is sending different code to the backend');
      } else {
        console.log('✅ Results match - frontend API is transmitting code correctly');
        console.log('🔍 The issue may be elsewhere in the pipeline');
      }
    }

  } catch (error) {
    console.error('\n💥 Pipeline tracing failed:', error.message);
  }
}

// Execute the pipeline trace
traceCodePipeline()
  .then(() => {
    console.log('\n🏁 Pipeline tracing completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Pipeline tracing error:', error);
    process.exit(1);
  });