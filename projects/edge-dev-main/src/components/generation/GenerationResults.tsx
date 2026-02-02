/**
 * Generation Results Component
 * Display results from scanner generation
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Check,
  X,
  Code,
  FileText,
  Settings,
  BarChart3,
  AlertTriangle,
  Lightbulb,
  Download,
  Copy,
  Save,
  ChevronDown,
  ChevronUp,
  TrendingUp
} from 'lucide-react';
import { generateId } from '@/utils/aiUtils';
import type { GenerationResult } from '@/services/scannerGenerationService';

interface GenerationResultsProps {
  result: GenerationResult;
  onRegenerate?: () => void;
}

export function GenerationResults({ result, onRegenerate }: GenerationResultsProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!result.success && !result.intermediate_state) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <div className="flex items-start gap-3">
          <div className="text-red-600">
            <X className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-red-900">Generation Failed</h4>
            <div className="mt-2 space-y-1">
              {result.errors?.map((error, i) => (
                <p key={i} className="text-sm text-red-700">
                  • {error}
                </p>
              ))}
            </div>
            {result.suggestions && result.suggestions.length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-medium text-red-900 mb-2">Suggestions:</h5>
                <ul className="space-y-1">
                  {result.suggestions.map((suggestion, i) => (
                    <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                      <Lightbulb className="w-3 h-3 mt-1 flex-shrink-0" />
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {onRegenerate && (
              <Button
                variant="outline"
                onClick={onRegenerate}
                className="mt-4 gap-2"
              >
                Try Again
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const copyCode = async () => {
    if (!result.scanner) return;

    try {
      await navigator.clipboard.writeText(result.scanner.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadCode = () => {
    if (!result.scanner) return;

    const blob = new Blob([result.scanner.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${result.scanner.name.replace(/[^a-z0-9]/gi, '_')}.py`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const saveScanner = async () => {
    if (!result.scanner) return;

    // In a real implementation, this would save to a database or file system
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const scanner = result.scanner;
  const confidence = result.metadata.confidence_score;
  const confidenceColor = confidence >= 0.8 ? 'text-green-600' : confidence >= 0.6 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="space-y-4">
      {/* Success Header */}
      <Card className="p-6 border-green-200 bg-green-50">
        <div className="flex items-start gap-3">
          <div className="text-green-600">
            <Check className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-green-900">Scanner Generated Successfully</h4>
            <div className="flex items-center gap-4 mt-2 text-sm text-green-700">
              <span>Method: {result.metadata.generation_method}</span>
              <span>•</span>
              <span>Time: {result.metadata.processing_time_ms}ms</span>
              <span>•</span>
              <span className={confidenceColor}>
                Confidence: {(confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyCode}
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadCode}
              className="gap-2"
            >
              <Download className="w-3 h-3" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={saveScanner}
              className="gap-2"
            >
              {saved ? (
                <>
                  <Check className="w-3 h-3" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-3 h-3" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Warnings */}
      {result.warnings && result.warnings.length > 0 && (
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-sm text-yellow-900">Warnings</h4>
              <ul className="mt-2 space-y-1 text-sm text-yellow-800">
                {result.warnings.map((warning, i) => (
                  <li key={i}>• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Scanner Details */}
      {scanner && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="gap-2">
              <FileText className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="code" className="gap-2">
              <Code className="w-4 h-4" />
              Code
            </TabsTrigger>
            <TabsTrigger value="parameters" className="gap-2">
              <Settings className="w-4 h-4" />
              Parameters
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Results
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card className="p-4">
              <h4 className="font-semibold mb-3">Scanner Information</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Name</span>
                    <p className="font-medium">{scanner.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Type</span>
                    <p className="font-medium">{scanner.scanner_type}</p>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Description</span>
                  <p className="text-sm mt-1">{scanner.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Language</span>
                    <p className="font-medium">{scanner.language}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Generated</span>
                    <p className="font-medium">
                      {new Date(scanner.metadata.generated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Patterns Used</span>
                  <div className="flex items-center gap-2 mt-1">
                    {scanner.patterns_used.map((pattern, i) => (
                      <Badge key={i} variant="outline">
                        {pattern}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {scanner.requirements.length > 0 && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Requirements</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSection('requirements')}
                  >
                    {expandedSections.has('requirements') ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {expandedSections.has('requirements') && (
                  <div className="space-y-2">
                    {scanner.requirements.map((req, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 border rounded-lg">
                        <Badge
                          variant={
                            req.priority === 'critical' ? 'destructive' :
                            req.priority === 'high' ? 'default' :
                            'secondary'
                          }
                        >
                          {req.priority}
                        </Badge>
                        <div className="flex-1">
                          <p className="text-sm">{req.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Type: {req.type} • Confidence: {(req.confidence * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {result.suggestions && result.suggestions.length > 0 && (
              <Card className="p-4 border-blue-200 bg-blue-50">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-blue-900">Suggestions</h4>
                    <ul className="mt-2 space-y-1 text-sm text-blue-800">
                      {result.suggestions.map((suggestion, i) => (
                        <li key={i}>• {suggestion}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Code Tab */}
          <TabsContent value="code" className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Generated Code</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{scanner.language}</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyCode}
                    className="gap-2"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </Button>
                </div>
              </div>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm max-h-96 overflow-y-auto">
                  <code>{scanner.code}</code>
                </pre>
              </div>
            </Card>
          </TabsContent>

          {/* Parameters Tab */}
          <TabsContent value="parameters" className="space-y-4">
            <Card className="p-4">
              <h4 className="font-semibold mb-3">Parameters</h4>
              <div className="space-y-3">
                {Object.entries(scanner.parameters).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">{key}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {typeof value === 'number' ? 'Numeric parameter' : 'Custom parameter'}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {JSON.stringify(value)}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-4">
            {scanner.metadata.test_results ? (
              <>
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold">Backtest Results</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <span className="text-sm text-muted-foreground">Total Trades</span>
                      <p className="text-2xl font-bold">
                        {scanner.metadata.test_results.total_trades || 0}
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <span className="text-sm text-muted-foreground">Win Rate</span>
                      <p className="text-2xl font-bold text-green-600">
                        {((scanner.metadata.test_results.win_rate || 0) * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <span className="text-sm text-muted-foreground">Profit Factor</span>
                      <p className="text-2xl font-bold">
                        {scanner.metadata.test_results.profit_factor?.toFixed(2) || 'N/A'}
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <span className="text-sm text-muted-foreground">Max Drawdown</span>
                      <p className="text-2xl font-bold text-red-600">
                        {((scanner.metadata.test_results.max_drawdown || 0) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <span className="text-sm text-muted-foreground">Sharpe Ratio</span>
                      <p className="text-2xl font-bold">
                        {scanner.metadata.test_results.sharpe_ratio?.toFixed(2) || 'N/A'}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h4 className="font-semibold mb-2">Performance Notes</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      {scanner.metadata.test_results.win_rate >= 0.6 ? (
                        <span className="text-green-600">✓ Strong win rate</span>
                      ) : (
                        <span className="text-yellow-600">⚠ Consider optimizing for better win rate</span>
                      )}
                    </p>
                    <p>
                      {scanner.metadata.test_results.profit_factor >= 1.5 ? (
                        <span className="text-green-600">✓ Good profit factor</span>
                      ) : (
                        <span className="text-yellow-600">⚠ Profit factor could be improved</span>
                      )}
                    </p>
                    <p>
                      {scanner.metadata.test_results.max_drawdown <= 0.2 ? (
                        <span className="text-green-600">✓ Acceptable drawdown</span>
                      ) : (
                        <span className="text-red-600">✗ High drawdown - review risk management</span>
                      )}
                    </p>
                  </div>
                </Card>
              </>
            ) : (
              <Card className="p-8 text-center">
                <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  No test results available. Run a backtest to see performance metrics.
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Actions */}
      {onRegenerate && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Not Satisfied?</h4>
              <p className="text-sm text-muted-foreground">
                Try refining your description or use a different generation method
              </p>
            </div>
            <Button onClick={onRegenerate} variant="outline" className="gap-2">
              Regenerate
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
