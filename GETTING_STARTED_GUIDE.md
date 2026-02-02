# 🚀 Getting Started Guide
## How to Use Updated CE-Hub with Your Existing Projects

**Goal:** Start using improved workflows RIGHT NOW on your active projects.

---

## ✅ Setup Complete - What You Have

**New Structure:**
```
ce-hub/
├── _NEW_WORKFLOWS_/          ← Prompt templates, session management
├── _KNOWLEDGE_BASE_/         ← Research organized
├── _ARCHIVE_/                ← Old documentation
├── _WEB_APP_DEVELOPMENT_/    ← Web app build tracking
└── projects/                 ← YOUR ACTIVE PROJECTS (unchanged)
    ├── edge-dev-main/
    ├── traderra/
    └── [...]
```

**Ready-to-Use Templates:**
- ✅ Session init (start sessions properly)
- ✅ Session handoff (end sessions with summary)
- ✅ Feature building
- ✅ Surgical editing
- ✅ Bug reporting

---

## 🎯 How to Use This Starting NOW

### Step 1: Open Your Project (as usual)

```bash
cd "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main"
# Or whatever project you're working on
```

### Step 2: Start a Claude Session

**In Claude Desktop or Claude Code:**
Start a new chat for your project.

### Step 3: Use Session Init (2 minutes)

**Quick method:**
```bash
cat "/Users/michaeldurante/ai dev/ce-hub/_NEW_WORKFLOWS_/prompts/sessions/session-init.md"
```

**Fill it out:**
```markdown
# 🎯 Session Initialization

**Date:** January 11, 2026

## Objective
Continue developing the trading scanner's new RAG integration

## Current Context
**Project:** edge-dev-main
**Current Phase:** Building
**Where We Left Off:** Implemented basic scanner, need to add RAG

## Success Criteria
- [ ] RAG integration working
- [ ] Scanner returns relevant results
- [ ] Tests passing
```

### Step 4: Do Your Work

**Use the appropriate template:**

**Building new feature:**
```bash
cat "/Users/michaeldurante/ai dev/ce-hub/_NEW_WORKFLOWS_/prompts/phases/building/feature-implementation.md"
```

**Fixing a bug:**
```bash
cat "/Users/michaeldurante/ai dev/ce-hub/_NEW_WORKFLOWS_/prompts/phases/debugging/bug-report.md"
```

**Editing existing code:**
```bash
cat "/Users/michaeldurante/ai dev/ce-hub/_NEW_WORKFLOWS_/prompts/phases/editing/surgical-edit.md"
```

### Step 5: End with Handoff (2 minutes)

```bash
cat "/Users/michaeldurante/ai dev/ce-hub/_NEW_WORKFLOWS_/prompts/sessions/session-handoff.md"
```

Fill it out so next time you know exactly where you are.

---

## 💡 Quick Reference for Common Tasks

### Task 1: "I Just Want to Code Quickly"

**Don't overthink it.** Use the simple approach:

```bash
# Quick session init (30 seconds)
echo "Working on [project], continuing [feature]" > /tmp/session.txt

# Code with Claude (your usual flow)

# Quick handoff (30 seconds)
echo "Completed [X], next is [Y]" > /tmp/handoff.txt
```

### Task 2: "I Need to Fix a Bug"

```bash
# Use bug report template
cat "/Users/michaeldurante/ai dev/ce-hub/_NEW_WORKFLOWS_/prompts/phases/debugging/bug-report.md"

# Fill in:
# - What's broken
# - Error messages
# - File location

# Send to Claude
```

### Task 3: "I Want to Add a Feature"

```bash
# Use feature template
cat "/Users/michaeldurante/ai dev/ce-hub/_NEW_WORKFLOWS_/prompts/phases/building/feature-implementation.md"

# Fill in:
# - What to build
# - Requirements
# - File location

# Send to Claude
```

### Task 4: "I Need to Edit Existing Code"

```bash
# Use surgical edit template
cat "/Users/michaeldurante/ai dev/ce-hub/_NEW_WORKFLOWS_/prompts/phases/editing/surgical-edit.md"

# Fill in:
# - What to change
# - File location
# - Why changing it

# Send to Claude
```

---

## 🔗 Claude Desktop Setup

### Add Custom Instructions

**In Claude Desktop Settings → Custom Instructions:**

```
When working with me on coding projects, please:

1. Start by understanding the context (project, files, current state)

2. Before making changes, ask clarifying questions if anything is unclear:
   - What exactly should this do?
   - Where should this go?
   - Are there any constraints?

3. When implementing:
   - Follow existing patterns in the codebase
   - Add proper error handling
   - Include tests when appropriate
   - Document your changes

4. When debugging:
   - Ask for error messages and stack traces
   - Identify the root cause
   - Propose a fix
   - Suggest how to prevent it in the future

5. Use the prompt templates in _NEW_WORKFLOWS_/prompts/ as a guide for structure.

This helps us work more effectively together.
```

### Add Project Context

**In Claude Desktop → Project Settings:**

For each project (edge-dev-main, traderra, etc.):

```json
{
  "name": "edge-dev-main",
  "context": "Trading scanner and backtesting platform. Tech stack: Next.js, Python FastAPI, PostgreSQL. Main files: src/, backend/. Current focus: RAG integration for better scanner results.",
  "paths": [
    "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main"
  ]
}
```

---

