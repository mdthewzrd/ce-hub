# 🔍 edge-dev-main Analysis & Agent Migration Plan

**Date**: 2026-01-05
**Status**: Complete Analysis with Migration Strategy

---

## 📊 Current State Assessment

### **Current Architecture: edge-dev-main Scan System**

```
User Request
     │
     ▼
┌─────────────────────────────────────────┐
│  Frontend: GlobalRenataAgent.tsx         │
│  - OpenRouter API (Qwen 2.5 72B)        │
│  - Simple chat interface                │
│  - NO agent orchestration                │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  API: /api/systematic/scan              │
│  Phase 1: Scanner Generation            │
│  Phase 2: Parameter Optimization        │
│  Phase 3: Execute Scan (Python backend) │
│  Phase 4: Validation                    │
│  Phase 5: Learning (DISABLED) ❌         │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Python Backend (Port 8000)             │
│  - Executes actual scanner              │
│  - Returns results                      │
└─────────────────────────────────────────┘
```

### **Current RENATA Agents System**

**Location**: `/src/services/renata/agents/`

| Agent | File | Tools/Methods | Purpose |
|-------|------|--------------|---------|
| **CodeAnalyzerAgent** | CodeAnalyzerAgent.ts | 7 methods | Static code analysis |
| **CodeFormatterAgent** | CodeFormatterAgent.ts | TBD | V31 code formatting |
| **DocumentationAgent** | DocumentationAgent.ts | TBD | Generate docs |
| **OptimizerAgent** | OptimizerAgent.ts | TBD | Optimize code |
| **ParameterExtractorAgent** | ParameterExtractorAgent.ts | TBD | Extract params |
| **ValidatorAgent** | ValidatorAgent.ts | TBD | Validate compliance |
| **RenataOrchestrator** | RenataOrchestrator.ts | 6 methods | Coordinate agents |

### **CodeAnalyzerAgent Deep Dive**

**Current Implementation**:
```typescript
class CodeAnalyzerAgent {
  // All methods are PRIVATE - no tool structure
  async analyze(code: string): Promise<AgentResult> {
    return {
      scannerType: this.detectScannerType(code),    // private
      structure: this.analyzeStructure(code),      // private
      patterns: this.analyzePatterns(code),        // private
      metrics: this.calculateMetrics(code),        // private
      issues: this.identifyIssues(code),          // private
      suggestions: this.generateSuggestions(code) // private
    };
  }

  // 10+ private methods, all in ONE agent
  private detectScannerType() { ... }
  private analyzeStructure() { ... }
  private analyzePatterns() { ... }
  private calculateMetrics() { ... }
  private identifyIssues() { ... }
  private generateSuggestions() { ... }
  // ... more private methods
}
```

**Problems**:
- ❌ No exposed tools - all methods are private
- ❌ Agent has 10+ capabilities but no tool structure
- ❌ Cannot be invoked by LLM (no tool interface)
- ❌ No RAG integration
- ❌ No learning capabilities
- ❌ Hard to test individual methods
- ❌ Cannot be orchestrated properly

---

## 🎯 Problems Identified

### **Problem 1: No Tool-Based Architecture**

**Current**: Agents have methods but no exposed tools
```typescript
// ❌ Current: Private methods
private detectScannerType() { ... }
private analyzeStructure() { ... }
```

**Needed**: Tool-based architecture
```python
# ✅ Declarative: Exposed tools
{
  "tools": [
    {"name": "detect_scanner_pattern", ...},
    {"name": "analyze_code_structure", ...},
    {"name": "validate_v31_compliance", ...}
  ]
}
```

### **Problem 2: Monolithic Agent Design**

**Current**: CodeAnalyzerAgent tries to do everything
- Pattern detection
- Structure analysis
- Metrics calculation
- Issue identification
- Suggestions
- Validation

**Impact**: Agent is confused, hard to maintain, impossible to orchestrate

