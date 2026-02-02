# 🏆 Cole's Gold Standard - Complete Workflow

**How to work with Claude Code long-term without losing anything**

---

## 🎯 The Problem: Chat Compacting

**What happens:**
- Chat gets long (~100+ messages)
- Claude compacts it (loses details)
- You lose context and learnings
- Have to start over

**Cole's solution:**
- Regular session handoffs
- Knowledge capture
- Archon synchronization
- Chat summarization

---

## 📋 Complete Session Lifecycle

### Phase 1: Start New Chat (Every Morning)

```bash
# 1. Go to CE-Hub
cd "/Users/michaeldurante/ai dev/ce-hub"

# 2. Check master plan
status

# 3. Open new chat in Claude Code
# Don't continue yesterday's chat - START FRESH
```

### Phase 2: Initialize Session (5 minutes)

**In Claude Code, start with:**
```
Let's work on edge-dev-main.

SESSION CONTEXT:
- Phase: 2/4 - Workflow Foundation
- Project: edge-dev-main
- Focus: RAG integration for scanner
- Where we left off: Basic implementation done, needs testing

Today's goal: Complete vector search and test on AAPL data
```

**This gives Claude fresh context for the new chat.**

### Phase 3: Work (Throughout Day)

**Work in focused sessions:**
```
You: "Let's add vector search to the scanner"
Claude: [Asks requirements]
You: [Answer]
Claude: [Implements]
You: "Test it on AAPL"
Claude: [Runs test]
```

**Key rule:** When you complete a subtask, pause and capture it.

### Phase 4: Capture Learnings (Every 1-2 Hours)

**When you complete something significant:**

```bash
# Before moving on, capture what you learned
cat > /tmp/learning-$(date +%Y%m%d-%H%M).md << 'EOF'
# Learning: Vector Search Implementation

Date: 2026-01-12

What we did:
- Added vector_search() function to scanner.py
- Used pgvector for similarity search
- Preserved existing signal_generation()

What worked:
- Separating vector search into its own function
- Testing with small dataset first
- Keeping signal generation untouched

What didn't work:
- Initial attempt to inline vector search broke everything
- Database connection needed proper setup

Key insight: Keep new functionality isolated and test independently

Next steps: Test on more symbols, optimize queries
EOF

# Save to knowledge base
mv /tmp/learning-*.md "/Users/michaeldurante/ai dev/ce-hub/_KNOWLEDGE_BASE_/learnings/"
```

### Phase 5: End Chat Session (Evening - Before Too Long)

**BEFORE chat gets compacted:**

```bash
# Check chat length (if ~80+ messages, it's time)
```

**In Claude Code, do session handoff:**
```
Let's wrap up this session.

COMPLETED:
✅ Added vector_search() function
✅ Integrated with pattern_matching()
✅ Tested on AAPL successfully

IN PROGRESS:
🔄 Database query optimization needed
🔄 Need to test on 5+ more symbols

FILES MODIFIED:
- projects/edge-dev-main/backend/scanner.py (lines 50-85)
- projects/edge-dev-main/backend/main.py (added endpoint)

NEXT SESSION:
1. Test on TSLA, MSFT, GOOGL, AMZN, NVDA
2. Optimize database queries
3. Add error handling

LEARNINGS:
- Isolate new functionality before integrating
- Test with small data first
- Database connection needs proper initialization

This session complete. Starting fresh chat tomorrow.
```

**Then:**
```bash
# Commit work
git add projects/edge-dev-main/
git commit -m "feat: add vector search to scanner

Session summary:
- Implemented vector_search() function
- Integrated with pattern_matching()
- Tested on AAPL
- Handoff: Next session test on more symbols and optimize

Learnings saved to _KNOWLEDGE_BASE_/learnings/"
```

---

## 🔄 Archon Integration (Knowledge Capture)

### What Archon Does

**Archon MCP server:**
- Connects to knowledge graph
- Stores and retrieves information
- Syncs learnings across sessions
- Makes everything searchable

### How to Use Archon

**When starting work:**
```
Check Archon for relevant context:
- What have we learned about vector search?
- What are the patterns for scanner development?
- What decisions have we made?
```

**When completing work:**
```
Ingest learnings into Archon:
- What worked: vector search isolation
- What didn't: inline approach
- Key decisions: keep signal generation separate
- Next steps: optimization, more testing
```

### Archon Commands (via MCP)

```bash
# Check Archon MCP connection
# (Available in Claude Code automatically)

# Query knowledge base
# (In Claude Code: "What does Archon know about vector search?")
```

---

## 📁 Knowledge Organization

### Three-Tier Structure (Cole's Pattern)

```
ce-hub/
├── _KNOWLEDGE_BASE_/
│   ├── learnings/              ← Daily learnings from work
│   │   ├── 2026-01-12-vector-search.md
│   │   ├── 2026-01-12-database-setup.md
│   │   └── ...
│   │
│   ├── patterns/               ← Proven patterns
│   │   ├── agent-development.md
│   │   ├── scanner-architecture.md
│   │   └── ...
│   │
│   └── decisions/             ← Key decisions made
│       ├── use-pgvector.md
│       ├── keep-isolated.md
│       └── ...
│
├── _NEW_WORKFLOWS_/
│   └── prompts/                ← Templates for sessions
│
└── projects/                   ← Actual work
    ├── edge-dev-main/
    └── traderra/
```

### How to Populate Knowledge Base

