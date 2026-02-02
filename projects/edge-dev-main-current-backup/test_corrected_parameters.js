#!/usr/bin/env node

const axios = require('axios');

async function testCorrectedParameters() {
  try {
    console.log('🧪 Testing corrected Backside B parameters...');

    // Use the same date range that found 2 results before, but with corrected parameters
    const requestBody = {
      start_date: '2025-01-01',
      end_date: '2025-11-19', // This range should find 8+ results with correct parameters
      use_real_scan: true,
      filters: {
        lc_frontside_d2_extended: true,
        lc_frontside_d3_extended_1: true,
        min_gap: 0.75,  // Correct backside B parameter: gap_div_atr_min
        min_pm_vol: 15000000,  // Correct backside B parameter: d1_volume_min
        min_prev_close: 8.0,  // Correct backside B parameter: price_min
        require_open_gt_prev_high: true  // Correct backside B parameter
      }
    };

    console.log('🚀 Starting scan with corrected parameters...');
    console.log('Parameters:', JSON.stringify(requestBody.filters, null, 2));

    const startResponse = await axios.post('http://localhost:5659/api/scan/execute', requestBody, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (startResponse.data.success && startResponse.data.scan_id) {
      const scanId = startResponse.data.scan_id;
      console.log('✅ Scan started with ID:', scanId);

      // Poll for results with longer timeout
      const maxPolls = 120; // 2 minutes max for comprehensive scan
      let polls = 0;

      while (polls < maxPolls) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        polls++;

        const statusResponse = await axios.get(`http://localhost:5659/api/scan/status/${scanId}`);
        const status = statusResponse.data;

        console.log(`📊 Poll ${polls}: Status=${status.status}, Progress=${status.progress_percent || 0}%`);

        if (status.status === 'completed') {
          console.log('🎉 Scan completed!');
          console.log(`Found ${status.results?.length || 0} results:`);

          if (status.results && status.results.length > 0) {
            status.results.forEach((result, i) => {
              console.log(`  ${i+1}. ${result.ticker} - Date: ${result.date?.split('T')[0]}, Gap: ${result.gap_pct}%, Volume: ${(result.volume / 1000000).toFixed(1)}M, Confidence: ${result.confidence_score}%`);
            });

            console.log(`\n🎯 RESULTS COMPARISON:`);
            console.log(`Previous run: 2 results`);
            console.log(`Current run: ${status.results.length} results`);
            console.log(`Improvement: +${status.results.length - 2} additional signals found!`);
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
    console.error('❌ Test failed:', error.message);
  }
}

testCorrectedParameters();