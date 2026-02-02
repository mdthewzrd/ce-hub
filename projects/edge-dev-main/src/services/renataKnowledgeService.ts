/**
 * Renata Knowledge Service
 *
 * Provides persistent memory and knowledge management for Renata V2.
 * Stores conversations, scanner metadata, and learnings for intelligent responses.
 */

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  context?: {
    page?: string;
    scanner?: string;
    projects?: any[];
  };
}

interface Conversation {
  id: string;
  sessionId: string;
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
  summary?: string;
  topics?: string[];
}

interface ScannerKnowledge {
  id: string;
  name: string;
  code: string;
  type: string;
  createdAt: string;
  lastUsed: string;
  performance?: {
    totalScans?: number;
    avgResults?: number;
    successRate?: number;
  };
  learnings?: {
    whatWorks: string[];
    whatDoesntWork: string[];
    optimizations?: string[];
  };
  patterns?: string[];
}

interface KnowledgeQuery {
  query: string;
  context?: string;
  limit?: number;
}

class RenataKnowledgeService {
  private conversations: Map<string, Conversation> = new Map();
  private scanners: Map<string, ScannerKnowledge> = new Map();
  private storageKey = 'renata_knowledge_v1';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Store a conversation message
   */
  async storeMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    context?: any
  ): Promise<void> {
    let conversation = this.conversations.get(sessionId);

    if (!conversation) {
      conversation = {
        id: `conv_${Date.now()}`,
        sessionId,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.conversations.set(sessionId, conversation);
    }

    conversation.messages.push({
      role,
      content,
      timestamp: new Date().toISOString(),
      context
    });

    conversation.updatedAt = new Date().toISOString();

    // Update summary and topics periodically
    if (conversation.messages.length % 5 === 0) {
      await this.updateConversationMetadata(conversation);
    }

    this.saveToStorage();
  }

  /**
   * Store scanner knowledge
   */
  async storeScanner(scanner: Partial<ScannerKnowledge>): Promise<void> {
    const knowledge: ScannerKnowledge = {
      id: scanner.id || `scanner_${Date.now()}`,
      name: scanner.name || 'Unknown Scanner',
      code: scanner.code || '',
      type: scanner.type || 'unknown',
      createdAt: scanner.createdAt || new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      performance: scanner.performance,
      learnings: scanner.learnings,
      patterns: scanner.patterns
    };

    this.scanners.set(knowledge.id, knowledge);
    this.saveToStorage();

    console.log(`🧠 Stored scanner knowledge: ${knowledge.name}`);
  }

  /**
   * Search knowledge base
   */
  async searchKnowledge(query: KnowledgeQuery): Promise<{
    conversations: Conversation[];
    scanners: ScannerKnowledge[];
  }> {
    const results = {
      conversations: [] as Conversation[],
      scanners: [] as ScannerKnowledge[]
    };

    const queryLower = query.query.toLowerCase();
    const limit = query.limit || 5;

    // Search conversations
    for (const conv of this.conversations.values()) {
      if (results.conversations.length >= limit) break;

      const relevant = conv.messages.some(msg =>
        msg.content.toLowerCase().includes(queryLower) ||
        conv.topics?.some(topic => topic.toLowerCase().includes(queryLower))
      );

      if (relevant) {
        results.conversations.push(conv);
      }
    }

    // Search scanners
    for (const scanner of this.scanners.values()) {
      if (results.scanners.length >= limit) break;

      const matches = [
        scanner.name,
        scanner.code,
        ...(scanner.patterns || []),
        ...(scanner.learnings?.whatWorks || [])
      ].some(text => text?.toLowerCase().includes(queryLower));

      if (matches) {
        results.scanners.push(scanner);
      }
    }

    return results;
  }

  /**
   * Get context for a new message
   */
  async getContext(sessionId: string, recentCount: number = 5): Promise<{
    recentMessages: ConversationMessage[];
    relevantScanners: ScannerKnowledge[];
    topics: string[];
  }> {
    const conversation = this.conversations.get(sessionId);
    const recentMessages = conversation
      ? conversation.messages.slice(-recentCount)
      : [];

    // Extract topics from recent conversation
    const topics = conversation?.topics || [];

    // Get recently used scanners
    const relevantScanners = Array.from(this.scanners.values())
      .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
      .slice(0, 3);

    return {
      recentMessages,
      relevantScanners,
      topics
    };
  }

  /**
   * Update conversation metadata (summary, topics)
   */
  private async updateConversationMetadata(conversation: Conversation): Promise<void> {
    // Generate summary from recent messages
    const recentMessages = conversation.messages.slice(-10);
    const userMessages = recentMessages.filter(m => m.role === 'user');

    // Extract topics from user messages
    const topics = this.extractTopics(userMessages.map(m => m.content));

    // Generate simple summary
    const summary = this.generateSummary(userMessages.map(m => m.content));

    conversation.topics = topics;
    conversation.summary = summary;

    console.log(`📝 Updated conversation metadata: ${topics.join(', ')}`);
  }

  /**
   * Extract topics from messages
   */
  private extractTopics(messages: string[]): string[] {
    const topics: string[] = [];
    const keywords = [
      'scanner', 'pattern', 'backtest', 'scan', 'v31',
      'strategy', 'indicator', 'trading', 'execution',
      'upload', 'results', 'optimization', 'parameters'
    ];

    for (const message of messages) {
      for (const keyword of keywords) {
        if (message.toLowerCase().includes(keyword) && !topics.includes(keyword)) {
          topics.push(keyword);
        }
      }
    }

    return topics;
  }

  /**
   * Generate summary from messages
   */
  private generateSummary(messages: string[]): string {
    if (messages.length === 0) return '';

    const lastMessage = messages[messages.length - 1];
    return lastMessage.substring(0, 100) + (lastMessage.length > 100 ? '...' : '');
  }

  /**
   * Load knowledge from localStorage
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);

        // Restore conversations
        if (parsed.conversations) {
          for (const conv of parsed.conversations) {
            this.conversations.set(conv.sessionId, conv);
          }
        }

        // Restore scanners
        if (parsed.scanners) {
          for (const scanner of parsed.scanners) {
            this.scanners.set(scanner.id, scanner);
          }
        }

        console.log(`📚 Loaded knowledge: ${this.conversations.size} conversations, ${this.scanners.size} scanners`);
      }
    } catch (error) {
      console.error('Failed to load knowledge from storage:', error);
    }
  }

  /**
   * Save knowledge to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        conversations: Array.from(this.conversations.values()),
        scanners: Array.from(this.scanners.values()),
        lastSaved: new Date().toISOString()
      };

      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save knowledge to storage:', error);
    }
  }

  /**
   * Clear all knowledge (for testing/reset)
   */
  clearAll(): void {
    this.conversations.clear();
    this.scanners.clear();
    localStorage.removeItem(this.storageKey);
    console.log('🗑️ Cleared all knowledge');
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      conversations: this.conversations.size,
      scanners: this.scanners.size,
      totalMessages: Array.from(this.conversations.values()).reduce((sum, conv) => sum + conv.messages.length, 0)
    };
  }
}

// Singleton instance
let knowledgeServiceInstance: RenataKnowledgeService | null = null;

export function getRenataKnowledgeService(): RenataKnowledgeService {
  if (!knowledgeServiceInstance) {
    knowledgeServiceInstance = new RenataKnowledgeService();
  }
  return knowledgeServiceInstance;
}

export type { ConversationMessage, Conversation, ScannerKnowledge, KnowledgeQuery };
