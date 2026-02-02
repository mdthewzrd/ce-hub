# AI Agent Architecture Patterns & Code Examples

**Extracted from Video**: "How to Build AI Agents (Don't Overcomplicate It)"
**Video**: https://www.youtube.com/watch?v=i5kwX7jeWL8

---

## Table of Contents
1. [Pattern 1: Simple Tool-Based Agent](#pattern-1-simple-tool-based-agent)
2. [Pattern 2: RAG-Enhanced Agent](#pattern-2-rag-enhanced-agent)
3. [Pattern 3: Specialized Sub-Agents](#pattern-3-specialized-sub-agents)
4. [Pattern 4: Multi-Agent System](#pattern-4-multi-agent-system)
5. [Security Patterns](#security-patterns)
6. [Memory Management Patterns](#memory-management-patterns)

---

## Pattern 1: Simple Tool-Based Agent

**When to Use**: Starting out, proof of concept, <10 tools needed
**Complexity**: Low
**Lines of Code**: ~50

### Architecture

```
┌─────────────────────────────────────┐
│         User Input                  │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│      LLM (Brain)                    │
│  - Claude Haiku 4.5                 │
│  - System Prompt                    │
│  - Tool Selection Logic             │
└────┬────────────┬──────────────┬────┘
     │            │              │
     ▼            ▼              ▼
┌─────────┐  ┌─────────┐  ┌─────────┐
│ Tool 1  │  │ Tool 2  │  │ Tool 3  │
│Search   │  │Calc    │  │Calendar│
└─────────┘  └─────────┘  └─────────┘
     │            │              │
     └────────────┴──────────────┘
                  │
                  ▼
          ┌──────────────┐
          │   Response   │
          └──────────────┘
```

### Implementation

```python
# simple_agent.py
from phidata import Agent, OpenRouter
from typing import List, Dict

# 1. Initialize LLM
llm = OpenRouter(
    model="claude-haiku-4.5",
    api_key_env="OPENROUTER_API_KEY"
)

# 2. Define system prompt
SYSTEM_PROMPT = """
# Persona
You are a helpful assistant with access to various tools.

# Goals
- Assist users with their questions
- Use appropriate tools when needed
- Provide clear, accurate responses

# Tool Instructions
You have access to:
- calculator: Use for mathematical computations
- web_search: Use for finding current information
- calendar: Use for scheduling and time-based queries

# Output Format
- Be concise and direct
- If using a tool, explain what you're doing
- Provide results in a clear format

# Miscellaneous
- Always verify tool results before presenting
- If a tool fails, explain the error and suggest alternatives
"""

# 3. Create agent
agent = Agent(
    llm=llm,
    instructions=SYSTEM_PROMPT
)

# 4. Define tools
@agent.tool
def calculator(expression: str) -> str:
    """Evaluate mathematical expressions.

    Use this when the user needs to perform calculations.
    LLMs are not good at math by themselves.

    Args:
        expression: Mathematical expression (e.g., "2 + 2")

    Returns:
        Calculated result as string
    """
    try:
        result = eval(expression)
        return str(result)
    except Exception as e:
        return f"Error: {str(e)}"

@agent.tool
def web_search(query: str) -> str:
    """Search the web for current information.

    Use this when user asks about recent events, facts,
    or information not in your training data.

    Args:
        query: Search query string

    Returns:
        Search results summary
    """
    # Implementation would use actual search API
    return f"Search results for: {query}"

@agent.tool
def create_event(title: str, date: str, time: str) -> str:
    """Create a calendar event.

    Use this when user wants to schedule something.

    Args:
        title: Event title
        date: Event date (YYYY-MM-DD)
        time: Event time (HH:MM)

    Returns:
        Confirmation message
    """
    # Implementation would integrate with calendar API
    return f"Created event '{title}' on {date} at {time}"

# 5. Main loop with memory
def main():
    conversation: List[Dict[str, str]] = []

    print("Simple Agent (type 'exit' to quit)")
    print("=" * 50)

    while True:
        user_input = input("\nYou: ").strip()

        if user_input.lower() == "exit":
            print("Goodbye!")
            break

        # Run agent with conversation history
        response = agent.run(
            user_input,
            conversation_history=conversation
        )

        # Update conversation memory
        conversation.append({
            "role": "user",
            "content": user_input
        })
        conversation.append({
            "role": "assistant",
            "content": response
        })

        print(f"\nAgent: {response}")

        # Optional: Limit conversation history
        if len(conversation) > 20:  # Keep last 10 exchanges
            conversation = conversation[-20:]

if __name__ == "__main__":
    main()
```

### Usage Example

```
You: What's 25 times 47?
Agent: Let me calculate that for you.
[Uses calculator tool]
Agent: 25 times 47 equals 1175.

You: Search for recent AI news
Agent: I'll search for recent AI news for you.
[Uses web_search tool]
Agent: Here are recent AI developments: [results]

You: Schedule a meeting tomorrow at 2pm
Agent: I'll create that calendar event for you.
[Uses create_event tool]
Agent: Created event 'meeting' on tomorrow at 14:00.
```

---

## Pattern 2: RAG-Enhanced Agent

**When to Use**: Need domain-specific knowledge, document QA, knowledge base
**Complexity**: Medium
**Used By**: 80%+ of production agents

### Architecture

```
┌──────────────────────────────────────┐
│         User Input                   │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│      LLM Agent                       │
│  - System Prompt                     │
│  - Tool Selection Logic              │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│      RAG Tool                        │
│  - Embed Query                       │
│  - Search Vector DB                  │
│  - Retrieve Relevant Docs            │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│      Vector Database                 │
│  - Document Chunks                   │
│  - Embeddings                        │
│  - Similarity Search                 │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│      Grounded Response               │
│  - Based on retrieved docs           │
│  - Citations included                │
└──────────────────────────────────────┘
```

### Implementation

```python
# rag_agent.py
from phidata import Agent, OpenRouter
from typing import List, Dict
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# 1. RAG Knowledge Base
class RAGKnowledgeBase:
    def __init__(self):
        self.documents = []
        self.vectorizer = TfidfVectorizer()
        self.embeddings = None

    def add_documents(self, docs: List[str]):
        """Add documents to knowledge base."""
        self.documents.extend(docs)
        self._rebuild_index()

    def _rebuild_index(self):
        """Rebuild vector index."""
        if self.documents:
            self.embeddings = self.vectorizer.fit_transform(self.documents)

    def search(self, query: str, top_k: int = 3) -> List[str]:
        """Search for relevant documents."""
        if not self.documents:
            return []

        query_vec = self.vectorizer.transform([query])
        similarities = cosine_similarity(query_vec, self.embeddings)[0]

        # Get top-k most similar
        top_indices = np.argsort(similarities)[-top_k:][::-1]
        results = [self.documents[i] for i in top_indices]
        return results

# 2. Initialize knowledge base
kb = RAGKnowledgeBase()

# Add sample documents
kb.add_documents([
    "AI agents are systems that use LLMs to perform tasks autonomously.",
    "The four core components of AI agents are: tools, LLM, system prompt, and memory.",
    "RAG (Retrieval Augmented Generation) grounds LLM responses in real data.",
    "Claude Haiku 4.5 is recommended for prototyping due to low cost.",
    "Keep tools under 10 to avoid overwhelming the LLM.",
])

# 3. Define RAG-enhanced agent
llm = OpenRouter(model="claude-haiku-4.5")

agent = Agent(
    llm=llm,
    instructions="""
# Persona
You are an AI assistant with access to a knowledge base about AI agents.

# Goals
- Answer questions using the knowledge base
- Provide accurate, grounded information
- Cite sources when available

# Tool Instructions
- Always search the knowledge base before answering
- Use retrieved context to inform your response
- If knowledge base doesn't contain relevant info, say so

# Output Format
- Base answers on retrieved documents
- Include relevant quotes or citations
- Be concise but thorough
"""
)

# 4. Define RAG tool
@agent.tool
def search_knowledge_base(query: str) -> str:
    """Search the knowledge base for relevant information.

    Use this tool for ANY question about AI agents.
    It searches the document collection and returns relevant passages.

    Args:
        query: The question or topic to search for

    Returns:
        Relevant document passages separated by newlines
    """
    results = kb.search(query, top_k=3)

    if not results:
        return "No relevant information found in knowledge base."

    return "\n\n".join([
        f"Document {i+1}: {doc}"
        for i, doc in enumerate(results)
    ])

# 5. Interactive loop
def main():
    print("RAG Agent - Ask about AI agents (type 'exit' to quit)")
    print("=" * 60)

    while True:
        query = input("\nYour question: ").strip()

        if query.lower() == "exit":
            break

        # Agent will automatically use search_knowledge_base tool
        response = agent.run(query)
        print(f"\n{response}")

if __name__ == "__main__":
    main()
```

### Usage Example

```
Your question: What are the components of AI agents?

[Agent uses search_knowledge_base tool]
[Retrieves relevant documents]

Agent: Based on the knowledge base, AI agents have four core components:

1. Tools - Functions the agent can call to perform actions
2. LLM - The large language model that serves as the brain
3. System Prompt - High-level instructions for the agent
4. Memory - Context from conversations

Document 2 states: "The four core components of AI agents are:
tools, LLM, system prompt, and memory."
```

---

## Pattern 3: Specialized Sub-Agents

**When to Use**: Exceeding 10 tools, distinct domains, complex workflows
**Complexity**: Medium-High
**Trigger**: Single agent becomes unwieldy

### Architecture

```
┌──────────────────────────────────────┐
│         User Input                   │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│      Router Agent                    │
│  - Analyzes request                  │
│  - Routes to appropriate sub-agent   │
└────────────┬─────────────────────────┘
             │
      ┌──────┼──────┬──────────┐
      │      │      │          │
      ▼      ▼      ▼          ▼
┌─────────┐┌─────────┐┌─────────┐┌─────────┐
│  Code   ││  Data   ││  Web    ││  File   │
│ Agent   ││ Agent   ││ Agent   ││ Agent  │
├─────────┤├─────────┤├─────────┤├─────────┤
│ • Code  ││ • SQL   ││ • Scrap ││ • Read │
│   Gen   ││ • Query ││ • Search││ • Write│
│ • Debug ││ • Analy││ • Browse││ • Edit │
└─────────┘└─────────┘└─────────┘└─────────┘
      │      │      │          │
      └──────┴──────┴──────────┘
                  │
                  ▼
          ┌──────────────┐
          │   Response   │
          └──────────────┘
```

### Implementation

```python
# specialized_agents.py
from phidata import Agent, OpenRouter
from typing import Literal

llm = OpenRouter(model="claude-haiku-4.5")

# 1. Code Agent
code_agent = Agent(
    llm=llm,
    instructions="""
# Persona
You are a coding assistant specializing in Python development.

# Goals
- Write clean, efficient Python code
- Debug and explain code issues
- Suggest improvements and best practices

# Available Tools
- code_executor: Execute Python code
- code_analyzer: Analyze code for issues

# Output Format
- Provide code in markdown blocks
- Explain your reasoning
- Include error handling
"""
)

@code_agent.tool
def execute_python(code: str) -> str:
    """Execute Python code and return result.

    Use this to run code snippets provided by user.

    Args:
        code: Valid Python code string

    Returns:
        Output or error message
    """
    try:
        exec_globals = {}
        exec(code, exec_globals)
        return "Code executed successfully"
    except Exception as e:
        return f"Error: {str(e)}"

# 2. Data Agent
data_agent = Agent(
    llm=llm,
    instructions="""
# Persona
You are a data analysis assistant.

# Goals
- Help query and analyze data
- Provide insights from datasets
- Create visualizations when appropriate

# Available Tools
- sql_query: Execute SQL queries
- data_analyzer: Analyze data patterns

# Output Format
- Present data clearly
- Provide interpretations
- Suggest follow-up analyses
"""
)

@data_agent.tool
def execute_sql(query: str) -> str:
    """Execute SQL query on database.

    Use this when user wants to retrieve or analyze data.

    Args:
        query: SQL SELECT statement

    Returns:
        Query results as formatted table
    """
    # Implementation would connect to actual database
    return f"Results for: {query}"

# 3. Router Agent
router_agent = Agent(
    llm=llm,
    instructions="""
# Persona
You are a routing agent that directs requests to specialized assistants.

# Goals
- Analyze user request
- Route to appropriate specialized agent
- Synthesize and present results

# Available Agents
- code_agent: For coding, debugging, code review
- data_agent: For data analysis, SQL queries, statistics
- web_agent: For web search, scraping, browsing
- file_agent: For file operations, reading, writing

# Routing Logic
Code-related → code_agent
Data/analysis → data_agent
Web/search → web_agent
File operations → file_agent

# Output Format
- Acknowledge routing decision
- Present specialist's response
- Add relevant context if needed
"""
)

@router_agent.tool
def route_to_code_agent(request: str) -> str:
    """Route request to code specialist agent.

    Use for: coding, debugging, code review, programming questions.

    Args:
        request: User's code-related request

    Returns:
        Code agent's response
    """
    return code_agent.run(request)

@router_agent.tool
def route_to_data_agent(request: str) -> str:
    """Route request to data specialist agent.

    Use for: data analysis, SQL queries, statistics, datasets.

    Args:
        request: User's data-related request

    Returns:
        Data agent's response
    """
    return data_agent.run(request)

# 4. Usage
def main():
    print("Specialized Agents System")
    print("Available: code, data, web, file")
    print("=" * 50)

    while True:
        user_input = input("\nYou: ").strip()

        if user_input.lower() == "exit":
            break

        # Router automatically determines which sub-agent to use
        response = router_agent.run(user_input)
        print(f"\nRouter: {response}")

if __name__ == "__main__":
    main()
```

### Usage Example

```
You: Write a function to calculate fibonacci numbers

[Router analyzes request]
[Routes to code_agent]

Router: I'll route this to our code specialist.

Code Agent: Here's a Python function for Fibonacci numbers:

```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
```

This recursive approach is simple but inefficient for large n.
Would you like me to provide an optimized version?

---

You: Analyze the sales data for last quarter

[Router analyzes request]
[Routes to data_agent]

Router: Let me connect you with our data specialist.

Data Agent: I'll analyze your sales data. Here's what I found:
[Provides analysis, charts, insights]
```

---

## Pattern 4: Multi-Agent System (Advanced)

**When to Use**: Large-scale production, complex orchestration, many specialized domains
**Complexity**: High
**⚠️ Warning**: Overengineering for starters

### Architecture

```
┌──────────────────────────────────────────┐
│           User Input                     │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│      Orchestrator Agent                 │
│  - Breaks down complex tasks            │
│  - Coordinates multiple agents          │
│  - Manages dependencies and workflow    │
└────┬─────────┬─────────┬─────────┬──────┘
     │         │         │         │
     ▼         ▼         ▼         ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Research││ Writer ││ Coder  ││Tester │
│ Agent  ││ Agent  ││ Agent  ││ Agent │
└────────┘ └────────┘ └────────┘ └────────┘
     │         │         │         │
     └─────────┴─────────┴─────────┘
               │
               ▼
       ┌───────────────┐
       │ Final Output  │
       └───────────────┘
```

### Example Use Case

**Task**: "Create a web scraper for a news site and write a report"

```python
# orchestrator.py
orchestrator = Agent(
    llm=llm,
    instructions="""
# Persona
You are an orchestrator that coordinates multiple specialized agents.

# Goals
- Break down complex tasks into sub-tasks
- Assign sub-tasks to appropriate agents
- Combine results into cohesive output

# Workflow
1. Analyze user request
2. Decompose into steps
3. Assign each step to specialist
4. Aggregate and synthesize results
5. Present final output
"""
)

@orchestrator.tool
def research_agent(task: str) -> str:
    """Research: Gather information and context."""
    # Research specialist
    pass

@orchestrator.tool
def coder_agent(task: str) -> str:
    """Coding: Write and test code."""
    # Code specialist
    pass

@orchestrator.tool
def writer_agent(task: str) -> str:
    """Writing: Create documentation and reports."""
    # Writer specialist
    pass

@orchestrator.tool
def tester_agent(code: str) -> str:
    """Testing: Validate and verify outputs."""
    # Testing specialist
    pass
```

---

## Security Patterns

### Pattern 1: Guardrails Implementation

```python
# security_patterns.py
from guardrails import Guard
from guardrails.hub import PIIFilter, ToxicLanguage

# 1. Input Guardrail
input_guard = Guard().use(
    PIIFilter,  # Detect/remove PII
    ToxicLanguage  # Filter toxic content
)

# 2. Output Guardrail
output_guard = Guard().use(
    ToxicLanguage,  # Ensure clean output
    PIIFilter  # Prevent PII leakage
)

# 3. Usage in agent
def safe_agent_run(user_input: str, agent: Agent) -> str:
    """Run agent with input and output guardrails."""

    # Validate input
    sanitized_input, _, input_valid = input_guard.parse(user_input)

    if not input_valid:
        return "I cannot process that input due to safety concerns."

    # Run agent
    response = agent.run(sanitized_input)

    # Validate output
    sanitized_output, _, output_valid = output_guard.parse(response)

    if not output_valid:
        return "My response was flagged. Please rephrase."

    return sanitized_output
```

### Pattern 2: Environment Variables

```python
# config.py
import os
from dotenv import load_dotenv

load_dotenv()

# Never hardcode API keys
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

class Config:
    """Secure configuration management."""

    @staticmethod
    def get_api_key(service: str) -> str:
        """Get API key from environment."""
        key = os.getenv(f"{service.upper()}_API_KEY")
        if not key:
            raise ValueError(f"Missing API key for {service}")
        return key

# Usage
config = Config()
api_key = config.get_api_key("openrouter")
```

### Pattern 3: Vulnerability Scanning with Snyk MCP

```python
# security_scanning.py
# Conceptual integration with Snyk MCP server

agent = Agent(
    llm=llm,
    instructions="""
You are a security-aware coding assistant.

# Tools Available
- snyk_scan: Scan code for vulnerabilities
- snyk_fix: Auto-fix detected issues

# Workflow
1. Before suggesting code, run snyk_scan
2. If vulnerabilities found, use snyk_fix
3. Present secure code to user
"""
)

@agent.tool
def snyk_scan(code: str) -> str:
    """Scan code for security vulnerabilities.

    Uses Snyk MCP server to check dependencies and code.

    Args:
        code: Code to scan

    Returns:
        Vulnerability report with severity and recommendations
    """
    # Would integrate with Snyk MCP server
    return f"Snyk scan results for provided code"

@agent.tool
def snyk_fix(code: str, issue_id: str) -> str:
    """Auto-fix security vulnerability.

    Args:
        code: Code with vulnerability
        issue_id: Snyk issue identifier

    Returns:
        Fixed code
    """
    # Would integrate with Snyk MCP server
    return f"Fixed code"
```

---

## Memory Management Patterns

### Pattern 1: Sliding Window

```python
# memory_patterns.py
from typing import List, Dict

class SlidingWindowMemory:
    """Keep only recent conversation history."""

    def __init__(self, window_size: int = 10):
        self.window_size = window_size
        self.history: List[Dict[str, str]] = []

    def add(self, role: str, content: str):
        """Add message to history."""
        self.history.append({
            "role": role,
            "content": content
        })

        # Trim to window size
        if len(self.history) > self.window_size:
            self.history = self.history[-self.window_size:]

    def get_history(self) -> List[Dict[str, str]]:
        """Get current conversation history."""
        return self.history

# Usage
memory = SlidingWindowMemory(window_size=10)

memory.add("user", "What's the weather?")
memory.add("assistant", "I'd need your location to check.")
memory.add("user", "I'm in New York")

# Only keeps last 10 messages
response = agent.run(user_input, conversation_history=memory.get_history())
```

### Pattern 2: Summary-Based Compression

```python
class SummaryMemory:
    """Compress old messages into summaries."""

    def __init__(self, keep_recent: int = 5):
        self.keep_recent = keep_recent
        self.history: List[Dict[str, str]] = []
        self.summary: str = ""

    def add(self, role: str, content: str):
        """Add message and compress if needed."""
        self.history.append({"role": role, "content": content})

        # If too long, summarize older messages
        if len(self.history) > self.keep_recent * 2:
            old_messages = self.history[:-self.keep_recent]
            self._summarize(old_messages)
            self.history = self.history[-self.keep_recent:]

    def _summarize(self, messages: List[Dict]):
        """Summarize old messages (using LLM)."""
        text = "\n".join([f"{m['role']}: {m['content']}" for m in messages])
        # Would call LLM to create summary
        self.summary = f"[Previous conversation summary: {text[:100]}...]"

    def get_context(self) -> List[Dict]:
        """Get context with summary."""
        context = []
        if self.summary:
            context.append({"role": "system", "content": self.summary})
        context.extend(self.history)
        return context
```

### Pattern 3: Long-Term Memory with Vector DB

```python
class LongTermMemory:
    """Persistent memory using vector database."""

    def __init__(self):
        self.vector_db = VectorDatabase()
        self.user_memories = {}  # user_id -> memory_id

    def store(self, user_id: str, information: str):
        """Store information in long-term memory."""
        memory_id = self.vector_db.add(information)
        self.user_memories[user_id] = memory_id

    def retrieve(self, user_id: str, query: str) -> str:
        """Retrieve relevant information."""
        memory_id = self.user_memories.get(user_id)
        if not memory_id:
            return ""

        # Search vector database for relevant info
        results = self.vector_db.search(memory_id, query, top_k=3)
        return "\n".join(results)

# Usage
ltm = LongTermMemory()

# Store user preferences
ltm.store("user_123", "User prefers Python over JavaScript")
ltm.store("user_123", "User is working on e-commerce project")

# Later, retrieve relevant context
preferences = ltm.retrieve("user_123", "what programming language")
# Returns: "User prefers Python over JavaScript"
```

---

## Testing & Evaluation Patterns

### Pattern 1: Agent Behavior Testing

```python
# testing.py
import pytest

def test_calculator_tool():
    """Test that agent uses calculator for math."""
    agent = create_simple_agent()

    response = agent.run("What is 25 * 47?")

    assert "1175" in response
    assert "calculator" in response.lower() or "tool" in response.lower()

def test_rag_grounding():
    """Test that RAG agent grounds responses."""
    agent = create_rag_agent()

    response = agent.run("What are AI agent components?")

    # Should mention knowledge base content
    assert "tools" in response.lower()
    assert "llm" in response.lower() or "language model" in response.lower()

def test_memory_retention():
    """Test that agent remembers conversation."""
    agent = create_simple_agent()
    conversation = []

    # First message
    response1 = agent.run("My name is Alice", conversation_history=conversation)
    conversation.extend([
        {"role": "user", "content": "My name is Alice"},
        {"role": "assistant", "content": response1}
    ])

    # Second message
    response2 = agent.run("What's my name?", conversation_history=conversation)

    assert "Alice" in response2
```

---

## Deployment Patterns

### Pattern 1: API Wrapper

```python
# api.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()
agent = create_simple_agent()

class UserRequest(BaseModel):
    message: str
    conversation_id: str = None

class AgentResponse(BaseModel):
    response: str
    conversation_id: str

# In-memory storage (use Redis in production)
conversations = {}

@app.post("/chat", response_model=AgentResponse)
async def chat(request: UserRequest):
    """Chat with agent."""
    try:
        # Get or create conversation history
        conv_id = request.conversation_id or str(uuid4())
        history = conversations.get(conv_id, [])

        # Run agent
        response = agent.run(request.message, conversation_history=history)

        # Update history
        history.extend([
            {"role": "user", "content": request.message},
            {"role": "assistant", "content": response}
        ])
        conversations[conv_id] = history

        return AgentResponse(response=response, conversation_id=conv_id)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## Summary Table: When to Use Each Pattern

| Pattern | Complexity | Tool Count | Use Case | Production Ready |
|---------|-----------|------------|----------|-----------------|
| **Simple Tool-Based** | Low | 1-10 | Starting out, proof of concept | ✅ With enhancements |
| **RAG-Enhanced** | Medium | 2-8 | Knowledge base, document QA | ✅ Common in production |
| **Specialized Sub-Agents** | Medium-High | 10-30 (split) | Distinct domains, complex workflows | ✅ With orchestration |
| **Multi-Agent System** | High | 30+ | Large-scale, enterprise systems | ⚠️ Requires expertise |

---

**Key Takeaway**: Start with Pattern 1 (Simple Tool-Based). Add RAG (Pattern 2) as soon as you need knowledge. Only move to specialized sub-agents (Pattern 3) when exceeding 10 tools. Multi-agent systems (Pattern 4) are advanced and usually overengineering for starters.

**Remember**: 80% of production agents use Pattern 2 (RAG-Enhanced). Master that first.
