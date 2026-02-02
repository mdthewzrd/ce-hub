# ❌ NO SPECIAL COMMANDS NEEDED!

**Just talk naturally - that's it!**

---

## ✅ What You DO (Just Talk Naturally)

**In Claude Code, you just say:**

```
fix the bug in the scanner
```

**Claude's auto-transform automatically:**
- Detects this is a bug report
- Asks: "What error? Where? How to reproduce?"

**You answer:**
```
Error: NoneType at line 245
File: projects/edge-dev-main/backend/scanner.py
Reproduce: Run scanner on AAPL data
```

**Claude fixes it. Done!**

---

## 🚀 More Examples

### Building Features
```
add vector search to the scanner
```
→ Claude asks what it should do, where, requirements

### Editing Code
```
edit the scanner to use async
```
→ Claude asks what to change, which file, what to preserve

### Fixing Bugs
```
the scanner is returning empty results
```
→ Claude asks for error details, location, reproduction

### Research
```
find where the scanner connects to the database
```
→ Claude asks what pattern, where to search, why

---

## 🎯 NO Slash Commands Needed!

**You DON'T type:**
- ❌ `/session-init`
- ❌ `/transform "message"`
- ❌ `/bug-fix`
- ❌ `/build-feature`
- ❌ ANY slash commands!

**You JUST say:**
- ✅ "fix the bug"
- ✅ "add vector search"
- ✅ "edit the scanner"
- ✅ "find the database code"

---

## 📋 When Would You Use Templates?

**Only when YOU want to!**

### Optional: Session-Init Template
**Use this when you want to start a structured session:**
```bash
cat "/Users/michaeldurante/ai dev/ce-hub/.claude/instructions/SESSION_INIT.md"
```

**Fill it out and send to Claude IF you want to.**

**But you don't have to!** You can also just say:
```
Let's work on edge-dev-main. I want to add vector search to the scanner.
```

### Optional: Transform Command
**Use this when you want to see the transformed message first:**
```bash
claude "fix the bug in scanner"
```

**This shows you the transformed prompt and copies it.**

**But you don't have to!** Claude auto-transforms automatically.

---

## 💡 The Magic

**Auto-transform works AUTOMATICALLY:**

1. **You say:** "fix the scanner bug"
2. **Claude reads:** `.claude/instructions/MESSAGE_AUTO_TRANSFORM.md`
3. **Claude detects:** This is a bug report
4. **Claude asks:** "What error? Where? How to reproduce?"
5. **You answer:** Provide details
6. **Claude fixes:** The bug

**No commands. No templates. No special syntax.**

---

## 🎉 Just Talk!

**That's the whole point!**

- ❌ NO `/` commands
- ❌ NO special syntax
- ❌ NO template requirements
- ✅ JUST TALK NATURALLY

**Claude handles the rest!** 🚀