### **Problem 3: No Orchestrator Implementation**

**Current**: RenataOrchestrator exists but doesn't properly orchestrate
```typescript
// Just passes through to other agents
async orchestrate(code: string) {
  const analysis = await this.codeAnalyzer.analyze(code);
  const formatted = await this.formatter.format(code);
  // No true delegation, just sequential calls
}
```

**Needed**: Proper sub-agent orchestration with delegation tools

### **Problem 4: No Integration with Scan Workflow**

**Current**: Scan API (`/api/systematic/scan`) doesn't use RENATA agents properly
- Phase 1: Uses `scannerGenerationService` (not agent-based)
- Phase 2: Uses `parameterMaster` (not agent-based)
- Phase 4: Uses `validationTestingService` (not agent-based)

**Impact**: Agents exist but aren't integrated into actual workflow

### **Problem 5: Learning Disabled**

**Current**: Phase 5 learning is commented out
```typescript
// Phase 5: Learning - Learn from this scan if requested
// TODO: Re-enable when Archon MCP is set up (Phase 3)
// if (enable_learning && scanData.success) {
//   // ... disabled code
// }
```

**Impact**: No continuous improvement, no knowledge accumulation

---

## ✅ Solution: Our Declarative Agent System

### **What We Built**

Based on this analysis, we created **5 production-ready agents** that map directly to your needs:

#### 1. **Enhanced Code Analyzer** → Replaces CodeAnalyzerAgent

**Current CodeAnalyzerAgent**: 10+ private methods, no tools
**Our Enhanced Code Analyzer**: 8 exposed tools

| Current (Private) | Our Declarative Agent (Tools) |
|-------------------|-------------------------------|
| `detectScannerType()` | ✅ `detect_scanner_pattern` |
| `analyzeStructure()` | ✅ `analyze_code_structure` |
| - | ✅ `validate_v31_compliance` |
| - | ✅ `extract_parameters` |
| - | ✅ `validate_with_market_data` |
| `identifyIssues()` | ✅ `detect_code_smells` |
| `calculateMetrics()` | ✅ `calculate_code_metrics` |
| - | ✅ `generate_analysis_report` |

**Benefits**:
- ✅ Tools are exposed and callable by LLM
- ✅ Each tool independently testable
- ✅ Can be orchestrated properly
- ✅ RAG-enabled with knowledge base
- ✅ Stays within 10-tool limit

#### 2. **Multi-Pattern Scan Generator** → New Capability

**Your Need**: Generate scanners from descriptions
**Our Agent**: 9 tools for scanner creation

| Capability | Tool |
|------------|------|
| Understand requirements | ✅ `analyze_user_requirements` |
| Select pattern | ✅ `select_pattern` |
| Apply structure | ✅ `apply_structural_template` |
| Generate logic | ✅ `generate_pattern_logic` |
| Define parameters | ✅ `define_parameters` |
| AI generation | ✅ `integrate_ai_generation` |
| V31 compliance | ✅ `validate_v31_compliance` |
| Test generation | ✅ `generate_test_cases` |
| Documentation | ✅ `generate_documentation` |

**Integration Point**: Replace `scannerGenerationService` in Phase 1

#### 3. **Intelligent Parameter Optimizer** → Replaces parameterMaster

**Your Current**: `parameterMaster.getOptimizationSuggestions()`
**Our Agent**: 7 tools for optimization

| Current | Our Agent |
|---------|-----------|
| Simple suggestions | ✅ `design_optimization_strategy` |
| - | ✅ `execute_optimization` |
| - | ✅ `validate_constraints` |
| - | ✅ `simulate_performance` |
| - | ✅ `validate_out_of_sample` |
| - | ✅ `analyze_sensitivity` |
| - | ✅ `generate_optimization_report` |

**Integration Point**: Replace `parameterMaster` in Phase 2

#### 4. **Automated Compliance Validator** → Replaces ValidatorAgent

