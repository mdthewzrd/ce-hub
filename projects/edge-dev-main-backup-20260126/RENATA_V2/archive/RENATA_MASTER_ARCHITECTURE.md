# 🤖 RENATA MASTER AI SYSTEM - Complete Architecture Specification

**Version:** 2.0
**Status:** Active Development
**Goal:** Transform Renata from code formatter to full AI development partner

---

## 🎯 Vision Statement

Renata will be a **fully autonomous AI development partner** capable of:
1. **Learning from every interaction** - Building a knowledge base of patterns, solutions, and best practices
2. **Dynamic system modification** - Adding/removing/editing columns, parameters, and features at runtime
3. **Creative construction** - Building scanners from scratch using ideas, descriptions, or even images
4. **System mastery** - Managing logs, memory, saves, and organization autonomously
5. **Visual understanding** - Analyzing screenshots and diagrams to implement UI/features
6. **Multi-scan orchestration** - Running single or multiple scans with intelligent parameter management

---

## 📋 Current Capabilities Inventory

### ✅ Already Implemented
- [x] Code formatting and beautification
- [x] Single scanner execution
- [x] Multi-scanner detection and formatting
- [x] Parameter extraction and preservation
- [x] Basic project API integration
- [x] CE Hub workflow integration

### 🚧 To Be Implemented (This Plan)
- [ ] **Learning System** - Knowledge base construction from interactions
- [ ] **Dynamic Column Manager** - Runtime column add/edit/remove
- [ ] **Parameter Master** - Full CRUD on scan parameters
- [ ] **Log & Memory Manager** - Autonomous cleanup and organization
- [ ] **Vision System** - Image upload and analysis
- [ ] **Build-from-Scratch** - Idea → Working scanner pipeline
- [ ] **Save/Load System** - Configuration persistence
- [ ] **Chat Memory Naming** - Organized conversation management

---

## 🏗️ SYSTEM ARCHITECTURE

### Core Components

#### 1. **RenataBrain** (New Learning System)
```typescript
interface RenataBrain {
  // Knowledge storage
  knowledgeBase: {
    patterns: PatternKnowledge[];
    solutions: SolutionKnowledge[];
    bestPractices: BestPracticeKnowledge[];
    userPreferences: UserPreferenceKnowledge[];
  };

  // Learning methods
  learnFromInteraction(session: ChatSession): Promise<void>;
  learnFromExecution(result: ExecutionResult): Promise<void>;
  learnFromError(error: ErrorWithSolution): Promise<void>;

  // Recall methods
  recallSimilarProblems(description: string): SolutionKnowledge[];
  recallApplicablePatterns(context: ScanContext): PatternKnowledge[];
}
```

#### 2. **DynamicColumnManager** (New)
```typescript
interface DynamicColumnManager {
  // Column operations
  addColumn(column: ColumnDefinition): Promise<void>;
  removeColumn(columnId: string): Promise<void>;
  editColumn(columnId: string, updates: Partial<ColumnDefinition>): Promise<void>;
  reorderColumns(columnIds: string[]): Promise<void>;

  // Column types
  columnTypes: 'data' | 'computed' | 'parameter' | 'validation' | 'display';

  // Persistence
  saveColumnLayout(layoutId: string): Promise<void>;
  loadColumnLayout(layoutId: string): Promise<ColumnLayout>;
}
```

#### 3. **ParameterMaster** (Enhanced)
```typescript
interface ParameterMaster {
  // CRUD operations
  createParameter(param: ParameterDefinition): Promise<void>;
  readParameter(paramId: string): Promise<ParameterDefinition>;
  updateParameter(paramId: string, updates: Partial<ParameterDefinition>): Promise<void>;
  deleteParameter(paramId: string): Promise<void>;

  // Bulk operations
  importParameters(params: ParameterDefinition[]): Promise<void>;
  exportParameters(): Promise<ParameterDefinition[]>;

  // Validation
  validateParameter(param: ParameterDefinition): ValidationResult;
  validateParameterSet(params: ParameterDefinition[]): ValidationResult;

  // Templates
  saveParameterTemplate(name: string, params: ParameterDefinition[]): Promise<void>;
  loadParameterTemplate(name: string): Promise<ParameterDefinition[]>;
}
```

