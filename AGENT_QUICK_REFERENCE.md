# 🚀 Agent System Quick Reference

**Complete Guide to Building Focused AI Agents**

---

## TL;DR

**Your Problem**: Agents trying to do too much (20-50 tools) → LLM confusion, hard to maintain

**Solution**: Break into focused sub-agents (5-10 tools each) + orchestrator

**Examples Created**: 12 total (2 simple + 5 sub-agents + 5 project-based)

---

## Decision Framework: Tools vs Sub-Agents

```
Need ≤ 10 capabilities in ONE domain?
  YES → Single Agent with Multiple Tools
  NO  → Multiple Sub-Agents + Orchestrator
```

### Examples:

**Single Agent** (1 domain, ≤10 tools):
- Data Analyzer: 7 tools for statistical analysis ✅
- Code Analyzer: 8 tools for code analysis ✅

**Multiple Sub-Agents** (multiple domains):
- Trading System: 33 capabilities across 4 agents ✅
  - Code Analysis Agent (8 tools)
  - Scan Generator (9 tools)
  - Parameter Optimizer (7 tools)
  - Orchestrator (6 tools)

---

## All Examples Created

### Simple Agents (2)
1. **Simple Chatbot** (3 tools) - Basic Q&A
2. **Data Analyzer** (7 tools) - Statistical analysis

### Sub-Agent System (5)
3. **Trading Orchestrator** (6 tools) - Coordinates specialists
4. **Scan Creator** (7 tools) - Creates trading scanners
5. **Backtest Generator** (6 tools) - Runs backtests
6. **Parameter Optimizer** (5 tools) - Optimizes parameters
7. **Pattern Analyzer** (7 tools) - Analyzes patterns

### Project-Based Agents (5) ⭐ **BASED ON YOUR PROJECTS**
8. **Enhanced Code Analyzer** (8 tools) - RENATA-based analysis
9. **Multi-Pattern Scan Generator** (9 tools) - Pattern library integration
10. **Intelligent Parameter Optimizer** (7 tools) - Performance optimization
11. **Automated Compliance Validator** (8 tools) - V31 standards checking
12. **Learning-Powered Assistant** (10 tools) - Enhanced Renata with learning

---

## How to Build Your Own Agents

### Step 1: Create JSON Config

```bash
# Copy an example template
cp core-v2/agent_framework/declarative/examples/code_analyzer.json my_agent.json
```

### Step 2: Edit the JSON

```json
{
  "agent": {
    "name": "My Agent",
    "description": "What this agent does",
    "max_tools": 8,  // Keep ≤ 10!
    "system_prompt": {
      "role": "You are a specialist in...",
      "responsibilities": ["What you do", "What you don't do"],
      "guidelines": ["How to work"],
      "constraints": ["Limits and boundaries"]
    },
    "tools": [
      {
        "name": "my_tool",
        "description": "What this tool does",
        "type": "analysis/creation/validation/etc.",
        "parameters": {
          "input": {
            "type": "str",
            "description": "Input description",
            "required": true
          }
        }
      }
    ],
    "rag": {
      "enabled": true,  // or false
      "vector_db": "neo4j",  // or "chroma"
      "collection_name": "my_knowledge"
    }
  }
}
```

### Step 3: Build the Agent

```bash
python core-v2/cli.py build-agent my_agent.json -o ./my_agent --docker
```

### Step 4: Run the Agent

```bash
cd ./my_agent
python my__agent_agent.py
```

---

## Tool Types Reference

| Type | Purpose | Examples |
|------|---------|----------|
| `analysis` | Analyze data/code | analyze_code, detect_pattern |
| `creation` | Create content/code | generate_scanner, create_report |
| `validation` | Check compliance | validate_v31, check_constraints |
| `calculation` | Compute results | simulate_performance, calculate_metrics |
| `retrieval` | Fetch information | retrieve_history, query_knowledge |
| `planning` | Plan approach | design_optimization_strategy |
| `delegation` | Delegate to sub-agents | delegate_to_scan_creator |
| `learning` | Learn and adapt | learn_preference, incorporate_feedback |
| `assistance` | Help users | provide_assistance, recommend |
| `context_management` | Maintain context | maintain_conversation_context |

---

## Your Real-World Use Cases

### Code Analysis Workflow

```bash
cd examples/project_agents/code_analyzer
python enhanced__code__analyzer_agent.py
```

**Query**: "Analyze this scanner code for V31 compliance and pattern detection"

**Result**: Comprehensive analysis with pattern identification, compliance status, recommendations

---

### Scanner Creation Workflow

```bash
cd examples/project_agents/multi_pattern_scan_generator
python multi-_pattern__scan__generator_agent.py
```

**Query**: "Create a backside_b scanner with gap_threshold 2.0 and volume_multiplier 1.5"

**Result**: Production-ready V31-compliant scanner with tests and documentation

---

### Parameter Optimization Workflow

```bash
cd examples/project_agents/intelligent_parameter_optimizer
python intelligent__parameter__optimizer_agent.py
```

**Query**: "Optimize gap_threshold and volume_multiplier to maximize Sharpe ratio"

**Result**: Optimal parameters with out-of-sample validation and sensitivity analysis

---

### Compliance Validation Workflow

```bash
cd examples/project_agents/compliance_validator
python automated__compliance__validator_agent.py
```

**Query**: "Validate this scanner against all V31 standards"

**Result**: Detailed compliance report with actionable recommendations

---

