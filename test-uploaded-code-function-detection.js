// Test the execution service function detection with uploaded code

async function testUploadedCodeFunctionDetection() {
  console.log('🧪 Testing Uploaded Code Function Detection\n');

  // Simulate formatted code with infrastructure functions AND user function
  const formattedCode = `"""
Enhanced Custom Scanner with 100% Preserved Logic
"""

import asyncio
import aiohttp
import pandas as pd

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

# USER FUNCTION - This should be detected
def backside_momentum_analyzer(symbol, data):
    """Actual user function - should be detected and called"""
    print("🎯 This is backside_momentum_analyzer - USER FUNCTION!")

    try:
        momentum = data['close'].iloc[-1] / data['close'].iloc[-2] - 1
        signal = 'BUY' if momentum > 3 else 'HOLD'

        return {
            'symbol': symbol,
            'momentum_percent': momentum,
            'signal': signal,
            'success': True
        }
    except Exception as e:
        return {'symbol': symbol, 'error': str(e), 'success': False}

# MORE INFRASTRUCTURE
def run_enhanced_lc_scan():
    """Infrastructure function - should be ignored"""
    return []
`;

  try {
    console.log('✅ Step 1: Testing execution service with uploaded code...');

    // Call the FastAPI backend with uploaded_code
    const response = await fetch('http://localhost:8000/api/scan/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start_date: '2024-12-01',
        end_date: '2024-12-04',
        scanner_type: 'uploaded',
        uploaded_code: formattedCode
      }),
    });

    console.log(`📊 Response status: ${response.status}`);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Scan started successfully!');
      console.log('Scan ID:', result.scan_id);
      console.log('Message:', result.message);

      // Poll for results
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
          return;
        } else if (status.status === 'error') {
          console.error('\n❌ Scan failed:', status.error);
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

testUploadedCodeFunctionDetection();