## 🔗 Cursor IDE Setup

### Create Project-Specific .cursorrules

**For each project, create a `.cursorrules` file:**

```bash
# projects/edge-dev-main/.cursorrules

# Trading Scanner Project Rules

When working on this project:

1. **Read existing code first** - Check for patterns before implementing
2. **Follow the established architecture** - Don't reinvent the wheel
3. **Test after changes** - Run existing tests before considering something done
4. **Ask for clarification** - If unsure about a requirement, ask
5. **Document changes** - Add comments for complex logic

Key files:
- Backend: backend/scanner.py, backend/backtest.py
- Frontend: src/app/page.tsx, src/components/
- Tests: backend/test_*.py

Current focus: RAG integration for improved scanner results
```

### Use Cursor's Chat Feature

**When chatting with Cursor AI:**
- Paste the relevant template content
- Fill in project-specific details
- Cursor will follow the structure

---

## 📱 Mobile Workflow (When Away from Desk)

### Quick Mobile Setup

**For when you want to work from phone/tablet:**

1. **Access your files:**
   - Use GitHub app to view code
   - Or set up remote development (VS Code Remote SSH)

2. **Use Claude mobile/web:**
   - Start new chat
   - Paste template content
   - Fill in details
   - Get structured responses

3. **Save handoff notes:**
   - Use Notes app or GitHub gist
   - Include: what you did, what's next, any blockers

---

## 🎓 Day-to-Day Workflow

### Morning - Starting Work

1. **Review yesterday's handoff:**
   ```bash
   cat /tmp/handoff.txt  # Or wherever you saved it
   ```

2. **Start new session:**
   ```bash
   cat "/Users/michaeldurante/ai dev/ce-hub/_NEW_WORKFLOWS_/prompts/sessions/session-init.md"
   ```

3. **Plan your work:**
   - What's the priority today?
   - What did you leave off yesterday?
   - What's blocking progress?

### During Work

1. **Use templates for each task:**
   - Building → building template
   - Fixing → debugging template
   - Editing → editing template

2. **Take breaks between major tasks:**
   - End task with mini-handoff
   - Note what's done, what's next
   - Makes resuming easier

### Evening - Ending Work

1. **Complete session handoff:**
   ```bash
   cat "/Users/michaeldurante/ai dev/ce-hub/_NEW_WORKFLOWS_/prompts/sessions/session-handoff.md"
   ```

2. **Save handoff for tomorrow:**
   ```bash
   # Save to predictable location
   cp /tmp/session-handoff.md ~/session-handoffs/$(date +%Y-%m-%d).md
   ```

3. **Commit your work:**
   ```bash
   git add .
   git commit -m "[What you did today]

   Session notes: [One-line summary]

   Handoff: [What's next]"
   ```

---

## 🆘 Common Situations

### "I Don't Have Time for Templates"

**That's fine!** Use the simplified version:

```bash
# Quick session (1 minute)
echo "Working on [X], continuing from [Y], goal: [Z]" | tee /tmp/session.txt

# Do your work

# Quick handoff (1 minute)
echo "Done: [X], Next: [Y], Blockers: [Z]" | tee /tmp/handoff.txt
```

### "I'm Working on Multiple Projects"

**Create separate session files:**
```bash
# For edge-dev-main
echo "Project: edge-dev-main
Status: [current state]
Next: [what's next]" > /tmp/edge-dev-session.txt

# For traderra
echo "Project: traderra
Status: [current state]
Next: [what's next]" > /tmp/traderra-session.txt
```

### "I Need to Context Switch Quickly"

**Use the handoff summaries:**
```bash
# Switch to edge-dev-main
cat /tmp/edge-dev-handoff.txt

# Work on edge-dev-main

# Switch back
cat /tmp/traderra-handoff.txt
```

---

## 📊 Tracking Your Progress

### Week 1 - Getting Started

**Day 1-2:**
- [ ] Try session init for one session
- [ ] Use one phase template
- [ ] End with handoff

**Day 3-5:**
- [ ] Use templates for most sessions
- [ ] Note which templates work best
- [ ] Customize templates for your needs

**End of Week:**
- [ ] Review what worked
- [ ] Refine templates
- [ ] Document custom patterns

### Week 2-4 - Refining

**Keep what works:**
- Which templates do you use most?
- Which can be simplified?
- What's missing?

**Add what's needed:**
- Custom templates for your patterns
- Project-specific shortcuts
- Automation opportunities

---

## ✅ Success Criteria

**You're successfully using the new workflow when:**

- [ ] You use session init for most work sessions
- [ ] You know which template to use for each task
- [ ] You end with handoff summaries
- [ ] Next sessions start faster (less "where was I?")
- [ ] You feel more in control of your work
- [ ] Rework and backtracking are reduced

---

## 🎉 You're Ready!

**The key insight:**
> **You don't have to change everything at once. Start with one session, one template. Build from there.**

**Recommended first step:**
Use the session init template for your next work session. That's it. Just try it once.

If it helps, keep using it. If not, refine it.

The templates are tools, not rules. Make them work for YOU.

---

**Need help?**
- Quick Start Guide: `QUICK_START.md`
- Research Index: `RESEARCH_INDEX.md`
- Message Transformer: `MESSAGE_TRANSFORMER_DESIGN.md`
- Vision Fix: `VISION_BROWSER_FIX_GUIDE.md`

**Happy building!** 🚀
