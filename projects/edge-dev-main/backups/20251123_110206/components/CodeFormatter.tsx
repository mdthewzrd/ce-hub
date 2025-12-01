/**
 * Code Formatter React Component
 *
 * Interactive component for the Edge.dev trading platform that allows users
 * to upload, format, and optimize Python trading code using the AI formatter.
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  useCodeFormatter,
  CodeFormatterService,
  CodeFormatterUtils,
  type CodeFormattingOptions,
  type FormattingResult
} from '../utils/codeFormatterAPI';

interface CodeFormatterProps {
  onCodeFormatted?: (result: FormattingResult) => void;
  defaultOptions?: CodeFormattingOptions;
  className?: string;
}

export default function CodeFormatter({
  onCodeFormatted,
  defaultOptions = {},
  className = ''
}: CodeFormatterProps) {
  const [inputCode, setInputCode] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<'gap' | 'volume' | 'breakout' | 'custom'>('gap');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [options, setOptions] = useState<CodeFormattingOptions>({
    enableMultiprocessing: true,
    enableAsyncPatterns: true,
    addTradingPackages: true,
    standardizeOutput: true,
    optimizePerformance: true,
    addErrorHandling: true,
    includeLogging: true,
    ...defaultOptions
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prevent global drag and drop from opening files in new tabs
  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Add global event listeners to prevent default browser behavior
    document.addEventListener('dragenter', preventDefaults, false);
    document.addEventListener('dragover', preventDefaults, false);
    document.addEventListener('dragleave', preventDefaults, false);
    document.addEventListener('drop', handleGlobalDrop, false);

    return () => {
      document.removeEventListener('dragenter', preventDefaults, false);
      document.removeEventListener('dragover', preventDefaults, false);
      document.removeEventListener('dragleave', preventDefaults, false);
      document.removeEventListener('drop', handleGlobalDrop, false);
    };
  }, []);

  const {
    formatCode,
    generateTemplate,
    getOptimizationSuggestions,
    isFormatting,
    lastResult,
    error
  } = useCodeFormatter(options);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.py')) {
      alert('Please upload a Python (.py) file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setInputCode(content);
    };
    reader.readAsText(file);
  }, []);

  // Drag and Drop handlers
  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const files = Array.from(event.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0]; // Only handle the first file

    if (!file.name.endsWith('.py')) {
      alert('Please upload a Python (.py) file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setInputCode(content);
    };
    reader.readAsText(file);
  }, []);

  const handleFormatCode = useCallback(async () => {
    if (!inputCode.trim()) {
      alert('Please enter or upload some Python code first');
      return;
    }

    // Validate code before formatting
    const validation = CodeFormatterService.validatePythonCode(inputCode);
    if (!validation.isValid) {
      alert(`Code validation failed: ${validation.errors.join(', ')}`);
      return;
    }

    try {
      const result = await formatCode(inputCode, options);
      onCodeFormatted?.(result);
    } catch (err) {
      console.error('Formatting error:', err);
    }
  }, [inputCode, options, formatCode, onCodeFormatted]);

  const handleGenerateTemplate = useCallback(() => {
    const template = generateTemplate(selectedTemplate);
    setInputCode(template);
  }, [selectedTemplate, generateTemplate]);

  const handleCopyFormatted = useCallback(async () => {
    if (!lastResult?.formattedCode) return;

    const success = await CodeFormatterUtils.copyToClipboard(lastResult.formattedCode);
    if (success) {
      // You could show a toast notification here
      console.log('Code copied to clipboard');
    }
  }, [lastResult]);

  const handleDownloadFormatted = useCallback(() => {
    if (!lastResult?.formattedCode) return;

    const filename = CodeFormatterUtils.generateDownloadFilename('trading_scanner');
    CodeFormatterUtils.downloadCode(lastResult.formattedCode, filename);
  }, [lastResult]);

  const suggestions = inputCode ? getOptimizationSuggestions(inputCode) : [];
  const complexity = inputCode ? CodeFormatterService.estimateComplexity(inputCode) : null;

  return (
    <div className={`code-formatter bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          AI Trading Code Formatter
        </h2>
        <p className="text-gray-600">
          Transform your Python trading code with multiprocessing, async patterns, and Edge.dev optimizations
        </p>
      </div>

      {/* Template Generation */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Quick Start Templates</h3>
        <div className="flex items-center gap-4 mb-3">
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="gap">Gap Scanner</option>
            <option value="volume">Volume Scanner</option>
            <option value="breakout">Breakout Scanner</option>
            <option value="custom">Custom Scanner</option>
          </select>
          <button
            onClick={handleGenerateTemplate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Generate Template
          </button>
        </div>
        <p className="text-sm text-gray-600">
          Start with a pre-built template optimized for Edge.dev trading strategies
        </p>
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Upload Python File</h3>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className={`text-4xl mb-2 transition-colors ${
            isDragging ? 'text-blue-500' : 'text-gray-400'
          }`}>
            📁
          </div>
          <div className={`font-medium mb-1 transition-colors ${
            isDragging ? 'text-blue-700' : 'text-gray-700'
          }`}>
            {isDragging ? 'Drop your Python file here!' : 'Click to upload or drag & drop'}
          </div>
          <div className="text-sm text-gray-500">
            Supports .py files only
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".py"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
        <div className="mt-2 text-sm text-gray-600 text-center">
          Or paste your code in the editor below
        </div>
      </div>

      {/* Code Input */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Python Code</h3>
        <textarea
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value)}
          placeholder="Paste your Python trading code here..."
          className="w-full h-64 p-3 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Code Analysis */}
        {inputCode && complexity && (
          <div className="mt-3 p-3 bg-gray-50 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Code Complexity:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                complexity.level === 'low' ? 'bg-green-100 text-green-800' :
                complexity.level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {complexity.level.toUpperCase()} ({complexity.score})
              </span>
            </div>
            {complexity.factors.length > 0 && (
              <p className="text-xs text-gray-600">
                Factors: {complexity.factors.join(', ')}
              </p>
            )}
          </div>
        )}

        {/* Optimization Suggestions */}
        {Array.isArray(suggestions) && suggestions.length > 0 && (
          <div className="mt-3 p-3 bg-blue-50 rounded-md">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              Optimization Suggestions:
            </h4>
            <ul className="text-xs text-blue-800 space-y-1">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Advanced Options */}
      <div className="mb-6">
        <button
          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          className="flex items-center text-gray-700 hover:text-gray-900 focus:outline-none"
        >
          <span className="text-lg font-semibold">Advanced Options</span>
          <span className={`ml-2 transform transition-transform ${showAdvancedOptions ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {showAdvancedOptions && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg grid grid-cols-2 gap-4">
            {Object.entries({
              enableMultiprocessing: 'Add Multiprocessing Support',
              enableAsyncPatterns: 'Convert to Async/Await',
              addTradingPackages: 'Add Trading Packages',
              standardizeOutput: 'Standardize Output Format',
              optimizePerformance: 'Performance Optimizations',
              addErrorHandling: 'Add Error Handling',
              includeLogging: 'Include Logging'
            }).map(([key, label]) => (
              <label key={key} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={options[key as keyof CodeFormattingOptions] as boolean}
                  onChange={(e) => setOptions(prev => ({
                    ...prev,
                    [key]: e.target.checked
                  }))}
                  className="rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Format Button */}
      <div className="mb-6">
        <button
          onClick={handleFormatCode}
          disabled={isFormatting || !inputCode.trim()}
          className="w-full px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isFormatting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Formatting Code...
            </>
          ) : (
            'Format & Optimize Code'
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <h4 className="text-red-800 font-medium mb-2">Formatting Error</h4>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      {lastResult && (
        <div className="space-y-6">
          {/* Success Status */}
          {lastResult.success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h4 className="text-green-800 font-medium mb-2">
                Code Successfully Formatted! 🎉
              </h4>
              <div className="text-sm text-green-700 space-y-1">
                <p>Lines: {lastResult.metadata.originalLines} → {lastResult.metadata.formattedLines}</p>
                <p>Optimizations Applied: {lastResult.optimizations.length}</p>
                <p>Parameters: {lastResult.metadata.parameterCount}</p>
              </div>
            </div>
          )}

          {/* Optimizations */}
          {lastResult.optimizations.length > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="text-blue-800 font-medium mb-2">Applied Optimizations</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {lastResult.optimizations.map((opt, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2 text-blue-500">✓</span>
                    <span>{opt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {lastResult.warnings.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h4 className="text-yellow-800 font-medium mb-2">Warnings</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {lastResult.warnings.map((warning, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2 text-yellow-500">⚠</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Formatted Code */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold">Formatted Code</h4>
              <div className="space-x-2">
                <button
                  onClick={handleCopyFormatted}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Copy
                </button>
                <button
                  onClick={handleDownloadFormatted}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Download
                </button>
              </div>
            </div>
            <pre className="w-full h-96 p-3 bg-gray-900 text-green-400 rounded-md overflow-auto text-sm font-mono">
              {lastResult.formattedCode}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export { CodeFormatter };