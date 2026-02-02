/**
 * PydanticAI Trading Agent Service Integration
 * Connects EdgeDev frontend to the PydanticAI backend for enhanced trading workflows
 */

const PYDANTIC_AI_BASE_URL = 'http://localhost:8001';

export interface PydanticAIAgentRequest {
  type: 'scan_creation' | 'backtest_generation' | 'parameter_optimization' | 'pattern_analysis';
  data: Record<string, any>;
  user_id?: string;
  request_id?: string;
}

export interface PydanticAIAgentResponse {
  success: boolean;
  message: string;
  data: Record<string, any>;
  agent_type: string;
  execution_time?: number;
  timestamp: string;
}

export interface ScanCreationRequest {
  description: string;
  market_conditions: 'bullish' | 'bearish' | 'sideways' | 'volatile' | 'unknown';
  preferences: Record<string, any>;
  existing_scanners: Array<Record<string, any>>;
  timeframe: string;
  volume_threshold: number;
}

export interface BacktestRequest {
  strategy_name: string;
  strategy_description: string;
  scan_parameters: Record<string, any>;
  timeframe: string;
  market_conditions: string;
  risk_parameters: Record<string, any>;
}

export interface ParameterOptimizationRequest {
  scan_id: string;
  current_parameters: Record<string, any>;
  performance_metrics: Record<string, number>;
  optimization_goals: string[];
  historical_data?: Record<string, any>;
  constraints: Record<string, any>;
}

export interface CodeFormattingRequest {
  source_code: string;
  format_type?: 'scan_optimization' | 'general_cleanup' | 'performance_boost';
  preserve_logic?: boolean;
  add_documentation?: boolean;
  optimize_performance?: boolean;
  current_issues?: string[];
}

