/**
 * Renata Learning Engine
 * Enables Renata to learn from every conversation and build a knowledge base
 */

// ========== TYPES ==========

export interface ConversationInsight {
  id: string;
  timestamp: string;
  chatId: string;
  type: 'strategy' | 'pattern' | 'preference' | 'feedback' | 'code_success' | 'code_failure';
  content: string;
  confidence: number;
  sources: string[];
  tags: string[];
  metadata?: {
    scannerType?: string;
    parameters?: Record<string, any>;
    userRating?: 'positive' | 'negative' | 'neutral';
    executionResults?: number;
  };
}

export interface CodePattern {
  id: string;
  name: string;
  type: 'LC' | 'A+Plus' | 'BacksideB' | 'Gap' | 'Volume' | 'Breakout' | 'Custom';
  code: string;
  parameters: ParameterDefinition[];
  performance: {
    executionCount: number;
    successRate: number;
    avgResults: number;
    lastResult?: number;
    userRating?: number;
  };
  createdAt: string;
  lastUsed: string;
  sourceChatId: string;
}

export interface ParameterDefinition {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'range';
  description: string;
  defaultValue?: any;
  typicalValues?: any[];
}

export interface KnowledgeEntry {
  id: string;
  category: 'scanner' | 'strategy' | 'parameter' | 'market_pattern' | 'user_tip';
  title: string;
  content: string;
  examples: string[];
  confidence: number;
  usageCount: number;
  lastAccessed: string;
  tags: string[];
}

export interface UserProfile {
  userId: string;
  preferences: {
    favoriteScanners: string[];
    commonParameters: Record<string, any>;
    communicationStyle: 'technical' | 'casual' | 'detailed';
    preferredTimeframes: string[];
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  };
  history: {
    totalChats: number;
    totalScans: number;
    successPatterns: string[];
    avoidPatterns: string[];
    avgScanResults: number;
  };
  learningProgress: {
    topicsLearned: string[];
    skillsAcquired: string[];
    conceptsMastered: string[];
  };
}

// ========== STORAGE KEYS ==========
const INSIGHTS_KEY = 'renata_insights';
const CODE_PATTERNS_KEY = 'renata_code_patterns';
const KNOWLEDGE_BASE_KEY = 'renata_knowledge';
const USER_PROFILE_KEY = 'renata_user_profile';

// ========== INSIGHT EXTRACTION ==========

class InsightExtractor {
  /**
   * Extract insights from a conversation
   */
  static extractFromConversation(chatId: string, messages: any[]): ConversationInsight[] {
    const insights: ConversationInsight[] = [];

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];

      // Extract code patterns
      if (msg.metadata?.formattedCode) {
        insights.push(this.extractCodePattern(chatId, msg));
      }

      // Extract user feedback
      if (msg.role === 'user') {
        insights.push(...this.extractUserFeedback(chatId, msg));
      }

