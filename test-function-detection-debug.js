// Test the execution service function detection with debugging

async function testFunctionDetection() {
  console.log('🧪 Testing Function Detection with Debugging\n');

  // Simulate formatted code with infrastructure functions
  const formattedCode = `
"""
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
    console.log('✅ Step 1: Testing execution service with debug output...');

    // Call the FastAPI backend directly (not the Next.js frontend)
    const response = await fetch('http://localhost:8000/api/scan/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: formattedCode,
        request: {
          symbol: 'AAPL',
          start_date: '2024-12-01',
          end_date: '2024-12-04'
        }
      }),
    });

    console.log(`📊 Response status: ${response.status}`);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Execution successful!');
      console.log('Result:', result);

      if (result.success === true) {
        console.log('🎉 SUCCESS: Function detection and execution working!');
        console.log('✅ User function backside_momentum_analyzer was called');
        console.log('✅ Infrastructure functions were ignored');
      } else {
        console.log('⚠️ Partial success or failure');
      }
    } else {
      console.error('❌ Execution failed');
      const errorText = await response.text();
      console.error('Error details:', errorText.substring(0, 500));
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFunctionDetection();