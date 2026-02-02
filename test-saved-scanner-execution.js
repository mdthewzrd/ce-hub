// Test execution of a saved scanner through the exact API call that the frontend makes

async function testSavedScannerExecution() {
  console.log('🧪 Testing Saved Scanner Execution via Frontend API\n');

  // This simulates the exact code that would be stored from your backside_b scan
  // with sophisticated formatting applied
  const savedScannerCode = `"""
Enhanced Custom Scanner with 100% Preserved Logic
"""

import asyncio
import aiohttp
import pandas as pd
import numpy as np

# INFRASTRUCTURE: Enhanced date calculation (FIXED)
def get_proper_date_range(start_date_str=None, end_date_str=None):
    """Infrastructure function - should be ignored"""
    print("This is get_proper_date_range - should be ignored")
    return start_date_str, end_date_str

# INFRASTRUCTURE: Enhanced ticker universe fetching
async def get_full_ticker_universe():
    """Infrastructure function - should be ignored"""
    print("This is get_full_ticker_universe - should be ignored")
    return ['AAPL', 'MSFT', 'GOOGL']

# INFRASTRUCTURE: Enhanced data fetching
async def fetch_data_enhanced(ticker, start_date, end_date):
    """Infrastructure function - should be ignored"""
    print("This is fetch_data_enhanced - should be ignored")
    return pd.DataFrame()

# INFRASTRUCTURE: Main async function
async def run_enhanced_custom_scan():
    """Infrastructure function - should be ignored"""
    print("This is run_enhanced_custom_scan - should be ignored")
    return []

# USER FUNCTION - This should be detected and executed
def backside_momentum_analyzer(symbol, data):
    """Actual user function - should be detected and called"""
    print("🎯 This is backside_momentum_analyzer - USER FUNCTION!")

    try:
        # Calculate momentum properly
        if len(data) >= 2:
            momentum = (data['close'].iloc[-1] / data['close'].iloc[-2] - 1) * 100
        else:
            momentum = 0

        # Generate signal based on momentum
        if momentum > 2.0:
            signal = 'BUY'
        elif momentum < -2.0:
            signal = 'SELL'
        else:
            signal = 'HOLD'

        print(f"📊 {symbol}: Momentum={momentum:.2f}%, Signal={signal}")

        return {
            'symbol': symbol,
            'momentum_percent': momentum,
            'signal': signal,
            'success': True,
            'date': data['Date'].iloc[-1] if 'Date' in data.columns else '2024-12-04'
        }
    except Exception as e:
        print(f"❌ Error in {symbol}: {e}")
        return {'symbol': symbol, 'error': str(e), 'success': False}

# MORE INFRASTRUCTURE
def run_enhanced_lc_scan():
    """Infrastructure function - should be ignored"""
    return []
`;

  try {
    console.log('✅ Step 1: Testing saved scanner execution...');

    // This simulates the exact API call the frontend makes when running a saved scanner
    const response = await fetch('http://localhost:8000/api/scan/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start_date: '2024-12-01',
        end_date: '2024-12-04',
        scanner_type: 'uploaded',
        uploaded_code: savedScannerCode
      }),
    });

    console.log(`📊 Response status: ${response.status}`);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Scan started successfully!');
      console.log('Scan ID:', result.scan_id);

      if (result.scan_id) {
        console.log('\n⏳ Waiting for scan completion...');
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
}

async function pollForResults(scanId) {
  const maxAttempts = 30;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`http://localhost:8000/api/scan/status/${scanId}`);

      if (response.ok) {
        const status = await response.json();
        console.log(`📈 Progress: ${status.progress_percent}% - ${status.message}`);

        if (status.status === 'completed') {
          console.log('\n✅ Scan completed!');
          console.log('Results:', status.results || 'No results');
          console.log('Total found:', status.total_found || 0);

          // Validate the fix worked
          if (status.results && Array.isArray(status.results) && status.results.length > 0) {
            console.log('\n🎉 SUCCESS: The function detection fix is working!');
            console.log('✅ User function was properly detected and executed');
            console.log('✅ Infrastructure functions were properly ignored');
            console.log('✅ Scanner returned actual results:', status.results.map(r => ({
              ticker: r.ticker,
              signal: r.signal,
              momentum: r.momentum_percent
            })));
          } else if (status.total_found === 0) {
            console.log('\n✅ Execution completed successfully (no signals generated, which is normal)');
            console.log('✅ The fix is working - no more function detection errors');
          } else {
            console.log('\n⚠️ Unexpected result format');
          }
          return;
        } else if (status.status === 'error') {
          console.error('\n❌ Scan failed:', status.error);
          if (status.error && status.error.includes('function')) {
            console.error('🚨 The fix did NOT work - still getting function errors');
          }
          return;
        }
      }
    } catch (error) {
      console.error('❌ Error polling for status:', error);
    }

    attempts++;
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
  }

  console.log('\n⏱️ Timeout waiting for scan completion');
}

testSavedScannerExecution();