# ✅ VS Code / Claude Code Auto-Transform Setup

**Status:** Ready to Use
**Date:** January 11, 2026

---

## What Was Set Up

### 1. Custom Instructions File
**Location:** `.claude/instructions/MESSAGE_AUTO_TRANSFORM.md`

This file contains smart message processing patterns that Claude Code will use to:
- Detect when your message needs clarification
- Ask the right questions based on intent (bug/build/edit/research)
- Apply structured response patterns
- Skip unnecessary questions when your message is clear

### 2. Settings Integration
**Updated:** `.claude/settings.json`

Added reference to custom instructions so Claude Code knows to use them.

---

## How It Works Now

**When you send a message in Claude Code:**

1. **Claude reads** `.claude/instructions/MESSAGE_AUTO_TRANSFORM.md`
2. **Assesses** if your message needs clarification
3. **Applies** the appropriate pattern:
   - 🐛 Bug fix → asks for error details
   - 🔨 Building → asks for requirements
   - ✏️ Editing → asks for specific changes
   - 🔍 Research → asks for search targets
   - 🎯 Clear → proceeds directly

**No copy-paste needed!** It happens automatically.

---

## Testing Your Setup

**Test 1: Simple Bug Report**
```text
fix the bug in the scanner
```

**Expected response:** Claude should ask:
- What error are you seeing?
- Which file has the bug?
- How can I reproduce it?

---

**Test 2: Clear, Detailed Request**
```text
Continue working on the trading scanner's RAG integration in projects/edge-dev-main/backend/scanner.py. I need to add vector search for historical pattern matching and preserve the existing signal generation logic.
```

**Expected response:** Claude should proceed directly with implementation (no questions).

---

## Quick Reference

### Message Patterns That Trigger Questions

| **Your Message** | **Claude Asks** |
|------------------|-----------------|
| "fix the bug" | What error? Where? How to reproduce? |
| "add a feature" | What should it do? Where? Requirements? |
| "edit the code" | What change? Which file? What to preserve? |
| "find the issue" | What pattern? Where to search? Why? |

### Messages That Proceed Directly

✅ Detailed (>15 words) with:
- Clear goal
- File/location mentioned
- Specific requirements
- Context about what to preserve

---

## Additional Tools

### Message Transformer (Terminal)
```bash
cd "/Users/michaeldurante/ai dev/ce-hub"
python transform.py "your message here"
```

Use this when you want to see the transformed prompt before sending to Claude.

### Session Templates
```bash
# Start a work session
cat .claude/instructions/SESSION_INIT.md

# End a work session
cat .claude/instructions/SESSION_HANDOFF.md
```

---

## Integration with Existing Workflows

The custom instructions reference all your new workflow templates:

**Session Management:**
- `_NEW_WORKFLOWS_/prompts/sessions/session-init.md`
- `_NEW_WORKFLOWS_/prompts/sessions/session-handoff.md`

**Phase Templates:**
- `_NEW_WORKFLOWS_/prompts/phases/building/`
- `_NEW_WORKFLOWS_/prompts/phases/editing/`
- `_NEW_WORKFLOWS_/prompts/phases/debugging/`
- `_NEW_WORKFLOWS_/prompts/phases/testing/`

---

## Troubleshooting

### "Claude isn't asking clarifying questions"

**Check 1:** Is the custom instructions file being read?
```bash
cat .claude/settings.json | grep custom_instructions
```

**Check 2:** Is the file accessible?
```bash
ls -la .claude/instructions/MESSAGE_AUTO_TRANSFORM.md
```

**Check 3:** Try a clearer simple message:
```text
bug
```
(Should definitely trigger questions)

### "Claude is asking too many questions"

**Solution:** Provide more detail in your message:
- Specify the file/function
- Describe what you want clearly
- Include context about requirements

---

## Next Steps

### Right Now:
1. ✅ Custom instructions are active
2. ✅ Settings updated
3. ✅ Ready to use

### Try It:
Send a simple message like "fix the scanner" and see if Claude asks clarifying questions.

### Continue Work:
Your projects are ready:
- `projects/edge-dev-main/`
- `projects/traderra/`
- All other projects

Just navigate and work as normal. The message transformation happens automatically.

---

## Success Indicators

**You'll know it's working when:**
- ✅ Simple messages get clarifying questions
- ✅ Detailed messages proceed directly
- ✅ Questions are relevant to the task type
- ✅ Less back-and-forth overall
- ✅ First response is more useful

---

**That's it!** Your VS Code / Claude Code is now set up for automatic message transformation. No copy-paste needed.

**Happy building!** 🚀