      // Extract strategies mentioned
      insights.push(...this.extractStrategies(chatId, msg));
    }

    return insights.filter(insight => insight.confidence > 0.5);
  }

  /**
   * Extract code pattern from message
   */
  private static extractCodePattern(chatId: string, msg: any): ConversationInsight {
    const code = msg.metadata.formattedCode;
    const scannerType = msg.metadata.scannerType || 'Unknown';

    // Detect scanner type from code
    const type = this.detectScannerType(code);

    // Extract parameters
    const parameters = this.extractParameters(code);

    return {
      id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      chatId,
      type: 'pattern',
      content: `Successful ${scannerType} scanner with ${parameters.length} parameters`,
      confidence: 0.9,
      sources: [msg.id],
      tags: [type, scannerType, 'code'],
      metadata: {
        scannerType,
        parameters: parameters.map(p => ({ name: p, value: 'detected' }))
      }
    };
  }

  /**
   * Extract user feedback
   */
  private static extractUserFeedback(chatId: string, msg: any): ConversationInsight[] {
    const insights: ConversationInsight[] = [];
    const content = msg.content.toLowerCase();

    // Positive feedback indicators
    const positiveWords = ['good', 'great', 'excellent', 'perfect', 'thanks', 'helpful', 'love it', 'amazing'];
    const negativeWords = ['bad', 'wrong', 'error', 'issue', 'problem', 'hate', 'terrible'];

    const positiveCount = positiveWords.filter(word => content.includes(word)).length;
    const negativeCount = negativeWords.filter(word => content.includes(word)).length;

    if (positiveCount > negativeCount) {
      insights.push({
        id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        chatId,
        type: 'feedback',
        content: 'User expressed positive feedback',
        confidence: Math.min(positiveCount * 0.2, 0.9),
        sources: [msg.id],
        tags: ['positive', 'feedback'],
        metadata: { userRating: 'positive' }
      });
    } else if (negativeCount > positiveCount) {
      insights.push({
        id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        chatId,
        type: 'feedback',
        content: 'User expressed negative feedback',
        confidence: Math.min(negativeCount * 0.2, 0.9),
        sources: [msg.id],
        tags: ['negative', 'feedback'],
        metadata: { userRating: 'negative' }
      });
    }

    return insights;
  }

  /**
   * Extract trading strategies
   */
  private static extractStrategies(chatId: string, msg: any): ConversationInsight[] {
    const insights: ConversationInsight[] = [];
    const content = msg.content.toLowerCase();

    // Strategy keywords
    const strategies = [
      { keyword: 'momentum', name: 'Momentum Trading Strategy' },
      { keyword: 'mean reversion', name: 'Mean Reversion Strategy' },
      { keyword: 'breakout', name: 'Breakout Trading Strategy' },
      { keyword: 'gap', name: 'Gap Trading Strategy' },
      { keyword: 'volume', name: 'Volume Analysis Strategy' },
      { keyword: 'trend', name: 'Trend Following Strategy' },
      { keyword: 'scalping', name: 'Scalping Strategy' },
      { keyword: 'swing', name: 'Swing Trading Strategy' }
    ];

    for (const strategy of strategies) {
      if (content.includes(strategy.keyword)) {
        insights.push({
          id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          chatId,
          type: 'strategy',
          content: `User interested in ${strategy.name}`,
          confidence: 0.7,
          sources: [msg.id],
          tags: ['strategy', strategy.keyword]
        });
      }
    }

    return insights;
  }

  /**
   * Detect scanner type from code
   */
  private static detectScannerType(code: string): string {
    const lowerCode = code.toLowerCase();

    if (lowerCode.includes('backside') && lowerCode.includes('para b')) return 'BacksideB';
    if (lowerCode.includes('a+') && lowerCode.includes('para')) return 'APlus';
    if (lowerCode.includes('lc') && lowerCode.includes('d2')) return 'LCD2';
    if (lowerCode.includes('gap') && lowerCode.includes('scan')) return 'Gap';
    if (lowerCode.includes('volume') && lowerCode.includes('scan')) return 'Volume';

    return 'Custom';
  }

  /**
   * Extract parameters from code
   */
  private static extractParameters(code: string): string[] {
    const paramPattern = /(?:self\.|scanner\.)(\w+)\s*=/g;
    const parameters: string[] = [];
    let match;

    while ((match = paramPattern.exec(code)) !== null) {
      parameters.push(match[1]);
    }

    return [...new Set(parameters)]; // Unique only
  }
}

// ========== LEARNING ENGINE ==========

export class RenataLearningEngine {
  private insights: ConversationInsight[] = [];
  private codePatterns: CodePattern[] = [];
  private knowledgeBase: KnowledgeEntry[] = [];
  private userProfile: UserProfile;
  private initialized: boolean = false;

  constructor() {
    // Don't initialize in constructor - do it lazily
    this.userProfile = {} as any;
  }

  /**
   * Ensure we're initialized (client-side only)
   */
  private ensureInitialized() {
    if (!this.initialized && typeof window !== 'undefined' && window.localStorage) {
      this.loadFromStorage();
      this.initializeUserProfile();
      this.initialized = true;
    }
  }

  /**
   * Load persisted learning data
   */
  private loadFromStorage() {
    if (typeof window === 'undefined' || !window.localStorage) {
      this.insights = [];
      this.codePatterns = [];
      this.knowledgeBase = [];
      this.userProfile = {} as any;
      return;
    }

    try {
      this.insights = JSON.parse(window.localStorage.getItem(INSIGHTS_KEY) || '[]');
      this.codePatterns = JSON.parse(window.localStorage.getItem(CODE_PATTERNS_KEY) || '[]');
      this.knowledgeBase = JSON.parse(window.localStorage.getItem(KNOWLEDGE_BASE_KEY) || '[]');
      this.userProfile = JSON.parse(window.localStorage.getItem(USER_PROFILE_KEY) || '{}');
    } catch (error) {
      console.error('Error loading learning data:', error);
      this.insights = [];
      this.codePatterns = [];
      this.knowledgeBase = [];
    }
  }

  /**
   * Initialize user profile
   */
  private initializeUserProfile() {
    if (!this.userProfile || !this.userProfile.userId) {
      this.userProfile = {
        userId: this.generateUserId(),
        preferences: {
          favoriteScanners: [],
          commonParameters: {},
          communicationStyle: 'casual',
          preferredTimeframes: [],
          riskTolerance: 'moderate'
        },
        history: {
          totalChats: 0,
          totalScans: 0,
          successPatterns: [],
          avoidPatterns: [],
          avgScanResults: 0
        },
        learningProgress: {
          topicsLearned: [],
          skillsAcquired: [],
          conceptsMastered: []
        }
      };
      this.saveUserProfile();
    }
  }

