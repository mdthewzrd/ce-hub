'use client';

/**
 * 🤖 Renata CopilotKit Integration
 *
 * Production-ready CopilotKit v1.50 integration for Edge Dev platform.
 * Implements AG-UI protocol with Renata AI capabilities.
 *
 * Features:
 * - AI-powered chat interface
 * - Action registration (analyze, convert, execute, etc.)
 * - Real-time state management
 * - Seamless integration with execution flow
 */

import React, { useState } from 'react';
import {
  CopilotKit,
  useCopilotAction,
  useCopilotReadable,
  useCopilotChatSuggestions,
  useCopilotChat
} from '@copilotkit/react-core';
import { CopilotPopup } from '@copilotkit/react-ui';
import { unifiedRenataService } from '@/services/renata/UnifiedRenataService';
import { type v31Scanner } from '@/services/edgeDevApi';

interface RenataCopilotKitProps {
  children: React.ReactNode;
  currentScanResults?: any[];
  currentScanner?: v31Scanner | null;
  onExecutionStart?: (scanner: v31Scanner) => void;
}

export function RenataCopilotKit({
  children,
  currentScanResults = [],
  currentScanner = null,
  onExecutionStart
}: RenataCopilotKitProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [executionStatus, setExecutionStatus] = useState<string>('');

  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <RenataActions
        currentScanResults={currentScanResults}
        currentScanner={currentScanner}
        onExecutionStart={onExecutionStart}
        isProcessing={isProcessing}
        setIsProcessing={setIsProcessing}
        executionStatus={executionStatus}
        setExecutionStatus={setExecutionStatus}
      />
      <RenataContext
        currentScanResults={currentScanResults}
        currentScanner={currentScanner}
      />
      {children}
      <RenataChatInterface />
    </CopilotKit>
  );
}

