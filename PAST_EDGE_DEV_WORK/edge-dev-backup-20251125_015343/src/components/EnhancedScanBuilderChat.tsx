/**
 * AG-UI Enhanced Renata Chat
 * Uses CopilotKit's AG-UI protocol for proper bidirectional communication
 * Replaces custom command processing with declarative actions
 */

'use client'

import React, { useState, useEffect } from 'react';
import { useCopilotAction, useCopilotReadable } from '@copilotkit/react-core';
import { CopilotTextarea } from '@copilotkit/react-textarea';
import { Brain, Settings, AlertCircle, Sparkles, MessageSquare, FileCode, X, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

// Import our PydanticAI service
import pydanticAIService from '@/services/pydanticAiService';

type RenataMode = 'renata' | 'analyst' | 'coach' | 'mentor'

const RENATA_MODES = [
  {
    id: 'renata' as RenataMode,
    name: 'Renata',
    description: 'Balanced AI assistant',
    color: 'text-purple-400',
    borderColor: 'border-purple-400/50',
  },
  {
    id: 'analyst' as RenataMode,
    name: 'Analyst',
    description: 'Data-focused analysis',
    color: 'text-red-400',
    borderColor: 'border-red-400/50',
  },
  {
    id: 'coach' as RenataMode,
    name: 'Coach',
    description: 'Constructive guidance',
    color: 'text-blue-400',
    borderColor: 'border-blue-400/50',
  },
  {
    id: 'mentor' as RenataMode,
    name: 'Mentor',
    description: 'Reflective insights',
    color: 'text-green-400',
    borderColor: 'border-green-400/50',
  },
]

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

interface ScanParameters {
  market_filters: {
    price_min: number;
    price_max: number;
    volume_min_usd: number;
  };
  momentum_triggers: {
    atr_multiple: number;
    volume_multiple: number;
    gap_threshold_atr: number;
    ema_distance_9: number;
    ema_distance_20: number;
  };
  signal_scoring: {
    signal_strength_min: number;
    target_multiplier: number;
  };
  entry_criteria: {
    max_results_per_day: number;
    close_range_min: number;
  };
}

interface GeneratedScan {
  id: string;
  name: string;
  description: string;
  code: string;
  parameters: Record<string, any>;
  confidence: number;
  suggestions: string[];
  created_at: string;
}

interface BacktestConfiguration {
  strategy_name: string;
  entry_rules: string[];
  exit_rules: string[];
  risk_management: Record<string, any>;
  expected_performance: Record<string, any>;
  code_template: string;
}

interface PydanticAIStatus {
  available: boolean;
  agents: Record<string, any>;
  last_check: string;
}

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
  uploadedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎮 MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function AguiRenataChat() {
  const [currentMode, setCurrentMode] = useState<RenataMode>('renata')

  // Mock performance data (replace with real data)
  const [performanceData] = useState({
    totalPnL: 2847.50,
    winRate: 0.524,
    expectancy: 0.82,
    profitFactor: 1.47,
    maxDrawdown: -0.15,
    totalTrades: 67,
    avgWinner: 180.25,
    avgLoser: -95.50,
  })

  // PydanticAI Enhanced State
  const [generatedScans, setGeneratedScans] = useState<GeneratedScan[]>([]);
  const [pydanticAIStatus, setPydanticAIStatus] = useState<PydanticAIStatus>({
    available: false,
    agents: {},
    last_check: new Date().toISOString()
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentBacktestConfig, setCurrentBacktestConfig] = useState<BacktestConfiguration | null>(null);

  // Mock display mode and date range (you can connect these to actual contexts)
  const [displayMode, setDisplayMode] = useState<string>('dollar');
  const [dateRange, setDateRange] = useState<string>('all');

  // Drag and drop state
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // File attachment state
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);

  // Chat state - now handled by CopilotTextarea
  const [chatMessage, setChatMessage] = useState('');
  const [isProcessingMessage, setIsProcessingMessage] = useState(false);

  // Default scan parameters for optimization
  const [currentParameters] = useState<ScanParameters>({
    market_filters: {
      price_min: 8.0,
      price_max: 1000.0,
      volume_min_usd: 30000000,
    },
    momentum_triggers: {
      atr_multiple: 0.9,
      volume_multiple: 0.9,
      gap_threshold_atr: 0.75,
      ema_distance_9: 1.05,
      ema_distance_20: 1.1,
    },
    signal_scoring: {
      signal_strength_min: 0.7,
      target_multiplier: 2.0,
    },
    entry_criteria: {
      max_results_per_day: 10,
      close_range_min: 0.5,
    },
  });

  // ────── PydanticAI Service Integration ──────

  useEffect(() => {
    // Check PydanticAI service availability on mount
    checkPydanticAIStatus();

    // Set up periodic health checks
    const healthCheckInterval = setInterval(checkPydanticAIStatus, 30000); // Every 30 seconds

    return () => clearInterval(healthCheckInterval);
  }, []);

  const checkPydanticAIStatus = async () => {
    try {
      const isHealthy = await pydanticAIService.checkHealth();
      if (isHealthy) {
        const agentStatus = await pydanticAIService.getAgentStatus();
        setPydanticAIStatus({
          available: true,
          agents: agentStatus || {},
          last_check: new Date().toISOString()
        });
      } else {
        setPydanticAIStatus(prev => ({
          ...prev,
          available: false,
          last_check: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('PydanticAI status check failed:', error);
      setPydanticAIStatus(prev => ({
        ...prev,
        available: false,
        last_check: new Date().toISOString()
      }));
    }
  };

  // ────── CopilotKit Integration with PydanticAI Enhancement ──────

  // Make current dashboard state readable by AI
  useCopilotReadable({
    description: "Current trading dashboard state and context",
    value: {
      currentPage: typeof window !== 'undefined' ? window.location.pathname : '/',
      displayMode: displayMode,
      dateRange: dateRange,
      performanceMetrics: performanceData,
      aiMode: currentMode
    }
  })

  // Make performance metrics readable by AI
  useCopilotReadable({
    description: "Trading performance metrics and statistics",
    value: performanceData
  })

  // Make scan state readable to the AI
  useCopilotReadable({
    description: "Generated scans and PydanticAI service status",
    value: {
      generated_scans: generatedScans,
      pydantic_ai_status: pydanticAIStatus,
      enhanced_capabilities: {
        scan_generation: pydanticAIStatus.available,
        backtest_creation: pydanticAIStatus.available,
        parameter_optimization: pydanticAIStatus.available,
        pattern_analysis: pydanticAIStatus.available
      }
    }
  });

  // Make attached files readable to the AI
  useCopilotReadable({
    description: "Files attached by user for processing",
    value: {
      attached_files: attachedFiles.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        lines: file.content.split('\n').length,
        uploaded_at: file.uploadedAt,
        content_preview: file.content.substring(0, 500) // First 500 characters for context
      })),
      total_files: attachedFiles.length,
      ready_for_processing: attachedFiles.length > 0
    }
  });

  // AG-UI Action: Set Display Mode
  useCopilotAction({
    name: "setDisplayMode",
    description: "Change dashboard display mode to show values in dollars, R-multiples, or percentages",
    parameters: [
      {
        name: "mode",
        type: "string",
        description: "Display mode: 'dollar', 'r_multiple', or 'percentage'"
      }
    ],
    handler: async ({ mode }) => {
      if (['dollar', 'r_multiple', 'percentage'].includes(mode)) {
        setDisplayMode(mode as any)

        const modeNames = {
          dollar: 'Dollar',
          r_multiple: 'R-Multiple',
          percentage: 'Percentage'
        }

        return `✅ Display mode changed to ${modeNames[mode as keyof typeof modeNames]} view`
      }
      return `❌ Invalid display mode. Use: dollar, r_multiple, or percentage`
    }
  })

  // AG-UI Action: Set Date Range
  useCopilotAction({
    name: "setDateRange",
    description: "Change the date range filter for dashboard data",
    parameters: [
      {
        name: "range",
        type: "string",
        description: "Date range: 'today', 'yesterday', 'week', 'lastWeek', 'month', 'lastMonth', '90day', or 'all'"
      }
    ],
    handler: async ({ range }) => {
      const validRanges = ['today', 'yesterday', 'week', 'lastWeek', 'month', 'lastMonth', '90day', 'all']

      if (validRanges.includes(range)) {
        setDateRange(range as any)

        const rangeNames = {
          today: 'Today',
          yesterday: 'Yesterday',
          week: 'This Week',
          lastWeek: 'Last Week',
          month: 'This Month',
          lastMonth: 'Last Month',
          '90day': 'Last 90 Days',
          all: 'All Time'
        }

        return `✅ Date range changed to ${rangeNames[range as keyof typeof rangeNames]}`
      }
      return `❌ Invalid date range. Use: ${validRanges.join(', ')}`
    }
  })

  // AG-UI Action: Change AI Mode
  useCopilotAction({
    name: "setAIMode",
    description: "Switch between different AI personality modes",
    parameters: [
      {
        name: "mode",
        type: "string",
        description: "AI mode: 'renata', 'analyst', 'coach', or 'mentor'"
      }
    ],
    handler: async ({ mode }) => {
      const validModes = ['renata', 'analyst', 'coach', 'mentor']

      if (validModes.includes(mode)) {
        setCurrentMode(mode as RenataMode)

        const modeDescriptions = {
          renata: 'Balanced AI assistant mode',
          analyst: 'Data-focused analysis mode',
          coach: 'Constructive guidance mode',
          mentor: 'Reflective insights mode'
        }

        return `✅ AI mode changed to ${mode.charAt(0).toUpperCase() + mode.slice(1)} - ${modeDescriptions[mode as keyof typeof modeDescriptions]}`
      }
      return `❌ Invalid AI mode. Available modes: ${validModes.join(', ')}`
    }
  })

  // Enhanced scan creation with PydanticAI
  useCopilotAction({
    name: "create_scan_from_description",
    description: "Create a completely new trading scan from natural language description using AI",
    parameters: [
      {
        name: "description",
        type: "string",
        description: "Detailed description of the trading strategy or scan you want to create (e.g., 'Find stocks gapping up 3% with high volume that recover above yesterday's close')",
        required: true
      },
      {
        name: "market_conditions",
        type: "string",
        description: "Current market conditions: bullish, bearish, sideways, volatile, or unknown",
        required: false
      }
    ],
    handler: async ({ description, market_conditions = "unknown" }) => {
      if (!pydanticAIStatus.available) {
        return "❌ Enhanced AI scan creation requires the PydanticAI service. Please ensure the service is running on port 8001.";
      }

      setIsGenerating(true);
      try {
        console.log("🤖 Creating scan from description:", description);

        // Use PydanticAI service to create scan
        const result = await pydanticAIService.createScanFromDescription(description, {
          marketConditions: market_conditions,
          timeframe: "1D",
          volumeThreshold: currentParameters.market_filters.volume_min_usd,
          existingScanners: generatedScans,
          preferences: currentParameters
        });

        // Create new generated scan record
        const newScan: GeneratedScan = {
          id: `scan_${Date.now()}`,
          name: `AI Generated: ${description.substring(0, 50)}...`,
          description,
          code: result.scanCode,
          parameters: result.parameters,
          confidence: result.confidence,
          suggestions: result.suggestions,
          created_at: new Date().toISOString()
        };

        setGeneratedScans(prev => [newScan, ...prev]);
        setIsGenerating(false);

        return `🎉 Successfully created AI-generated scan!\n\n📝 **Explanation**: ${result.explanation}\n\n🎯 **Confidence**: ${(result.confidence * 100).toFixed(1)}%\n\n💡 **Suggestions**: ${result.suggestions.join(', ')}\n\nThe scan code has been generated and saved. You can now test it or ask me to create a backtest for this strategy.`;

      } catch (error) {
        setIsGenerating(false);
        console.error("Scan creation error:", error);
        return `❌ Error creating scan: ${error instanceof Error ? error.message : 'Unknown error'}. The AI service may be unavailable or the description needs to be more specific.`;
      }
    },
  });

  // Generate backtest configuration
  useCopilotAction({
    name: "create_backtest_strategy",
    description: "Create a complete backtest configuration for a trading strategy using AI",
    parameters: [
      {
        name: "strategy_description",
        type: "string",
        description: "Description of the trading strategy to backtest",
        required: true
      },
      {
        name: "scan_id",
        type: "string",
        description: "ID of the generated scan to use (optional, will use latest if not specified)",
        required: false
      }
    ],
    handler: async ({ strategy_description, scan_id }) => {
      if (!pydanticAIStatus.available) {
        return "❌ Backtest creation requires the PydanticAI service. Please ensure the service is running.";
      }

      try {
        console.log("📊 Creating backtest configuration:", strategy_description);

        // Find the scan to use
        let targetScan = generatedScans[0]; // Use latest by default
        if (scan_id) {
          const foundScan = generatedScans.find(s => s.id === scan_id);
          if (foundScan) targetScan = foundScan;
        }

        if (!targetScan) {
          return "❌ No generated scans found. Please create a scan first before generating a backtest.";
        }

        // Use PydanticAI service to create backtest
        const result = await pydanticAIService.createBacktestFromStrategy(
          `${targetScan.name} Strategy`,
          strategy_description,
          targetScan.parameters,
          {
            timeframe: "1D",
            marketConditions: "unknown",
            riskParameters: {}
          }
        );

        setCurrentBacktestConfig({
          strategy_name: `${targetScan.name} Strategy`,
          entry_rules: result.entryRules,
          exit_rules: result.exitRules,
          risk_management: result.riskManagement,
          expected_performance: result.expectedPerformance,
          code_template: result.codeTemplate
        });

        return `🎯 Backtest configuration created!\n\n📈 **Entry Rules**:\n${result.entryRules.map(rule => `• ${rule}`).join('\n')}\n\n📉 **Exit Rules**:\n${result.exitRules.map(rule => `• ${rule}`).join('\n')}\n\n⚠️ **Risk Management**: ${Object.entries(result.riskManagement).map(([key, value]) => `${key}: ${value}`).join(', ')}\n\nThe backtest configuration is ready to run.`;

      } catch (error) {
        console.error("Backtest creation error:", error);
        return `❌ Error creating backtest: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },
  });

  // Optimize existing scan parameters
  useCopilotAction({
    name: "optimize_scan_parameters",
    description: "Use AI to optimize scan parameters for better performance",
    parameters: [
      {
        name: "optimization_goals",
        type: "string",
        description: "What to optimize for: 'returns', 'win_rate', 'sharpe_ratio', 'risk_adjusted', or 'balanced'",
        required: false
      },
      {
        name: "scan_id",
        type: "string",
        description: "ID of the scan to optimize (optional, will use current parameters if not specified)",
        required: false
      }
    ],
    handler: async ({ optimization_goals = "balanced", scan_id }) => {
      if (!pydanticAIStatus.available) {
        return "❌ Parameter optimization requires the PydanticAI service.";
      }

      try {
        console.log("⚙️ Optimizing parameters:", optimization_goals);

        // Determine parameters to optimize
        let parametersToOptimize = currentParameters;
        let scanName = "Current Configuration";

        if (scan_id) {
          const targetScan = generatedScans.find(s => s.id === scan_id);
          if (targetScan) {
            parametersToOptimize = targetScan.parameters as ScanParameters;
            scanName = targetScan.name;
          }
        }

        // Mock performance metrics (in real implementation, these would come from actual backtests)
        const mockPerformanceMetrics = {
          total_return: 0.12,
          win_rate: 0.55,
          sharpe_ratio: 1.2,
          max_drawdown: -0.08,
          avg_trade_duration: 4.5
        };

        const goalsList = optimization_goals.split(',').map(g => g.trim());

        const result = await pydanticAIService.getScanOptimizationSuggestions(
          scan_id || "current",
          parametersToOptimize,
          mockPerformanceMetrics,
          goalsList
        );

        return `🎯 Parameter optimization complete for ${scanName}!\n\n📈 **Expected Improvements**:\n${Object.entries(result.expectedImprovement).map(([metric, improvement]) => `• ${metric}: ${typeof improvement === 'number' ? (improvement * 100).toFixed(1) + '%' : improvement}`).join('\n')}\n\n🧠 **AI Rationale**: ${result.rationale}\n\n🎲 **Confidence**: ${(result.confidence * 100).toFixed(1)}%\n\nOptimized parameters are ready to be applied.`;

      } catch (error) {
        console.error("Parameter optimization error:", error);
        return `❌ Error optimizing parameters: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },
  });

  // Analyze market patterns
  useCopilotAction({
    name: "analyze_market_patterns",
    description: "Use AI to analyze current market patterns and suggest trading opportunities",
    parameters: [
      {
        name: "timeframe",
        type: "string",
        description: "Timeframe for analysis: '1D', '4H', '1H', '15M'",
        required: false
      }
    ],
    handler: async ({ timeframe = "1D" }) => {
      if (!pydanticAIStatus.available) {
        return "❌ Pattern analysis requires the PydanticAI service.";
      }

      try {
        console.log("📈 Analyzing market patterns:", timeframe);

        const result = await pydanticAIService.analyzePatterns(
          timeframe,
          "unknown",
          currentParameters.market_filters.volume_min_usd
        );

        if (!result.success) {
          throw new Error(result.message);
        }

        const patterns = result.data.identified_patterns || [];
        const sentiment = result.data.market_sentiment || {};
        const opportunities = result.data.trading_opportunities || [];

        return `📊 Market Pattern Analysis (${timeframe})\n\n🔍 **Identified Patterns**:\n${patterns.map((p: any) => `• ${p.pattern}: ${p.description} (${(p.confidence * 100).toFixed(1)}% confidence)`).join('\n')}\n\n💭 **Market Sentiment**: ${sentiment.sentiment || 'Unknown'} (${sentiment.confidence ? (sentiment.confidence * 100).toFixed(1) + '%' : 'N/A'} confidence)\n\n🎯 **Trading Opportunities**:\n${opportunities.map((op: any, i: number) => `${i + 1}. ${op.description || 'Pattern-based opportunity'}`).join('\n')}\n\nThis analysis can help you refine your scan parameters or create new strategies.`;

      } catch (error) {
        console.error("Pattern analysis error:", error);
        return `❌ Error analyzing patterns: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },
  });

  // Format existing scan code
  useCopilotAction({
    name: "format_existing_scan_code",
    description: "Upload and format existing scan code using AI for optimization and improvement",
    parameters: [
      {
        name: "source_code",
        type: "string",
        description: "Existing scan code to format and optimize (Python code)",
        required: true
      },
      {
        name: "format_type",
        type: "string",
        description: "Type of formatting: 'scan_optimization', 'general_cleanup', or 'performance_boost'",
        required: false
      },
      {
        name: "current_issues",
        type: "string",
        description: "Known issues with current code (comma-separated list)",
        required: false
      }
    ],
    handler: async ({ source_code, format_type = "scan_optimization", current_issues = "" }) => {
      if (!pydanticAIStatus.available) {
        return "❌ Code formatting requires the PydanticAI service. Please ensure the service is running on port 8001.";
      }

      if (!source_code || source_code.trim().length < 50) {
        return "❌ Please provide valid Python scan code to format. Code should be at least 50 characters long.";
      }

      setIsGenerating(true);
      try {
        console.log("🔧 Formatting existing scan code:", format_type);

        const issuesList = current_issues ? current_issues.split(',').map(s => s.trim()) : [];

        // Use PydanticAI service to format code
        const result = await pydanticAIService.formatScanCode(source_code, {
          formatType: format_type as 'scan_optimization' | 'general_cleanup' | 'performance_boost',
          preserveLogic: true,
          addDocumentation: true,
          optimizePerformance: true,
          currentIssues: issuesList
        });

        setIsGenerating(false);

        // Create new formatted scan record
        const formattedScan: GeneratedScan = {
          id: `formatted_scan_${Date.now()}`,
          name: `AI-Formatted: ${format_type.replace('_', ' ')} (${new Date().toLocaleDateString()})`,
          description: `AI-optimized scan code using ${format_type} formatting`,
          code: result.formattedCode,
          parameters: result.originalMetrics,
          confidence: result.codeQualityScore / 10,
          suggestions: result.aiInsights,
          created_at: new Date().toISOString()
        };

        setGeneratedScans(prev => [formattedScan, ...prev]);

        return `🎉 **Code Successfully Formatted & Optimized!**\n\n📊 **Original Metrics**:\n• Lines of Code: ${result.originalMetrics.lines_of_code}\n• Functions: ${result.originalMetrics.functions_found}\n• Imports: ${result.originalMetrics.imports_found}\n\n🚀 **Improvements Applied**:\n${result.enhancementsApplied.map(enhancement => `• ${enhancement}`).join('\n')}\n\n⭐ **Code Quality Score**: ${result.codeQualityScore}/10\n\n💡 **AI Insights**:\n${result.aiInsights.map(insight => `• ${insight}`).join('\n')}\n\n📈 **Estimated Improvement**: ${result.estimatedImprovement}\n\n🔧 **Optimization Suggestions**:\n${result.optimizationSuggestions.slice(0, 3).map(suggestion => `• **${suggestion.category}**: ${suggestion.suggestion} (${suggestion.impact} impact)`).join('\n')}\n\nThe formatted code has been saved and is ready for use. You can now run it or ask me to create a backtest strategy for this optimized scan!`;

      } catch (error) {
        setIsGenerating(false);
        console.error("Code formatting error:", error);
        return `❌ Error formatting code: ${error instanceof Error ? error.message : 'Unknown error'}. Please check that your code is valid Python and the AI service is running properly.`;
      }
    },
  });

  // Show available enhanced features
  useCopilotAction({
    name: "show_enhanced_features",
    description: "Display available enhanced AI features and service status",
    parameters: [],
    handler: async () => {
      const statusIcon = pydanticAIStatus.available ? "🟢" : "🔴";
      const statusText = pydanticAIStatus.available ? "Available" : "Unavailable";

      return `🚀 **Enhanced AI Features Status**\n\n${statusIcon} **PydanticAI Service**: ${statusText}\n\n🎯 **Available Features**:\n${pydanticAIStatus.available ?
        "• 🔍 **create_scan_from_description** - Create scans from natural language\n• 📊 **create_backtest_strategy** - Generate complete backtest configurations\n• ⚙️ **optimize_scan_parameters** - AI-powered parameter optimization\n• 📈 **analyze_market_patterns** - Real-time market pattern analysis\n• 🔧 **format_existing_scan_code** - Upload and optimize existing scan code"
        :
        "❌ Enhanced features require the PydanticAI service to be running on port 8001."
      }\n\n📝 **Generated Scans**: ${generatedScans.length} scan${generatedScans.length !== 1 ? 's' : ''} created\n\n💡 **Tip**: Try asking me to "create a scan for finding gap ups with volume confirmation", "format my existing scan code", or "analyze current market patterns".`;
    },
  });

  // ────── Chat Handlers ──────

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle message sending
  const handleSendMessage = async () => {
    if (!chatMessage.trim() || isProcessingMessage) return;

    const messageContent = chatMessage.trim();
    console.log('📤 Manual message sending triggered:', messageContent);
    console.log('📋 Triggering send_general_message action handler...');

    setIsProcessingMessage(true);
    setChatMessage('');

    try {
      // Directly call our action handler with the message
      const actionResult = await handleGeneralMessage(messageContent);
      console.log('✅ Action handler result:', actionResult);
    } catch (error) {
      console.error('❌ Error processing message:', error);
    } finally {
      setIsProcessingMessage(false);
    }
  };

  // Extract action handler logic to reusable function
  const handleGeneralMessage = async (message: string): Promise<string> => {
    console.log('🔥 General message received:', message);
    console.log('🎯 Action handler triggered successfully!');
    console.log('📝 Message content:', JSON.stringify(message));

    // Comprehensive context-aware response logic
    const modeDescription = RENATA_MODES.find(m => m.id === currentMode)?.description || 'AI Trading Assistant';

    if (typeof message !== 'string' || message.trim().length === 0) {
      return "I need a message to respond to. Please type something!";
    }

    return `Hello! I'm Renata, your ${modeDescription}. You said: "${message}"\n\n✅ Message processing functionality is now working!\n\n📊 Current settings:\n- Display Mode: ${displayMode}\n- Date Range: ${dateRange}\n- AI Mode: ${currentMode}\n- PydanticAI: ${pydanticAIStatus.available ? 'Available' : 'Unavailable'}\n\n💡 Your message has been successfully processed through the action handler system!`;
  };

  // ────── General Message Handler for CopilotTextarea ──────

  // Critical: This handler processes general messages submitted through CopilotTextarea
  useCopilotAction({
    name: "send_general_message",
    description: "Process general messages and questions from the user through the chat interface",
    parameters: [
      {
        name: "message",
        type: "string",
        description: "The user's message or question",
        required: true,
      }
    ],
    handler: async ({ message }) => {
      console.log('🔥 General message received:', message);
      console.log('🎯 Action handler triggered successfully!');
      console.log('📝 Message content:', JSON.stringify(message));

      try {
        // Build comprehensive context for AI response
        const contextInfo = {
          displayMode,
          dateRange,
          currentMode,
          generatedScansCount: generatedScans.length,
          pydanticAIAvailable: pydanticAIStatus.available,
          attachedFilesCount: attachedFiles.length,
          attachedFileNames: attachedFiles.map(f => f.name),
          availableActions: [
            'setDisplayMode', 'setDateRange', 'setAIMode',
            'create_scan_from_description', 'create_backtest_strategy',
            'optimize_scan_parameters', 'analyze_market_patterns',
            'format_existing_scan_code', 'show_enhanced_features'
          ]
        };

        // Process the message with context awareness
        if (message.toLowerCase().includes('help') || message.toLowerCase().includes('what can you do')) {
          return `🤖 **Renata AI Assistant** - ${RENATA_MODES.find(m => m.id === currentMode)?.name || 'Trading Assistant'}\n\n🎯 **I can help you with:**\n\n**📊 Dashboard Control:**\n• Change display mode (${displayMode})\n• Adjust date range (${dateRange})\n• Switch AI personality modes\n\n**🔍 Enhanced Scan Builder** ${pydanticAIStatus.available ? '🟢' : '🔴'}:\n• Create scans from natural language\n• Optimize existing parameters\n• Analyze market patterns\n• Format uploaded scan code\n\n**📈 Current Status:**\n• Generated Scans: ${generatedScans.length}\n• Attached Files: ${attachedFiles.length}\n• Enhanced AI: ${pydanticAIStatus.available ? 'Available' : 'Unavailable'}\n\n💡 **Try asking:** "Create a scan for gap ups", "Switch to percentage mode", or "Show enhanced features"`;
        }

        if (message.toLowerCase().includes('status')) {
          return `📊 **Current System Status**\n\n🎛️ **Dashboard Settings:**\n• Display Mode: ${displayMode}\n• Date Range: ${dateRange}\n• AI Mode: ${currentMode}\n\n📈 **Scan Builder:**\n• Generated Scans: ${generatedScans.length}\n• Enhanced Features: ${pydanticAIStatus.available ? '🟢 Available' : '🔴 Unavailable'}\n\n📁 **File Attachments:**\n• Files Ready: ${attachedFiles.length}${attachedFiles.length > 0 ? `\n• Files: ${attachedFiles.map(f => f.name).join(', ')}` : ''}`;
        }

        // Default contextual response
        const modeDescription = RENATA_MODES.find(m => m.id === currentMode)?.description || 'AI Trading Assistant';
        return `Hello! I'm Renata, your ${modeDescription}. I understand you said: "${message}"\n\nBased on your current setup:\n• Display: ${displayMode} mode\n• Date range: ${dateRange}\n• ${generatedScans.length} scans generated\n\nHow can I assist you with your trading analysis today? I can help create scans, analyze patterns, adjust dashboard settings, or process any uploaded files.`;

      } catch (error) {
        console.error('❌ Error processing general message:', error);
        return `⚠️ I encountered an issue processing your message. Please try again or check if the enhanced AI service is running.`;
      }
    },
  });

  // ────── Drag and Drop File Handlers ──────

  const handleDragEnter = (e: React.DragEvent) => {
    console.log('🎯 Drag enter detected')
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    console.log('👋 Drag leave detected')
    e.preventDefault()
    e.stopPropagation()
    // Only set dragOver to false if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleFileDrop = async (e: React.DragEvent) => {
    console.log('🚀 File drop detected!')
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    console.log('📁 Files detected:', files.length)

    if (files.length === 0) {
      console.warn('No files in drop')
      return
    }

    const file = files[0] // Handle first file for now
    console.log('📄 Processing file:', file.name, 'Size:', file.size, 'bytes')

    // Check if it's a valid file type
    const validExtensions = ['.py', '.txt', '.js', '.ts', '.jsx', '.tsx']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    console.log('🔍 File extension:', fileExtension)

    if (!validExtensions.includes(fileExtension)) {
      console.warn('❌ Unsupported file type:', fileExtension, 'Supported:', validExtensions)
      alert(`Unsupported file type: ${fileExtension}\nSupported: ${validExtensions.join(', ')}`)
      return
    }

    console.log('✅ File type valid, loading content into chat...')
    setIsProcessingFile(true)

    try {
      const fileContent = await readFileContent(file)
      console.log('📖 File content read, length:', fileContent.length)

      if (fileContent.length < 50) {
        console.warn('❌ File content too short:', fileContent.length, 'characters')
        alert('File content seems too short. Please upload a valid scan code file.')
        setIsProcessingFile(false)
        return
      }

      console.log('📎 Creating file attachment instead of loading content directly...')

      // Create file attachment object
      const newAttachment: FileAttachment = {
        id: `file_${Date.now()}`,
        name: file.name,
        size: file.size,
        type: file.type || 'text/plain',
        content: fileContent,
        uploadedAt: new Date().toISOString()
      }

      // Add file to attachments state
      setAttachedFiles(prev => [...prev, newAttachment])

      console.log('✅ File attachment created:', newAttachment.name)
      console.log('📎 Total attachments:', attachedFiles.length + 1)

    } catch (error) {
      console.error('❌ Error reading file:', error)
      alert('Error reading file: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsProcessingFile(false)
    }
  }

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        resolve(content)
      }
      reader.onerror = (e) => reject(e)
      reader.readAsText(file)
    })
  }


  const currentModeInfo = RENATA_MODES.find(mode => mode.id === currentMode) || RENATA_MODES[0]

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-600 p-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
            <Brain className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold studio-text">Renata AI</h3>
            <p className="text-xs studio-muted">Enhanced Trading Assistant</p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center space-x-2">
          <select
            value={currentMode}
            onChange={(e) => setCurrentMode(e.target.value as RenataMode)}
            className="rounded border border-gray-600 bg-background px-3 py-1 text-sm text-foreground"
          >
            {RENATA_MODES.map(mode => (
              <option key={mode.id} value={mode.id}>
                {mode.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-b border-gray-600 bg-muted/30 p-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span className={cn("flex items-center space-x-1", currentModeInfo.color)}>
              <Sparkles className="h-3 w-3" />
              <span>{currentModeInfo.name} Mode</span>
            </span>
            <span>•</span>
            <span>Display: {displayMode === 'dollar' ? '$' : displayMode === 'r_multiple' ? 'R' : '%'}</span>
            <span>•</span>
            <span>Range: {dateRange}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className={`h-2 w-2 rounded-full ${pydanticAIStatus.available ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className={pydanticAIStatus.available ? 'text-green-400' : 'text-red-400'}>
              {pydanticAIStatus.available ? 'AG-UI Active' : 'Basic Mode'}
            </span>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col p-4">
        <div className="flex-1 mb-4">
          {/* Status Banner */}
          {(isDragOver || isProcessingFile) && (
            <div className={cn(
              "mb-4 p-3 rounded-lg text-center font-medium transition-all",
              isDragOver && !isProcessingFile && "bg-blue-500/10 border border-blue-500/20 text-blue-400",
              isProcessingFile && "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400"
            )}>
              {isDragOver && !isProcessingFile && "🎯 Drop your trading scan file here to enhance it with AI!"}
              {isProcessingFile && (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                  <span>Loading file into chat...</span>
                </div>
              )}
            </div>
          )}

          <div
            className={cn(
              "min-h-[300px] w-full rounded-lg border relative transition-all duration-300",
              isDragOver
                ? "border-blue-400 border-2 bg-blue-500/5 shadow-lg shadow-blue-500/10"
                : "border-gray-600 bg-background",
              isProcessingFile && "opacity-60"
            )}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleFileDrop}
          >
            {/* Enhanced Drag Overlay */}
            {isDragOver && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-blue-500/10 rounded-lg border-2 border-dashed border-blue-400">
                <div className="text-center p-8">
                  <div className="text-6xl mb-4">🚀</div>
                  <div className="text-blue-400 text-xl font-bold mb-3">Drop Trading Scan Here</div>
                  <div className="text-sm text-blue-300/80 space-y-1">
                    <div>✅ Python (.py) • JavaScript (.js) • TypeScript (.ts)</div>
                    <div>✅ Text (.txt) • JSX (.jsx) • TSX (.tsx)</div>
                  </div>
                  <div className="mt-4 text-xs text-blue-300/60">
                    AI will automatically format, optimize & enhance your code
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Processing Overlay */}
            {isProcessingFile && (
              <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/90 rounded-lg backdrop-blur-sm">
                <div className="text-center p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-400/20 border-t-yellow-400 mx-auto mb-4"></div>
                  <div className="text-lg font-semibold text-yellow-400 mb-2">📁 Loading File</div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Reading file content...</div>
                    <div>Formatting for chat...</div>
                    <div>Ready for processing...</div>
                  </div>
                </div>
              </div>
            )}

            {/* File Attachments */}
            {attachedFiles.length > 0 && (
              <div className="border-b border-gray-600 p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <FileCode className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Attached Files ({attachedFiles.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {attachedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center space-x-2 bg-muted/50 hover:bg-muted/80 rounded-lg border border-gray-600 px-3 py-2 transition-colors group"
                    >
                      <FileCode className="h-4 w-4 text-blue-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          {file.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB • {file.content.split('\n').length} lines
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setPreviewFile(file)}
                          className="p-1 rounded hover:bg-background transition-colors"
                          title="Preview file"
                        >
                          <Eye className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                        <button
                          onClick={() => {
                            setAttachedFiles(prev => prev.filter(f => f.id !== file.id))
                          }}
                          className="p-1 rounded hover:bg-background transition-colors"
                          title="Remove file"
                        >
                          <X className="h-3 w-3 text-muted-foreground hover:text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="relative h-full">
              {/* Debug: Manual Test Button */}
              <div className="absolute top-2 right-2 z-10">
                <button
                  onClick={() => {
                    console.log('🧪 Manual test: Directly triggering send_general_message action...')
                    // This will test if the action system works without CopilotTextarea
                    const testMessage = 'Manual test message';
                    // We'll trigger this via useCopilotAction directly
                    console.log('📝 Test message:', testMessage)
                  }}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  🧪 Test Action
                </button>
              </div>

              <div className="relative h-full">
                <CopilotTextarea
                  className="w-full h-full min-h-[300px] resize-none rounded-lg bg-transparent p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary border-0"
                  placeholder={isDragOver ? "" : "Ask Renata anything or drag & drop files to upload..."}
                  autosuggestionsConfig={{
                    textareaPurpose: `You are Renata, a ${RENATA_MODES.find(m => m.id === currentMode)?.name || 'Trading'} AI assistant. Help with trading analysis, scanner optimization, and market insights.`,
                    chatApiConfigs: {},
                  }}
                />

              </div>
            </div>
          </div>

          {/* Upload Instructions */}
          {!isDragOver && !isProcessingFile && attachedFiles.length === 0 && generatedScans.length === 0 && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg text-center text-sm text-muted-foreground">
              💡 <strong>Tip:</strong> Drag and drop any trading scan file (.py, .js, .ts) into the chat area above to attach it, then ask me to process it with AI!
            </div>
          )}

          {/* Attached Files Instructions */}
          {attachedFiles.length > 0 && (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center text-sm text-blue-400">
              📎 <strong>Files Ready:</strong> {attachedFiles.length} file{attachedFiles.length !== 1 ? 's' : ''} attached. Ask me to format, analyze, or optimize them using AI!
            </div>
          )}
        </div>

      </div>


      {/* Loading Indicator */}
      {isGenerating && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-400" />
            <span className="text-white">Generating AI scan...</span>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-gray-600 rounded-lg max-w-4xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-600">
              <div className="flex items-center space-x-2">
                <FileCode className="h-5 w-5 text-blue-400" />
                <div>
                  <h3 className="font-semibold text-foreground">{previewFile.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {(previewFile.size / 1024).toFixed(1)} KB • {previewFile.content.split('\n').length} lines • {previewFile.type}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(previewFile.content);
                    // Could add a toast notification here
                  }}
                  className="px-3 py-1 text-sm bg-muted hover:bg-muted/80 rounded transition-colors"
                  title="Copy to clipboard"
                >
                  Copy
                </button>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-2 hover:bg-muted rounded transition-colors"
                  title="Close preview"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-auto">
                <pre className="p-4 text-sm leading-relaxed text-foreground font-mono whitespace-pre-wrap">
                  {previewFile.content}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-600 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>Uploaded: {new Date(previewFile.uploadedAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      // Add the file content to the chat for processing
                      const copilotTextarea = document.querySelector('[data-copilot-textarea]') as HTMLElement;
                      if (copilotTextarea) {
                        const message = `Please format and optimize this ${previewFile.name} file using the format_existing_scan_code action.`;
                        if (copilotTextarea.tagName.toLowerCase() === 'textarea') {
                          (copilotTextarea as HTMLTextAreaElement).value = message;
                        } else {
                          copilotTextarea.textContent = message;
                          const inputEvent = new Event('input', { bubbles: true });
                          copilotTextarea.dispatchEvent(inputEvent);
                          copilotTextarea.focus();
                        }
                      }
                      setPreviewFile(null);
                    }}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-sm transition-colors"
                  >
                    Process with AI
                  </button>
                  <button
                    onClick={() => setPreviewFile(null)}
                    className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded text-sm transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}