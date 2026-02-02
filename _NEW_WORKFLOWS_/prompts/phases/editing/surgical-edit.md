# 🔍 Surgical Edit Prompt Template

Use this template when making targeted edits to existing code (not creating from scratch).

---

## Context

**Project:** [Project name]

**File to Edit:** `path/to/file.js`

**Overview:**
[Brief description of what needs to change and why]

---

## Current Code

**Relevant Section (from the file):**
```
[Paste the specific code section that needs editing]
```

---

## Edit Request

**What to Change:**
[Clear description of the specific edit needed]

**Why This Change:**
[Reason for the edit - bug fix, optimization, refactor, etc.]

---

## Constraints

**Must Preserve:**
- [ ] [Existing functionality 1]
- [ ] [Existing functionality 2]
- [ ] [Interface/contract compatibility]
- [ ] [Performance characteristics]

**Must Not Break:**
- [ ] [Dependency 1]
- [ ] [Dependency 2]
- [ ] [Existing tests]

**Style Requirements:**
- Follow existing code style
- Maintain naming conventions
- Preserve error handling patterns
- Keep logging consistent

---

## Expected Output

**Modified Code Should:**
- Make the specific change requested
- Not alter unrelated code
- Maintain existing patterns
- Include appropriate comments
- Preserve error handling

---

## Validation

**How to Verify the Edit:**
- [ ] [Check 1] - [How to validate]
- [ ] [Check 2] - [How to validate]

**Tests to Run:**
- [Test name]: [What it validates]
- [Test name]: [What it validates]

---

## Output Format

Please provide:

### 1. The Edited Code
- Show the complete modified section
- Highlight what changed (use comments or diff format)
- Explain why changes were made

### 2. Validation Checklist
- [ ] Change implemented correctly
- [ ] No unintended side effects
- [ ] Existing functionality preserved
- [ ] Tests pass

---

## Example

**BEFORE:**
```javascript
function processUserData(userData) {
  // Current implementation
  return result;
}
```

**AFTER (what we want):**
```javascript
function processUserData(userData) {
  // New implementation with the fix
  // Added: [what changed and why]
  return result;
}
```

---

## Notes

[Any additional context about the edit]

**Things to Watch Out For:**
- [Potential issue 1]
- [Potential issue 2]

**Related Code:**
- `path/to/related-file`: [How it relates]
- [Function/module]: [How it's affected]

---

## Success Criteria

The edit is successful when:
- [ ] The specific change is implemented correctly
- [ ] No unrelated code is modified
- [ ] Existing functionality is preserved
- [ ] All related tests pass
- [ ] Manual testing confirms the fix

---

**Pro Tip:** Be specific about the exact change needed. Vague edit requests lead to unexpected results. The more precise you are, the better the outcome.
