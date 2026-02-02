# 🔨 Feature Implementation Prompt Template

Use this template when implementing new features or creating new code.

---

## Context

**Project:** [Project name]

**Feature:** [Feature name in one sentence]

**Overview:**
[Brief description of what this feature does and why it's needed]

---

## Requirements

**Functional Requirements:**
- [ ] [Requirement 1] - [What it should do]
- [ ] [Requirement 2] - [What it should do]
- [ ] [Requirement 3] - [What it should do]

**Non-Functional Requirements:**
- Performance: [Any performance requirements]
- Security: [Any security considerations]
- Scalability: [Any scalability concerns]

**Integration Points:**
- Connects to: [Other systems/components]
- Dependencies: [What this depends on]
- Impact on: [What this affects]

---

## Current Codebase Context

**Relevant Files:**
- `path/to/file1`: [What this file does, how it relates]
- `path/to/file2`: [What this file does, how it relates]

**Existing Patterns to Follow:**
- Pattern reference: [Location of similar implementation]
- Conventions: [Naming, structure, etc.]

**Constraints:**
- Must maintain: [What to preserve]
- Must avoid: [What not to do]
- Must be compatible with: [Existing systems]

---

## Implementation Approach

**Files to Modify:**
- `path/to/file1`:
  - Changes needed: [Specific changes]
  - Tests to update: [Which tests]

- `path/to/file2`:
  - Changes needed: [Specific changes]
  - Tests to update: [Which tests]

**Files to Create:**
- `path/to/new-file1`: [Purpose and key functionality]
- `path/to/new-file2`: [Purpose and key functionality]

**Implementation Order:**
1. [Step 1 - what to do first]
2. [Step 2 - what to do next]
3. [Step 3 - final steps]

---

## Testing Strategy

**Unit Tests Needed:**
- [Test 1]: [What to test]
- [Test 2]: [What to test]

**Integration Tests Needed:**
- [Test 1]: [What to test]
- [Test 2]: [What to test]

**Manual Testing Scenarios:**
- [Scenario 1]: [How to manually validate]
- [Scenario 2]: [How to manually validate]

**Edge Cases to Consider:**
- [Edge case 1]: [What to watch for]
- [Edge case 2]: [What to watch for]

---

## Documentation

**Code Documentation Needed:**
- [ ] Function/class docstrings
- [ ] Inline comments for complex logic
- [ ] Type hints/annotations

**External Documentation:**
- [ ] API documentation (if applicable)
- [ ] User-facing documentation (if applicable)
- [ ] Update README/guides

---

## Output Format

Please provide:

### 1. Implementation
- Complete code for all modifications
- New files with full implementation
- Follow existing patterns and conventions
- Include proper error handling
- Add logging where appropriate

### 2. Tests
- Unit tests for new functionality
- Updated tests for modified code
- Test coverage for edge cases

### 3. Documentation
- Code comments and docstrings
- Updated API documentation (if applicable)
- Integration notes

### 4. Migration Guide (if applicable)
- Any data migration needed
- Breaking changes to be aware of
- Rollback steps if something goes wrong

---

## Constraints

**Must:**
- Follow existing code style and patterns
- Maintain backward compatibility (if applicable)
- Include proper error handling
- Add logging for debugging
- Write tests for all new code

**Must Not:**
- Break existing functionality
- Introduce new dependencies without justification
- Ignore security best practices
- Skip error handling
- Leave code undocumented

---

## Success Criteria

The implementation is successful when:
- [ ] All requirements are met
- [ ] All tests pass
- [ ] Code follows existing patterns
- [ ] Documentation is complete
- [ ] No regressions in existing functionality
- [ ] Manual testing validates the feature

---

## Notes

[Any additional context, reminders, or special considerations]

---

## Ready to Implement

Send this entire template to Claude along with any additional context.
Claude will provide a complete implementation following your specifications.