function RenataActions({
  currentScanResults,
  currentScanner,
  onExecutionStart,
  isProcessing,
  setIsProcessing,
  executionStatus,
  setExecutionStatus
}: any) {
  // Make current context available to AI
  useCopilotReadable({
    description: `Current Scanner: ${currentScanner?.name || 'None'}\nDescription: ${currentScanner?.description || 'N/A'}\nScan Results: ${currentScanResults?.length || 0} items\nProcessing: ${isProcessing ? 'Yes' : 'No'}\nStatus: ${executionStatus || 'Ready'}`,
    value: JSON.stringify({ currentScanner, currentScanResults, isProcessing, executionStatus })
  });

  // ============= ANALYZE CODE ACTION =============
  useCopilotAction({
    name: 'analyzeCode',
    description: 'Analyze Python trading strategy code to understand its structure, patterns, and v31 compliance',
    parameters: [
      {
        name: 'code',
        type: 'string',
        description: 'The Python code to analyze',
        required: true
      }
    ],
    handler: async ({ code }) => {
      setIsProcessing(true);
      try {
        const analysis = await unifiedRenataService.analyzeExistingCode(code);
        return {
          success: true,
          structure: analysis.structure,
          quality: analysis.quality,
          v31Compliance: analysis.v31Compliance,
          requiredChanges: analysis.requiredChanges,
          conversionPath: analysis.conversionPath,
          detectedPatterns: analysis.detectedPatterns,
          summary: `Code analysis complete. Structure: ${analysis.structure.type}, v31 Compliant: ${analysis.v31Compliance ? 'YES' : 'NO'}, Quality Score: ${analysis.quality.score}/100`
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Code analysis failed'
        };
      } finally {
        setIsProcessing(false);
      }
    }
  });

  // ============= CONVERT TO V31 ACTION =============
  useCopilotAction({
    name: 'convertToV31',
    description: 'Convert existing Python scanner code to Edge Dev v31 standard with 5 required methods',
    parameters: [
      {
        name: 'code',
        type: 'string',
        description: 'The Python code to convert',
        required: true
      },
      {
        name: 'format',
        type: 'string',
        description: 'Source format (auto-detect if not specified)',
        required: false
      }
    ],
    handler: async ({ code, format = 'auto' }) => {
      setIsProcessing(true);
      setExecutionStatus('Converting code to v31 standard...');
      try {
        const scanner = await unifiedRenataService.convertToV31(code, format);
        return {
          success: true,
          scanner: {
            name: scanner.name,
            description: scanner.description,
            parameters: scanner.parameters
          },
          message: `Successfully converted to v31 standard! Scanner: ${scanner.name}. You can now execute this scanner.`
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Code conversion failed'
        };
      } finally {
        setIsProcessing(false);
        setExecutionStatus('');
      }
    }
  });

  // ============= GENERATE SCANNER ACTION =============
  useCopilotAction({
    name: 'generateScanner',
    description: 'Generate a new v31-compliant scanner from natural language description',
    parameters: [
      {
        name: 'objective',
        type: 'string',
        description: 'What the scanner should find (e.g., "stocks that gap up 2% on high volume")',
        required: true
      },
      {
        name: 'parameters',
        type: 'object',
        description: 'Optional scanner parameters',
        required: false
      },
      {
        name: 'template',
        type: 'string',
        description: 'Optional template reference (lc_d2, backside_b, etc.)',
        required: false
      }
    ],
    handler: async ({ objective, parameters = {}, template = '' }) => {
      setIsProcessing(true);
      setExecutionStatus('Generating scanner from description...');
      try {
        const scanner = await unifiedRenataService.generateScanner({
          objective,
          parameters,
          template
        });

        return {
          success: true,
          scanner: {
            name: scanner.name,
            description: scanner.description,
            parameters: scanner.parameters
          },
          message: `Scanner generated: ${scanner.name}. ${scanner.description}. Ready to execute!`
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Scanner generation failed'
        };
      } finally {
        setIsProcessing(false);
        setExecutionStatus('');
      }
    }
  });

  // ============= EXECUTE SCANNER ACTION =============
  useCopilotAction({
    name: 'executeScanner',
    description: 'Execute a v31 scanner and wait for results',
    parameters: [
      {
        name: 'scannerName',
        type: 'string',
        description: 'Scanner name (if using current scanner)',
        required: false
      },
      {
        name: 'date',
        type: 'string',
        description: 'Scan date (YYYY-MM-DD format)',
        required: false
      },
      {
        name: 'maxResults',
        type: 'number',
        description: 'Maximum results to return',
        required: false
      }
    ],
    handler: async ({ scannerName, date, maxResults = 100 }) => {
      if (!currentScanner) {
        return {
          success: false,
          error: 'No scanner available. Please generate or convert a scanner first.'
        };
      }

      setIsProcessing(true);
      setExecutionStatus('Executing scanner...');

      try {
        const scanDate = date || new Date().toISOString().split('T')[0];
        const status = await unifiedRenataService.executeScanner(
          currentScanner,
          { date: scanDate, maxResults },
          (progress, message, stage) => {
            setExecutionStatus(`${message} (${progress}%)`);
          }
        );

        if (status.state === 'complete') {
          onExecutionStart?.(currentScanner);
          return {
            success: true,
            results: status.results,
            totalFound: status.totalFound,
            executionTime: status.executionTime,
            message: `Scan complete! Found ${status.totalFound} results in ${status.executionTime}s.`
          };
        } else {
          return {
            success: false,
            error: status.error || 'Execution failed'
          };
        }
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Scanner execution failed'
        };
      } finally {
        setIsProcessing(false);
        setExecutionStatus('');
      }
    }
  });

  // ============= ANALYZE RESULTS ACTION =============
  useCopilotAction({
    name: 'analyzeResults',
    description: 'Analyze scan results to provide insights and optimization suggestions',
    parameters: [
      {
        name: 'resultsCount',
        type: 'number',
        description: 'Number of results to analyze (uses current scan results if not specified)',
        required: false
      }
    ],
    handler: async ({ resultsCount }) => {
      if (!currentScanner) {
        return {
          success: false,
          error: 'No scanner available to analyze results for.'
        };
      }

      const results = currentScanResults.slice(0, resultsCount || currentScanResults.length);

      if (results.length === 0) {
        return {
          success: false,
          error: 'No results to analyze. Please execute a scanner first.'
        };
      }

      setIsProcessing(true);
      try {
        const analysis = await unifiedRenataService.analyzeResults(results, currentScanner);
        return {
          success: true,
          ...analysis,
          message: `Analysis complete for ${results.length} results. ${analysis.summary}`
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Results analysis failed'
        };
      } finally {
        setIsProcessing(false);
      }
    }
  });

  // ============= OPTIMIZE PARAMETERS ACTION =============
  useCopilotAction({
    name: 'optimizeParameters',
    description: 'Optimize scanner parameters based on execution results',
    parameters: [],
    handler: async () => {
      if (!currentScanner || currentScanResults.length === 0) {
        return {
          success: false,
          error: 'Need both a scanner and execution results to optimize parameters.'
        };
      }

      setIsProcessing(true);
      try {
        const optimized = await unifiedRenataService.optimizeParameters(
          currentScanner,
          currentScanResults
        );

        return {
          success: true,
          optimizedParameters: optimized,
          currentParameters: currentScanner.parameters,
          message: 'Parameter optimization complete. Review suggested values and apply if desired.'
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Parameter optimization failed'
        };
      } finally {
        setIsProcessing(false);
      }
    }
  });

  // ============= CREATE PROJECT ACTION =============
  useCopilotAction({
    name: 'createProject',
    description: 'Create a new project to organize scanners',
    parameters: [
      {
        name: 'name',
        type: 'string',
        description: 'Project name',
        required: true
      },
      {
        name: 'description',
        type: 'string',
        description: 'Project description',
        required: true
      }
    ],
    handler: async ({ name, description }) => {
      try {
        const project = await unifiedRenataService.createProject(name, description);
        return {
          success: true,
          project: {
            id: project.id,
            name: project.name,
            description: project.description
          },
          message: `Project "${name}" created successfully!`
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Project creation failed'
        };
      }
    }
  });

  return null;
}

