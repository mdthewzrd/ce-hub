# 🎯 THE CORRECT WORKFLOW

**You open Claude Code FROM ce-hub, not from the project!**

---

## 🚀 How It Actually Works

### Step 1: Open Claude Code in CE-Hub

```bash
# Navigate to CE-Hub
cd "/Users/michaeldurante/ai dev/ce-hub"

# Open Claude Code HERE (in VS Code)
# This loads the .claude/ configuration and auto-transform
code .
```

**This is the key!** The `.claude/` folder with all the auto-transform instructions is in ce-hub root, so you need to open Claude Code from there.

### Step 2: Work on Projects From CE-Hub

**Now you're in Claude Code in ce-hub, and you work on projects:**

```
You are here: /Users/michaeldurante/ai dev/ce-hub/
├── .claude/                    ← Auto-transform loaded ✓
├── projects/
│   ├── edge-dev-main/          ← Work on this
│   └── traderra/               ← Or this
└── [everything accessible]
```

**When you want to work on edge-dev:**
- You're already in the right place (ce-hub)
- Just tell Claude: "I'm working on edge-dev-main, let's add vector search to the scanner"
- Claude can access everything from `projects/edge-dev-main/`
- Auto-transform works because you're in ce-hub

---

## 💬 Your Actual Daily Workflow

### Morning: Start Your Session

```bash
# 1. Go to CE-Hub
cd "/Users/michaeldurante/ai dev/ce-hub"

# 2. Open Claude Code (VS Code) HERE
code .

# 3. Start a new Claude Code chat
# The auto-transform is now active!
```

### In Claude Code Chat:

**Start your session:**
```
Let's work on edge-dev-main. I want to continue adding the RAG integration to the trading scanner.
```

**Claude's auto-transform kicks in and asks:**
- What specifically should RAG integration do?
- Which files in edge-dev-main need changes?
- What are the requirements?

**You answer:**
```
It should search historical patterns from the database.
Files: projects/edge-dev-main/backend/scanner.py
Requirements: Must work with existing signal generation, return top 5 matches
```

**Claude then:**
- Reads the files from `projects/edge-dev-main/`
- Implements the changes
- Shows you what was done

**You iterate:**
- Test the changes
- Report back: "Works!" or "Got this error..."
- Claude fixes/adjusts
- Continue until done

### Evening: End Your Session

**In Claude Code:**
```
Let's wrap up this session. We added RAG integration to the scanner.
What's done: vector search works, tested on AAPL
What's next: Test on more symbols, optimize performance
```

**Then commit:**
```bash
git add projects/edge-dev-main/
git commit -m "feat: add RAG integration to scanner

- Implemented vector search for historical patterns
- Integrated with existing signal generation
- Tested on AAPL

Next: Test on more symbols"
```

---

## 🔑 Key Points

### ✅ Correct Way

1. **Open Claude Code FROM ce-hub:**
   ```bash
   cd "/Users/michaeldurante/ai dev/ce-hub"
   code .
   ```

2. **Work on projects from there:**
   - Tell Claude which project: "Let's work on edge-dev-main"
   - Reference files relative to ce-hub: `projects/edge-dev-main/backend/scanner.py`
   - Everything is accessible

3. **Auto-transform works automatically:**
   - Because you opened Claude Code from ce-hub
   - The `.claude/` folder is in ce-hub root
   - All instructions are loaded

### ❌ Wrong Way

1. **Navigate to project first:**
   ```bash
   cd "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main"
   code .
   ```
   ❌ Auto-transform won't work (wrong directory!)
   ❌ Templates aren't accessible
   ❌ Configuration not loaded

---

## 🎯 Simplified Workflow

### One-Time Setup (First Time Only)

```bash
# Add aliases to shell
echo "source '/Users/michaeldurante/ai dev/ce-hub/cehub-aliases.sh'" >> ~/.zshrc
source ~/.zshrc
```

### Daily Workflow

```bash
# 1. Go to CE-Hub and open Claude Code
cd "/Users/michaeldurante/ai dev/ce-hub"
code .

# 2. In Claude Code, start working!
# Just tell Claude what you want to work on.

# Examples:
# "Let's work on edge-dev-main and add vector search"
# "Fix the bug in the scanner at projects/edge-dev-main/backend/scanner.py"
# "Edit projects/edge-dev-main/backend/scanner.py to use async"
```

**That's it!**

---

## 📁 Project Structure (From CE-Hub Perspective)

```
You are here: /Users/michaeldurante/ai dev/ce-hub/
                              ↓
                    Claude Code opens here
                              ↓
                Auto-transform is active
                              ↓
        You can work on any project:
                              ↓
    projects/edge-dev-main/backend/scanner.py
    projects/edge-dev-main/src/app/page.tsx
    projects/traderra/backend/main.py
    etc.
```

---

## 🚀 Quick Reference

| **Task** | **Command/Action** |
|----------|-------------------|
| Start work day | `cd "/Users/michaeldurante/ai dev/ce-hub" && code .` |
| Work on edge-dev | Tell Claude: "Let's work on edge-dev-main..." |
| Transform message | `claude "your message"` (copies to clipboard) |
| See workflow | `ce-workflow` |
| See Cole's practices | `ce-cole` |

---

## 💡 The Big Picture

**CE-Hub is your workspace:**
- You open Claude Code FROM here
- Auto-transform lives here (`.claude/`)
- Templates live here (`_NEW_WORKFLOWS_/`)
- Projects live here (`projects/edge-dev-main/`)

**You don't navigate INTO projects to work:**
- You stay in CE-Hub
- You tell Claude which project to work on
- Claude accesses files from `projects/`
- Everything stays organized

**This is why it makes sense!**
- All your infrastructure is in one place (ce-hub)
- All your projects are accessible from there
- Auto-transform works for everything
- Nothing gets lost or disconnected

---

## 🎉 You Got It!

**The workflow:**

1. **Open Claude Code from ce-hub** ← This is the key!
2. **Tell Claude what project to work on**
3. **Everything else is automatic**

**Simple as that!** 🚀
