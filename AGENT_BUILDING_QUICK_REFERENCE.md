# AI Agent Building: Quick Reference Guide

**Based on Video**: "How to Build AI Agents (Don't Overcomplicate It)"
**Video URL**: https://www.youtube.com/watch?v=i5kwX7jeWL8

---

## The Golden Rule: The 90% Principle

> "Those who are the most successful are the ones who don't overcomplicate."

**Focus on the first 90% to create a proof of concept. Save production concerns for later.**

---

## Four Core Components (Must Have)

### 1. Tools
- Functions the agent can call
- Transform chatbot → agent
- Examples: Web search, calculator, calendar integration

### 2. Large Language Model
- The "brain" that decides which tools to use
- Don't overthink the choice - swapping is easy
- Prototyping: Claude Haiku 4.5 (cheap/fast)
- Production: Claude Sonnet 4.5 (best all-around)

### 3. System Prompt
- Highest-level instructions
- Components:
  - **Persona**: Who is the agent?
  - **Goals**: What should it accomplish?
  - **Tool Instructions**: How to use tools + examples
  - **Output Format**: How should it respond?
  - **Miscellaneous**: Catchall for refinements

### 4. Memory
- Short-term: Conversation history
- Long-term: Persistent user information
- Strategy: Sliding window (last 10-20 messages)

---

## Three Steps to Start

1. **Pick an LLM** → Use OpenRouter for flexibility
2. **Write System Prompt** → Use 5-section template
3. **Add One Tool** → Start with RAG or web search

**That's it. You have an agent.**

---

## Tool Design Rules

✅ **DO**:
- Keep tools under 10 total
- Ensure each tool has distinct purpose
- Use MCP servers for pre-packaged tools
- Learn RAG first (80%+ of agents use it)

❌ **DON'T**:
- Create overlapping functionality
- Build multi-agent systems initially
- Overwhelm the LLM with options

---

## System Prompt Template

```markdown
# Persona
You are a [specialization] assistant with expertise in [domain].

# Goals
- [Primary goal 1]
- [Primary goal 2]

# Tool Instructions
You have access to:
- [Tool 1]: [When to use it]
- [Tool 2]: [When to use it]

## Example Workflow
For [common task], use [tool 1] then [tool 2].

# Output Format
- Respond in [format]
- Always include [fields]
- Avoid [behaviors]

# Miscellaneous
- [Additional instructions]
- [Edge cases]
```

**Keep it under 200 lines. Refine during manual testing.**

---

## Security Essentials

### Immediate Implementation
1. **Environment Variables** - Never hardcode API keys
2. **Guardrails** - Limit input/output (use Guardrails AI)
3. **Vulnerability Scanning** - Use Snyk Studio or Snyk MCP

### Before Production
- Comprehensive input validation
- Output filtering
- Rate limiting
- Authentication/authorization

---

## Memory Management Strategies

### 1. Concise Prompts
- System prompts: 200 lines max
- Tool descriptions: Brief and clear
- Remove redundancy

### 2. Sliding Window
```python
# Only keep last 10 messages
recent_context = conversation[-10:]
```

### 3. Specialized Sub-Agents
- Split complex agents
- Each maintains simple prompt
- Use router for orchestration

---

## Recommended Tool Stack

| Purpose | Tool |
|---------|------|
| **LLM Access** | OpenRouter (multi-model) |
| **Prototyping Model** | Claude Haiku 4.5 |
| **Production Model** | Claude Sonnet 4.5 |
| **Python Framework** | Phidata AI |
| **No-Code Tool** | N8N |
| **Security** | Guardrails AI (open-source) |
| **Vulnerability Scanning** | Snyk Studio / Snyk MCP |
| **RAG Implementation** | Vector database + RAG tool |

---

## Basic Agent Code Structure

```python
# 1. Dependencies
from phidata import Agent, OpenRouter

# 2. LLM (easy to swap)
llm = OpenRouter(model="claude-haiku-4.5")

# 3. Agent with system prompt
agent = Agent(
    llm=llm,
    instructions=load_prompt("agent.md")
)

# 4. Add tool
@agent.tool
def my_tool(param: str) -> str:
    """Tool description for LLM.

    Explain when and how to use this.
    """
    return result

# 5. Run with memory
conversation = []
while True:
    user_input = input("You: ")
    if user_input == "exit": break

    response = agent.run(
        user_input,
        conversation_history=conversation[-10:]  # Last 10
    )

    conversation.append({"role": "user", "content": user_input})
    conversation.append({"role": "assistant", "content": response})
    print(f"Agent: {response}")
```

