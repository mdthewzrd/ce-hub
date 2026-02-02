# 🧭 Never Get Lost - Plan Reminder System

**Quick ways to see the big picture while deep in work**

---

## 🚀 Quickest Way

### In terminal:
```bash
plan          # Shows full master plan
ce-status     # Shows quick status
```

### In Claude Code chat:
```
status
```
**Claude will show you:**
- Current phase
- Current project
- What you're working on
- What's next

---

## 📊 At-a-Glance Status

### Copy This Somewhere Visible:

```
═════════════════════════════════════════════════════════
📍 CURRENT STATUS
═════════════════════════════════════════════════════════

PHASE: Workflow Foundation (2/4)
PROJECT: edge-dev-main
FOCUS: RAG integration for scanner
PROGRESS: 30% complete

NEXT: Complete vector search → Test → Optimize

═════════════════════════════════════════════════════════

Type "plan" in terminal to see full details
═════════════════════════════════════════════════════════
```

---

## 💬 In Claude Code - Built-in Reminders

**Claude will automatically remind you:**

Every 10-15 messages, Claude will say:
```
📍 Quick check-in:
We've been working on the vector search implementation for a while.
Want to take a step back and see where we are in the big picture?

Current context:
- Project: edge-dev-main
- Task: Adding RAG integration
- Progress: Implementation phase

Type "status" or "plan" in terminal if you want to see the full master plan.
```

---

## 🎯 VS Code Setup (Optional)

### Option 1: Keep Plan File Open

```bash
# In VS Code, open the plan
code /Users/michaeldurante/ai\ dev/ce-hub/MASTER_PLAN.md

# Then use View → Editor Layout → Two Columns
# Keep plan on left, code on right
```

### Option 2: Status Bar in VS Code

Add to `settings.json`:
```json
{
  "statusBar.workspace" true,
  "customStatuses": [
    {
      "text": "$(cat /Users/michaeldurante/ai\\ dev/ce-hub/MASTER_PLAN.md | grep 'Current Phase' | head -1)",
      "tooltip": "Current Phase"
    }
  ]
}
```

---

## 📱 Quick Reference Card

### Print This and Put Near Your Monitor:

```
═════════════════════════════════════════════════════════
🎯 THE BIG PICTURE
═════════════════════════════════════════════════════════

GOAL: Build great workflows → Build web platform

CURRENT:
  Phase 2/4 - Workflow Foundation
  Project: edge-dev-main
  Task: RAG integration for scanner

NEXT:
  Complete vector search
  Test it
  Document what works

═════════════════════════════════════════════════════════

LOST? Type: plan
═════════════════════════════════════════════════════════
```

---

## 🔄 How It Works

### Automatic Reminders
1. **Every 10-15 messages** in Claude Code
2. **Claude reminds you** of bigger picture
3. **You can type** "status" to see where you are
4. **You can type** "plan" to see full plan

### Manual Check-ins
```bash
plan          # Full master plan
ce-status     # Quick status
ce-progress   # Progress on current task
```

---

## 💡 Tips

### When You Feel Lost
1. **Type:** `plan` in terminal
2. **Read:** The "Where We Are Right Now" section
3. **Ask:** Claude "What are we working toward again?"
4. **Check:** The quick reference card

### When You're Deep in Details
Claude will remind you:
```
📍 Reminder: We're implementing vector search for the scanner.
This is part of Phase 2 (Workflow Foundation).
The goal is to solidify workflows before building the web platform.

Want to see the full plan? Type "plan" in terminal.
```

---

## ✅ You're All Set

**Three ways to stay oriented:**

1. **Automatic:** Claude reminds you every 10-15 messages
2. **Manual:** Type `plan` or `status` anytime
3. **Visual:** Keep MASTER_PLAN.md open in VS Code

**You won't get lost in the details anymore!** 🎯
