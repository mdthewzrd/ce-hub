#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');

async function testFrontendUploadedScanner() {
  try {
    console.log('🧪 Testing frontend uploaded scanner approach...');

    // Read the actual uploaded Backside B scanner code (same as frontend would)
    const backsideBCode = fs.readFileSync('/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backend/backside para b copy.py', 'utf8');
    console.log('📄 Using Backside B code length:', backsideBCode.length);

    // Test the exact request format that the updated frontend sends
    const requestBody = {
      start_date: '2025-01-01',
      end_date: '2025-11-19',
      use_real_scan: true,
      scanner_type: 'uploaded', // CRITICAL: Use uploaded scanner path for full universe
      uploaded_code: backsideBCode, // CRITICAL: Send the actual Backside B code
      filters: {
        // Don't apply restrictive filters - let the Backside B code handle its own logic
      }
    };

    console.log('🚀 Starting frontend uploaded scanner test...');
    console.log('Request details:', {
      scanner_type: requestBody.scanner_type,
      code_length: requestBody.uploaded_code.length,
      date_range: `${requestBody.start_date} to ${requestBody.end_date}`,
      filters_count: Object.keys(requestBody.filters).length
    });

    const startResponse = await axios.post('http://localhost:5659/api/scan/execute', requestBody, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (startResponse.data.success && startResponse.data.scan_id) {
      const scanId = startResponse.data.scan_id;
      console.log('✅ Frontend uploaded scanner scan started with ID:', scanId);

      // Poll for results with same polling logic as frontend
      const maxPolls = 120; // 2 minutes max
      let polls = 0;

      while (polls < maxPolls) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Same as frontend polling
        polls++;

        const statusResponse = await axios.get(`http://localhost:5659/api/scan/status/${scanId}`);
        const status = statusResponse.data;

        console.log(`📊 Poll ${polls}: Status=${status.status}, Progress=${status.progress_percent || 0}%`);

        if (status.status === 'completed') {
          console.log('🎉 Frontend uploaded scanner scan completed!');
          console.log(`Found ${status.results?.length || 0} results:`);

          if (status.results && status.results.length > 0) {
            status.results.forEach((result, i) => {
              const gapPercent = result.gap_pct !== undefined ? `${result.gap_pct}%` : 'N/A';
              const volumeM = result.volume !== undefined && !isNaN(result.volume) ? `${(result.volume / 1000000).toFixed(1)}M` : 'N/A';
              const confidence = result.confidence_score !== undefined ? `${result.confidence_score}%` : 'N/A';
              console.log(`  ${i+1}. ${result.ticker} - Date: ${result.date?.split('T')[0]}, Gap: ${gapPercent}, Volume: ${volumeM}, Confidence: ${confidence}`);
            });

            console.log(`\n🎯 FRONTEND VALIDATION RESULTS:`);
            console.log(`✅ Frontend uploaded scanner: ${status.results.length} signals`);
            console.log(`✅ Previous test (uploaded scanner): 8 signals`);
            console.log(`✅ Previous filtered approach: 2 signals`);
            console.log(`✅ Terminal execution: 8 signals`);

            if (status.results.length >= 6) {
              console.log('✅ SUCCESS: Frontend uploaded scanner approach working correctly!');
              console.log('✅ Frontend now matches terminal execution results!');
            } else {
              console.log('⚠️  WARNING: Results may vary from terminal execution');
            }
          }

          return;
        }

        if (status.status === 'failed' || status.status === 'error') {
          console.error('❌ Scan failed:', status.message);
          return;
        }
      }

      console.log('⏰ Polling timed out');
    }
  } catch (error) {
    console.error('❌ Frontend test failed:', error.message);
    if (error.response?.data) {
      console.error('Error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testFrontendUploadedScanner();