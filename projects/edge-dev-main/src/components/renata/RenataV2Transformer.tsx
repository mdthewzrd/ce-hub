'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, Wand2 } from 'lucide-react';

interface TransformResult {
  success: boolean;
  generated_code?: string;
  validation_results?: Array<{
    category: string;
    is_valid: boolean;
    errors: string[];
    warnings: string[];
  }>;
  metadata?: Record<string, any>;
  errors?: string[];
  corrections_made: number;
}

export default function RenataV2Transformer() {
  const [sourceCode, setSourceCode] = useState('');
  const [scannerName, setScannerName] = useState('');
  const [dateRange, setDateRange] = useState('2024-01-01 to 2024-12-31');
  const [isTransforming, setIsTransforming] = useState(false);
  const [result, setResult] = useState<TransformResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<any>(null);

  const checkHealth = async () => {
    try {
      const response = await fetch('/api/renata_v2/transform');
      const healthData = await response.json();
      setHealth(healthData);
    } catch (err) {
      setHealth({ available: false, error: 'Failed to check health' });
    }
  };

  const handleTransform = async () => {
    if (!sourceCode.trim()) {
      setError('Please enter source code to transform');
      return;
    }

    setIsTransforming(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/renata_v2/transform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_code: sourceCode,
          scanner_name: scannerName || undefined,
          date_range: dateRange,
          verbose: true
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Transformation failed');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsTransforming(false);
    }
  };

  const loadExample = () => {
    setSourceCode(`def run_scan():
    """Scan for gap down setups"""
    results = []

    tickers = ["AAPL", "MSFT", "GOOGL"]

    for ticker in tickers:
        df = get_data(ticker)

        # Calculate gap
        df['gap'] = (df['open'] / df['close'].shift(1)) - 1

        # Find signals
        signals = df[
            (df['gap'] <= -0.5) &
            (df['volume'] >= 1000000)
        ]

        results.extend(signals.to_dict('records'))

    return results`);
    setScannerName('GapDownExample');
  };

  React.useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wand2 className="w-8 h-8 text-purple-500" />
            RENATA_V2 Code Transformer
          </h1>
          <p className="text-muted-foreground mt-2">
            Transform any trading scanner code into EdgeDev v31 standard
          </p>
        </div>
        <div className="flex items-center gap-2">
          {health?.available ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                RENATA_V2 Ready
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-red-50 border-red-200">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                RENATA_V2 Unavailable
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Input Scanner Code</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Scanner Name (Optional)
              </label>
              <Input
                placeholder="e.g., GapDownScanner"
                value={scannerName}
                onChange={(e) => setScannerName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Date Range
              </label>
              <Input
                placeholder="2024-01-01 to 2024-12-31"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Source Code
              </label>
              <Textarea
                placeholder="Paste your scanner code here..."
                className="min-h-[400px] font-mono text-sm"
                value={sourceCode}
                onChange={(e) => setSourceCode(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleTransform}
                disabled={isTransforming || !health?.available}
                className="flex-1"
              >
                {isTransforming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Transforming...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Transform to v31
                  </>
                )}
              </Button>
              <Button
                onClick={loadExample}
                variant="outline"
              >
                Load Example
              </Button>
            </div>

            {error && (
              <Alert className="bg-red-50 border-red-200">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card>
          <CardHeader>
            <CardTitle>Transformed Code (v31 Standard)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result && (
              <>
                {result.success ? (
                  <>
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        Transformation successful! {result.corrections_made} corrections applied.
                      </AlertDescription>
                    </Alert>

                    {result.validation_results && result.validation_results.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="font-semibold">Validation Results</h3>
                        {result.validation_results.map((vr, idx) => (
                          <Alert
                            key={idx}
                            className={vr.is_valid
                              ? 'bg-green-50 border-green-200'
                              : 'bg-yellow-50 border-yellow-200'
                            }
                          >
                            {vr.is_valid ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                            <AlertDescription>
                              <div className="font-semibold">{vr.category}</div>
                              {vr.errors.length > 0 && (
                                <ul className="list-disc list-inside text-sm mt-1">
                                  {vr.errors.map((err, i) => (
                                    <li key={i} className="text-red-600">{err}</li>
                                  ))}
                                </ul>
                              )}
                              {vr.warnings.length > 0 && (
                                <ul className="list-disc list-inside text-sm mt-1">
                                  {vr.warnings.map((warn, i) => (
                                    <li key={i} className="text-yellow-600">{warn}</li>
                                  ))}
                                </ul>
                              )}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    )}

                    {result.generated_code && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Generated Code
                        </label>
                        <Textarea
                          readOnly
                          className="min-h-[400px] font-mono text-sm"
                          value={result.generated_code}
                        />
                      </div>
                    )}

                    {result.metadata && (
                      <div className="text-sm text-muted-foreground">
                        <h3 className="font-semibold mb-2">Metadata</h3>
                        <pre className="bg-muted p-2 rounded">
                          {JSON.stringify(result.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </>
                ) : (
                  <Alert className="bg-red-50 border-red-200">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      Transformation failed:
                      <ul className="list-disc list-inside mt-2">
                        {result.errors?.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            {!result && (
              <div className="flex items-center justify-center h-96 text-muted-foreground">
                <div className="text-center">
                  <Wand2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Transformed code will appear here</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