  /**
   * Learn from a conversation
   */
  async learnFromConversation(chatId: string, messages: any[], metadata?: any) {
    this.ensureInitialized();
    console.log(`🧠 Learning from conversation: ${chatId}`);

    // Extract insights
    const newInsights = InsightExtractor.extractFromConversation(chatId, messages);

    // Add insights
    for (const insight of newInsights) {
      this.addInsight(insight);
    }

    // Extract code patterns
    for (const msg of messages) {
      if (msg.metadata?.formattedCode) {
        this.addCodePattern(msg.metadata, chatId);
      }
    }

    // Update user profile
    this.updateUserProfileFromChat(messages, metadata);

    // Generate new knowledge entries
    this.generateKnowledgeEntries(newInsights);

    // Save everything
    this.saveAll();

    console.log(`✅ Learned ${newInsights.length} insights from conversation`);
    return newInsights;
  }

  /**
   * Add an insight
   */
  private addInsight(insight: ConversationInsight) {
    // Check for duplicates
    const exists = this.insights.some(i =>
      i.content === insight.content &&
      i.chatId === insight.chatId
    );

    if (!exists) {
      this.insights.push(insight);
    }
  }

  /**
   * Add a code pattern
   */
  private addCodePattern(metadata: any, chatId: string) {
    const code = metadata.formattedCode;
    const scannerType = metadata.scannerType || 'Unknown';

    // Check if pattern already exists
    const existingPattern = this.codePatterns.find(p =>
      p.code === code || p.name === scannerType
    );

    if (existingPattern) {
      // Update performance
      existingPattern.performance.executionCount++;
      existingPattern.lastUsed = new Date().toISOString();
    } else {
      // Create new pattern
      const pattern: CodePattern = {
        id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: scannerType,
        type: this.mapScannerType(scannerType),
        code: code,
        parameters: this.extractParametersFromCode(code),
        performance: {
          executionCount: 1,
          successRate: 0.5,
          avgResults: 0
        },
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        sourceChatId: chatId
      };

      this.codePatterns.push(pattern);
    }
  }

  /**
   * Update user profile from chat
   */
  private updateUserProfileFromChat(messages: any[], metadata?: any) {
    this.userProfile.history.totalChats++;

    // Detect preferences from messages
    for (const msg of messages) {
      if (msg.role === 'user') {
        // Detect scanner preferences
        if (msg.metadata?.scannerType) {
          if (!this.userProfile.preferences.favoriteScanners.includes(msg.metadata.scannerType)) {
            this.userProfile.preferences.favoriteScanners.push(msg.metadata.scannerType);
          }
        }

        // Detect communication style
        const avgWordLength = msg.content.split(' ').reduce((sum: number, word: string) => sum + word.length, 0) / msg.content.split(' ').length;
        if (avgWordLength > 5) {
          this.userProfile.preferences.communicationStyle = 'technical';
        }
      }
    }

    this.saveUserProfile();
  }

