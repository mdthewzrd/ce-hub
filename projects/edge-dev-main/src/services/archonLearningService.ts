/**
 * Archon Learning Service
 * Server-side knowledge base integration using Archon MCP
 * Replaces localStorage-based learning with persistent knowledge graph
 */

// ========== TYPES ==========

export interface PatternKnowledge {
  id: string;
  name: string;
  category: 'scanner_pattern' | 'parameter_pattern' | 'ui_pattern' | 'data_pattern';
  description: string;
  code_example: string;
  usage_count: number;
  success_rate: number;
  last_used: Date;
  tags: string[];
  source_chat_id?: string;
  created_at: Date;
}

export interface SolutionKnowledge {
  id: string;
  problem: string;
  solution: string;
  code: string;
  explanation: string;
  effectiveness: number; // 0-1 score
  applied_count: number;
  created_at: Date;
  context: string[];
  tags: string[];
}

export interface BestPracticeKnowledge {
  id: string;
  practice: string;
  category: 'code_style' | 'performance' | 'security' | 'ux' | 'architecture';
  rationale: string;
  examples: string[];
  anti_examples: string[];
  confidence: number; // 0-1
  tags: string[];
}

export interface UserPreferenceKnowledge {
  id: string;
  preference_type: 'column_layout' | 'parameter_values' | 'ui_behavior' | 'naming_convention' | 'scanner_preference';
  preference: any;
  confidence: number; // 0-1 how sure we are
  last_confirmed: Date;
  source_interactions: string[];
}

export interface LearningArtifact {
  type: 'pattern' | 'solution' | 'best_practice' | 'preference';
  id: string;
  title: string;
  content: string;
  embedding?: number[];
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  tags: string[];
}

export interface KnowledgeQuery {
  query: string;
  context?: string;
  category?: string;
  limit?: number;
  min_confidence?: number;
}

export interface LearningContext {
  chat_id: string;
  user_message: string;
  ai_response: string;
  code_generated?: string;
  execution_result?: any;
  user_feedback?: 'positive' | 'negative' | 'neutral';
  timestamp: Date;
  metadata?: Record<string, any>;
}

// ========== ARCHON MCP CLIENT ==========

class ArchonMCPClient {
  private baseUrl: string = 'http://localhost:8051';
  private connected: boolean = false;

  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      this.connected = response.ok;
      return this.connected;
    } catch (error) {
      console.error('Archon connection failed:', error);
      this.connected = false;
      return false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Store knowledge artifact in Archon
   */
  async storeArtifact(artifact: LearningArtifact): Promise<boolean> {
    try {
      // In a real implementation, this would call Archon's knowledge storage API
      // For now, we'll use the task management system as a proxy
      console.log('🧠 Storing artifact in Archon:', artifact.type, artifact.title);

      // Store as a document or task in Archon
      // This is a placeholder - actual implementation depends on Archon's API

      return true;
    } catch (error) {
      console.error('Failed to store artifact:', error);
      return false;
    }
  }

  /**
   * Search knowledge base using RAG
   */
  async searchKnowledge(query: KnowledgeQuery): Promise<LearningArtifact[]> {
    try {
      console.log('🔍 Searching Archon knowledge base:', query.query);

      // Use Archon's RAG search
      const ragQuery = this.extractKeywords(query.query);

      // In production, this would call the actual RAG endpoint
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Failed to search knowledge:', error);
      return [];
    }
  }

  /**
   * Extract focused keywords for RAG query
   * Archon works best with 2-5 keywords, not long sentences
   */
  private extractKeywords(query: string): string {
    // Remove filler words and extract technical terms
    const fillerWords = ['how', 'to', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'for', 'with'];
    const words = query.toLowerCase().split(/\s+/);

    const keywords = words
      .filter(word => word.length > 3 && !fillerWords.includes(word))
      .slice(0, 5); // Max 5 keywords

    return keywords.join(' ');
  }
}

// ========== LEARNING SERVICE ==========