#### 4. **SystemJanitor** (Log & Memory Manager - New)
```typescript
interface SystemJanitor {
  // Log management
  cleanOldLogs(retentionDays: number): Promise<void>;
  organizeLogsByType(): Promise<void>;
  compressOldLogs(): Promise<void>;

  // Memory management
  archiveOldChats(retentionDays: number): Promise<void>;
  nameChatSession(sessionId: string, name: string): Promise<void>;
  organizeChatsByProject(): Promise<void>;

  // Save management
  createSave(name: string, description: string): Promise<SaveSlot>;
  loadSave(slotId: string): Promise<SystemState>;
  deleteSave(slotId: string): Promise<void>;
}
```

#### 5. **VisionSystem** (New - Image Analysis)
```typescript
interface VisionSystem {
  // Image processing
  analyzeImage(imageUrl: string): Promise<ImageAnalysis>;

  // Screenshot understanding
  understandScreenshot(screenshot: Screenshot): Promise<UIUnderstanding>;

  // Chart/image to code
  convertToCode(image: Image): Promise<GeneratedCode>;

  // Pattern recognition
  detectPatterns(image: Image): Promise<DetectedPattern[]>;
}
```

#### 6. **BuilderEngine** (Build-from-Scratch - New)
```typescript
interface BuilderEngine {
  // Idea to scanner
  buildFromIdea(idea: ScannerIdea): Promise<WorkingScanner>;
  buildFromDescription(description: TextDescription): Promise<WorkingScanner>;
  buildFromImage(image: Screenshot): Promise<WorkingScanner>;

  // Validation
  testScanner(scanner: WorkingScanner): Promise<TestResults>;
  optimizeScanner(scanner: WorkingScanner): Promise<OptimizedScanner>;
}
```

---

## 🔄 DATA FLOW ARCHITECTURE

```
User Input
    ↓
[Intent Classifier]
    ↓
    ├─→ Code Request → [Enhanced Renata Code Service]
    │                       ├─→ Format
    │                       ├─→ Execute
    │                       └─→ Learn → [RenataBrain]
    │
    ├─→ Parameter Change → [ParameterMaster]
    │                           ├─→ Validate
    │                           ├─→ Update
    │                           └─→ Save Template
    │
    ├─→ Column Change → [DynamicColumnManager]
    │                           ├─→ Add/Edit/Remove
    │                           ├─→ Recompute
    │                           └─→ Save Layout
    │
    ├─→ Image Upload → [VisionSystem]
    │                           ├─→ Analyze
    │                           ├─→ Extract Requirements
    │                           └─→ Route to Builder
    │
    ├─→ Build Request → [BuilderEngine]
    │                           ├─→ Generate Scanner
    │                           ├─→ Test
    │                           └─→ Deploy
    │
    └─→ System Request → [SystemJanitor]
                            ├─→ Clean Logs
                            ├─→ Archive Chats
                            └─→ Manage Saves
```

---

## 💾 KNOWLEDGE BASE STRUCTURE

### Pattern Knowledge
```typescript
interface PatternKnowledge {
  id: string;
  name: string;
  category: 'scanner_pattern' | 'parameter_pattern' | 'ui_pattern' | 'data_pattern';
  description: string;
  code_example: string;
  usage_count: number;
  success_rate: number;
  last_used: Date;
  tags: string[];
}
```

### Solution Knowledge
```typescript
interface SolutionKnowledge {
  id: string;
  problem: string;
  solution: string;
  code: string;
  explanation: string;
  effectiveness: number; // 0-1 score
  applied_count: number;
  created_at: Date;
  context: string[];
}
```

### User Preferences
```typescript
interface UserPreferenceKnowledge {
  id: string;
  preference_type: 'column_layout' | 'parameter_values' | 'ui_behavior' | 'naming_convention';
  preference: any;
  confidence: number; // 0-1 how sure we are
  last_confirmed: Date;
}
```

---

## 🎨 UI/UX REQUIREMENTS

