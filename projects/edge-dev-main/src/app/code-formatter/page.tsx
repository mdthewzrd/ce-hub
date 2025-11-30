/**
 * Code Formatter Demo Page
 *
 * Demonstration page showing the AI Trading Code Formatter integration
 * with the Edge.dev platform.
 */

'use client';

import React, { useState } from 'react';
import CodeFormatter from '../../components/CodeFormatter';
import { type FormattingResult } from '../../utils/codeFormatterAPI';

// Sample trading code (moved from test file to avoid build issues)
const sampleTradingCode = {
  basicScanner: `import pandas as pd
import requests
import time
from datetime import datetime

def basic_gap_scanner():
    # Basic gap scanner implementation
    symbols = ['AAPL', 'MSFT', 'GOOGL']
    results = []

    for symbol in symbols:
        # Mock API call - replace with real data
        data = {'symbol': symbol, 'gap': 5.2, 'volume': 1000000}
        if data['gap'] > 3.0:
            results.append(data)

    return results

if __name__ == "__main__":
    gaps = basic_gap_scanner()
    print(f"Found {len(gaps)} gap opportunities")`,

  volumeScanner: `import pandas as pd
import requests
from datetime import datetime

def volume_scanner():
    # Volume-based scanner
    symbols = ['SPY', 'QQQ', 'IWM']
    high_volume = []

    for symbol in symbols:
        volume_data = {'symbol': symbol, 'volume': 2000000, 'avg_volume': 1000000}
        volume_ratio = volume_data['volume'] / volume_data['avg_volume']

        if volume_ratio > 2.0:
            high_volume.append({
                'symbol': symbol,
                'volume_ratio': volume_ratio,
                'current_volume': volume_data['volume']
            })

    return high_volume`,

  breakoutScanner: `import pandas as pd
import numpy as np
from datetime import datetime

def breakout_scanner():
    # Price breakout scanner
    symbols = ['TSLA', 'AMD', 'NVDA']
    breakouts = []

    for symbol in symbols:
        price_data = {
            'symbol': symbol,
            'current_price': 150.0,
            'resistance': 148.0,
            'volume': 1500000
        }

        if price_data['current_price'] > price_data['resistance']:
            breakouts.append({
                'symbol': symbol,
                'breakout_strength': (price_data['current_price'] - price_data['resistance']) / price_data['resistance'],
                'volume': price_data['volume']
            })

    return breakouts`
};