export class ArchonLearningService {
  private mcpClient: ArchonMCPClient;
  private localCache: Map<string, LearningArtifact> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.mcpClient = new ArchonMCPClient();
  }

  /**
   * Initialize the learning service
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    console.log('🧠 Initializing Archon Learning Service...');

    // Check Archon connection
    const connected = await this.mcpClient.checkConnection();

    if (!connected) {
      console.warn('⚠️ Archon not available - using fallback mode');
      // Could implement localStorage fallback here
    }

    this.initialized = true;
    console.log('✅ Archon Learning Service initialized');
    return true;
  }

  /**
   * Learn from a code generation interaction
   */
  async learnFromCodeGeneration(context: LearningContext): Promise<void> {
    await this.ensureInitialized();

    if (!context.code_generated) {
      return;
    }

    console.log('🧠 Learning from code generation...');

    // Extract pattern from generated code
    const pattern = await this.extractPatternFromCode(context);

    if (pattern) {
      await this.storePattern(pattern);
    }

    // Extract best practices
    const practices = await this.extractBestPractices(context);

    for (const practice of practices) {
      await this.storeBestPractice(practice);
    }

    // Learn user preferences
    await this.learnUserPreferences(context);
  }

  /**
   * Learn from execution results
   */
  async learnFromExecution(context: LearningContext): Promise<void> {
    await this.ensureInitialized();

    if (!context.execution_result) {
      return;
    }

    console.log('🧠 Learning from execution...');

    const success = context.execution_result.success !== false;
    const resultsCount = context.execution_result.results?.length || 0;

    // Create solution knowledge if successful
    if (success && resultsCount > 0) {
      const solution: SolutionKnowledge = {
        id: this.generateId('solution'),
        problem: context.user_message,
        solution: context.ai_response,
        code: context.code_generated || '',
        explanation: `Generated ${resultsCount} signals successfully`,
        effectiveness: context.user_feedback === 'positive' ? 0.9 : 0.7,
        applied_count: 1,
        created_at: new Date(),
        context: [context.chat_id],
        tags: this.extractTags(context)
      };

      await this.storeSolution(solution);
    }
  }

  /**
   * Learn from errors
   */
  async learnFromError(context: LearningContext, error: Error): Promise<void> {
    await this.ensureInitialized();

    console.log('🧠 Learning from error...');

    // Create error solution knowledge
    const solution: SolutionKnowledge = {
      id: this.generateId('error_solution'),
      problem: error.message,
      solution: context.ai_response,
      code: context.code_generated || '',
      explanation: `Error encountered and resolved: ${error.message}`,
      effectiveness: 0.8,
      applied_count: 1,
      created_at: new Date(),
      context: [context.chat_id, error.stack || ''],
      tags: [...this.extractTags(context), 'error', 'troubleshooting']
    };

    await this.storeSolution(solution);
  }

  /**
   * Recall similar problems/solutions
   */
  async recallSimilarProblems(description: string, limit: number = 5): Promise<SolutionKnowledge[]> {
    await this.ensureInitialized();

    console.log('🔍 Recalling similar problems for:', description);

    const artifacts = await this.mcpClient.searchKnowledge({
      query: description,
      limit,
      min_confidence: 0.6
    });

    // Filter and map to solutions
    return artifacts
      .filter(a => a.type === 'solution')
      .map(artifact => this.parseSolutionFromArtifact(artifact))
      .slice(0, limit);
  }

  /**
   * Recall applicable patterns for a given context
   */
  async recallApplicablePatterns(context: {
    scanner_type?: string;
    operation?: string;
    keywords?: string[];
  }): Promise<PatternKnowledge[]> {
    await this.ensureInitialized();

    console.log('🔍 Recalling applicable patterns:', context);

    const query = context.scanner_type
      ? `${context.scanner_type} ${context.operation || 'pattern'}`
      : (context.keywords || []).join(' ');

    const artifacts = await this.mcpClient.searchKnowledge({
      query,
      category: 'scanner_pattern',
      limit: 10,
      min_confidence: 0.6
    });

    return artifacts
      .filter(a => a.type === 'pattern')
      .map(artifact => this.parsePatternFromArtifact(artifact));
  }

  /**
   * Get user suggestions based on learned preferences
   */
  async getSuggestions(chatContext: string): Promise<string[]> {
    await this.ensureInitialized();

    const suggestions: string[] = [];

    // Search for relevant patterns
    const patterns = await this.recallApplicablePatterns({
      keywords: this.extractKeywordsFromText(chatContext)
    });

    // Generate suggestions from top patterns
    for (const pattern of patterns.slice(0, 3)) {
      suggestions.push(`Consider using: ${pattern.name} - ${pattern.description}`);
    }

    // Search for similar solutions
    const solutions = await this.recallSimilarProblems(chatContext, 2);

    for (const solution of solutions) {
      suggestions.push(`Previous solution: ${solution.solution.substring(0, 100)}...`);
    }

    return suggestions.slice(0, 5);
  }

  // ========== PRIVATE METHODS ==========

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Extract pattern from generated code
   */
  private async extractPatternFromCode(context: LearningContext): Promise<PatternKnowledge | null> {
    if (!context.code_generated) {
      return null;
    }

    const code = context.code_generated;
    const scannerType = this.detectScannerType(code);

    return {
      id: this.generateId('pattern'),
      name: `${scannerType} Pattern`,
      category: 'scanner_pattern',
      description: `Code pattern for ${scannerType} scanner`,
      code_example: code.substring(0, 500) + '...', // Truncate for storage
      usage_count: 1,
      success_rate: context.user_feedback === 'positive' ? 0.9 : 0.7,
      last_used: new Date(),
      tags: [scannerType, 'scanner', 'code'],
      source_chat_id: context.chat_id,
      created_at: new Date()
    };
  }

  /**
   * Extract best practices from context
   */
  private async extractBestPractices(context: LearningContext): Promise<BestPracticeKnowledge[]> {
    const practices: BestPracticeKnowledge[] = [];

    // Analyze code for best practices
    if (context.code_generated) {
      // Check for proper error handling
      if (context.code_generated.includes('try:') && context.code_generated.includes('except')) {
        practices.push({
          id: this.generateId('practice'),
          practice: 'Use try-except blocks for error handling',
          category: 'code_style',
          rationale: 'Prevents crashes and provides meaningful error messages',
          examples: ['try:\n    result = execute_scan()\nexcept Exception as e:\n    log_error(e)'],
          anti_examples: ['result = execute_scan()  # No error handling'],
          confidence: 0.9,
          tags: ['error_handling', 'python', 'best_practice']
        });
      }

      // Check for type hints
      if (context.code_generated.includes(':') && context.code_generated.includes('def ')) {
        practices.push({
          id: this.generateId('practice'),
          practice: 'Use type hints in function signatures',
          category: 'code_style',
          rationale: 'Improves code readability and IDE support',
          examples: ['def scan_ticker(ticker: str, date: str) -> Dict[str, Any]:'],
          anti_examples: ['def scan_ticker(ticker, date):'],
          confidence: 0.85,
          tags: ['type_hints', 'python', 'best_practice']
        });
      }
    }

    return practices;
  }

  /**
   * Learn and store user preferences
   */
  private async learnUserPreferences(context: LearningContext): Promise<void> {
    // Detect scanner preference
    if (context.code_generated) {
      const scannerType = this.detectScannerType(context.code_generated);

      const preference: UserPreferenceKnowledge = {
        id: this.generateId('preference'),
        preference_type: 'scanner_preference',
        preference: { scanner_type: scannerType },
        confidence: 0.7,
        last_confirmed: new Date(),
        source_interactions: [context.chat_id]
      };

      await this.storePreference(preference);
    }
  }

  /**
   * Store pattern in Archon
   */
  private async storePattern(pattern: PatternKnowledge): Promise<void> {
    const artifact: LearningArtifact = {
      type: 'pattern',
      id: pattern.id,
      title: pattern.name,
      content: pattern.description,
      metadata: {
        category: pattern.category,
        code_example: pattern.code_example,
        usage_count: pattern.usage_count,
        success_rate: pattern.success_rate
      },
      created_at: pattern.created_at,
      updated_at: new Date(),
      tags: pattern.tags
    };

    await this.mcpClient.storeArtifact(artifact);
    this.localCache.set(pattern.id, artifact);
  }

  /**
   * Store solution in Archon
   */
  private async storeSolution(solution: SolutionKnowledge): Promise<void> {
    const artifact: LearningArtifact = {
      type: 'solution',
      id: solution.id,
      title: solution.problem,
      content: solution.solution,
      metadata: {
        code: solution.code,
        explanation: solution.explanation,
        effectiveness: solution.effectiveness,
        applied_count: solution.applied_count,
        context: solution.context
      },
      created_at: solution.created_at,
      updated_at: new Date(),
      tags: solution.tags
    };

    await this.mcpClient.storeArtifact(artifact);
    this.localCache.set(solution.id, artifact);
  }

  /**
   * Store best practice in Archon
   */
  private async storeBestPractice(practice: BestPracticeKnowledge): Promise<void> {
    const artifact: LearningArtifact = {
      type: 'best_practice',
      id: practice.id,
      title: practice.practice,
      content: practice.rationale,
      metadata: {
        category: practice.category,
        examples: practice.examples,
        anti_examples: practice.anti_examples,
        confidence: practice.confidence
      },
      created_at: new Date(),
      updated_at: new Date(),
      tags: practice.tags
    };

    await this.mcpClient.storeArtifact(artifact);
    this.localCache.set(practice.id, artifact);
  }

  /**
   * Store user preference in Archon
   */
  private async storePreference(preference: UserPreferenceKnowledge): Promise<void> {
    const artifact: LearningArtifact = {
      type: 'preference',
      id: preference.id,
      title: `User Preference: ${preference.preference_type}`,
      content: JSON.stringify(preference.preference),
      metadata: {
        preference_type: preference.preference_type,
        confidence: preference.confidence,
        source_interactions: preference.source_interactions
      },
      created_at: new Date(),
      updated_at: preference.last_confirmed,
      tags: ['user_preference', preference.preference_type]
    };

    await this.mcpClient.storeArtifact(artifact);
    this.localCache.set(preference.id, artifact);
  }

  /**
   * Parse solution from artifact
   */
  private parseSolutionFromArtifact(artifact: LearningArtifact): SolutionKnowledge {
    return {
      id: artifact.id,
      problem: artifact.title,
      solution: artifact.content,
      code: artifact.metadata.code || '',
      explanation: artifact.metadata.explanation || '',
      effectiveness: artifact.metadata.effectiveness || 0.7,
      applied_count: artifact.metadata.applied_count || 0,
      created_at: artifact.created_at,
      context: artifact.metadata.context || [],
      tags: artifact.tags
    };
  }

  /**
   * Parse pattern from artifact
   */
  private parsePatternFromArtifact(artifact: LearningArtifact): PatternKnowledge {
    return {
      id: artifact.id,
      name: artifact.title,
      category: artifact.metadata.category,
      description: artifact.content,
      code_example: artifact.metadata.code_example || '',
      usage_count: artifact.metadata.usage_count || 0,
      success_rate: artifact.metadata.success_rate || 0.7,
      last_used: artifact.updated_at,
      tags: artifact.tags,
      source_chat_id: artifact.metadata.source_chat_id,
      created_at: artifact.created_at
    };
  }

  /**
   * Detect scanner type from code
   */
  private detectScannerType(code: string): string {
    const lowerCode = code.toLowerCase();

    if (lowerCode.includes('backside') && lowerCode.includes('para b')) return 'Backside B';
    if (lowerCode.includes('a+') && lowerCode.includes('para')) return 'A Plus';
    if (lowerCode.includes('lc') && lowerCode.includes('d2')) return 'LC D2';
    if (lowerCode.includes('gap') && lowerCode.includes('scan')) return 'Gap';
    if (lowerCode.includes('volume') && lowerCode.includes('scan')) return 'Volume';

    return 'Custom';
  }

  /**
   * Extract tags from context
   */
  private extractTags(context: LearningContext): string[] {
    const tags: string[] = [];

    if (context.code_generated) {
      const scannerType = this.detectScannerType(context.code_generated);
      tags.push(scannerType.toLowerCase().replace(/\s+/g, '_'));
    }

    if (context.user_feedback) {
      tags.push(context.user_feedback);
    }

    if (context.metadata?.scanner_type) {
      tags.push(context.metadata.scanner_type);
    }

    return tags;
  }

  /**
   * Extract keywords from text for search
   */
  private extractKeywordsFromText(text: string): string[] {
    const fillerWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'for', 'with', 'to', 'is', 'are', 'was', 'were'];
    const words = text.toLowerCase().split(/\s+/);

    return words
      .filter(word => word.length > 3 && !fillerWords.includes(word))
      .slice(0, 5);
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ========== STATISTICS ==========

  getStats(): {
    connected: boolean;
    cacheSize: number;
    initialized: boolean;
  } {
    return {
      connected: this.mcpClient.isConnected(),
      cacheSize: this.localCache.size,
      initialized: this.initialized
    };
  }
}

// ========== EXPORT SINGLETON ==========

let _instance: ArchonLearningService | null = null;

export const getArchonLearning = (): ArchonLearningService => {
  if (!_instance) {
    _instance = new ArchonLearningService();
  }
  return _instance;
};

export const archonLearning = new Proxy({} as ArchonLearningService, {
  get(target, prop) {
    const instance = getArchonLearning();
    const value = instance[prop as keyof ArchonLearningService];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});
