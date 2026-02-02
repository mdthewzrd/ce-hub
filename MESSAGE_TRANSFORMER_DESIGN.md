# 💬 Message Transformer Agent Design
## Auto-Convert Natural Messages to Proper Prompts

**The Problem:** You want to send simple messages like "fix this bug" and have them transformed into proper prompts automatically.

**The Solution:** A preprocessing agent that:
1. Receives your natural message
2. Analyzes context and intent
3. Transforms into proper prompt format
4. Asks clarifying questions if needed
5. Sends to main Claude agent

---

## Architecture

```
You (Natural Message)
        ↓
┌─────────────────────────────┐
│  Message Transformer Agent  │
│  (Preprocessor)             │
└─────────────────────────────┘
        ↓
    Analyzes:
    - Intent (build/edit/fix/test?)
    - Context (project, files, state)
    - Clarity (missing info?)
        ↓
    [Needs clarification?]
        ↓ YES
    Ask you questions
        ↓
    [Get answers]
        ↓
    Transform to proper prompt
        ↓
┌─────────────────────────────┐
│  Main Claude Agent          │
│  (Does the actual work)     │
└─────────────────────────────┘
```

---

## How It Works

### Your Experience (Simple)

**You send:**
```
fix the bug in the trading scanner where it's not returning results
```

**Transformer automatically creates:**
```markdown
# 🐛 Bug Report Request

**Bug Summary:** Trading scanner not returning results

**Severity:** High - Scanner is non-functional

**Reproduction:**
1. Run the trading scanner
2. Expected: Scanner returns trading signals
3. Actual: No results returned

**Context:**
- Project: Trading Scanner System
- File: Likely in `projects/edge-dev-main/backend/` or similar
- Recent changes: [Check if scanner was recently modified]

**Debugging Information Needed:**
- Error messages in console/logs
- Scanner configuration
- Data source connections
- API endpoints being called

**Expected Fix:**
- Identify why scanner returns no results
- Fix the underlying issue
- Validate scanner returns expected results
- Add error handling if needed

**Success Criteria:**
- [ ] Scanner returns trading signals
- [ ] No errors in console
- [ ] Results match expected format
```

---

## Transformer Agent Implementation

### Simple Version (First Implementation)

```python
# message_transformer.py

from pydantic_ai import Agent, RunContext
from typing import Optional

class MessageTransformer:
    """
    Preprocesses your natural messages and transforms them into proper prompts.
    """

    def __init__(self):
        # Load session context
        self.current_session = self.load_session_context()
        self.project_context = self.load_project_context()

    def transform(self, message: str) -> tuple[str, bool]:
        """
        Transform your message into a proper prompt.

        Returns:
            (transformed_prompt, needs_clarification)
        """
        # Analyze the message
        intent = self.analyze_intent(message)

        # Check if we have enough context
        if self.needs_clarification(intent, message):
            questions = self.generate_clarifying_questions(intent, message)
            return questions, True  # Needs clarification

        # Transform to proper prompt
        template = self.get_template_for_intent(intent)
        transformed = template.fill(
            message=message,
            context=self.current_session,
            project=self.project_context
        )

        return transformed, False

    def analyze_intent(self, message: str) -> str:
        """Determine what kind of request this is."""
        # Use simple keyword detection or LLM
        keywords = {
            'build': ['implement', 'create', 'add', 'build', 'feature'],
            'edit': ['modify', 'change', 'update', 'edit', 'refactor'],
            'fix': ['fix', 'bug', 'broken', 'error', 'not working'],
            'test': ['test', 'validate', 'check', 'verify'],
            'research': ['find', 'look for', 'explore', 'where is'],
        }

        for intent, words in keywords.items():
            if any(word in message.lower() for word in words):
                return intent

        return 'general'

    def needs_clarification(self, intent: str, message: str) -> bool:
        """Check if we need more information."""
        # Check for common issues
        if len(message) < 20:  # Too short
            return True

        if intent == 'fix' and 'error' not in message.lower():
            return True  # Bug report without error details

        if intent == 'build' and 'feature' not in message.lower():
            return True  # Build request without clear feature

        return False

    def generate_clarifying_questions(self, intent: str, message: str) -> str:
        """Generate questions to clarify your request."""
        questions = {
            'build': """I'd like to help you build this! I need a bit more info:

**What specific feature do you want to build?**
- Brief description:

**Where should this go?**
- File/component:

**Any requirements or constraints?**
- Must:
- Must not: """,

            'fix': """I'll help fix that bug! I need some details:

**What error are you seeing?**
- Error message:

**Where is this happening?**
- File/function:

**How do I reproduce it?**
- Steps to reproduce: """,

            'edit': """I'll help you modify that code! Quick question:

**What specific change do you need?**
- Change:

**Which file needs editing?**
- File path: """
        }

        return questions.get(intent, "Could you provide more details about what you need?")

    def get_template_for_intent(self, intent: str) -> PromptTemplate:
        """Get the right template for this intent."""
        templates = {
            'build': '_NEW_WORKFLOWS_/prompts/phases/building/feature-implementation.md',
            'edit': '_NEW_WORKFLOWS_/prompts/phases/editing/surgical-edit.md',
            'fix': '_NEW_WORKFLOWS_/prompts/phases/debugging/bug-report.md',
            'test': '_NEW_WORKFLOWS_/prompts/phases/testing/test-generation.md',
            'research': '_NEW_WORKFLOWS_/prompts/phases/research/codebase-exploration.md',
        }

        template_path = templates.get(intent, '_NEW_WORKFLOWS_/prompts/sessions/session-init.md')
        return self.load_template(template_path)
```

