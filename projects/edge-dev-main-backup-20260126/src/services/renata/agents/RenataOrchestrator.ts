/**
 * 🤖 Renata Orchestrator - Multi-Agent Coordinator
 *
 * Routes tasks to specialized sub-agents for code transformation and formatting
 * Uses Pydantic AI framework for structured agent communication
 */

import { CodeAnalyzerAgent } from './CodeAnalyzerAgent';
import { CodeFormatterAgent } from './CodeFormatterAgent';
import { ParameterExtractorAgent } from './ParameterExtractorAgent';
import { ValidatorAgent } from './ValidatorAgent';
import { OptimizerAgent } from './OptimizerAgent';
import { DocumentationAgent } from './DocumentationAgent';

export interface AgentTask {
  type: 'analyze' | 'format' | 'extract_parameters' | 'validate' | 'optimize' | 'document';
  code: string;
  context?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high';
}

export interface AgentResult {
  success: boolean;
  agentType: string;
  data: any;
  executionTime: number;
  timestamp: string;
  errors?: string[];
  warnings?: string[];
}

export interface OrchestratorWorkflow {
  workflowId: string;
  tasks: AgentTask[];
  results: AgentResult[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
}

/**
 * Renata Orchestrator - Main coordinator for multi-agent system
 */
export class RenataOrchestrator {
  private analyzer: CodeAnalyzerAgent;
  private formatter: CodeFormatterAgent;
  private parameterExtractor: ParameterExtractorAgent;
  private validator: ValidatorAgent;
  private optimizer: OptimizerAgent;
  private documenter: DocumentationAgent;

  constructor() {
    this.analyzer = new CodeAnalyzerAgent();
    this.formatter = new CodeFormatterAgent();
    this.parameterExtractor = new ParameterExtractorAgent();
    this.validator = new ValidatorAgent();
    this.optimizer = new OptimizerAgent();
    this.documenter = new DocumentationAgent();
  }