**Your Current**: `validationTestingService`
**Our Agent**: 8 tools for V31 compliance

| Current | Our Agent |
|---------|-----------|
| Basic validation | ✅ `validate_scanner_structure` |
| - | ✅ `validate_parameter_handling` |
| - | ✅ `validate_return_format` |
| - | ✅ `check_error_handling` |
| - | ✅ `validate_documentation` |
| - | ✅ `check_naming_conventions` |
| - | ✅ `check_security_practices` |
| - | ✅ `generate_compliance_report` |

**Integration Point**: Replace `validationTestingService` in Phase 4

#### 5. **Learning-Powered Assistant** → Enables Phase 5

**Your Current**: Learning disabled, TODO for Archon MCP
**Our Agent**: 10 tools for learning and assistance

| Missing | Our Agent |
|---------|-----------|
| - | ✅ `provide_contextual_assistance` |
| - | ✅ `learn_user_preference` |
| - | ✅ `retrieve_user_history` |
| - | ✅ `provide_personalized_recommendations` |
| - | ✅ `incorporate_feedback` |
| - | ✅ `query_archon_knowledge` |
| - | ✅ `maintain_conversation_context` |
| - | ✅ `suggest_similar_successful_patterns` |
| - | ✅ `provide_progressive_explanations` |
| - | ✅ `generate_learning_report` |

**Integration Point**: Enable Phase 5 learning

---

## 🚀 Migration Plan

### **Phase 1: Replace CodeAnalyzerAgent**

**Current**:
```typescript
// /src/services/renata/agents/CodeAnalyzerAgent.ts
class CodeAnalyzerAgent {
  async analyze(code: string) {
    // 10+ private methods
  }
}
```

**Migration**: Use our declarative agent
```bash
# Build our agent
cd "/Users/michaeldurante/ai dev/ce-hub"
python core-v2/cli.py build-agent \
  core-v2/agent_framework/declarative/examples/code_analyzer.json \
  -o projects/edge-dev-main/src/services/renata/agents-v2/code_analyzer --docker
```

**Integration**:
```typescript
// Import Python agent
import { spawn } from 'child_process';

async function analyzeCodeWithAgent(code: string) {
  const agentProcess = spawn('python', [
    'src/services/renata/agents-v2/code_analyzer/enhanced__code__analyzer_agent.py'
  ]);

  // Send code to agent
  agentProcess.stdin.write(JSON.stringify({ code }));

  // Get result with tool calls
  const result = await new Promise((resolve) => {
    agentProcess.stdout.on('data', (data) => {
      resolve(JSON.parse(data));
    });
  });

  return result;
}
```

### **Phase 2: Integrate into Scan Workflow**

**Current** (`/api/systematic/scan/route.ts`):
```typescript
// Phase 1: Uses scannerGenerationService
if (generate_scanner && scanner_description) {
  const scannerService = getScannerGenerationService();
  const result = await scannerService.generateScanner({ ... });
}

// Phase 2: Uses parameterMaster
if (enable_parameter_optimization) {
  const parameterService = getParameterMaster();
  const suggestions = parameterService.getOptimizationSuggestions(scannerType);
}
```

**Migration**: Replace with agent-based system
```typescript
// Phase 1: Use Multi-Pattern Scan Generator Agent
if (generate_scanner && scanner_description) {
  const result = await callAgent('multi_pattern_scan_generator', {
    task: 'generate_scanner',
    description: scanner_description,
    scanner_type: filters?.scanner_type
  });

  // Agent uses tools: analyze_user_requirements, select_pattern,
  // apply_structural_template, generate_pattern_logic, etc.
}

// Phase 2: Use Intelligent Parameter Optimizer Agent
if (enable_parameter_optimization) {
  const result = await callAgent('intelligent_parameter_optimizer', {
    scanner_config: currentScanner,
    optimization_goal: 'maximize_sharpe',
    constraints: parameterConstraints
  });

  // Agent uses tools: design_optimization_strategy, execute_optimization,
  // validate_constraints, simulate_performance, etc.
}
```

