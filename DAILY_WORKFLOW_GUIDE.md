# 📋 Your Daily Workflow with CE-Hub

**How to work on edge-dev (or any project) from start to finish**

---

## 🌅 Morning: Starting a New Work Session

### Step 1: Navigate to Your Project
```bash
cd "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main"
```

### Step 2: Open Claude Code Chat
**In VS Code / Claude Code:**
- Start a new chat
- Or open your existing chat for this project

### Step 3: Initialize Your Session
**Use the session-init template:**

```bash
cat "/Users/michaeldurante/ai dev/ce-hub/.claude/instructions/SESSION_INIT.md"
```

**Fill it out with:**
```
# 🎯 Session Initialization

**Date:** January 12, 2026

## Objective
Continue working on the RAG integration for the trading scanner

## Current Context
**Project:** edge-dev-main
**Current Phase:** Building
**Where We Left Off:** Implemented basic scanner, need to add vector search

## Today's Success Criteria
- [ ] Add vector search to scanner.py
- [ ] Test with historical data
- [ ] Preserve existing signal generation

## Relevant Files
**Working Directory:** /Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main
**Key Files:**
- backend/scanner.py - Main scanner logic
- backend/main.py - API endpoints
```

**Send this to Claude first thing.**

---

## 🔨 During Work: Different Task Types

### Type 1: Building New Features

**When you say:**
```
I want to add vector search to the scanner
```

**What happens automatically:**
1. Claude detects this is a "building" request
2. Claude asks:
   - What specifically should vector search do?
   - Where should it go (which file/function)?
   - What are the requirements?
   - How should it integrate with existing code?

**You answer:**
```
It should search historical patterns in the database.
Add to backend/scanner.py in the pattern_matching function.
Requirements: Must return top 5 similar patterns, preserve existing logic.
Integration: Should call the existing database fetch function.
```

**Claude then:**
- Implements following existing patterns
- Preserves existing functionality
- Tests the changes
- Documents what was done

---

### Type 2: Editing Existing Code

**When you say:**
```
Edit the scanner to use async instead of sync
```

**What happens automatically:**
1. Claude detects this is an "editing" request
2. Claude asks:
   - What specific change? (sync → async)
   - Which file? (scanner.py)
   - What must be preserved? (current functionality, API compatibility)

**You answer with details.**

**Claude then:**
- Makes minimal, targeted changes
- Preserves all existing behavior
- Tests that it still works
- Shows exactly what changed

---

### Type 3: Fixing Bugs

**When you say:**
```
fix the bug in the scanner
```

**What happens automatically:**
1. Claude detects this is a "bug" request
2. Claude asks:
   - What error are you seeing?
   - Where is the bug (file/function)?
   - How can I reproduce it?
   - What were you doing when it occurred?

**You answer:**
```
Error: "NoneType object has no attribute 'pattern'"
Location: backend/scanner.py line 245
Reproduction: Run scanner on AAPL data
Context: Just added the new vector search code
```

**Claude then:**
- Reads the file and finds the bug
- Explains the root cause
- Proposes a fix
- Tests the fix
- Suggests how to prevent similar bugs

---

### Type 4: Research / Exploration

**When you say:**
```
find where the scanner connects to the database
```

**What happens automatically:**
1. Claude detects this is a "research" request
2. Claude asks:
   - What pattern are you looking for?
   - Any specific files to search?
   - Why do you need this?

**You answer:**
```
Looking for database connection code.
Search in backend/ directory.
Need to understand how to add vector search.
```

**Claude then:**
- Searches systematically through backend/
- Finds all database connections
- Summarizes how they work
- Shows relevant code sections
- Suggests how to integrate

---

## 🔄 Iteration Process

### How to Iterate Effectively

**After Claude makes changes:**

**1. Review the changes:**
```
Claude: "I've added vector search to scanner.py. Here's what changed:
- Added vector_search() function at line 50
- Modified pattern_matching() to call it
- Preserved existing signal_generation()
"
```

**2. Test it:**
```bash
cd backend
python scanner.py --test AAPL
```

**3. If it works:**
```
Great! That looks good. Let's move on to testing with more data.
```

**4. If it doesn't work:**
```
I got an error: "database connection failed". The vector search is trying to connect but the database isn't initialized. Can you fix this?
```

**Claude then:**
- Diagnoses the new error
- Proposes a fix
- Makes minimal changes
- Tests again

**5. Continue iterating:**
- Each iteration: test → feedback → fix
- Claude learns the context
- Progress compounds

---

## 🌙 Evening: Ending Your Session

### Step 1: Complete Session Handoff
**Use the session-handoff template:**

