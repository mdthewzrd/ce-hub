/**
 * Test Suite for Trading Code Formatter
 *
 * Comprehensive tests for the AI code formatting agent functionality
 */

import { codeFormatter, TradingCodeFormatter } from '../codeFormatter';
import { CodeFormatterService } from '../codeFormatterAPI';

describe('TradingCodeFormatter', () => {
  let formatter: TradingCodeFormatter;

  beforeEach(() => {
    formatter = new TradingCodeFormatter();
  });

  describe('formatTradingCode', () => {
    it('should format basic Python code with standard packages', async () => {
      const inputCode = `
import requests
import pandas as pd

def get_stock_data(ticker):
    response = requests.get(f"https://api.example.com/stock/{ticker}")
    data = response.json()
    return data

tickers = ['AAPL', 'GOOGL', 'MSFT']
for ticker in tickers:
    result = get_stock_data(ticker)
    print(f"{ticker}: {result}")
`;

      const result = await formatter.formatTradingCode(inputCode);

      expect(result.success).toBe(true);
      expect(result.formattedCode).toContain('import aiohttp');
      expect(result.formattedCode).toContain('import asyncio');
      expect(result.formattedCode).toContain('from concurrent.futures import');
      expect(result.optimizations.length).toBeGreaterThan(0);
      expect(result.metadata.addedImports.length).toBeGreaterThan(0);
    });

    it('should add multiprocessing support for ticker loops', async () => {
      const inputCode = `
import pandas as pd

def process_ticker(ticker):
    # Some processing logic
    return {"ticker": ticker, "value": 100}

tickers = ['AAPL', 'GOOGL', 'MSFT']
results = []
for ticker in tickers:
    result = process_ticker(ticker)
    results.append(result)
`;

      const result = await formatter.formatTradingCode(inputCode, {
        enableMultiprocessing: true
      });

      expect(result.success).toBe(true);
      expect(result.formattedCode).toContain('process_tickers_concurrent');
      expect(result.formattedCode).toContain('ThreadPoolExecutor');
      expect(result.optimizations).toContain('Added multiprocessing support');
    });

    it('should convert synchronous requests to async', async () => {
      const inputCode = `
import requests

def fetch_data(url):
    response = requests.get(url)
    return response.json()
`;

      const result = await formatter.formatTradingCode(inputCode, {
        enableAsyncPatterns: true
      });

      expect(result.success).toBe(true);
      expect(result.formattedCode).toContain('async def');
      expect(result.formattedCode).toContain('await async_fetch_data');
      expect(result.formattedCode).toContain('aiohttp.ClientSession');
    });

    it('should standardize output format', async () => {
      const inputCode = `
def scan_stocks():
    return {"AAPL": {"price": 150, "volume": 1000}}
`;

      const result = await formatter.formatTradingCode(inputCode, {
        standardizeOutput: true
      });

      expect(result.success).toBe(true);
      expect(result.formattedCode).toContain('format_trading_result');
      expect(result.formattedCode).toContain('gapPercent');
      expect(result.formattedCode).toContain('rMultiple');
      expect(result.formattedCode).toContain('timestamp');
    });

    it('should handle malformed code gracefully', async () => {
      const inputCode = `
def broken_function(
    # This is intentionally broken Python
    if True
        print("Missing colon and indent")
`;

      const result = await formatter.formatTradingCode(inputCode);

      // Should still attempt to format and add optimizations
      expect(result).toBeDefined();
      expect(result.formattedCode).toContain(inputCode);
    });
  });

  describe('createScannerTemplate', () => {
    it('should generate a complete gap scanner template', () => {
      const template = formatter.createScannerTemplate('gap');

      expect(template).toContain('scan_gap_opportunities');
      expect(template).toContain('process_gap_signal');
      expect(template).toContain('import pandas as pd');
      expect(template).toContain('import aiohttp');
      expect(template).toContain('async def');
      expect(template).toContain('format_trading_result');
    });

    it('should generate templates for all scanner types', () => {
      const types: Array<'gap' | 'volume' | 'breakout' | 'custom'> = [
        'gap', 'volume', 'breakout', 'custom'
      ];

      types.forEach(type => {
        const template = formatter.createScannerTemplate(type);
        expect(template).toContain(`scan_${type}_opportunities`);
        expect(template).toContain(`process_${type}_signal`);
        expect(template).toContain('async def');
      });
    });
  });

  describe('getOptimizationSuggestions', () => {
    it('should suggest async patterns for synchronous requests', () => {
      const code = `
import requests
response = requests.get("https://api.example.com")
`;

      const suggestions = formatter.getOptimizationSuggestions(code);
      expect(suggestions).toContain('Use async/await with aiohttp for concurrent HTTP requests');
    });

    it('should suggest avoiding iterrows', () => {
      const code = `
import pandas as pd
df = pd.DataFrame()
for index, row in df.iterrows():
    print(row)
`;

      const suggestions = formatter.getOptimizationSuggestions(code);
      expect(suggestions).toContain('Avoid iterrows() - use vectorized operations or .apply() instead');
    });

    it('should suggest adding logging', () => {
      const code = `
def process_data():
    print("Processing data")
    return True
`;

      const suggestions = formatter.getOptimizationSuggestions(code);
      expect(suggestions).toContain('Add logging for better debugging and monitoring');
    });
  });
});

