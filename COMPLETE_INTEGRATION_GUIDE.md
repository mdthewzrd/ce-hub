# 🎯 CE-Hub Complete Integration Guide
## Cole's Gold Standard + Archon = Production Workflow

**Date:** January 12, 2026
**Status:** ✅ Fully Operational

---

## 📊 Your Complete Setup

### ✅ What's Running Now

| Component | Status | URL/Location | Purpose |
|-----------|--------|--------------|---------|
| **Docker Desktop** | ✅ Running | - | Container runtime |
| **Archon UI** | ✅ Running | http://localhost:3737 | Visual knowledge management |
| **Archon Server** | ✅ Running | http://localhost:8181 | Core API backend |
| **Archon MCP** | ✅ Running | http://localhost:8051 | Claude Code integration |
| **CE-Hub** | ✅ Ready | `/Users/michaeldurante/ai dev/ce-hub` | Your workspace |

---

## 🔄 How Everything Connects

```
┌─────────────────────────────────────────────────────────────┐
│                     YOUR DAILY WORKFLOW                     │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ 1. Morning   │  →   │ 2. Work      │  →   │ 3. Evening    │
│              │      │              │      │              │
│ - Start NEW  │      │ - Code       │      │ - Handoff    │
│   chat       │      │ - Research   │      │ - Commit     │
│ - Check      │      │ - Capture    │      │ - Ingest     │
│   status     │      │   learnings  │      │   to Archon  │
└──────────────┘      └──────────────┘      └──────────────┘
        │                      │                      │
        └──────────────────────┴──────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   ARCHON KNOWLEDGE  │
                    │   GRAPH (MCP)       │
                    │                     │
                    │ - Tasks             │
                    │ - Projects          │
                    │ - RAG Search        │
                    │ - Documents         │
                    │ - Patterns          │
                    └─────────────────────┘
```

---

## 🚀 Your Daily Workflow (Step-by-Step)

### Morning Routine (5 minutes)

**1. Start Docker** (if not running)
```bash
open -a Docker
# Wait for Docker to start
```

**2. Verify Everything**
```bash
cd "/Users/michaeldurante/ai dev/ce-hub"
./VERIFY_SETUP.sh    # Run verification script
```

**3. Check Current Status**
```bash
status               # Quick status check
plan                 # Full master plan (optional)
```

**4. Start NEW Chat in Claude Code**
```bash
# From ce-hub directory:
cd "/Users/michaeldurante/ai dev/ce-hub"

# Open Claude Code from here (loads .claude/ config)
# Click "New Chat" - DO NOT continue old chats
```

**5. Initialize Session**
```
Working on edge-dev-main.

YESTERDAY: [What you completed yesterday]
TODAY: [What you'll work on today]

Goal: [Specific objective for today]
```

---

### During Work (All Day)

**How Knowledge Flows:**

```
┌──────────────────────────────────────────────────────────────┐
│                   WHILE YOU WORK                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Ask Claude to do something                               │
│     ↓                                                        │
│  2. Claude auto-transforms your request (via .claude/)       │
│     ↓                                                        │
│  3. Claude can query Archon for context (via MCP)            │
│     - "What do we know about vector search?"                 │
│     - "What tasks are pending?"                              │
│     - "Show me related code examples"                        │
│     ↓                                                        │
│  4. Claude implements solution                               │
│     ↓                                                        │
│  5. You verify it works                                      │
│     ↓                                                        │
│  6. CAPTURE THE LEARNING!                                    │
│     - Save to _KNOWLEDGE_BASE_/learnings/                    │
│     - Update Archon task status                              │
│     - Document decisions made                                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Knowledge Capture Pattern:**

```bash
# After completing something significant:
cat > "_KNOWLEDGE_BASE_/learnings/$(date +%Y%m%d)-topic.md" << 'EOF'
# [Topic Title]

**Date:** $(date +%Y-%m-%d)
**Project:** edge-dev-main

## What We Did
[Brief description]

## What Worked
[What succeeded]

## Key Insight
[Important learning for next time]

## Files Changed
- projects/edge-dev-main/[file] ([change made])
EOF
```

**Archon Integration Examples:**

```bash
# In Claude Code chat, you can now say:

"What tasks do I have pending in Archon?"
"Create a task for implementing the new scanner"
"Update task t-123 to 'doing' status"
"What does Archon know about RAG implementation?"
"Search code examples for pattern matching"
```

---

### Evening Routine (10 minutes)

**1. Session Handoff** (In Claude Code)
```
Wrapping up today's session.

COMPLETED:
✅ [What you finished]
✅ [What you accomplished]