  /**
   * Generate knowledge entries from insights
   */
  private generateKnowledgeEntries(insights: ConversationInsight[]) {
    for (const insight of insights) {
      // Check if knowledge already exists
      const exists = this.knowledgeBase.some(kb => kb.title === insight.content);

      if (!exists && insight.confidence > 0.7) {
        const entry: KnowledgeEntry = {
          id: `knowledge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          category: insight.type === 'pattern' ? 'scanner' :
                   insight.type === 'strategy' ? 'strategy' : 'user_tip',
          title: insight.content,
          content: insight.content,
          examples: [],
          confidence: insight.confidence,
          usageCount: 0,
          lastAccessed: new Date().toISOString(),
          tags: insight.tags
        };

        this.knowledgeBase.push(entry);
      }
    }
  }

  /**
   * Search knowledge base
   */
  searchKnowledge(query: string): KnowledgeEntry[] {
    this.ensureInitialized();
    const queryLower = query.toLowerCase();

    // Increment usage count for matching entries
    const results = this.knowledgeBase
      .filter(kb =>
        kb.title.toLowerCase().includes(queryLower) ||
        kb.content.toLowerCase().includes(queryLower) ||
        kb.tags.some(tag => tag.toLowerCase().includes(queryLower))
      )
      .map(kb => ({
        ...kb,
        usageCount: kb.usageCount + 1,
        lastAccessed: new Date().toISOString()
      }));

    // Sort by relevance (usage count + confidence)
    results.sort((a, b) => (b.usageCount * b.confidence) - (a.usageCount * a.confidence));

    return results.slice(0, 5); // Top 5 results
  }

  /**
   * Get relevant code patterns
   */
  getRelevantPatterns(scannerType?: string): CodePattern[] {
    this.ensureInitialized();
    let patterns = this.codePatterns;

    if (scannerType) {
      patterns = patterns.filter(p => p.type === scannerType || p.name.includes(scannerType));
    }

    // Sort by performance
    patterns.sort((a, b) => b.performance.successRate - a.performance.successRate);

    return patterns.slice(0, 5);
  }

  /**
   * Get user suggestions based on history
   */
  getSuggestions(): string[] {
    this.ensureInitialized();
    const suggestions: string[] = [];

    // Based on favorite scanners
    if (this.userProfile.preferences.favoriteScanners.length > 0) {
      const topScanner = this.userProfile.preferences.favoriteScanners[0];
      suggestions.push(`Consider using your ${topScanner} scanner again`);
    }

    // Based on success patterns
    for (const pattern of this.userProfile.history.successPatterns) {
      suggestions.push(`Try the ${pattern} approach that worked well before`);
    }

    // Based on recent insights
    const recentInsights = this.insights.slice(-5);
    for (const insight of recentInsights) {
      if (insight.type === 'strategy') {
        suggestions.push(insight.content);
      }
    }

    return suggestions.slice(0, 3);
  }

  /**
   * Update pattern performance
   */
  updatePatternPerformance(patternId: string, success: boolean, results?: number) {
    this.ensureInitialized();
    const pattern = this.codePatterns.find(p => p.id === patternId);
    if (pattern) {
      pattern.performance.executionCount++;

      if (success) {
        const successCount = pattern.performance.successRate * (pattern.performance.executionCount - 1);
        pattern.performance.successRate = (successCount + 1) / pattern.performance.executionCount;
      }

      if (results !== undefined) {
        const totalResults = pattern.performance.avgResults * (pattern.performance.executionCount - 1);
        pattern.performance.avgResults = (totalResults + results) / pattern.performance.executionCount;
        pattern.performance.lastResult = results;
      }

      this.saveCodePatterns();
    }
  }

  // ========== PERSISTENCE ==========

  private saveAll() {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(INSIGHTS_KEY, JSON.stringify(this.insights));
      window.localStorage.setItem(CODE_PATTERNS_KEY, JSON.stringify(this.codePatterns));
      window.localStorage.setItem(KNOWLEDGE_BASE_KEY, JSON.stringify(this.knowledgeBase));
      this.saveUserProfile();
    }
  }

  private saveUserProfile() {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(this.userProfile));
    }
  }

  private saveCodePatterns() {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(CODE_PATTERNS_KEY, JSON.stringify(this.codePatterns));
    }
  }

  // ========== UTILITIES ==========

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private mapScannerType(scannerType: string): CodePattern['type'] {
    const typeMap: Record<string, CodePattern['type']> = {
      'Backside B Para Scanner': 'BacksideB',
      'A+ Para Scanner': 'A+Plus',
      'LC D2 Scanner': 'LC',
      'Gap Scanner': 'Gap',
      'Volume Scanner': 'Volume'
    };

    return typeMap[scannerType] || 'Custom';
  }

  private extractParametersFromCode(code: string): ParameterDefinition[] {
    // This would parse the code to find parameters
    // For now, return empty array
    return [];
  }

  // ========== GETTERS ==========

  getStats() {
    this.ensureInitialized();
    return {
      totalInsights: this.insights.length,
      totalPatterns: this.codePatterns.length,
      totalKnowledge: this.knowledgeBase.length,
      totalChats: this.userProfile.history.totalChats,
      learningProgress: this.userProfile.learningProgress
    };
  }

  getUserProfile() {
    this.ensureInitialized();
    return this.userProfile;
  }

  getCodePatterns() {
    this.ensureInitialized();
    return this.codePatterns;
  }
}

// ========== EXPORT SINGLETON (lazy initialization for SSR) ==========
let _instance: RenataLearningEngine | null = null;

export const getRenataLearning = (): RenataLearningEngine => {
  if (!_instance) {
    _instance = new RenataLearningEngine();
  }
  return _instance;
};

// Convenience export that acts like the instance
export const renataLearning = new Proxy({} as RenataLearningEngine, {
  get(target, prop) {
    if (typeof window === 'undefined') {
      // Return empty functions during SSR to prevent errors
      return () => ({});
    }
    const instance = getRenataLearning();
    const value = instance[prop as keyof RenataLearningEngine];
    return typeof value === 'function' ? value.bind(instance) : value;
  }
});