---

## Integration with Claude

### Option 1: MCP Server (Recommended)

Create an MCP server that wraps the transformer:

```python
# transformer_mcp_server.py

from mcp.server import Server
from mcp.types import Tool, TextContent
import json

server = Server("message-transformer")

@server.tool()
async def transform_message(
    message: str,
    context: str = ""
) -> str:
    """
    Transform your natural message into a proper prompt.

    Args:
        message: Your natural message
        context: Optional additional context
    """
    transformer = MessageTransformer()

    # Transform the message
    transformed, needs_clarification = transformer.transform(message)

    if needs_clarification:
        # Return questions for user
        return {
            "type": "clarification_needed",
            "questions": transformed
        }

    # Return transformed prompt
    return {
        "type": "transformed_prompt",
        "prompt": transformed
    }
```

**In your .mcp.json:**
```json
{
  "mcpServers": {
    "message-transformer": {
      "command": "python",
      "args": ["transformer_mcp_server.py"]
    },
    "archon": { ... },
    "playwright": { ... }
  }
}
```

### Option 2: Simple Script (Quick Start)

```python
# transform.py

import sys
import json

def transform_message(message: str) -> str:
    """Quick transform for common requests."""

    message_lower = message.lower()

    # Detect intent
    if any(word in message_lower for word in ['fix', 'bug', 'broken', 'error']):
        return f"""# 🐛 Bug Fix Request

**Issue:** {message}

**What I Need From You:**
1. Error message or stack trace (if any)
2. File/function where the bug occurs
3. Steps to reproduce

**What I'll Do:**
- Analyze the issue
- Find root cause
- Propose a fix
- Suggest testing approach

Please provide the details above and I'll help you fix this bug."""

    elif any(word in message_lower for word in ['implement', 'create', 'add', 'build']):
        return f"""# 🔨 Feature Implementation Request

**Feature Request:** {message}

**What I Need From You:**
1. Clear description of what to build
2. Where this should go (file/component)
3. Any requirements or constraints

**What I'll Do:**
- Implement the feature following best practices
- Include proper error handling
- Add tests
- Document the changes

Please provide these details and I'll implement this feature."""

    else:
        return f"""# 🎯 General Request

**Request:** {message}

**To help you best, could you provide:**
1. What you're trying to accomplish
2. Any relevant context (project, files, etc.)
3. What success looks like

I'll help you once I understand what you need."""

if __name__ == "__main__":
    if len(sys.argv) > 1:
        message = " ".join(sys.argv[1:])
    else:
        message = input("Your message: ")

    transformed = transform_message(message)
    print("\n" + "="*50)
    print("TRANSFORMED PROMPT:")
    print("="*50)
    print(transformed)
    print("\n" + "="*50)
    print("Copy this to Claude!")
    print("="*50)
```

**Usage:**
```bash
python transform.py "fix the bug in the trading scanner"
```

---

## Making It Seamless

### In Claude Desktop (Custom Instructions)

Add to your Claude Desktop custom instructions:

```
When I send you a message, if it appears to be a simple request without much context, please:

1. Identify what type of request it is (build/fix/edit/research)
2. Ask me 2-3 clarifying questions if needed
3. Use the appropriate prompt template from _NEW_WORKFLOWS_/prompts/
4. Fill in the template with the information I provide
5. Proceed with the task

This helps ensure we have the right context and structure to work effectively together.
```

### As a Simple Prefix

Alternatively, just prefix your messages:

```
[transform] fix the bug in trading scanner
```

And Claude will know to apply the transformation.

---

## The Full Flow (What You'll Experience)

**Before (Current):**
```
You: fix the bug
Claude: [goes off on wrong direction]
You: no not that bug
Claude: [still confused]
You: [frustrated, gives up on proper prompting]
```

**After (With Transformer):**
```
You: fix the bug in trading scanner

Transformer: I'd like to help fix that bug! Quick questions:
1. What error are you seeing?
2. Which file/function has the bug?
3. How can I reproduce it?

You: it opens about:blank and never shows results
  file is backend/scanner.py

Transformer: [Creates proper bug report prompt]
      Includes context, error details, debugging approach

Claude: [Works systematically on the bug]
```

---

## Quick Start Implementation

**For right now, use this simple approach:**

1. **Create the simple transform script** (5 minutes):
```bash
cd "/Users/michaeldurante/ai dev/ce-hub"
cat > transform.py << 'EOF'
[Paste the simple transform.py code from above]
EOF
```

2. **Use it before sending to Claude**:
```bash
python transform.py "your message here"
```

3. **Copy the transformed prompt** to Claude

4. **Later we can automate this** as an MCP server or in the web app

---

## For the Web App

When we build the web platform, this will be seamless:

```
You (type in chat): fix the bug
    ↓
[Transform button] or automatic
    ↓
Transformer: asks questions if needed
    ↓
[You provide details]
    ↓
Transformer: creates proper prompt
    ↓
Claude: works on well-defined problem
    ↓
[Success!]
```

**The transformation happens automatically. You just type naturally.**

---

## Summary

**What you get:**
- ✅ Send simple messages
- ✅ Auto-converted to proper prompts
- ✅ Asked for clarification when needed
- ✅ Better results from Claude
- ✅ No more "word vomit" prompts

**Implementation:**
- **Now:** Simple Python script
- **Soon:** MCP server for Claude Desktop
- **Web App:** Built-in transformation

This way you can work naturally while getting systematic prompt quality!