```bash
cat "/Users/michaeldurante/ai dev/ce-hub/.claude/instructions/SESSION_HANDOFF.md"
```

**Fill it out:**
```
# 🎯 Session Handoff Summary

**Date:** January 12, 2026
**Session Duration:** 3 hours

## Completed Work
✅ Added vector search to scanner.py
- Created vector_search() function
- Integrated with pattern_matching()
- Preserved existing signal generation

## In Progress
🔄 Testing with historical data
- Need to test on more symbols
- Performance optimization needed

## Files Modified
- backend/scanner.py - Added vector search functionality

## Next Session Priorities
1. Test vector search on 10+ symbols
2. Optimize database queries
3. Add error handling for connection failures

## Quick 5-Minute Reorientation
**Project:** edge-dev-main
**Last worked on:** Adding vector search to scanner
**Current state:** Basic implementation done, needs testing
**Next action:** Run tests on multiple symbols
**Key files:** backend/scanner.py
```

**Send this to Claude at the end of your session.**

### Step 2: Commit Your Work
```bash
git add .
git commit -m "Add vector search to scanner

- Implemented vector_search() function for pattern matching
- Integrated with existing pattern_matching() function
- Preserved signal_generation() functionality

Session notes: Basic implementation complete, needs testing

Next: Test on multiple symbols and optimize performance"
```

---

## 📚 Staying Guided by the Main Plan

### How to Connect Daily Work to the Big Picture

**Before starting work, check:**
```bash
cat "/Users/michaeldurante/ai dev/ce-hub/CEHUB_ORGANIZATION_FINAL.md"
```

**This reminds you:**
- What CE-Hub is for
- How the tools work
- The overall structure

**When working on specific features:**

1. **Use the phase templates:**
```bash
# For building features
cat /Users/michaeldurante/ai dev/ce-hub/_NEW_WORKFLOWS_/prompts/phases/building/feature-implementation.md

# For editing code
cat /Users/michaeldurante/ai dev/ce-hub/_NEW_WORKFLOWS_/prompts/phases/editing/surgical-edit.md

# For fixing bugs
cat /Users/michaeldurante/ai dev/ce-hub/_NEW_WORKFLOWS_/prompts/phases/debugging/bug-report.md
```

2. **Let the templates guide you:**
- They ensure you provide the right context
- They prevent "word vomit" prompts
- They make Claude more effective

3. **Transform vague messages:**
```bash
# When you're not sure what to say
cd "/Users/michaeldurante/ai dev/ce-hub"
python transform.py "help me optimize the scanner"

# Copy the output to Claude
```

---

## 🎯 Making Claude Powerful & Proper

### Key Principles

**1. Always Provide Context**
- ❌ Bad: "fix the scanner"
- ✅ Good: "Fix the bug in backend/scanner.py where vector_search returns None when database is empty"

**2. Use the Templates**
- They ensure consistency
- They capture the right information
- They make every session better

**3. Iterate with Feedback**
- Test Claude's changes
- Report what works/doesn't
- Let Claude fix issues
- Build on what works

**4. End Sessions Properly**
- Document what you did
- Note what's next
- Make it easy to resume

**5. Stay in the Main Directory**
- Work from: `/Users/michaeldurante/ai dev/ce-hub`
- Navigate to projects from there
- All tools accessible
- Nothing gets lost

---

## 🚀 Quick Reference Card

### Starting Work (Morning)
```bash
cd "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main"
cat ../.claude/instructions/SESSION_INIT.md
# Fill it out and send to Claude
```

### During Work (Any Time)
```
Just talk to Claude naturally! The auto-transform handles:
- Bugs → asks for error details
- Building → asks for requirements
- Editing → asks for what to change
- Research → asks what to find
```

### Ending Work (Evening)
```bash
cat ../.claude/instructions/SESSION_HANDOFF.md
# Fill it out and send to Claude
git add . && git commit -m "your message"
```

### Need Help?
```bash
cd "/Users/michaeldurante/ai dev/ce-hub"
python transform.py "your confusing message"
# Copy the transformed version to Claude
```

---

## 🎉 You're Ready!

**The workflow is simple:**

1. **Start:** Navigate to project → Initialize session → State your goal
2. **Work:** Talk naturally → Claude asks right questions → You answer → Claude implements
3. **Iterate:** Test → Feedback → Fix → Repeat
4. **End:** Document session → Commit changes

**Everything we built supports this workflow:**
- Auto-transform ensures good communication
- Templates provide structure when needed
- Session handoffs maintain continuity
- Message transformer clarifies confusion

**Just follow the workflow and everything works together!** 🚀

---

**Last Updated:** January 12, 2026
**Your Workspace:** `/Users/michaeldurante/ai dev/ce-hub`