class PydanticAIService {
  private baseUrl: string;
  private websocket: WebSocket | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  constructor(baseUrl: string = PYDANTIC_AI_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if PydanticAI service is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const data = await response.json();
      return data.status === 'healthy';
    } catch (error) {
      console.error('❌ PydanticAI health check failed:', error);
      return false;
    }
  }

  /**
   * Get status of all AI agents
   */
  async getAgentStatus(): Promise<Record<string, any> | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/agent/status`);
      return await response.json();
    } catch (error) {
      console.error('❌ Error getting agent status:', error);
      return null;
    }
  }

  /**
   * Create a new scan using AI assistance
   */
  async createScan(request: ScanCreationRequest): Promise<PydanticAIAgentResponse> {
    try {
      console.log('  Creating AI-assisted scan:', request.description);

      const response = await fetch(`${this.baseUrl}/api/agent/scan/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Scan creation failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('  Scan created successfully:', result);
      return result;

    } catch (error) {
      console.error('❌ Scan creation error:', error);
      throw error;
    }
  }

  /**
   * Generate a backtest configuration
   */
  async generateBacktest(request: BacktestRequest): Promise<PydanticAIAgentResponse> {
    try {
      console.log('📊 Generating backtest for strategy:', request.strategy_name);

      const response = await fetch(`${this.baseUrl}/api/agent/backtest/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Backtest generation failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('  Backtest generated successfully:', result);
      return result;

    } catch (error) {
      console.error('❌ Backtest generation error:', error);
      throw error;
    }
  }

  /**
   * Optimize scan parameters
   */
  async optimizeParameters(request: ParameterOptimizationRequest): Promise<PydanticAIAgentResponse> {
    try {
      console.log('⚙️ Optimizing parameters for scan:', request.scan_id);

      const response = await fetch(`${this.baseUrl}/api/agent/parameters/optimize`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Parameter optimization failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('  Parameters optimized successfully:', result);
      return result;

    } catch (error) {
      console.error('❌ Parameter optimization error:', error);
      throw error;
    }
  }

  /**
   * Analyze market patterns
   */
  async analyzePatterns(
    timeframe: string = '1D',
    marketConditions: string = 'unknown',
    volumeThreshold: number = 1000000
  ): Promise<PydanticAIAgentResponse> {
    try {
      console.log('📈 Analyzing market patterns');

      const params = new URLSearchParams({
        timeframe,
        market_conditions: marketConditions,
        volume_threshold: volumeThreshold.toString()
      });

      const response = await fetch(`${this.baseUrl}/api/agent/patterns/analyze?${params}`);

      if (!response.ok) {
        throw new Error(`Pattern analysis failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('  Pattern analysis completed:', result);
      return result;

    } catch (error) {
      console.error('❌ Pattern analysis error:', error);
      throw error;
    }
  }

  /**
   * Connect to WebSocket for real-time agent communication
   */
  async connectWebSocket(onMessage?: (data: any) => void): Promise<void> {
    try {
      const wsUrl = `ws://localhost:8001/ws/agent`;
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        console.log('🔌 Connected to PydanticAI WebSocket');
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', data);

          // Call the general message handler
          if (onMessage) {
            onMessage(data);
          }

          // Call specific message handlers
          const handler = this.messageHandlers.get(data.type);
          if (handler) {
            handler(data);
          }

        } catch (error) {
          console.error('❌ WebSocket message parsing error:', error);
        }
      };

      this.websocket.onclose = () => {
        console.log('🔌 PydanticAI WebSocket disconnected');
        this.websocket = null;
      };

      this.websocket.onerror = (error) => {
        console.error('❌ PydanticAI WebSocket error:', error);
      };

    } catch (error) {
      console.error('❌ WebSocket connection error:', error);
      throw error;
    }
  }

  /**
   * Send a message via WebSocket
   */
  async sendWebSocketMessage(message: PydanticAIAgentRequest): Promise<void> {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    this.websocket.send(JSON.stringify({
      ...message,
      timestamp: new Date().toISOString()
    }));
  }

  /**
   * Register a handler for specific WebSocket message types
   */
  registerMessageHandler(messageType: string, handler: (data: any) => void): void {
    this.messageHandlers.set(messageType, handler);
  }

  /**
   * Disconnect WebSocket
   */
  disconnectWebSocket(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  /**
   * Enhanced scan creation with natural language processing
   */
  async createScanFromDescription(
    description: string,
    options: {
      marketConditions?: string;
      timeframe?: string;
      volumeThreshold?: number;
      existingScanners?: any[];
      preferences?: Record<string, any>;
    } = {}
  ): Promise<{
    scanCode: string;
    parameters: Record<string, any>;
    explanation: string;
    confidence: number;
    suggestions: string[];
  }> {
    try {
      const request: ScanCreationRequest = {
        description,
        market_conditions: (options.marketConditions as any) || 'unknown',
        timeframe: options.timeframe || '1D',
        volume_threshold: options.volumeThreshold || 1000000,
        existing_scanners: options.existingScanners || [],
        preferences: options.preferences || {}
      };

      const response = await this.createScan(request);

      if (!response.success) {
        throw new Error(response.message);
      }

      return {
        scanCode: response.data.scan_code,
        parameters: response.data.parameters,
        explanation: response.data.explanation,
        confidence: response.data.confidence_score,
        suggestions: response.data.suggested_improvements || []
      };

    } catch (error) {
      console.error('❌ Enhanced scan creation error:', error);
      throw error;
    }
  }

  /**
   * Create a backtest from strategy description
   */
  async createBacktestFromStrategy(
    strategyName: string,
    strategyDescription: string,
    scanParameters: Record<string, any>,
    options: {
      timeframe?: string;
      marketConditions?: string;
      riskParameters?: Record<string, any>;
    } = {}
  ): Promise<{
    configuration: Record<string, any>;
    entryRules: string[];
    exitRules: string[];
    riskManagement: Record<string, any>;
    expectedPerformance: Record<string, any>;
    codeTemplate: string;
  }> {
    try {
      const request: BacktestRequest = {
        strategy_name: strategyName,
        strategy_description: strategyDescription,
        scan_parameters: scanParameters,
        timeframe: options.timeframe || '1D',
        market_conditions: options.marketConditions || 'unknown',
        risk_parameters: options.riskParameters || {}
      };

      const response = await this.generateBacktest(request);

      if (!response.success) {
        throw new Error(response.message);
      }

      return {
        configuration: response.data.strategy_config,
        entryRules: response.data.entry_rules,
        exitRules: response.data.exit_rules,
        riskManagement: response.data.risk_management,
        expectedPerformance: response.data.expected_performance,
        codeTemplate: response.data.code_template
      };

    } catch (error) {
      console.error('❌ Backtest creation error:', error);
      throw error;
    }
  }

  /**
   * Get AI-powered suggestions for improving existing scans
   */
  async getScanOptimizationSuggestions(
    scanId: string,
    currentParameters: Record<string, any>,
    performanceMetrics: Record<string, number>,
    goals: string[] = ['total_return', 'sharpe_ratio']
  ): Promise<{
    optimizedParameters: Record<string, any>;
    expectedImprovement: Record<string, number>;
    rationale: string;
    confidence: number;
    alternatives: Array<Record<string, any>>;
  }> {
    try {
      const request: ParameterOptimizationRequest = {
        scan_id: scanId,
        current_parameters: currentParameters,
        performance_metrics: performanceMetrics,
        optimization_goals: goals,
        constraints: {}
      };

      const response = await this.optimizeParameters(request);

      if (!response.success) {
        throw new Error(response.message);
      }

      return {
        optimizedParameters: response.data.optimized_parameters,
        expectedImprovement: response.data.expected_improvement,
        rationale: response.data.optimization_rationale,
        confidence: response.data.confidence_score,
        alternatives: response.data.alternative_configurations || []
      };

    } catch (error) {
      console.error('❌ Scan optimization error:', error);
      throw error;
    }
  }

  /**
   * Format and optimize existing scan code using AI assistance
   */
  async formatScanCode(
    sourceCode: string,
    options: {
      formatType?: 'scan_optimization' | 'general_cleanup' | 'performance_boost';
      preserveLogic?: boolean;
      addDocumentation?: boolean;
      optimizePerformance?: boolean;
      currentIssues?: string[];
    } = {}
  ): Promise<{
    formattedCode: string;
    originalMetrics: Record<string, any>;
    improvementMetrics: Record<string, any>;
    aiInsights: string[];
    optimizationSuggestions: Array<Record<string, any>>;
    codeQualityScore: number;
    estimatedImprovement: string;
    enhancementsApplied: string[];
  }> {
    try {
      const request: CodeFormattingRequest = {
        source_code: sourceCode,
        format_type: options.formatType || 'scan_optimization',
        preserve_logic: options.preserveLogic !== false,
        add_documentation: options.addDocumentation !== false,
        optimize_performance: options.optimizePerformance !== false,
        current_issues: options.currentIssues || []
      };

      console.log('🔧 Formatting scan code via PydanticAI service');

      const response = await fetch(`${this.baseUrl}/api/agent/scan/format`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Code formatting failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      console.log('  Code formatting completed successfully:', result.data.code_quality_score);

      return {
        formattedCode: result.data.formatted_code,
        originalMetrics: result.data.original_metrics,
        improvementMetrics: result.data.improvement_metrics,
        aiInsights: result.data.ai_insights,
        optimizationSuggestions: result.data.optimization_suggestions,
        codeQualityScore: result.data.code_quality_score,
        estimatedImprovement: result.data.estimated_improvement,
        enhancementsApplied: result.data.enhancements_applied
      };

    } catch (error) {
      console.error('❌ Code formatting error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const pydanticAIService = new PydanticAIService();
export default pydanticAIService;