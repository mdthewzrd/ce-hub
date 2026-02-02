# EdgeDev AI Agent - System Prompts Quick Reference

This directory contains system prompts for all AI agents in the EdgeDev ecosystem.

## Agent Overview

| Agent | File | Purpose | Key Expertise |
|-------|------|---------|---------------|
| **Orchestrator** | `orchestrator.md` | Main coordinator | Routing, workflow management, quality gates |
| **Scanner Builder** | `scanner_builder.md` | Scanner development | V31 architecture, pattern detection |
| **Strategy Builder** | `strategy_builder.md` | Strategy design | Complete execution systems, risk management |
| **Backtest Builder** | `backtest_builder.md` | Backtesting | Validation, performance analysis |
| **Optimizer** | `optimizer.md` | Parameter tuning | Grid search, walk-forward, overfitting prevention |
| **Validator** | `validator.md` | Quality assurance | Code review, standards compliance |
| **Trading Advisor** | `trading_advisor.md` | Trading insights | Edge assessment, market analysis |

## Usage

### Loading a System Prompt

```python
from pathlib import Path

def load_agent_prompt(agent_name: str) -> str:
    """Load system prompt for an agent."""
    prompt_file = Path(__file__).parent / f"{agent_name}.md"
    return prompt_file.read_text()

# Example
orchestrator_prompt = load_agent_prompt("orchestrator")
scanner_prompt = load_agent_prompt("scanner_builder")
```

### Prompt Structure

Each prompt follows this structure:

1. **Role** - Agent's identity and purpose
2. **Core Responsibilities** - Primary duties
3. **Knowledge Domain** - Expertise area
4. **Input Handling** - How to process user requests
5. **Output Format** - Expected response structure
6. **Quality Standards** - Requirements for outputs
7. **Constraints** - Limitations and guidelines
8. **Response Format** - How to present results

## Agent Workflows

### Scanner Development Workflow
```
User → Orchestrator → Scanner Builder → Validator → User
                              ↓
                        Archon (retrieve patterns)
                              ↓
                        Archon (store scanner)
```

### Complete Strategy Development
```
User → Orchestrator → Strategy Builder → Backtest Builder → Optimizer → Validator → User
                                                         ↓
                                                   Archon (learnings)
```

### Analysis & Advisory
```
User → Orchestrator → Trading Advisor → (optional) Backtest Builder → User
                              ↓
                        Archon (historical context)
```

## Quick Agent Reference

### Orchestrator
**When to use**: All user requests first go through Orchestrator
**Key functions**:
- Route requests to appropriate specialist
- Query Archon for context
- Manage workflow execution
- Present results to users

### Scanner Builder
**When to use**: Creating or modifying trading scanners
**Key functions**:
- Build V31-compliant scanners
- Implement pattern detection logic
- Ensure code quality

### Strategy Builder
**When to use**: Designing complete trading strategies
**Key functions**:
- Specify entry/exit rules
- Design position sizing
- Configure pyramiding, stops, targets
- Plan capital management

### Backtest Builder
**When to use**: Validating strategies with historical data
**Key functions**:
- Configure backtest parameters
- Run simulations
- Analyze performance metrics
- Identify biases

### Optimizer
**When to use**: Improving strategy parameters
**Key functions**:
- Grid/random search
- Walk-forward analysis
- Overfitting detection
- Robustness testing

### Validator
**When to use**: Reviewing code or strategies
**Key functions**:
- Check V31 compliance
- Validate code quality
- Assess risk management
- Provide actionable feedback

### Trading Advisor
**When to use**: Getting trading insights
**Key functions**:
- Analyze market regimes
- Assess strategy edge
- Recommend position sizing
- Provide risk analysis

## Integration with Archon

All agents reference Archon knowledge base:

1. **Before acting**: Query Archon for relevant knowledge
2. **While acting**: Reference retrieved patterns and examples
3. **After acting**: Store learnings and results back to Archon

## Modification Guidelines

When updating prompts:

1. **Maintain structure** - Keep consistent format across agents
2. **Update references** - Ensure Gold Standards are correctly referenced
3. **Test thoroughly** - Verify prompts produce desired outputs
4. **Version control** - Track changes to understand what works
5. **Document changes** - Note why modifications were made

## Prompt Template

For creating new agents, use this template:

```markdown
# [Agent Name] - System Prompt

## Role
You are the **[Agent Name]** for the EdgeDev AI Agent system...

## Core Responsibilities
1. ...
2. ...

## Knowledge Domain
...

## Input Handling
...

## Output Format
...

## Quality Standards
...

## Constraints
...
```

## Related Documentation

- **Gold Standards**: `/Users/michaeldurante/ai dev/ce-hub/EDGEDEV_*.md`
- **Build Plan**: `/Users/michaeldurante/ai dev/ce-hub/EDGEDEV_BUILD_PLAN.md`
- **Main README**: `/Users/michaeldurante/ai dev/ce-hub/edge-dev-ai-agent/README.md`
