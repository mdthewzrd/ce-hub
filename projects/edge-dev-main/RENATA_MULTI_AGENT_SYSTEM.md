# 🤖 Renata Multi-Agent System

## Overview

Renata has been upgraded from a monolithic AI agent to a **multi-agent orchestration system** using the CE-Hub Pydantic AI framework. Each specialized agent handles a specific aspect of code transformation, working together seamlessly.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Renata Orchestrator (Coordinator)              │
│                   - Routes tasks to agents                   │
│                   - Manages workflow                        │
│                   - Aggregates results                      │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Analyzer   │   │  Formatter   │   │   Parameter  │
│     Agent     │   │    Agent     │   │  Extractor   │
│              │   │              │   │    Agent     │
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Validator  │   │  Optimizer   │   │Documentation │
│     Agent     │   │    Agent     │   │    Agent     │
│              │   │              │   │              │
└──────────────┘   └──────────────┘   └──────────────┘
```

## Agent Specializations

### 🔍 Code Analyzer Agent
**Purpose:** Analyze code structure and patterns
**Tasks:**
- Detect scanner type (Backside B, LC, Multi-pattern, Custom)
- Identify code structure (methods, classes, patterns)
- Calculate metrics (lines, methods, parameters, complexity)
- Identify issues and suggest improvements

**Output:** `CodeAnalysisResult`

### ✨ Code Formatter Agent
**Purpose:** Transform code to EdgeDev v31 standards
**Tasks:**
- Apply V31 structure transformations
- Fix method names and signatures
- Correct variable naming conventions
- Remove deprecated methods
- Integrate with Pydantic AI backend for intelligent transformation

**Output:** `FormatResult`

### 🔧 Parameter Extractor Agent
**Purpose:** Extract and preserve parameters during transformation
**Tasks:**
- Parse ScannerConfig class
- Extract parameter names and values
- Maintain parameter integrity
- Reconstruct parameters in transformed code

**Output:** `ParameterExtractionResult`

### ✅ Validator Agent
**Purpose:** Validate code against EdgeDev v31 standards
**Tasks:**
- Check for required V31 components
- Validate naming conventions
- Verify structure compliance
- Calculate compliance score
- Generate recommendations

**Output:** `ValidationResult`

### ⚡ Optimizer Agent
**Purpose:** Optimize code for performance
**Tasks:**
- Vectorize operations
- Prevent lookahead bias
- Optimize imports
- Add min_periods to rolling windows

**Output:** `OptimizationResult`

### 📝 Documentation Agent
**Purpose:** Add comprehensive documentation
**Tasks:**
- Add module docstrings
- Document methods and parameters
- Generate inline comments
- Create usage examples

**Output:** `DocumentationResult`

## Usage

### Basic Usage

```typescript
import { renataOrchestrator } from '@/services/renata/agents';

const result = await renataOrchestrator.processCodeTransformation(code, {
  transformationType: 'v31_standard',
  preserveParameters: true,
  addDocumentation: true,
  optimizePerformance: true,
  validateOutput: true
});

console.log(result.transformedCode);
console.log(result.summary);
```

### Chat Endpoint

```typescript
// POST /api/renata/chat
const response = await fetch('/api/renata/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Transform this code to V31 standards:\n```python\n...\n```'
  })
});

const { message, data, summary } = await response.json();
```

## Workflow Example

```
User Input: "Transform my scanner to V31 standards"
    ↓
1. 🔍 Analyzer analyzes code structure
2. 🔧 Parameter Extractor preserves parameters
3. ✨ Formatter transforms to V31
4. ⚡ Optimizer improves performance
5. 📝 Documentation adds docs
6. ✅ Validator validates output
    ↓
Result: Transformed code with 90%+ V31 compliance
```

## Advantages Over Monolithic Agent

✅ **Specialization** - Each agent excels at its specific task
✅ **Parallel Processing** - Agents can work simultaneously
✅ **Modularity** - Easy to add/remove/update agents
✅ **Debugging** - Clear agent responsibility
✅ **Scalability** - Easy to scale with new agents
✅ **Quality** - Higher quality transformations through specialization

## Configuration

### Agent Priority

Tasks can be prioritized:
- **High**: Analyzer, Formatter, Validator
- **Medium**: Optimizer
- **Low**: Documentation

### Pydantic AI Backend

The Formatter Agent integrates with Pydantic AI backend (localhost:8001) for intelligent code transformation. If unavailable, it falls back to rule-based transformation.

## API Endpoints

### Multi-Agent Chat
```
POST /api/renata/chat
Content-Type: application/json

{
  "message": "Transform this code...",
  "context": {}
}
```

### Execute Single Task
```typescript
const result = await renataOrchestrator.executeTask({
  type: 'analyze',
  code: '...',
  priority: 'high'
});
```

### System Health
```typescript
const health = renataOrchestrator.getSystemHealth();
// Returns status of orchestrator and all agents
```

## File Structure

```
src/services/renata/agents/
├── index.ts                      # Export all agents
├── RenataOrchestrator.ts        # Main coordinator
├── CodeAnalyzerAgent.ts          # Code analysis
├── CodeFormatterAgent.ts         # V31 transformation
├── ParameterExtractorAgent.ts    # Parameter preservation
├── ValidatorAgent.ts             # V31 validation
├── OptimizerAgent.ts             # Performance optimization
└── DocumentationAgent.ts         # Documentation generation
```

## Extension

Adding a new agent:

1. Create agent class in `agents/` directory
2. Implement `execute()` method returning `AgentResult`
3. Add to orchestrator constructor
4. Update `index.ts` exports
5. Add workflow step in `processCodeTransformation()`

Example:
```typescript
export class CustomAgent {
  async execute(code: string, options: any): Promise<AgentResult> {
    // Implementation
    return {
      success: true,
      agentType: 'custom',
      data: result,
      executionTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  }
}
```

## Performance

Typical workflow execution time:
- Simple code: ~2-3 seconds
- Complex code: ~5-10 seconds
- With AI backend: ~10-15 seconds

## Future Enhancements

- [ ] WebSocket streaming for real-time progress
- [ ] Agent-specific configuration
- [ ] Custom agent workflows
- [ ] Agent performance metrics
- [ ] Distributed agent execution
- [ ] Agent learning and adaptation