### Personalized Assistance Workflow

```bash
cd examples/project_agents/learning_assistant
python learning-_powered__assistant_agent.py
```

**Query**: "What gap scanner patterns worked well for similar trading styles?"

**Result**: Personalized recommendations based on your history and Archon knowledge

---

## Integration with Your Existing Systems

### RENATA TypeScript Integration

```typescript
// Use as drop-in enhancements
import { EnhancedCodeAnalyzer } from './examples/project_agents/code_analyzer';
import { MultiPatternScanGenerator } from './examples/project_agents/multi_pattern_scan_generator';

// Or use orchestrator to coordinate
import { TradingOrchestrator } from './examples/sub_agents/trading_orchestrator';
```

### PydanticAI Python Integration

```python
# Direct replacements
from enhanced_code_analyzer_agent import EnhancedCodeAnalyzerAgent
from multi_pattern_scan_generator_agent import MultiPatternScanGeneratorAgent
from intelligent_parameter_optimizer_agent import IntelligentParameterOptimizerAgent
```

---

## Common Patterns

### Pattern 1: Analysis → Validation → Creation

```
Code Analyzer (8 tools)
    ↓ "Analyzes existing code"
Compliance Validator (8 tools)
    ↓ "Ensures standards met"
Multi-Pattern Scan Generator (9 tools)
    ↓ "Creates new code"
Code Analyzer (validates creation)
```

### Pattern 2: Creation → Optimization → Validation

```
Scan Generator (9 tools)
    ↓ "Creates scanner"
Parameter Optimizer (7 tools)
    ↓ "Optimizes parameters"
Backtest Generator (6 tools)
    ↓ "Validates performance"
Compliance Validator (ensures quality)
```

### Pattern 3: Continuous Learning

```
Learning Assistant (10 tools)
    ↓ "Provides personalized help"
Learns from feedback
    ↓ "Incorporates corrections"
Archon knowledge integration
    ↓ "Queries knowledge graph"
Improves recommendations
```

---

## Key Benefits

### Before (Monolithic Agents)
- ❌ 20-50 tools per agent
- ❌ LLM confusion from tool overload
- ❌ Hard to maintain and test
- ❌ No reusability

### After (Focused Sub-Agents)
- ✅ 5-10 tools per agent
- ✅ Clear, focused responsibilities
- ✅ Easy to test and maintain
- ✅ Highly reusable
- ✅ Can parallelize independent tasks

---

## Quick Commands

```bash
# Build an agent
python core-v2/cli.py build-agent config.json -o ./agent_name --docker

# Run an agent
cd ./agent_name
python agent__name_agent.py

# Test an agent
python test_agent__name_agent.py

# Docker deployment
docker-compose up -d
```

---

## File Locations

```
core-v2/agent_framework/declarative/examples/
├── simple_chatbot.json
├── data_analyzer.json
├── trading_orchestrator.json
├── scan_creator.json
├── backtest_generator.json
├── parameter_optimizer.json
├── code_analyzer.json              ⭐ Your projects
├── multi_pattern_scan_generator.json ⭐ Your projects
├── intelligent_parameter_optimizer.json ⭐ Your projects
├── compliance_validator.json        ⭐ Your projects
└── learning_assistant.json          ⭐ Your projects

examples/
├── simple_agents/
│   ├── simple_chatbot/
│   └── data_analyzer/
├── sub_agents/
│   ├── trading_orchestrator/
│   ├── scan_creator/
│   ├── backtest_generator/
│   └── parameter_optimizer/
└── project_agents/                 ⭐ Your projects
    ├── code_analyzer/
    ├── multi_pattern_scan_generator/
    ├── intelligent_parameter_optimizer/
    ├── compliance_validator/
    └── learning_assistant/
```

---

## Documentation

- **SUB_AGENT_EXAMPLES_COMPLETE.md** - Sub-agent system examples
- **PROJECT_AGENT_EXAMPLES_COMPLETE.md** - Your project-based examples
- **AGENT_QUICK_REFERENCE.md** - This file

---

## Checklist

When creating agents:

- [ ] Define clear, focused responsibility (≤10 tools)
- [ ] Choose appropriate tool types
- [ ] Set realistic constraints
- [ ] Enable RAG if knowledge retrieval needed
- [ ] Include validation rules
- [ ] Build and test the agent
- [ ] Create documentation
- [ ] Add Docker support for deployment

---

## Success Metrics

✅ **All Agents**:
- Stay within 10-tool limit
- Have focused responsibilities
- Are independently testable
- Include comprehensive documentation
- Support Docker deployment

✅ **Your Project Agents**:
- Based on your actual implementations
- Use your proven patterns
- Enforce your V31 standards
- Integrate with Archon knowledge
- Support your hybrid AI approach

---

## Need Help?

**Explore Examples**:
```bash
cd examples/project_agents/code_analyzer
cat README.md
python enhanced__code__analyzer_agent.py
```

**Create Custom Agent**:
```bash
cp core-v2/agent_framework/declarative/examples/code_analyzer.json my_agent.json
# Edit my_agent.json
python core-v2/cli.py build-agent my_agent.json -o ./my_agent --docker
```

**Learn More**:
- Read `PROJECT_AGENT_EXAMPLES_COMPLETE.md` for detailed explanations
- Study JSON configs in `core-v2/agent_framework/declarative/examples/`
- Explore generated code in `examples/` directories

---

**Status**: ✅ Complete agent ecosystem ready for production use!
