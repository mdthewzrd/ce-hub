# CRITICAL RESEARCH: Editing, Fixing, Iteration, Validation & Testing Workflows

**Comprehensive Guide for Non-Greenfield AI-Assisted Development**

**Date**: 2026-01-11
**Status**: ✅ Complete
**Research Scope**: All workflows EXCEPT initial greenfield building
**Purpose**: Address the MAJOR GAP in planning - we focused on building but missed editing, fixing, iteration, validation, and testing

---

## Executive Summary

### The Critical Gap We Discovered

Our original planning focused heavily on **greenfield building** - creating new code from scratch. But we completely missed:

1. **Editing Workflows** - How to modify existing code effectively with AI
2. **Bug Fixing Workflows** - Systematic approaches to debugging with AI assistance
3. **Iteration Workflows** - How to build incrementally and refine solutions
4. **Validation Workflows** - How to verify AI-generated work is correct
5. **Testing Workflows** - AI-assisted test generation and validation
6. **UI/Vision Capabilities** - How AI can validate and test UIs visually

### Why This Matters

> "Experienced developers were 19% slower when relying too heavily on AI tools" - 2025 Research

The difference between success and failure with AI isn't about using MORE AI - it's about using it **strategically** within proper workflows. This research provides the missing piece.

---

## Table of Contents