export default function CodeFormatterPage() {
  const [lastFormattedResult, setLastFormattedResult] = useState<FormattingResult | null>(null);
  const [selectedSample, setSelectedSample] = useState<keyof typeof sampleTradingCode>('basicScanner');

  const handleCodeFormatted = (result: FormattingResult) => {
    setLastFormattedResult(result);
    console.log('Code formatting completed:', result);
  };

  const loadSampleCode = () => {
    // This would be handled by setting the input code directly in the CodeFormatter component
    // For demo purposes, we'll just show which sample was selected
    console.log('Loading sample:', selectedSample);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Edge.dev AI Code Formatter
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transform your Python trading scanners with advanced optimizations including
            multiprocessing, async patterns, and Edge.dev ecosystem integration.
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-2xl font-bold text-blue-600 mb-2"> </div>
            <h3 className="text-lg font-semibold mb-2">Performance Optimization</h3>
            <p className="text-gray-600 text-sm">
              Automatic conversion to async/await patterns and multiprocessing
              for concurrent data processing and API calls.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-2xl font-bold text-green-600 mb-2">📦</div>
            <h3 className="text-lg font-semibold mb-2">Trading Ecosystem</h3>
            <p className="text-gray-600 text-sm">
              Integration with pandas_market_calendars, plotly charting,
              and standardized output formats for Edge.dev compatibility.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-2xl font-bold text-purple-600 mb-2">🛡️</div>
            <h3 className="text-lg font-semibold mb-2">Production Ready</h3>
            <p className="text-gray-600 text-sm">
              Comprehensive error handling, logging, retry logic with backoff,
              and production-grade code patterns.
            </p>
          </div>
        </div>

        {/* Sample Code Loader */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Try Sample Trading Scanners</h2>
          <div className="flex items-center gap-4 mb-4">
            <select
              value={selectedSample}
              onChange={(e) => setSelectedSample(e.target.value as keyof typeof sampleTradingCode)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="basicScanner">Basic Gap Scanner</option>
              <option value="volumeScanner">Volume Scanner</option>
              <option value="breakoutScanner">Breakout Scanner</option>
            </select>
            <button
              onClick={loadSampleCode}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Load Sample
            </button>
          </div>

          {/* Sample Code Preview */}
          <div className="bg-gray-100 rounded-md p-4">
            <h4 className="font-medium mb-2">Sample Code Preview:</h4>
            <pre className="text-sm text-gray-700 overflow-x-auto max-h-40">
              {sampleTradingCode[selectedSample].slice(0, 500)}...
            </pre>
          </div>
        </div>

        {/* Main Code Formatter Component */}
        <CodeFormatter
          onCodeFormatted={handleCodeFormatted}
          defaultOptions={{
            enableMultiprocessing: true,
            enableAsyncPatterns: true,
            addTradingPackages: true,
            standardizeOutput: true,
            optimizePerformance: true,
            addErrorHandling: true,
            includeLogging: true
          }}
          className="mb-8"
        />

        {/* Results Summary */}
        {lastFormattedResult && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Formatting Results Summary</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {lastFormattedResult.metadata.formattedLines}
                </div>
                <div className="text-sm text-blue-800">Lines of Code</div>
                <div className="text-xs text-blue-600">
                  (+{lastFormattedResult.metadata.formattedLines - lastFormattedResult.metadata.originalLines} added)
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {lastFormattedResult.optimizations.length}
                </div>
                <div className="text-sm text-green-800">Optimizations Applied</div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {lastFormattedResult.metadata.parameterCount}
                </div>
                <div className="text-sm text-purple-800">Parameters</div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {lastFormattedResult.metadata.infrastructureEnhancements.length}
                </div>
                <div className="text-sm text-yellow-800">Infrastructure Enhancements</div>
              </div>
            </div>

            {/* Infrastructure Enhancement Details */}
            {lastFormattedResult.metadata.infrastructureEnhancements.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Applied Infrastructure Enhancements:</h4>
                <ul className="text-sm space-y-1">
                  {lastFormattedResult.metadata.infrastructureEnhancements.map((enhancement, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2 text-gray-400">•</span>
                      <span>{enhancement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Integration Guide */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">Integration Guide</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">1. Basic Usage</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import { useCodeFormatter } from '../utils/codeFormatterAPI';

function MyComponent() {
  const { formatCode, isFormatting } = useCodeFormatter();

  const handleFormat = async () => {
    const result = await formatCode(pythonCode);
    console.log('Formatted:', result.formattedCode);
  };

  return (
    <button onClick={handleFormat} disabled={isFormatting}>
      {isFormatting ? 'Formatting...' : 'Format Code'}
    </button>
  );
}`}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">2. Service Integration</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import { CodeFormatterService } from '../utils/codeFormatterAPI';

// Direct service usage
const result = await CodeFormatterService.formatTradingCode(code, options);

// Generate templates
const template = CodeFormatterService.generateScannerTemplate('gap');

// Get optimization suggestions
const suggestions = CodeFormatterService.getOptimizationSuggestions(code);`}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">3. Upload Handler Integration</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`// In your file upload handler
import { codeFormatter } from '../utils/codeFormatter';

export async function handlePythonUpload(file: File) {
  const code = await file.text();
  const formatted = await codeFormatter.formatTradingCode(code, {
    enableMultiprocessing: true,
    enableAsyncPatterns: true,
    addTradingPackages: true
  });

  return formatted;
}`}
              </pre>
            </div>
          </div>
        </div>

        {/* Standard Package Reference */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">Standard Package Set</h2>
          <p className="text-gray-600 mb-4">
            The formatter automatically adds these optimized packages to your trading code:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Core Libraries</h4>
              <ul className="text-sm space-y-1 font-mono">
                <li>• pandas as pd</li>
                <li>• numpy as np</li>
                <li>• requests</li>
                <li>• time</li>
                <li>• datetime</li>
                <li>• logging</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Trading & Performance</h4>
              <ul className="text-sm space-y-1 font-mono">
                <li>• pandas_market_calendars as mcal</li>
                <li>• plotly.graph_objects as go</li>
                <li>• aiohttp, asyncio</li>
                <li>• concurrent.futures</li>
                <li>• dask, dask.dataframe</li>
                <li>• backoff, tabulate</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}