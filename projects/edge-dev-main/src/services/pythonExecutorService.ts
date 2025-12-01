/**
 * Real Python Code Execution Service
 * Executes uploaded Python scanner code using subprocess isolation
 * Connects to real Polygon API for market data
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { marketUniverseService, type MarketUniverseConfig } from './marketUniverseService';

export interface ExecutionRequest {
  code: string;
  start_date: string;
  end_date: string;
  scanner_type: 'lc' | 'a_plus' | 'custom';
  api_key?: string;
  symbols?: string[];
  parameters?: Record<string, any>;
}

export interface ExecutionResult {
  success: boolean;
  results?: Array<{
    ticker: string;
    date: string;
    [key: string]: any;
  }>;
  error?: string;
  execution_time?: number;
  execution_id: string;
  log_output?: string[];
}

export class PythonExecutorService {
  private readonly tempDir: string;
  private readonly pythonExecutorPath: string;

  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp_scanners');
    this.pythonExecutorPath = path.join(process.cwd(), 'backend', 'lc_d2_subprocess_executor_fixed.py');
  }

  /**
   * Execute Python scanner code with real market data and COMPLETE market universe
   */
  async executeScanner(request: ExecutionRequest): Promise<ExecutionResult> {
    const executionId = uuidv4();
    const startTime = Date.now();

    try {
      console.log(`🚀 REAL EXECUTION: Starting Python scanner execution`);
      console.log(`📅 Date range: ${request.start_date} to ${request.end_date}`);
      console.log(`🔧 Scanner type: ${request.scanner_type}`);

      // Ensure temp directory exists
      await fs.mkdir(this.tempDir, { recursive: true });

      // Create temporary scanner file
      const scannerFileName = `scanner_${executionId}.py`;
      const scannerFilePath = path.join(this.tempDir, scannerFileName);

      // Prepare the execution code
      const executionCode = await this.prepareExecutionCode(request);
      await fs.writeFile(scannerFilePath, executionCode);

      // Execute the Python code
      const results = await this.executePythonFile(scannerFilePath, request);

      const executionTime = Date.now() - startTime;

      // Clean up temporary file
      await fs.unlink(scannerFilePath).catch(console.error);

      return {
        success: true,
        results: results,
        execution_time: executionTime / 1000,
        execution_id: executionId
      };

    } catch (error) {
      console.error(`❌ Execution failed for ${executionId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown execution error',
        execution_id: executionId,
        execution_time: (Date.now() - startTime) / 1000
      };
    }
  }

  /**
   * Prepare the Python code for execution with MARKET-WIDE SCANNING
   * Uses Polygon grouped API for complete market coverage
   */
  private async prepareExecutionCode(request: ExecutionRequest): Promise<string> {
    // Extract the user's code
    let userCode = request.code;

    console.log('🌍 Setting up MARKET-WIDE scanning using Polygon grouped API...');

    // Market-wide configuration for ALL scanners
    const marketWideConfig = `
# MARKET-WIDE SCANNING CONFIGURATION (Required for ALL scanners)
import json
import sys
import pandas as pd
import requests
import asyncio
import aiohttp
from datetime import datetime, timedelta

# Essential configuration
API_KEY = "${request.api_key || 'Fm7brz4s23eSocDErnL68cE7wspz2K1I'}"
BASE_URL = "https://api.polygon.io"
PRINT_FROM = "${request.start_date}"
PRINT_TO = "${request.end_date}"

# MARKET-WIDE DATA FETCHING - Fetches ALL stocks dynamically (no symbol lists)
async def fetch_market_data(date, adjusted="true"):
    """Fetch ALL market data for a specific date using Polygon grouped API"""
    url = f"{BASE_URL}/v2/aggs/grouped/locale/us/market/stocks/{date}?adjusted={adjusted}&apiKey={API_KEY}"
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            if response.status == 200:
                data = await response.json()
                if 'results' in data:
                    df = pd.DataFrame(data['results'])
                    df['date'] = pd.to_datetime(df['t'], unit='ms').dt.date
                    df.rename(columns={'T': 'ticker'}, inplace=True)
                    return df
    return pd.DataFrame()

def get_all_market_data():
    """Get complete market data for date range - THIS REPLACES SYMBOLS LISTS"""
    print(f"🚀 Fetching MARKET-WIDE data from {PRINT_FROM} to {PRINT_TO}")

    # Generate date range
    dates = pd.date_range(start=PRINT_FROM, end=PRINT_TO, freq='D')
    dates = [d.strftime('%Y-%m-%d') for d in dates]

    # Fetch ALL market data
    all_data = []
    for date in dates:
        try:
            df = asyncio.run(fetch_market_data(date))
            if not df.empty:
                all_data.append(df)
                print(f"✅ Fetched {len(df)} symbols for {date}")
        except Exception as e:
            print(f"❌ Error fetching {date}: {e}")

    if not all_data:
        raise Exception("No market data fetched")

    # Combine all data
    df = pd.concat(all_data, ignore_index=True)
    print(f"📊 MARKET-WIDE: {len(df)} data points across {df['ticker'].nunique()} unique tickers")

    # Sort by ticker and date for proper time series analysis
    df = df.sort_values(['ticker', 'date'])

    # Filter by requested date range
    df = df[(pd.to_datetime(df['date']) >= pd.to_datetime(PRINT_FROM)) &
           (pd.to_datetime(df['date']) <= pd.to_datetime(PRINT_TO))]

    return df

# SMART FILTERING: Intelligently filter market universe for performance
def apply_smart_filters(df):
    """Apply intelligent filters to reduce universe while preserving trading signals"""
    print(f"🧠 Applying smart filters to {len(df)} market data points...")

    # Basic quality filters - remove junk data
    df = df.dropna(subset=['o', 'h', 'l', 'c', 'v'])  # Remove rows with missing OHLCV
    df = df[df['v'] > 0]  # Remove zero-volume data
    df = df[df['c'] >= 1.0]  # Remove penny stocks and below

    # Liquidity filter - keep only liquid stocks (reduces universe significantly)
    avg_dollar_volume = (df['c'] * df['v']).groupby(df['ticker']).transform('mean')
    liquid_threshold = 1_000_000  # $1M average daily volume
    liquid_tickers = avg_dollar_volume >= liquid_threshold
    df = df[liquid_tickers]

    # Price range filter - focus on tradeable price range
    df = df[(df['c'] >= 5.0) & (df['c'] <= 1000.0)]

    # Volatility filter - keep stocks with reasonable price movement
    price_change_pct = abs(df['c'] - df['o']) / df['o']
    df = df[price_change_pct <= 0.50]  # Remove extreme >50% daily moves (likely data errors)

    filtered_tickers = df['ticker'].nunique()
    original_points = len(df)

    print(f"✅ Smart filtering complete:")
    print(f"   📊 Unique tickers: {filtered_tickers}")
    print(f"   📈 Data points: {original_points}")
    print(f"   🎯 Focus on high-quality, liquid stocks")

    return df

# CRITICAL: Create global MARKET_WIDE_DATA for scanners to use
RAW_MARKET_DATA = get_all_market_data()
MARKET_WIDE_DATA = apply_smart_filters(RAW_MARKET_DATA)
print(f"🌍 SMART-FILTERED MARKET-WIDE scanning active: {len(MARKET_WIDE_DATA)} market data points loaded")

# Helper function for scanners to get market data
def get_market_wide_data():
    """Return complete market data - scanners should use this instead of SYMBOLS lists"""
    return MARKET_WIDE_DATA

# Override any SYMBOLS variable in user code with market-wide approach
if 'SYMBOLS' in globals():
    print("⚠️  Replaced hardcoded SYMBOLS with MARKET-WIDE data")
    del SYMBOLS
`;

    try {
      // Execution wrapper that runs user's code with MARKET-WIDE data
      const executionWrapper = marketWideConfig + `

# Import required libraries for execution wrapper
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

# Helper function to safely convert numpy types to Python native types
def safe_convert(value):
    import numpy as np
    if hasattr(value, 'item'):
        return value.item()
    elif hasattr(value, 'astype'):
        return float(value)
    elif isinstance(value, np.ndarray):
        return value.tolist()
    elif isinstance(value, (np.int64, np.int32, np.float64, np.float32)):
        return float(value)
    elif isinstance(value, (np.bool_, bool)):
        return bool(value)
    return value

# User's scanner code - MARKET-WIDE data is available as MARKET_WIDE_DATA
` + userCode + `

print("🌍 MARKET-WIDE execution: User code loaded with complete market data")

# MARKET-WIDE execution wrapper
if __name__ == "__main__":
    try:
        print(f"🚀 Starting MARKET-WIDE scanner execution from {PRINT_FROM} to {PRINT_TO}")
        print(f"📊 Processing {len(MARKET_WIDE_DATA)} market data points across {MARKET_WIDE_DATA['ticker'].nunique()} tickers")

        results = []

        # MARKET-WIDE SCANNING LOGIC
        if 'scan_symbol' in globals():
            # Traditional scanner approach - iterate through all tickers in market data
            print("🔧 Using symbol-by-symbol MARKET-WIDE scanning")

            def execute_scan_symbol(sym):
                try:
                    df_sym = MARKET_WIDE_DATA[MARKET_WIDE_DATA['ticker'] == sym].copy()
                    if not df_sym.empty:
                        # Convert data format to match traditional scanner expectations
                        df_sym['Date'] = pd.to_datetime(df_sym['date'])
                        df_sym = df_sym.set_index('Date')
                        df_sym = df_sym.rename(columns={'o': 'Open', 'h': 'High', 'l': 'Low', 'c': 'Close', 'v': 'Volume'})

                        # Call user's scan function
                        result_df = globals()['scan_symbol'](sym, PRINT_FROM, PRINT_TO)
                        if result_df is not None and not result_df.empty:
                            return result_df
                except Exception as e:
                    print(f"❌ Error scanning {sym}: {e}")
                return None

            # Process all unique tickers from market data
            all_tickers = sorted(MARKET_WIDE_DATA['ticker'].unique())
            print(f"🌍 Processing {len(all_tickers)} tickers from MARKET-WIDE data")

            # Batch processing for performance
            batch_size = 100
            max_workers = 6

            for i in range(0, len(all_tickers), batch_size):
                batch_tickers = all_tickers[i:i+batch_size]
                print("📊 Batch {}: Processing {} tickers".format(i//batch_size + 1, len(batch_tickers)))

                batch_results = []
                with ThreadPoolExecutor(max_workers=max_workers) as executor:
                    futures = {executor.submit(execute_scan_symbol, sym): sym for sym in batch_tickers}
                    for future in as_completed(futures):
                        try:
                            df = future.result()
                            if df is not None and not df.empty:
                                batch_results.append(df)
                        except Exception as e:
                            print(f"❌ Batch error: {e}")

                if batch_results:
                    results.extend(batch_results)
                    print(f"✅ Batch complete: {len(batch_results)} results")

        else:
            # Market-wide scanner approach - user processes MARKET_WIDE_DATA directly
            print("🔧 Using MARKET-WIDE data processing approach")

            # User code should process MARKET_WIDE_DATA directly
            # Look for results in global scope after user code execution
            for var_name, var_value in globals().items():
                if var_name not in ['MARKET_WIDE_DATA', 'results'] and hasattr(var_value, '__iter__'):
                    try:
                        if hasattr(var_value, '__len__') and len(var_value) > 0:
                            # Convert DataFrames or lists of results
                            import pandas as pd
                            if isinstance(var_value, pd.DataFrame) and not var_value.empty:
                                results.append(var_value)
                            elif isinstance(var_value, list):
                                for item in var_value:
                                    if isinstance(item, pd.DataFrame) and not item.empty:
                                        results.append(item)
                    except:
                        continue

        print(f"✅ MARKET-WIDE scan completed: Found results across {len(results)} data sets")

        # Convert results to our expected format
        signals = []
        if results:
            # Combine all result DataFrames
            import pandas as pd
            try:
                out = pd.concat(results, ignore_index=True)

                # Convert date columns properly
                if 'Date' in out.columns:
                    out['Date'] = pd.to_datetime(out['Date'])
                    if PRINT_FROM:
                        out = out[out['Date'] >= pd.to_datetime(PRINT_FROM)]
                    if PRINT_TO:
                        out = out[out['Date'] <= pd.to_datetime(PRINT_TO)]

                # Convert each row to our signal format
                for _, row in out.iterrows():
                    signal = {
                        'ticker': safe_convert(row.get('Ticker', row.get('ticker', ''))),
                        'date': str(row.get('Date', row.get('date', ''))),
                        'trigger': safe_convert(row.get('Trigger', row.get('trigger', ''))),
                        'pos_abs': safe_convert(row.get('PosAbs_1000d', 0)),
                        'gap_atr': safe_convert(row.get('Gap/ATR', 0)),
                        'volume': int(safe_convert(row.get('D1Vol(shares)', row.get('Volume', row.get('volume', 0))))),
                        'volume_avg_ratio': safe_convert(row.get('D1Vol/Avg', 0)),
                        'open_prev_high': bool(row.get('Open>PrevHigh', False)),
                        'slope_5d': safe_convert(row.get('Slope9_5d', 0)),
                        'score': round(float(safe_convert(row.get('Gap/ATR', 0))), 2)
                    }
                    signals.append(signal)
            except Exception as e:
                print(f"❌ Error combining results: {e}")
                # Fallback: just return raw results
                for result_set in results:
                    if hasattr(result_set, 'to_dict'):
                        for _, row in result_set.iterrows():
                            signal = {'ticker': '', 'date': '', 'gap_atr': 0}
                            for col, val in row.items():
                                if col.lower() in ['ticker', 'symbol']:
                                    signal['ticker'] = str(val)
                                elif col.lower() in ['date']:
                                    signal['date'] = str(val)
                                elif 'gap' in col.lower() and 'atr' in col.lower():
                                    signal['gap_atr'] = float(val)
                                    signal['score'] = round(float(val), 2)
                            signals.append(signal)

        print(f"✅ MARKET-WIDE scan completed: Found {len(signals)} trading opportunities")

        # Output in JSON format for Edge.dev
        symbols_scanned_count = MARKET_WIDE_DATA['ticker'].nunique() if 'MARKET_WIDE_DATA' in globals() else 'market-wide'
        result = {
            'success': True,
            'results': signals,
            'total_signals': len(signals),
            'symbols_scanned': symbols_scanned_count,
            'execution_time': datetime.now().isoformat(),
            'message': f'MARKET-WIDE execution completed across {symbols_scanned_count} symbols'
        }

        print(json.dumps(result, indent=2))

    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e),
            'execution_time': datetime.now().isoformat()
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)
      `;

      return executionWrapper;

    } catch (error) {
      console.error('❌ Market-wide scanning setup failed:', error);
      throw error; // NO FALLBACK - ALL scanners must be market-wide
    }
  }

  /**
   * Execute Python file and capture results
   */
  private async executePythonFile(filePath: string, request: ExecutionRequest): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python3', [filePath], {
        cwd: this.tempDir,
        env: {
          ...process.env,
          PYTHONPATH: path.join(process.cwd(), 'backend')
        }
      });

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            // Extract JSON from output
            let jsonMatch = output.match(/\{[\s\S]*"success"[\s\S]*\}/);

            if (!jsonMatch) {
              const lines = output.trim().split('\n');
              for (let i = lines.length - 1; i >= 0; i--) {
                const line = lines[i].trim();
                if (line.startsWith('{') && line.endsWith('}')) {
                  try {
                    JSON.parse(line);
                    jsonMatch = [line];
                    break;
                  } catch (e) {
                    continue;
                  }
                }
              }
            }

            if (!jsonMatch) {
              console.error('No JSON found in Python output');
              throw new Error('No valid JSON found in Python output');
            }

            const result = JSON.parse(jsonMatch[0]);
            console.log('✅ Python execution result:', result);

            if (result.success && result.results) {
              console.log(`✅ Found ${result.results.length} trading signals`);
              resolve(result.results);
            } else if (result.success) {
              resolve(result.results || []);
            } else {
              reject(new Error(result.error || 'Python execution failed'));
            }
          } catch (parseError) {
            console.error('Failed to parse Python output:', parseError);
            reject(new Error('Failed to parse Python execution results'));
          }
        } else {
          reject(new Error(`Python process exited with code ${code}: ${errorOutput}`));
        }
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });
  }
}

export const pythonExecutorService = new PythonExecutorService();