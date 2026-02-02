# AI Session Management & Prompt Template System
**Complete Guide for Sustainable AI Development**

**Version**: 1.0
**Date**: 2026-01-11
**Status**: Production Ready

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Session Management Playbook](#session-management-playbook)
3. [Context Pickup Strategies](#context-pickup-strategies)
4. [Prompt Template System](#prompt-template-system)
5. [Phase-Specific Templates](#phase-specific-templates)
6. [Universal Prompt Patterns](#universal-prompt-patterns)
7. [Feedback & Correction Patterns](#feedback--correction-patterns)
8. [Template Library Structure](#template-library-structure)
9. [Implementation Quick Start](#implementation-quick-start)
10. [Research Sources](#research-sources)

---

## Executive Summary

### The Core Problem

AI development often fails due to:
1. **Session Fragmentation**: Lost context between sessions causes 60-80% rework
2. **Prompt Chaos**: No reusable templates leads to inconsistent results
3. **Context Overload**: Including too much irrelevant information slows AI
4. **Poor Handoffs**: Incomplete session summaries waste time reorienting

### The Solution Framework

This guide provides a complete system for:
- **Structured Sessions**: Clear start/stop/handoff rituals
- **Context Pickup**: Quick reorientation patterns (<5 minutes)
- **Template Library**: Reusable prompts organized by phase
- **Phase-Specific Patterns**: Optimized prompts for each development stage
- **Feedback Loops**: Systematic improvement patterns

### Key Benefits

| Benefit | Impact | Measurement |
|---------|--------|-------------|
| **Reduced Rework** | 60-80% less repeated work | Track rework incidents per session |
| **Faster Pickup** | <5 min session reorientation | Time to productive work |
| **Consistent Quality** | Predictable AI outputs | Template usage rate |
| **Knowledge Capture** | Every session builds intelligence | Artifact generation rate |
| **Team Efficiency** | Shareable patterns across team | Template reuse rate |

---

## Session Management Playbook

### The Session Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    SESSION LIFECYCLE                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. PREPARE (Before Starting)                               │
│     ├─ Define clear session objectives                      │
│     ├─ Gather necessary context                             │
│     └─ Choose appropriate templates                         │
│                                                             │
│  2. INITIALIZE (Session Start)                              │
│     ├─ Set session context with template                   │
│     ├─ Establish success criteria                           │
│     └─ Define session boundaries                            │
│                                                             │
│  3. EXECUTE (Main Work)                                     │
│     ├─ Work in focused iterations                           │
│     ├─ Document decisions as you go                         │
│     └─ Create checkpoint artifacts                         │
│                                                             │
│  4. HANDOFF (Session End)                                   │
│     ├─ Create comprehensive session summary                │
│     ├─ Document open questions and next steps              │
│     └─ Generate handoff package for next session           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1. PREPARE Phase: Before Starting

#### Session Preparation Checklist

```markdown
## Session Preparation Template

**Session Date**: [DATE]
**Session Type**: [Planning/Research/Building/Review/Documentation]
**Expected Duration**: [HOURS]

### Primary Objectives
- [ ] Objective 1: [Clear, measurable goal]
- [ ] Objective 2: [Clear, measurable goal]
- [ ] Objective 3: [Clear, measurable goal]

### Context Needed
- [ ] Previous session summaries reviewed
- [ ] Relevant codebase sections identified
- [ ] Key constraints/requirements documented
- [ ] Success criteria defined

### Artifacts to Create
- [ ] [Artifact type]: [Purpose]
- [ ] [Artifact type]: [Purpose]

### Success Criteria
- [ ] [Specific outcome]: [How to verify]
- [ ] [Specific outcome]: [How to verify]

### Potential Blockers
- [ ] [Potential issue]: [Mitigation strategy]
- [ ] [Potential issue]: [Mitigation strategy]
```

#### What Context Matters vs. What Doesn't

**INCLUDE (High Value)**:
- Project goals and success criteria
- Architecture decisions and rationale
- Current work status and what's blocking
- Relevant code patterns and conventions
- Previous session decisions and outcomes
- Technical constraints and requirements

**EXCLUDE (Low Value/Noise)**:
- Entire file contents unless directly relevant
- Historical debugging of resolved issues
- Irrelevant project history
- Outdated documentation
- Conversational history from unrelated topics

**Rule of Thumb**: If it doesn't directly impact the current task's success, leave it out.

### 2. INITIALIZE Phase: Session Start

#### Session Initialization Template

```markdown
## Session Initialization

**Session ID**: [UNIQUE_ID]
**Project**: [PROJECT_NAME]
**Phase**: [CURRENT_PHASE]
**Starting Context**: [Quick 2-3 sentence summary of where we are]

### Current Status
**What We're Working On**: [Brief description]
**Last Session Achievement**: [Key accomplishment]
**Current Blocker (if any)**: [Description]

### Today's Focus
1. **Primary Task**: [Most important outcome]
2. **Secondary Tasks**: [Other goals if time permits]
3. **Stretch Goals**: [Nice to have if things go well]

### Key Context
**Project Architecture**: [2-3 sentence overview]
**Relevant Patterns**: [Patterns to follow]
**Important Constraints**: [Technical/business limitations]
**Quality Standards**: [What "done" looks like]

### Working Directory
**Location**: [Absolute path]
**Key Files**: [List of relevant files]

Let's begin with [specific first step].
```

### 3. EXECUTE Phase: Main Work

#### Checkpoint Template (Every 30-60 minutes)

```markdown
## Session Checkpoint [Time]

### Completed
- [x] [Task 1]: [Brief outcome]
- [x] [Task 2]: [Brief outcome]

### In Progress
- [ ] [Task 3]: [Current status]
- [ ] [Task 4]: [Current status]

### Decisions Made
1. **[Decision Title]**: [What and why]
2. **[Decision Title]**: [What and why]

### Issues Encountered
- **[Issue]**: [How addressed or next steps]

### Next Steps
1. [Immediate next action]
2. [Following action]

### Context Update
[New information that would be valuable for next session]
```

### 4. HANDOFF Phase: Session End

#### Session Handoff Template

```markdown
## Session Handoff Summary

**Session ID**: [PREVIOUS_ID]
**Date**: [DATE]
**Duration**: [HOURS]
**Next Session**: [DATE/TIME if planned]

### What We Accomplished
1. **[Achievement 1]**: [Impact/Value]
2. **[Achievement 2]**: [Impact/Value]
3. **[Achievement 3]**: [Impact/Value]

### Key Decisions
1. **[Decision 1]**: [Rationale and implications]
2. **[Decision 2]**: [Rationale and implications]

### Artifacts Created
- **[Artifact 1]**: [Location/Path]
- **[Artifact 2]**: [Location/Path]

### What's Next (Priority Order)
1. **[Next Task 1]**: [Context/Requirements]
2. **[Next Task 2]**: [Context/Requirements]
3. **[Next Task 3]**: [Context/Requirements]

### Open Questions
- **[Question 1]**: [What we need to figure out]
- **[Question 2]**: [What we need to figure out]

### Technical Notes
- **[Note 1]**: [Technical detail for continuity]
- **[Note 2]**: [Technical detail for continuity]

### Files Modified
- ` [file_path]`: [Brief change description]
- ` [file_path]`: [Brief change description]

### Context for Next Session
**Quick Pickup (2-3 sentences)**: [What the next session needs to know at a glance]

**Deep Context (if needed)**: [Additional context for complex situations]

**Critical Success Factors**: [What must happen for next session to succeed]
```

---

## Context Pickup Strategies

### The 5-Minute Reorientation Method

When starting a new session, use this rapid context loading pattern:

```markdown
## Quick Context Pickup

### Project Snapshot (30 seconds)
**Project**: [NAME]
**Goal**: [One sentence objective]
**Current Phase**: [Planning/Building/Testing/Deploying]

### Last Session Summary (1 minute)
**What Was Done**: [2-3 key accomplishments]
**What Was Decided**: [Key decisions]
**What's Next**: [Immediate next task]

### Current Context (2 minutes)
**What I'm Working On Now**: [Specific task]
**Where the Code Is**: [Key files/directories]
**What I Need to Do**: [Clear success criteria]

### Quick References (1.5 minutes)
**Architecture Overview**: [2-3 sentences]
**Key Patterns**: [Pattern names to follow]
**Important Constraints**: [Must-know limitations]

**Let's start by** [specific first action].
```

### Progressive Context Loading

Don't dump all context at once. Load progressively as needed:

1. **Initial Load**: Project snapshot + last session summary (1 minute)
2. **Task Context**: Specific task information (30 seconds)
3. **Deep Dive**: Detailed context only when working on specific component (as needed)

### Context Summarization Patterns

**When Summarizing Previous Work**:
- Focus on outcomes, not process
- Highlight decisions and rationale
- Note any deviations from plans
- Tag information for easy retrieval

**Example Summary Hierarchy**:
```
Level 1: "Fixed authentication bug in login flow"
Level 2: "Fixed JWT token validation issue causing unexpected logouts"
Level 3: "Fixed JWT token validation by updating expiration check logic in auth.middleware.ts:45-67"
```

Use Level 1 for quick overviews, Level 2 for task context, Level 3 only when directly working on that code.

---

## Prompt Template System

### Template Design Principles

Based on 2025 research into reusable prompt systems:

1. **Modularity**: Composable sections that can be mixed and matched
2. **Parameterization**: Clear placeholders for variable content
3. **Context Awareness**: Templates adapt to different situations
4. **Reusability**: Work across multiple similar scenarios
5. **Version Control**: Track template evolution

### Template Structure

Every template follows this structure:

```markdown
## [Template Name]

**Purpose**: [What this template accomplishes]
**Phase**: [Planning/Research/Building/Review/Documentation]
**Complexity**: [Low/Medium/High]
**Estimated Time**: [Duration]

### Context Parameters
- `{{PROJECT_NAME}}`: [Description]
- `{{CURRENT_STATE}}`: [Description]
- `{{OBJECTIVE}}`: [Description]

### Template
[The actual template content]

### Expected Outputs
- [Output 1]: [Description]
- [Output 2]: [Description]

### Success Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]

### Related Templates
- [Template Name]: [When to use instead]
- [Template Name]: [What to use next]
```

---

## Phase-Specific Templates

### Planning Phase Templates

#### Template: Project Planning Session

```markdown
## Project Planning Session Template

**Purpose**: Establish comprehensive project plan with clear roadmap
**Phase**: Planning
**Complexity**: High
**Estimated Time**: 2-4 hours

### Context Parameters
- `{{PROJECT_NAME}}`: Name of the project
- `{{PROJECT_GOAL}}`: High-level objective
- `{{CONSTRAINTS}}`: Technical, time, or resource limitations
- `{{STAKEHOLDERS}}**: Who will use or is affected by this project

### Initialization

You are the CE-Hub Master Orchestrator. We're starting a planning session for `{{PROJECT_NAME}}`.

**Project Goal**: `{{PROJECT_GOAL}}`
**Key Constraints**: `{{CONSTRAINTS}}`
**Stakeholders**: `{{STAKEHOLDERS}}`

### Planning Process

Please guide me through a systematic planning process:

1. **Requirements Analysis**
   - What are the core functional requirements?
   - What are the non-functional requirements (performance, security, usability)?
   - What are the technical requirements and constraints?
   - What does "success" look like for this project?

2. **Architecture Considerations**
   - What are the key architectural decisions needed?
   - What existing patterns or systems should we leverage?
   - What are the integration points?
   - What technical approach best fits the requirements?

3. **Risk Assessment**
   - What are the main technical risks?
   - What are the main schedule risks?
   - What mitigation strategies should we consider?

4. **Execution Plan**
   - Break down the project into phases
   - Define dependencies between phases
   - Estimate effort for each phase
   - Identify milestones and checkpoints

5. **Resource Planning**
   - What skills/resources are needed?
   - What sub-agents should be involved?
   - What tools or libraries are needed?

### Expected Outputs

Please produce:
- **PRP Document**: Problem-Requirements-Plan structured document
- **Architecture Sketch**: High-level system design
- **Risk Register**: Identified risks with mitigation strategies
- **Milestone Timeline**: Key checkpoints and deliverables
- **Resource Requirements**: Skills, tools, and dependencies

### Success Criteria
- [ ] Clear, measurable requirements defined
- [ ] Viable architecture proposed
- [ ] Risks identified with mitigation strategies
- [ ] Phased execution plan with dependencies
- [ ] Resource requirements documented
- [ ] Clear next steps identified

### Guidance for AI

**Planning Best Practices**:
- Ask clarifying questions before finalizing plans
- Present options with trade-offs for key decisions
- Ensure all requirements are measurable and testable
- Plan for iteration and learning phases
- Include validation and testing activities
- Consider maintenance and evolution needs

**What to Avoid**:
- Don't jump to implementation before planning is complete
- Don't ignore constraints or dependencies
- Don't create unrealistic timelines
- Don't skip risk assessment
- Don't plan in isolation - consider integration needs
```

#### Template: Quick Planning Session

```markdown
## Quick Planning Session Template

**Purpose**: Rapid planning for small, well-defined tasks
**Phase**: Planning
**Complexity**: Low
**Estimated Time**: 30-60 minutes

### Context Parameters
- `{{TASK_DESCRIPTION}}`: What needs to be done
- `{{CONTEXT}}`: Relevant background information
- `{{CONSTRAINTS}}`: Any limitations or requirements

### Quick PRP Structure

**PROBLEM**: `{{TASK_DESCRIPTION}}`

**REQUIREMENTS**:
- Functional: [What it must do]
- Quality: [How well it must do it]
- Constraints: `{{CONSTRAINTS}}`

**PLAN**:
1. [Step 1]: [Brief description]
2. [Step 2]: [Brief description]
3. [Step 3]: [Brief description]

### Expected Outputs
- Brief plan with 3-7 steps
- Clear success criteria
- Identification of potential issues

**Let's plan this quickly and efficiently.**
```

### Research Phase Templates

#### Template: Codebase Research Session

```markdown
## Codebase Research Session Template

**Purpose**: Systematically explore and understand a codebase
**Phase**: Research
**Complexity**: Medium
**Estimated Time**: 1-3 hours

### Context Parameters
- `{{CODEBASE_PATH}}`: Path to codebase
- `{{RESEARCH_GOAL}}`: What we're trying to understand
- `{{FOCUS_AREAS}}`: Specific components or patterns of interest

### Research Process

You are a Research Agent specializing in codebase analysis. We're researching `{{CODEBASE_PATH}}`.

**Research Goal**: `{{RESEARCH_GOAL}}`
**Focus Areas**: `{{FOCUS_AREAS}}`

### Systematic Exploration

Please guide me through:

1. **Structure Discovery**
   - What is the overall project structure?
   - What are the main directories and their purposes?
   - What are the entry points?
   - What frameworks/technologies are used?

2. **Pattern Recognition**
   - What architectural patterns are used?
   - What code patterns appear repeatedly?
   - What naming conventions are followed?
   - What are the key abstractions?

3. **Dependency Mapping**
   - What are the key dependencies?
   - How do components interact?
   - Are there any circular dependencies?
   - What are the integration points?

4. **Quality Assessment**
   - What testing approaches are used?
   - Is there documentation? Where and how good?
   - Are there any obvious code smells or issues?
   - What's the overall code quality?

5. **Knowledge Gaps**
   - What questions remain unanswered?
   - What areas need deeper investigation?
   - What assumptions are we making?

### Expected Outputs

Please produce:
- **Architecture Overview**: System structure and key components
- **Pattern Catalog**: Reusable patterns found in codebase
- **Dependency Map**: How components relate
- **Quality Report**: Assessment of code quality and practices
- **Research Notes**: Key findings and observations

### Success Criteria
- [ ] Clear understanding of codebase structure
- [ ] Key patterns identified
- [ ] Dependencies mapped
- [ ] Quality assessed
- [ ] Knowledge gaps documented

### Guidance for AI

**Research Best Practices**:
- Start broad, then drill down based on findings
- Use tools like grep and glob strategically
- Document findings as you discover them
- Identify patterns, not just individual instances
- Note both good practices and potential issues
- Ask questions to clarify research direction

**Research Patterns**:
- **Top-Down**: Start from entry points, trace execution
- **Bottom-Up**: Examine utilities, understand capabilities
- **Feature-Based**: Follow specific feature implementation
- **Pattern-Based**: Search for specific patterns/conventions
```

#### Template: Pattern Research Session

```markdown
## Pattern Research Session Template

**Purpose**: Research and document specific implementation patterns
**Phase**: Research
**Complexity**: Medium
**Estimated Time**: 1-2 hours

### Context Parameters
- `{{PATTERN_TYPE}}`: Type of pattern to research (architectural, design, coding)
- `{{CODEBASE_LOCATION}}`: Where to search
- `{{RESEARCH_SCOPE}}`: How comprehensive the search should be

### Pattern Research Process

**Pattern Type**: `{{PATTERN_TYPE}}`
**Search Location**: `{{CODEBASE_LOCATION}}`
**Scope**: `{{RESEARCH_SCOPE}}`

### Investigation Steps

1. **Pattern Discovery**
   - Search for instances of `{{PATTERN_TYPE}}`
   - Identify variations and implementations
   - Catalog different approaches used

2. **Pattern Analysis**
   - How is this pattern implemented?
   - What are the common elements?
   - What variations exist and why?
   - What are the trade-offs?

3. **Best Practice Identification**
   - Which implementation is most effective?
   - What makes it better?
   - What should be replicated?
   - What should be avoided?

4. **Documentation**
   - Create pattern description
   - Document when to use it
   - Provide code examples
   - Note pros and cons

### Expected Outputs
- **Pattern Description**: Clear explanation of pattern
- **Implementation Guide**: How to implement it
- **Code Examples**: Representative samples
- **Usage Guidelines**: When to use/avoid
- **Variations Catalog**: Different approaches documented

### Success Criteria
- [ ] Pattern clearly understood and documented
- [ ] Multiple implementations analyzed
- [ ] Best practices identified
- [ ] Reusable guidance created
```

### Building Phase Templates

#### Template: Implementation Session

```markdown
## Implementation Session Template

**Purpose**: Execute planned development work systematically
**Phase**: Building
**Complexity**: Variable
**Estimated Time**: 2-4 hours

### Context Parameters
- `{{TASK_DESCRIPTION}}`: What needs to be implemented
- `{{EXISTING_CODE_CONTEXT}}`: Relevant code patterns and conventions
- `{{REQUIREMENTS}}`: What the implementation must achieve
- `{{CONSTRAINTS}}`: Technical or other limitations

### Implementation Process

You are an Engineer Agent specializing in implementation. We're implementing: `{{TASK_DESCRIPTION}}`.

**Requirements**: `{{REQUIREMENTS}}`
**Constraints**: `{{CONSTRAINTS}}`
**Existing Context**: `{{EXISTING_CODE_CONTEXT}}`

### Systematic Implementation

Please guide me through:

1. **Understanding & Clarification**
   - Confirm understanding of requirements
   - Ask any clarifying questions
   - Identify edge cases to handle
   - Verify approach with me before coding

2. **Design Approach**
   - Propose implementation strategy
   - Identify key functions/components
   - Plan integration points
   - Consider error handling

3. **Implementation**
   - Write clean, well-structured code
   - Follow existing patterns and conventions
   - Add appropriate comments
   - Handle errors gracefully

4. **Testing Considerations**
   - How should this be tested?
   - What edge cases need coverage?
   - What are the expected outputs?

5. **Integration**
   - How does this integrate with existing code?
   - Are any changes needed elsewhere?
   - What dependencies are introduced?

### Expected Outputs
- **Implementation Code**: Clean, working solution
- **Integration Notes**: How it connects to existing code
- **Testing Strategy**: How to verify it works
- **Documentation**: Code comments and usage guide

### Success Criteria
- [ ] Code follows existing patterns
- [ ] Requirements fully met
- [ ] Error handling implemented
- [ ] Integration points identified
- [ ] Testing strategy defined

### Guidance for AI

**Implementation Best Practices**:
- Follow existing code patterns and conventions
- Write code that is readable and maintainable
- Include helpful comments for complex logic
- Consider error cases and edge conditions
- Think about testability while writing code
- Validate understanding before implementing

**What to Avoid**:
- Don't introduce new patterns unnecessarily
- Don't over-engineer simple solutions
- Don't ignore error handling
- Don't skip testing considerations
- Don't break existing interfaces

**Quality Checks**:
- Does code follow project conventions?
- Are variable names clear and descriptive?
- Is error handling appropriate?
- Is the code testable?
- Will this be maintainable by others?
```

#### Template: Debugging Session

```markdown
## Debugging Session Template

**Purpose**: Systematically identify and fix bugs
**Phase**: Building
**Complexity**: Variable
**Estimated Time**: 1-3 hours

### Context Parameters
- `{{BUG_DESCRIPTION}}`: What's going wrong
- `{{EXPECTED_BEHAVIOR}}`: What should happen
- `{{ACTUAL_BEHAVIOR}}`: What's actually happening
- `{{RELEVANT_CODE}}`: Code sections involved

### Debugging Process

**Bug Description**: `{{BUG_DESCRIPTION}}`
**Expected**: `{{EXPECTED_BEHAVIOR}}`
**Actual**: `{{ACTUAL_BEHAVIOR}}`
**Relevant Code**: `{{RELEVANT_CODE}}`

### Systematic Debugging

Please help me debug this systematically:

1. **Problem Understanding**
   - Reproduce the issue if possible
   - Identify exact failure point
   - Determine scope of the problem
   - Gather relevant error messages/logs

2. **Root Cause Analysis**
   - What conditions cause the bug?
   - What code path leads to failure?
   - What assumptions are being made?
   - What's the most likely cause?

3. **Hypothesis Formation**
   - Propose root cause hypothesis
   - Identify test to verify hypothesis
   - Determine what to check first

4. **Investigation**
   - Check the most likely causes
   - Add logging/debug output as needed
   - Verify or refute hypotheses

5. **Fix Implementation**
   - Propose solution
   - Explain why it will work
   - Consider side effects
   - Implement the fix

6. **Verification**
   - Test that fix resolves issue
   - Check for regressions
   - Verify edge cases

### Expected Outputs
- **Root Cause**: Clear explanation of what's wrong
- **Fix**: Code correction that resolves issue
- **Testing**: Verification that fix works
- **Prevention**: How to avoid similar issues

### Success Criteria
- [ ] Root cause identified
- [ ] Fix implemented and tested
- [ ] No regressions introduced
- [ ] Understanding documented
```

### Review Phase Templates

#### Template: Code Review Session

```markdown
## Code Review Session Template

**Purpose**: Comprehensive review of code for quality and correctness
**Phase**: Review
**Complexity**: Medium
**Estimated Time**: 1-2 hours

### Context Parameters
- `{{CODE_TO_REVIEW}}`: Code files or sections to review
- `{{REVIEW_TYPE}}`: Full review / targeted review / security review
- `{{REVIEW_CRITERIA}}`: Specific aspects to focus on

### Review Process

You are a Tester/Reviewer Agent specializing in code quality. We're reviewing: `{{CODE_TO_REVIEW}}`.

**Review Type**: `{{REVIEW_TYPE}}`
**Focus Areas**: `{{REVIEW_CRITERIA}}`

### Systematic Review

Please guide me through:

1. **Correctness Review**
   - Does the code achieve its purpose?
   - Are there any logical errors?
   - Are edge cases handled properly?
   - Is error handling appropriate?

2. **Quality Review**
   - Is code readable and understandable?
   - Are variable/function names clear?
   - Is code properly structured?
   - Are comments helpful and accurate?

3. **Pattern Compliance**
   - Does code follow project conventions?
   - Are established patterns used correctly?
   - Is code consistent with surrounding code?
   - Are any anti-patterns present?

4. **Security Review** (if applicable)
   - Are there any security vulnerabilities?
   - Is user input properly validated?
   - Are sensitive data handled correctly?
   - Are there any injection risks?

5. **Performance Review** (if applicable)
   - Are there obvious performance issues?
   - Are there unnecessary computations?
   - Is data access efficient?
   - Are resources properly managed?

6. **Maintainability Review**
   - Will this be easy to maintain?
   - Is it overly complex?
   - Are there magic numbers or strings?
   - Could it be simplified?

### Expected Outputs
- **Review Summary**: Overall assessment
- **Issues Found**: Categorized by severity
- **Recommendations**: Specific improvements
- **Positive Notes**: What's done well

### Success Criteria
- [ ] All critical issues identified
- [ ] Improvement recommendations provided
- [ ] Positive aspects acknowledged
- [ ] Action items clearly specified
```

#### Template: Architecture Review Session

```markdown
## Architecture Review Session Template

**Purpose**: Evaluate system architecture for soundness and scalability
**Phase**: Review
**Complexity**: High
**Estimated Time**: 2-3 hours

### Context Parameters
- `{{ARCHITECTURE_DESCRIPTION}}`: System architecture to review
- `{{REVIEW_FOCUS}}`: Performance / Security / Scalability / Maintainability
- `{{USE_CASES}}**: Expected usage patterns and load

### Architecture Review Process

**Architecture**: `{{ARCHITECTURE_DESCRIPTION}}`
**Focus**: `{{REVIEW_FOCUS}}`
**Use Cases**: `{{USE_CASES}}`

### Systematic Architecture Review

Please assess:

1. **Architectural Principles**
   - Separation of concerns
   - Modularity and cohesion
   - Appropriate abstraction levels
   - Interface design

2. **Scalability Assessment**
   - Can it handle expected load?
   - What are the scaling bottlenecks?
   - How does it scale horizontally/vertically?
   - What's the scaling strategy?

3. **Performance Considerations**
   - Are there performance risks?
   - How are caching and optimization handled?
   - What are the data access patterns?
   - Are there latency concerns?

4. **Security Assessment**
   - Are security boundaries clear?
   - Is authentication/authorization appropriate?
   - What are the security risks?
   - Are sensitive data protected?

5. **Maintainability**
   - Is the architecture understandable?
   - Can components be updated independently?
   - Are dependencies managed well?
   - Is testing and deployment feasible?

6. **Technology Choices**
   - Are technologies appropriate for use cases?
   - Are there better alternatives?
   - What are the trade-offs?
   - Are there unnecessary dependencies?

### Expected Outputs
- **Architecture Assessment**: Overall evaluation
- **Risk Analysis**: Identified architectural risks
- **Recommendations**: Improvement suggestions
- **Alternatives**: Different approaches to consider

### Success Criteria
- [ ] Key risks identified
- [ ] Scalability assessed
- [ ] Security reviewed
- [ ] Improvement roadmap provided
```

### Documentation Phase Templates

#### Template: Documentation Generation Session

```markdown
## Documentation Generation Session Template

**Purpose**: Create comprehensive documentation for code or systems
**Phase**: Documentation
**Complexity**: Medium
**Estimated Time**: 1-2 hours

### Context Parameters
- `{{SUBJECT}}`: What needs documentation
- `{{DOCUMENTATION_TYPE}}`: API docs / User guide / Architecture docs
- `{{AUDIENCE}}**: Target audience (developers, users, stakeholders)
- `{{DETAIL_LEVEL}}`: Overview / Comprehensive / Reference

### Documentation Process

**Subject**: `{{SUBJECT}}`
**Type**: `{{DOCUMENTATION_TYPE}}`
**Audience**: `{{AUDIENCE}}`
**Detail**: `{{DETAIL_LEVEL}}`

### Systematic Documentation

Please help me create documentation:

1. **Audience Analysis**
   - Who will read this?
   - What do they already know?
   - What do they need to learn?
   - How will they use this documentation?

2. **Structure Planning**
   - What sections should be included?
   - How should information be organized?
   - What's the logical flow?
   - What examples would help?

3. **Content Creation**
   - Write clear, concise explanations
   - Provide helpful examples
   - Include diagrams where useful
   - Add troubleshooting guidance

4. **Quality Review**
   - Is information accurate?
   - Is it easy to understand?
   - Are examples correct?
   - Is it complete?

### Expected Outputs
- **Structured Documentation**: Well-organized content
- **Examples**: Practical usage examples
- **Diagrams**: Visual representations (if applicable)
- **Quick Reference**: Summary information

### Success Criteria
- [ ] Appropriate for target audience
- [ ] Clear and understandable
- [ ] Complete and accurate
- [ ] Well-structured and navigable
- [ ] Includes helpful examples
```

---

## Universal Prompt Patterns

### Patterns That Work in Any Phase

Based on 2025 research into scalable prompt design, these patterns apply universally:

#### Pattern 1: Context-First Structure

```markdown
## Universal Context-First Template

**Always start prompts with context before making requests**

### Structure
1. **Role & Identity**: Who you want the AI to be
2. **Situation Context**: What's the current situation
3. **Task Definition**: What needs to be done
4. **Success Criteria**: How to measure success
5. **Constraints & Guidelines**: What to follow/avoid

### Example
```
You are an expert [domain] specialist working on [project].

Current Situation:
- We're working on [brief context]
- The goal is to [objective]
- Key constraint is [limitation]

Task:
[Specific request]

Success Criteria:
- [Outcome 1]
- [Outcome 2]

Please follow these guidelines:
- [Guideline 1]
- [Guideline 2]
```

**Why This Works**: Provides necessary context before requiring action, reducing back-and-forth clarification.
```

#### Pattern 2: Iterative Refinement

```markdown
## Iterative Refinement Pattern

**Don't expect perfection on first attempt. Plan for iteration.**

### Structure
1. **Initial Request**: Get a first version
2. **Review & Feedback**: Identify what needs improvement
3. **Refine**: Ask for specific improvements
4. **Validate**: Check against criteria
5. **Repeat**: Continue until satisfied

### Example Prompts
```
# First iteration
"Create a [X] that does [Y]. Focus on getting basic functionality working."

# Review
"Here's what works: [list]. Here's what needs improvement: [list]."

# Refinement
"Please revise to improve [specific aspect]. Keep [what worked]."

# Validation
"Check that the revised version meets [criteria]."
```

**Why This Works**: Matches how AI actually works - better through iteration than perfect first attempts.
```

#### Pattern 3: Example-Driven Guidance

```markdown
## Example-Driven Pattern

**Show, don't just tell. Use examples to guide AI.**

### Structure
1. **Request Description**: What you want
2. **Good Examples**: Show desired output
3. **Bad Examples**: Show what to avoid
4. **Pattern Explanation**: Why examples are good/bad

### Example
```
I need you to write [type of content]. Here are examples:

Good Example:
[Show desired output with good characteristics]

Bad Example:
[Show problematic output]

Notice the differences:
- [What makes good example good]
- [What makes bad example problematic]

Please follow the pattern in the good example.
```

**Why This Works**: Concrete examples are clearer than abstract descriptions.
```

#### Pattern 4: Decomposition Pattern

```markdown
## Task Decomposition Pattern

**Break complex tasks into manageable steps.**

### Structure
1. **Overall Goal**: What you ultimately want
2. **Decomposition**: Break into logical steps
3. **Step Execution**: Execute one step at a time
4. **Validation**: Verify each step before proceeding

### Example
```
We need to accomplish: [complex task]

Let's break this down:
1. [Sub-task 1]: [Brief description]
2. [Sub-task 2]: [Brief description]
3. [Sub-task 3]: [Brief description]

Please start with step 1. Don't proceed to step 2 until we confirm step 1 is complete and correct.
```

**Why This Works**: Reduces cognitive load, allows course correction, ensures quality at each step.
```

#### Pattern 5: Guardrails Pattern

```markdown
## Guardrails Pattern

**Explicitly define boundaries and constraints.**

### Structure
1. **Task Description**: What needs to be done
2. **Must-Have Constraints**: Critical requirements
3. **Must-Avoid Pitfalls**: Known problems to prevent
4. **Quality Gates**: How to verify output

### Example
```
Task: [What you need]

Critical Constraints:
- MUST: [Non-negotiable requirement]
- MUST: [Another non-negotiable]

Known Pitfalls to Avoid:
- DON'T: [Common mistake 1]
- DON'T: [Common mistake 2]

Quality Verification:
- Check that [validation criteria]
- Verify that [another validation]
```

**Why This Works**: Prevents common mistakes, ensures critical requirements are met.
```

---

## Feedback & Correction Patterns

### Giving Effective Feedback

#### Pattern: Structured Feedback

```markdown
## Structured Feedback Pattern

**Provide feedback in a clear, actionable format.**

### Structure
1. **Acknowledge**: What's working well
2. **Specify Issues**: What needs improvement
3. **Explain Impact**: Why it matters
4. **Request Change**: What should be different
5. **Provide Context**: Additional helpful information

### Template
```
Thank you for [specific good thing].

However, I need you to revise [specific aspect]:

Current Issue:
- What's wrong: [clear description]
- Why it's a problem: [impact/consequence]
- What should change: [desired outcome]

Additional Context:
[Relevant information that might help]

Please revise to address this.
```

### Correcting Without Starting Over

#### Pattern: Incremental Correction

```markdown
## Incremental Correction Pattern

**Fix specific issues without redoing everything.**

### Structure
1. **Preserve What Works**: Keep good parts
2. **Target Specific Issues**: Fix only what's needed
3. **Explain Precisely**: Clear description of change needed
4. **Maintain Context**: Keep overall structure intact

### Template
```
Most of this is good, especially [specific strengths].

Please revise only [specific part]:

Current: [What it is now]
Issue: [What's wrong with it]
Change to: [What it should be]

Keep everything else the same.
```

### Guiding Toward Preferences

#### Pattern: Preference Training

```markdown
## Preference Training Pattern

**Teach AI your preferences through consistent feedback.**

### Structure
1. **Clear Preference Statement**: What you prefer
2. **Reasoning**: Why you prefer it
3. **Consistent Application**: Apply to similar situations
4. **Positive Reinforcement**: Acknowledge when preferences are followed

### Template
```
I prefer [specific approach/style/format] because [reasoning].

For future [similar tasks], please follow this preference:
- [Guideline 1]
- [Guideline 2]

When you do this well, I'll let you know so you learn my preferences.
```

### Handling Persistent Misunderstandings

#### Pattern: Misunderstanding Resolution

```markdown
## Misunderstanding Resolution Pattern

**Address repeated issues systematically.**

### Structure
1. **Identify Pattern**: Point out the recurring issue
2. **Provide Examples**: Show specific instances
3. **Clarify Understanding**: Explain correct interpretation
4. **Request Confirmation**: Verify understanding
5. **Monitor Improvement**: Track changes over time

### Template
```
I notice a recurring pattern in your responses:

Issue: [Description of recurring problem]
Examples:
- Instance 1: [Specific case]
- Instance 2: [Specific case]
- Instance 3: [Specific case]

Correct Understanding:
- [What you actually want]
- [Why your request means this]
- [How to interpret similar requests]

Please confirm you understand this distinction.
```

---

## Template Library Structure

### Organization Framework

Based on 2025 research into prompt library organization:

```
prompt-library/
├── sessions/
│   ├── initialize/
│   │   ├── session-start.md
│   │   ├── quick-pickup.md
│   │   └── context-load.md
│   ├── execute/
│   │   ├── checkpoint.md
│   │   ├── progress-update.md
│   │   └── milestone.md
│   └── handoff/
│       ├── session-end.md
│       ├── handoff-summary.md
│       └── next-session-prep.md
│
├── phases/
│   ├── planning/
│   │   ├── project-planning.md
│   │   ├── quick-planning.md
│   │   └── architecture-design.md
│   ├── research/
│   │   ├── codebase-research.md
│   │   ├── pattern-research.md
│   │   └── gap-analysis.md
│   ├── building/
│   │   ├── implementation.md
│   │   ├── debugging.md
│   │   └── refactoring.md
│   ├── review/
│   │   ├── code-review.md
│   │   ├── architecture-review.md
│   │   └── security-review.md
│   └── documentation/
│       ├── api-docs.md
│       ├── user-guide.md
│       └── architecture-docs.md
│
├── patterns/
│   ├── universal/
│   │   ├── context-first.md
│   │   ├── iterative-refinement.md
│   │   ├── example-driven.md
│   │   ├── decomposition.md
│   │   └── guardrails.md
│   └── feedback/
│       ├── structured-feedback.md
│       ├── incremental-correction.md
│       ├── preference-training.md
│       └── misunderstanding-resolution.md
│
├── domains/
│   ├── frontend/
│   ├── backend/
│   ├── data-science/
│   ├── devops/
│   └── security/
│
└── project-specific/
    ├── [project-name]/
    │   ├── custom-templates.md
    │   ├── project-context.md
    │   └── team-preferences.md
```

### Template Metadata

Every template should include:

```yaml
---
template_id: unique-identifier
name: Template Name
purpose: One-line description
phase: [planning|research|building|review|documentation]
complexity: [low|medium|high]
estimated_time: duration
dependencies: [required context or templates]
outputs: [what this template produces]
version: 1.0
last_updated: 2026-01-11
tags: [searchable tags]
related_templates: [template-id-1, template-id-2]
---
```

### Template Version Control

Track template evolution:

```markdown
## Version History

### v1.0 (2026-01-11)
- Initial version
- Based on research into 2025 prompt engineering trends

### v1.1 (2026-XX-XX)
- [Improvement made]
- [Reason for change]

### v2.0 (2026-XX-XX)
- [Major revision]
- [Breaking changes or significant improvements]
```

---

## Implementation Quick Start

### Day 1: Foundation Setup (30 minutes)

1. **Create Template Library Structure**
   ```bash
   mkdir -p prompt-library/{sessions,phases,patterns,domains,project-specific}
   mkdir -p prompt-library/sessions/{initialize,execute,handoff}
   mkdir -p prompt-library/phases/{planning,research,building,review,documentation}
   mkdir -p prompt-library/patterns/{universal,feedback}
   ```

2. **Copy Core Templates**
   - Start with Session templates (initialize, execute, handoff)
   - Add universal patterns
   - Include one template per phase you use most

3. **Create Your First Session**
   ```bash
   # Use session initialization template
   cp prompt-library/sessions/initialize/session-start.md ./CURRENT_SESSION.md

   # Edit with your project details
   vim CURRENT_SESSION.md
   ```

### Day 2-7: Adopt & Adapt (1-2 hours)

1. **Use Templates for All Sessions**
   - Start every session with appropriate template
   - End every session with handoff template
   - Create checkpoints during long sessions

2. **Customize for Your Workflow**
   - Modify templates to fit your patterns
   - Add project-specific templates
   - Document your preferences

3. **Track Effectiveness**
   - Note which templates work best
   - Measure session pickup time
   - Track rework reduction

### Week 2-4: Refine & Expand

1. **Create Domain-Specific Templates**
   - Frontend/backend patterns
   - Industry-specific approaches
   - Team conventions

2. **Build Template Library**
   - Add new templates based on needs
   - Document successful patterns
   - Share with team

3. **Continuous Improvement**
   - Update templates based on usage
   - Retire unused templates
   - Evolve best practices

### Success Metrics

Track these to measure adoption effectiveness:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Session Pickup Time** | <5 minutes | Time from session start to productive work |
| **Rework Reduction** | 60% fewer repeats | Track issues that require re-solving |
| **Template Usage** | 80%+ of sessions | Percentage of sessions using templates |
| **Handoff Quality** | <1 clarification needed | Questions when resuming sessions |
| **Artifact Creation** | 100% of sessions | Session summaries and handoffs created |

---

## Research Sources

This guide is based on comprehensive research into 2025 AI development practices. Key sources include:

### Session Management & Context Pickup
- [Claude Code: Best practices for agentic coding](https://www.anthropic.com/engineering/claude-code-best-practices) - Official Anthropic guidance on effective Claude Code usage
- [My 7 essential Claude Code best practices for production](https://www.eesel.ai/en/blog/claude-code-best-practices) - Production-ready AI practices
- [Claude Code Session Management](https://stevekinney.com/courses/ai-development/claude-code-session-management) - Managing sessions, memory, and context
- [Session Handoff - Claude Code Skill](https://mcpmarket.com/tools/skills/session-handoff) - Context window management utilities
- [Effective Handoff Techniques for AI Coding](https://www.linkedin.com/posts/jkudish_claude-code-overview-claude-code-docs-activity-7407842425433526272-uQj_) - Handoff command patterns

### Prompt Template Systems
- [7 Prompt Engineering Templates That Actually Work (2025)](https://dextralabs.com/blog/prompt-engineering-templates/) - Proven prompt templates
- [New Prompt Layering Feature Improves AI Agent Development](https://airia.com/airia-announces-prompt-layering/) - Modular, composable prompts
- [Zero to One: Learning Agentic Patterns](https://www.philschmid.de/agentic-pattern) - AI agent design patterns
- [5 Patterns for Scalable Prompt Design](https://latitude-blog.ghost.io/blog/5-patterns-for-scalable-prompt-design/) - Maintainable prompt systems
- [Template Systems and Reusable Prompt Patterns](https://blog.stackademic.com/template-systems-and-reusable-prompt-patterns-3bf70a73b2a0) - React-like prompt components

### Template Library Organization
- [Building a Personal Prompt Library](https://www.shawnewallace.com/2025-11-19-building-a-personal-prompt-library/) - Library organization strategies
- [AI Prompt Library: Building and Using Prompt Collections](https://weam.ai/blog/prompts/ai-prompt-library/) - Library structure and taxonomy
- [From Templates to Toolchains: Prompt Engineering Trends 2025](https://www.refontelearning.com/blog/from-templates-to-toolchains-prompt-engineering-trends-2025-explained) - Automated toolchain integration
- [The Ultimate Guide to AI Prompt Engineering for Developers 2025](https://medium.com/@aleksandardobrohotov/the-ultimate-guide-to-ai-prompt-engineering-for-developers-2025-52d514689960) - Developer-centric workflows

### AI Development Phases
- [From Prompting to Planning: The Rise of AI Agents](https://www.gravitee.io/blog/from-prompting-to-planning-ai-agents) - Evolution to autonomous planning
- [Smarter Project Planning with AI in 7 Steps](https://monograph.com/blog/ai-project-planning-ae-firms-7-steps-smarter-projects) - Systematic AI planning
- [A Field Guide to AI-First Development](https://www.makingdatamistakes.com/ai-first-development/) - AI-first coding techniques

### Existing CE-Hub Patterns
- `/tools/prompts/prp-template.md` - Problem-Requirements-Plan framework
- `/CLAUDE.md` - Master Orchestrator configuration
- `/AGENT_BUILDER_WORKING.md` - Declarative agent building
- `/AGENT_QUICK_REFERENCE.md` - Agent architecture patterns

---

## Next Steps

1. **Implement Today**: Start with session initialization template
2. **Customize This Week**: Adapt templates to your workflow
3. **Build Library**: Add project-specific templates
4. **Track Results**: Measure effectiveness metrics
5. **Share & Evolve**: Update based on learnings

**Remember**: The goal is not template perfection, but consistent improvement. Start using templates immediately, then refine based on experience.

---

**Document Version**: 1.0
**Last Updated**: 2026-01-11
**Maintained By**: CE-Hub Master Orchestrator

For the latest version and community contributions, see the CE-Hub documentation system.
