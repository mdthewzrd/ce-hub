# 🚨 CLAUDE AGENT VALIDATION - MANDATORY

## RULE: After ANY code changes, you MUST run this EXACT command:

```bash
node "/Users/michaeldurante/ai dev/ce-hub/.claude/validate-and-save.js"
```

## NO EXCEPTIONS - NO THINKING - JUST RUN IT

### When to Run:
- ✅ After creating/modifying ANY file
- ✅ After updating components
- ✅ After changing styles
- ✅ After configuration changes
- ✅ After ANY code changes

### Response Format:
After running the command, copy the EXACT output from the "CLAUDE RESPONSE" section.

### Example:
```
🔍 CE-HUB VALIDATION - This is required for all changes
⏳ Running validation (30 seconds)...

==================================================
✅ Validation PASSED (85% confidence)
Tests: 3/5
Status: All critical tests passed
==================================================

📋 CLAUDE RESPONSE:
✅ **Validation Results: PASSED** (85% confidence)
- Changes validated successfully
- Ready for production use
```

## 🚨 THIS IS NOT OPTIONAL

If validation fails, you MUST:
1. Fix the issues
2. Run the command again
3. Only say task complete when validation PASSES

## NO MORE GUESSING - PROVE YOUR WORK WORKS