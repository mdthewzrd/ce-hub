# Cole Medin's (Ottomator) Complete Tech Stack & Workflow - Comprehensive Research Report

**Research Date**: January 11, 2026
**Source**: "The ONLY AI Tech Stack You Need in 2026" video + extensive analysis of Cole's ecosystem
**Researcher**: Comprehensive multi-source analysis

---

## Executive Summary

**Cole Medin** is a leading AI agent developer, educator, and founder of **oTTomator** (Live Agent Studio platform). His tech stack represents a modern, AI-first approach to building intelligent systems that combines:

- **Pydantic AI** for structured data validation
- **LangGraph** for workflow orchestration
- **Local AI deployment** via Ollama
- **Modern data infrastructure** (PostgreSQL, Supabase, Neon, Redis)
- **Observability** via Langfuse
- **Browser automation** via Browserbase
- **Tool integration** via MCP (Model Context Protocol)

This stack is designed for **agentic AI development** - building systems that can reason, use tools, remember context, and continuously improve.

**Key Philosophy**: "The perfect agent doesn't exist on day one. The successful agent is the one that gets built, tested, and improved over time."

---

## Table of Contents

1. [COMPLETE Tool Inventory](#1-complete-tool-inventory)
2. [Cole's Building Workflow](#2-coles-building-workflow)
3. [Prompting Patterns](#3-prompting-patterns)
4. [Project Organization](#4-project-organization)
5. [Secret Sauce - S-Tier Practices](#5-secret-sauce---s-tier-practices)
6. [Tools Integration Map](#6-tools-integration-map)
7. [Quick Start Guide](#7-quick-start-guide)

---

## 1. COMPLETE Tool Inventory

### A. Development Environment

#### IDE & Code Editors

| Tool | Purpose | Why He Uses It | What It Replaces | Cost | Learning Curve |
|------|---------|----------------|------------------|------|----------------|
| **Cursor / VS Code** | Primary IDE | AI-native development, excellent Copilot integration | Traditional IDEs without AI | Free tier available | Low |
| **Claude Code** | AI coding assistant | Best AI coding assistant according to Cole | GitHub Copilot, ChatGPT coding | Paid | Low |
| **Warp Terminal** | Modern terminal | AI-powered command completion, workflow automation | iTerm2, Terminal.app | Free tier | Low |

#### Package Managers & Environment

| Tool | Purpose | Why He Uses It | What It Replaces | Cost | Learning Curve |
|------|---------|----------------|------------------|------|----------------|
| **Poetry** | Python dependency management | Lock files, dependency resolution, virtual envs | pip, conda | Free | Medium |
| **npm/yarn** | JavaScript/TypeScript packages | Standard for TS/JS ecosystem | - | Free | Low |
| **Docker** | Containerization | Reproducible environments, deployment | Virtual machines, bare metal | Free | Medium |

---

### B. AI/ML Frameworks

#### Agent Frameworks (S-Tier)

| Tool | Purpose | Why He Uses It | What It Replaces | Cost | Learning Curve |
|------|---------|----------------|------------------|------|----------------|
| **Pydantic AI** ⭐ | Structured data validation for agents | Type-safe tool definitions, validation, excellent DX | Manual JSON schemas, raw dicts | Open Source | Medium |
| **LangGraph** ⭐ | Agent workflow orchestration | Stateful agents, visual debugging, complex workflows | LangChain AgentExecutor, custom loops | Open Source | Medium-High |
| **n8n** | No-code workflow automation | Quick prototyping, visual workflows, integrations | Zapier, Make.com, custom code | Self-hosted free | Low |
| **LangChain** | Basic agent utilities | Tool abstractions, prompts, memory | - | Open Source | Medium |

**Why Pydantic AI + LangGraph is his favorite combo:**
- **Pydantic AI**: Ensures LLM outputs match expected schemas (critical for tool calling)
- **LangGraph**: Manages agent state, routing, and multi-step workflows
- Together: Type-safe tools + reliable workflow orchestration

#### LLM Providers & Models

| Tool | Purpose | Why He Uses It | What It Replaces | Cost | Learning Curve |
|------|---------|----------------|------------------|------|----------------|
| **OpenRouter** | Multi-model API | Access to 100+ models, one API key | Direct API calls to each provider | Pay-per-use | Low |
| **Ollama** | Local LLM deployment | Privacy, no rate limits, offline development | Cloud APIs, API keys | Free | Low |
| **Claude Haiku 4.5** | Prototyping model | Fast, cheap, good enough for testing | GPT-3.5, older models | Pay-per-use | Low |
| **Claude Sonnet 4.5** | Production model | Best all-around performance | GPT-4, Claude Opus | Pay-per-use | Low |
| **DeepSeek Coder** | Code generation | Excellent coding performance | GPT-4, Claude for code | Pay-per-use | Low |

**Model Selection Strategy:**
- **Prototyping**: Claude Haiku 4.5 (cheap, fast)
- **Production**: Claude Sonnet 4.5 (best all-around)
- **Coding**: DeepSeek Coder (specialized for code)
- **Local**: Ollama with Llama 3.1 / Qwen 2.5

#### Vector Databases & RAG

| Tool | Purpose | Why He Uses It | What It Replaces | Cost | Learning Curve |
|------|---------|----------------|------------------|------|----------------|
| **Supabase (pgvector)** | Vector DB + managed Postgres | All-in-one, easy to deploy, SQL + vectors | Pinecone, Weaviate, Milvus | Free tier | Low-Medium |
| **Neon Serverless Postgres** | Serverless Postgres with vectors | Scale-to-zero, cheap for dev | AWS RDS, Heroku Postgres | Free tier | Low-Medium |
| **Graphiti** | Knowledge graph + RAG | Relationship-aware retrieval, evolvable | Naive RAG, GraphRAG | Open Source | High |

**RAG Stack Preference:**
- **Simple RAG**: Supabase pgvector (easiest to deploy)
- **Production RAG**: Neon Serverless + pgvector (cost-effective)
- **Advanced**: Graphiti for relationship-aware retrieval

---

### C. Data & Storage

#### Databases

| Tool | Purpose | Why He Uses It | What It Replaces | Cost | Learning Curve |
|------|---------|----------------|------------------|------|----------------|
| **PostgreSQL** | Primary database | Reliability, JSON support, pgvector | MySQL, SQLite | Free | Low |
| **Supabase** | Managed Postgres + auth + storage | Firebase alternative, real-time, easy API | Firebase, AWS Amplify | Free tier | Low |
| **Redis** | Caching & pub/sub | Fast caching, rate limiting, job queues | Memcached, custom caching | Free | Low-Medium |

**Why PostgreSQL over alternatives:**
- pgvector extension for embeddings
- JSONB for semi-structured data
- Reliability at scale
- Open source

#### Caching & State Management

| Tool | Purpose | Why He Uses It | What It Replaces | Cost | Learning Curve |
|------|---------|----------------|------------------|------|----------------|
| **Redis** | Distributed caching | Fast in-memory caching, session storage | Memcached, custom in-memory | Free | Low-Medium |
| **Mem0** | Persistent AI memory | Gives agents long-term memory | Custom memory implementations | Open Source | Medium |

---

### D. API & Deployment

#### Backend Frameworks

| Tool | Purpose | Why He Uses It | What It Replaces | Cost | Learning Curve |
|------|---------|----------------|------------------|------|----------------|
| **FastAPI** | Python API framework | Fast, async, type-safe, automatic docs | Flask, Django REST | Open Source | Low-Medium |
| **Next.js** | Full-stack React framework | SSR, API routes, great DX | Create React App, vanilla React | Open Source | Medium |
| **Vite** | Frontend build tool | Instant dev server, optimized builds | Webpack, CRA | Open Source | Low |

#### Deployment & Infrastructure

| Tool | Purpose | Why He Uses It | What It Replaces | Cost | Learning Curve |
|------|---------|----------------|------------------|------|----------------|
| **Docker** | Containerization | Reproducible builds, easy deployment | Bare metal, VMs | Free | Medium |
| **GitHub** | Version control & CI/CD | Integrated CI/CD, Actions, copilot | GitLab, Bitbucket | Free | Low |
| **Railway** | Simple deployment | Deploy from GitHub, auto-scaling | Heroku, AWS ECS | Pay-per-use | Low |
| **Fly.io** | Edge deployment | Global deployment, close to users | Vercel, Netlify | Pay-per-use | Low-Medium |

---

### E. Observability & Monitoring

| Tool | Purpose | Why He Uses It | What It Replaces | Cost | Learning Curve |
|------|---------|----------------|------------------|------|----------------|
| **Langfuse** ⭐ | LLM observability | Trace LLM calls, debug prompts, cost tracking | LangSmith, custom logging | Open Source | Medium |
| **LangSmith** | LangChain observability | Official LangChain debugger | Custom logging tools | Paid | Low-Medium |
| **Sentry** | Error tracking | Application error monitoring | Custom error logging | Free tier | Low |

**Why Langfuse is essential:**
- See exactly what prompts are sent to LLMs
- Track token usage and costs
- Debug tool calling failures
- A/B test different prompts

---

### F. Automation & Integration

| Tool | Purpose | Why He Uses It | What It Replaces | Cost | Learning Curve |
|------|---------|----------------|------------------|------|----------------|
| **n8n** | Workflow automation | Visual workflows, 200+ integrations | Zapier, Make.com | Self-hosted free | Low |
| **MCP Servers** | Tool integration standard | Universal tool protocol for agents | Custom tool APIs | Open Source | Medium |
| **Arcade.dev** | AI tool integration | Pre-built tools for agents | Custom tool development | Free tier | Low |

---

### G. Browser Automation

| Tool | Purpose | Why He Uses It | What It Replaces | Cost | Learning Curve |
|------|---------|----------------|------------------|------|----------------|
| **Browserbase** | Headless browser automation | Cloud browsers, debugging, no setup | Puppeteer, Playwright DIY | Free tier | Low-Medium |
| **Playwright** | Local browser automation | Reliable browser control, cross-browser | Selenium | Open Source | Medium |

---

### H. Documentation & Knowledge Management

| Tool | Purpose | Why He Uses It | What It Replaces | Cost | Learning Curve |
|------|---------|----------------|------------------|------|----------------|
| **GitHub** | Code hosting & docs | Issues, Discussions, Wiki | GitLab, Bitbucket | Free | Low |
| **Notion** | Knowledge base | Flexible docs, databases | Confluence, custom wikis | Free tier | Low |
| **Readme** | API documentation | Auto-generated from code | Swagger, custom docs | Free tier | Low |

---

### I. Productivity & Workflow Tools

| Tool | Purpose | Why He Uses It | What It Replaces | Cost | Learning Curve |
|------|---------|----------------|------------------|------|----------------|
| **Telegram** | Remote coding interface | Code from anywhere, notifications | Custom mobile apps | Free | Low |
| **oTTomator Live Agent Studio** | Visual agent builder | No-code agent creation, testing | Custom dashboards | Free tier | Low |
| **bolt.diy** | Prompt-to-full-stack app | Generate apps from prompts | Manual scaffolding | Open Source | Low-Medium |

---

## 2. Cole's Building Workflow

### Phase 0: Ideation (Capture Ideas)

**Tools**: Notion, GitHub Issues, Telegram

**Process**:
1. **Capture ALL ideas** in Notion immediately
2. **Categorize** by: "Quick Win" (1-2 days), "Project" (1-2 weeks), "Vision" (1+ months)
3. **Define success criteria** before starting
4. **Ask 2-3 clarifying questions**:
   - What specific outcomes should this accomplish?
   - How should this integrate with existing systems?
   - How will we know when it's successfully completed?

**Output**: Prioritized backlog with clear success criteria

---

### Phase 1: Planning (Process & Artifacts)

**Tools**: GitHub Projects, markdown docs, LangGraph visualization

**Process**:
1. **Create project repo** with:
   ```
   ├── README.md (project overview)
   ├── docs/
   │   ├── PLAN.md (detailed plan)
   │   ├── RESEARCH.md (research findings)
   │   └── API.md (API documentation)
   ├── src/
   ├── tests/
   └── .github/
       └── workflows/
   ```

2. **Write PLAN.md with**:
   - Problem statement
   - Requirements (functional & non-functional)
   - Architecture diagram
   - Success criteria
   - Timeline

3. **Define agent architecture**:
   - How many agents needed? (Use tools vs sub-agents decision tree)
   - What tools does each agent need? (Keep ≤10 per agent)
   - How do agents communicate? (Orchestrator pattern)

4. **User approval**: Get explicit sign-off before proceeding

**Output**: Comprehensive plan document with architecture diagrams

---

### Phase 2: Research (Sources & Organization)

**Tools**: GitHub, arxiv, YouTube, Langfuse (researching existing solutions)

**Process**:
1. **Search for existing solutions** first:
   - GitHub repos (use code search)
   - LangChain Hub (prompts and chains)
   - arxiv papers (for cutting-edge approaches)
   - YouTube tutorials

2. **Document findings** in RESEARCH.md:
   - What works (adopt)
   - What doesn't (avoid)
   - Gaps to fill (innovate)

3. **Stop researching when**:
   - You have 2-3 proven approaches to test
   - You understand the landscape
   - You can define clear next steps

**Rule**: "Research until you can act, not until you know everything"

**Output**: RESEARCH.md with proven approaches and gaps identified

---

### Phase 3: Development (Coding Workflow)

**Tools**: Cursor/VS Code, Claude Code, Pydantic AI, LangGraph, Docker

**Process**:

#### 3.1. Start with Prototyping Model
```python
# Use cheap, fast model for iteration
llm = OpenRouter(model="claude-haiku-4.5")
```

#### 3.2. Build Agent Structure
```python
# Pydantic AI for type-safe tools
from pydantic_ai import Agent, tool

@tool
def my_tool(param: str) -> str:
    """Tool description for LLM."""
    return result

agent = Agent(
    llm=llm,
    instructions=load_prompt("agent.md")
)
```

#### 3.3. Use LangGraph for Workflows
```python
from langgraph.graph import StateGraph

workflow = StateGraph(AgentState)
workflow.add_node("tool_node", tool_node)
workflow.add_edge("tool_node", "continue")
workflow.set_entry_point("tool_node")
app = workflow.compile()
```

#### 3.4. Interactive Development Loop
1. Write code
2. Test with sample input
3. Check Langfuse traces
4. Iterate on prompts/tools
5. Repeat

**Daily Workflow**:
- **Morning**: Review yesterday's Langfuse traces, identify issues
- **Midday**: Feature development with Claude Code assistance
- **Evening**: Test and document, commit working code

**Output**: Working agent with tools and workflows

---

### Phase 4: Testing & Validation

**Tools**: pytest, Langfuse, manual testing notebooks

**Process**:

#### 4.1. Manual Testing First
```python
# test_agent.py
agent = MyAgent()
result = agent.run("test input")
assert result.expected_field == "expected_value"
```

#### 4.2. Test Edge Cases
- Empty inputs
- Very long inputs
- Malformed inputs
- Tool failures
- API timeouts

#### 4.3. Integration Testing
- Test with real APIs (use test environments)
- Test tool calling with real tools
- Test memory/context management

#### 4.4. Completion Criteria
- ✅ All edge cases handled
- ✅ Langfuse traces look clean
- ✅ Manual testing passes
- ✅ Integration tests pass

**Output**: Comprehensive test suite with passing tests

---

### Phase 5: Deployment

**Tools**: Docker, GitHub Actions, Railway/Fly.io

**Process**:

#### 5.1. Containerize
```dockerfile
FROM python:3.11
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```

#### 5.2. GitHub Actions CI/CD
```yaml
name: Deploy
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: railway up
```

#### 5.3. Monitor Post-Launch
- **Langfuse**: Track token usage, costs, errors
- **Sentry**: Track application errors
- **Logs**: Aggregate and alert on errors

**Output**: Deployed application with monitoring

---

### Phase 6: Learning & Improvement

**Tools**: Langfuse, GitHub Issues, Notion

**Process**:

#### 6.1. Review Langfuse Traces Weekly
- Identify failing prompts
- Find expensive operations
- Discover unexpected user patterns

#### 6.2. Document Learnings
```markdown
# LEARNINGS.md
## What Worked
- Using Pydantic AI prevented 90% of tool errors
- LangGraph made routing clear

## What Didn't
- 10-tool limit was too restrictive for X
- Claude Haiku too weak for Y

## Next Iterations
- Split agent into sub-agents
- Upgrade to Claude Sonnet for production
```

#### 6.3. Close the Loop
- Update prompts based on findings
- Refactor tools that fail often
- Add new tools for missing capabilities
- Document patterns for reuse

**Output**: Improved agent + reusable patterns

---

## 3. Prompting Patterns

### A. System Prompt Structure (5-Section Template)

Cole uses a **consistent 5-section template** for all agent prompts:

```markdown
# Persona
You are a [specialization] assistant with expertise in [domain].
Your role is to [primary responsibility].

# Goals
- [Primary goal 1]
- [Primary goal 2]
- [Primary goal 3]

# Tool Instructions
You have access to the following tools:

## [Tool Name]
**Purpose**: [When to use it]
**Input**: [What it expects]
**Output**: [What it returns]

## Example Workflow
For [common task], use [tool 1] then [tool 2].

# Output Format
- Respond in [format: JSON/markdown/plain text]
- Always include [required fields]
- Avoid [undesired behaviors]
- Use [tone/voice]

# Miscellaneous
- [Additional constraints]
- [Edge cases to handle]
- [Common mistakes to avoid]
```

**Key Principles**:
- **Keep under 200 lines** (prevents context bloat)
- **Use clear section headers** (easy for LLM to parse)
- **Include examples** (LLMs learn from patterns)
- **Specify output format** (critical for tool calling)

---

### B. Feedback Patterns & Correction Methods

#### Pattern 1: Immediate Correction
```python
# If agent makes mistake
response = agent.run(user_input)
if not response.is_valid():
    corrected = agent.run(
        f"Your previous response had an error: {response.error}. "
        f"Please fix this by [specific instruction]."
    )
```

#### Pattern 2: Few-Shot Learning
```markdown
# Tool Instructions
## Example 1 (Correct)
User: "What's the weather?"
Tool Call: get_weather(location="San Francisco")
Result: "65°F and sunny"

## Example 2 (Incorrect)
User: "What's the weather?"
Tool Call: get_weather()  # Missing location
Error: "Location is required"

Do NOT repeat Example 2's mistake.
```

#### Pattern 3: Chain-of-Thought Prompting
```markdown
# Tool Instructions
When [task], follow this process:
1. First, [step 1]
2. Then, [step 2]
3. Finally, [step 3]

Think through each step before acting.
```

---

### C. Context Maintenance Strategies

#### Strategy 1: Sliding Window
```python
# Keep last 10 messages
recent_context = conversation_history[-10:]

response = agent.run(
    user_input,
    conversation_history=recent_context
)
```

**Why**: Balances context relevance with token efficiency

#### Strategy 2: Summarization
```python
# If context too long, summarize
if len(conversation_history) > 20:
    summary = agent.summarize(conversation_history[:-10])
    conversation_history = [
        {"role": "system", "content": summary},
        *conversation_history[-10:]
    ]
```

**Why**: Keeps important info without bloating context

#### Strategy 3: Persistent Memory (Mem0)
```python
from mem0 import Memory

memory = Memory()
memory.add(user_id="user123", content="Prefers Python over JS")

# Agent can recall later
preferences = memory.get(user_id="user123")
```

**Why**: Long-term memory for personalization

---

### D. Tool Calling Prompts

#### Pattern: Clear Tool Descriptions
```python
@agent.tool
def search_database(query: str) -> list[dict]:
    """Search the database for matching records.

    Use this tool when:
    - User asks for information stored in the database
    - You need to look up specific records
    - User asks "find", "search", "look up"

    Input:
    - query: The search term (required)

    Output:
    - List of matching records with all fields

    Do NOT use this tool for:
    - Creating new records (use create_record instead)
    - Updating records (use update_record instead)
    """
    return db.search(query)
```

**Key Elements**:
1. Clear purpose statement
2. When to use (bullet list)
3. Input/output specification
4. When NOT to use (prevents confusion)

---

### E. Error Handling Prompts

```markdown
# Error Handling
If a tool fails:
1. Check the error message
2. Identify the root cause
3. Explain the issue to the user
4. Suggest alternative approaches

Example:
Tool Error: "API rate limit exceeded"
Response: "I'm currently rate-limited. Let me try again in 60 seconds, or we can use cached data."
```

---

## 4. Project Organization

### A. Directory Structure Standard

```
project-name/
├── README.md                  # Project overview
├── requirements.txt           # Python dependencies
├── pyproject.toml            # Poetry config
├── Dockerfile                # Container definition
├── .github/
│   └── workflows/
│       └── deploy.yml        # CI/CD pipeline
├── docs/
│   ├── PLAN.md               # Detailed plan
│   ├── RESEARCH.md           # Research findings
│   ├── LEARNINGS.md          # Post-mortem learnings
│   └── API.md                # API documentation
├── src/
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── base_agent.py     # Base agent class
│   │   ├── specialist_agent.py
│   │   └── orchestrator.py   # Multi-agent coordinator
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── database.py       # DB tools
│   │   └── api.py            # External API tools
│   ├── prompts/
│   │   ├── agent.md          # Agent system prompt
│   │   └── tool_descriptions.md
│   ├── utils/
│   │   ├── memory.py         # Memory management
│   │   └── observability.py  # Langfuse integration
│   └── main.py               # Application entry point
├── tests/
│   ├── test_agents.py
│   ├── test_tools.py
│   └── integration/
│       └── test_workflows.py
└── config/
    ├── dev.json              # Development config
    └── prod.json             # Production config
```

---

### B. Documentation Patterns

#### README.md Structure
```markdown
# Project Name

## Overview
[2-3 sentence description]

## Tech Stack
- **Agent Framework**: Pydantic AI + LangGraph
- **LLM**: Claude Sonnet 4.5
- **Database**: Supabase (PostgreSQL + pgvector)
- **Deployment**: Railway

## Quick Start
\`\`\`bash
# Install dependencies
poetry install

# Configure environment
cp .env.example .env

# Run agent
poetry run python src/main.py
\`\`\`

## Architecture
[Link to docs/ARCHITECTURE.md or inline diagram]

## Usage Examples
[3-5 examples of common use cases]

## Development
[Link to docs/PLAN.md]

## Contributing
[Guidelines for contributors]
```

#### PLAN.md Structure
```markdown
# Implementation Plan

## Problem Statement
[What problem are we solving?]

## Requirements
### Functional Requirements
- FR-1: [Requirement]
- FR-2: [Requirement]

### Non-Functional Requirements
- NFR-1: Performance (<2s response)
- NFR-2: Reliability (99.9% uptime)

## Architecture
[System diagram or description]

## Success Criteria
- [ ] [Criteria 1]
- [ ] [Criteria 2]

## Timeline
- Week 1: [Milestone]
- Week 2: [Milestone]
```

---

### C. Configuration Management

#### Environment Variables Pattern
```bash
# .env.example
# LLM Configuration
OPENROUTER_API_KEY=sk-...
LLM_MODEL=claude-sonnet-4.5

# Database
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_KEY=...

# Observability
LANGFUSE_PUBLIC_KEY=...
LANGFUSE_SECRET_KEY=...

# Deployment
ENVIRONMENT=development
LOG_LEVEL=debug
```

#### Config Pattern
```python
# src/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    openrouter_api_key: str
    llm_model: str = "claude-sonnet-4.5"
    database_url: str
    environment: str = "development"

    class Config:
        env_file = ".env"

settings = Settings()
```

---

## 5. Secret Sauce - S-Tier Practices

### A. Habits, Rituals, Routines

#### Daily Routine
1. **Morning (30 min)**: Review yesterday's Langfuse traces over coffee
   - Identify 3 top issues to fix
   - Check error rates and token costs
   - Plan today's focus

2. **Midday (3-4 hours)**: Deep work on feature development
   - Close Slack/Email
   - Use Claude Code for assistance
   - Commit working code frequently

3. **Evening (30 min)**: Testing and documentation
   - Run integration tests
   - Update LEARNINGS.md
   - Commit and push

4. **Weekly (1 hour)**: Retrospective
   - Review what worked/didn't
   - Update patterns library
   - Plan next week's priorities

#### Flow Optimization Techniques
1. **Time-boxing**: 2-hour focus sessions with 15-min breaks
2. **AI-first**: Use Claude Code for 80% of coding tasks
3. **Fail fast**: Test with Haiku, deploy with Sonnet
4. **Document as you go**: Never leave code undocumented

---

### B. Decision Frameworks & Heuristics

#### Framework 1: Tools vs Sub-Agents Decision Tree

```
┌─────────────────────────────────────────┐
│ How many capabilities do you need?      │
└──────────┬──────────────────────────────┘
           │
           ├─── ≤ 10 capabilities, 1 DOMAIN
           │    → Single Agent with Multiple Tools
           │
           └─── > 10 capabilities, MULTIPLE DOMAINS
                → Multiple Sub-Agents + Orchestrator
```

**Key Principle**:
- **Single Domain** (e.g., data analysis) → Multiple tools in one agent
- **Multiple Domains** (e.g., code + market + learning) → Multiple sub-agents

---

#### Framework 2: LLM Selection Heuristic

| Use Case | Recommended Model | Why |
|----------|-------------------|-----|
| **Prototyping** | Claude Haiku 4.5 | Cheap, fast, good enough |
| **Production** | Claude Sonnet 4.5 | Best all-around performance |
| **Coding Tasks** | DeepSeek Coder | Specialized for code |
| **Local/Offline** | Llama 3.1 / Qwen 2.5 | Privacy, no API costs |
| **Long Context** | Claude 3.5 Sonnet | 200K context window |

---

#### Framework 3: When to Add Complexity

✅ **Ready For**:
- Exceeded 10 tools → Consider specialized sub-agents
- Proof of concept validated → Add production features
- Moving to production → Enhanced security, monitoring
- Complex workflows needed → Multi-agent architecture
- High token costs → Optimize prompts and context

❌ **Not Yet**:
- Multi-agent systems (unless >10 tools)
- Complex orchestration (validate simple first)
- A/B testing prompts (manual testing first)
- Over-optimization (make it work first)

---

### C. The 90% Principle

> "Those who are the most successful are the ones who don't overcomplicate."

**Focus on the first 90% to create a proof of concept. Save production concerns for later.**

**What to focus on first (90%)**:
- Core agent functionality
- Basic tool integration
- Essential prompts
- Happy path testing

**What to defer (last 10%)**:
- Comprehensive error handling
- Advanced monitoring
- Performance optimization
- Edge case coverage

---

### D. Learning Systems & Knowledge Reuse

#### Pattern Library System

Maintain a **library of proven patterns** for reuse:

```
patterns/
├── agents/
│   ├── rag_agent.md          # RAG agent template
│   ├── code_agent.md         # Code analysis agent
│   └── orchestrator.md       # Multi-agent coordinator
├── tools/
│   ├── database_tools.md     # DB tool patterns
│   ├── api_tools.md          # API integration patterns
│   └── file_tools.md         # File operation patterns
└── prompts/
    ├── system_prompts.md     # Prompt templates
    └── tool_descriptions.md  # Tool description patterns
```

**Usage**:
1. Start new project by copying relevant patterns
2. Customize for specific use case
3. Add improved patterns back to library

---

#### Post-Mortem Template

After each project, complete this template:

```markdown
# Project Post-Mortem: [Project Name]

## What Worked (Repeat)
1. [Pattern/Technique that worked]
   - Why it worked
   - Metrics/Results
   - Reusable for: [Future projects]

## What Didn't (Avoid)
1. [Mistake/Failure]
   - Why it failed
   - Lesson learned
   - Prevent by: [Future action]

## Innovations (New Patterns)
1. [New approach discovered]
   - Problem it solved
   - How to implement
   - When to use

## Next Iterations
- [ ] Improvement 1
- [ ] Improvement 2

## Metrics
- Development time: [X days]
- Token usage: [X tokens]
- Cost: [$X]
- Success rate: [X%]
```

---

### E. Non-Obvious S-Tier Practices

#### 1. "Fail with Haiku, Ship with Sonnet"

- **Prototype with Haiku**: Fast, cheap iteration
- **Test with Haiku**: Catch 90% of issues at low cost
- **Upgrade to Sonnet**: Only for production deployment

**Result**: 10x faster development, 90% cost savings

---

#### 2. "Tools Before Agents"

- **Step 1**: Build and test tools independently
- **Step 2**: Create agent with tools
- **Step 3**: Test agent workflows

**Result**: Isolated failures, easier debugging

---

#### 3. "Observability from Day One"

- **Start**: Add Langfuse tracing immediately
- **Test**: Check traces after every run
- **Learn**: Use traces to improve prompts

**Result**: Data-driven optimization, not guessing

---

#### 4. "Memory as a Service"

- **Use Mem0**: Persistent memory for all agents
- **Store preferences**: User-specific behavior
- **Recall context**: Long-term conversation history

**Result**: Personalized agents that improve over time

---

#### 5. "MCP for Everything"

- **Standardize**: Use MCP for all tool integrations
- **Reuse**: Share tools across agents
- **Scale**: Easy to add new tools

**Result**: Modular, composable agent architecture

---

## 6. Tools Integration Map

### A. Data Flows Between Tools

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interaction Layer                  │
├─────────────────────────────────────────────────────────────┤
│  Web UI (Next.js)  │  Telegram Bot  │  API (FastAPI)       │
└──────────────┬──────────────┬──────────────┬────────────────┘
               │              │              │
               └──────────────┴──────────────┘
                            │
                ┌───────────▼────────────┐
                │   Orchestrator Agent   │
                │   (LangGraph + MCP)    │
                └───────────┬────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌───────▼────────┐  ┌──────▼────────┐
│ Specialist 1   │  │ Specialist 2   │  │ Specialist 3  │
│ (Pydantic AI)  │  │ (Pydantic AI)  │  │ (Pydantic AI) │
└───────┬────────┘  └───────┬────────┘  └───────┬────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌───────▼────────┐  ┌──────▼────────┐
│  Tool Layer    │  │  Memory Layer  │  │  Data Layer   │
│  (MCP Servers) │  │  (Mem0)        │  │  (Supabase)   │
└───────┬────────┘  └───────┬────────┘  └───────┬────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                ┌───────────▼────────────┐
                │   Observability Layer  │
                │   (Langfuse Tracing)   │
                └────────────────────────┘
```

---

### B. Integration Points

#### Point 1: Agent ↔ Tools (MCP)
```python
# Agent calls tools via MCP protocol
from mcp import ClientSession

session = ClientSession("database-tools")
await session.connect()

result = await session.call_tool("search", {"query": "test"})
```

#### Point 2: Agent ↔ Memory (Mem0)
```python
# Agent stores/retrieves context
from mem0 import Memory

memory = Memory()
memory.add(user_id="user123", content="Prefers Python")
preferences = memory.get(user_id="user123")
```

#### Point 3: Agent ↔ Data (Supabase)
```python
# Agent queries vector database
from supabase import Client

supabase = Client(url, key)
results = supabase.rpc("vector_search", {
    "query_embedding": embedding,
    "match_count": 5
})
```

#### Point 4: Agent ↔ Observability (Langfuse)
```python
# Agent traces sent to Langfuse
from langfuse import Langfuse

langfuse = Langfuse()
langfuse.trace(
    name="agent_run",
    input=user_input,
    output=response,
    metadata={"model": "claude-sonnet-4.5"}
)
```

---

### C. Minimal Viable Stack vs Full Stack

#### Minimal Viable Stack (MVP)
```
- IDE: VS Code (free)
- LLM: Ollama (local, free)
- Agent Framework: LangChain (basic agents)
- Database: SQLite (local, free)
- Deployment: None (local development)
- Observability: Print statements

**Cost**: $0
**Time to First Agent**: 2 hours
**Best For**: Learning, prototyping, simple agents
```

#### Production Stack
```
- IDE: Cursor ($20/mo)
- LLM: Claude Sonnet 4.5 via OpenRouter (pay-per-use)
- Agent Framework: Pydantic AI + LangGraph
- Database: Supabase (free tier)
- Deployment: Railway ($5-20/mo)
- Observability: Langfuse self-hosted (free)

**Cost**: ~$25-50/mo
**Time to Production**: 1-2 weeks
**Best For**: Production apps, complex agents, real users
```

#### Cole's Full Stack
```
- IDE: Cursor + Claude Code
- LLM: Multiple models via OpenRouter
- Agent Framework: Pydantic AI + LangGraph + n8n
- Database: Supabase + Neon + Redis
- Deployment: Railway + Fly.io + Docker
- Observability: Langfuse + LangSmith + Sentry
- Automation: n8n + MCP servers
- Browser: Browserbase + Playwright
- Memory: Mem0
- Platform: oTTomator Live Agent Studio

**Cost**: ~$100-200/mo
**Time to Mastery**: 3-6 months
**Best For**: Professional development, client projects, scaling
```

---

## 7. Quick Start Guide

### A. Day 1: Setup & First Agent (2 hours)

#### Step 1: Install Core Tools
```bash
# Install Python & Poetry
brew install python3
pip install poetry

# Install Ollama (local LLM)
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama3.1

# Install Cursor (IDE)
# Download from cursor.sh
```

#### Step 2: Create Project
```bash
# Create project directory
mkdir my-first-agent
cd my-first-agent

# Initialize Poetry project
poetry init -n
poetry add pydantic-ai langgraph openrouter

# Create directory structure
mkdir -p src/{agents,tools,prompts} tests docs
```

#### Step 3: Write First Agent
```python
# src/agents/simple_agent.py
from pydantic_ai import Agent, tool
from openrouter import OpenRouter

llm = OpenRouter(model="ollama/llama3.1")

agent = Agent(
    llm=llm,
    instructions="""You are a helpful assistant.
    You help users with their questions.
    """
)

@agent.tool
def get_current_time() -> str:
    """Get the current time."""
    from datetime import datetime
    return datetime.now().isoformat()

if __name__ == "__main__":
    while True:
        user_input = input("You: ")
        if user_input.lower() == "exit":
            break
        response = agent.run(user_input)
        print(f"Agent: {response}")
```

#### Step 4: Run Agent
```bash
poetry run python src/agents/simple_agent.py
```

**🎉 You built your first agent in 2 hours!**

---

### B. Week 1: Build Production-Ready Agent (10 hours)

#### Day 1-2: Add Tools
```python
# src/tools/database.py
from pydantic_ai import tool
import sqlite3

@tool
def search_database(query: str) -> list[dict]:
    """Search the SQLite database.

    Use when user asks to look up information.

    Args:
        query: Search term

    Returns:
        List of matching records
    """
    conn = sqlite3.connect("data.db")
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM records WHERE content LIKE ?", (f"%{query}%",))
    results = cursor.fetchall()
    conn.close()
    return [dict(row) for row in results]
```

#### Day 3-4: Add Memory
```python
# src/utils/memory.py
from mem0 import Memory

memory = Memory()

def add_context(user_id: str, content: str):
    """Store context in long-term memory."""
    memory.add(user_id=user_id, content=content)

def get_context(user_id: str) -> str:
    """Retrieve context from memory."""
    memories = memory.get(user_id=user_id)
    return "\n".join([m["content"] for m in memories])
```

#### Day 5: Add Observability
```python
# src/utils/observability.py
from langfuse import Langfuse

langfuse = Langfuse()

def trace_agent_run(user_input: str, response: str, agent_name: str):
    """Send trace to Langfuse."""
    langfuse.trace(
        name=agent_name,
        input=user_input,
        output=response
    )
```

#### Day 6-7: Testing & Documentation
```python
# tests/test_agent.py
import pytest
from src.agents.simple_agent import agent

def test_agent_time_tool():
    response = agent.run("What time is it?")
    assert "time" in response.lower() or ":" in response

def test_agent_database_tool():
    response = agent.run("Search for 'python' in database")
    assert isinstance(response, str)
```

---

### C. Week 2-4: Deploy & Scale (20 hours)

#### Week 2: Containerization
```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY pyproject.toml poetry.lock ./
RUN pip install poetry && poetry install

# Copy code
COPY src/ ./src/

# Expose port
EXPOSE 8000

# Run agent
CMD ["poetry", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0"]
```

#### Week 3: CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          npm install -g railway
          railway up
```

#### Week 4: Monitoring & Optimization
- Set up Langfuse dashboard
- Create Sentry alerts
- Optimize expensive operations
- Document learnings

---

### D. Month 2-3: Advanced Features

- **Multi-agent orchestration** with LangGraph
- **Knowledge graphs** with Graphiti
- **Advanced RAG** with hybrid search
- **Browser automation** with Browserbase
- **Tool marketplace** with MCP

---

## Conclusion

Cole Medin's tech stack represents a **modern, AI-first approach** to building intelligent systems. The key takeaways are:

### Core Philosophy
1. **Simplicity First**: Start simple, iterate fast, don't overcomplicate
2. **Tools Before Agents**: Build and test tools independently
3. **Observability from Day One**: Use Langfuse to track everything
4. **Fail Fast, Ship Smart**: Prototype with Haiku, deploy with Sonnet

### Essential Tools (Must-Have)
- **Pydantic AI**: Type-safe tool definitions
- **LangGraph**: Workflow orchestration
- **OpenRouter**: Multi-model access
- **Supabase**: Database + vectors
- **Langfuse**: Observability

### Secret Sauce
- **90% Principle**: Focus on core functionality first
- **Pattern Library**: Reuse proven approaches
- **Memory as a Service**: Persistent context with Mem0
- **MCP Standard**: Modular tool integration

### Next Steps
1. **Start with MVP**: Use minimal stack to learn
2. **Add Complexity Gradually**: Only when needed
3. **Document Everything**: Build pattern library
4. **Share Knowledge**: Contribute back to community

---

## Additional Resources

### Cole Medin's Content
- [YouTube Channel](https://www.youtube.com/@ColeMedin)
- [AI Agents Masterclass](https://github.com/coleam00/ai-agents-masterclass)
- [oTTomator Live Agent Studio](https://ottomator.ai/)

### Key Videos
- [The ONLY AI Tech Stack You Need in 2026](https://www.youtube.com/watch?v=21_k2St8bBI)
- [This is Hands Down the BEST Way to Build AI Agents](https://www.youtube.com/watch?v=U6LbW2IFUQw)
- [Learn 90% of Building AI Agents in 30 Minutes](https://www.youtube.com/watch?v=i5kwX7jeWL8)

### Documentation
- [Pydantic AI Docs](https://ai.pydantic.dev/)
- [LangGraph Docs](https://langchain-ai.github.io/langgraph/)
- [Langfuse Docs](https://langfuse.com/docs)
- [Supabase Docs](https://supabase.com/docs)

---

**Report Status**: ✅ COMPLETE
**Last Updated**: January 11, 2026
**Version**: 1.0

---

## Sources

- [Cole Medin's YouTube Channel](https://www.youtube.com/@ColeMedin)
- [The ONLY AI Tech Stack You Need in 2026](https://www.youtube.com/watch?v=21_k2St8bBI)
- [Cole Medin GitHub](https://github.com/coleam00)
- [AI Agents Masterclass Repository](https://github.com/coleam00/ai-agents-masterclass)
- [oTTomator Platform](https://ottomator.ai/)
- [This is Hands Down the BEST Way to Build AI Agents](https://www.youtube.com/watch?v=U6LbW2IFUQw)
- [Pydantic AI Documentation](https://ai.pydantic.dev/)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
