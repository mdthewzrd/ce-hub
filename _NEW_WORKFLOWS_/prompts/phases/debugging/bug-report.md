# 🐛 Bug Report & Debugging Prompt Template

Use this template when you need help debugging or fixing a bug.

---

## Bug Summary

**Bug Title:** [One-line description]

**Severity:** [Critical / High / Medium / Low]

**Impact:** [What this bug breaks or prevents]

---

## Reproduction Steps

**How to Reproduce:**
1. [Step 1 - exact action]
2. [Step 2 - exact action]
3. [Step 3 - exact action]
4. [Bug occurs]

**Frequency:**
- [ ] Always reproducible
- [ ] Intermittent (happens X% of the time)
- [ ] Requires specific conditions

---

## Current Behavior

**What Happens:**
[Detailed description of the buggy behavior]

**Expected Behavior:**
[Detailed description of what SHOULD happen]

---

## Environment

**Code Location:**
- File: `path/to/file.js`
- Function/Component: [function name]
- Lines: [approximately where]

**Context:**
- What were you trying to do?
- What led up to the bug?
- Any recent changes that might be related?

---

## Error Messages

**Console/Stack Trace:**
```
[Paste any error messages or stack traces here]
```

**Browser DevTools Output:**
```
[Paste any relevant console output here]
```

**Server Logs:**
```
[Paste any relevant server logs here]
```

---

## Code Context

**Relevant Code Section:**
```javascript
// Paste the code where the bug occurs
function buggyFunction(params) {
  // The problematic code
}
```

**Related Code:**
- `path/to/related-file`: [How it relates]
- [Function/module]: [How it might be involved]

---

## Hypotheses

**What I Think Might Be Wrong:**
- [Hypothesis 1] - [Why you think this]
- [Hypothesis 2] - [Why you think this]

**Things I've Already Tried:**
- [Attempt 1] - [Result]
- [Attempt 2] - [Result]

---

## Constraints

**Can't Change:**
- [ ] [Constraint 1] - [Why]
- [ ] [Constraint 2] - [Why]

**Must Maintain:**
- [ ] [Existing behavior 1]
- [ ] [Existing behavior 2]

**Performance Requirements:**
- [Any performance constraints]

---

## Output Format

Please provide:

### 1. Root Cause Analysis
- What's causing the bug
- Why it's happening
- Code location of the issue

### 2. Fix Proposal
- Specific code changes needed
- Why this fix will work
- Any potential side effects

### 3. Validation Strategy
- How to test the fix
- What to check to ensure it's resolved
- Edge cases to validate

### 4. Prevention
- How to prevent similar bugs
- Any tests to add

---

## Additional Context

**Recent Changes:**
- [Change 1]: [Might be related]
- [Change 2]: [Might be related]

**Similar Issues:**
- [Have you seen this before?]
- [Is there a pattern?]

**Workarounds:**
- [Any current workarounds]

---

## Success Criteria

The fix is successful when:
- [ ] Bug no longer occurs
- [ ] Expected behavior is restored
- [ ] No regressions introduced
- [ ] Tests pass (including new tests if needed)
- [ ] Edge cases are handled

---

## Notes

[Any additional debugging information]

**Things That Might Help:**
- [Relevant pattern or similar working code]
- [Documentation references]
- [Known issues in dependencies]

---

**Pro Tips for Debugging:**

1. **Be Specific:** The more details you provide, the faster the diagnosis
2. **Show Context:** Include surrounding code, not just the error line
3. **Share Hypotheses:** Your theories help narrow down the search
4. **Document Attempts:** Knowing what didn't work saves time
5. **Think About Changes:** What changed recently? Bugs often follow changes

---

**Remember:** Good bug reports = Faster fixes. The time you spend providing context saves time in debugging.