**After each session:**
```bash
# 1. Save learnings
cd "/Users/michaeldurante/ai dev/ce-hub"
mkdir -p _KNOWLEDGE_BASE_/learnings

# 2. Create learning file
cat > _KNOWLEDGE_BASE_/learnings/$(date +%Y%m%d)-topic.md << 'EOF'
# Topic: [What you learned]

**Date:** $(date +%Y-%m-%d)
**Project:** edge-dev-main

## What We Did
[Description]

## What Worked
[What succeeded]

## What Didn't Work
[What failed]

## Key Insights
[Important learnings]

## Decisions Made
[Why we chose this approach]

## Next Steps
[What to do next]
EOF

# 3. This becomes searchable in future sessions
```

---

## 🗓️ Chat Management Strategy

### ✅ DO: Start Fresh Chats

**When to start new chat:**
- Every morning (fresh context)
- When switching projects
- After major milestone completion
- When chat reaches ~80 messages

**Why:**
- Fresh context = better responses
- Avoid compaction losing info
- Each chat has clear purpose
- Handoffs preserve continuity

### ❌ DON'T: Continue Long Chats

**Problems with long chats:**
- Context gets compacted
- Important details lost
- Confusion about what's current
- Can't find past decisions

### ✅ DO: Session Handoffs

**When to handoff:**
- End of work day
- Completing a feature
- Switching contexts
- Chat getting long (~60-80 messages)

**What to include:**
- ✅ What was completed
- ✅ What's in progress
- ✅ Files changed
- ✅ Next steps
- ✅ Key learnings
- ✅ Blockers

---

## 🔄 Daily Workflow (Cole's Style)

### Morning (10 minutes)

```bash
# 1. Check status
cd "/Users/michaeldurante/ai dev/ce-hub"
status

# 2. Review yesterday's handoff
cat .claude/instructions/SESSION_HANDOFF.md
# Or check git commits for latest handoff

# 3. Start NEW chat
# (Don't continue yesterday's)

# 4. Initialize session
# In Claude Code:
"Working on edge-dev-main. Picking up from yesterday:
- Completed: vector_search() function
- Next: Test on multiple symbols
- Goal: Get 5+ symbols working today"
```

### During Work (Every 1-2 hours)

```bash
# After completing something significant:
# Capture learning
cat > _KNOWLEDGE_BASE_/learnings/$(date +%Y%m%d-%H%M)-topic.md << 'EOF'
# [Topic]

## What We Did
...

## What Worked
...

## Key Insight
...
EOF

# Commit work
git add . && git commit -m "progress: [what you did]"
```

### Evening (10 minutes)

```bash
# 1. Session handoff (in Claude Code)
# Document everything

# 2. Commit work
git add .
git commit -m "[session summary]

Handoff:
- Completed: X, Y, Z
- Next: A, B, C

Learnings captured to _KNOWLEDGE_BASE_/"

# 3. Preview next chat
echo "Tomorrow: Test on 5 more symbols and optimize queries"
```

---

## 🎯 Long-Term Organization

### Weekly Review (Fridays)

```bash
# 1. Review learnings from the week
ls -lt _KNOWLEDGE_BASE_/learnings/ | head -10

# 2. Identify patterns
# What approaches worked consistently?
# What problems keep coming up?

# 3. Update patterns documentation
cat > _KNOWLEDGE_BASE_/patterns/scanner-development.md << 'EOF'
# Scanner Development Patterns

## Proven Approaches
- Isolate new functionality (vector search pattern)
- Test with small data first
- Keep existing functions untouched

## Common Pitfalls
- Don't inline complex logic
- Don't skip testing phase
- Don't modify without understanding

## Key Decisions
- Always use pgvector for similarity search
- Always preserve signal_generation()
- Always test database setup first
EOF

# 4. Clean up old chats
# (Optional - archive very old chats)
```

### Monthly Review

```bash
# 1. Review master plan
plan

# 2. Update progress
# Edit MASTER_PLAN.md with progress

# 3. Adjust goals if needed
# Based on what's working/not working

# 4. Archive old learnings
# Move to _ARCHIVE_/ if no longer relevant
```

---

## 🚀 Quick Reference

### Daily Commands

| **When** | **Command** | **Purpose** |
|----------|------------|-------------|
| Morning | `status` | Check where you are |
| Morning | `git log -1` | See yesterday's handoff |
| Morning | Start new chat | Fresh context |
| Every 2 hrs | Capture learning | Save to knowledge base |
| Evening | Session handoff | Document everything |
| Evening | `git commit` | Save work |

### Red Flags

**🚨 Time to handoff:**
- Chat has 70+ messages
- Feeling lost in details
- Can't remember what's next
- Context feels cluttered

**✅ Solution:** End chat, do handoff, start fresh tomorrow

---

## 💡 The Key Insight

**Cole's gold standard:**

1. **Short, focused chats** - Each chat has clear purpose
2. **Regular handoffs** - Don't let chats get long
3. **Knowledge capture** - Save learnings as you go
4. **Archon sync** - Make everything searchable
5. **Review and refine** - Weekly/monthly reviews

**Result:**
- ✅ Nothing gets lost
- ✅ Context always fresh
- ✅ Learnings compound
- ✅ Continuous improvement

---

## 🎉 You're Set Up for Success

**Everything you need:**
- ✅ Session templates (init/handoff)
- ✅ Knowledge base structure
- ✅ Master plan tracking
- ✅ Archon MCP integration
- ✅ Daily workflow guide

**Just follow the pattern and it works!**

---

**This is how Cole works - this is the gold standard!** 🏆
