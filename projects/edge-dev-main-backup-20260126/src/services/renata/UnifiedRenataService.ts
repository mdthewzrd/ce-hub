/**
 * 🤖 Unified Renata Service
 *
 * Consolidates all Renata AI capabilities into a single, production-ready service.
 * Integrates with CopilotKit for AG-UI protocol compliance.
 *
 * Capabilities:
 * - Code analysis and conversion to v31 standard
 * - Scanner generation from natural language
 * - Execution coordination with backend
 * - Results analysis and optimization
 * - Project management
 * - Learning from execution (Archon integration ready)
 */

import { edgeDevAPI, type v31Scanner, type ExecutionConfig, type ExecutionResult, type ExecutionStatus } from '../edgeDevApi';
import { fastApiScanService } from '../fastApiScanService';

// ============= Types =============

export interface CodeAnalysis {
  structure: {
    type: 'function' | 'class' | 'module';
    name?: string;
    functions: string[];
    imports: string[];
    patterns: string[];
  };
  quality: {
    score: number; // 0-100
    issues: string[];
  };
  v31Compliance: boolean;
  requiredChanges: string[];
  conversionPath: 'direct' | 'refactor' | 'rewrite';
  detectedPatterns: string[];
  suggestedImprovements: string[];
}

export interface ScannerPlan {
  objective: string;
  approach: string;
  parameters: Record<string, any>;
  template: string;
  estimatedComplexity: 'simple' | 'medium' | 'complex';
  similarScanners?: any[];
  steps: string[];
}

export interface BuildResult {
  scanner: v31Scanner;
  isValid: boolean;
  validationErrors: string[];
  warnings: string[];
}

export interface ResultAnalysis {
  summary: string;
  metrics: {
    totalFound: number;
    executionTime: number;
    averageScore: number;
    topPerformers: string[];
  };
  insights: string[];
  optimizations: string[];
  recommendations: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  scanners: v31Scanner[];
  createdAt: string;
  updatedAt: string;
}

// ============= Main Service Class =============

export class UnifiedRenataService {
  private backendUrl = 'http://localhost:5666';
  private openRouterKey = process.env.OPENROUTER_API_KEY || '';
  private model = 'deepseek/deepseek-coder'; // Using DeepSeek Coder for code

  // ============= Workflow Management =============

  /**
   * Plan scanner creation from user intent
   * Uses AI to understand requirements and create step-by-step plan
   */
  async planScannerCreation(userIntent: string): Promise<ScannerPlan> {
    console.log('🎯 Planning scanner creation:', userIntent);

    const systemPrompt = `You are Renata, an expert trading strategy assistant for Edge Dev platform.
Your role is to understand user requirements and create detailed plans for scanner development.

Analyze the user's intent and provide:
1. Clear objective (what the scanner should find)
2. Technical approach (which patterns to detect)
3. Required parameters (with defaults)
4. Best template to use (lc_d2, backside_b, a_plus, etc.)
5. Complexity estimation
6. Step-by-step implementation plan

Keep responses concise and actionable.`;

    const userPrompt = `User wants to create a scanner with this goal: "${userIntent}"

Analyze this request and create a detailed implementation plan in JSON format:
{
  "objective": "Clear description",
  "approach": "Technical approach",
  "parameters": { "param1": "value1", "param2": "value2" },
  "template": "lc_d2 | backside_b | a_plus | custom",
  "estimatedComplexity": "simple | medium | complex",
  "steps": ["step1", "step2", "step3"]
}`;

    try {
      const response = await this.callAI(systemPrompt, userPrompt);
      const plan = JSON.parse(response);

      return {
        ...plan,
        similarScanners: [] // TODO: Integrate Archon RAG search here
      };
    } catch (error) {
      console.error('Planning failed:', error);
      throw new Error('Failed to create scanner plan. Please try rephrasing your request.');
    }
  }

  /**
   * Coordinate scanner build from plan
   * Manages the multi-step process of creating a v31 scanner
   */
  async coordinateScannerBuild(plan: ScannerPlan): Promise<BuildResult> {
    console.log('🔧 Building scanner from plan:', plan.objective);

    try {
      // Step 1: Generate scanner code
      const code = await this.generateScannerCode(plan);

      // Step 2: Parse into v31 scanner object
      const scanner = await this.parseScannerCode(code, plan);

      // Step 3: Validate v31 compliance
      const validation = await edgeDevAPI.validateV31Scanner(scanner);

      return {
        scanner,
        isValid: validation.isValid,
        validationErrors: validation.errors,
        warnings: validation.warnings
      };
    } catch (error) {
      console.error('Scanner build failed:', error);
      throw error;
    }
  }