function RenataContext({ currentScanResults, currentScanner }: any) {
  // Provide context to the AI about current state
  useCopilotReadable({
    description: `Platform Context: Edge Dev Trading Platform v3.0.0\nCurrent Scanner: ${currentScanner?.name || 'None'}\nScan Results: ${currentScanResults?.length || 0} items\nCapabilities: Scanner execution, Code analysis, v31 conversion, Results analysis, Parameter optimization`,
    value: JSON.stringify({
      scanResultsCount: currentScanResults?.length || 0,
      hasScanner: !!currentScanner,
      scannerName: currentScanner?.name || 'None',
      platformInfo: {
        name: 'Edge Dev Trading Platform',
        version: '3.0.0',
        capabilities: [
          'Scanner execution',
          'Code analysis',
          'Code conversion to v31',
          'Results analysis',
          'Parameter optimization'
        ]
      }
    })
  });

  return null;
}

function RenataChatInterface() {
  // Custom chat suggestions
  const suggestions = [
    {
      label: 'Analyze my scanner code',
      message: 'Please analyze my current scanner code and explain how it works',
      title: 'Code Analysis'
    },
    {
      label: 'Convert this code to v31 standard',
      message: 'Convert my scanner code to the EdgeDev v31 standard',
      title: 'V31 Conversion'
    },
    {
      label: 'Generate a gap-up scanner',
      message: 'Generate a new gap-up trading scanner for me',
      title: 'Generate Scanner'
    },
    {
      label: 'Execute current scanner',
      message: 'Execute the current scanner and show me results',
      title: 'Execute Scanner'
    },
    {
      label: 'Analyze the results',
      message: 'Analyze the scan results and provide insights',
      title: 'Results Analysis'
    },
    {
      label: 'Optimize scanner parameters',
      message: 'Help optimize my scanner parameters for better performance',
      title: 'Parameter Optimization'
    }
  ];

  useCopilotChatSuggestions({
    suggestions
  });

  return (
    <CopilotPopup
      instructions={`You are Renata, the AI trading strategy assistant for Edge Dev platform.

CAPABILITIES:
1. Analyze Python trading code and explain how it works
2. Convert any scanner code to v31 standard
3. Generate new scanners from descriptions
4. Execute scanners and analyze results
5. Optimize parameters based on performance

v31 STANDARD:
Every scanner must have 5 methods:
- fetch_grouped_data: Get market data
- apply_smart_filters: Filter by price/volume
- detect_patterns: Find trading setups
- format_results: Format output
- run_scan: Orchestrate pipeline

WORKFLOW:
1. Understand user's goal
2. Analyze or generate code as needed
3. Execute and validate
4. Provide insights and optimizations

Always be helpful, concise, and focused on trading strategies.`}
      labels={{
        title: 'Renata AI Assistant',
        initial: 'Hi! I\'m Renata, your Edge Dev AI assistant. I can help you:\n\n• Analyze scanner code\n• Convert to v31 standard\n• Generate new scanners\n• Execute and analyze results\n• Optimize parameters\n\nWhat would you like to work on today?',
        placeholder: 'Ask Renata to help with your trading strategies...'
      }}
      defaultOpen={false}
      shortcut="/"
    />
  );
}

// ============= Convenience Hook =============

export function useRenataChat() {
  // This hook can be used by components to interact with Renata
  // For now, it's a placeholder for future enhancements
  return {
    isOpen: false,
    setOpen: (open: boolean) => {
      // Toggle chat - implementation pending
    }
  };
}