IN PROGRESS:
🔄 [What's partially done]
🔄 [What needs continuation]

FILES MODIFIED:
- [List files changed]

NEXT SESSION:
1. [Next immediate task]
2. [What to focus on]

LEARNINGS:
- [Key insights captured]
- [Patterns discovered]

Session complete. Starting fresh chat tomorrow.
```

**2. Commit Work**
```bash
git add .
git commit -m "feat: [what you did]

Session summary:
- [Completed items]
- [In-progress items]

Handoff: [Next session focus]

Learnings: [_KNOWLEDGE_BASE_/learnings/]"
```

**3. Preview Tomorrow**
```bash
echo "Tomorrow: [next task]" > /tmp/tomorrow.txt
```

---

## 🎯 When to Start New Chats

### ✅ DO Start New Chat When:
- **Every morning** - Fresh context = better responses
- **After completing a major feature** - Clean slate for next work
- **When switching projects** - Different context needs
- **Chat reaches 60-70 messages** - Before compaction loses details
- **Feeling lost in details** - Reorient with fresh session

### ❌ DON'T Continue Old Chat When:
- Chat is very long (>80 messages)
- Context feels cluttered
- Can't remember what's current
- Already had context compacted

---

## 📚 Knowledge Base Structure

```
ce-hub/
├── _KNOWLEDGE_BASE_/
│   ├── learnings/              ← Daily learnings
│   │   ├── 20260112-vector-search.md
│   │   ├── 20260112-mcp-setup.md
│   │   └── ...
│   │
│   ├── patterns/               ← Proven patterns
│   │   ├── agent-development.md
│   │   ├── scanner-architecture.md
│   │   └── ...
│   │
│   └── decisions/              ← Key decisions
│       ├── use-pgvector.md
│       ├── keep-isolated.md
│       └── ...
│
└── projects/
    └── edge-dev-main/          ← Where you work
```

---

## 🤖 Archon MCP Tools (Available in Claude Code)

### Task Management
- `list_tasks(query, task_id, filter_by, filter_value)` - List/search tasks
- `manage_task(action, task_id, project_id, ...)` - Create/update/delete

### Project Management
- `list_projects(project_id, query)` - List/search projects
- `manage_project(action, project_id, ...)` - Create/update/delete

### Knowledge Search (RAG)
- `rag_search_knowledge_base(query, match_count)` - Search docs
- `rag_search_code_examples(query, match_count)` - Search code
- `rag_get_available_sources()` - List data sources

### Document Management
- `list_documents(project_id, query, document_type)` - List docs
- `manage_document(action, project_id, ...)` - Create/update/delete

### Version Control
- `list_versions(project_id, field_name)` - List versions
- `manage_version(action, project_id, ...)` - Create/restore

---

## 💡 The Key Insight: Two-Layer Knowledge System

### Layer 1: File-Based Knowledge (_KNOWLEDGE_BASE_/)
**Purpose:** Quick, manual capture of learnings
**Access:** File system, grep, find
**Best for:** Daily learnings, quick notes, patterns

### Layer 2: Archon Knowledge Graph
**Purpose:** Structured, searchable knowledge base
**Access:** MCP tools in Claude Code, UI at localhost:3737
**Best for:** Task management, RAG search, project tracking

**How They Work Together:**
```
You capture learning → Save to _KNOWLEDGE_BASE_/learnings/
                          ↓
                    Periodically ingest to Archon
                          ↓
                    Searchable via MCP during work
```

---

## 🛠️ Quick Commands Reference

```bash
# Navigation
cd "/Users/michaeldurante/ai dev/ce-hub"    # Go to CE-Hub
ce-edge                                      # Go to edge-dev-main (alias)

# Status & Planning
status                                       # Quick status
plan                                         # Full master plan

# Message Transformation
claude "your message"                        # Transform message

# Verification
./VERIFY_SETUP.sh                            # Check everything is running

# Docker & Archon
docker compose ps                             # Check Archon containers
cd /Users/michaeldurante/archon && docker compose up -d  # Start Archon
```

---

## 🎉 Success Indicators

### You're Doing It Right When:
- ✅ Starting fresh chats daily (not continuing old ones)
- ✅ Capturing learnings after significant work
- ✅ Doing session handoffs before chats get too long
- ✅ Committing work with descriptive messages
- ✅ Archon is accessible from Claude Code
- ✅ Can search knowledge base during work
- ✅ Tasks are tracked in Archon
- ✅ Master plan stays visible

### Red Flags to Watch For:
- ❌ Continuing chats with 100+ messages
- ❌ Not capturing learnings
- ❌ Losing track of what's current
- ❌ Archon not accessible
- ❌ Forgetting to commit work
- ❌ Getting lost in details

---

## 📋 Setup Verification Checklist

Run this anytime to verify everything is working:

```bash
cd "/Users/michaeldurante/ai dev/ce-hub"
./VERIFY_SETUP.sh
```

**Expected output:**
- Docker Desktop: ✓ RUNNING
- Archon UI: ✓ RUNNING (http://localhost:3737)
- Archon Server: ✓ RUNNING (http://localhost:8181)
- Archon MCP: ✓ RUNNING (http://localhost:8051)
- All workflow files: ✓ Present
- All commands: ✓ Available

---

## 🚀 Ready to Work!

**Your complete workflow is now operational.**

1. **Start from CE-Hub** - Open Claude Code from ce-hub directory
2. **Auto-transform works** - No special commands needed
3. **Archon is connected** - Knowledge search available during work
4. **Master plan is tracked** - Never lose sight of the big picture
5. **Learnings are captured** - Knowledge compounds over time

**This is Cole's gold standard - implemented and integrated!** 🏆

---

## 📞 Quick Reference Card

**Morning:**
```bash
cd "/Users/michaeldurante/ai dev/ce-hub"
./VERIFY_SETUP.sh
status
# Start NEW chat in Claude Code
```

**During Work:**
- Work naturally, Claude auto-transforms
- Query Archon: "What do we know about X?"
- Capture learnings to _KNOWLEDGE_BASE_/learnings/

**Evening:**
```bash
# Session handoff in Claude Code
git add . && git commit -m "session summary"
```

**Archon UI:** http://localhost:3737
**Verify:** `./VERIFY_SETUP.sh`

---

**You're set up for long-term success! Every session adds to your knowledge base.**