  // ============= Code Operations =============

  /**
   * Analyze existing Python code
   * Extracts structure, patterns, and v31 compliance status
   */
  async analyzeExistingCode(code: string): Promise<CodeAnalysis> {
    console.log('🔍 Analyzing code...');

    try {
      // Backend code analysis (if backend API available)
      const backendAnalysis = await this.analyzeCodeBackend(code);

      // AI-powered analysis for deeper insights
      const aiAnalysis = await this.analyzeCodeAI(code);

      return {
        structure: {
          type: backendAnalysis.structure.type,
          name: backendAnalysis.structure.name,
          functions: backendAnalysis.structure.functions,
          imports: backendAnalysis.structure.imports,
          patterns: aiAnalysis.patterns || []
        },
        quality: {
          score: aiAnalysis.qualityScore || 75,
          issues: aiAnalysis.issues || []
        },
        v31Compliance: backendAnalysis.v31Compliance,
        requiredChanges: [
          ...backendAnalysis.requiredChanges,
          ...(aiAnalysis.suggestedChanges || [])
        ],
        conversionPath: this.determineConversionPath(backendAnalysis, aiAnalysis),
        detectedPatterns: aiAnalysis.patterns || [],
        suggestedImprovements: aiAnalysis.improvements || []
      };
    } catch (error) {
      console.error('Code analysis failed:', error);
      throw new Error('Failed to analyze code. Please ensure it\'s valid Python code.');
    }
  }

  /**
   * Convert existing code to v31 standard
   */
  async convertToV31(code: string, format: string = 'auto'): Promise<v31Scanner> {
    console.log('🔄 Converting code to v31 standard...');

    try {
      // First analyze the code
      const analysis = await this.analyzeExistingCode(code);

      // Use AI to convert based on analysis
      const systemPrompt = `You are an expert Python developer specializing in the Edge Dev v31 scanner standard.

Your task is to convert existing trading scanner code to the v31 standard.

The v31 standard requires 5 methods:
1. fetch_grouped_data(data, start_date, end_date) - Fetch market data
2. apply_smart_filters(data, filters) - Reduce dataset by 99%
3. detect_patterns(filtered_data, parameters) - Find trading patterns
4. format_results(results) - Format output
5. run_scan(start_date, end_date, filters) - Orchestrate the pipeline

IMPORTANT:
- Preserve the original scanning logic and parameters
- Add smart filtering (price > $5, volume > 1M, etc.)
- Ensure all 5 methods are implemented
- Return ONLY valid Python code, no explanations
- Use type hints where appropriate`;

      const userPrompt = `Convert this scanner code to v31 standard:

ORIGINAL CODE:
\`\`\`python
${code}
\`\`\`

ANALYSIS:
- Structure: ${analysis.structure.type}
- Current compliance: ${analysis.v31Compliance ? 'YES' : 'NO'}
- Conversion path: ${analysis.conversionPath}
- Detected patterns: ${analysis.detectedPatterns.join(', ') || 'none'}

Provide the complete v31-compliant scanner code in JSON format:
{
  "name": "Scanner Name",
  "description": "Description",
  "fetch_grouped_data": "def fetch_grouped_data...",
  "apply_smart_filters": "def apply_smart_filters...",
  "detect_patterns": "def detect_patterns...",
  "format_results": "def format_results...",
  "run_scan": "def run_scan...",
  "parameters": {}
}`;

      const response = await this.callAI(systemPrompt, userPrompt, 0.2);
      const scanner = JSON.parse(response);

      // Validate the converted scanner
      const validation = await edgeDevAPI.validateV31Scanner(scanner);

      if (!validation.isValid) {
        throw new Error(`Conversion validation failed: ${validation.errors.join(', ')}`);
      }

      return scanner;
    } catch (error) {
      console.error('Code conversion failed:', error);
      throw error;
    }
  }