### **Phase 3: Enable Orchestrator**

**Create orchestrator agent**:
```json
{
  "agent": {
    "name": "Scan Workflow Orchestrator",
    "max_tools": 6,
    "tools": [
      {"name": "delegate_to_code_analyzer", ...},
      {"name": "delegate_to_scan_generator", ...},
      {"name": "delegate_to_parameter_optimizer", ...},
      {"name": "delegate_to_compliance_validator", ...},
      {"name": "aggregate_results", ...},
      {"name": "validate_workflow", ...}
    ],
    "sub_agents": {
      "code_analyzer": "code_analyzer.json",
      "scan_generator": "multi_pattern_scan_generator.json",
      "parameter_optimizer": "intelligent_parameter_optimizer.json",
      "compliance_validator": "compliance_validator.json"
    }
  }
}
```

### **Phase 4: Enable Learning**

**Current**: Phase 5 is disabled
```typescript
// Phase 5: Learning - Learn from this scan if requested
// TODO: Re-enable when Archon MCP is set up (Phase 3)
```

**Migration**: Enable with Learning-Powered Assistant
```typescript
// Phase 5: Learning - NOW ENABLED ✅
if (enable_learning && scanData.success) {
  console.log('📚 Learning from scan results...');

  const learningResult = await callAgent('learning_assistant', {
    action: 'incorporate_feedback',
    feedback_type: 'scan_results',
    context: {
      scanner_type: filters?.scanner_type,
      filters: enhancedFilters,
      results_count: scanData.total_found,
      execution_time: scanData.execution_time
    }
  });

  // Agent learns:
  // - What scanner types work well
  // - What parameters produce results
  // - User preferences and patterns
  // - Stores in Archon knowledge base

  scanData.learned = true;
}
```

---

## 📋 Implementation Checklist

### **Step 1: Build Declarative Agents** ✅ DONE
- [x] Create code_analyzer.json
- [x] Create multi_pattern_scan_generator.json
- [x] Create intelligent_parameter_optimizer.json
- [x] Create compliance_validator.json
- [x] Create learning_assistant.json
- [x] Build all agents with CLI tool

### **Step 2: Create Agent Service Layer** TODO
- [ ] Create `AgentService.ts` to call Python agents
- [ ] Implement `callAgent(agentName, params)` function
- [ ] Add error handling and timeouts
- [ ] Implement agent health checks
- [ ] Add agent response caching

### **Step 3: Replace Current Services** TODO
- [ ] Replace `scannerGenerationService` with agent calls
- [ ] Replace `parameterMaster` with agent calls
- [ ] Replace `validationTestingService` with agent calls
- [ ] Update GlobalRenataAgent to use new agents
- [ ] Keep fallback to old services for safety

### **Step 4: Integrate into Scan Workflow** TODO
- [ ] Update `/api/systematic/scan/route.ts` Phase 1
- [ ] Update `/api/systematic/scan/route.ts` Phase 2
- [ ] Update `/api/systematic/scan/route.ts` Phase 4
- [ ] Enable Phase 5 learning
- [ ] Add agent progress reporting

### **Step 5: Create Orchestrator** TODO
- [ ] Design orchestrator agent config
- [ ] Build orchestrator agent
- [ ] Integrate into scan workflow
- [ ] Test orchestration flow
- [ ] Add error recovery

### **Step 6: Set Up Archon MCP** TODO
- [ ] Install and configure Archon MCP server
- [ ] Connect Neo4j knowledge base
- [ ] Test knowledge ingestion
- [ ] Verify knowledge retrieval
- [ ] Enable learning loop

---

## 🎯 Expected Benefits

### **Before (Current System)**

