// Test backside scanner with correct 2025 date range: 1/1/25 - 11/1/25

const fs = require('fs');

async function testBacksideCorrect2025() {
  console.log('🧪 Testing Backside Scanner: 1/1/25 - 11/1/25\n');

  // Read the actual file from Downloads
  const scannerFilePath = '/Users/michaeldurante/Downloads/backside para b copy.py';

  try {
    const savedScannerCode = fs.readFileSync(scannerFilePath, 'utf8');
    console.log(`✅ Successfully loaded scanner file (${savedScannerCode.length} chars)`);

    // Use the CORRECT 2025 date range the user specified
    const startDate = '2025-01-01';
    const endDate = '2025-11-01';

    console.log(`📊 Testing range: ${startDate} to ${endDate}`);
    console.log(`📈 That's ${Math.floor((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))} days of trading data`);

    try {
      console.log('\n✅ Step 1: Starting backside scanner with correct 2025 range...');

      // This simulates the exact API call the frontend makes when running a saved scanner
      const response = await fetch('http://localhost:8000/api/scan/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_date: startDate,
          end_date: endDate,
          scanner_type: 'uploaded',
          uploaded_code: savedScannerCode
        }),
      });

      console.log(`📊 Response status: ${response.status}`);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Scan started successfully!');
        console.log('Scan ID:', result.scan_id);
        console.log('Date range:', `${startDate} to ${endDate}`);

        if (result.scan_id) {
          console.log('\n⏳ Waiting for scan completion (this may take a while for 10+ months of data)...');
          await pollForResults(result.scan_id);
        }
      } else {
        console.error('❌ Scan failed to start');
        const errorText = await response.text();
        console.error('Error details:', errorText.substring(0, 500));
      }

    } catch (error) {
      console.error('❌ Test failed:', error);
    }

  } catch (error) {
    console.error('❌ Failed to read scanner file:', error.message);
  }
}

async function pollForResults(scanId) {
  const maxAttempts = 180; // Increased timeout for full year scan
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`http://localhost:8000/api/scan/status/${scanId}`);

      if (response.ok) {
        const status = await response.json();

        // Show progress more frequently
        if (attempts % 3 === 0) {
          console.log(`📈 Progress: ${status.progress_percent}% - ${status.message}`);
        }

        if (status.status === 'completed') {
          console.log('\n✅ Scan completed!');
          console.log('Results:', status.results || 'No results');
          console.log('Total found:', status.total_found || 0);

          // Display results if any were found
          if (status.results && Array.isArray(status.results) && status.results.length > 0) {
            console.log('\n🎉 SUCCESS: Backside scanner found trading signals!');
            console.log(`✅ Found ${status.results.length} trading signals from 1/1/25 - 11/1/25`);

            // Show ALL results (not just sample)
            console.log('\n📊 ALL Trading Signals Found:');
            status.results.forEach((result, index) => {
              console.log(`${index + 1}. ${result.Ticker || result.ticker || 'N/A'} - ${result.Date || result.date || 'N/A'}`);
              if (result.Trigger || result.trigger) console.log(`   Trigger: ${result.Trigger || result.trigger}`);
              if (result['Gap/ATR'] !== undefined) console.log(`   Gap/ATR: ${result['Gap/ATR']}`);
              if (result['Open>PrevHigh'] !== undefined) console.log(`   Open>PrevHigh: ${result['Open>PrevHigh']}`);
              if (result['PosAbs_1000d'] !== undefined) console.log(`   Position: ${result['PosAbs_1000d']}`);
              if (result['D1_Body/ATR'] !== undefined) console.log(`   D1_Body/ATR: ${result['D1_Body/ATR']}`);
              if (result['ADV20_$'] !== undefined) console.log(`   ADV20_$: $${(result['ADV20_$']/1000000).toFixed(1)}M`);
              console.log('');
            });

            // Show summary statistics
            const tickers = [...new Set(status.results.map(r => r.Ticker || r.ticker).filter(Boolean))];
            const dates = [...new Set(status.results.map(r => r.Date || r.date).filter(Boolean))];

            console.log('\n📈 Summary Statistics:');
            console.log(`   Total Signals: ${status.results.length}`);
            console.log(`   Unique Tickers: ${tickers.length}`);
            console.log(`   Date Range: ${dates.length ? `${dates[0]} to ${dates[dates.length-1]}` : 'N/A'}`);
            console.log(`   Most Active Tickers: ${getTopTickers(status.results, 10).join(', ')}`);

            // Show trigger breakdown
            const triggerCounts = {};
            status.results.forEach(result => {
              const trigger = result.Trigger || result.trigger || 'Unknown';
              triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
            });

            console.log('\n🎯 Trigger Breakdown:');
            Object.entries(triggerCounts).forEach(([trigger, count]) => {
              console.log(`   ${trigger}: ${count} signals`);
            });

            // Show volume analysis
            const volumes = status.results
              .map(r => r['D1Vol(shares)'] || r['D1Vol(shares)'])
              .filter(v => v && !isNaN(v));

            if (volumes.length > 0) {
              const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
              const maxVolume = Math.max(...volumes);
              console.log('\n📊 Volume Analysis:');
              console.log(`   Average D-1 Volume: ${(avgVolume / 1000000).toFixed(1)}M shares`);
              console.log(`   Max D-1 Volume: ${(maxVolume / 1000000).toFixed(1)}M shares`);
            }

          } else {
            console.log('\n📊 No trading signals found in this date range');
            console.log('⚠️ This might indicate a formatting issue if you expected results');
            console.log('💡 The scanner executed successfully but found no qualifying setups');
            console.log('🔍 Possible issues:');
            console.log('   - The date range might be in the future relative to market data');
            console.log('   - Scanner parameters might be too restrictive');
            console.log('   - Market conditions might not meet the backside criteria');
            console.log('   - The scanner might need different execution mode (standalone vs user function)');
          }
          return;
        } else if (status.status === 'error') {
          console.error('\n❌ Scan failed:', status.error);
          if (status.error && status.error.includes('function')) {
            console.error('🚨 Function detection issue detected');
          }
          return;
        }
      }
    } catch (error) {
      console.error('❌ Error polling for status:', error);
    }

    attempts++;
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
  }

  console.log('\n⏱️ Timeout waiting for scan completion');
}

function getTopTickers(results, limit) {
  const tickerCounts = {};
  results.forEach(result => {
    const ticker = result.Ticker || result.ticker;
    if (ticker) {
      tickerCounts[ticker] = (tickerCounts[ticker] || 0) + 1;
    }
  });

  return Object.entries(tickerCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([ticker]) => ticker);
}

testBacksideCorrect2025();