  /**
   * Generate scanner from natural language description
   */
  async generateScanner(specification: {
    objective: string;
    parameters?: Record<string, any>;
    template?: string;
  }): Promise<v31Scanner> {
    console.log('✨ Generating scanner from specification:', specification.objective);

    const systemPrompt = `You are Renata, an expert trading strategy developer for Edge Dev platform.

Your task is to generate complete v31-standard scanner code from natural language descriptions.

The v31 standard has 5 required methods:
1. fetch_grouped_data(data, start_date, end_date) - Fetch market data from Polygon API
2. apply_smart_filters(data, filters) - Filter by price > $5, volume > 1M
3. detect_patterns(filtered_data, parameters) - Detect trading patterns
4. format_results(results) - Format to list of ticker dictionaries
5. run_scan(start_date, end_date, filters) - Orchestrate pipeline

IMPORTANT RULES:
- Always use all 5 methods
- Include smart filtering
- Use type hints
- Add docstrings
- Return executable Python code
- NO explanations outside code blocks`;

    const userPrompt = `Generate a v31 scanner for: "${specification.objective}"

${specification.parameters ? `Parameters: ${JSON.stringify(specification.parameters, null, 2)}` : ''}
${specification.template ? `Template reference: ${specification.template}` : ''}

Provide the complete scanner in JSON format:
{
  "name": "Scanner Name",
  "description": "Description",
  "fetch_grouped_data": "complete function code",
  "apply_smart_filters": "complete function code",
  "detect_patterns": "complete function code",
  "format_results": "complete function code",
  "run_scan": "complete function code",
  "parameters": { ... }
}`;

    try {
      const response = await this.callAI(systemPrompt, userPrompt, 0.3);
      const scanner = JSON.parse(response);

      // Validate generated scanner
      const validation = await edgeDevAPI.validateV31Scanner(scanner);

      if (!validation.isValid) {
        console.warn('Generated scanner has warnings:', validation.warnings);
      }

      return scanner;
    } catch (error) {
      console.error('Scanner generation failed:', error);
      throw new Error('Failed to generate scanner. Please try being more specific about your requirements.');
    }
  }

  // ============= Execution Management =============

  /**
   * Execute scanner with real-time progress tracking
   */
  async executeScanner(
    scanner: v31Scanner,
    config: ExecutionConfig,
    onProgress?: (progress: number, message: string, stage: string) => void
  ): Promise<ExecutionStatus> {
    console.log('⚡ Executing scanner:', scanner.name);

    try {
      // Validate scanner first
      const validation = await edgeDevAPI.validateV31Scanner(scanner);
      if (!validation.isValid) {
        throw new Error(`Invalid scanner: ${validation.errors.join(', ')}`);
      }

      // Execute via unified API
      const result = await edgeDevAPI.executeScanner(scanner, config);

      // Wait for completion with progress updates
      const status = await edgeDevAPI.waitForCompletion(
        result.executionId,
        onProgress
      );

      return status;
    } catch (error) {
      console.error('Scanner execution failed:', error);
      throw error;
    }
  }

  /**
   * Monitor execution status
   */
  async monitorExecution(executionId: string): Promise<ExecutionStatus> {
    return await edgeDevAPI.getExecutionStatus(executionId);
  }

  // ============= Results Analysis =============

  /**
   * Analyze scan results with AI
   */
  async analyzeResults(results: any[], scanner: v31Scanner): Promise<ResultAnalysis> {
    console.log('📊 Analyzing results...');

    const systemPrompt = `You are Renata, an expert trading strategy analyst.

Your task is to analyze scanner execution results and provide actionable insights.

Provide analysis in JSON format:
{
  "summary": "Brief overview",
  "metrics": {
    "totalFound": number,
    "averageScore": number,
    "topPerformers": ["TICKER1", "TICKER2"]
  },
  "insights": ["insight1", "insight2"],
  "optimizations": ["optimization1", "optimization2"],
  "recommendations": ["recommendation1", "recommendation2"]
}`;

    const userPrompt = `Analyze these scan results:

SCANNER: ${scanner.name}
OBJECTIVE: ${scanner.description}

RESULTS (${results.length} found):
${JSON.stringify(results.slice(0, 10), null, 2)}${results.length > 10 ? '\n... (first 10 shown)' : ''}

Provide comprehensive analysis including:
1. What these results tell us about the scanner
2. Potential optimizations
3. Whether the scanner is working as intended
4. Suggestions for improvement`;

    try {
      const response = await this.callAI(systemPrompt, userPrompt, 0.5);
      const analysis = JSON.parse(response);

      return {
        ...analysis,
        metrics: {
          ...analysis.metrics,
          totalFound: results.length,
          executionTime: 0 // TODO: Get from execution status
        }
      };
    } catch (error) {
      console.error('Results analysis failed:', error);
      return {
        summary: `Found ${results.length} results`,
        metrics: {
          totalFound: results.length,
          executionTime: 0,
          averageScore: 0,
          topPerformers: []
        },
        insights: [],
        optimizations: [],
        recommendations: []
      };
    }
  }

