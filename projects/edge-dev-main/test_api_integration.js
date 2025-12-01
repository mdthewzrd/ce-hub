#!/usr/bin/env node

/**
 * Test both formatting and project integration via API
 */

const http = require('http');

function makeRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: 'localhost',
      port: 5656,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve(parsed);
        } catch (e) {
          resolve(responseData);
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}

async function testFormattingIntegration() {
  console.log('🧪 Testing Edge Dev API Integration');
  console.log('==================================');

  try {
    // Test 1: Large code formatting (should use AI, not instant local formatting)
    console.log('\n📝 Test 1: Large Code Formatting (should use AI)');
    const largeTestCode = `
def scan_symbol(ticker, from_date, to_date):
    # This is a large test scanner that should trigger AI formatting
    import pandas as pd
    import numpy as np
    from datetime import datetime, timedelta
    import requests
    import json
    import time
    import logging

    # Configure logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    def get_market_data(ticker, start_date, end_date):
        """Get market data for the specified ticker"""
        logger.info(f"Fetching data for {ticker} from {start_date} to {end_date}")
        time.sleep(0.1)
        return pd.DataFrame({
            'date': pd.date_range(start_date, end_date),
            'open': np.random.randn(100) * 10 + 100,
            'high': np.random.randn(100) * 10 + 110,
            'low': np.random.randn(100) * 10 + 90,
            'close': np.random.randn(100) * 10 + 100,
            'volume': np.random.randint(1000000, 5000000, 100)
        })

    def calculate_indicators(df):
        """Calculate technical indicators"""
        df['sma_20'] = df['close'].rolling(window=20).mean()
        df['sma_50'] = df['close'].rolling(window=50).mean()
        df['rsi'] = calculate_rsi(df['close'])
        return df

    def calculate_rsi(prices, period=14):
        """Calculate RSI indicator"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        return 100 - (100 / (1 + rs))

    def scan_for_signals(df):
        """Scan for trading signals"""
        signals = []
        for i in range(50, len(df)):
            if df['sma_20'].iloc[i] > df['sma_50'].iloc[i-1]:
                if df['rsi'].iloc[i] < 30:
                    signals.append({
                        'date': df['date'].iloc[i],
                        'signal': 'BUY',
                        'price': df['close'].iloc[i],
                        'rsi': df['rsi'].iloc[i]
                    })
        return signals

    # Main execution
    try:
        data = get_market_data(ticker, from_date, to_date)
        data = calculate_indicators(data)
        signals = scan_for_signals(data)
        logger.info(f"Found {len(signals)} trading signals for {ticker}")
        return signals
    except Exception as e:
        logger.error(f"Error scanning {ticker}: {e}")
        return []

def format_results(signals):
    """Format scan results for display"""
    if not signals:
        return "No signals found"
    result = "Trading Signals:\\n"
    result += "=" * 50 + "\\n"
    for signal in signals:
        result += "Date: " + str(signal['date']) + "\\n"
        result += "Signal: " + signal['signal'] + "\\n"
        result += "Price: " + str(signal['price']) + "\\n"
        result += "RSI: " + str(signal['rsi']) + "\\n"
        result += "-" * 30 + "\\n"
    return result

if __name__ == "__main__":
    results = scan_symbol("AAPL", "2024-01-01", "2024-12-31")
    print(format_results(results))
    `;

    console.log('📊 Sending large code for formatting...');
    const startTime = Date.now();

    const formatResponse = await makeRequest('/api/renata/chat', {
      message: "/format " + largeTestCode,
      context: {
        action: 'format'
      }
    });

    const formattingTime = Date.now() - startTime;
    console.log("⏱️ Formatting completed in " + formattingTime + "ms");

    if (formattingTime > 2000) {
      console.log('✅ REAL AI PROCESSING: Took >2 seconds (using OpenRouter API)');
    } else {
      console.log('❌ INSTANT FORMATTING: Too fast (<2 seconds), likely using local formatting');
    }

    // Test 2: Project integration
    console.log('\n🎯 Test 2: Project Integration');
    const projectResponse = await makeRequest('/api/renata/chat', {
      message: 'Add this scanner to the project',
      context: {
        action: 'add_to_project',
        scannerName: 'Test Large Scanner'
      }
    });

    console.log('📋 Project Integration Response:');
    console.log("   Success: " + (projectResponse.success || false));
    console.log("   Type: " + (projectResponse.type || 'unknown'));
    if (projectResponse.context) {
      console.log("   MCP Used: " + (projectResponse.context.archonMCPUsed || false));
      console.log("   Project ID: " + (projectResponse.context.projectId || 'N/A'));
    }

    // Test 3: Check if project was actually created
    console.log('\n📁 Test 3: Verify Project Creation');
    const fs = require('fs');
    const path = require('path');
    const projectDir = path.join(process.cwd(), 'projects-data');

    if (fs.existsSync(projectDir)) {
      const files = fs.readdirSync(projectDir).filter(f => f.endsWith('.json'));
      console.log("✅ Projects directory exists with " + files.length + " project files");
      files.forEach(file => {
        console.log("   - " + file);
      });
    } else {
      console.log('❌ Projects directory not found');
    }

    console.log('\n🎉 Integration Test Summary:');
    console.log("   Formatting Speed: " + formattingTime + "ms (" + (formattingTime > 2000 ? 'REAL AI' : 'INSTANT') + ")");
    console.log("   Project Integration: " + (projectResponse.success ? 'SUCCESS' : 'FAILED'));
    console.log("   Overall Status: " + (formattingTime > 2000 && projectResponse.success ? 'WORKING' : 'NEEDS FIXES'));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testFormattingIntegration();
