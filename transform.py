#!/usr/bin/env python3
"""
Message Transformer - Convert natural messages into proper prompts

Usage:
    python transform.py "fix the bug in trading scanner"
    python transform.py "add a new feature to handle user authentication"
    python transform.py "edit the scanner to use async"
"""

import sys
import os
from pathlib import Path

class MessageTransformer:
    """Transform natural messages into proper prompts."""

    def __init__(self):
        self.cehub_path = Path("/Users/michaeldurante/ai dev/ce-hub")

    def transform(self, message: str) -> str:
        """Transform message into proper prompt format."""
        message_lower = message.lower()

        # Detect intent and create appropriate prompt
        if self._is_bug_report(message_lower):
            return self._create_bug_prompt(message)
        elif self._is_feature_request(message_lower):
            return self._create_feature_prompt(message)
        elif self._is_edit_request(message_lower):
            return self._create_edit_prompt(message)
        elif self._is_research_request(message_lower):
            return self._create_research_prompt(message)
        else:
            return self._create_general_prompt(message)

    def _is_bug_report(self, message: str) -> bool:
        """Check if this is a bug fix request."""
        bug_keywords = ['fix', 'bug', 'broken', 'error', 'not working',
                       'fails', 'issue', 'wrong', 'crash', 'exception']
        return any(keyword in message for keyword in bug_keywords)

    def _is_feature_request(self, message: str) -> bool:
        """Check if this is a feature implementation request."""
        feature_keywords = ['implement', 'create', 'add', 'build', 'new feature',
                           'feature', 'functionality', 'add a', 'create a']
        return any(keyword in message for keyword in feature_keywords)

    def _is_edit_request(self, message: str) -> bool:
        """Check if this is an edit request."""
        edit_keywords = ['edit', 'modify', 'change', 'update', 'refactor',
                        'improve', 'optimize', 'reformat']
        return any(keyword in message for keyword in edit_keywords)

    def _is_research_request(self, message: str) -> bool:
        """Check if this is a research/exploration request."""
        research_keywords = ['find', 'look for', 'explore', 'where is', 'how does',
                            'search', 'locate', 'investigate']
        return any(keyword in message for keyword in research_keywords)

    def _create_bug_prompt(self, message: str) -> str:
        """Create a bug report prompt."""
        return f"""# 🐛 Bug Report Request

**Issue:** {message}

**What I Need From You:**

1. **Error Details:**
   - What error message or stack trace are you seeing?
   - What happens vs what should happen?

2. **Location:**
   - Which file or function has the bug?
   - Can you share the relevant code section?

3. **Reproduction:**
   - How can I reproduce this issue?
   - What steps trigger the bug?

4. **Context:**
   - What were you trying to do when this occurred?
   - Any recent changes that might be related?

---

**What I'll Do:**
- Analyze the issue and identify root cause
- Propose a fix with explanation
- Suggest how to prevent similar issues
- Recommend testing approach

---

Please provide these details and I'll help you fix this bug systematically."""

    def _create_feature_prompt(self, message: str) -> str:
        """Create a feature implementation prompt."""
        return f"""# 🔨 Feature Implementation Request

**Feature Request:** {message}

**What I Need From You:**

1. **Clear Description:**
   - What specifically should this feature do?
   - What problem does it solve?

2. **Location:**
   - Where should this go? (file/component/module)
   - Are there related files to modify?

3. **Requirements:**
   - What are the must-have requirements?
   - Any constraints or limitations?

4. **Integration:**
   - How does this connect to existing code?
   - Are there APIs or functions to call?

---

**What I'll Do:**
- Implement following existing code patterns
- Include proper error handling
- Add appropriate tests
- Document the changes
- Maintain code quality standards

---

Please provide these details and I'll implement this feature effectively."""

    def _create_edit_prompt(self, message: str) -> str:
        """Create an edit request prompt."""
        return f"""# 🔍 Code Edit Request

**Edit Request:** {message}

**What I Need From You:**

1. **Specific Change:**
   - What exactly needs to change?
   - Why is this change needed?

2. **Target:**
   - Which file to edit?
   - Which function or section?

3. **Preserve:**
   - What must stay the same?
   - Any existing behavior to maintain?

4. **Context:**
   - Can you share the current code?
   - Any related code that might be affected?

---

**What I'll Do:**
- Make minimal, targeted changes
- Follow existing code style
- Preserve functionality
- Add appropriate comments
- Suggest testing approach

---

Please provide these details and I'll help you edit this code surgically."""

    def _create_research_prompt(self, message: str) -> str:
        """Create a research/exploration prompt."""
        return f"""# 🔍 Research & Exploration Request

**What to Find:** {message}

**What I Need From You:**

1. **Search Context:**
   - What project or codebase to search?
   - Any specific areas to focus on?

2. **What You're Looking For:**
   - What pattern or code are you trying to find?
   - Why do you need this information?

3. **Constraints:**
   - Any file types to include/exclude?
   - Any time periods or versions?

---

**What I'll Do:**
- Search systematically through the codebase
- Identify relevant code and patterns
- Summarize findings
- Provide context and examples
- Suggest next steps

---

Please provide these details and I'll help you find what you need."""

    def _create_general_prompt(self, message: str) -> str:
        """Create a general request prompt."""
        return f"""# 🎯 General Request

**Request:** {message}

**To help you best, I need to understand:**

1. **What are you trying to accomplish?**
   - What's the goal or objective?

2. **What context should I know?**
   - Project or files involved?
   - Any relevant background?

3. **What does success look like?**
   - How will we know this is done right?

---

Once I understand what you need, I'll use the appropriate systematic approach to help you achieve it.

Please provide these details and let's get started!"""

def main():
    """Main entry point."""
    if len(sys.argv) > 1:
        message = " ".join(sys.argv[1:])
    else:
        message = input("Your message: ")

    transformer = MessageTransformer()
    transformed = transformer.transform(message)

    print("\n" + "=" * 60)
    print("🎯 TRANSFORMED PROMPT:")
    print("=" * 60)
    print()
    print(transformed)
    print()
    print("=" * 60)
    print("✅ Copy this to Claude!")
    print("=" * 60)
    print()
    print("💡 Tip: Save this as a file and attach it for Claude to reference")
    print()

if __name__ == "__main__":
    main()
