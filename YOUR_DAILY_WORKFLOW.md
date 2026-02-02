# 📅 YOUR ACTUAL DAILY WORKFLOW

**Step-by-step: How to work with Claude Code using Cole's gold standard**

---

## 🌅 Morning Routine (10 minutes)

### Step 1: Check Your Status
```bash
cd "/Users/michaeldurante/ai dev/ce-hub"
status               # See where you are
```

### Step 2: Review Yesterday
```bash
# See what you did yesterday
git log -1 --pretty=full

# Or check session handoff
cat .claude/instructions/SESSION_HANDOFF.md
```

### Step 3: START A NEW CHAT
**⚠️ IMPORTANT: Start fresh, don't continue yesterday's chat!**

**Why:** Chats get compacted after ~100 messages and lose details.

**In Claude Code:**
```
Starting new session on edge-dev-main.

YESTERDAY: Completed vector_search() function
TODAY: Test on 5+ symbols (TSLA, MSFT, GOOGL, AMZN, NVDA)

Goal: Validate vector search works on multiple symbols
```

---

## 🔨 During Work (Throughout Day)

### When You Complete Something

**Say to Claude:**
```
Good! That worked. Let me capture this learning before we continue.
```

**Then run:**
```bash
# Quick learning capture
cd "/Users/michaeldurante/ai dev/ce-hub"
cat > _KNOWLEDGE_BASE_/learnings/$(date +%Y%m%d)-$(date +%H%M)-topic.md << 'EOF'
# [Short topic title]

**Date:** $(date +%Y-%m-%d)
**Project:** edge-dev-main

## What We Did
[Brief description]

## What Worked
[What succeeded]

## Key Insight
[Important learning for next time]
EOF
```

### Every 1-2 Hours

**Check chat length:**
- If chat has ~60-70 messages → TIME TO HANDOFF
- If feeling lost in details → TIME TO HANDOFF
- If context feels cluttered → TIME TO HANDOFF

**Do a session handoff:**
```
Let's do a quick session handoff.

COMPLETED:
✅ [What you just finished]

NEXT:
→ [What's immediately next]

This chat is getting long, starting fresh after this.
```

**Then start a NEW chat with fresh context.**

---

## 🌙 Evening Routine (10 minutes)

### Step 1: Session Handoff
**In Claude Code:**
```
Wrapping up today's session.

COMPLETED:
✅ Tested vector search on AAPL, TSLA, MSFT
✅ All tests passed
✅ Identified query optimization needed

IN PROGRESS:
🔄 Database queries slow on large datasets

FILES MODIFIED:
- backend/scanner.py (vector_search optimization)
- backend/database.py (connection pooling)

NEXT SESSION:
1. Optimize database queries
2. Add connection pooling
3. Test on full dataset

LEARNINGS:
- Vector search works great for small data (<1000 rows)
- Need optimization for larger datasets
- Connection pooling will help

Session complete. Starting fresh tomorrow.
```

### Step 2: Commit Work
```bash
git add projects/edge-dev-main/
git commit -m "feat: vector search tested on 3 symbols

Session summary:
- Completed testing on AAPL, TSLA, MSFT
- All tests passed
- Identified query optimization needed

Next session: Optimize queries and add connection pooling

Learnings captured to _KNOWLEDGE_BASE_/learnings/"
```

### Step 3: Preview Tomorrow
```bash
# Make a note for tomorrow
echo "Tomorrow: Optimize database queries and add connection pooling" > /tmp/tomorrow.txt
```

---

## 🔄 When to Start New Chat

### ✅ Start New Chat When:
- Every morning
- After completing a major feature
- When switching projects
- Chat reaches 60-70 messages
- Feeling lost in details

### ❌ Don't Continue Chat When:
- Chat is very long (>80 messages)
- Context feels cluttered
- Can't remember what's current
- Already had context compacted

---

## 📚 Knowledge Capture (The Secret Sauce)

### Why It Matters

**Without capture:**
- Same mistakes repeated
- Learnings lost
- Can't build on past work

**With capture:**
- Learnings compound
- Patterns emerge
- Continuous improvement

### How to Do It Quickly

**After something works:**
```bash
cd "/Users/michaeldurante/ai dev/ce-hub"
cat > _KNOWLEDGE_BASE_/learnings/$(date +%Y%m%d)-topic.md << 'EOF'
# [Topic]

## What Worked
- [Specific thing that succeeded]

## Key Insight
- [Why it worked, what to repeat]

## File Reference
- projects/edge-dev-main/backend/scanner.py
EOF
```

**Takes 2 minutes, saves hours later.**

---

## 🎯 Archon Integration

### Current Status
- ✅ Archon MCP configured in `.mcp.json`
- ❌ Archon server not running (port 8051)

### When Archon is Running
**You'll be able to:**
```
In Claude Code:
"What does Archon know about vector search implementation?"

Claude will query Archon and return:
- Previous learnings
- Related decisions
- Patterns that worked
```

### To Start Archon (When Needed)
```bash
# Navigate to Archon
cd /Users/michaeldurante/archon

# Start Archon server
# (Check Archon's README for exact command)

# Archon will be available on port 8051
```

---

## 📊 Weekly Review (Friday)

```bash
cd "/Users/michaeldurante/ai dev/ce-hub"

# 1. Review learnings
ls -lt _KNOWLEDGE_BASE_/learnings/ | head -10

# 2. What patterns emerged?
cat _KNOWLEDGE_BASE_/learnings/*.md | grep "Key Insight"

# 3. Update patterns file
cat > _KNOWLEDGE_BASE_/patterns/current-week.md << 'EOF'
# Patterns This Week

## What's Working
- [List approaches that worked consistently]

## What's Not
- [List problems that keep coming up]

## Key Decisions
- [List important decisions made]

## Changes to Make
- [List improvements to implement]
EOF
```

---

## ✅ Success Checklist

**Daily:**
- [ ] Started NEW chat (not continued old one)
- [ ] Referenced yesterday's handoff
- [ ] Captured learnings during work
- [ ] Did session handoff at end
- [ ] Committed work with summary

**Weekly:**
- [ ] Reviewed all learnings
- [ ] Identified patterns
- [ ] Updated documentation
- [ ] Adjusted goals if needed

---

## 🎉 The Result

**After 1 week of this:**
- ✅ No lost context
- ✅ Learnings building up
- ✅ Clear progress visible
- ✅ Patterns emerging
- ✅ Each day is productive

**After 1 month:**
- ✅ Knowledge base is valuable
- ✅ Patterns are clear
- ✅ Work compounds
- ✅ Continuous improvement

---

## 💡 The Key Insight

**Cole's secret:**

**Short chats + Handoffs + Knowledge capture = Compound growth**

Long chats that get compacted = Lost progress

**You're now implementing the gold standard!** 🏆

---

## 🚀 Your Commands

```bash
status               # Quick status check
plan                 # Full master plan
ce-workflow          # This guide
```
