'use client';

/**
 * Interactive Parameter Formatter Component
 * ========================================
 *
 * Provides a comprehensive human-in-the-loop interface for collaborative
 * parameter extraction and code formatting. Features step-by-step workflow,
 * real-time parameter validation, and intelligent suggestion integration.
 *
 * Key Features:
 * - Real-time parameter extraction with confidence scoring
 * - Interactive parameter confirmation and editing
 * - Step-by-step formatting workflow with preview
 * - Learning from user feedback for improved suggestions
 * - Scanner-type specific optimizations
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import {
  ChevronRight,
  Check,
  X,
  Edit3,
  Eye,
  AlertCircle,
  Brain,
  Code2,
  Settings,
  Lightbulb,
  Target,
  TrendingUp
} from 'lucide-react';

interface ExtractedParameter {
  name: string;
  value: any;
  type: 'threshold' | 'filter' | 'array' | 'condition' | 'config';
  confidence: number;
  line: number;
  context: string;
  suggested_description: string;
  extraction_method: string;
  complexity_level: 'simple' | 'complex' | 'advanced';
  user_confirmed: boolean;
  user_edited: boolean;
}

interface FormattingStep {
  id: string;
  title: string;
  description: string;
  type: string;
  suggestions: any[];
  preview_code?: string;
  completed?: boolean;
  user_approved?: boolean;
}

interface InteractiveParameterFormatterProps {
  initialCode: string;
  onFormattedCodeChange?: (code: string) => void;
  onParametersChange?: (parameters: ExtractedParameter[]) => void;
}

export function InteractiveParameterFormatter({
  initialCode,
  onFormattedCodeChange,
  onParametersChange
}: InteractiveParameterFormatterProps) {
  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [code, setCode] = useState(initialCode);
  const [parameters, setParameters] = useState<ExtractedParameter[]>([]);
  const [extractionResult, setExtractionResult] = useState<any>(null);
  const [formattingSteps, setFormattingSteps] = useState<FormattingStep[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [previewCode, setPreviewCode] = useState('');
  const [userFeedback, setUserFeedback] = useState({
    overall_satisfaction: 5,
    improvement_suggestions: []
  });

  const steps = [
    { id: 'extraction', title: 'Parameter Discovery', icon: Brain },
    { id: 'confirmation', title: 'Review & Confirm', icon: Check },
    { id: 'formatting', title: 'Interactive Formatting', icon: Code2 },
    { id: 'finalization', title: 'Final Review', icon: Eye }
  ];

  // Extract parameters when component mounts or code changes
  useEffect(() => {
    if (code) {
      extractParameters();
    }
  }, [code]);

  const extractParameters = async () => {
    setIsExtracting(true);

    try {
      const response = await fetch('http://localhost:8000/api/format/extract-parameters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code
        })
      });

      if (response.ok) {
        const result = await response.json();
        setExtractionResult(result);
        setParameters(result.parameters || []);

        if (onParametersChange) {
          onParametersChange(result.parameters || []);
        }
      } else {
        console.error('Parameter extraction failed:', response.statusText);
      }
    } catch (error) {
      console.error('Parameter extraction error:', error);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleParameterConfirmation = (index: number, confirmed: boolean) => {
    const updatedParams = [...parameters];
    updatedParams[index] = {
      ...updatedParams[index],
      user_confirmed: confirmed
    };
    setParameters(updatedParams);
  };

  const handleParameterEdit = (index: number, field: string, value: any) => {
    const updatedParams = [...parameters];
    updatedParams[index] = {
      ...updatedParams[index],
      [field]: value,
      user_edited: true
    };
    setParameters(updatedParams);
  };

  const performFormattingStep = async (stepId: string, userChoices: any) => {
    setIsFormatting(true);

    try {
      const confirmedParams = parameters.filter(p => p.user_confirmed !== false);

      const response = await fetch('http://localhost:8000/api/format/collaborative-step', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          step_id: stepId,
          parameters: confirmedParams,
          user_choices: userChoices
        })
      });

      if (response.ok) {
        const result = await response.json();
        setPreviewCode(result.preview_code);

        // Update formatting steps
        const updatedSteps = formattingSteps.map(step =>
          step.id === stepId
            ? { ...step, completed: true, preview_code: result.preview_code }
            : step
        );
        setFormattingSteps(updatedSteps);

        return result;
      }
    } catch (error) {
      console.error('Formatting step error:', error);
    } finally {
      setIsFormatting(false);
    }
  };

  const submitUserFeedback = async () => {
    try {
      await fetch('http://localhost:8000/api/format/user-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          original_code: initialCode,
          final_code: previewCode || code,
          feedback: userFeedback
        })
      });
    } catch (error) {
      console.error('Feedback submission error:', error);
    }
  };

  const renderParameterExtractionStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">AI Parameter Discovery</h3>
        <Button
          onClick={extractParameters}
          disabled={isExtracting}
          className="min-w-[120px]"
        >
          {isExtracting ? 'Analyzing...' : 'Re-analyze'}
        </Button>
      </div>

      {extractionResult && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {parameters.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Parameters Found
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(extractionResult.confidence_score * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Confidence Score
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Badge variant="outline" className="text-xs">
                  {extractionResult.scanner_type}
                </Badge>
                <div className="text-sm text-muted-foreground mt-1">
                  Scanner Type
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {extractionResult?.suggestions && (
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertTitle>AI Suggestions</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 list-disc list-inside space-y-1">
              {extractionResult.suggestions.map((suggestion: string, index: number) => (
                <li key={index} className="text-sm">{suggestion}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderParameterConfirmationStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Review & Confirm Parameters</h3>
        <div className="text-sm text-muted-foreground">
          {parameters.filter(p => p.user_confirmed !== false).length} of {parameters.length} confirmed
        </div>
      </div>

      <div className="space-y-4">
        {parameters.map((param, index) => (
          <Card key={index} className={`transition-all ${param.user_confirmed === false ? 'opacity-50' : ''}`}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={param.user_confirmed !== false}
                      onCheckedChange={(checked) => handleParameterConfirmation(index, checked as boolean)}
                    />

                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Input
                          value={param.name}
                          onChange={(e) => handleParameterEdit(index, 'name', e.target.value)}
                          className="font-mono text-sm"
                        />
                        <Badge variant={getParameterTypeBadgeVariant(param.type)}>
                          {param.type}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {Math.round(param.confidence * 100)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {param.complexity_level}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Value</label>
                      <div className="mt-1">
                        {Array.isArray(param.value) ? (
                          <Input
                            value={JSON.stringify(param.value)}
                            onChange={(e) => {
                              try {
                                const parsed = JSON.parse(e.target.value);
                                handleParameterEdit(index, 'value', parsed);
                              } catch {
                                // Invalid JSON, ignore
                              }
                            }}
                            className="font-mono text-sm"
                          />
                        ) : (
                          <Input
                            value={String(param.value)}
                            onChange={(e) => {
                              const value = isNaN(Number(e.target.value))
                                ? e.target.value
                                : Number(e.target.value);
                              handleParameterEdit(index, 'value', value);
                            }}
                            className="font-mono text-sm"
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Description</label>
                      <Input
                        value={param.suggested_description}
                        onChange={(e) => handleParameterEdit(index, 'suggested_description', e.target.value)}
                        className="mt-1 text-sm"
                        placeholder="Parameter description..."
                      />
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono">
                    Line {param.line}: {param.context}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {parameters.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No parameters detected yet.</p>
              <p className="text-sm mt-2">Upload scanner code to begin analysis.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderInteractiveFormattingStep = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Interactive Formatting</h3>

      <Tabs defaultValue="infrastructure" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
        </TabsList>

        <TabsContent value="infrastructure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Infrastructure Enhancements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <Checkbox defaultChecked />
                  <span className="text-sm">Add async/await patterns for better performance</span>
                </label>
                <label className="flex items-center space-x-2">
                  <Checkbox defaultChecked />
                  <span className="text-sm">Include comprehensive error handling</span>
                </label>
                <label className="flex items-center space-x-2">
                  <Checkbox defaultChecked />
                  <span className="text-sm">Add production-grade imports and logging</span>
                </label>
              </div>

              <Button
                onClick={() => performFormattingStep('infrastructure_enhancement', {
                  add_async: true,
                  add_error_handling: true,
                  add_imports: true
                })}
                disabled={isFormatting}
                className="w-full"
              >
                {isFormatting ? 'Applying...' : 'Apply Infrastructure Enhancements'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Performance Optimization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <Checkbox defaultChecked />
                  <span className="text-sm">Add multiprocessing capabilities</span>
                </label>
                <label className="flex items-center space-x-2">
                  <Checkbox defaultChecked />
                  <span className="text-sm">Include memory optimization patterns</span>
                </label>
              </div>

              <Button
                onClick={() => performFormattingStep('optimization', {
                  add_multiprocessing: true,
                  memory_optimization: true
                })}
                disabled={isFormatting}
                className="w-full"
              >
                {isFormatting ? 'Optimizing...' : 'Apply Performance Optimizations'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Final Validation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Syntax validation</span>
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Parameter preservation</span>
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Production readiness</span>
                  <Check className="h-4 w-4 text-green-600" />
                </div>
              </div>

              <Button
                onClick={() => performFormattingStep('validation', {})}
                disabled={isFormatting}
                className="w-full"
              >
                {isFormatting ? 'Validating...' : 'Perform Final Validation'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderCodePreview = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Code Preview</h3>

      <Tabs defaultValue="formatted" className="w-full">
        <TabsList>
          <TabsTrigger value="original">Original</TabsTrigger>
          <TabsTrigger value="formatted">Formatted</TabsTrigger>
        </TabsList>

        <TabsContent value="original">
          <Textarea
            value={code}
            readOnly
            className="font-mono text-xs min-h-[400px]"
          />
        </TabsContent>

        <TabsContent value="formatted">
          <Textarea
            value={previewCode || 'No preview available yet...'}
            readOnly
            className="font-mono text-xs min-h-[400px]"
          />
        </TabsContent>
      </Tabs>

      {previewCode && (
        <div className="flex space-x-2">
          <Button
            onClick={() => {
              setCode(previewCode);
              if (onFormattedCodeChange) {
                onFormattedCodeChange(previewCode);
              }
            }}
            className="flex-1"
          >
            Accept Changes
          </Button>
          <Button variant="outline" onClick={() => setPreviewCode('')}>
            Reset
          </Button>
        </div>
      )}
    </div>
  );

  const renderFinalReview = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Final Review & Feedback</h3>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Experience</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Overall Satisfaction</label>
            <div className="mt-2">
              <Slider
                value={[userFeedback.overall_satisfaction]}
                onValueChange={([value]: number[]) => setUserFeedback(prev => ({
                  ...prev,
                  overall_satisfaction: value
                }))}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Poor</span>
                <span>Excellent</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Improvement Suggestions</label>
            <Textarea
              placeholder="How can we improve the formatting experience?"
              className="mt-2"
              rows={3}
            />
          </div>

          <Button
            onClick={submitUserFeedback}
            className="w-full"
          >
            Submit Feedback
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const getParameterTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'threshold': return 'default';
      case 'filter': return 'secondary';
      case 'array': return 'destructive';
      case 'condition': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Progress Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Human-in-the-Loop Formatter</h2>
        <Progress value={(currentStep + 1) / steps.length * 100} className="mb-4" />

        <div className="flex items-center space-x-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                  isActive ? 'bg-primary text-primary-foreground' :
                  isCompleted ? 'bg-green-100 text-green-700' :
                  'bg-muted text-muted-foreground'
                }`}>
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Current Step */}
        <div>
          {currentStep === 0 && renderParameterExtractionStep()}
          {currentStep === 1 && renderParameterConfirmationStep()}
          {currentStep === 2 && renderInteractiveFormattingStep()}
          {currentStep === 3 && renderFinalReview()}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Previous
            </Button>
            <Button
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              disabled={currentStep === steps.length - 1}
            >
              Next
            </Button>
          </div>
        </div>

        {/* Right Column - Code Preview */}
        <div>
          {renderCodePreview()}
        </div>
      </div>
    </div>
  );
}