**Total: <50 lines for a functional agent**

---

## When to Add Complexity

### ✅ Ready For:
- [ ] Exceeded 10 tools → Consider specialized sub-agents
- [ ] Proof of concept validated → Add production features
- [ ] Moving to production → Enhanced security, monitoring
- [ ] Complex workflows needed → Multi-agent architecture
- [ ] High token costs → Optimize prompts and context

### ❌ Not Yet:
- Multi-agent systems (unless >10 tools)
- Complex orchestration (validate simple first)
- A/B testing prompts (manual testing first)
- Over-optimization (make it work first)

---

## Top Priority Capabilities

### Learn in This Order:
1. **RAG (Retrieval Augmented Generation)** ⭐
   - Ground responses in real data
   - Search documents/knowledge base
   - Used by 80%+ of production agents
   - Highest ROI

2. **Basic Tool Integration**
   - Simple function calling
   - Clear tool descriptions
   - Test one tool at a time

3. **System Prompt Design**
   - Use consistent template
   - Iterate based on testing
   - Keep it simple initially

4. **Memory Management**
   - Short-term: Conversation history
   - Sliding window for efficiency
   - Long-term: Vector database

5. **Security Basics**
   - Environment variables
   - Guardrails (input/output)
   - Vulnerability scanning

---

## Common Pitfalls to Avoid

### 1. Perfectionism Paralysis ❌
- **Problem**: Trying to create perfect system prompt, tools, LLM choice
- **Solution**: Focus on proof of concept, iterate later

### 2. Tool Overload ❌
- **Problem**: Adding too many tools at once
- **Solution**: Start with 1-3 tools, expand gradually

### 3. Over-Engineering ❌
- **Problem**: Building multi-agent systems for simple tasks
- **Solution**: Single agent until exceeding 10 tools

### 4. Context Bloat ❌
- **Problem**: Thousands of lines in system prompts
- **Solution**: Keep under 200 lines, use sub-agents

### 5. Security Neglect ❌
- **Problem**: Hardcoded API keys, no guardrails
- **Solution**: Environment variables, basic guardrails

### 6. LLM Anxiety ❌
- **Problem**: Stressing about perfect LLM choice
- **Solution**: Use OpenRouter, swap anytime (1 line change)

---

## Quick Start Checklist

### Phase 1: Foundation (Day 1)
- [ ] Choose LLM platform (OpenRouter recommended)
- [ ] Select prototyping model (Claude Haiku 4.5)
- [ ] Write basic system prompt using template
- [ ] Add first tool (RAG or simple function)
- [ ] Create basic interaction loop
- [ ] Test with sample inputs

### Phase 2: Iteration (Days 2-3)
- [ ] Refine system prompt based on testing
- [ ] Add 2-3 more tools as needed
- [ ] Implement sliding window memory
- [ ] Add basic security (env vars, guardrails)
- [ ] Test edge cases

### Phase 3: Enhancement (Week 1)
- [ ] Upgrade to production LLM (Sonnet 4.5)
- [ ] Add comprehensive RAG capabilities
- [ ] Implement vulnerability scanning
- [ ] Optimize prompts for token efficiency
- [ ] Consider sub-agents if >10 tools

### Phase 4: Production (When Ready)
- [ ] Enhanced security and monitoring
- [ ] Multi-agent architecture if needed
- [ ] Comprehensive testing and evaluation
- [ ] Deployment and observability
- [ ] Documentation and maintenance

---

## Key Timestamps for Review

| Topic | Timestamp |
|-------|-----------|
| **Simplicity Philosophy** | 00:00:02 - 00:01:40 |
| **Four Core Components** | 00:01:40 - 00:02:44 |
| **Live Coding Demo** | 00:04:23 - 00:08:11 |
| **System Prompt Template** | 00:10:27 - 00:12:38 |
| **Tool Design Rules** | 00:12:08 - 00:13:43 |
| **RAG Importance** | 00:13:12 - 00:13:43 |
| **Security Essentials** | 00:14:18 - 00:17:31 |
| **Memory Management** | 00:19:44 - 00:22:00 |

---

## Remember

> "You can learn 90% of what you need to build AI agents from just this video."

**Start simple. Iterate quickly. Don't overcomplicate.**

The perfect agent doesn't exist on day one. The successful agent is the one that gets built, tested, and improved over time.

---

**For Detailed Analysis**: See `VIDEO_ANALYSIS_Agent_Building_Simplicity.md`
**For Full Transcript**: See `VIDEO_TRANSCRIPT_Agent_Building.md`
