/**
 * Human-in-the-Loop Formatter Demo Page
 *
 * This page demonstrates the collaborative formatting system where AI and humans
 * work together to format scanner code with maximum accuracy and user control.
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import HumanInTheLoopFormatter from '../../components/HumanInTheLoopFormatter';
import CodeFormatter from '../../components/CodeFormatter';

export default function HumanFormatterPage() {
  const [comparisonResults, setComparisonResults] = useState<{
    traditional?: any;
    collaborative?: any;
  }>({});
  const [showComparison, setShowComparison] = useState(false);

  const handleTraditionalFormatComplete = useCallback((result: any) => {
    setComparisonResults(prev => ({ ...prev, traditional: result }));
    console.log('Traditional formatting completed:', result);
  }, []);

  const handleCollaborativeFormatComplete = useCallback((result: any) => {
    setComparisonResults(prev => ({ ...prev, collaborative: result }));
    console.log('Collaborative formatting completed:', result);
  }, []);

  const sampleScannerCode = `# Sample LC D2 Scanner
import pandas as pd
import numpy as np
from datetime import datetime

# Configuration
prev_close_min = 5.0
volume_threshold = 1000000
gap_percent = 3.0

def scan_ticker(ticker, start_date, end_date):
    # Get stock data
    df = get_stock_data(ticker, start_date, end_date)

    # Apply filters
    df_filtered = df[df["prev_close"] >= prev_close_min]
    df_vol = df_filtered[df_filtered["volume"] > volume_threshold]

    # Calculate gap
    df_vol['gap_pct'] = (df_vol['open'] - df_vol['prev_close']) / df_vol['prev_close'] * 100

    # Find patterns
    patterns = df_vol[df_vol['gap_pct'] >= gap_percent]

    return patterns.to_dict('records')

def main():
    results = []
    tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA']

    for ticker in tickers:
        ticker_results = scan_ticker(ticker, "2024-01-01", "2024-12-31")
        results.extend(ticker_results)

    return results

if __name__ == "__main__":
    main()`;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Human-in-the-Loop Scanner Formatter
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto">
            Experience collaborative AI formatting where you maintain full control while AI provides
            intelligent suggestions. Compare traditional automation with human-guided enhancement.
          </p>
        </div>

        {/* Philosophy Section */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-start space-x-4">
            <div className="text-4xl">🤝</div>
            <div>
              <h2 className="text-xl font-semibold mb-2">Collaborative Intelligence</h2>
              <p className="text-gray-700 mb-4">
                Our philosophy: <strong>Templates guide, don't constrain. User has final authority on all decisions.</strong>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <div className="text-2xl"> </div>
                  <div>
                    <div className="font-medium">AI Suggests</div>
                    <div className="text-sm text-gray-600">Intelligent parameter discovery</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-2xl">👤</div>
                  <div>
                    <div className="font-medium">Human Decides</div>
                    <div className="text-sm text-gray-600">Full authority over changes</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-2xl">🧠</div>
                  <div>
                    <div className="font-medium">System Learns</div>
                    <div className="text-sm text-gray-600">Improves from your feedback</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Comparison Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Formatting Approaches</h2>
            <Button
              onClick={() => setShowComparison(!showComparison)}
              variant="outline"
            >
              {showComparison ? 'Hide' : 'Show'} Side-by-Side Comparison
            </Button>
          </div>

          {showComparison && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Traditional Formatter */}
              <Card className="p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Badge variant="secondary">Traditional</Badge>
                  <h3 className="text-lg font-semibold">Automated Formatting</h3>
                </div>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div>✓ Fast automated processing</div>
                  <div>✓ Consistent rule-based enhancement</div>
                  <div>⚠ Limited user control during process</div>
                  <div>⚠ May miss context-specific optimizations</div>
                </div>
                <CodeFormatter
                  onCodeFormatted={handleTraditionalFormatComplete}
                  className="text-sm"
                />
              </Card>

              {/* Human-in-the-Loop Formatter */}
              <Card className="p-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Badge variant="default">Collaborative</Badge>
                  <h3 className="text-lg font-semibold">Human-in-the-Loop</h3>
                </div>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div>✓ AI-powered parameter discovery</div>
                  <div>✓ Step-by-step human validation</div>
                  <div>✓ Complete user control and override</div>
                  <div>✓ Learning from user preferences</div>
                </div>
                <HumanInTheLoopFormatter
                  onFormattingComplete={handleCollaborativeFormatComplete}
                  className="text-sm"
                />
              </Card>
            </div>
          )}

          {/* Results Comparison */}
          {comparisonResults.traditional && comparisonResults.collaborative && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Results Comparison</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Traditional Result</h4>
                  <div className="text-sm space-y-1">
                    <div>Parameters: {comparisonResults.traditional.metadata?.parameterCount || 'N/A'}</div>
                    <div>Optimizations: {comparisonResults.traditional.optimizations?.length || 0}</div>
                    <div>User Input: Minimal</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Collaborative Result</h4>
                  <div className="text-sm space-y-1">
                    <div>Parameters: User-validated</div>
                    <div>Enhancements: User-approved</div>
                    <div>User Input: Maximum control</div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Main Demo */}
        <Tabs defaultValue="collaborative" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="collaborative">Human-in-the-Loop</TabsTrigger>
            <TabsTrigger value="traditional">Traditional</TabsTrigger>
            <TabsTrigger value="features">Feature Comparison</TabsTrigger>
          </TabsList>

          <TabsContent value="collaborative" className="space-y-6">
            <Card className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Try the Sample Scanner</h3>
                <p className="text-gray-600 mb-4">
                  Click the button below to load a sample LC scanner and experience collaborative formatting.
                </p>
                <Button
                  onClick={() => {
                    const textarea = document.querySelector('textarea');
                    if (textarea) {
                      textarea.value = sampleScannerCode;
                      textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                  }}
                >
                  Load Sample Scanner
                </Button>
              </div>
              <HumanInTheLoopFormatter onFormattingComplete={handleCollaborativeFormatComplete} />
            </Card>
          </TabsContent>

          <TabsContent value="traditional" className="space-y-6">
            <Card className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Traditional Automated Formatting</h3>
                <p className="text-gray-600 mb-4">
                  Experience the traditional approach where AI processes everything automatically.
                </p>
              </div>
              <CodeFormatter onCodeFormatted={handleTraditionalFormatComplete} />
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Traditional Formatting</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">Speed</div>
                      <div className="text-sm text-gray-600">Fast, automated processing</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">Consistency</div>
                      <div className="text-sm text-gray-600">Rule-based, predictable results</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">Control</div>
                      <div className="text-sm text-gray-600">Limited user input during process</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">Adaptability</div>
                      <div className="text-sm text-gray-600">Fixed rules, no learning</div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Human-in-the-Loop</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">Intelligence</div>
                      <div className="text-sm text-gray-600">AI-powered parameter discovery</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">Control</div>
                      <div className="text-sm text-gray-600">Complete user authority</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">Learning</div>
                      <div className="text-sm text-gray-600">Adapts to user preferences</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium">Transparency</div>
                      <div className="text-sm text-gray-600">Step-by-step process visibility</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Process Flow */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Human-in-the-Loop Process Flow</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <h4 className="font-medium mb-1">Parameter Discovery</h4>
                  <p className="text-sm text-gray-600">AI identifies parameters with confidence scores</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 font-bold">2</span>
                  </div>
                  <h4 className="font-medium mb-1">Infrastructure</h4>
                  <p className="text-sm text-gray-600">User approves production enhancements</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 font-bold">3</span>
                  </div>
                  <h4 className="font-medium mb-1">Optimization</h4>
                  <p className="text-sm text-gray-600">Performance improvements with user control</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 font-bold">4</span>
                  </div>
                  <h4 className="font-medium mb-1">Validation</h4>
                  <p className="text-sm text-gray-600">Final preview and user approval</p>
                </div>
              </div>
            </Card>

            {/* Benefits */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Why Human-in-the-Loop?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">For Complex Scanners</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• LC D2 scanners with sophisticated logic</li>
                    <li>• SC DMR scanners with complex parameters</li>
                    <li>• Custom scanners with unique patterns</li>
                    <li>• Legacy code requiring careful preservation</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Key Benefits</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• 100% parameter preservation guarantee</li>
                    <li>• Context-aware enhancement suggestions</li>
                    <li>• Learning from domain expertise</li>
                    <li>• Transparent, explainable process</li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}