  /**
   * Optimize scanner parameters based on results
   */
  async optimizeParameters(
    scanner: v31Scanner,
    results: any[]
  ): Promise<Record<string, any>> {
    console.log('🔧 Optimizing parameters...');

    const systemPrompt = `You are Renata, a trading strategy optimization expert.

Analyze scanner results and suggest parameter optimizations.

Return JSON:
{
  "parameter1": "suggested_value",
  "parameter2": "suggested_value"
}`;

    const userPrompt = `Current scanner: ${scanner.name}
Current parameters: ${JSON.stringify(scanner.parameters, null, 2)}

Results: ${results.length} found

Suggest optimized parameters to:
1. Improve result quality
2. Reduce false positives
3. Better filter for the intended patterns`;

    try {
      const response = await this.callAI(systemPrompt, userPrompt, 0.4);
      return JSON.parse(response);
    } catch (error) {
      console.error('Parameter optimization failed:', error);
      return scanner.parameters || {};
    }
  }

  // ============= Project Management =============

  /**
   * Add scanner to project
   */
  async addToProject(scanner: v31Scanner, projectId: string): Promise<void> {
    console.log('📁 Adding scanner to project:', projectId);

    // TODO: Implement project storage (Archon or local)
    console.log('Scanner added to project (implementation pending)');
  }

  /**
   * Create new project
   */
  async createProject(name: string, description: string): Promise<Project> {
    const project: Project = {
      id: `project_${Date.now()}`,
      name,
      description,
      scanners: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // TODO: Implement project storage
    console.log('Project created (implementation pending):', project);

    return project;
  }

  // ============= Private Helper Methods =============

  private async callAI(
    systemPrompt: string,
    userPrompt: string,
    temperature: number = 0.2
  ): Promise<string> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5665',
        'X-Title': 'EdgeDev Renata AI'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`AI call failed: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async analyzeCodeBackend(code: string): Promise<any> {
    // Try backend analysis first
    try {
      return await edgeDevAPI.analyzeCode(code);
    } catch (error) {
      // Fallback to basic analysis
      return {
        structure: { type: 'module', functions: [], imports: [] },
        v31Compliance: false,
        requiredChanges: ['Implement v31 standard methods']
      };
    }
  }

  private async analyzeCodeAI(code: string): Promise<any> {
    const systemPrompt = `You are a Python code analysis expert.

Analyze trading scanner code and extract:
1. Pattern detection logic
2. Parameter usage
3. Quality issues
4. Suggested improvements

Return JSON:
{
  "patterns": ["pattern1", "pattern2"],
  "qualityScore": 85,
  "issues": ["issue1", "issue2"],
  "suggestedChanges": ["change1", "change2"],
  "improvements": ["improvement1", "improvement2"]
}`;

    const userPrompt = `Analyze this Python code:

\`\`\`python
${code.substring(0, 2000)}${code.length > 2000 ? '\n... (truncated)' : ''}
\`\`\``;

    try {
      const response = await this.callAI(systemPrompt, userPrompt, 0.3);
      return JSON.parse(response);
    } catch (error) {
      return {
        patterns: [],
        qualityScore: 50,
        issues: [],
        suggestedChanges: [],
        improvements: []
      };
    }
  }

  private async generateScannerCode(plan: ScannerPlan): Promise<string> {
    const scanner = await this.generateScanner({
      objective: plan.objective,
      parameters: plan.parameters,
      template: plan.template
    });
    return JSON.stringify(scanner);
  }

  private async parseScannerCode(code: string, plan: ScannerPlan): Promise<v31Scanner> {
    // If the AI generated JSON, parse it
    try {
      return JSON.parse(code);
    } catch {
      // Otherwise, wrap the code in a scanner object
      return {
        name: plan.objective.split(' ').slice(0, 3).join('_'),
        description: plan.objective,
        fetch_grouped_data: code, // This would need proper parsing
        apply_smart_filters: '',
        detect_patterns: '',
        format_results: '',
        run_scan: code,
        parameters: plan.parameters
      };
    }
  }

  private determineConversionPath(backend: any, ai: any): 'direct' | 'refactor' | 'rewrite' {
    if (backend.v31Compliance) return 'direct';
    if (backend.requiredChanges.length > 5) return 'rewrite';
    return 'refactor';
  }
}

// ============= Singleton Instance =============

export const unifiedRenataService = new UnifiedRenataService();
