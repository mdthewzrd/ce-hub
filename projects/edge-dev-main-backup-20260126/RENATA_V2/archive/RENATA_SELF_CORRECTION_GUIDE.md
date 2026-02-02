# Renata Self-Correction System - User Guide

## Overview

Renata now has the ability to handle user feedback and fix its own mistakes without requiring Claude's intervention. When you tell Renata it made a mistake, it will:

1. **Understand the feedback** - Detects when you're providing corrections
2. **Analyze the error** - Classifies the type of issue (syntax, logic, output, etc.)
3. **Fix the code** - Regenerates corrected code based on your feedback
4. **Explain the changes** - Shows what was changed and why

## How It Works

### 1. Feedback Detection

Renata automatically detects when you're providing feedback. It recognizes phrases like:

- "That's wrong"
- "You made a mistake"
- "Fix this"
- "Syntax error on line X"
- "Wrong result"
- "That's not what I asked for"
- "Try again"

### 2. Conversation Memory

Renata remembers the code it generated in previous messages. When you provide feedback, it:

- Retrieves the last code it generated
- Analyzes what you want changed
- Generates a corrected version

### 3. Classification System

Renata classifies your feedback into types:

- **Syntax Errors**: Issues preventing code execution
- **Logic Errors**: Problems with calculations or algorithms
- **Wrong Output**: Code runs but produces incorrect results
- **General Feedback**: Other corrections or improvements

### 4. Intelligent Correction

Based on the feedback type, Renata:

- Uses lower temperature (0.3) for more focused corrections
- Preserves all other functionality (doesn't break what's working)
- Follows EdgeDev standards (3-stage architecture, proper imports, etc.)
- Ensures syntax is valid before returning the code

## Usage Examples

### Example 1: Syntax Error Fix

**You say:**
```
Format this code with 3-stage architecture

[paste code with missing imports]
```

**Renata generates code** (but has a syntax error)

**You say:**
```
That's wrong, it has a syntax error on line 5
```

**Renata responds:**
```
✅ I've fixed the code

Issue: Syntax error preventing code execution
Fix: I've corrected the syntax error and added missing imports

What I changed:
• Added line 5: import pandas_market_calendars as mcal
• Added missing imports

Confidence: This fix addresses your feedback. Let me know if you need further adjustments.
```

### Example 2: Logic Error Fix

**You say:**
```
Build a scanner that finds stocks with volume > 2x average
```

**Renata generates code** (but uses wrong calculation)

**You say:**
```
That's incorrect, the volume calculation is wrong
```

**Renata responds:**
```
✅ I've fixed the code

Issue: Logic error in the code
Fix: I've corrected the logic

What I changed:
• Modified line 42: df['volume'].mean() → df['volume'].rolling(20).mean()
• Changed calculation to use rolling average

Confidence: This fix addresses your feedback. Let me know if you need further adjustments.
```

### Example 3: Wrong Output Fix

**You say:**
```
Build a scanner for gap-up patterns
```

**Renata generates code** (but produces wrong results)

**You say:**
```
Wrong result, I need gap-up >= 2% not 1%
```

**Renata responds:**
```
✅ I've fixed the code

Issue: Code wasn't producing the expected output
Fix: I've adjusted the code to produce the correct output

What I changed:
• Modified line 78: gap >= 0.01 → gap >= 0.02
• Changed threshold from 1% to 2%

Confidence: This fix addresses your feedback. Let me know if you need further adjustments.
```

## Response Types

When Renata provides a correction, you'll see:

1. **Purple badge** - Indicates this is a self-correction response
2. **Explanation** - What was fixed and why
3. **Applied Changes** - List of specific modifications
4. **Confidence Score** - How confident Renata is in the fix (0.5 - 0.99)
5. **Corrected Code** - The fixed Python code

## Feedback Phrases That Work

### Direct Corrections
- "That's wrong"
- "That is wrong"
- "You made a mistake"
- "That's incorrect"
- "Fix this"
- "Not what I asked for"
- "Try again"
- "Incorrect output"

### Syntax/Execution Errors
- "Syntax error"
- "Doesn't work"
- "Not working"
- "Failed"
- "Error on line X"

### Logic/Output Issues
- "Wrong result"
- "Incorrect result"
- "Not the right output"
- "Output is wrong"
- "Gave me wrong [data/results]"

### General Dissatisfaction
- "No, that's not..."
- "Actually, I wanted..."
- "That's not what I meant"
- "Let me clarify..."
- "I need you to..."
- "Change this..."
- "Modify this..."
- "Update this..."

## Technical Details

### Architecture

```
User Message → Feedback Detection → Conversation History → Error Classification
                                                              ↓
                                              AI Correction Generation
                                                              ↓
                                              Response with Fixed Code
```

### Key Components

1. **renataSelfCorrectionService.ts** - Core self-correction logic
   - Conversation memory management
   - Feedback intent detection
   - Error classification
   - AI-powered correction generation

2. **chat/route.ts** - API integration
   - Intercepts user messages for feedback
   - Routes to self-correction when detected
   - Stores conversation history
   - Returns corrected code

3. **GlobalRenataAgent.tsx** - Frontend component
   - Displays self-correction responses
   - Shows purple badge for corrections
   - Presents corrected code
   - Shows confidence and changes

### Session Management

- **Session ID**: Each conversation uses a session ID to track history
- **Max History**: Keeps last 10 turns for context
- **Automatic Storage**: Code generation is automatically stored
- **Memory Retention**: Previous code is available for correction

## Benefits

1. **Faster Iterations** - No need to explain the issue from scratch
2. **Context Awareness** - Remembers what it generated before
3. **Targeted Fixes** - Only changes what needs fixing
4. **Continuous Improvement** - Learns from each correction
5. **Reduced Friction** - Natural language feedback works

## Limitations

- Only remembers last 10 turns of conversation
- Requires explicit feedback (can't read your mind!)
- Works best with specific error descriptions
- May need manual intervention for complex issues

## Best Practices

1. **Be Specific** - "Error on line 5" is better than "It doesn't work"
2. **Quote the Issue** - "The volume calculation is wrong" helps Renata focus
3. **Provide Context** - "I need X not Y" clarifies expectations
4. **Iterate** - Multiple rounds of feedback can perfect the code
5. **Verify** - Test the corrected code before using in production

## Future Enhancements

Planned improvements:

- [ ] Visual diff showing what changed
- [ ] One-click apply to replace old code
- [ ] Historical correction patterns
- [ ] Learning from common mistakes
- [ ] Multi-session memory
- [ ] Confidence-based auto-apply
- [ ] Integration with error analysis service

## Troubleshooting

**Q: Renata didn't detect my feedback**

A: Try using more explicit phrases like "That's wrong" or "Fix this"

**Q: Renata says it doesn't have previous code**

A: Make sure you're in the same session where code was generated

**Q: The correction didn't fix the issue**

A: Provide more specific feedback about what's still wrong

**Q: Can I undo a correction?**

A: Currently no, but you can provide feedback again to adjust further

## Summary

The self-correction system makes Renata more autonomous and easier to work with. You can now have natural conversations about code corrections without needing to involve Claude or start from scratch each time.

**Key Point**: Just talk to Renata naturally when it makes mistakes. It will understand and fix them!
