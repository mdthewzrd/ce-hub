# Agent Coordination System - CE-Hub Workflow Integration

## Purpose
This document establishes the practical workflow system for utilizing all CE-Hub agents through the Task tool, ensuring systematic agent delegation and coordination for complex multi-step tasks.

## Agent Utilization Triggers

### Automatic Agent Delegation Patterns

When you encounter these task types, **automatically invoke** the appropriate specialist:

#### 1. Research Intelligence Specialist
**Trigger Conditions:**
- User asks "how to implement X" (needs research first)
- Complex technical questions requiring knowledge synthesis
- Need to understand existing patterns before implementation
- Gathering requirements or analyzing system architecture

**Invocation Pattern:**
```
Task(
  subagent_type="research-intelligence-specialist",
  description="Research and analyze topic",
  prompt="Conduct comprehensive research on [specific requirements]. Search the knowledge base for existing patterns, analyze current implementations, and provide actionable recommendations for [specific outcome]."
)
```

#### 2. Engineer Agent
**Trigger Conditions:**
- User requests feature implementation
- Code creation or modification needed
- System architecture development
- Technical solution implementation

**Invocation Pattern:**
```
Task(
  subagent_type="engineer-agent",
  description="Implement technical solution",
  prompt="Implement [specific feature/system] based on research findings. Create production-ready code with proper error handling, security measures, and integration capabilities. Follow CE-Hub coding standards and ensure comprehensive testing."
)
```

#### 3. Quality Assurance Tester
**Trigger Conditions:**
- Code implementation completed
- System validation required
- Security assessment needed
- Performance testing required

**Invocation Pattern:**
```
Task(
  subagent_type="quality-assurance-tester",
  description="Validate and test implementation",
  prompt="Conduct comprehensive testing of [implementation]. Perform functional testing, security validation, performance assessment, and integration testing. Provide detailed quality report with recommendations."
)
```

#### 4. Documenter Specialist
**Trigger Conditions:**
- Technical documentation needed
- Knowledge capture required
- API documentation needed
- User guides required

**Invocation Pattern:**
```
Task(
  subagent_type="documenter-specialist",
  description="Create comprehensive documentation",
  prompt="Create comprehensive documentation for [system/feature]. Include technical specifications, user guides, API documentation, and integration instructions. Ensure documentation is ready for knowledge graph ingestion."
)
```

#### 5. GUI Specialist
**Trigger Conditions:**
- User interface development needed
- React/CopilotKit integration required
- AI-enhanced UI components needed
- Frontend implementation required

**Invocation Pattern:**
```
Task(
  subagent_type="gui-specialist",
  description="Develop user interface",
  prompt="Develop user interface components for [feature]. Implement using React and CopilotKit patterns with proper accessibility, responsive design, and AI integration capabilities."
)
```

#### 6. CE-Hub Orchestrator
**Trigger Conditions:**
- Complex multi-phase projects
- Multiple agent coordination needed
- Large-scale system development
- Strategic initiatives requiring systematic coordination

**Invocation Pattern:**
```
Task(
  subagent_type="ce-hub-orchestrator",
  description="Coordinate complex project",
  prompt="Orchestrate comprehensive project for [objective]. Coordinate multiple specialist agents, manage timeline and milestones, ensure quality gates, and facilitate knowledge integration with Archon."
)
```

## Multi-Agent Workflow Patterns

### Sequential Agent Workflow
For complex tasks requiring multiple specialists in sequence:

1. **Research First**: Always start with research-intelligence-specialist
2. **Implementation**: Use engineer-agent or gui-specialist
3. **Validation**: Deploy quality-assurance-tester
4. **Documentation**: Conclude with documenter-specialist

### Parallel Agent Workflow
For independent tasks that can run simultaneously:

```
# Launch multiple agents in parallel
Task(subagent_type="research-intelligence-specialist", ...)
Task(subagent_type="engineer-agent", ...)
Task(subagent_type="gui-specialist", ...)
```

### Orchestrated Workflow
For complex projects requiring systematic coordination:

```
Task(
  subagent_type="ce-hub-orchestrator",
  description="Manage complex project",
  prompt="Coordinate [project name] through complete Plan → Research → Produce → Ingest cycle. Manage all specialist agents, ensure quality gates, and facilitate Archon integration."
)
```

## Task Breakdown Decision Matrix

| Task Type | Primary Agent | Secondary Agents | Coordination |
|-----------|---------------|------------------|--------------|
| New Feature Development | engineer-agent | research-intelligence-specialist, quality-assurance-tester, documenter-specialist | Sequential |
| UI Development | gui-specialist | research-intelligence-specialist, quality-assurance-tester | Sequential |
| System Analysis | research-intelligence-specialist | documenter-specialist | Sequential |
| Code Review & Testing | quality-assurance-tester | engineer-agent | Collaborative |
| Documentation Creation | documenter-specialist | All others for content | Collaborative |
| Complex Projects | ce-hub-orchestrator | All others as needed | Orchestrated |

## Implementation Guidelines

### For Claude Code Session Workflows

1. **Always Assess Complexity First**
   - Simple tasks: Handle directly
   - Medium tasks: Delegate to 1-2 specialists
   - Complex tasks: Use ce-hub-orchestrator

2. **Use Proper Agent Delegation**
   - Don't implement directly if agents can handle it better
   - Always provide specific, actionable prompts
   - Include context and expected outcomes

3. **Coordinate Agent Handoffs**
   - Ensure research findings feed into implementation
   - Pass implementation artifacts to testing
   - Coordinate all outputs for documentation

4. **Track and Monitor Progress**
   - Use TodoWrite for overall task tracking
   - Monitor agent outputs and completion
   - Ensure proper knowledge capture

## Success Indicators

### Agent Utilization Success
- Specialist agents are regularly invoked for appropriate tasks
- Task complexity drives proper agent selection
- Workflows show clear agent coordination and handoffs

### Quality Outcomes
- Research informs implementation decisions
- Code meets quality standards through testing
- Documentation captures knowledge effectively
- Complex projects complete successfully with orchestration

### System Learning
- Knowledge flows back to Archon knowledge graph
- Patterns emerge from successful agent collaborations
- Workflows improve through iteration and learning

## Troubleshooting Agent Issues

### Agent Not Responding
- Check agent invocation syntax
- Verify subagent_type matches available agents
- Ensure prompt is specific and actionable

### Poor Agent Coordination
- Use ce-hub-orchestrator for complex coordination
- Provide clear handoff instructions between agents
- Monitor agent outputs for proper context transfer

### Incomplete Tasks
- Break down complex tasks into smaller, specific subtasks
- Provide clear success criteria and expected outputs
- Use sequential workflows for dependent tasks

This system ensures that CE-Hub agents are actively utilized in workflows rather than being dormant documentation.