  /**
   * Main entry point - Process code through multi-agent pipeline
   */
  async processCodeTransformation(
    code: string,
    options: {
      transformationType?: 'v31_standard' | 'backside_b' | 'multi_pattern' | 'optimization';
      preserveParameters?: boolean;
      addDocumentation?: boolean;
      optimizePerformance?: boolean;
      validateOutput?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    transformedCode: string;
    workflow: OrchestratorWorkflow;
    summary: {
      originalLines: number;
      transformedLines: number;
      parametersPreserved: number;
      validationScore: number;
      optimizationsApplied: string[];
      agentsUsed: string[];
    };
  }> {
    const workflowId = `workflow_${Date.now()}`;
    const startTime = new Date().toISOString();

    console.log(`🎯 Starting Renata Multi-Agent Workflow: ${workflowId}`);
    console.log(`📋 Transformation type: ${options.transformationType || 'v31_standard'}`);

    const workflow: OrchestratorWorkflow = {
      workflowId,
      tasks: [],
      results: [],
      status: 'in_progress',
      startTime
    };

    try {
      // Step 1: Analyze the code
      console.log('\n📊 Step 1: Analyzing code structure...');
      const analysisResult = await this.analyzer.analyze(code);
      workflow.tasks.push({ type: 'analyze', code, priority: 'high' });
      workflow.results.push(analysisResult);

      if (!analysisResult.success) {
        throw new Error('Code analysis failed');
      }

      // Step 2: Extract parameters (if preservation requested)
      let extractedParameters: any = null;
      if (options.preserveParameters !== false) {
        console.log('\n🔧 Step 2: Extracting parameters...');
        const paramResult = await this.parameterExtractor.extract(code, analysisResult.data);
        workflow.tasks.push({ type: 'extract_parameters', code, priority: 'high' });
        workflow.results.push(paramResult);
        extractedParameters = paramResult.data.parameters;
      }

      // Step 3: Format code to target standard
      console.log('\n✨ Step 3: Formatting code...');
      const formatResult = await this.formatter.format(code, {
        transformationType: options.transformationType || 'v31_standard',
        analysis: analysisResult.data,
        parameters: extractedParameters
      });
      workflow.tasks.push({ type: 'format', code, priority: 'high' });
      workflow.results.push(formatResult);

      if (!formatResult.success) {
        throw new Error('Code formatting failed');
      }

      let transformedCode = formatResult.data.formattedCode;

      // Step 4: Optimize performance (if requested)
      if (options.optimizePerformance) {
        console.log('\n⚡ Step 4: Optimizing performance...');
        const optResult = await this.optimizer.optimize(transformedCode, {
          analysis: analysisResult.data
        });
        workflow.tasks.push({ type: 'optimize', code: transformedCode, priority: 'medium' });
        workflow.results.push(optResult);

        if (optResult.success) {
          transformedCode = optResult.data.optimizedCode;
        }
      }

      // Step 5: Add documentation (if requested)
      if (options.addDocumentation) {
        console.log('\n📝 Step 5: Adding documentation...');
        const docResult = await this.documenter.document(transformedCode, {
          analysis: analysisResult.data
        });
        workflow.tasks.push({ type: 'document', code: transformedCode, priority: 'low' });
        workflow.results.push(docResult);

        if (docResult.success) {
          transformedCode = docResult.data.documentedCode;
        }
      }

      // Step 6: Validate output (if requested)
      let validationScore = 0;
      if (options.validateOutput !== false) {
        console.log('\n✅ Step 6: Validating output...');
        const validationResult = await this.validator.validate(transformedCode, {
          standard: options.transformationType || 'v31_standard'
        });
        workflow.tasks.push({ type: 'validate', code: transformedCode, priority: 'high' });
        workflow.results.push(validationResult);

        validationScore = validationResult.data.score;
      }

      workflow.status = 'completed';
      workflow.endTime = new Date().toISOString();

      const summary = {
        originalLines: code.split('\n').length,
        transformedLines: transformedCode.split('\n').length,
        parametersPreserved: extractedParameters?.count || 0,
        validationScore,
        optimizationsApplied: this.extractOptimizations(workflow.results),
        agentsUsed: workflow.results.map(r => r.agentType)
      };

      console.log('\n✅ Multi-Agent Workflow Complete!');
      console.log(`📊 Summary:`, summary);

      return {
        success: true,
        transformedCode,
        workflow,
        summary
      };

    } catch (error) {
      workflow.status = 'failed';
      workflow.endTime = new Date().toISOString();

      console.error('❌ Multi-Agent Workflow Failed:', error);

      return {
        success: false,
        transformedCode: code, // Return original on failure
        workflow,
        summary: {
          originalLines: code.split('\n').length,
          transformedLines: code.split('\n').length,
          parametersPreserved: 0,
          validationScore: 0,
          optimizationsApplied: [],
          agentsUsed: workflow.results.map(r => r.agentType)
        }
      };
    }
  }

  /**
   * Extract optimizations applied from agent results
   */
  private extractOptimizations(results: AgentResult[]): string[] {
    const optimizations: string[] = [];

    for (const result of results) {
      if (result.data?.optimizations) {
        optimizations.push(...result.data.optimizations);
      }
      if (result.data?.enhancements) {
        optimizations.push(...result.data.enhancements);
      }
    }

    return [...new Set(optimizations)]; // Deduplicate
  }

  /**
   * Execute a single task (for granular control)
   */
  async executeTask(task: AgentTask): Promise<AgentResult> {
    console.log(`🎯 Executing task: ${task.type}`);

    switch (task.type) {
      case 'analyze':
        return await this.analyzer.analyze(task.code);

      case 'format':
        return await this.formatter.format(task.code, {
          transformationType: task.context?.transformationType || 'v31_standard',
          analysis: task.context?.analysis || {},
          parameters: task.context?.parameters
        });

      case 'extract_parameters':
        return await this.parameterExtractor.extract(task.code, task.context);

      case 'validate':
        return await this.validator.validate(task.code, task.context);

      case 'optimize':
        return await this.optimizer.optimize(task.code, task.context);

      case 'document':
        return await this.documenter.document(task.code, task.context);

      default:
        return {
          success: false,
          agentType: 'unknown',
          data: null,
          executionTime: 0,
          timestamp: new Date().toISOString(),
          errors: ['Unknown task type']
        };
    }
  }

  /**
   * Get health status of all agents
   */
  getSystemHealth(): {
    orchestrator: string;
    agents: Record<string, { status: string; lastExecution?: string }>;
  } {
    return {
      orchestrator: 'healthy',
      agents: {
        analyzer: { status: 'ready' },
        formatter: { status: 'ready' },
        parameterExtractor: { status: 'ready' },
        validator: { status: 'ready' },
        optimizer: { status: 'ready' },
        documenter: { status: 'ready' }
      }
    };
  }
}

// Export singleton instance
export const renataOrchestrator = new RenataOrchestrator();
export default renataOrchestrator;
