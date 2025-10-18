# Automatic Agent Delegation System

## Purpose
Configure Claude to automatically invoke appropriate specialist agents based on request patterns, eliminating the need for manual agent selection.

## Automatic Delegation Rules

Claude should automatically trigger these agents when it detects these patterns in user requests:

### 1. Research-Intelligence-Specialist (AUTO-TRIGGER)

**Trigger Patterns:**
- User asks "How do I..." or "What's the best way to..."
- Questions about implementing features they haven't built before
- Requests for analysis of existing systems or codebases
- Questions about best practices or architectural decisions
- "Help me understand..." or "I need to research..."

**Auto-Delegation Logic:**
```
If (user_request.contains("how to", "best way", "research", "analyze", "understand", "patterns")
    OR task_complexity = "complex"
    OR requires_knowledge_synthesis) {

    AUTOMATICALLY_INVOKE:
    Task(subagent_type="research-intelligence-specialist", ...)
}
```

### 2. Engineer-Agent (AUTO-TRIGGER)

**Trigger Patterns:**
- "Implement...", "Build...", "Create...", "Add feature..."
- Code creation or modification requests
- System integration tasks
- API development requests
- Database schema creation

**Auto-Delegation Logic:**
```
If (user_request.contains("implement", "build", "create", "code", "develop")
    AND requires_technical_implementation) {

    AUTOMATICALLY_INVOKE:
    Task(subagent_type="engineer-agent", ...)
}
```

### 3. GUI-Specialist (AUTO-TRIGGER)

**Trigger Patterns:**
- UI/frontend development requests
- React component creation
- "Design a..." interface/component
- AI-enhanced UI features
- User experience improvements

**Auto-Delegation Logic:**
```
If (user_request.contains("UI", "interface", "component", "frontend", "design")
    OR mentions("React", "CopilotKit", "user interface")) {

    AUTOMATICALLY_INVOKE:
    Task(subagent_type="gui-specialist", ...)
}
```

### 4. Quality-Assurance-Tester (AUTO-TRIGGER)

**Trigger Patterns:**
- After engineer-agent completes implementation
- "Test...", "Validate...", "Check security..."
- Performance issue investigation
- Bug fixing requests

**Auto-Delegation Logic:**
```
If (implementation_completed
    OR user_request.contains("test", "validate", "security", "performance", "bug")
    OR quality_validation_needed) {

    AUTOMATICALLY_INVOKE:
    Task(subagent_type="quality-assurance-tester", ...)
}
```

### 5. Documenter-Specialist (AUTO-TRIGGER)

**Trigger Patterns:**
- After major implementation completion
- "Document...", "Create docs for..."
- API documentation requests
- User guide creation requests

**Auto-Delegation Logic:**
```
If (project_completion_phase
    OR user_request.contains("document", "docs", "guide", "documentation")
    OR knowledge_capture_needed) {

    AUTOMATICALLY_INVOKE:
    Task(subagent_type="documenter-specialist", ...)
}
```

### 6. CE-Hub-Orchestrator (AUTO-TRIGGER)

**Trigger Patterns:**
- Complex multi-step projects
- Requests involving multiple technologies/components
- Large-scale feature development
- Strategic planning requests

**Auto-Delegation Logic:**
```
If (task_complexity = "very_complex"
    OR requires_multiple_agents
    OR user_request.contains("project", "system", "build app", "full implementation")) {

    AUTOMATICALLY_INVOKE:
    Task(subagent_type="ce-hub-orchestrator", ...)
}
```

## Decision Tree for Automatic Delegation

```
User Request → Claude Analysis:

├── Simple task (1-2 steps)?
│   └── Handle directly
│
├── Research/Analysis needed?
│   └── AUTO: research-intelligence-specialist
│
├── Implementation required?
│   ├── UI/Frontend? → AUTO: gui-specialist
│   ├── Backend/Code? → AUTO: engineer-agent
│   └── Testing needed? → AUTO: quality-assurance-tester
│
├── Complex multi-phase project?
│   └── AUTO: ce-hub-orchestrator
│
└── Documentation needed?
    └── AUTO: documenter-specialist
```

## Implementation Strategy

### Phase 1: Research-First Pattern
For any implementation request:
1. **Always start with research** (unless very simple)
2. **Then delegate to appropriate implementation agent**
3. **Follow up with testing if needed**
4. **Conclude with documentation for knowledge capture**

### Phase 2: Complexity Assessment
```
Simple (handle directly):
- File reads
- Simple edits
- Basic questions

Medium (1-2 agents):
- Feature implementation
- Bug fixes
- Documentation creation

Complex (orchestrator):
- Multi-component systems
- Full application development
- Integration projects
```

### Phase 3: Automatic Workflow Patterns

**Pattern A: Feature Development**
```
User: "Add user authentication to my app"

Claude automatically:
1. Task(subagent_type="research-intelligence-specialist", ...) # Research auth patterns
2. Task(subagent_type="engineer-agent", ...)                   # Implement auth system
3. Task(subagent_type="quality-assurance-tester", ...)        # Security testing
4. Task(subagent_type="documenter-specialist", ...)           # Document implementation
```

**Pattern B: Complex Project**
```
User: "Build a dashboard with AI features and user management"

Claude automatically:
1. Task(subagent_type="ce-hub-orchestrator", ...)  # Coordinates entire project
   # Orchestrator then delegates to all needed specialists
```

**Pattern C: Analysis Request**
```
User: "What's wrong with my app's performance?"

Claude automatically:
1. Task(subagent_type="research-intelligence-specialist", ...)  # Analyze performance issues
2. Task(subagent_type="engineer-agent", ...)                    # Implement optimizations
3. Task(subagent_type="quality-assurance-tester", ...)         # Validate improvements
```

## Success Indicators

### User Experience
- Users never need to manually specify which agent to use
- Complex requests are automatically broken down appropriately
- Quality remains high through specialist expertise
- Knowledge is captured automatically

### System Behavior
- Claude proactively delegates to specialists
- Appropriate agents are selected based on task characteristics
- Workflows flow seamlessly between agents
- All work contributes to knowledge graph enhancement

## Emergency Override

Users can still manually specify agents if needed:
```
User: "Use the engineer-agent to implement X"
Claude: [follows manual instruction]
```

But the default behavior should be automatic, intelligent delegation based on request analysis.

This system ensures that specialist agents are used automatically without requiring users to understand the delegation system.