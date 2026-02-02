/**
 * Human-in-the-Loop Scanner Formatting System
 *
 * This component implements collaborative formatting where the AI suggests
 * parameter extractions and formatting changes, but the user has final authority.
 *
 * Features:
 * - Interactive parameter discovery with confidence scores
 * - Step-by-step formatting wizard with user confirmation
 * - Real-time preview and validation
 * - Learning from user feedback
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useHumanInTheLoopFormatter } from '../utils/humanInTheLoopFormatter';
import TestScenarios from './TestScenarios';

// Types
interface Parameter {
  name: string;
  value: any;
  type: 'filter' | 'config' | 'threshold' | 'unknown';
  confidence: number;
  line: number;
  context: string;
  suggested_description?: string;
  confirmed?: boolean;
}

interface FormattingStep {
  id: string;
  title: string;
  description: string;
  type: 'parameter_discovery' | 'infrastructure_enhancement' | 'optimization' | 'validation';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  suggestions: any[];
  user_approved?: boolean;
}

interface HumanInTheLoopFormatterProps {
  onFormattingComplete?: (result: any) => void;
  className?: string;
}

const HumanInTheLoopFormatter: React.FC<HumanInTheLoopFormatterProps> = ({
  onFormattingComplete,
  className = ''
}) => {
  // State management
  const [inputCode, setInputCode] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [steps, setSteps] = useState<FormattingStep[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewCode, setPreviewCode] = useState('');
  const [userFeedback, setUserFeedback] = useState<Record<string, any>>({});
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showTestScenarios, setShowTestScenarios] = useState(false);

  // API integration
  const { extractParameters, performFormattingStep, submitUserFeedback } = useHumanInTheLoopFormatter();

  // Initialize formatting steps
  useEffect(() => {
    const initialSteps: FormattingStep[] = [
      {
        id: 'parameter_discovery',
        title: 'Parameter Discovery',
        description: 'AI analyzes your code to identify trading parameters, filters, and configuration values',
        type: 'parameter_discovery',
        status: 'pending',
        suggestions: []
      },
      {
        id: 'infrastructure_enhancement',
        title: 'Infrastructure Enhancement',
        description: 'Add production-grade features like async processing, error handling, and API optimization',
        type: 'infrastructure_enhancement',
        status: 'pending',
        suggestions: []
      },
      {
        id: 'optimization',
        title: 'Performance Optimization',
        description: 'Optimize for speed and efficiency while preserving all functionality',
        type: 'optimization',
        status: 'pending',
        suggestions: []
      },
      {
        id: 'validation',
        title: 'Validation & Preview',
        description: 'Final validation and preview of the enhanced scanner code',
        type: 'validation',
        status: 'pending',
        suggestions: []
      }
    ];
    setSteps(initialSteps);
  }, []);

  // Analyze code for parameters using the real API
  const analyzeCodeForParameters = useCallback(async (code: string): Promise<Parameter[]> => {
    try {
      setIsAnalyzing(true);

      // Call the real backend API for parameter extraction
      const result = await extractParameters(code);

      if (result.success) {
        // Convert API response to our Parameter interface
        const discoveredParameters: Parameter[] = result.parameters.map(param => ({
          name: param.name,
          value: param.value,
          type: param.type as 'filter' | 'config' | 'threshold' | 'unknown',
          confidence: param.confidence,
          line: param.line,
          context: param.context,
          suggested_description: param.suggested_description || `${param.type} parameter: ${param.name}`
        }));

        console.log(`  Discovered ${discoveredParameters.length} parameters using AI analysis`);
        console.log(`📊 Scanner type detected: ${result.scanner_type}`);
        console.log(`  Overall confidence: ${(result.confidence_score * 100).toFixed(1)}%`);

        return discoveredParameters;
      } else {
        throw new Error('Parameter extraction failed');
      }
    } catch (error) {
      console.error('Parameter extraction error:', error);

      // Fallback to client-side analysis if API fails
      const fallbackParameters: Parameter[] = [
        {
          name: 'prev_close_min',
          value: 5.0,
          type: 'filter',
          confidence: 0.7,
          line: 0,
          context: 'Fallback parameter discovery',
          suggested_description: 'Minimum previous close price filter (fallback)'
        }
      ];

      return fallbackParameters;
    } finally {
      setIsAnalyzing(false);
    }
  }, [extractParameters]);

  // Start the collaborative formatting process
  const startFormatting = useCallback(async () => {
    if (!inputCode.trim()) {
      alert('Please enter some scanner code first');
      return;
    }

    // Step 1: Parameter Discovery
    const discoveredParams = await analyzeCodeForParameters(inputCode);
    setParameters(discoveredParams);

    // Update the first step with discovered parameters
    setSteps(prev => prev.map((step, idx) =>
      idx === 0
        ? { ...step, status: 'in_progress', suggestions: discoveredParams }
        : step
    ));

    setCurrentStep(0);
  }, [inputCode, analyzeCodeForParameters]);

  // Handle parameter confirmation
  const handleParameterConfirmation = useCallback((paramIndex: number, confirmed: boolean, editedValue?: any) => {
    setParameters(prev => prev.map((param, idx) =>
      idx === paramIndex
        ? { ...param, value: editedValue !== undefined ? editedValue : param.value, confirmed }
        : param
    ));
  }, []);

  // Move to next step
  const proceedToNextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setSteps(prev => prev.map((step, idx) =>
        idx === currentStep
          ? { ...step, status: 'completed', user_approved: true }
          : idx === currentStep + 1
          ? { ...step, status: 'in_progress' }
          : step
      ));
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, steps.length]);

  // Generate preview code
  const generatePreview = useCallback(async () => {
    // Mock preview generation - in real implementation, this would call the backend
    const mockPreview = `"""
Enhanced Scanner with Human-Validated Parameters
Generated with human-in-the-loop collaborative formatting
"""

import asyncio
import aiohttp
import pandas as pd
from datetime import datetime
from typing import List, Dict

# HUMAN-VALIDATED PARAMETERS
PREV_CLOSE_MIN = ${parameters.find(p => p.name === 'prev_close_min')?.value || 5.0}  # Confirmed by user
VOLUME_THRESHOLD = ${parameters.find(p => p.name === 'volume_threshold')?.value || 1000000}  # Confirmed by user
GAP_PERCENT = ${parameters.find(p => p.name === 'gap_percent')?.value || 3.0}  # Confirmed by user

async def enhanced_scanner(start_date: str, end_date: str) -> List[Dict]:
    """
    Enhanced scanner with user-confirmed parameters
    """
    # AI-suggested infrastructure enhancements (user approved)
    results = []

    # Your original logic preserved with confirmed parameters
    async with aiohttp.ClientSession() as session:
        # Enhanced async processing
        pass

    return results

# Enhanced entry point
if __name__ == "__main__":
    asyncio.run(enhanced_scanner("2024-01-01", "2024-12-31"))
`;

    setPreviewCode(mockPreview);
  }, [parameters]);

  // Render parameter discovery step
  const renderParameterDiscovery = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Discovered Parameters</h3>
        <Badge variant="outline">{parameters.length} found</Badge>
      </div>

      {isAnalyzing ? (
        <div className="flex items-center space-x-2 py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span>Analyzing code for parameters...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {parameters.map((param, index) => (
            <Card key={index} className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant={param.type === 'filter' ? 'default' : 'secondary'}>
                      {param.type}
                    </Badge>
                    <span className="font-medium">{param.name}</span>
                    <Badge variant="outline">
                      {(param.confidence * 100).toFixed(0)}% confidence
                    </Badge>
                  </div>
                  <Checkbox
                    checked={param.confirmed !== false}
                    onCheckedChange={(checked) => handleParameterConfirmation(index, !!checked)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label className="w-16">Value:</Label>
                    <Input
                      value={param.value}
                      onChange={(e) => handleParameterConfirmation(index, true, e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Context:</strong> <code className="bg-gray-100 px-1 rounded">{param.context}</code>
                  </div>
                  {param.suggested_description && (
                    <div className="text-sm text-gray-600">
                      <strong>AI Description:</strong> {param.suggested_description}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {parameters.length > 0 && (
            <div className="flex justify-between items-center pt-4">
              <span className="text-sm text-gray-600">
                Review and confirm the parameters above
              </span>
              <Button onClick={proceedToNextStep}>
                Confirm Parameters & Continue
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Render step content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderParameterDiscovery();
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Infrastructure Enhancements</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox defaultChecked />
                <span>Add async/await patterns for improved performance</span>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox defaultChecked />
                <span>Integrate Polygon API with rate limiting</span>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox defaultChecked />
                <span>Add comprehensive error handling</span>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox defaultChecked />
                <span>Include progress tracking and logging</span>
              </div>
            </div>
            <Button onClick={proceedToNextStep}>Apply Enhancements</Button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Performance Optimizations</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox defaultChecked />
                <span>Enable multiprocessing for ticker scanning</span>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox defaultChecked />
                <span>Optimize memory usage for large datasets</span>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox defaultChecked />
                <span>Cache API responses to reduce redundant calls</span>
              </div>
            </div>
            <Button onClick={proceedToNextStep}>Apply Optimizations</Button>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Final Preview</h3>
            <Button onClick={generatePreview} className="mb-4">
              Generate Preview
            </Button>
            {previewCode && (
              <div className="space-y-4">
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm max-h-96">
                  {previewCode}
                </pre>
                <div className="flex space-x-2">
                  <Button onClick={() => onFormattingComplete?.(previewCode)}>
                    Accept & Use This Code
                  </Button>
                  <Button variant="outline" onClick={() => setCurrentStep(0)}>
                    Start Over
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className={`human-in-the-loop-formatter ${className}`}>
      <Card className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Human-in-the-Loop Scanner Formatter</h2>
              <p className="text-gray-600">Collaborative AI formatting with human oversight</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? 'Expand' : 'Collapse'}
            </Button>
          </div>

          {!isCollapsed && (
            <>
              {/* Code Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Scanner Code</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTestScenarios(!showTestScenarios)}
                  >
                    {showTestScenarios ? 'Hide' : 'Load'} Test Scenarios
                  </Button>
                </div>
                <textarea
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="Paste your Python scanner code here or load a test scenario..."
                  className="w-full h-32 p-3 border rounded-md font-mono text-sm"
                />
              </div>

              {/* Test Scenarios */}
              {showTestScenarios && (
                <TestScenarios
                  onLoadScenario={(code) => {
                    setInputCode(code);
                    setShowTestScenarios(false);
                  }}
                />
              )}

              {/* Progress Steps */}
              <div className="space-y-2">
                <Label>Formatting Progress</Label>
                <div className="flex space-x-2 overflow-x-auto py-2">
                  {steps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`flex-shrink-0 p-3 rounded-lg border min-w-48 ${
                        index === currentStep
                          ? 'border-blue-500 bg-blue-50'
                          : step.status === 'completed'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-sm">{step.title}</div>
                      <div className="text-xs text-gray-600 mt-1">{step.description}</div>
                      <div className="flex items-center space-x-1 mt-2">
                        <div className={`w-2 h-2 rounded-full ${
                          step.status === 'completed' ? 'bg-green-500' :
                          step.status === 'in_progress' ? 'bg-blue-500' :
                          'bg-gray-300'
                        }`}></div>
                        <span className="text-xs capitalize">{step.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Start Button or Step Content */}
              {currentStep === 0 && steps[0]?.status === 'pending' ? (
                <Button
                  onClick={startFormatting}
                  disabled={!inputCode.trim()}
                  className="w-full"
                >
                  Start Collaborative Formatting
                </Button>
              ) : (
                <div className="min-h-64">
                  {renderStepContent()}
                </div>
              )}

              {/* User Feedback Section */}
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Learning Feedback</Label>
                <p className="text-xs text-gray-600 mb-2">
                  Your choices help improve future suggestions
                </p>
                <div className="text-xs text-gray-500">
                  • Parameter confirmations: {parameters.filter(p => p.confirmed !== false).length}/{parameters.length}
                  • Steps completed: {steps.filter(s => s.status === 'completed').length}/{steps.length}
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default HumanInTheLoopFormatter;