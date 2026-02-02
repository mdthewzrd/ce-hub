'use client';

import React, { useState } from 'react';
import { Loader2, CheckCircle2, XCircle, Brain, Wand2 } from 'lucide-react';

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

export default function SimpleRenataV2Transformer() {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', color: '#fff' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Brain style={{ width: '28px', height: '28px', color: '#D4AF37' }} />
            <span>RENATA_V2 Code Transformer</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '5px' }}>
            Transform any trading scanner code into EdgeDev v31 standard
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {health?.available ? (
            <div style={{
              padding: '8px 16px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#10B981'
            }}>
              <CheckCircle2 style={{ width: '16px', height: '16px' }} />
              RENATA_V2 Ready
            </div>
          ) : (
            <div style={{
              padding: '8px 16px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#EF4444'
            }}>
              <XCircle style={{ width: '16px', height: '16px' }} />
              RENATA_V2 Unavailable
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Input Section */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Input Scanner Code</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Scanner Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g., GapDownScanner"
                value={scannerName}
                onChange={(e) => setScannerName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Date Range
              </label>
              <input
                type="text"
                placeholder="2024-01-01 to 2024-12-31"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                Source Code
              </label>
              <textarea
                placeholder="Paste your scanner code here..."
                style={{
                  width: '100%',
                  minHeight: '300px',
                  padding: '14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  resize: 'vertical'
                }}
                value={sourceCode}
                onChange={(e) => setSourceCode(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleTransform}
                disabled={isTransforming || !health?.available}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  background: isTransforming || !health?.available
                    ? 'rgba(212, 175, 55, 0.3)'
                    : 'linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isTransforming || !health?.available ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isTransforming ? (
                  <>
                    <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                    Transforming...
                  </>
                ) : (
                  <>
                    <Wand2 style={{ width: '16px', height: '16px' }} />
                    Transform to v31
                  </>
                )}
              </button>
              <button
                onClick={loadExample}
                disabled={isTransforming}
                style={{
                  padding: '12px 20px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: isTransforming ? 'not-allowed' : 'pointer'
                }}
              >
                Load Example
              </button>
            </div>

            {error && (
              <div style={{
                padding: '12px 16px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#EF4444'
              }}>
                <XCircle style={{ width: '16px', height: '16px' }} />
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Output Section */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Transformed Code (v31 Standard)</h3>

          {result && (
            <>
              {result.success ? (
                <>
                  <div style={{
                    padding: '12px 16px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#10B981',
                    marginBottom: '16px'
                  }}>
                    <CheckCircle2 style={{ width: '16px', height: '16px' }} />
                    Transformation successful! {result.corrections_made} corrections applied.
                  </div>

                  {result.validation_results && result.validation_results.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Validation Results</h4>
                      {result.validation_results.map((vr, idx) => (
                        <div
                          key={idx}
                          style={{
                            padding: '12px',
                            marginBottom: '8px',
                            background: vr.is_valid
                              ? 'rgba(16, 185, 129, 0.05)'
                              : 'rgba(234, 179, 8, 0.05)',
                            border: vr.is_valid
                              ? '1px solid rgba(16, 185, 129, 0.2)'
                              : '1px solid rgba(234, 179, 8, 0.2)',
                            borderRadius: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            {vr.is_valid ? (
                              <CheckCircle2 style={{ width: '16px', height: '16px', color: '#10B981' }} />
                            ) : (
                              <XCircle style={{ width: '16px', height: '16px', color: '#EAB308' }} />
                            )}
                            <span style={{ fontWeight: '600' }}>{vr.category}</span>
                          </div>
                          {vr.errors.length > 0 && (
                            <ul style={{ listStyle: 'disc', listStylePosition: 'inside', marginLeft: '20px' }}>
                              {vr.errors.map((err, i) => (
                                <li key={i} style={{ color: '#EF4444', fontSize: '13px' }}>{err}</li>
                              ))}
                            </ul>
                          )}
                          {vr.warnings.length > 0 && (
                            <ul style={{ listStyle: 'disc', listStylePosition: 'inside', marginLeft: '20px' }}>
                              {vr.warnings.map((warn, i) => (
                                <li key={i} style={{ color: '#EAB308', fontSize: '13px' }}>{warn}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {result.generated_code && (
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                        Generated Code
                      </label>
                      <textarea
                        readOnly
                        style={{
                          width: '100%',
                          minHeight: '300px',
                          padding: '14px',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '13px',
                          fontFamily: 'monospace'
                        }}
                        value={result.generated_code}
                      />
                    </div>
                  )}

                  {result.metadata && (
                    <div style={{ marginTop: '16px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                      <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>Metadata</h4>
                      <pre style={{
                        background: 'rgba(255,255,255,0.02)',
                        padding: '12px',
                        borderRadius: '8px',
                        overflow: 'auto'
                      }}>
                        {JSON.stringify(result.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              ) : (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#EF4444'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <XCircle style={{ width: '20px', height: '20px' }} />
                    <span style={{ fontWeight: '600' }}>Transformation failed:</span>
                  </div>
                  <ul style={{ listStyle: 'disc', listStylePosition: 'inside', marginLeft: '20px' }}>
                    {result.errors?.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {!result && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '300px',
              color: 'rgba(255,255,255,0.4)'
            }}>
              <div style={{ textAlign: 'center' }}>
                <Wand2 style={{ width: '64px', height: '64px', margin: '0 auto 16px', opacity: 0.2 }} />
                <p>Transformed code will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
