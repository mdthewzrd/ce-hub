/**
 * Vision Results Component
 * Display results from vision analysis
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Eye,
  Code,
  BarChart3,
  Layout,
  FileText,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface VisionAnalysisResult {
  success: boolean;
  provider: string;
  analysis: {
    description?: string;
    code_blocks?: Array<{
      language: string;
      code: string;
      confidence: number;
    }>;
    chart_data?: any;
    ui_elements?: any[];
    text_content?: string;
    confidence: number;
  };
  metadata: {
    processed_at: string;
    processing_time_ms: number;
  };
  error?: string;
}

interface VisionResultsProps {
  result: VisionAnalysisResult;
  imageUrl?: string;
  onCopy?: (content: string) => void;
}

export function VisionResults({ result, imageUrl, onCopy }: VisionResultsProps) {
  const [expandedCodeBlocks, setExpandedCodeBlocks] = useState<Set<number>>(new Set());
  const [copiedBlock, setCopiedBlock] = useState<number | null>(null);

  if (!result.success) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <div className="flex items-start gap-3">
          <div className="text-red-600">
            <Eye className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-red-900">Analysis Failed</h4>
            <p className="text-sm text-red-700 mt-1">{result.error || 'Unknown error'}</p>
          </div>
        </div>
      </Card>
    );
  }

  const toggleCodeBlock = (index: number) => {
    setExpandedCodeBlocks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (content: string, blockIndex?: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedBlock(blockIndex !== undefined ? blockIndex : -1);

      if (onCopy) {
        onCopy(content);
      }

      setTimeout(() => setCopiedBlock(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const downloadCode = (code: string, language: string, index: number) => {
    const extension = getFileExtension(language);
    const filename = `extracted_code_${index + 1}.${extension}`;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getFileExtension = (language: string): string => {
    const extensions: Record<string, string> = {
      'javascript': 'js',
      'typescript': 'ts',
      'python': 'py',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'go': 'go',
      'rust': 'rs',
      'ruby': 'rb',
      'php': 'php',
      'html': 'html',
      'css': 'css',
      'sql': 'sql',
      'bash': 'sh',
      'shell': 'sh',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yml'
    };

    return extensions[language.toLowerCase()] || 'txt';
  };

  const { analysis, metadata, provider } = result;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Vision Analysis Results
            </h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">{provider}</Badge>
              <span>•</span>
              <span>Confidence: {(analysis.confidence * 100).toFixed(0)}%</span>
              <span>•</span>
              <span>{metadata.processing_time_ms}ms</span>
            </div>
          </div>

          {imageUrl && (
            <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
              <img src={imageUrl} alt="Analyzed" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </Card>

      {/* Analysis Content */}
      <Tabs defaultValue="description" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="description" className="gap-2">
            <FileText className="w-4 h-4" />
            Description
          </TabsTrigger>
          <TabsTrigger value="code" className="gap-2">
            <Code className="w-4 h-4" />
            Code ({analysis.code_blocks?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="charts" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Charts
          </TabsTrigger>
          <TabsTrigger value="ui" className="gap-2">
            <Layout className="w-4 h-4" />
            UI ({analysis.ui_elements?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Description Tab */}
        <TabsContent value="description" className="space-y-4">
          <Card className="p-4">
            <h5 className="font-semibold mb-2">Analysis Description</h5>
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{analysis.description}</p>
            </div>
          </Card>

          {analysis.text_content && (
            <Card className="p-4">
              <h5 className="font-semibold mb-2">Extracted Text</h5>
              <p className="text-sm whitespace-pre-wrap">{analysis.text_content}</p>
            </Card>
          )}
        </TabsContent>

        {/* Code Tab */}
        <TabsContent value="code" className="space-y-4">
          {analysis.code_blocks && analysis.code_blocks.length > 0 ? (
            analysis.code_blocks.map((block, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h5 className="font-semibold">Code Block {index + 1}</h5>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline">{block.language}</Badge>
                      <span>Confidence: {(block.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleCodeBlock(index)}
                      className="gap-1"
                    >
                      {expandedCodeBlocks.has(index) ? (
                        <>
                          <ChevronUp className="w-3 h-3" />
                          Collapse
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" />
                          Expand
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(block.code, index)}
                      className="gap-1"
                    >
                      {copiedBlock === index ? (
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
                      onClick={() => downloadCode(block.code, block.language, index)}
                      className="gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </Button>
                  </div>
                </div>

                {expandedCodeBlocks.has(index) && (
                  <div className="relative">
                    <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-sm">
                      <code>{block.code}</code>
                    </pre>
                  </div>
                )}
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              <Code className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No code blocks detected in this image</p>
            </Card>
          )}
        </TabsContent>

        {/* Charts Tab */}
        <TabsContent value="charts" className="space-y-4">
          {analysis.chart_data ? (
            <Card className="p-4">
              <h5 className="font-semibold mb-3">Extracted Chart Data</h5>

              <div className="space-y-3">
                {analysis.chart_data.chart_type && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Chart Type:</span>
                    <Badge>{analysis.chart_data.chart_type}</Badge>
                  </div>
                )}

                {analysis.chart_data.title && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Title:</span>
                    <span className="text-sm">{analysis.chart_data.title}</span>
                  </div>
                )}

                {analysis.chart_data.axes && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Axes:</div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {analysis.chart_data.axes.x_label && (
                        <div>X-Axis: {analysis.chart_data.axes.x_label}</div>
                      )}
                      {analysis.chart_data.axes.y_label && (
                        <div>Y-Axis: {analysis.chart_data.axes.y_label}</div>
                      )}
                    </div>
                  </div>
                )}

                {analysis.chart_data.data_points && analysis.chart_data.data_points.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Data Points ({analysis.chart_data.data_points.length}):</div>
                    <div className="max-h-48 overflow-y-auto border rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-3 py-2 text-left">X</th>
                            <th className="px-3 py-2 text-left">Y</th>
                            {analysis.chart_data.data_points[0]?.label && (
                              <th className="px-3 py-2 text-left">Label</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {analysis.chart_data.data_points.map((point: any, idx: number) => (
                            <tr key={idx} className="border-t">
                              <td className="px-3 py-2">{point.x}</td>
                              <td className="px-3 py-2">{point.y}</td>
                              {point.label && <td className="px-3 py-2">{point.label}</td>}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Confidence: {(analysis.chart_data.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No chart data detected in this image</p>
            </Card>
          )}
        </TabsContent>

        {/* UI Tab */}
        <TabsContent value="ui" className="space-y-4">
          {analysis.ui_elements && analysis.ui_elements.length > 0 ? (
            <div className="grid gap-3">
              {analysis.ui_elements.map((element, index) => (
                <Card key={index} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{element.type}</Badge>
                        {element.label && (
                          <span className="font-medium">{element.label}</span>
                        )}
                      </div>
                      {element.position && (
                        <div className="text-xs text-muted-foreground">
                          Position: ({element.position.x}, {element.position.y})
                          Size: {element.position.width}x{element.position.height}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Confidence: {(element.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              <Layout className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No UI elements detected in this image</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Metadata */}
      <Card className="p-4">
        <h5 className="font-semibold mb-2">Processing Metadata</h5>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Provider:</span>
            <span className="ml-2 font-medium">{provider}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Processing Time:</span>
            <span className="ml-2 font-medium">{metadata.processing_time_ms}ms</span>
          </div>
          <div>
            <span className="text-muted-foreground">Processed At:</span>
            <span className="ml-2">{new Date(metadata.processed_at).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Confidence:</span>
            <span className="ml-2 font-medium">{(analysis.confidence * 100).toFixed(0)}%</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