| Aspect | Current State |
|--------|--------------|
| **Tool Exposure** | ❌ No tools, private methods only |
| **LLM Integration** | ❌ Cannot be invoked by LLM |
| **Testability** | ❌ Hard to test individual methods |
| **Orchestration** | ❌ Fake orchestration (sequential calls) |
| **Learning** | ❌ Disabled |
| **Maintainability** | ❌ Monolithic agents |
| **Scalability** | ❌ Hard to add new capabilities |

### **After (Declarative Agent System)**

| Aspect | New System |
|--------|-----------|
| **Tool Exposure** | ✅ Clear tool-based API |
| **LLM Integration** | ✅ LLM can invoke tools directly |
| **Testability** | ✅ Each tool independently testable |
| **Orchestration** | ✅ True sub-agent orchestration |
| **Learning** | ✅ Archon integration enabled |
| **Maintainability** | ✅ Focused agents (5-10 tools each) |
| **Scalability** | ✅ Easy to add new tools/agents |

---

## 💡 Quick Win: Start with One Agent

**Recommendation**: Start by replacing just the CodeAnalyzerAgent

**Why**:
- Most direct mapping (our agent has 8 tools vs current 10+ methods)
- Self-contained impact
- Proves the concept
- Low risk

**Implementation**:
1. Build our Enhanced Code Analyzer agent ✅ Already done
2. Create simple agent service wrapper
3. Replace CodeAnalyzerAgent calls
4. Test thoroughly
5. Measure improvements
6. Then migrate other agents

---

## 📁 File Structure After Migration

```
projects/edge-dev-main/src/services/
├── renata/
│   ├── agents/                          # Old agents (keep for backup)
│   │   ├── CodeAnalyzerAgent.ts         # ← Will be deprecated
│   │   ├── CodeFormatterAgent.ts
│   │   └── ...
│   │
│   ├── agents-v2/                       # New declarative agents ⭐
│   │   ├── code_analyzer/
│   │   │   ├── enhanced__code__analyzer_agent.py
│   │   │   ├── Dockerfile
│   │   │   └── requirements.txt
│   │   │
│   │   ├── multi_pattern_scan_generator/
│   │   ├── intelligent_parameter_optimizer/
│   │   ├── compliance_validator/
│   │   └── learning_assistant/
│   │
│   ├── orchestrator/                    # New orchestrator ⭐
│   │   └── scan_workflow_orchestrator/
│   │
│   └── AgentService.ts                  # New service wrapper ⭐
│
└── [existing services remain for fallback]
```

---

## 🔧 Next Actions

### **Immediate (This Week)**

1. **Review Analysis** ✅ This document
2. **Discuss Approach** - Decide on migration strategy
3. **Choose Starting Point** - Recommend: CodeAnalyzerAgent
4. **Create AgentService** - Build simple wrapper
5. **Test Integration** - Start small, prove concept

### **Short-term (This Month)**

1. Migrate CodeAnalyzerAgent
2. Migrate Parameter Optimizer
3. Enable Phase 5 learning
4. Test thoroughly
5. Measure improvements

### **Long-term (Next Quarter)**

1. Migrate all agents
2. Implement orchestrator
3. Set up Archon MCP
4. Enable full learning loop
5. Optimize performance

---

## ✅ Summary

**Your Current System**:
- ✅ Has agent architecture
- ✅ Has scan workflow
- ❌ Agents don't have exposed tools
- ❌ No proper orchestration
- ❌ Learning disabled
- ❌ Hard to maintain and extend

**Our Solution**:
- ✅ 5 production-ready declarative agents
- ✅ Clear tool-based architecture
- ✅ Proper orchestration support
- ✅ Archon integration ready
- ✅ Easy to test and maintain
- ✅ Built from your actual code patterns

**Next Step**: Choose one agent to migrate first (recommend: CodeAnalyzerAgent)

---

**Status**: Ready to migrate when you are! 🚀
