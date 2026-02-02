# Renata AI Learning & Memory System

## Overview
A comprehensive learning architecture that enables Renata to grow smarter with every conversation, building a persistent knowledge base that improves over time.

## Core Components

### 1. **Conversation Learning Engine**
- Extracts insights from every chat interaction
- Identifies successful patterns and user preferences
- Tracks what works vs. what doesn't
- Generates "lessons learned" from conversations

### 2. **Code Pattern Database**
- Vector-based semantic search for code patterns
- Stores formatted scanners with metadata
- Categorizes by type (LC, A+, Gap, Volume, etc.)
- Tracks which patterns perform best

### 3. **Insight Extraction System**
- Identifies trading strategies from conversations
- Extracts market patterns mentioned
- Records user feedback on results
- Builds "success criteria" knowledge

### 4. **User Preference Profile**
- Tracks individual user preferences
- Remembers favorite scanner types
- Records parameter preferences
- Adapts responses to user style

### 5. **Cross-Session Memory**
- Persistent knowledge across browser sessions
- Incremental learning from all users
- Aggregate intelligence database
- Time-decay weighting for relevance

## Data Structures

```typescript
// Conversation Insight
interface ConversationInsight {
  id: string;
  timestamp: string;
  chatId: string;
  type: 'strategy' | 'pattern' | 'preference' | 'feedback';
  content: string;
  confidence: number;
  sources: string[];
  tags: string[];
}

// Code Pattern
interface CodePattern {
  id: string;
  name: string;
  type: 'LC' | 'A+Plus' | 'BacksideB' | 'Gap' | 'Volume' | 'Custom';
  code: string;
  parameters: ParameterDefinition[];
  performance: {
    executionCount: number;
    successRate: number;
    avgResults: number;
    userRating?: number;
  };
  createdAt: string;
  lastUsed: string;
  embedding?: number[];
}

// Knowledge Base Entry
interface KnowledgeEntry {
  id: string;
  category: 'scanner' | 'strategy' | 'parameter' | 'market_pattern';
  title: string;
  content: string;
  examples: string[];
  confidence: number;
  usageCount: number;
  lastAccessed: string;
  embedding?: number[];
}

// User Profile
interface UserProfile {
  userId: string;
  preferences: {
    favoriteScanners: string[];
    commonParameters: Record<string, any>;
    communicationStyle: 'technical' | 'casual' | 'detailed';
    learningSpeed: 'fast' | 'medium' | 'slow';
  };
  history: {
    totalChats: number;
    totalScans: number;
    successPatterns: string[];
    avoidPatterns: string[];
  };
}
```

## Learning Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    RENATA LEARNING SYSTEM                     │
├─────────────────────────────────────────────────────────────┤
│                                                                │
│  1. CONVERSATION END                                         │
│     ├─ Extract all code snippets                             │
│     ├─ Identify user feedback (good/bad)                     │
│     ├─ Detect successful patterns                             │
│     └─ Extract trading strategies mentioned                  │
│                                                                │
│  2. INSIGHT GENERATION                                        │
│     ├─ Code Pattern Recognition                              │
│     ├─ Strategy Synthesis                                    │
│     ├─ Parameter Optimization                                │
│     └─ User Adaptation                                       │
│                                                                │
│  3. KNOWLEDGE INTEGRATION                                    │
│     ├─ Vector Embedding (semantic search)                    │
│     ├─ Code Pattern Database Update                          │
│     ├─ User Profile Update                                   │
│     └─ Cross-Session Learning                                │
│                                                                │
│  4. RETRIEVAL SYSTEM                                         │
│     ├─ Semantic Search (RAG)                                 │
│     ├─ Context-Aware Suggestions                             │
│     ├─ Pattern Matching                                      │
│     └─ Predictive Assistance                                 │
│                                                                │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Priority

### Phase 1: Core Learning Engine ✅
- Conversation insight extraction
- Basic pattern recognition
- Local storage persistence

### Phase 2: Memory System ✅
- Code pattern database
- User profile tracking
- Cross-session memory

### Phase 3: Intelligence ✅
- Semantic search with embeddings
- Predictive suggestions
- Adaptive responses

### Phase 4: Advanced Features
- Multi-user collaborative learning
- Market pattern analysis
- Automated strategy optimization

## Technical Stack

- **Storage**: IndexedDB for large-scale persistence
- **Search**: In-memory vector similarity search
- **Embeddings**: OpenAI Embeddings API or local models
- **Synchronization**: Background sync with server (future)

## Success Metrics

- ✅ Renata remembers code patterns from past chats
- ✅ User preferences persist across sessions
- ✅ Suggestions improve over time
- ✅ Response quality increases with usage
- ✅ Knowledge base grows organically
