# Anthropic's Official Guide to Building with Claude: A Practical Reference

**Compiled from Anthropic's official documentation and engineering blogs (2025)**

---

## Table of Contents

1. [Core Philosophy: Simplicity Over Complexity](#core-philosophy)
2. [Understanding Agentic Systems](#understanding-agentic-systems)
3. [When to Use (and NOT Use) Agents](#when-to-use-agents)
4. [Essential Workflows & Patterns](#essential-workflows)
5. [Prompt Engineering Best Practices](#prompt-engineering)
6. [Context Engineering for AI Agents](#context-engineering)
7. [Multi-Agent Systems Architecture](#multi-agent-architecture)
8. [Claude Code Best Practices](#claude-code-practices)
9. [Building Effective Tools](#building-effective-tools)
10. [Common Pitfalls & Anti-Patterns](#common-pitfalls)
11. [Production Readiness Checklist](#production-checklist)

---

## Core Philosophy: Simplicity Over Complexity

### The Golden Rule
> **Start with the simplest solution possible. Only increase complexity when needed.**

**Key Insight**: The most successful implementations aren't using complex frameworks or specialized libraries. They're built with **simple, composable patterns**.

### Three Core Principles for Building Agents

1. **Maintain Simplicity** - Simple designs are easier to debug, maintain, and scale
2. **Prioritize Transparency** - Show the agent's planning steps explicitly
3. **Carefully Craft ACI** - Agent-Computer Interface requires thorough tool documentation and testing

### When Frameworks Help (and When They Don't)

**When frameworks help**:
- Getting started quickly
- Simplifying standard low-level tasks (calling LLMs, defining tools)
- Prototyping and learning

**When frameworks hurt**:
- Creating extra abstraction layers that obscure prompts/responses
- Making debugging harder
- Tempting you to add unnecessary complexity

**Anthropic's Recommendation**: Start by using LLM APIs directly. Many patterns can be implemented in a few lines of code. If you use a framework, **ensure you understand the underlying code**.

---

## Understanding Agentic Systems

### The Critical Distinction: Workflows vs. Agents

**Workflows**
- LLMs and tools orchestrated through **predefined code paths**
- Predictable and consistent
- Best for well-defined tasks

**Agents**
- LLMs **dynamically direct their own processes** and tool usage
- Maintain control over how they accomplish tasks
- Best for flexible, model-driven decision-making at scale

### The Evolution: Prompt Engineering → Context Engineering

**Prompt Engineering** (The Foundation)
- Methods for writing and organizing LLM instructions
- Focus on system prompts and individual queries
- Best for one-shot classification or text generation

**Context Engineering** (The Next Level)
- Strategies for curating the **optimal set of tokens** during inference
- Managing: system instructions, tools, MCP, external data, message history
- Essential for agents operating over multiple turns and longer time horizons

---

## When to Use (and NOT Use) Agents

### When Agents Shine ✅

1. **Open-ended problems** where you can't predict the required steps
2. **Tasks requiring heavy parallelization** across independent subtasks
3. **Information that exceeds single context windows**
4. **Interfacing with numerous complex tools**
5. **High-value tasks** where the value justifies increased cost
6. **Breadth-first queries** requiring pursuing multiple directions simultaneously

### When Agents Struggle ❌

1. **Well-defined tasks** with clear, fixed paths
2. **Low-value tasks** where increased cost isn't justified
3. **Domains requiring all agents to share the same context**
4. **Tasks with many dependencies between agents**
5. **Most coding tasks** (fewer truly parallelizable tasks than research)

### The Complexity Tradeoff

**Agentic systems trade**:
- Latency → Better task performance
- Cost → More sophisticated capabilities
- Simplicity → Flexibility and autonomy

**Rule of thumb**: Optimize single LLM calls with retrieval and in-context examples first. Only add multi-step agentic systems when simpler solutions fall short.

---

## Essential Workflows & Patterns

### 1. The Augmented LLM (Building Block)

Every agentic system starts with an LLM enhanced with:
- **Retrieval** - Finding relevant information
- **Tools** - Interacting with external systems
- **Memory** - Retaining information across interactions

**Implementation Focus**: Tailor these capabilities to your specific use case and ensure they provide an easy, well-documented interface.

### 2. Prompt Chaining

**What it is**: Decompose a task into a sequence of steps, where each LLM call processes the output of the previous one.

**When to use**: Tasks that can be easily and cleanly decomposed into fixed subtasks.

**Example**: Generate marketing copy → Check it meets criteria → Translate to different language

**Why it works**: Trades latency for higher accuracy by making each LLM call an easier task.

### 3. Routing

**What it is**: Classify an input and direct it to a specialized followup task.

**When to use**: Complex tasks with distinct categories that are better handled separately.

**Examples**:
- Direct customer service queries (general questions, refund requests, technical support) to different downstream processes
- Route easy questions to smaller models (Haiku), hard questions to larger models (Sonnet)

**Why it works**: Separation of concerns allows specialized optimization.

### 4. Parallelization

**Two Key Variations**:

**Sectioning**: Break a task into independent subtasks run in parallel
- Example: One model processes user queries while another screens for inappropriate content

**Voting**: Run the same task multiple times to get diverse outputs
- Example: Several prompts review code for vulnerabilities, flag if any find problems

**When to use**: Subtasks can be parallelized for speed, or multiple perspectives needed for higher confidence.

### 5. Orchestrator-Workers

**What it is**: A central LLM dynamically breaks down tasks, delegates to worker LLMs, and synthesizes results.

**When to use**: Complex tasks where you can't predict the subtasks needed (coding, multi-file changes, search from multiple sources).

**Key Difference from Parallelization**: Subtasks aren't pre-defined; determined by orchestrator based on specific input.

### 6. Evaluator-Optimizer

**What it is**: One LLM generates a response while another provides evaluation and feedback in a loop.

**When to use**: Clear evaluation criteria exist, and iterative refinement provides measurable value.

**Signs of good fit**:
- LLM responses improve when human provides feedback
- LLM can provide useful feedback itself

**Example**: Literary translation where nuances might be missed initially.

---

## Prompt Engineering Best Practices

### Core Techniques (Use These First)

#### 1. Be Explicit and Clear

**❌ Vague**: "Create an analytics dashboard"
**✅ Explicit**: "Create an analytics dashboard. Include as many relevant features and interactions as possible. Go beyond the basics to create a fully-featured implementation."

**Best Practices**:
- Lead with direct action verbs: "Write," "Analyze," "Generate," "Create"
- Skip preambles and get straight to the request
- State what you want the output to **include**, not just what to work on
- Be specific about quality and depth expectations

#### 2. Provide Context and Motivation

**❌ Less effective**: "NEVER use bullet points"
**✅ More effective**: "I prefer responses in natural paragraph form rather than bullet points because I find flowing prose easier to read and more conversational. Bullet points feel too formal and list-like for my casual learning style."

**Why it works**: Explaining **why** something matters helps models better understand goals and deliver targeted responses.

**When to provide context**:
- Explaining the purpose or audience for the output
- Clarifying why certain constraints exist
- Describing how the output will be used
- Indicating what problem you're trying to solve

#### 3. Be Specific

**❌ Vague**: "Create a meal plan for a Mediterranean diet"
**✅ Specific**: "Design a Mediterranean diet meal plan for pre-diabetic management. 1,800 calories daily, emphasis on low glycemic foods. List breakfast, lunch, dinner, and one snack with complete nutritional breakdowns."

**What makes a prompt specific enough**:
- Clear constraints (word count, format, timeline)
- Relevant context (who's the audience, what's the goal)
- Desired output structure (table, list, paragraph)
- Requirements or restrictions (dietary needs, budget, technical constraints)

#### 4. Use Examples (Few-Shot Prompting)

**When to use**:
- The desired format is easier to show than describe
- You need a specific tone or style
- The task involves subtle patterns or conventions
- Simple instructions haven't produced consistent results

**Important**: Claude 4.x pays very close attention to details in examples. Ensure examples align with behaviors you want.

**Pro tip**: Start with one example (one-shot). Only add more (few-shot) if output still doesn't match needs.

#### 5. Give Permission to Express Uncertainty

**Example**: "Analyze this financial data and identify trends. If the data is insufficient to draw conclusions, say so rather than speculating."

**Why it works**: Reduces hallucinations and increases reliability by allowing model to acknowledge limitations.

### Advanced Techniques

#### Prefill the AI's Response

**What it is**: Start the AI's response for it, guiding format, tone, or structure.

**When to use**:
- Need JSON, XML, or structured formats
- Want to skip conversational preambles
- Need specific voice or character
- Want to control how AI begins response

**Example** (API usage):
```javascript
messages=[
    {"role": "user", "content": "Extract name and price into JSON"},
    {"role": "assistant", "content": "{"}
]
```

The AI will continue from the opening brace, outputting only valid JSON.

#### Chain of Thought Prompting

**What it is**: Request step-by-step reasoning before answering.

**Modern approach**: Claude offers **extended thinking** feature that automates this. Use it when available.

**When to use manual CoT**:
- Extended thinking isn't available
- Need transparent reasoning you can review
- Task requires multiple analytical steps

**Three implementations**:

**Basic**: Simply add "Think step-by-step" to instructions

**Guided**: Structure prompt to provide specific reasoning stages
```
Think before you write. First, analyze messaging. Then, identify relevant aspects. Finally, write.
```

**Structured**: Use tags to separate reasoning from final answer
```
Think in <thinking> tags. First, analyze. Then, identify. Finally, write in <email> tags.
```

#### Control Output Format

**1. Tell AI what TO do instead of what NOT to do**
- ❌ "Do not use markdown"
- ✅ "Your response should be composed of smoothly flowing prose paragraphs"

**2. Match prompt style to desired output**
- If you want minimal markdown, reduce markdown in your prompt

**3. Be explicit about formatting preferences**
```
When writing reports, use clear, flowing prose paragraphs. Reserve markdown for inline code, code blocks, and simple headings.

DO NOT use ordered or unordered lists unless presenting truly discrete items. Instead, incorporate items naturally into sentences.
```

### Troubleshooting Common Prompt Issues

| Problem | Solution |
|---------|----------|
| Response too generic | Add specificity, examples, or explicit requests for comprehensive output |
| Response off-topic | Be more explicit about actual goal; provide context about why you're asking |
| Format inconsistent | Add examples (few-shot) or use prefilling |
| Task too complex, unreliable results | Break into multiple prompts (chaining) |
| AI includes unnecessary preambles | Use prefilling or explicitly request: "Skip preamble" |
| AI makes up information | Explicitly give permission to say "I don't know" when uncertain |
| AI suggests changes when you wanted implementation | Be explicit about action: "Change this" not "Can you suggest changes?" |

### Common Mistakes to Avoid

1. **Don't over-engineer**: Longer, more complex prompts are NOT always better
2. **Don't ignore the basics**: Advanced techniques won't help if core prompt is unclear
3. **Don't assume AI reads minds**: Be specific about what you want
4. **Don't use every technique at once**: Select techniques that address your specific challenge
5. **Don't forget to iterate**: The first prompt rarely works perfectly
6. **Don't rely on outdated techniques**: XML tags and heavy role prompting are less necessary with modern models

---

## Context Engineering for AI Agents

### The Core Challenge: Attention Scarcity

**Key Insight**: LLMs have limited "attention budget." Every new token introduced depletes this budget, increasing the need to carefully curate tokens.

**Context rot**: As the number of tokens in context window increases, the model's ability to accurately recall information decreases.

**The guiding principle**: Find the **smallest possible set of high-signal tokens** that maximize the likelihood of desired outcome.

### The Anatomy of Effective Context

#### System Prompts

**Goal**: Extremely clear, simple, direct language at the **right altitude**.

**Two failure modes**:
1. **Too specific**: Hardcoding complex, brittle logic → fragility and maintenance complexity
2. **Too vague**: High-level guidance that fails to give concrete signals → poor behavior

**The sweet spot**: Specific enough to guide behavior effectively, yet flexible enough to provide strong heuristics.

**Best practices**:
- Organize into distinct sections with clear headers (`<background_information>`, `<instructions>`, `## Tool guidance`, `## Output description`)
- Use XML tagging or Markdown headers to delineate sections
- Strive for the **minimal set of information** that fully outlines expected behavior
- Start by testing a minimal prompt with best model available
- Add clear instructions and examples based on failure modes found during testing

#### Tools

**Critical importance**: Tools define the contract between agents and their information/action space.

**Best practices**:
- Promote efficiency by returning token-efficient information
- Be self-contained, robust to error, extremely clear about intended use
- Input parameters should be descriptive, unambiguous
- **Avoid bloated tool sets** that cover too much functionality

**Common failure mode**: Too many tools with overlapping functionality create ambiguous decision points.

**Rule of thumb**: If a human engineer can't definitively say which tool should be used in a given situation, an AI agent can't be expected to do better.

#### Examples (Few-Shot Prompting)

**❌ Don't**: Stuff a laundry list of edge cases into prompt trying to articulate every possible rule

**✅ Do**: Curate a set of diverse, canonical examples that effectively portray expected behavior

**Why**: For an LLM, examples are the "pictures" worth a thousand words.

### Context Retrieval Strategies

#### Just-in-Time Context (Agentic Search)

**Traditional approach**: Pre-processing all relevant data up front using embedding-based retrieval

**Just-in-time approach**: Maintain lightweight identifiers (file paths, stored queries, web links) and dynamically load data at runtime using tools

**Benefits**:
- Storage efficiency
- Metadata provides signals for behavior (folder hierarchies, naming conventions, timestamps)
- Enables progressive disclosure (incremental discovery through exploration)
- Agents maintain only necessary information in working memory

**Trade-off**: Runtime exploration is slower than retrieving pre-computed data

**Hybrid strategy**: Retrieve some data up front for speed, pursue autonomous exploration at discretion (used by Claude Code)

### Long-Horizon Task Techniques

For tasks that span tens of minutes to multiple hours:

#### 1. Compaction

**What it is**: Summarize conversation nearing context window limit, reinitiate new context with summary.

**Implementation**:
- Pass message history to model to summarize and compress critical details
- Preserve architectural decisions, unresolved bugs, implementation details
- Discard redundant tool outputs or messages

**Art of compaction**: Selection of what to keep vs. discard
- Start by maximizing recall (capture every relevant piece)
- Iterate to improve precision (eliminate superfluous content)

**Safe approach**: Tool result clearing (one of the lightest touch forms)

#### 2. Structured Note-Taking (Agentic Memory)

**What it is**: Agent regularly writes notes persisted to memory outside context window, pulled back in later.

**Examples**:
- Claude Code creating to-do list
- Custom agent maintaining NOTES.md file
- Claude playing Pokémon maintaining tallies across thousands of steps

**Benefits**:
- Persistent memory with minimal overhead
- Track progress across complex tasks
- Maintain critical context and dependencies

#### 3. Sub-Agent Architectures

**What it is**: Specialized sub-agents handle focused tasks with clean context windows. Main agent coordinates with high-level plan.

**How it works**:
- Main agent coordinates and synthesizes
- Subagents perform deep technical work or find information
- Each subagent might use tens of thousands of tokens
- Returns condensed summary (1,000-2,000 tokens)

**Benefits**:
- Clear separation of concerns
- Detailed search context isolated within sub-agents
- Lead agent focuses on synthesizing and analyzing

**Choice between approaches depends on task characteristics**:
- Compaction: Extensive back-and-forth required
- Note-taking: Iterative development with clear milestones
- Multi-agent: Complex research/analysis where parallel exploration pays dividends

---

## Multi-Agent Systems Architecture

### When Multi-Agent Systems Excel

**✅ Great for**:
- Open-ended research tasks
- Breadth-first queries (pursuing multiple independent directions simultaneously)
- Tasks requiring heavy parallelization
- Information exceeding single context windows
- Interfacing with numerous complex tools

**Performance Data**: Anthropic's internal eval showed multi-agent system (Opus 4 lead + Sonnet 4 subagents) outperformed single-agent Opus 4 by **90.2%** on research tasks.

**Example**: Multi-agent system found correct board members for IT S&P 500 companies by decomposing into subagent tasks. Single agent failed with slow, sequential searches.

### Why Multi-Agent Systems Work

**Three factors explain 95% of performance variance** (BrowseComp evaluation):
1. **Token usage** (explains 80% of variance) - More tokens = better performance
2. **Number of tool calls**
3. **Model choice**

**Key insight**: Multi-agent architectures effectively **scale token usage** for tasks exceeding single-agent limits.

### The Orchestrator-Worker Pattern

**Architecture**:
- Lead agent analyzes query, develops strategy, spawns subagents
- Subagents explore different aspects simultaneously
- Lead agent synthesizes results and decides if more research needed
- When sufficient information gathered, CitationAgent processes for proper attribution

**Workflow**:
1. User submits query
2. LeadResearcher plans approach (saves plan to Memory for persistence)
3. LeadResearcher creates specialized Subagents with specific tasks
4. Each Subagent independently performs searches, evaluates results
5. LeadResearcher synthesizes results, decides if more research needed
6. CitationAgent processes documents for citation identification
7. Final results with citations returned to user

### Prompt Engineering for Multi-Agent Systems

**Key difference from single-agent**: Rapid growth in coordination complexity

#### 8 Principles for Multi-Agent Prompting

1. **Think like your agents**
   - Build simulations to watch agents work step-by-step
   - Develop accurate mental model of agent behavior
   - This reveals failure modes immediately

2. **Teach the orchestrator how to delegate**
   - Each subagent needs: objective, output format, tool/source guidance, clear task boundaries
   - Without detailed task descriptions: duplication, gaps, missed information
   - Bad: Simple instructions like "research the semiconductor shortage"
   - Good: Specific objectives, clear division of labor

3. **Scale effort to query complexity**
   - Simple fact-finding: 1 agent with 3-10 tool calls
   - Direct comparisons: 2-4 subagents with 10-15 calls each
   - Complex research: 10+ subagents with clearly divided responsibilities
   - Prevents overinvestment in simple queries

4. **Tool design and selection are critical**
   - Agent-tool interfaces as critical as human-computer interfaces
   - Using wrong tool = strictly necessary for success
   - Bad tool descriptions send agents down completely wrong paths
   - Each tool needs distinct purpose and clear description

5. **Let agents improve themselves**
   - Claude 4 models are excellent prompt engineers
   - Given prompt and failure mode, can diagnose and suggest improvements
   - Tool-testing agent can rewrite tool descriptions to avoid failures
   - Result: 40% decrease in task completion time

6. **Start wide, then narrow down**
   - Search strategy should mirror expert human research
   - Explore landscape before drilling into specifics
   - Agents default to overly long, specific queries
   - Counteract: prompt to start with short, broad queries, progressively narrow

7. **Guide the thinking process**
   - Extended thinking mode = controllable scratchpad
   - Lead agent uses thinking to: plan approach, assess tools, determine complexity, define subagent roles
   - Subagents use interleaved thinking after tool results to: evaluate quality, identify gaps, refine next query

8. **Parallel tool calling transforms speed and performance**
   - Lead agent spins up 3-5 subagents in parallel (not serially)
   - Subagents use 3+ tools in parallel
   - Result: 90% reduction in research time for complex queries

**Prompting strategy focus**: Instill good heuristics rather than rigid rules. Study how skilled humans approach tasks, encode strategies in prompts.

### Effective Evaluation of Multi-Agent Systems

**Unique challenge**: Multi-agent systems don't follow same steps each time. Different valid paths can reach same goal.

**Evaluation principles**:

1. **Start evaluating immediately with small samples**
   - Early development = dramatic impact from small changes
   - 30% → 80% success rate possible with prompt tweak
   - Start with ~20 queries representing real usage patterns
   - Don't delay evals until you have hundreds of test cases

2. **LLM-as-judge evaluation scales when done well**
   - Research outputs = free-form text, rarely single correct answer
   - LLMs natural fit for grading outputs
   - Single LLM call with single prompt = most consistent and aligned with human judgments
   - Output scores 0.0-1.0 + pass-fail grade

3. **Human evaluation catches what automation misses**
   - Edge cases, hallucinated answers, system failures, subtle biases
   - Example: Agents chose SEO-optimized content farms over authoritative sources
   - Manual testing remains essential

**Key insight**: Multi-agent systems have emergent behaviors. Small changes to lead agent can unpredictably change how subagents behave.

### Production Reliability Challenges

**The fundamental difference**: In agentic systems, minor changes cascade into large behavioral changes.

#### Key Challenges

1. **Agents are stateful and errors compound**
   - Can run for long periods, maintaining state across many tool calls
   - Minor system failures = catastrophic for agents
   - Can't just restart from beginning (expensive, frustrating)
   - Solution: Build systems that can resume from where error occurred
   - Use model's intelligence to handle issues gracefully

2. **Debugging benefits from new approaches**
   - Agents make dynamic decisions, non-deterministic between runs
   - Users report "not finding obvious information" - can't see why
   - Solution: Full production tracing to diagnose failures
   - Monitor agent decision patterns and interaction structures
   - Maintain user privacy (don't monitor conversation contents)

3. **Deployment needs careful coordination**
   - Highly stateful webs of prompts, tools, execution logic
   - Can't update every agent to new version at same time
   - Solution: **Rainbow deployments** - gradually shift traffic from old to new versions
   - Keep both running simultaneously to avoid disrupting running agents

4. **Synchronous execution creates bottlenecks**
   - Lead agents execute subagents synchronously
   - Can't steer subagents, subagents can't coordinate
   - Entire system blocked while waiting for single subagent
   - Future: Asynchronous execution for additional parallelism
   - Trade-off: More complexity in result coordination, state consistency, error propagation

---

## Claude Code Best Practices

### 1. Customize Your Setup

#### CLAUDE.md Files

**What they are**: Special file Claude automatically pulls into context when starting conversation

**What to document**:
- Common bash commands
- Core files and utility functions
- Code style guidelines
- Testing instructions
- Repository etiquette (branch naming, merge vs rebase)
- Developer environment setup
- Unexpected behaviors or warnings
- Other information you want Claude to remember

**Where to place them**:
- Root of repo (check into git as `CLAUDE.md` or `.gitignore` as `CLAUDE.local.md`)
- Any parent directory (useful for monorepos)
- Any child directory (pulled in on demand when working with files there)
- Home folder (`~/.claude/CLAUDE.md`) for all sessions

**Pro tip**: Use `/init` command to auto-generate initial CLAUDE.md

#### Tune Your CLAUDE.md

**Common mistake**: Adding extensive content without iterating on effectiveness

**Best practices**:
- Treat CLAUDE.md as part of Claude's prompts (refine like frequently used prompt)
- Take time to experiment and determine what produces best instruction following
- Press `#` key to give instruction that auto-incorporates into relevant CLAUDE.md
- Document commands, files, style guidelines while coding
- Include CLAUDE.md changes in commits so team benefits
- Run through prompt improver occasionally
- Tune with emphasis ("IMPORTANT", "YOU MUST") to improve adherence

#### Curate Allowed Tools

**Default**: Claude requests permission for any action modifying system (file writes, bash commands, MCP tools)

**Customize allowlist**:
- Select "Always allow" when prompted during session
- Use `/permissions` command to add/remove tools
- Manually edit `.claude/settings.json` or `~/.claude.json`
- Use `--allowedTools` CLI flag for session-specific permissions

**Examples**:
- Add `Edit` to always allow file edits
- Add `Bash(git commit:*)` to allow git commits
- Add `mcp__puppeteer__puppeteer_navigate` to allow navigating with Puppeteer MCP

#### Install GitHub CLI (gh)

**Why**: Claude knows how to use `gh` CLI for:
- Creating issues
- Opening pull requests
- Reading comments
- And more...

**Without gh**: Claude can still use GitHub API or MCP server (if installed)

### 2. Give Claude More Tools

#### Use Claude with Bash Tools

**Claude inherits your bash environment** - has access to all your tools

**Help Claude learn your tools**:
1. Tell Claude the tool name with usage examples
2. Tell Claude to run `--help` to see tool documentation
3. Document frequently used tools in CLAUDE.md

#### Use Claude with MCP

**Claude Code functions as both MCP server and client**

**Connect MCP servers**:
- In project config (available when running in that directory)
- In global config (available in all projects)
- In checked-in `.mcp.json` file (available to anyone working in repo)

**Pro tip**: Use `--mcp-debug` flag to help identify configuration issues

#### Use Custom Slash Commands

**What they are**: Prompt templates stored in Markdown files within `.claude/commands` folder

**How to use**: Available through slash commands menu when you type `/`

**Special keyword**: `$ARGUMENTS` - pass parameters from command invocation

**Example**: `.claude/commands/fix-github-issue.md`
```
Please analyze and fix the GitHub issue: $ARGUMENTS.

Follow these steps:
1. Use `gh issue view` to get issue details
2. Understand the problem
3. Search codebase for relevant files
4. Implement necessary changes
5. Write and run tests
6. Ensure code passes linting and type checking
7. Create descriptive commit message
8. Push and create PR

Remember to use GitHub CLI (`gh`) for all GitHub tasks.
```

**Usage**: `/project:fix-github-issue 1234`

**Check into git**: Make commands available to rest of team

**Personal commands**: Add to `~/.claude/commands` folder

### 3. Try Common Workflows

#### Explore, Plan, Code, Commit

**Versatile workflow for many problems**:

1. **Ask Claude to read relevant files, images, or URLs**
   - Provide general pointers ("read file that handles logging")
   - Or specific filenames ("read logging.py")
   - **Explicitly tell it not to write any code yet**
   - Use subagents to verify details or investigate questions (preserves context)

2. **Ask Claude to make a plan**
   - Use word "think" to trigger extended thinking mode
   - Levels: "think" < "think hard" < "think harder" < "ultrathink"
   - Each level allocates progressively more thinking budget
   - If results reasonable, create document or GitHub issue with plan

3. **Ask Claude to implement solution in code**
   - Good place to explicitly verify reasonableness of solution

4. **Ask Claude to commit result and create pull request**
   - Update READMEs or changelogs with explanation

**Why steps #1-#2 are crucial**: Without them, Claude jumps straight to coding. Research and planning first significantly improves performance for deeper thinking tasks.

#### Write Tests, Commit; Code, Iterate, Commit

**Anthropic-favorite for easily verifiable changes**:

1. **Ask Claude to write tests based on expected input/output pairs**
   - Be explicit about doing TDD
   - Avoid creating mock implementations (even for non-existent functionality)

2. **Tell Claude to run tests and confirm they fail**
   - Explicitly tell it not to write implementation code

3. **Ask Claude to commit tests** when satisfied

4. **Ask Claude to write code that passes tests**
   - Instruct not to modify tests
   - Tell to keep going until all tests pass
   - Verify with independent subagents that implementation isn't overfitting

5. **Ask Claude to commit code** when satisfied

**Why it works**: Claude performs best with clear target to iterate against (visual mock, test case, output format).

#### Write Code, Screenshot Result, Iterate

**Similar to testing workflow**:

1. **Give Claude way to take browser screenshots**
   - Puppeteer MCP server
   - iOS simulator MCP server
   - Manually copy/paste screenshots

2. **Give Claude visual mock**
   - Copy/paste or drag-drop image
   - Give image file path

3. **Ask Claude to implement design, take screenshots, iterate**
   - Until result matches mock

4. **Ask Claude to commit** when satisfied

**Why it works**: Like humans, Claude's outputs improve significantly with iteration (2-3 iterations = much better).

#### Codebase Q&A

**When onboarding to new codebase**:

Ask Claude same questions you'd ask another engineer:
- How does logging work?
- How do I make a new API endpoint?
- What does `async move { ... }` do on line 134?
- What edge cases does `CustomerOnboardingFlowImpl` handle?
- Why call `foo()` instead of `bar()` on line 333?

**No special prompting required** - simply ask questions, Claude will explore code to find answers

**Anthropic's core onboarding workflow** - significantly improves ramp-up time

#### Use Claude with Git

**Many Anthropic engineers use Claude for 90%+ of git interactions**:

- **Searching git history**:
  - "What changes made it into v1.2.3?"
  - "Who owns this particular feature?"
  - "Why was this API designed this way?"
  - Explicitly prompt to look through git history

- **Writing commit messages**: Claude looks at changes and recent history to compose message

- **Handling complex operations**:
  - Reverting files
  - Resolving rebase conflicts
  - Comparing and grafting patches

#### Use Claude with GitHub

**Claude Code can manage many GitHub interactions**:

- **Creating pull requests**: Claude understands "pr" shorthand
- **Implementing one-shot resolutions** for code review comments
- **Fixing failing builds** or linter warnings
- **Categorizing and triaging open issues**

**Eliminates need** to remember `gh` command syntax while automating routine tasks

#### Use Claude with Jupyter Notebooks

**Researchers and data scientists at Anthropic use Claude Code** to read and write Jupyter notebooks

**Claude can interpret outputs, including images** - fast way to explore and interact with data

**Recommended workflow**: Have Claude Code and `.ipynb` file open side-by-side in VS Code

**Pro tip**: Ask to make notebook or data visualizations "aesthetically pleasing" - reminds it to optimize for human viewing

### 4. Optimize Your Workflow

#### Be Specific in Instructions

**Claude's success rate improves significantly with more specific instructions, especially on first attempts**

| Poor | Good |
|------|------|
| add tests for foo.py | write a new test case for foo.py, covering the edge case where the user is logged out. avoid mocks |
| why does ExecutionFactory have such a weird api? | look through ExecutionFactory's git history and summarize how its api came to be |
| add a calendar widget | look at how existing widgets are implemented on the home page to understand patterns. HotDogWidget.php is good example. then follow pattern to implement calendar widget that lets user select month and paginate. Build from scratch without libraries other than ones already used. |

**Key**: Claude can infer intent, but can't read minds. Specificity leads to better alignment.

#### Give Claude Images

**How**:
- Paste screenshots (cmd+ctrl+shift+4 on macOS, ctrl+v to paste)
- Drag and drop images directly into prompt
- Provide file paths for images

**Particularly useful for**:
- Design mocks as reference points for UI development
- Visual charts for analysis and debugging

**Pro tip**: If not adding visuals, be clear about how important visual appeal is for result

#### Mention Files You Want Claude to Look At

**Use tab-completion** to quickly reference files or folders anywhere in repository

**Helps Claude find or update right resources**

#### Give Claude URLs

**Paste specific URLs** alongside prompts

**To avoid permission prompts** for same domains, use `/permissions` to add domains to allowlist

#### Course Correct Early and Often

**You'll typically get better results by being active collaborator and guiding Claude's approach**

**Four tools for course correction**:

1. **Ask Claude to make a plan** before coding
   - Explicitly tell it not to code until you've confirmed plan

2. **Press Escape to interrupt** Claude during any phase
   - Preserves context so you can redirect or expand instructions

3. **Double-tap Escape to jump back in history**
   - Edit previous prompt, explore different direction
   - Repeat until you get result you're looking for

4. **Ask Claude to undo changes**
   - Often in conjunction with option #2 to take different approach

**Though Claude occasionally solves problems perfectly on first attempt, using these correction tools generally produces better solutions faster**

#### Use `/clear` to Keep Context Focused

**During long sessions**, Claude's context window can fill with irrelevant conversation

**This reduces performance and sometimes distracts Claude**

**Use `/clear` command frequently between tasks to reset context window**

#### Use Checklists and Scratchpads

**For large tasks with multiple steps** - code migrations, fixing numerous lint errors, running complex build scripts

**Improve performance by having Claude use Markdown file (or GitHub issue) as checklist and working scratchpad**

**Example**: Fix large number of lint issues
1. Tell Claude to run lint command and write all errors to Markdown checklist
2. Instruct Claude to address each issue one by one, fixing and verifying before checking off

#### Pass Data Into Claude

**Several methods**:
- **Copy and paste** directly into prompt (most common)
- **Pipe into Claude Code** (`cat foo.txt | claude`) - particularly useful for logs, CSVs, large data
- **Tell Claude to pull data** via bash commands, MCP tools, custom slash commands
- **Ask Claude to read files** or fetch URLs (works for images too)

**Most sessions involve combination of these approaches**

### 5. Use Headless Mode to Automate Infra

**Headless mode**: Non-interactive contexts like CI, pre-commit hooks, build scripts, automation

**Use `-p` flag with prompt** to enable headless mode

**Use `--output-format stream-json`** for streaming JSON output

**Note**: Headless mode doesn't persist between sessions (must trigger each session)

#### Use Claude for Issue Triage

**Headless mode can power automations triggered by GitHub events**

**Example**: When new issue created, Claude inspects and assigns appropriate labels

#### Use Claude as Linter

**Claude Code can provide subjective code reviews** beyond traditional linting:
- Typos
- Stale comments
- Misleading function or variable names
- And more...

### 6. Uplevel with Multi-Claude Workflows

**Some of most powerful applications involve running multiple Claude instances in parallel**

#### Have One Claude Write Code; Use Another to Verify

**Simple but effective**:
1. Use Claude to write code
2. Run `/clear` or start second Claude in another terminal
3. Have second Claude review first Claude's work
4. Start another Claude (or `/clear` again) to read both code and review feedback
5. Have this Claude edit code based on feedback

**Similar approach with tests**: Have one Claude write tests, another write code to make tests pass

**Communication**: Give Claude instances separate working scratchpads, tell them which to write to and which to read from

**This separation often yields better results** than having single Claude handle everything

#### Have Multiple Checkouts of Your Repo

**Many Anthropic engineers do this**:
1. Create 3-4 git checkouts in separate folders
2. Open each folder in separate terminal tabs
3. Start Claude in each folder with different tasks
4. Cycle through to check progress and approve/deny permission requests

**Benefit**: Rather than waiting for Claude to complete each step, work on multiple parts in parallel

#### Use Git Worktrees

**Shines for multiple independent tasks** - lighter-weight alternative to multiple checkouts

**Git worktrees**: Check out multiple branches from same repository into separate directories

**Each worktree has**:
- Own working directory with isolated files
- Same Git history and reflog

**Benefits**:
- Run multiple Claude sessions simultaneously on different parts of project
- Each focused on independent task
- Each Claude works at full speed without waiting for others
- No merge conflicts since tasks don't overlap

**How to use**:
1. Create worktrees: `git worktree add ../project-feature-a feature-a`
2. Launch Claude in each worktree: `cd ../project-feature-a && claude`
3. Create additional worktrees as needed (repeat steps 1-2 in new terminal tabs)

**Tips**:
- Use consistent naming conventions
- Maintain one terminal tab per worktree
- If using iTerm2 on Mac, set up notifications for when Claude needs attention
- Use separate IDE windows for different worktrees
- Clean up when finished: `git worktree remove ../project-feature-a`

#### Use Headless Mode with Custom Harness

**`claude -p` (headless mode)** integrates Claude Code programmatically into larger workflows

**Two primary patterns**:

**Fanning out** (large migrations or analyses):
1. Have Claude write script to generate task list (e.g., 2k files to migrate)
2. Loop through tasks, calling Claude programmatically for each
3. Give each task and set of tools it can use

**Example**:
```bash
claude -p "migrate foo.py from React to Vue. When done, you MUST return OK if succeeded, or FAIL if failed." --allowedTools Edit Bash(git commit:*)
```

**Pipelining** (integrate into existing data/processing pipelines):
```bash
claude -p "<your prompt>" --json | your_command
```

**JSON output** (optional) helps provide structure for easier automated processing

**Pro tip**: Use `--verbose` flag for debugging (turn off in production for cleaner output)

---

## Building Effective Tools

### The Fundamental Shift

**Traditional software**: Contract between deterministic systems
- `getWeather("NYC")` always fetches NYC weather same way

**Tools**: Contract between deterministic systems and non-deterministic agents
- Agent might call weather tool, answer from general knowledge, or ask clarifying question
- Might hallucinate or fail to grasp how to use tool

**Implication**: Rethink approach when writing software for agents. Design tools **for agents**, not for developers or systems.

### How to Write Tools

#### 1. Build a Prototype

**It's difficult to anticipate which tools agents will find ergonomic** without getting hands-on

**Start by standing up quick prototype**:
- If using Claude Code to write tools, give it documentation for any libraries/APIs/SDKs
- LLM-friendly documentation commonly found in flat `llms.txt` files on official docs sites

**Test tools yourself** to identify rough edges

**Collect feedback from users** to build intuition around use-cases and prompts

#### 2. Run an Evaluation

**Need to measure how well Claude uses your tools**

**Generating evaluation tasks**:
- Collaborate with agent to help analyze results and determine improvements
- Generate lots of evaluation tasks grounded in real world uses
- Prompts should be based on realistic data sources and services
- Avoid overly simplistic or superficial "sandbox" environments

**Strong tasks examples**:
- "Schedule a meeting with Jane next week to discuss Acme Corp project. Attach notes from last planning meeting and reserve conference room."
- "Customer ID 9182 charged three times for single purchase. Find all relevant log entries and determine if other customers affected."
- "Customer Sarah Chen submitted cancellation request. Prepare retention offer. Determine: why leaving, what offer compelling, any risk factors."

**Weaker tasks examples**:
- "Schedule a meeting with jane@acme.corp next week."
- "Search payment logs for `purchase_complete` and `customer_id=9182`."
- "Find cancellation request by Customer ID 45892."

**Running the evaluation**:
- Run programmatically with direct LLM API calls
- Use simple agentic loops (`while`-loops wrapping alternating LLM API and tool calls)
- One loop for each evaluation task
- Give each agent single task prompt and your tools

**In system prompts**: Instruct agents to output not just structured response blocks, but also **reasoning and feedback blocks** (before tool call and response blocks)
- This may increase LLMs' effective intelligence by triggering chain-of-thought behaviors
- With Claude, turn on **interleaved thinking** for similar functionality "off-the-shelf"

**Collect metrics**:
- Top-level accuracy
- Total runtime of individual tool calls and tasks
- Total number of tool calls
- Total token consumption
- Tool errors

**Analyzing results**:
- Agents are helpful partners in spotting issues
- Observe where agents get stumped or confused
- Read through evaluation agents' reasoning and feedback to identify rough edges
- Review raw transcripts (including tool calls and responses)
- **What agents omit can be more important than what they include**

#### 3. Collaborate with Agents

**You can even let agents analyze results and improve tools for you**

**Simply concatenate transcripts from evaluation agents and paste into Claude Code**

**Claude is expert at**:
- Analyzing transcripts
- Refactoring lots of tools all at once
- Ensuring tool implementations and descriptions remain self-consistent when new changes made

**Example**: Most advice in this post came from repeatedly optimizing internal tool implementations with Claude Code

### Principles for Writing Effective Tools

#### 1. Choosing the Right Tools for Agents

**More tools don't always lead to better outcomes**

**Common error**: Tools that merely wrap existing software functionality or API endpoints—whether or not appropriate for agents

**Why**: Agents have distinct "affordances" to traditional software - different ways of perceiving potential actions

**Example**: Searching for contact in address book
- Traditional software: Efficiently store and process list, check each one
- LLM agent: Tool that returns ALL contacts then reads through each token-by-token = wastes limited context
- Better approach: `search_contacts` or `message_contact` tool instead of `list_contacts`

**Recommendation**: Build a few thoughtful tools targeting specific high-impact workflows, matching evaluation tasks, scaling up from there

**Tools can consolidate functionality**:
- Handle multiple discrete operations (or API calls) under the hood
- Enrich tool responses with related metadata
- Handle frequently chained, multi-step tasks in single tool call

**Examples**:
- Instead of `list_users`, `list_events`, `create_event`: Implement `schedule_event` (finds availability and schedules)
- Instead of `read_logs`: Implement `search_logs` (returns only relevant log lines and context)
- Instead of `get_customer_by_id`, `list_transactions`, `list_notes`: Implement `get_customer_context` (compiles all recent & relevant information)

**Make sure each tool** has clear, distinct purpose. Too many or overlapping tools can distract agents.

#### 2. Namespacing Your Tools

**Agents will potentially gain access to dozens of MCP servers and hundreds of different tools**

**When tools overlap or have vague purpose, agents get confused**

**Namespacing** (grouping related tools under common prefixes) helps delineate boundaries

**Examples**:
- By service: `asana_search`, `jira_search`
- By resource: `asana_projects_search`, `asana_users_search`

**Impact**: Selecting between prefix- and suffix-based namespacing has non-trivial effects on tool-use evaluations (varies by LLM)

**Benefits**:
- Reduces number of tools and tool descriptions in agent's context
- Offloads agentic computation from agent's context back into tool calls
- Reduces agent's overall risk of making mistakes

#### 3. Returning Meaningful Context from Tools

**Tool implementations should return only high signal information back to agents**

**Prioritize**:
- Contextual relevance over flexibility
- Natural language names/terms/identifiers over cryptic ones

**Avoid**: Low-level technical identifiers (e.g., `uuid`, `256px_image_url`, `mime_type`)

**Prefer**: Fields like `name`, `image_url`, `file_type` - more likely to inform agents' downstream actions

**Example impact**: Merely resolving arbitrary alphanumeric UUIDs to semantically meaningful language (or 0-indexed ID scheme) significantly improves Claude's precision in retrieval tasks by reducing hallucinations

**Flexible approach**: Expose `response_format` enum parameter to control verbosity

**Example**:
```enum
enum ResponseFormat {
   DETAILED = "detailed",
   CONCISE = "concise"
}
```

- "DETAILED": Return all fields including technical IDs for further tool calls
- "CONCISE": Return only content, exclude IDs

**Result**: ~⅓ of tokens with "concise" responses vs. "detailed"

#### 4. Optimizing Tool Responses for Token Efficiency

**Implement some combination of**:
- Pagination
- Range selection
- Filtering
- Truncation (with sensible default parameter values)

**For Claude Code**: Restrict tool responses to 25,000 tokens by default

**If truncating**: Steer agents with helpful instructions
- Encourage token-efficient strategies (many small, targeted searches vs. single broad search)
- Prompt-engineer error responses to clearly communicate specific and actionable improvements

**Example helpful error response**:
❌ "Error: Invalid parameter"
✅ "Error: The 'date' parameter must be in ISO 8601 format (e.g., '2025-01-15'). You provided 'Jan 15th'."

#### 5. Prompt-Engineering Your Tool Descriptions

**One of most effective methods for improving tools**

**Think**: How would you describe tool to new hire on team?

**Consider context you might implicitly bring**:
- Specialized query formats
- Definitions of niche terminology
- Relationships between underlying resources
- Make it explicit

**Best practices**:
- Avoid ambiguity
- Clearly describe (and enforce with strict data models) expected inputs and outputs
- Input parameters should be unambiguously named: `user_id` instead of `user`

**With evaluation**: Can measure impact of prompt engineering with greater confidence

**Small refinements yield dramatic improvements**: Claude Sonnet 3.5 achieved state-of-the-art on SWE-bench Verified after precise refinements to tool descriptions

### Looking Ahead: Future of Tools

**To build effective tools for agents**, need to re-orient software development from deterministic to non-deterministic patterns

**Effective tools are**:
- Intentionally and clearly defined
- Use agent context judiciously
- Can be combined in diverse workflows
- Enable agents to intuitively solve real-world tasks

**Expect mechanisms to evolve**:
- Updates to MCP protocol
- Upgrades to underlying LLMs

**With systematic, evaluation-driven approach**: Can ensure tools evolve alongside agents as they become more capable

---

## Common Pitfalls & Anti-Patterns

### Prompt Engineering Mistakes

1. **Over-engineering prompts**
   - Longer ≠ better
   - Start simple, add complexity only when needed

2. **Ignoring the basics**
   - Advanced techniques won't help if core prompt is unclear
   - Clarity first, sophistication second

3. **Assuming mind-reading**
   - Be explicit about requirements
   - Ambiguity = misinterpretation

4. **Using every technique at once**
   - Select techniques addressing specific challenge
   - More ≠ better

5. **Relying on outdated techniques**
   - XML tags and heavy role prompting less necessary with modern models
   - Start with explicit, clear instructions

### Context Engineering Mistakes

1. **Treating context as infinite resource**
   - Context has diminishing marginal returns
   - Every token depletes attention budget

2. **Overstuffing prompts with examples**
   - Don't laundry list every edge case
   - Curate diverse, canonical examples

3. **Pre-loading too much information**
   - Consider just-in-time retrieval
   - Lightweight identifiers + dynamic loading

4. **Ignoring context management for long tasks**
   - Implement compaction, note-taking, or sub-agents
   - Don't let context window limit task duration

### Multi-Agent System Mistakes

1. **Vague delegation instructions**
   - Each subagent needs: objective, output format, tool guidance, task boundaries
   - Bad: "Research X"
   - Good: "Research X aspect Y, using sources A and B, produce Z format"

2. **No scaling rules**
   - Agents bad at judging effort
   - Embed rules: simple = 1 agent/3-10 calls, complex = 10+ subagents

3. **Poor tool design**
   - Agent-tool interfaces as critical as human-computer interfaces
   - Each tool needs distinct purpose, clear description

4. **Sequential instead of parallel**
   - Subagents should work in parallel, not serially
   - Parallel tool calling = 90% speed improvement

5. **Insufficient evaluation**
   - Start evaluating immediately with small samples
   - Don't wait for hundreds of test cases

### Tool Building Mistakes

1. **Wrapping every API endpoint**
   - More tools ≠ better outcomes
   - Build thoughtful tools targeting specific workflows
   - Tools can consolidate multiple operations

2. **Overlapping tool functionality**
   - If human can't say which tool to use, agent can't either
   - Each tool needs clear, distinct purpose

3. **Returning low-value data**
   - Return only high signal information
   - Avoid technical IDs, prefer natural language
   - Implement concise/detailed response formats

4. **Poor tool descriptions**
   - Think: explaining to new hire
   - Make implicit context explicit
   - Unambiguous parameter names
   - Small refinements yield dramatic improvements

5. **Ignoring token efficiency**
   - Implement pagination, filtering, truncation
   - Every token in response depletes attention budget
   - Prompt-engineer error messages

### Production Mistakes

1. **Underestimating statefulness**
   - Agents are stateful, errors compound
   - Can't restart from beginning (expensive)
   - Build resumption capability

2. **Insufficient observability**
   - Need full production tracing
   - Monitor decision patterns, not just conversation contents
   - Debugging requires seeing agent reasoning

3. **Big bang deployments**
   - Can't update all agents at once
   - Use rainbow deployments (gradual traffic shift)
   - Keep old and new running simultaneously

4. **Synchronous bottlenecks**
   - Synchronous subagent execution creates bottlenecks
   - Consider asynchronous for additional parallelism
   - Trade-off: more coordination complexity

---

## Production Readiness Checklist

### Planning Phase

- [ ] **Task clearly defined** with measurable objectives
- [ ] **Success criteria established** (how will we know it works?)
- [ ] **Agentic approach justified** (why not simpler solution?)
- [ ] **Value proposition clear** (does task value justify increased cost?)
- [ ] **Complexity appropriately scoped** (start simple, add as needed)

### Design Phase

- [ ] **System prompt at right altitude** (not too specific, not too vague)
- [ ] **Tools carefully selected** (minimal set, clear purposes)
- [ ] **Tool descriptions prompt-engineered** (tested with agents)
- [ ] **Workflow pattern chosen** (chaining, routing, parallelization, etc.)
- [ ] **Multi-agent architecture justified** (if used, why necessary?)
- [ ] **Context management strategy** (compaction, note-taking, sub-agents)

### Implementation Phase

- [ ] **Prototype built and tested locally**
- [ ] **CLAUDE.md files created** with project-specific guidance
- [ ] **Custom slash commands defined** for repeated workflows
- [ ] **MCP servers configured** (if using)
- [ ] **Permissions allowlist curated** (balance safety vs. efficiency)
- [ ] **Error handling implemented** (graceful degradation, not crashes)

### Testing Phase

- [ ] **Evaluation tasks created** (grounded in real-world uses)
- [ ] **Strong test cases** (not overly simplistic, require multiple tool calls)
- [ ] **Metrics defined** (accuracy, runtime, token consumption, tool errors)
- [ ] **LLM-as-judge evaluation** (for free-form outputs)
- [ ] **Human evaluation conducted** (catches edge cases automation misses)
- [ ] **Failure modes analyzed** (read transcripts, identify rough edges)
- [ ] **Tools optimized** based on evaluation results

### Deployment Phase

- [ ] **Observability in place** (full production tracing, decision monitoring)
- [ ] **Rainbow deployment strategy** (gradual traffic shift, not big bang)
- [ ] **Resumption capability** (can recover from errors without restart)
- [ ] **Context window management** (compaction triggers, memory systems)
- [ ] **Rate limiting considered** (multi-agent systems consume tokens fast)
- [ ] **Cost monitoring** (track token consumption, tool calls)

### Operational Phase

- [ ] **Performance dashboards** (latency, accuracy, cost per task)
- [ ] **Error tracking** (tool failures, agent confusion, hallucinations)
- [ ] **User feedback loops** (collect issues, patterns)
- [ ] **Regular prompt reviews** (optimize based on production data)
- [ ] **Tool iteration** (continuously improve based on usage)
- [ ] **Documentation maintained** (keep CLAUDE.md current, document workflows)

---

## Quick Reference: Choosing the Right Approach

### Single LLM Call
- **When**: Simple, well-defined task
- **Example**: Classify sentiment, extract named entities

### Optimized Single Call + Retrieval
- **When**: Task needs external knowledge
- **Example**: Answer questions about documents

### Workflow (Prompt Chaining)
- **When**: Task decomposes into fixed sequential steps
- **Example**: Generate → Review → Refine content

### Workflow (Routing)
- **When**: Distinct categories need different handling
- **Example**: Customer service query routing

### Workflow (Parallelization)
- **When**: Independent subtasks or multiple perspectives needed
- **Example**: Code review from multiple angles

### Workflow (Orchestrator-Workers)
- **When**: Can't predict subtasks in advance
- **Example**: Multi-file code changes

### Workflow (Evaluator-Optimizer)
- **When**: Clear evaluation criteria, iterative refinement valuable
- **Example**: Translation, complex search

### Agent
- **When**: Open-ended problem, unpredictable steps, high-value task
- **Example**: Research projects, complex migrations

### Multi-Agent System
- **When**: Heavy parallelization, breadth-first queries, information exceeds single context window
- **Example**: Comprehensive research across multiple sources

---

## Final Thoughts

**The art of building with Claude isn't about using the most sophisticated system. It's about building the right system for your needs.**

**Start simple**:
1. Optimize single LLM calls with retrieval and in-context examples
2. Add multi-step workflows only when simpler solutions fall short
3. Consider agents only for open-ended problems requiring autonomy
4. Use multi-agent architectures when parallelization provides clear value

**Remember**: Every layer of complexity adds cost, latency, and potential for errors. Only add complexity when it **demonstrably improves outcomes**.

**The guiding principle across all techniques**: Find the smallest set of high-signal tokens that maximize the likelihood of your desired outcome.

**Test everything**: Evaluations are essential. Start small, iterate based on results, and scale what works.

---

## Sources

This guide was compiled from Anthropic's official documentation and engineering blogs:

- [Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) - Core principles and workflow patterns
- [How We Built Our Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system) - Multi-agent architecture and lessons learned
- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices) - Practical tips for agentic coding
- [Best Practices for Prompt Engineering](https://claude.com/blog/best-practices-for-prompt-engineering) - Prompt engineering fundamentals
- [Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) - Context management strategies
- [Writing Effective Tools for AI Agents](https://www.anthropic.com/engineering/writing-tools-for-agents) - Tool design and optimization

**Last Updated**: January 2025 based on Anthropic's latest documentation

---

## Appendix: Key Takeaways by Role

### For Engineers Building Agents

- Start with LLM APIs directly, not frameworks
- Build prototypes quickly, test with real tasks
- Use CLAUDE.md files to capture project-specific context
- Create custom slash commands for repeated workflows
- Use multi-Claude workflows for parallel development
- Implement evaluation from day one (start small, scale up)

### For Product Managers

- Agentic systems trade latency/cost for better performance
- Multi-agent systems require high-value tasks to justify cost
- Production gap is wider than anticipated (plan accordingly)
- Evaluations are essential for reliable systems
- Human oversight remains crucial despite autonomy

### For Technical Leaders

- Simplicity wins over complexity (most successful implementations use simple patterns)
- Context engineering is as important as prompt engineering
- Multi-agent systems need specialized testing approaches
- Rainbow deployments required (can't update all agents at once)
- Observability is non-negotiable (need full tracing)

### For Researchers

- Token usage explains 80% of performance variance
- Multi-agent systems outperform single-agent by 90%+ on research tasks
- Parallel tool calling reduces research time by 90%
- Extended thinking improves instruction-following, reasoning, efficiency
- Agents can be excellent prompt engineers (let them improve themselves)

---

**End of Guide**
