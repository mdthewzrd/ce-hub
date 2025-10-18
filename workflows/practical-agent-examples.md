# Practical Agent Workflow Examples

## Real-World Agent Utilization Patterns

These examples show exactly how to break down common requests into agent workflows that actually get used.

## Example 1: "Add Authentication to My App"

### Old Approach (No Agents Used)
User asks → Claude tries to implement everything directly → Mixed results

### New Agent Workflow Approach

**Step 1: Research First**
```
Task(
  subagent_type="research-intelligence-specialist",
  description="Research authentication patterns",
  prompt="Research authentication implementation patterns for web applications. Search the knowledge base for existing auth systems, analyze security best practices, and identify the most suitable approach for a modern web app. Focus on JWT, OAuth, and session management patterns."
)
```

**Step 2: Implementation**
```
Task(
  subagent_type="engineer-agent",
  description="Implement authentication system",
  prompt="Based on the research findings, implement a secure authentication system. Include user registration, login, JWT token management, password hashing, and session handling. Ensure defensive security practices and proper error handling."
)
```

**Step 3: Quality Validation**
```
Task(
  subagent_type="quality-assurance-tester",
  description="Test authentication security",
  prompt="Conduct comprehensive security testing of the authentication system. Test for common vulnerabilities like SQL injection, XSS, CSRF, weak passwords, and session hijacking. Validate all security measures and provide a security assessment report."
)
```

**Step 4: Documentation**
```
Task(
  subagent_type="documenter-specialist",
  description="Document authentication system",
  prompt="Create comprehensive documentation for the authentication system including API endpoints, security measures, setup instructions, and troubleshooting guides. Prepare documentation for knowledge graph ingestion."
)
```

## Example 2: "Build a Dashboard with AI Features"

### Complex Project - Use Orchestrator

```
Task(
  subagent_type="ce-hub-orchestrator",
  description="Coordinate AI dashboard project",
  prompt="Orchestrate the development of an AI-enhanced dashboard through complete Plan → Research → Produce → Ingest cycle. Coordinate research on dashboard patterns and AI integration, manage UI development with AI features, ensure quality testing, and facilitate knowledge capture. The dashboard should include data visualization, AI-powered insights, and interactive components."
)
```

The orchestrator will automatically delegate to:
- Research agent for dashboard patterns and AI integration approaches
- GUI specialist for React/CopilotKit implementation
- Engineer agent for backend data processing
- Quality assurance for comprehensive testing
- Documenter for knowledge capture

## Example 3: "Fix Performance Issues in My Code"

### Sequential Agent Workflow

**Step 1: Analyze the Problem**
```
Task(
  subagent_type="research-intelligence-specialist",
  description="Analyze performance bottlenecks",
  prompt="Analyze the codebase for performance issues. Search for performance optimization patterns, identify common bottlenecks in similar applications, and recommend specific optimization strategies. Focus on database queries, API calls, and frontend rendering performance."
)
```

**Step 2: Implement Optimizations**
```
Task(
  subagent_type="engineer-agent",
  description="Implement performance optimizations",
  prompt="Implement the performance optimizations identified in the research phase. Optimize database queries, implement caching strategies, improve API response times, and enhance frontend rendering. Ensure all changes maintain security and functionality."
)
```

**Step 3: Validate Improvements**
```
Task(
  subagent_type="quality-assurance-tester",
  description="Validate performance improvements",
  prompt="Conduct comprehensive performance testing to validate the optimizations. Measure response times, throughput, resource utilization, and user experience metrics. Compare before/after performance and provide detailed analysis."
)
```

## Example 4: "Create User Onboarding Flow with AI Assistance"

### GUI-Focused Workflow

**Step 1: Research UX Patterns**
```
Task(
  subagent_type="research-intelligence-specialist",
  description="Research onboarding UX patterns",
  prompt="Research user onboarding best practices and AI-enhanced user experience patterns. Analyze successful onboarding flows, AI assistance integration, and user engagement strategies. Provide recommendations for an intuitive onboarding experience."
)
```

**Step 2: Develop AI-Enhanced UI**
```
Task(
  subagent_type="gui-specialist",
  description="Build AI-assisted onboarding flow",
  prompt="Develop an AI-enhanced user onboarding flow using React and CopilotKit. Create interactive components with AI assistance, progress tracking, personalized guidance, and responsive design. Implement accessibility features and smooth user interactions."
)
```

**Step 3: Test User Experience**
```
Task(
  subagent_type="quality-assurance-tester",
  description="Test onboarding user experience",
  prompt="Conduct comprehensive UX testing of the onboarding flow. Test usability, accessibility, AI assistance effectiveness, and user journey completion rates. Validate cross-device compatibility and provide UX improvement recommendations."
)
```

## Example 5: "Integrate with External API"

### Simple Task - Direct Agent Use

```
Task(
  subagent_type="engineer-agent",
  description="Integrate external API",
  prompt="Integrate with [specific API name] for [specific functionality]. Implement secure API authentication, error handling, rate limiting, and data processing. Include comprehensive testing and documentation of the integration."
)
```

## When to Use Which Pattern

### Use Research-Intelligence-Specialist When:
- User asks "how to" questions
- Need to understand existing patterns
- Complex technical decisions required
- System architecture analysis needed

### Use Engineer-Agent When:
- Implementation work required
- Code creation or modification needed
- Technical integration tasks
- System configuration needed

### Use GUI-Specialist When:
- Frontend/UI development needed
- React components required
- AI-enhanced interfaces needed
- User experience implementation

### Use Quality-Assurance-Tester When:
- Testing and validation required
- Security assessment needed
- Performance validation required
- Quality gates needed

### Use Documenter-Specialist When:
- Documentation creation needed
- Knowledge capture required
- API documentation needed
- User guides required

### Use CE-Hub-Orchestrator When:
- Complex multi-phase projects
- Multiple agents needed
- Large-scale developments
- Strategic coordination required

## Agent Coordination Best Practices

### 1. Always Start with Research for Complex Tasks
Don't jump straight to implementation. Use research agent first to understand the problem space.

### 2. Use Sequential Workflows for Dependent Tasks
Research → Implementation → Testing → Documentation

### 3. Use Parallel Workflows for Independent Tasks
Multiple agents working on different aspects simultaneously.

### 4. Use Orchestrator for Complex Coordination
When you need 3+ agents or complex milestone management.

### 5. Provide Specific, Actionable Prompts
Bad: "Help with authentication"
Good: "Research JWT implementation patterns for Node.js applications with security best practices"

### 6. Include Context and Expected Outcomes
Always tell agents what you expect them to deliver and how it fits into the larger workflow.

This system ensures your agents are actively working on real tasks instead of sitting unused!