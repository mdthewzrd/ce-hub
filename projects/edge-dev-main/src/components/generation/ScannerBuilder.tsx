/**
 * Scanner Builder Component
 * Build scanners using natural language, vision, interactive builder, or templates
 */

'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ImageUploadButton } from '@/components/vision/ImageUploadButton';
import {
  Wand2,
  Image as ImageIcon,
  MessageSquare,
  FileText,
  Sparkles,
  Loader2,
  Check,
  AlertCircle,
  Lightbulb,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { getScannerGenerationService } from '@/services/scannerGenerationService';
import type {
  GenerationResult,
  InteractiveBuilderState,
  GenerationOptions
} from '@/services/scannerGenerationService';
import { GenerationResults } from './GenerationResults';

interface ScannerBuilderProps {
  onScannerGenerated?: (scanner: any) => void;
  className?: string;
}

type BuilderMode = 'natural-language' | 'vision' | 'interactive' | 'template';

export function ScannerBuilder({ onScannerGenerated, className }: ScannerBuilderProps) {
  const [mode, setMode] = useState<BuilderMode>('natural-language');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [visionData, setVisionData] = useState<any>(null);
  const [interactiveState, setInteractiveState] = useState<InteractiveBuilderState | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const generationServiceRef = useRef(getScannerGenerationService());

  const handleNaturalLanguageGenerate = async () => {
    if (!naturalLanguageInput.trim()) {
      setError('Please enter a scanner description');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'from-description',
          description: naturalLanguageInput,
          options: {
            include_backtest: true,
            optimize_parameters: true
          }
        })
      });

      const data = await response.json();
      setResult(data);

      if (data.success && data.scanner) {
        setSuggestions(data.suggestions || []);
        if (onScannerGenerated) {
          onScannerGenerated(data.scanner);
        }
      } else if (data.questions) {
        setSuggestions(data.questions);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate scanner');
    } finally {
      setLoading(false);
    }
  };

  const handleVisionGenerate = async () => {
    if (!visionData) {
      setError('Please upload an image first');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // First analyze the image with vision service
      const visionResponse = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze',
          image_base64: visionData.base64,
          prompt: 'Analyze this image for trading strategy components, indicators, parameters, and logic.',
          options: {
            extract_code: true,
            detect_ui: true,
            extract_charts: true
          }
        })
      });

      const visionAnalysis = await visionResponse.json();

      // Then generate scanner from vision analysis
      const generateResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'from-vision',
          vision_analysis: visionAnalysis,
          options: {
            include_backtest: true,
            optimize_parameters: true
          }
        })
      });

      const data = await generateResponse.json();
      setResult(data);

      if (data.success && data.scanner) {
        setSuggestions(data.suggestions || []);
        if (onScannerGenerated) {
          onScannerGenerated(data.scanner);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate scanner from image');
    } finally {
      setLoading(false);
    }
  };

  const handleInteractiveStart = async () => {
    setLoading(true);
    setError('');
    setInteractiveState(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'interactive'
        })
      });

      const data = await response.json();
      setResult(data);

      if (data.success && data.intermediate_state) {
        setInteractiveState(data.intermediate_state);
        setSuggestions(data.questions || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start interactive builder');
    } finally {
      setLoading(false);
    }
  };

  const handleInteractiveResponse = async (response: any) => {
    if (!interactiveState) return;

    setLoading(true);
    setError('');

    try {
      const updatedState = {
        ...interactiveState,
        responses: {
          ...interactiveState.responses,
          ...response
        }
      };

      const apiResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'interactive',
          state: updatedState
        })
      });

      const data = await apiResponse.json();
      setResult(data);

      if (data.success && data.intermediate_state) {
        setInteractiveState(data.intermediate_state);
        setSuggestions(data.questions || []);

        if (data.scanner && onScannerGenerated) {
          onScannerGenerated(data.scanner);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process response');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateGenerate = async () => {
    if (!selectedTemplate) {
      setError('Please select a template');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'from-template',
          template_id: selectedTemplate
        })
      });

      const data = await response.json();
      setResult(data);

      if (data.success && data.scanner) {
        setSuggestions(data.suggestions || []);
        if (onScannerGenerated) {
          onScannerGenerated(data.scanner);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const handleGetSuggestions = async () => {
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'suggest',
          text: naturalLanguageInput
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuggestions(data.suggestions || []);
      }
    } catch (err) {
      console.error('Failed to get suggestions:', err);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Wand2 className="w-6 h-6" />
              Scanner Builder
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Create custom scanners using AI-powered generation
            </p>
          </div>
          <Badge variant="outline">Phase 6</Badge>
        </div>

        <Tabs value={mode} onValueChange={(v) => setMode(v as BuilderMode)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="natural-language" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Natural Language
            </TabsTrigger>
            <TabsTrigger value="vision" className="gap-2">
              <ImageIcon className="w-4 h-4" />
              Vision
            </TabsTrigger>
            <TabsTrigger value="interactive" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Interactive
            </TabsTrigger>
            <TabsTrigger value="template" className="gap-2">
              <FileText className="w-4 h-4" />
              Template
            </TabsTrigger>
          </TabsList>

          {/* Natural Language Tab */}
          <TabsContent value="natural-language" className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Describe Your Scanner</label>
                <p className="text-xs text-muted-foreground mt-1">
                  Describe the trading strategy, indicators, parameters, and conditions
                </p>
              </div>

              <Textarea
                placeholder="Example: Create a trend-following scanner that uses 20-period SMA and 50-period SMA crossovers. Enter when fast SMA crosses above slow SMA, exit when it crosses below. Include RSI confirmation above 50."
                value={naturalLanguageInput}
                onChange={(e) => setNaturalLanguageInput(e.target.value)}
                rows={8}
                className="resize-none"
              />

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleNaturalLanguageGenerate}
                  disabled={loading || !naturalLanguageInput.trim()}
                  className="gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Generate Scanner
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleGetSuggestions}
                  disabled={!naturalLanguageInput.trim()}
                  className="gap-2"
                >
                  <Lightbulb className="w-4 h-4" />
                  Get Suggestions
                </Button>
              </div>

              {suggestions.length > 0 && (
                <Card className="p-4 border-blue-200 bg-blue-50">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-blue-900">Suggestions</h4>
                      <ul className="mt-2 space-y-1 text-sm text-blue-800">
                        {suggestions.map((suggestion, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <ChevronRight className="w-3 h-3 mt-1 flex-shrink-0" />
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Vision Tab */}
          <TabsContent value="vision" className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Upload Strategy Image</label>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload a screenshot, diagram, or chart containing scanner logic
                </p>
              </div>

              <ImageUploadButton
                onImageSelect={setVisionData}
                maxSizeMB={10}
                showPreview={true}
              />

              <Button
                onClick={handleVisionGenerate}
                disabled={loading || !visionData}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing & Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Generate from Image
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Interactive Tab */}
          <TabsContent value="interactive" className="space-y-4">
            {!interactiveState ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Interactive Builder</label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Build your scanner step-by-step with guided questions
                  </p>
                </div>

                <Button
                  onClick={handleInteractiveStart}
                  disabled={loading}
                  className="gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Start Interactive Builder
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <InteractiveBuilder
                state={interactiveState}
                onResponse={handleInteractiveResponse}
                loading={loading}
              />
            )}
          </TabsContent>

          {/* Template Tab */}
          <TabsContent value="template" className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Select Template</label>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose a pre-built scanner template to customize
                </p>
              </div>

              <TemplateSelector
                selectedTemplate={selectedTemplate}
                onTemplateSelect={setSelectedTemplate}
              />

              <Button
                onClick={handleTemplateGenerate}
                disabled={loading || !selectedTemplate}
                className="gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Load Template
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Error Display */}
        {error && (
          <Card className="p-4 border-red-200 bg-red-50">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </Card>
        )}
      </Card>

      {/* Generation Results */}
      {result && (
        <GenerationResults
          result={result}
          onRegenerate={() => {
            setResult(null);
            setSuggestions([]);
          }}
        />
      )}
    </div>
  );
}

