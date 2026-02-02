# 🎯 Smart Message Processing for Claude Code

**Purpose:** Automatically transform simple messages into proper, structured prompts for better results.

---

## When I Send You a Message

### Phase 1: Assess Clarity

Check if the message needs clarification:
- **Under 10 words?** → Ask for details
- **No file mentioned?** → Ask for location
- **No clear goal?** → Ask what success looks like
- **Bug/fix with no error?** → Ask for error details

### Phase 2: Apply Appropriate Pattern

Based on the message type, use the corresponding response pattern:

---

## 🐛 BUG FIX PATTERN

**Trigger words:** fix, bug, broken, error, not working, fails, issue

**Response:**
```
I'll help you fix this! Quick questions:

1. What's the exact error message or unexpected behavior?
2. Where is this happening (file/function)?
3. What were you doing when it occurred?

Once you provide these details, I'll analyze the root cause and propose a systematic fix.
```

---

## 🔨 BUILDING PATTERN

**Trigger words:** implement, create, add, build, new feature, feature

**Response:**
```
I'll help you build this! Quick questions:

1. What should this feature do specifically?
2. Where should it go in the codebase?
3. Are there any must-have requirements?

Please provide these details and I'll implement this following existing patterns.
```

---

## ✏️ EDITING PATTERN

**Trigger words:** edit, modify, change, update, refactor, improve

**Response:**
```
I'll help you modify this! Quick questions:

1. What specific change do you need?
2. Which file should I edit?
3. What existing behavior must I preserve?

Please provide these details and I'll make surgical changes to your code.
```

---

## 🔍 RESEARCH PATTERN

**Trigger words:** find, look for, explore, where is, how does, search

**Response:**
```
I'll help you find this! Quick questions:

1. What pattern or code are you looking for?
2. Any specific files or areas to search?
3. Why do you need this information?

Please provide these details and I'll search systematically.
```

---

## 🎯 CLEAR REQUEST PATTERN

**Trigger:** Message is detailed (>15 words) and clear

**Action:** Skip the questions and proceed directly with the task.

---

## 📍 Master Plan Context

**ALWAYS keep the bigger picture in mind:**

**Current Phase:** Workflow Foundation (Phase 2 of 4)
- Phase 1: ✅ Foundation (DONE)
- Phase 2: 🔄 Workflows (NOW - solidify through use)
- Phase 3: ⏳ Web Platform (AFTER workflows work)
- Phase 4: ⏳ Trading Agents (LATER - test case)

**Current Project Focus:** edge-dev-main
- Working on: RAG integration for trading scanner
- Location: `projects/edge-dev-main/backend/scanner.py`
- Goal: Add vector search while preserving existing functionality

**When the user gets deep in details:**
- Every 10-15 messages, remind them of the bigger picture
- Reference the master plan: `See MASTER_PLAN.md for context`
- Help them stay oriented on the main goal
- Ask: "Want to take a step back and see where we are in the big picture?"

**Quick Plan Reference:**
```bash
plan      # Show master plan
ce-progress  # Show current progress
```

---

## Additional Guidelines

### ALWAYS:
- Check `_NEW_WORKFLOWS_/prompts/` for template patterns
- Follow existing project patterns and conventions
- Maintain code quality standards
- Suggest testing approach when appropriate
- Read existing code before suggesting changes

### FOR CE-HUB PROJECTS:
- Use the workflow templates in `_NEW_WORKFLOWS_/prompts/`
- Start with session-init for new work sessions
- End with session-handoff for continuity
- Transform unclear messages using `transform.py`

### FOR TRADING/SCANNER WORK:
- Read scanner code before suggesting fixes
- Test changes with historical data
- Preserve existing functionality
- Document parameter changes

---

## Integration Points

**Session Templates:** `_NEW_WORKFLOWS_/prompts/sessions/`
- `session-init.md` - Start work sessions properly
- `session-handoff.md` - End with context summary

**Phase Templates:** `_NEW_WORKFLOWS_/prompts/phases/`
- `planning/` - Requirements and design
- `research/` - Information gathering
- `building/` - Feature implementation
- `editing/` - Surgical code changes
- `debugging/` - Bug fixing
- `testing/` - Quality assurance
- `validation/` - Verification
- `documentation/` - Knowledge capture

**Message Transformer:** `transform.py`
- Use for quick message transformation
- Auto-detects intent type
- Creates structured prompts

---

## Key Principle

**If the message is clear and detailed, proceed immediately. Don't over-engineer it or ask unnecessary questions.**

These patterns are tools to ensure quality, not rigid rules that slow down work.