1. [Editing Workflows (Not Greenfield)](#1-editing-workflows-not-greenfield)
2. [Bug Fixing Workflows](#2-bug-fixing-workflows)
3. [Iteration Workflows](#3-iteration-workflows)
4. [Validation Workflows](#4-validation-workflows)
5. [Testing Workflows with AI](#5-testing-workflows-with-ai)
6. [UI/Vision Capabilities](#6-uivision-capabilities)
7. [Comprehensive Workflow Integration](#7-comprehensive-workflow-integration)
8. [Prompt Templates Library](#8-prompt-templates-library)
9. [Gap Analysis](#9-gap-analysis)
10. [Validation Checklist](#10-validation-checklist)

---

## 1. Editing Workflows (Not Greenfield)

### The Fundamental Difference

**Greenfield Building**: Creating something from nothing
**Editing**: Modifying existing code while preserving functionality, patterns, and intent

### Core Principle: Targeted Modification

> "The key to effective AI-assisted editing is being EXPLICIT about what to change vs what to keep."

### 1.1 Prompt Patterns for Editing

#### Pattern: Surgical Edit Template

```markdown
## Surgical Code Edit Request

**File**: [file_path]
**Context**: [What this code does, why it exists]

### What to Change (SPECIFIC)
- [ ] Change 1: [Exact location and specific modification]
- [ ] Change 2: [Exact location and specific modification]

### What to Preserve (CRITICAL)
- [ ] Keep: [Pattern/function/logic to maintain]
- [ ] Keep: [Another pattern to maintain]
- [ ] Keep: [Architecture/patterns used elsewhere]

### Constraints
- Do NOT change: [What must remain identical]
- Must maintain: [Invariants, interfaces, behaviors]
- Must follow: [Existing code patterns/conventions]

### Expected Outcome
- [ ] [Specific result after edit]
- [ ] [Another specific result]

**Edit only what's specified. Preserve everything else exactly as-is.**
```

#### Pattern: Refactoring Request Template

```markdown
## Refactoring Request

**Current State**: [What code does now]
**Desired State**: [What it should do after refactor]

### Refactoring Goals
1. [Goal 1: e.g., Improve readability]
2. [Goal 2: e.g., Reduce complexity]
3. [Goal 3: e.g., Better maintainability]

### Must Preserve
- **Behavior**: [Functional requirements that must remain identical]
- **Interface**: [Public API that must not change]
- **Performance**: [Performance characteristics to maintain]
- **Error Handling**: [Error cases that must still be handled]

### Existing Patterns to Follow
- [Pattern 1 used in codebase]: [Description]
- [Pattern 2 used in codebase]: [Description]

### Success Criteria
- [ ] Code is [specific quality attribute]
- [ ] All existing tests pass
- [ ] Behavior is functionally identical
- [ ] No regressions introduced

**Refactor while maintaining 100% behavioral compatibility.**
```

#### Pattern: Multi-File Edit Template

```markdown
## Multi-File Code Edit

**Objective**: [What we're accomplishing across files]

### Files to Modify
1. **[file_1_path]**: [Specific changes]
2. **[file_2_path]**: [Specific changes]
3. **[file_3_path]**: [Specific changes]

### Cross-File Constraints
- **Interface Consistency**: [How files must work together]
- **Shared Types**: [Common types/interfaces across files]
- **Data Flow**: [How data flows between files]

### What Must Not Change
- [Public APIs]: [Interfaces external code depends on]
- [Data Formats]: [Structure of data exchanged]
- [Error Codes]: [Error handling contracts]

### Verification Steps
1. [ ] File 1 edit complete
2. [ ] File 2 edit complete
3. [ ] File 3 edit complete
4. [ ] Cross-file integration verified
5. [ ] All tests passing

**Make changes consistently across all files.**
```

### 1.2 Context Needed for Effective Editing

#### Minimal Effective Context

**INCLUDE** (High Signal):
- Function/class being edited (full implementation)
- Related functions that call or are called by the edit target
- Type definitions and interfaces
- Test files for the code being edited
- Architecture patterns used in the codebase

**EXCLUDE** (Low Signal/Noise):
- Entire codebase files unrelated to edit
- Historical debugging of unrelated issues
- Outdated documentation
- Irrelevant examples

#### Context Template

```markdown
## Editing Context Package

### Target Code
[Full function/class to edit]

### Callers (What uses this code)
- [caller_1]: [How it uses the target]
- [caller_2]: [How it uses the target]

### Callees (What this code uses)
- [dependency_1]: [How it's used]
- [dependency_2]: [How it's used]

### Related Tests
- [test_file_1]: [What it tests]
- [test_file_2]: [What it tests]

### Architecture Patterns
- [Pattern 1]: [How it's applied]
- [Pattern 2]: [How it's applied]

### Success Criteria
- [ ] [Specific outcome]
- [ ] [Another outcome]
```

### 1.3 Best Practices for AI-Assisted Editing

#### DO ✅

1. **Be Specific About Changes**
   - Exact line numbers or function names
   - Before/after examples
   - Clear acceptance criteria

2. **Preserve Existing Patterns**
   - Follow established code style
   - Maintain naming conventions
   - Keep architectural patterns intact

3. **Edit in Stages**
   - Start with smallest change
   - Verify each stage works
   - Build up to final state

4. **Provide Context**
   - What the code does
   - Why it exists
   - How it's used elsewhere

#### DON'T ❌

1. **Vague Requests**
   - ❌ "Improve this code"
   - ✅ "Refactor to extract the validation logic into a separate function"

2. **Ignore Patterns**
   - ❌ "Rewrite however you think best"
   - ✅ "Follow the existing pattern used in [similar_file]"

3. **Over-Edit**
   - ❌ "Fix everything you see"
   - ✅ "Fix only the specific issue described"

4. **Skip Context**
   - ❌ "Edit this function" (no context)
   - ✅ "Edit this function that handles [purpose], used by [callers]"

### 1.4 Tool Support for AI-Assisted Editing

#### Diff-Based Editing Tools

1. **Claude Code Edit Tool**
   - Precise string matching for edits
   - Shows diffs before applying
   - Preserves file structure

2. **GitHub Copilot Edits**
   - Suggested edits in PRs
   - Inline code suggestions
   - Multi-file edits

3. **Cursor AI Editor**
   - Natural language edits
   - Visual diff preview
   - Undo/redo support

#### Batch Editing Capabilities

**Pattern: Consistent Change Across Multiple Files**

```bash
# Find all files with pattern
grep -r "OLD_PATTERN" src/ --include="*.ts" --include="*.tsx"

# Use AI to generate consistent replacements
# Then apply with confidence
```

**Prompt Template for Batch Edits**:

```markdown
## Batch Edit Request

**Pattern to Find**: [regex/string]
**Replacement Pattern**: [what to replace with]

### Files Affected
- [file_1]: [Context-specific consideration]
- [file_2]: [Context-specific consideration]

### Consistency Requirements
- Must maintain: [invariants]
- Must update: [related imports/types]
- Must verify: [what breaks]

### Validation
- [ ] All files updated consistently
- [ ] No syntax errors
- [ ] All tests pass
- [ ] Build succeeds
```

### 1.5 Examples from Anthropic/Cole

#### Effective Editing Patterns

From [My LLM coding workflow going into 2026](https://medium.com/@addyosmani/my-llm-coding-workflow-going-into-2026-52fe1681325e):

**Key Insight**: "Combine AI with automation to create a virtuous cycle where AI writes code, automated tools catch issues, and AI fixes them iteratively."

**Workflow**:
1. AI makes targeted edit
2. Linter/type checker validates
3. AI fixes any issues
4. Repeat until clean

#### Common Pitfalls to Avoid

1. **Over-Engineering Edits**
   - Don't refactor everything when one change is needed
   - Start minimal, iterate if needed

2. **Breaking Existing Patterns**
   - Don't introduce new patterns without clear reason
   - Follow existing conventions unless there's a compelling reason to change

3. **Ignoring Tests**
   - Always check if tests exist and need updating
   - Run tests before and after edits

4. **Multi-Change Edits**
   - Don't combine multiple unrelated edits in one request
   - Separate concerns for clearer review

---

## 2. Bug Fixing Workflows

### 2.1 Diagnostic Prompts

#### The Bug Report Template

```markdown
## Bug Report for AI-Assisted Debugging

**Bug ID**: [unique identifier]
**Severity**: [Critical/High/Medium/Low]
**Date Reported**: [date]

### Problem Statement
**What's Broken**: [Clear description of what's not working]
**Expected Behavior**: [What should happen]
**Actual Behavior**: [What's actually happening]

### Reproduction Steps
1. [Step 1 with exact commands/actions]
2. [Step 2 with exact commands/actions]
3. [Step 3 with exact commands/actions]

**Observed Result**: [What happens after steps]
**Expected Result**: [What should happen]

### Context
**Code Location**: [file:line_range]
**When This Occurs**: [timing/conditions]
**Frequency**: [always/intermittent/rare]

### Environment
- Language/Framework: [versions]
- Platform: [OS, runtime]
- Dependencies: [relevant versions]

### Error Messages
```
[Exact error message or stack trace]
```

### What I've Tried
1. [Attempt 1]: [Result]
2. [Attempt 2]: [Result]

### Hypothesis
**Suspected Root Cause**: [Your best guess]
**Why**: [Reasoning]

**Please help me:**
1. Confirm the root cause
2. Propose a fix
3. Explain the fix
4. Suggest how to prevent similar bugs
```

#### Minimal Bug Report Template

```markdown
## Quick Bug Fix

**Issue**: [One-sentence description]
**Expected**: [What should happen]
**Actual**: [What's happening]

**Code**:
```[code snippet]
```

**Error**: [error message if any]

**Fix this please.**
```

### 2.2 Debugging Patterns

#### Pattern 1: Binary Search Debugging

```markdown
## Binary Search Debugging

**Problem**: [symptom]

### Half the Problem
**Is it in [first half or area]?**
- Test: [How to check]
- If YES: Focus here
- If NO: Focus on [other half]

### Narrow Down
[Repeat halving until root cause found]

### Root Cause
[Actual problem identified]

### Fix
[Solution]
```

#### Pattern 2: Hypothesis Testing

```markdown
## Hypothesis-Driven Debugging

**Problem**: [What's wrong]

### Hypothesis 1
**Guess**: [What might be wrong]
**Test**: [How to verify]
**Result**: [PASS/FAIL]
**Conclusion**: [What this means]

### Hypothesis 2
**Guess**: [Next most likely issue]
**Test**: [How to verify]
**Result**: [PASS/FAIL]
**Conclusion**: [What this means]

[Continue until root cause found]

### Root Cause
[Confirmed issue]

### Fix
[Solution that addresses root cause]
```

#### Pattern 3: Log Analysis

```markdown
## Log-Based Debugging

**Problem**: [symptom]

### Relevant Logs
```
[paste relevant log excerpts]
```

### Analysis
- **Line X**: [What it shows]
- **Line Y**: [What it shows]
- **Pattern**: [What emerges from logs]

### Root Cause
[Inference from logs]

### Fix
[Solution]
```

### 2.3 Validation of Fixes

#### Pre-Fix Validation Checklist

```markdown
## Before Applying Fix

### Root Cause Confirmed?
- [ ] Reproduced the issue
- [ ] Identified exact cause
- [ ] Understood why it happens

### Fix Impact Analysis
- [ ] What code will change
- [ ] What might break
- [ ] Tests that might fail

### Safety Measures
- [ ] Backup current state
- [ ] Tests written (if possible)
- [ ] Rollback plan ready
```

#### Post-Fix Validation Checklist

```markdown
## After Applying Fix

### Fix Verification
- [ ] Original issue resolved
- [ ] No new issues introduced
- [ ] Edge cases tested

### Regression Testing
- [ ] Related tests passing
- [ ] Integration tests passing
- [ ] Manual testing (if needed)

### Documentation
- [ ] Bug documented
- [ ] Fix explained in code comments
- [ ] Related issues noted
```

#### Fix Validation Pattern

```markdown
## Fix Validation Request

**Bug**: [description]
**Fix Applied**: [what was changed]

### Validation Steps
1. [Step 1]: [How to verify fix works]
2. [Step 2]: [Edge case to test]
3. [Step 3]: [Regression check]

### Acceptance Criteria
- [ ] [Specific outcome that means fix works]
- [ ] [Another outcome]
- [ ] [No regressions in specific area]

### Test Cases to Verify
```[test code or descriptions]
```

**Please verify this fix meets all criteria.**
```

### 2.4 Tool Integration

#### Debugging Tools That Work with AI

1. **AI-Assisted Stack Trace Analysis**
   - Paste error into AI
   - Get explanation and likely causes
   - Focus investigation

2. **Log Analysis with AI**
   - Aggregate logs
   - Ask AI to find patterns
   - Identify anomalies

3. **Error Pattern Recognition**
   - AI identifies similar past issues
   - Suggests proven fixes
   - Learns from resolutions

#### Automated Fix Suggestions

```bash
# Pattern: AI suggests fixes from error analysis
error_output=$(python script.py 2>&1)

# Send to AI for analysis
echo "Error output:
$error_output

Please analyze:
1. Root cause
2. Suggested fix
3. How to prevent recurrence" | claude
```

### 2.5 From Your Projects: PARAM_PRESERVATION System

Your param preservation system work demonstrates excellent bug fixing patterns:

**Problem Identified**:
> "The RENATA_V2 transformer was generating v31 scanner code that would initialize and process data successfully, but was not finding any trading signals."

**Root Cause Analysis**:
1. Missing feature computation in `compute_full_features()`
2. Column naming inconsistency (Capitalized vs snake_case)
3. Inefficient data processing

**Fix Strategy**:
1. Added ALL missing features (lines 2300-2322)
2. Standardized to snake_case throughout (lines 2375-2443)
3. Removed column renaming and recomputation

**Validation**:
- Verification status with ✅ for each fix
- Expected behavior documented
- Architecture alignment confirmed

This is an EXCELLENT example of systematic debugging:
- Clear problem statement
- Root cause analysis
- Targeted fixes
- Comprehensive validation

---

## 3. Iteration Workflows

### 3.1 Iterative Development Patterns

#### The 90% Rule (From Your Projects)

> "Focus on the first 90% to create a proof of concept. Save production concerns for later."

**Application to Iteration**:
1. Build core functionality first (90%)
2. Get feedback on core value
3. Iterate based on feedback
4. Add production polish last 10%

#### Progressive Enhancement Pattern

```markdown
## Progressive Enhancement Plan

**Phase 1 (MVP)**: [Core functionality only]
- [ ] [Feature 1]: Basic implementation
- [ ] [Feature 2]: Basic implementation
- Success: [What "done" looks like for phase 1]

**Phase 2 (Enhancement)**: [Improve based on feedback]
- [ ] [Improvement 1]: Based on phase 1 feedback
- [ ] [Improvement 2]: Based on phase 1 feedback
- Success: [What "done" looks like for phase 2]

**Phase 3 (Polish)**: [Production readiness]
- [ ] [Polish 1]: Error handling, edge cases
- [ ] [Polish 2]: Performance, optimization
- Success: [Production-ready criteria]

**Progress through phases sequentially.**
```

#### Small Wins Iteration Pattern

From your productivity research:

```markdown
## Small Wins Iteration

**Principle**: "The more you see progress, the easier it becomes"

### Per-Iteration Checklist
- [ ] One small, complete feature
- [ ] Tests pass
- [ ] Document what was done
- [ ] Commit with clear message
- [ ] Update progress tracker

### Momentum Building
1. Start with smallest deliverable
2. Get it working (even imperfectly)
3. Celebrate completion
4. Build on success
5. Repeat

### Anti-Pattern: Big Bang Iteration
❌ Don't: Build everything before showing anyone
✅ Do: Ship small improvements continuously
```

### 3.2 Feedback Loops

#### Human-in-the-Loop Pattern

```markdown
## Human-in-the-Loop Iteration

**AI Generates** → **Human Reviews** → **Feedback Given** → **AI Refines** → **Repeat**

### Per-Iteration Feedback Template

**Iteration**: [number]
**Date**: [date]

### What AI Produced
[Summary of generated code/solution]

### Human Review
**What Works**: [positive feedback]
**What Needs Improvement**: [specific issues]
**Suggestions**: [constructive guidance]

### Next Iteration Goals
- [ ] [Improvement 1]: [specific change needed]
- [ ] [Improvement 2]: [specific change needed]

**Please revise based on this feedback.**
```

#### AI-Provided Suggestions Pattern

```markdown
## AI Self-Suggestion Pattern

**Current State**: [What we have]
**Goal**: [What we want to achieve]

### AI: Suggest Improvements
Please analyze this code and suggest:
1. [Specific improvement area]: What could be better
2. [Another area]: Potential enhancement
3. Priority: Which improvements matter most

### Human: Select & Approve
Review suggestions and decide:
- [ ] Suggestion 1: APPROVE / MODIFY / REJECT
- [ ] Suggestion 2: APPROVE / MODIFY / REJECT

### AI: Implement Approved Changes
[Make only the approved changes]

**This pattern keeps human in control while leveraging AI's pattern recognition.**
```

#### Progressive Enhancement with Validation

```markdown
## Validated Iteration Pattern

### Iteration N: Build Core
**Build**: [Core feature]
**Validate**: [How to verify it works]
**Learn**: [What we discovered]

### Iteration N+1: Enhance Based on Learning
**Enhance**: [Improvement based on validation]
**Validate**: [How to verify improvement]
**Learn**: [What we discovered]

### Iteration N+2: Polish for Production
**Polish**: [Production-ready improvements]
**Validate**: [Production readiness criteria]
**Learn**: [Final lessons]

**Each iteration validates before moving forward.**
```

### 3.3 Iteration Tracking

#### Version Management

```markdown
## Iteration Tracking Template

**Feature**: [name]
**Started**: [date]
**Target Completion**: [date]

### Iteration History

#### Iteration 1: [brief description]
**Date**: [date]
**Changes**: [what was done]
**Result**: [outcome]
**Issues**: [problems discovered]
**Learnings**: [what we learned]
**Commit**: [hash]

#### Iteration 2: [brief description]
**Date**: [date]
**Based On**: [feedback from iteration 1]
**Changes**: [what was done]
**Result**: [outcome]
**Issues**: [problems discovered]
**Learnings**: [what we learned]
**Commit**: [hash]

[Continue for each iteration]

### Summary
- Total iterations: [count]
- Time to completion: [duration]
- Key learnings: [top insights]
```

#### Change History

```markdown
## Change History

### Version 1.0 (Initial)
**Date**: [date]
**Features**: [what was included]
**Known Issues**: [limitations]
**Next**: [planned improvements]

### Version 1.1 ([improvement])
**Date**: [date]
**Changes**: [what changed from 1.0]
**Why**: [reasoning]
**Result**: [outcome]
**Known Issues**: [new limitations if any]
**Next**: [next improvement]

[Continue for each version]
```

#### Rollback Capabilities

```markdown
## Rollback Strategy

**Current State**: [version/commit]
**Rollback To**: [previous version/commit]

### Pre-Rollback Validation
- [ ] Identified issue requiring rollback
- [ ] Confirmed rollback point is stable
- [ ] Noted what changes will be lost
- [ ] Prepared re-apply plan for good changes

### Rollback Steps
1. [Step 1]: [command to rollback]
2. [Step 2]: [verification]
3. [Step 3]: [re-apply any good changes]

### Post-Rollback Validation
- [ ] System restored to stable state
- [ ] Lost changes documented
- [ ] Plan to re-integrate good changes

**Always maintain ability to rollback.**
```

### 3.4 A/B Testing Iterations

```markdown
## A/B Testing Framework

**Feature**: [name]
**Goal**: [what we're optimizing]

### Variant A: [description]
**Implementation**: [how it works]
**Expected**: [hypothesis]
**Metrics**: [how to measure]

### Variant B: [description]
**Implementation**: [how it works]
**Expected**: [hypothesis]
**Metrics**: [how to measure]

### Test Plan
- [ ] Deploy both variants
- [ ] Collect metrics for [time period]
- [ ] Analyze results
- [ ] Choose winner
- [ ] Roll out winner
- [ ] Document learnings
```

---

## 4. Validation Workflows

### 4.1 Code Validation

#### Static Analysis with AI

```markdown
## Static Analysis Request

**Code**: [file_path or code snippet]

### Analysis Requested
1. **Correctness**: Are there bugs or logic errors?
2. **Security**: Any security vulnerabilities?
3. **Performance**: Performance issues or anti-patterns?
4. **Maintainability**: Code clarity, complexity, readability?
5. **Standards**: Deviations from best practices?

### Output Format
For each category, provide:
- **Severity**: [Critical/High/Medium/Low]
- **Issue**: [Clear description]
- **Location**: [file:line if applicable]
- **Recommendation**: [How to fix]

### Context
**Language**: [programming language]
**Framework**: [frameworks used]
**Purpose**: [what this code does]
```

#### Linting and Formatting

**Automated Linting Integration**:

```bash
# Pattern: AI writes code → Linter validates → AI fixes
code=$(ai generate "$prompt")

# Run linter
lint_output=$(eslint --format json stdin <<< "$code")

# Send to AI for fixing
echo "Lint errors:
$lint_output

Please fix these linting errors while preserving functionality." | ai
```

**Prompt Template for Lint Fixes**:

```markdown
## Lint Error Correction

**Lint Errors**:
```
[paste lint output]
```

**Code**:
```[original code]
```

**Requirements**:
- Fix all lint errors
- Preserve functionality exactly
- Follow code style guidelines
- Maintain readability

**Please provide corrected code.**
```

#### Type Checking

**AI-Assisted Type Migration**:

```markdown
## Type System Migration

**Current State**: [JavaScript/untyped]
**Target State**: [TypeScript/typed]

### Migration Approach
1. [ ] Add type annotations
2. [ ] Fix type errors
3. [ ] Improve type precision
4. [ ] Verify type safety

### Per-File Migration
**File**: [path]
**Current Types**: [what types exist]
**Missing Types**: [what needs typing]

**Please add appropriate types while preserving behavior.**
```

#### Security Scanning

**AI Security Review Template**:

```markdown
## Security Code Review

**Code**: [code or file path]

### Security Analysis
Please analyze for:
1. **Injection Vulnerabilities**: SQL, command, code injection
2. **Authentication/Authorization**: Auth bypass, privilege escalation
3. **Data Exposure**: Sensitive data leakage
4. **Cryptography**: Weak crypto, hardcoded keys
5. **Input Validation**: Missing validation, sanitization

### Output Format
For each vulnerability found:
- **Severity**: [Critical/High/Medium/Low]
- **Type**: [vulnerability category]
- **Location**: [where in code]
- **Description**: [what's wrong]
- **Fix**: [how to remediate]
- **CWE**: [CWE identifier if applicable]

**Please provide comprehensive security analysis.**
```

#### Performance Analysis

```markdown
## Performance Code Review

**Code**: [code or file path]
**Context**: [what this code does, usage patterns]

### Performance Analysis
Please analyze for:
1. **Algorithmic Complexity**: Time/space complexity issues
2. **Inefficient Loops**: Nested loops, unnecessary iterations
3. **Memory Issues**: Memory leaks, large allocations
4. **I/O Bottlenecks**: Excessive database/API calls
5. **Caching Opportunities**: Repeated computations

### Output Format
For each performance issue:
- **Severity**: [Critical/High/Medium/Low]
- **Impact**: [performance degradation]
- **Location**: [where in code]
- **Current**: [what it does now]
- **Recommended**: [how to optimize]
- **Expected Improvement**: [performance gain]

**Please provide performance optimization recommendations.**
```

### 4.2 Functional Validation

#### Unit Testing Patterns

**AI-Generated Unit Tests**:

```markdown
## Unit Test Generation

**Function to Test**:
```[function code]
```

**Context**:
- **Purpose**: [what function does]
- **Inputs**: [parameter types and meanings]
- **Outputs**: [return value meaning]
- **Edge Cases**: [boundary conditions to test]

### Test Requirements
Generate unit tests that cover:
1. **Happy Path**: Normal usage scenarios
2. **Edge Cases**: Boundary values, empty inputs
3. **Error Cases**: Invalid inputs, error conditions
4. **Corner Cases**: Unusual but valid inputs

### Test Framework
- **Framework**: [Jest/pytest/etc]
- **Assertions**: [type of assertions to use]
- **Mocking**: [what dependencies to mock]

**Please generate comprehensive unit tests.**
```

#### Integration Testing

```markdown
## Integration Test Generation

**Components to Test**: [list of components/modules]
**Integration Points**: [how they connect]

### Test Scenarios
Generate integration tests for:
1. **Data Flow**: [data flows between components]
2. **Error Propagation**: [error handling across components]
3. **State Management**: [state shared between components]
4. **API Integration**: [external service integration]

### Test Approach
- **Framework**: [testing framework]
- **Fixtures**: [test data setup]
- **Teardown**: [cleanup procedures]

**Please generate integration tests that verify components work together correctly.**
```

#### End-to-End Testing

```markdown
## E2E Test Generation

**User Flow**: [description of user journey]
**Entry Point**: [where user starts]
**Success Criteria**: [what defines successful completion]

### Test Scenarios
Generate E2E tests for:
1. **Primary Flow**: [main user journey]
2. **Alternative Paths**: [different ways to complete]
3. **Error Recovery**: [what happens on errors]
4. **Edge Cases**: [unusual but valid scenarios]

### Test Environment
- **Browser**: [target browsers]
- **Devices**: [target devices]
- **Network**: [network conditions]

**Please generate E2E tests using [Playwright/Cypress/etc].**
```

#### Property-Based Testing

```markdown
## Property-Based Test Generation

**Function to Test**:
```[code]
```

### Properties to Test
Generate properties that should always hold true:
1. **Property 1**: [mathematical property]
2. **Property 2**: [invariant]
3. **Property 3**: [relationship between inputs/outputs]

### Test Approach
- **Framework**: [QuickCheck/Hypothesis/etc]
- **Generators**: [how to generate test inputs]
- **Shrinking**: [how to minimize counterexamples]

**Please generate property-based tests.**
```

### 4.3 AI-Specific Validation

#### How to Check if AI Code is Correct

**Validation Framework for AI-Generated Code**:

```markdown
## AI Code Validation Framework

**AI-Generated Code**: [file or code snippet]
**Original Prompt**: [what was requested]

### Validation Checklist

#### 1. Correctness Validation
- [ ] **Matches Requirements**: Does code do what was requested?
- [ ] **Logic Review**: Are there logical errors?
- [ ] **Edge Cases**: Are edge cases handled?
- [ ] **Type Safety**: Are types used correctly?

**Validation Method**:
```
[How to validate correctness]
```

#### 2. Quality Validation
- [ ] **Code Style**: Follows project conventions?
- [ ] **Readability**: Is code understandable?
- [ ] **Maintainability**: Will this be easy to maintain?
- [ ] **Documentation**: Is code adequately documented?

**Validation Method**:
```
[How to validate quality]
```

#### 3. Security Validation
- [ ] **Vulnerabilities**: Any security issues?
- [ ] **Input Validation**: Are inputs validated?
- [ ] **Output Sanitization**: Is output safe?
- [ ] **Dependencies**: Are dependencies secure?

**Validation Method**:
```
[How to validate security]
```

#### 4. Performance Validation
- [ ] **Complexity**: Acceptable time/space complexity?
- [ ] **Efficiency**: Any obvious inefficiencies?
- [ ] **Scalability**: Will this scale?
- [ ] **Resources**: Resource usage acceptable?

**Validation Method**:
```
[How to validate performance]
```

#### 5. Integration Validation
- [ ] **Interfaces**: Does it integrate correctly?
- [ ] **Dependencies**: Are dependencies resolved?
- [ ] **Side Effects**: Are side effects controlled?
- [ ] **Backward Compatibility**: Does it break existing code?

**Validation Method**:
```
[How to validate integration]
```

### Automated Review of AI Outputs

**AI Reviewing AI Pattern**:

```markdown
## AI Code Review Request

**Reviewer AI**: Your role is to review AI-generated code for quality and correctness.

**Generated Code**:
```[AI-generated code]
```

**Original Request**: [what was asked for]

### Review Criteria
1. **Requirement Satisfaction**: Does code meet requirements?
2. **Correctness**: Are there bugs or logic errors?
3. **Best Practices**: Does code follow best practices?
4. **Maintainability**: Is code maintainable?
5. **Security**: Are there security concerns?

### Output Format
For each issue found:
- **Severity**: [Critical/High/Medium/Low]
- **Category**: [type of issue]
- **Location**: [where in code]
- **Description**: [what's wrong]
- **Recommendation**: [how to fix]

**Overall Assessment**:
- **Accept**: [ ] Yes [ ] No
- **Confidence**: [percentage]
- **Reasoning**: [explanation]

**Please provide comprehensive code review.**
```

#### Quality Metrics for AI Code

```markdown
## AI Code Quality Metrics

**Code**: [AI-generated code]

### Metrics to Compute

#### 1. Complexity Metrics
- **Cyclomatic Complexity**: [score]
- **Cognitive Complexity**: [score]
- **Nesting Depth**: [maximum]
- **Function Length**: [lines]

#### 2. Maintainability Metrics
- **Code Duplication**: [percentage]
- **Comment Ratio**: [percentage]
- **Identifier Length**: [average]
- **Parameter Count**: [average/max]

#### 3. Test Coverage
- **Statement Coverage**: [percentage]
- **Branch Coverage**: [percentage]
- **Function Coverage**: [percentage]

#### 4. Security Metrics
- **Security Hotspots**: [count]
- **Vulnerability Count**: [by severity]
- **Dependency Issues**: [count]

### Quality Score
**Overall**: [0-100]
**Breakdown**:
- Correctness: [score]
- Quality: [score]
- Testability: [score]
- Security: [score]

**Assessment**: [PASS/FAIL/MARGINAL]
```

#### Regression Testing for AI Changes

```markdown
## Regression Testing for AI-Generated Changes

**Change**: [description of AI-generated modification]
**Files Modified**: [list of files]

### Regression Test Strategy

#### 1. Smoke Tests
- [ ] [Critical path]: [quick verification]
- [ ] [Another critical path]: [quick verification]

#### 2. Unit Tests
- [ ] [Affected module]: Run unit tests
- [ ] [Another module]: Run unit tests

#### 3. Integration Tests
- [ ] [Integration point]: Test integration
- [ ] [Another integration point]: Test integration

#### 4. E2E Tests
- [ ] [User flow]: Verify end-to-end
- [ ] [Another flow]: Verify end-to-end

### Regression Detection
**If Tests Fail**:
1. Identify what broke
2. Determine if AI change caused regression
3. Fix regression or revert change
4. Re-test

**If Tests Pass**:
1. Document successful change
2. Update test coverage if needed
3. Monitor for issues

**Please ensure all regression tests pass before considering change complete.**
```

---

## 5. Testing Workflows with AI

### 5.1 Test Generation

#### AI-Generated Unit Tests

**Comprehensive Test Generation Pattern**:

```markdown
## Comprehensive Test Generation Request

**Function/Class to Test**:
```[code]
```

### Context
- **Purpose**: [what this code does]
- **Dependencies**: [external dependencies]
- **Usage**: [how this code is used]

### Test Requirements
Generate tests for:

#### 1. Happy Path Tests
- [ ] [Scenario 1]: [normal usage case]
- [ ] [Scenario 2]: [another normal case]

#### 2. Edge Case Tests
- [ ] [Boundary]: [min/max values]
- [ ] [Empty/Null]: [empty input handling]
- [ ] [Single Item]: [array/list with one item]
- [ ] [Large Input]: [stress test size]

#### 3. Error Case Tests
- [ ] [Error 1]: [error condition]
- [ ] [Error 2]: [another error condition]

#### 4. Integration Tests
- [ ] [Mock 1]: [with mock dependency]
- [ ] [Mock 2]: [with another mock]

### Test Framework
- **Framework**: [Jest/pytest/Mocha/etc]
- **Assertions**: [specific assertion library]
- **Mocking**: [how to handle dependencies]

### Coverage Goals
- **Target Coverage**: [percentage]
- **Critical Paths**: [what must be covered]

**Please generate comprehensive test suite.**
```

#### Coverage Analysis

```markdown
## Coverage Analysis Request

**Code**: [file or directory to analyze]
**Current Tests**: [existing test files]

### Analysis Request
1. **Current Coverage**: [percentage coverage]
2. **Uncovered Code**: [what's not tested]
3. **Coverage Gaps**: [missing test scenarios]
4. **Priority**: [what to test first]

### Gap Analysis
For each uncovered area:
- **Location**: [file:line]
- **Code**: [what's not covered]
- **Risk**: [impact of not testing]
- **Priority**: [High/Medium/Low]
- **Test Suggestion**: [how to test it]

**Please analyze coverage and suggest improvements.**
```

#### Edge Case Identification

```markdown
## Edge Case Discovery

**Function/Class**: [code to analyze]
**Context**: [how it's used]

### Edge Case Categories
Identify edge cases for:
1. **Input Boundaries**: Min/max values, empty, null
2. **Data Types**: Type coercion, unexpected types
3. **Concurrency**: Race conditions, threading issues
4. **Resources**: Out of memory, disk space, network
5. **External Dependencies**: API failures, timeouts

### For Each Edge Case
- **Scenario**: [description of edge case]
- **Likelihood**: [how likely to occur]
- **Impact**: [what happens if it occurs]
- **Mitigation**: [how to handle]
- **Test**: [how to verify handling]

**Please identify all edge cases and generate tests.**
```

#### Test Data Generation

```markdown
## Test Data Generation

**Function/Class**: [code that needs test data]
**Input Schema**: [description of input structure]

### Data Requirements
Generate test data for:

#### 1. Valid Inputs
- [ ] [Scenario 1]: [description]
- [ ] [Scenario 2]: [description]

#### 2. Invalid Inputs
- [ ] [Invalid 1]: [type of invalid input]
- [ ] [Invalid 2]: [type of invalid input]

#### 3. Boundary Inputs
- [ ] [Boundary 1]: [at boundary]
- [ ] [Boundary 2]: [just beyond boundary]

### Data Format
- **Format**: [JSON/CSV/etc]
- **Schema**: [structure]
- **Volume**: [how much data]

**Please generate comprehensive test data sets.**
```

### 5.2 Test Execution

#### Running Tests with AI Oversight

**AI-Assisted Test Execution Pattern**:

```markdown
## AI Test Oversight

**Test Suite**: [tests to run]
**AI Role**: Monitor, analyze, and diagnose test failures

### Execution Plan
1. **Run Tests**: [test command]
2. **Monitor**: Watch for failures
3. **Analyze**: Diagnose failures
4. **Fix**: Suggest fixes
5. **Verify**: Re-test

### Failure Analysis Template
For each failure:
- **Test**: [which test failed]
- **Error**: [error message]
- **Root Cause**: [diagnosis]
- **Fix Suggestion**: [how to fix]
- **Verification**: [how to verify fix]

**Please execute tests and provide comprehensive failure analysis.**
```

#### Interpreting Test Results

```markdown
## Test Result Interpretation

**Test Output**: [paste test results]
**Code Context**: [what was tested]

### Analysis Request
1. **Overall Result**: [summary of test run]
2. **Failures**: [detailed analysis of each failure]
3. **Warnings**: [any warnings or concerns]
4. **Coverage**: [coverage analysis]
5. **Recommendations**: [what to do next]

### For Each Failure
- **Test Name**: [which test]
- **Failure Type**: [assertion/error/timeout]
- **Root Cause**: [why it failed]
- **Impact**: [severity of failure]
- **Fix Priority**: [when to fix]
- **Suggested Fix**: [how to fix]

**Please analyze test results and provide actionable recommendations.**
```

#### Failure Diagnosis

```markdown
## Test Failure Diagnosis

**Failed Test**: [test name]
**Error Output**: [error message or stack trace]
**Test Code**: [test that failed]
**Production Code**: [code being tested]

### Diagnosis Steps
1. **Understand Failure**: What exactly failed?
2. **Reproduce**: Can we reproduce consistently?
3. **Isolate**: Is this a test bug or code bug?
4. **Root Cause**: What's the actual problem?

### Analysis
**Failure Type**: [assertion error/exception/timeout/etc]
**Root Cause**: [diagnosis]
**Is Test Correct**: [yes/no - maybe test is wrong]
**Is Code Correct**: [yes/no - maybe code is wrong]

### Resolution
**Fix Strategy**: [how to fix]
**Fix Test**: [test fix if test was wrong]
**Fix Code**: [code fix if code was wrong]
**Verify**: [how to verify fix works]

**Please diagnose this test failure.**
```

#### Fix Suggestions

```markdown
## Automated Fix Suggestion

**Test Failure**: [description]
**Code**: [failing code]
**Test**: [failing test]

### Fix Request
Analyze the failure and suggest:
1. **Root Cause**: What's wrong
2. **Fix Options**: Multiple ways to fix
3. **Recommendation**: Best approach
4. **Trade-offs**: Pros/cons of each option

### For Each Fix Option
- **Approach**: [description]
- **Code Change**: [specific change]
- **Test Update**: [if test needs updating]
- **Side Effects**: [what else might be affected]
- **Risk**: [potential issues]

**Please provide fix suggestions with analysis.**
```

### 5.3 Testing Strategies

#### What to Test vs What Not to Test

```markdown
## Testing Prioritization Framework

**Codebase**: [what we're testing]
**Time Budget**: [how much time for testing]

### Must Test (High Priority)
- [ ] [Core Business Logic]: [critical functionality]
- [ ] [Security]: [auth, data protection]
- [ ] [Data Integrity]: [database operations]
- [ ] [External APIs]: [integrations]

### Should Test (Medium Priority)
- [ ] [Edge Cases]: [boundary conditions]
- [ ] [Error Handling]: [error paths]
- [ ] [Performance]: [critical paths]
- [ ] [User Interfaces]: [key interactions]

### Nice to Test (Low Priority)
- [ ] [UI Polish]: [minor visual issues]
- [ ] [Logging]: [log messages]
- [ ] [Configuration]: [config options]
- [ ] [Documentation]: [examples in docs]

### Don't Test (Skip)
- [ ] [Third-Party Libraries]: [trust the library]
- [ ] [Trivial Code]: [getters/setters]
- [ ] [Platform Code]: [language/framework built-ins]
- [ ] [Generated Code]: [if no custom logic]

**Focus testing on high-risk, high-value areas.**
```

#### Test Prioritization

```markdown
## Risk-Based Test Prioritization

**Feature**: [what we're testing]
**Impact**: [what happens if this fails]

### Risk Assessment Matrix

| Feature | Impact | Probability | Risk | Priority |
|---------|--------|------------|------|----------|
| [Feature 1] | [High/Med/Low] | [High/Med/Low] | [Score] | [1-N] |
| [Feature 2] | [High/Med/Low] | [High/Med/Low] | [Score] | [1-N] |

### Priority 1 (Critical - Test First)
- [ ] [Feature]: [reason it's critical]
- [ ] [Feature]: [reason it's critical]

### Priority 2 (High - Test Early)
- [ ] [Feature]: [reason it's high priority]
- [ ] [Feature]: [reason it's high priority]

### Priority 3 (Medium - Test When Time)
- [ ] [Feature]: [reason it's medium priority]
- [ ] [Feature]: [reason it's medium priority]

### Priority 4 (Low - Test If Time)
- [ ] [Feature]: [reason it's low priority]
- [ ] [Feature]: [reason it's low priority]

**Test in priority order.**
```

#### Exploratory Testing with AI

```markdown
## AI-Assisted Exploratory Testing

**Application**: [what we're testing]
**Focus Area**: [specific feature or workflow]

### Exploratory Testing Approach
AI will explore the application like a curious user, trying:
1. **Unexpected Inputs**: Unusual input combinations
2. **Edge Cases**: Boundary conditions and corner cases
3. **User Flows**: Alternative paths through features
4. **Integration Points**: How components connect
5. **Error Scenarios**: What happens when things go wrong

### Test Charter
**Mission**: [specific exploration goal]
**Areas**: [where to explore]
**Timebox**: [how long to spend]
**Methods**: [exploration techniques]

### Findings Template
For each discovery:
- **Issue**: [what was found]
- **Severity**: [Critical/High/Med/Low]
- **Reproduction**: [how to reproduce]
- **Impact**: [why it matters]
- **Suggestion**: [how to fix]

**Please explore and document findings.**
```

---

## 6. UI/Vision Capabilities

### 6.1 Visual Testing

#### Screenshot Comparison

```markdown
## Screenshot Comparison Testing

**UI Component/Page**: [what we're testing]
**Baseline Screenshot**: [path to baseline image]
**Current Screenshot**: [path to current image]

### Comparison Request
1. **Visual Diff**: Highlight differences
2. **Significance**: Are differences meaningful?
3. **Acceptance**: Should we accept changes?
4. **Update Baseline**: [yes/no]

### Analysis
**Differences Found**:
- [ ] [Difference 1]: [location and description]
- [ ] [Difference 2]: [location and description]

**Assessment**:
- **Breaking Changes**: [yes/no]
- **Acceptable**: [yes/no - with rationale]
- **Action**: [Accept/Reject/Investigate]

**Please compare screenshots and provide detailed analysis.**
```

#### Visual Regression Testing

**AI-Powered Visual Regression Framework**:

```markdown
## Visual Regression Test Suite

**Application**: [what we're testing]
**Test Environment**: [browser, device, viewport]

### Test Scenarios
Generate visual regression tests for:
1. [ ] [Page 1]: [key page to test]
2. [ ] [Page 2]: [key page to test]
3. [ ] [Component 1]: [component to test]
4. [ ] [Component 2]: [component to test]

### Viewports to Test
- [ ] [Desktop]: [1920x1080]
- [ ] [Tablet]: [768x1024]
- [ ] [Mobile]: [375x667]

### Browsers to Test
- [ ] [Chrome]: [version]
- [ ] [Firefox]: [version]
- [ ] [Safari]: [version]

### Comparison Settings
- **Pixel Tolerance**: [allowable pixel difference]
- **Ignore Areas**: [dynamic content regions]
- **Layout Shift**: [allowable movement]

**Please generate visual regression test suite.**
```

#### Layout Validation

```markdown
## Layout Validation Testing

**Component/Page**: [what we're validating]
**Expected Layout**: [description or wireframe]

### Validation Checks
1. **Element Positioning**: Are elements in correct positions?
2. **Spacing**: Is spacing consistent?
3. **Alignment**: Are elements properly aligned?
4. **Responsive**: Does layout adapt to viewports?
5. **Z-Index**: Is layering correct?

### For Each Viewport
- [ ] [Desktop]: [layout correct?]
- [ ] [Tablet]: [layout correct?]
- [ ] [Mobile]: [layout correct?]

### Issues Found
- [ ] [Issue 1]: [description with screenshot]
- [ ] [Issue 2]: [description with screenshot]

**Please validate layout across all viewports.**
```

#### Responsive Design Testing

```markdown
## Responsive Design Validation

**Page/Component**: [what we're testing]
**Breakpoints**: [mobile, tablet, desktop sizes]

### Validation Request
Test at each breakpoint:
1. **Layout**: [is layout correct for this size?]
2. **Content**: [is content accessible/readable?]
3. **Navigation**: [does navigation work?]
4. **Touch Targets**: [are interactive elements usable?]

### Breakpoints to Test
- [ ] [Mobile - 375px]: [validation results]
- [ ] [Tablet - 768px]: [validation results]
- [ ] [Desktop - 1920px]: [validation results]

### Issues
For each issue:
- **Breakpoint**: [where issue occurs]
- **Severity**: [Critical/High/Medium/Low]
- **Description**: [what's wrong]
- **Screenshot**: [visual evidence]
- **Fix Suggestion**: [how to fix]

**Please validate responsive design.**
```

### 6.2 Accessibility Testing

#### WCAG Compliance Checking

```markdown
## Accessibility Compliance Testing

**Page/Component**: [what we're testing]
**WCAG Standard**: [2.0/2.1/2.2 and level A/AA/AAA]

### Compliance Checks
Test for WCAG compliance:

#### 1. Perceivable
- [ ] **Text Alternatives**: Images have alt text
- [ ] **Captions**: Video has captions
- [ ] **Contrast**: Color contrast ≥ 4.5:1
- [ ] **Resizable**: Text can be resized 200%

#### 2. Operable
- [ ] **Keyboard Accessible**: All functions work via keyboard
- [ ] **Focus Visible**: Focus indicator is visible
- [ ] **Timing**: User can disable time limits
- [ ] **Seizures**: No flashing content (>3/sec)

#### 3. Understandable
- [ ] **Readable**: Language is declared
- [ ] **Predictable**: Navigation is consistent
- [ ] **Input Assistance**: Error identification and suggestions

#### 4. Robust
- [ ] **Compatible**: Works with assistive technologies
- [ ] **ARIA**: Proper ARIA labels and roles

### Issues Found
For each issue:
- **WCAG Criterion**: [which guideline violated]
- **Severity**: [Critical/High/Medium/Low]
- **Location**: [element with issue]
- **Description**: [what's wrong]
- **Fix**: [how to comply]

**Please provide comprehensive accessibility audit.**
```

#### Screen Reader Testing

```markdown
## Screen Reader Compatibility Testing

**Page/Component**: [what we're testing]
**Screen Reader**: [NVDA/JAWS/VoiceOver/etc]

### Test Scenarios
1. [ ] [Navigation]: Can user navigate via screen reader?
2. [ ] [Content]: Is content read correctly?
3. [ ] [Forms]: Are form fields accessible?
4. [ ] [Errors]: Are errors announced?
5. [ ] [Actions]: Are actions available?

### Test Process
1. **Navigate**: Move through interface with screen reader
2. **Listen**: Verify content is read correctly
3. **Interact**: Test interactive elements
4. **Complete**: Can user complete tasks?

### Issues
- [ ] [Issue 1]: [description]
- [ ] [Issue 2]: [description]

**Please test screen reader compatibility.**
```

#### Keyboard Navigation

```markdown
## Keyboard Navigation Testing

**Page/Component**: [what we're testing]

### Navigation Checks
1. [ ] **Tab Order**: Logical tab order through page
2. [ ] **Focus Visible**: Clear focus indicator
3. [ ] **Skip Links**: Can skip to main content
4. [ ] **Interactive**: All interactive elements keyboard accessible
5. [ ] **Shortcuts**: Keyboard shortcuts documented

### Test Cases
- [ ] [Tab through page]: [results]
- [ ] [Shift+Tab reverse]: [results]
- [ ] [Enter/Space activate]: [results]
- [ ] [Escape close]: [results]

### Issues
For each issue:
- **Element**: [what element has problem]
- **Issue**: [what's wrong]
- **Impact**: [how it affects users]
- **Fix**: [how to fix]

**Please test keyboard navigation.**
```

#### Color Contrast Validation

```markdown
## Color Contrast Testing

**Page/Component**: [what we're testing]
**WCAG Requirement**: Minimum 4.5:1 for normal text, 3:1 for large text

### Contrast Checks
For each text element:
- [ ] [Element 1]: [foreground vs background colors]
- [ ] [Element 2]: [foreground vs background colors]

### Measurement
- **Foreground Color**: [hex value]
- **Background Color**: [hex value]
- **Contrast Ratio**: [measured ratio]
- **Pass/Fail**: [does it meet WCAG?]

### Failures
For each failure:
- **Element**: [what fails]
- **Current Ratio**: [measured ratio]
- **Required**: [minimum needed]
- **Suggestion**: [how to fix]

**Please validate all color contrast.**
```

### 6.3 Interaction Testing

#### Click Path Validation

```markdown
## User Journey Testing

**User Journey**: [description of user flow]
**Start**: [entry point]
**End**: [completion point]
**Success Criteria**: [what defines success]

### Journey Steps
1. [ ] [Step 1]: [action to take]
2. [ ] [Step 2]: [action to take]
3. [ ] [Step 3]: [action to take]

### Validation
For each step:
- **Action**: [what user does]
- **Expected**: [what should happen]
- **Actual**: [what actually happens]
- **Pass/Fail**: [did it work?]

### Overall Result
- [ ] **Complete**: [Did user reach end?]
- [ ] **Success**: [Were success criteria met?]
- [ ] **Time**: [How long did it take?]

**Please validate user journey.**
```

#### Form Submission Testing

```markdown
## Form Testing

**Form**: [which form to test]
**Purpose**: [what form accomplishes]

### Test Scenarios
1. **Valid Submission**: [successful form submit]
2. **Validation Errors**: [required fields, format validation]
3. **Edge Cases**: [max length, special characters]
4. **Error Recovery**: [can user recover from errors?]

### Fields to Test
- [ ] [Field 1]: [test cases]
- [ ] [Field 2]: [test cases]

### Validation
- [ ] **Required Fields**: [enforced?]
- [ ] **Format Validation**: [correct formats?]
- [ ] **Length Limits**: [enforced?]
- [ ] **Character Restrictions**: [enforced?]
- [ ] **Error Messages**: [clear and helpful?]

**Please test form comprehensively.**
```

#### User Flow Testing

```markdown
## User Flow Validation

**Flow**: [description of multi-step process]
**Entry Point**: [where user starts]
**Exit Point**: [where user should end]

### Flow Steps
1. [Step 1]: [description] → [validation]
2. [Step 2]: [description] → [validation]
3. [Step 3]: [description] → [validation]

### Alternative Paths
1. [Path A]: [description]
2. [Path B]: [description]

### Error Handling
- [ ] [Error 1]: [how to handle]
- [ ] [Error 2]: [how to handle]

### Validation Results
**Complete Flow**: [✓/✗]
**Alternative Paths**: [✓/✗ each]
**Error Handling**: [✓/✗ each]
**Overall**: [PASS/FAIL]

**Please validate entire user flow.**
```

#### Cross-Browser Testing

```markdown
## Cross-Browser Compatibility

**Page/Component**: [what to test]
**Browsers**: [target browsers]

### Browser Test Matrix
| Browser | Version | Result | Issues |
|---------|---------|--------|--------|
| [Chrome] | [version] | [✓/✗] | [description] |
| [Firefox] | [version] | [✓/✗] | [description] |
| [Safari] | [version] | [✓/✗] | [description] |
| [Edge] | [version] | [✓/✗] | [description] |

### For Each Browser
- **Functionality**: [does it work?]
- **Appearance**: [does it look right?]
- **Performance**: [is performance acceptable?]
- **Issues**: [any browser-specific issues?]

**Please test on all target browsers.**
```

### 6.4 AI Vision Tools

#### Computer Vision for UI Testing

```markdown
## AI-Powered Visual Testing

**Application**: [what we're testing]
**Baseline**: [set of baseline screenshots]

### Computer Vision Analysis
Use AI to:
1. **Detect Elements**: [what elements should be found]
2. **Compare Layouts**: [compare to baseline]
3. **Identify Changes**: [meaningful differences vs noise]
4. **Assess Impact**: [are changes breaking?]

### Test Coverage
- [ ] [Page 1]: [AI analysis results]
- [ ] [Page 2]: [AI analysis results]
- [ ] [Component 1]: [AI analysis results]
- [ ] [Component 2]: [AI analysis results]

### Findings
**Visual Regressions**: [changes detected]
**False Positives**: [noise to ignore]
**Action Required**: [what to fix]

**Please perform computer vision analysis.**
```

#### Automated Visual Validation

```markdown
## Automated Visual Validation System

**Test Suite**: [what we're validating]
**Frequency**: [when to run - commit/PR/scheduled]

### Automation Strategy
1. **Capture Screenshots**: [automated screenshot capture]
2. **Compare to Baseline**: [pixel and AI comparison]
3. **Detect Changes**: [identify meaningful differences]
4. **Report Results**: [visual diff report]
5. **Update Baselines**: [approved changes]

### Configuration
```yaml
# Visual Validation Config
baseline_path: "/screenshots/baseline"
current_path: "/screenshots/current"
diff_path: "/screenshots/diffs"
tolerance: 0.05  # 5% pixel difference allowed
ignore:
  - ".dynamic-content"  # ignore dynamic regions
  - ".timestamp"       # ignore timestamps
```

### AI Analysis
- **Smart Comparison**: [understand content, not just pixels]
- **Change Detection**: [meaningful vs cosmetic changes]
- **Layout Analysis**: [structure and positioning]
- **Accessibility**: [visual accessibility checks]

**Please set up automated visual validation.**
```

#### Design System Compliance

```markdown
## Design System Validation

**Design System**: [name/link]
**Component**: [what to validate]

### Compliance Checks
1. **Typography**: [fonts, sizes, weights]
2. **Colors**: [color palette usage]
3. **Spacing**: [margins, padding, gaps]
4. **Borders/Shadows**: [styling consistency]
5. **Icons**: [icon usage and sizing]

### Validation
For each design system rule:
- [ ] [Rule 1]: [compliance status]
- [ ] [Rule 2]: [compliance status]

### Violations
For each violation:
- **Component**: [what component]
- **Rule**: [which design system rule]
- **Expected**: [what it should be]
- **Actual**: [what it is]
- **Fix**: [how to comply]

**Please validate design system compliance.**
```

#### Component State Validation

```markdown
## Component State Testing

**Component**: [what component]
**States**: [all possible states]

### States to Test
- [ ] [Default]: [normal state]
- [ ] [Hover]: [mouse hover state]
- [ ] [Active]: [active/pressed state]
- [ ] [Focus]: [keyboard focus state]
- [ ] [Disabled]: [disabled state]
- [ ] [Error]: [error state]
- [ ] [Loading]: [loading state]

### Visual Validation
For each state:
- **Screenshot**: [capture state]
- **Comparison**: [compare to design]
- **Pass/Fail**: [does it match?]

### Interactive Validation
For each state:
- **Trigger**: [how to enter state]
- **Visual Change**: [what should change]
- **Behavior**: [how it should behave]
- **Exit**: [how to leave state]

**Please validate all component states.**
```

---

## 7. Comprehensive Workflow Integration

### 7.1 Complete Development Cycle

```
┌─────────────────────────────────────────────────────────────┐
│              COMPLETE AI-ASSISTED DEVELOPMENT CYCLE         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │  PLAN   │ -> │  BUILD  │ -> │ VALIDATE│ -> │ DEPLOY  │  │
│  └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘  │
│       │              │              │              │         │
│       ▼              ▼              ▼              ▼         │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │ EDIT    │    │  FIX    │    │  TEST   │    │ MONITOR │  │
│  └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘  │
│       │              │              │              │         │
│       └──────────────┴──────────────┴──────────────┘         │
│                          │                                  │
│                          ▼                                  │
│                  ┌─────────────┐                          │
│                  │   ITERATE   │ ◄─────────────────────┘
│                  └─────────────┘
│                     (feedback loop)                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Workflow Patterns

#### When to Use Each Workflow

| Workflow | Trigger | Inputs | Outputs | Duration |
|----------|---------|--------|---------|----------|
| **Planning** | New feature/project | Requirements | Plan, architecture | Hours |
| **Research** | Understanding codebase | Code | Analysis, patterns | Hours |
| **Editing** | Modify existing code | Code + changes | Modified code | Minutes |
| **Fixing** | Bug found | Bug report | Fix + validation | Variable |
| **Iteration** | Incremental improvement | Current state | Improved state | Minutes-hours |
| **Validation** | Verify AI work | AI output | Pass/fail + issues | Minutes |
| **Testing** | Ensure quality | Code | Test suite | Hours |
| **Deployment** | Release to production | Validated code | Deployed system | Minutes |

### What to Automate vs Manual

**Automate These**:
- ✅ Code formatting (pre-commit hooks)
- ✅ Linting (CI/CD)
- ✅ Unit test execution (CI/CD)
- ✅ Basic validation (automated checks)
- ✅ Screenshot comparison (visual regression)
- ✅ Performance monitoring (automated metrics)

**Keep Manual**:
- ⚠️ Architecture decisions (human judgment)
- ⚠️ Security reviews (expert analysis)
- ⚠️ UX tradeoffs (user feedback)
- ⚠️ Test strategy (what to test)
- ⚠️ Bug prioritization (impact assessment)
- ⚠️ Visual design reviews (aesthetic judgment)

**Hybrid Approaches**:
- 🤖 Code refactoring (AI suggests, human approves)
- 🤖 Test generation (AI writes, human reviews)
- 🤖 Documentation (AI drafts, human refines)
- 🤖 Code review (AI analyzes, human decides)

### 7.3 Tracking Progress

#### Workflow Metrics

```markdown
## Workflow Effectiveness Metrics

**Project**: [name]
**Period**: [date range]

### Cycle Time Metrics
- **Planning → Build**: [average time]
- **Build → Validate**: [average time]
- **Validate → Test**: [average time]
- **Test → Deploy**: [average time]
- **Total Cycle Time**: [end-to-end time]

### Quality Metrics
- **Rework Rate**: [percentage of work redone]
- **Bug Escape Rate**: [bugs found in production]
- **Test Pass Rate**: [tests passing on first run]
- **AI Accuracy**: [AI suggestions accepted]

### Productivity Metrics
- **Throughput**: [features completed per week]
- **Velocity**: [story points per sprint]
- **AI Utilization**: [percentage of work AI-assisted]
- **Time Savings**: [hours saved vs manual]

### Quality Gates
- [ ] All validations pass
- [ ] All tests pass
- [ ] Code reviews complete
- [ ] Documentation updated
- [ ] Security review done

**Track these metrics to identify bottlenecks and improvement opportunities.**
```

---

## 8. Prompt Templates Library

### 8.1 Edit Request Templates

#### Template: Surgical Code Edit

```markdown
## Surgical Code Edit

**File**: [path]
**Function/Class**: [name]
**Context**: [what this code does]

### What to Change
- **Line X-Y**: [specific change]
- **Function Z**: [specific change]

### What to Preserve
- **Pattern**: [maintain this pattern]
- **Interface**: [don't change public API]
- **Behavior**: [must maintain these behaviors]

### Validation
- [ ] [Test 1]: [verification]
- [ ] [Test 2]: [verification]

**Edit only what's specified. Preserve everything else.**
```

#### Template: Refactoring Request

```markdown
## Refactoring Request

**Code**: [file/function]
**Current State**: [what it does now]
**Goal**: [what we want to achieve]

### Refactoring Objectives
1. [Objective 1]: [specific improvement]
2. [Objective 2]: [specific improvement]

### Constraints
- **Behavior**: [must remain identical]
- **Interface**: [public API must not change]
- **Performance**: [must not degrade]

### Success Criteria
- [ ] [Criteria 1]: [how to verify]
- [ ] [Criteria 2]: [how to verify]

**Refactor while maintaining 100% functional compatibility.**
```

### 8.2 Bug Report Templates

#### Template: Detailed Bug Report

```markdown
## Bug Report

**Issue**: [clear description]
**Severity**: [Critical/High/Medium/Low]

### Reproduction
1. [Step 1]: [exact action]
2. [Step 2]: [exact action]
3. [Step 3]: [exact action]

**Expected**: [what should happen]
**Actual**: [what happens]

### Environment
- **Platform**: [OS, browser, etc.]
- **Version**: [software version]
- **Configuration**: [relevant settings]

### Error
```
[paste error or stack trace]
```

### Context
**Code Location**: [file:line]
**Related Files**: [other relevant files]

**Please help diagnose and fix this bug.**
```

#### Template: Quick Bug Fix

```markdown
## Quick Bug Fix

**Issue**: [one-sentence description]
**Code**: [snippet]

**Error**: [error message]

**Fix this please.**
```

### 8.3 Validation Request Templates

#### Template: Code Validation

```markdown
## Code Validation Request

**Code**: [file or snippet]
**Type**: [Static analysis/Security/Performance]

### Analysis Areas
- [ ] [Correctness]: [what to check]
- [ ] [Security]: [what to check]
- [ ] [Performance]: [what to check]
- [ ] [Style]: [what to check]

### Output Format
For each issue:
- **Severity**: [Critical/High/Medium/Low]
- **Category**: [type of issue]
- **Location**: [where]
- **Description**: [what's wrong]
- **Recommendation**: [how to fix]

**Please provide comprehensive validation.**
```

#### Template: Test Validation

```markdown
## Test Result Validation

**Test Output**: [paste results]
**Code Context**: [what was tested]

### Analysis Request
1. **Overall Result**: [summary]
2. **Failures**: [detailed analysis]
3. **Coverage**: [coverage assessment]
4. **Recommendations**: [next steps]

### For Each Failure
- **Test**: [which test]
- **Error**: [what failed]
- **Root Cause**: [why it failed]
- **Fix**: [how to fix]

**Please analyze test results.**
```

### 8.4 Testing Templates

#### Template: Test Generation

```markdown
## Test Generation Request

**Function/Class**: [code]
**Context**: [purpose, usage]

### Test Requirements
- **Happy Path**: [normal scenarios]
- **Edge Cases**: [boundaries, unusual inputs]
- **Error Cases**: [error conditions]
- **Integration**: [how it connects to other code]

### Framework
- **Framework**: [Jest/pytest/etc]
- **Coverage Goal**: [percentage]

**Please generate comprehensive tests.**
```

#### Template: Visual Testing

```markdown
## Visual Testing Request

**Component/Page**: [what to test]
**Baseline**: [reference image]
**Current**: [current screenshot]

### Comparison
- **Visual Diff**: [highlight differences]
- **Significance**: [are changes meaningful?]
- **Action**: [Accept/Reject]

**Please compare and analyze.**
```

### 8.5 Iteration Templates

#### Template: Iterative Improvement

```markdown
## Iteration N

**Feature**: [name]
**Previous State**: [what we had]
**Goal**: [what we're improving]

### This Iteration
- **Focus**: [specific improvement area]
- **Changes**: [what's changing]
- **Validation**: [how to verify improvement]

### Feedback
**What Works**: [keep this]
**What Needs Improvement**: [change this]

**Please iterate based on this feedback.**
```

#### Template: Progressive Enhancement

```markdown
## Progressive Enhancement Plan

**Phase 1 (MVP)**: [core features only]
- [ ] [Feature 1]
- [ ] [Feature 2]

**Phase 2 (Enhance)**: [based on feedback]
- [ ] [Improvement 1]
- [ ] [Improvement 2]

**Phase 3 (Polish)**: [production-ready]
- [ ] [Polish 1]
- [ ] [Polish 2]

**Progress sequentially through phases.**
```

---

## 9. Gap Analysis

### 9.1 What Workflows Are Commonly Missing

Based on our research and the critical gap you identified, here are workflows commonly missing from AI-assisted development systems:

#### Missing Workflow #1: Editing vs Greenfield

**The Gap**: Most systems focus on creating new code, not modifying existing code.

**Why It Matters**:
- 80%+ of development work is editing, not greenfield
- Poor editing workflows lead to broken code
- Context loss during edits causes rework

**Solution**: Implement comprehensive editing workflows with:
- Surgical edit prompts
- Context preservation
- Pattern maintenance
- Batch editing capabilities

#### Missing Workflow #2: Systematic Bug Fixing

**The Gap**: Bug fixing is often ad-hoc, not systematic.

**Why It Matters**:
- Bugs are inevitable
- Poor debugging wastes time
- Inconsistent fixes introduce new bugs

**Solution**: Implement systematic debugging with:
- Bug report templates
- Hypothesis testing
- Root cause analysis
- Fix validation protocols

#### Missing Workflow #3: Iteration Mechanics

**The Gap**: Systems don't define how to iterate effectively.

**Why It Matters**:
- First attempt is rarely perfect
- Without iteration patterns, quality suffers
- Feedback loops are critical for AI improvement

**Solution**: Implement iteration workflows with:
- Progressive enhancement
- Small wins tracking
- Feedback capture
- Version management

#### Missing Workflow #4: Validation Gates

**The Gap**: AI-generated work is often accepted without proper validation.

**Why It Matters**:
- AI makes mistakes
- Undetected errors propagate
- Trust in AI erodes without quality control

**Solution**: Implement comprehensive validation with:
- Multi-stage validation (static, functional, security)
- AI-reviewing-AI patterns
- Quality metrics
- Regression prevention

#### Missing Workflow #5: AI Testing Strategy

**The Gap**: Testing is often manual or completely overlooked.

**Why It Matters**:
- Tests verify AI work quality
- Manual testing doesn't scale
- Edge cases are easily missed

**Solution**: Implement AI-assisted testing with:
- Test generation prompts
- Coverage analysis
- Edge case identification
- Automated validation

#### Missing Workflow #6: UI/Vision Validation

**The Gap**: Visual/UI testing is rarely automated or AI-assisted.

**Why It Matters**:
- UI bugs are common and expensive
- Manual visual testing is slow and error-prone
- Accessibility often overlooked

**Solution**: Implement vision capabilities with:
- Screenshot comparison
- Visual regression testing
- Accessibility validation
- Design system compliance

### 9.2 How to Fill These Gaps

#### Immediate Actions (This Week)

1. **Create Prompt Templates**
   - [ ] Surgical edit template
   - [ ] Bug report template
   - [ ] Validation request template
   - [ ] Test generation template

2. **Document Current Workflows**
   - [ ] How do we currently edit code?
   - [ ] How do we currently fix bugs?
   - [ ] How do we currently validate AI work?
   - [ ] How do we currently test?

3. **Identify Pain Points**
   - [ ] Where do we lose context?
   - [ ] Where do we repeat work?
   - [ ] Where is quality inconsistent?

#### Short-Term Improvements (This Month)

1. **Implement Editing Workflows**
   - [ ] Train team on surgical editing
   - [ ] Create context packages for editing
   - [ ] Set up diff-based editing tools

2. **Implement Bug Fixing Workflows**
   - [ ] Create bug report template
   - [ ] Train on hypothesis testing
   - [ ] Document debugging patterns

3. **Implement Validation Workflows**
   - [ ] Set up automated linting
   - [ ] Create validation checklists
   - [ ] Implement AI-reviewing-AI

#### Long-Term Systems (Next Quarter)

1. **Build Template Library**
   - [ ] Organize by workflow type
   - [ ] Version control templates
   - [ ] Track template effectiveness

2. **Implement Testing Workflows**
   - [ ] Set up AI test generation
   - [ ] Implement visual regression
   - [ ] Create coverage dashboards

3. **Continuous Improvement**
   - [ ] Measure workflow effectiveness
   - [ ] Iterate on templates
   - [ ] Share best practices

### 9.3 Validation Checklist

#### Use This Before Starting Any AI Work

```markdown
## Workflow Validation Checklist

### Planning Phase
- [ ] Have we defined clear objectives?
- [ ] Do we know what success looks like?
- [ ] Have we chosen the right workflow?
- [ ] Do we have appropriate templates?

### Execution Phase
- [ ] Are we using the right prompts?
- [ ] Are we preserving necessary context?
- [ ] Are we validating at each step?
- [ ] Are we tracking decisions?

### Completion Phase
- [ ] Have we validated outputs?
- [ ] Have we tested thoroughly?
- [ ] Have we documented learnings?
- [ ] Have we updated templates?

### Review Phase
- [ ] What went well?
- [ ] What could be improved?
- [ ] What should we do differently next time?
- [ ] What templates need updating?

**Never skip validation gates.**
```

---

## 10. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Objective**: Establish basic workflow infrastructure

#### Week 1: Template Creation
- [ ] Create prompt templates for all workflows
- [ ] Organize template library
- [ ] Document template usage guidelines
- [ ] Train team on templates

#### Week 2: Tool Setup
- [ ] Configure linting and formatting tools
- [ ] Set up automated validation
- [ ] Configure testing frameworks
- [ ] Establish CI/CD validation gates

### Phase 2: Core Workflows (Week 3-6)

**Objective**: Implement essential editing, fixing, and validation workflows

#### Week 3-4: Editing Workflows
- [ ] Surgical editing training
- [ ] Context packaging procedures
- [ ] Diff-based tool setup
- [ ] Batch editing capabilities

#### Week 5-6: Debugging Workflows
- [ ] Bug report templates
- [ ] Hypothesis testing procedures
- [ ] Root cause analysis training
- [ ] Fix validation protocols

### Phase 3: Advanced Workflows (Week 7-10)

**Objective**: Implement iteration, testing, and UI/vision capabilities

#### Week 7-8: Iteration & Validation
- [ ] Progressive enhancement patterns
- [ ] Feedback loop mechanisms
- [ ] Multi-stage validation
- [ ] Quality metrics dashboards

#### Week 9-10: Testing & UI/Vision
- [ ] AI test generation
- [ ] Visual regression testing
- [ ] Accessibility validation
- [ ] Design system compliance

### Phase 4: Integration & Optimization (Week 11-12)

**Objective**: Integrate all workflows and optimize for effectiveness

#### Week 11: Integration
- [ ] Connect all workflows
- [ ] End-to-end testing
- [ ] Documentation completion
- [ ] Team training complete

#### Week 12: Optimization
- [ ] Measure effectiveness
- [ ] Identify bottlenecks
- [ ] Implement improvements
- [ ] Plan next iterations

---

## Conclusion

### The Key Insight

> "The difference between success and failure with AI isn't about using MORE AI - it's about using it strategically within proper workflows."

This research fills the critical gap in our planning: we focused on greenfield building but missed the essential workflows for editing, fixing, iterating, validating, and testing.

### What We've Provided

1. **Comprehensive Workflow Patterns** - Detailed steps for each workflow type
2. **Prompt Templates** - Ready-to-use templates for every situation
3. **Tool Recommendations** - What tools help with each workflow
4. **Best Practices** - What works, what doesn't, common pitfalls
5. **Integration Guide** - How workflows connect and build on each other
6. **Gap Analysis** - What workflows are commonly missing
7. **Validation Checklist** - How to ensure you're not missing critical workflows

### How to Use This Guide

1. **Start with templates** - Copy and adapt the prompt templates
2. **Train your team** - Share these workflows and patterns
3. **Implement gradually** - Start with high-impact workflows
4. **Measure effectiveness** - Track what works and what doesn't
5. **Iterate and improve** - Continuously refine based on experience

### The Ultimate Goal

Build a system where:
- Every edit is surgical and precise
- Every bug is fixed systematically
- Every iteration adds value
- Every AI output is validated
- Every feature is tested thoroughly
- Every UI is visually validated

This is how we move from AI as a novelty to AI as a professional tool that consistently delivers high-quality results.

---

## Sources

### Research Sources

#### AI Workflows & Editing
- [My LLM coding workflow going into 2026](https://medium.com/@addyosmani/my-llm-coding-workflow-going-into-2026-52fe1681325e) - Addy Osmani's latest on LLM coding workflows
- [10 AI Workflows Every Developer Should Know in 2025](https://stefanknoch.com/blog/10-ai-workflows-every-developer-should-know-2025) - Comprehensive workflow patterns
- [AI Workflow Automation for Developers: 10 Proven Patterns](https://zencoder.ai/blog/ai-workflow-automation-for-developers-10-proven-patterns-to-ship-faster) - Automation over prompting
- [A Survey of Bugs in AI-Generated Code](https://arxiv.org/html/2512.05239v1) - Academic research on AI code quality

#### Validation & Testing
- [Best Practices for Coding with AI in 2024](https://blog.codacy.com/best-practices-for-coding-with-ai) - Validation practices
- [4 Best Practices for AI Code Security](https://www.stackhawk.com/blog/4-best-practices-for-ai-code-security-a-developers-guide/) - Security validation
- [Generative AI in Software Testing in 2025](https://aqua-cloud.io/generative-ai-in-testing/) - Test generation patterns
- [10 Essential Practices for Testing AI Systems in 2025](https://www.testmo.com/blog/10-essential-practices-for-testing-ai-systems-in-2025/) - AI testing strategies

#### UI/Vision Testing
- [Top 16 Visual Testing Tools in 2025](https://www.browserstack.com/guide/visual-testing-tools) - Visual testing tools overview
- [Top 7 Visual Testing Tools for 2025](https://testrigor.com/blog/visual-testing-tools/) - Screenshot comparison tools
- [Top 25 Visual Testing Tools to Watch for in 2025](https://medium.com/@testwithblake/top-25-visual-testing-tools-to-watch-for-in-2025-fbde69de100c) - AI comparison methods
- [10 Best AI Tools for Testers in 2025](https://ttms.com/uk/10-best-ai-tools-for-testers/) - AI testing tools

#### Internal Documentation
- [ANTHROPIC_CLAUDE_BUILDING_GUIDE.md](./ANTHROPIC_CLAUDE_BUILDING_GUIDE.md) - Official Anthropic guidance
- [PRODUCTIVITY_FLOW_STATE_AI_ASSISTED_BUILDING_RESEARCH.md](./PRODUCTIVITY_FLOW_STATE_AI_ASSISTED_BUILDING_RESEARCH.md) - Flow state and productivity
- [AI_SESSION_MANAGEMENT_PROMPT_TEMPLATES_COMPLETE.md](./AI_SESSION_MANAGEMENT_PROMPT_TEMPLATES_COMPLETE.md) - Session management
- [RENATA_V2_FIXES_COMPLETE_SUMMARY.md](./projects/edge-dev-main/RENATA_V2_FIXES_COMPLETE_SUMMARY.md) - Example of systematic debugging
- [PARAM_PRESERVATION_SYSTEM_COMPLETE.md](./projects/edge-dev-main/PARAM_PRESERVATION_SYSTEM_COMPLETE.md) - Example of thorough validation

---

**Document Version**: 1.0
**Last Updated**: 2026-01-11
**Status**: ✅ Complete
**Next Review**: 2026-04-11 (quarterly)

---

**This research document provides the missing piece: comprehensive workflows for everything EXCEPT initial greenfield building. Use it to build systems that support the full development lifecycle, not just creating new code.**