// ========== SUB-COMPONENTS ==========

interface InteractiveBuilderProps {
  state: InteractiveBuilderState;
  onResponse: (response: any) => void;
  loading: boolean;
}

function InteractiveBuilder({ state, onResponse, loading }: InteractiveBuilderProps) {
  const [response, setResponse] = useState('');
  const progress = ((state.current_step + 1) / state.total_steps) * 100;

  const handleSubmit = () => {
    if (!response.trim()) return;

    // Determine response key based on current step
    const keys = ['scanner_type', 'indicators', 'entry_conditions', 'exit_conditions', 'parameters', 'additional'];
    const key = keys[state.current_step];

    onResponse({
      [key]: response
    });

    setResponse('');
  };

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Progress</span>
          <span className="text-muted-foreground">
            Step {state.current_step + 1} of {state.total_steps}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      {state.requirements && state.requirements[state.current_step] && (
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-primary mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold mb-2">Question</h4>
              <p className="text-sm">{state.requirements[state.current_step].description}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Response Input */}
      <div className="space-y-2">
        <Textarea
          placeholder="Type your answer here..."
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          rows={4}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleSubmit();
            }
          }}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Press Cmd/Ctrl + Enter to submit
          </p>
          <Button
            onClick={handleSubmit}
            disabled={!response.trim() || loading}
            size="sm"
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ChevronRight className="w-3 h-3" />
                Continue
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Suggestions */}
      {state.suggested_patterns && state.suggested_patterns.length > 0 && (
        <Card className="p-4 border-blue-200 bg-blue-50">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-sm text-blue-900">Suggestions</h4>
              <ul className="mt-2 space-y-1 text-sm text-blue-800">
                {state.suggested_patterns.map((pattern, i) => (
                  <li key={i}>• {pattern.name}: {pattern.description}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Suggested Patterns */}
      {state.suggested_patterns.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Suggested Patterns</h4>
          <div className="grid gap-2">
            {state.suggested_patterns.map((pattern, i) => (
              <Badge key={i} variant="outline">
                {pattern.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface TemplateSelectorProps {
  selectedTemplate: string;
  onTemplateSelect: (templateId: string) => void;
}

function TemplateSelector({ selectedTemplate, onTemplateSelect }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetch('/api/generate?action=templates')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTemplates(data.templates || []);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {templates.map((template) => (
        <Card
          key={template.id}
          className={`p-4 cursor-pointer transition-colors hover:bg-muted ${
            selectedTemplate === template.id ? 'border-primary bg-primary/5' : ''
          }`}
          onClick={() => onTemplateSelect(template.id)}
        >
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold">{template.name}</h4>
              <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline">{template.scanner_type}</Badge>
              </div>
            </div>
            {selectedTemplate === template.id && (
              <Check className="w-5 h-5 text-primary" />
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