describe('CodeFormatterService', () => {
  describe('validatePythonCode', () => {
    it('should validate correct Python code', () => {
      const code = `
def hello_world():
    print("Hello, World!")
    return True

if __name__ == "__main__":
    hello_world()
`;

      const result = CodeFormatterService.validatePythonCode(code);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect empty code', () => {
      const result = CodeFormatterService.validatePythonCode('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Code cannot be empty');
    });

    it('should warn about print statements', () => {
      const code = `
def test():
    print("Debug message")
`;

      const result = CodeFormatterService.validatePythonCode(code);
      expect(result.warnings).toContain('Consider using logging instead of print statements');
    });

    it('should warn about synchronous requests', () => {
      const code = `
import requests
response = requests.get("https://api.example.com")
`;

      const result = CodeFormatterService.validatePythonCode(code);
      expect(result.warnings).toContain('Synchronous requests detected - async patterns recommended');
    });
  });

  describe('extractFunctions', () => {
    it('should extract function names', () => {
      const code = `
def function_one():
    pass

def function_two(arg1, arg2):
    return arg1 + arg2

class MyClass:
    def method_one(self):
        pass
`;

      const functions = CodeFormatterService.extractFunctions(code);
      expect(functions).toEqual(['function_one', 'function_two', 'method_one']);
    });
  });

  describe('extractImports', () => {
    it('should extract import statements', () => {
      const code = `
import os
import sys
from datetime import datetime
from typing import List, Dict
import pandas as pd
`;

      const imports = CodeFormatterService.extractImports(code);
      expect(imports).toContain('import os');
      expect(imports).toContain('import sys');
      expect(imports).toContain('from datetime import datetime');
      expect(imports).toContain('from typing import List, Dict');
      expect(imports).toContain('import pandas as pd');
    });
  });

  describe('estimateComplexity', () => {
    it('should estimate low complexity for simple code', () => {
      const code = `
def simple_function():
    return "Hello, World!"
`;

      const result = CodeFormatterService.estimateComplexity(code);
      expect(result.level).toBe('low');
      expect(result.score).toBeLessThan(10);
    });

    it('should estimate high complexity for complex code', () => {
      const code = `
def complex_function():
    for i in range(100):
        for j in range(100):
            for k in range(100):
                if i > j:
                    if j > k:
                        if k > 10:
                            print(f"Complex nested logic: {i}, {j}, {k}")
                        else:
                            print("Another branch")
                    elif j < k:
                        print("Yet another branch")
                else:
                    print("Different logic")

    while True:
        if some_condition():
            break
        else:
            continue
`;

      const result = CodeFormatterService.estimateComplexity(code);
      expect(result.level).toBe('high');
      expect(result.score).toBeGreaterThan(25);
      expect(result.factors.length).toBeGreaterThan(0);
    });
  });
});

// Sample test data for integration testing
export const sampleTradingCode = {
  basicScanner: `
import requests
import pandas as pd
import time

def get_stock_data(ticker):
    url = f"https://api.example.com/quote/{ticker}"
    response = requests.get(url)
    data = response.json()
    return {
        'ticker': ticker,
        'price': data['price'],
        'volume': data['volume']
    }

def scan_for_gaps():
    tickers = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN']
    results = []

    for ticker in tickers:
        try:
            data = get_stock_data(ticker)
            # Calculate gap percentage (simplified)
            gap = data['price'] * 0.05  # 5% gap example

            if gap > 2.0:  # 2% threshold
                results.append({
                    'ticker': ticker,
                    'gap_percent': gap,
                    'volume': data['volume']
                })
        except Exception as e:
            print(f"Error processing {ticker}: {e}")

    return results

if __name__ == "__main__":
    opportunities = scan_for_gaps()
    for opp in opportunities:
        print(f"Gap opportunity: {opp}")
`,

  volumeScanner: `
import requests
import pandas as pd

def get_volume_data(ticker):
    response = requests.get(f"https://api.example.com/volume/{ticker}")
    return response.json()

def calculate_volume_ratio(current_volume, avg_volume):
    return current_volume / avg_volume if avg_volume > 0 else 0

def scan_high_volume():
    tickers = ['AAPL', 'GOOGL', 'MSFT']
    high_volume_stocks = []

    for ticker in tickers:
        data = get_volume_data(ticker)
        ratio = calculate_volume_ratio(data['current'], data['average'])

        if ratio > 1.5:  # 150% of average volume
            high_volume_stocks.append({
                'ticker': ticker,
                'volume_ratio': ratio,
                'current_volume': data['current']
            })

    return high_volume_stocks
`,

  breakoutScanner: `
import pandas as pd
import requests

def get_price_history(ticker, days=30):
    response = requests.get(f"https://api.example.com/history/{ticker}?days={days}")
    return pd.DataFrame(response.json())

def detect_breakout(df):
    # Simple breakout detection
    resistance = df['high'].rolling(20).max()
    current_price = df['close'].iloc[-1]
    return current_price > resistance.iloc[-2]

def scan_breakouts():
    tickers = ['AAPL', 'GOOGL', 'MSFT', 'TSLA']
    breakouts = []

    for ticker in tickers:
        df = get_price_history(ticker)

        if detect_breakout(df):
            breakouts.append({
                'ticker': ticker,
                'current_price': df['close'].iloc[-1],
                'resistance_level': df['high'].rolling(20).max().iloc[-2]
            })

    return breakouts
`
};