### Dynamic Columns Interface
```
┌────────────────────────────────────────────────────────────┐
│ 📊 Scan Results                                    [+] Add │
├────────────────────────────────────────────────────────────┤
│ Available Columns:                                       │
│ ☑ Ticker    ☑ Date    ☑ Scanner_Label   ☑ Gap_Pct      │
│ ☑ Volume   ☐ Score   ☐ Confidence      ☐ Custom_1     │
│                                                           │
│ [Drag to reorder] [Click to edit] [X to remove]         │
└────────────────────────────────────────────────────────────┘
```

### Parameter Manager Interface
```
┌────────────────────────────────────────────────────────────┐
│ ⚙️ Parameter Manager                              [Save] │
├────────────────────────────────────────────────────────────┤
│                                                           │
│ LC D2 Scanner Parameters                                 │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ min_close_price: [5.0]     range: [1-100]         │   │
│ │ min_volume:     [10M]      range: [1M-100M]        │   │
│ │ atr_period:     [14]       range: [5-50]          │   │
│ │ [+] Add Parameter                                  │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                           │
│ Templates: [D2 Default ▾] [Save as Template...]           │
└────────────────────────────────────────────────────────────┘
```

---

## 🔌 API ENDPOINTS NEEDED

### Learning System
```typescript
POST /api/renata/learn
POST /api/renata/recall
GET  /api/renata/knowledge-base
POST /api/renata/knowledge-base/patterns
POST /api/renata/knowledge-base/solutions
```

### Column Manager
```typescript
POST   /api/renata/columns/add
DELETE /api/renata/columns/remove
PUT    /api/renata/columns/edit
GET    /api/renata/columns/layouts
POST   /api/renata/columns/layouts/save
```

### Parameter Master
```typescript
POST   /api/renata/parameters/create
GET    /api/renata/parameters/all
PUT    /api/renata/parameters/update
DELETE /api/renata/parameters/delete
POST   /api/renata/parameters/validate
POST   /api/renata/parameters/templates
```

### System Janitor
```typescript
POST /api/renata/system/clean-logs
POST /api/renata/system/archive-chats
POST /api/renata/system/name-session
GET  /api/renata/system/saves
POST /api/renata/system/save
POST /api/renata/system/load
```

### Vision System
```typescript
POST /api/renata/vision/analyze
POST /api/renata/vision/screenshot-to-code
POST /api/renata/vision/detect-patterns
```

### Builder Engine
```typescript
POST /api/renata/build/from-idea
POST /api/renata/build/from-description
POST /api/renata/build/from-image
POST /api/renata/build/test
POST /api/renata/build/optimize
```

---

## 📊 IMPLEMENTATION PHASES

### Phase 1: Foundation (Week 1)
- [x] Analyze current system
- [ ] Create RenataBrain knowledge base structure
- [ ] Implement basic learning from interactions
- [ ] Create persistence layer for knowledge

### Phase 2: Dynamic Systems (Week 2)
- [ ] Implement DynamicColumnManager
- [ ] Enhance ParameterMaster with full CRUD
- [ ] Create column layout save/load
- [ ] Build parameter template system

### Phase 3: System Management (Week 3)
- [ ] Implement SystemJanitor
- [ ] Create log cleanup automation
- [ ] Build chat memory organization
- [ ] Implement save/load system

### Phase 4: Vision & Building (Week 4)
- [ ] Integrate vision capabilities
- [ ] Build image analysis pipeline
- [ ] Create BuilderEngine
- [ ] Implement build-from-scratch workflows

### Phase 5: Integration & Testing (Week 5)
- [ ] Full system integration
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Documentation completion

---

## 🎯 SUCCESS METRICS

### Learning Effectiveness
- Knowledge base size: >100 patterns learned
- Solution recall accuracy: >85%
- Learning from errors: >50 error patterns cataloged

### Dynamic System Performance
- Column add/remove latency: <100ms
- Parameter validation time: <50ms
- Layout save/load: <200ms

### User Experience
- Vision analysis accuracy: >90%
- Build-from-scratch success rate: >75%
- System uptime: >99%

---

**Next Step:** Begin Phase 1 implementation by creating RenataBrain knowledge base infrastructure.
