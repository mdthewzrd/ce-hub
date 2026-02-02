# RENATA AI MASTER GAMEPLAN
## Edge.dev Standardization & Code Transformation Platform

**Created:** 2025-12-26
**Status:** Phase 1 - Foundation Building
**Objective:** Build AI-powered system that can format, standardize, optimize, and create trading scanner code

---

## 🎯 FOUR CORE CAPABILITIES (End Goals)

### CAPABILITY 1: Single Scanner Formatting ✅ CURRENT FOCUS
**Goal:** Transform any single scanner code (Backside B type) into Edge.dev 2-stage standardization

**Requirements:**
- Accept uploaded Python file with trading strategy
- Extract ALL parameters with exact values
- Transform into 2-stage architecture:
  - Stage 1: Market Universe Optimization (Polygon API + 4-parameter smart filtering)
  - Stage 2: Pattern Detection (original strategy logic)
- Apply Edge.dev threading standards: Stage1: min(128, cpu_cores * 8), Stage2: min(96, cpu_cores * 6)
- Use session pooling: HTTPAdapter(pool_connections=100, pool_maxsize=100)
- Type-specific class naming (BacksideBScanner, D1GapScanner, etc.)
- Check ALL signals in D0 range (2025-01-01 to 2025-11-01), not just latest

**Current Progress:**
- ✅ Backend AI endpoint running (qwen/qwen3-coder model)
- ✅ Frontend Renata chat interface on /scan page
- ✅ File upload functionality
- ⚠️ **Issue:** Prompt needs technical specs + reference examples (hybrid approach)

**Example Transformation:**
- Source: `backside para b copy.py` (475 lines) → Target: `Backside_B_Para_scanner (2).py` (765 lines)
- Key changes:
  - `EnhancedBacksideParaBScanner` → `UltraFastRenataBacksideBScanner`
  - Basic threading → Ultra-optimized (stage1_workers, stage2_workers)
  - Batch 500 → Batch 200
  - Generic methods → Explicit 3-stage methods (`execute_stage1_ultra_fast`, `execute_stage2_ultra_fast`, `execute_stage3_results_ultra_fast`)

**Next Steps:**
1. ✅ Read and analyze source + formatted files (DONE)
2. 🔲 Create hybrid prompt: technical specs + reference code examples
3. 🔲 Test formatting with user's source file
4. 🔲 Validate output matches Edge.dev standards
5. 🔲 Build library of 3-5 working examples as templates

---

### CAPABILITY 2: Multi-Scanner Formatting 📋 PLANNED
**Goal:** Handle code with multiple scanner types in one file

**Requirements:**
- Detect multiple scanner classes or functions
- Split into individual scanners
- Apply 2-stage transformation to each
- Reassemble into unified multi-scanner architecture
- Handle parameter sharing between scanners

**Example Scenarios (to be provided):**
- LC D2 + D1 Gap scanner combined
- Backside B + A+ scanner in same file
- Multi-timeframe scanners (daily + weekly)

**Dependencies:**
- Capability 1 must be solid first
- Need example files from user

---

### CAPABILITY 3: Parameter Optimization & Chat Interaction 💬 PLANNED
**Goal:** Work with user to modify parameters, optimize scans, analyze results

**Requirements:**
- Parse existing formatted code
- Extract parameters with current values
- Accept user input to change parameters
- Explain parameter impact (e.g., "adv20_min_usd: 30M means minimum $30M daily trading volume")
- Suggest optimizations based on results
- Interactive chat: "What if I lower price_min to $5?"

**Features:**
- Parameter editor UI
- Impact analysis: "Changing this will affect universe size by ~15%"
- History tracking: "You changed this from 8.0 to 5.0 on 2025-12-20"
- Backtest comparison: show results before/after parameter change

**Data Sources:**
- Import formatted code from Capability 1
- Learn from user interactions
- Store optimization patterns

---

### CAPABILITY 4: Build from Scratch 🚀 PLANNED
**Goal:** Take idea from A-Z, building complete scanner from scratch or finishing partial code

**Requirements:**
- Accept natural language description: "I want to scan for stocks with gap up and volume surge"
- Generate complete 2-stage scanner
- OR accept partial code and complete it
- Explain what was built and why
- Iterate with user: "Add a filter for market cap > $1B"

**Workflow:**
```
User: "I want a scanner that finds stocks gapping up on high volume with RSI oversold"

Renata:
1. Clarifies: "What gap size? What's high volume? RSI period?"
2. Generates: Complete 2-stage scanner with extracted parameters
3. Explains: "Built D1GapScanner with gap_min=3%, volume_mult=2.0, rsi_period=14, rsi_oversold=30"
4. Iterates: User says "Make it gap up 5%" → updates parameter
5. Validates: Shows backtest results or explains limitations
```

**Learning Process:**
- Import knowledge from Capability 1 & 2 examples
- Learn from user feedback loops
- Store successful patterns as templates
- Build library of common scanner types

---

## 🏗️ CURRENT FOCUS: CAPABILITY 1 - HYBRID PROMPT APPROACH

### Problem Statement
Current prompt is too minimal (32 lines) - lacks technical implementation details.
Old prompt was too conversational (416 lines) - triggered AI thought process.

### Solution: Hybrid Approach (B + C)
**Part B:** Detailed technical specifications (no conversational language)
**Part C:** Reference code examples showing exact transformation patterns

### New Prompt Structure

```
==== SECTION 1: TECHNICAL SPECIFICATIONS ====
[Architectural requirements, threading patterns, API endpoints, date ranges, etc.]

==== SECTION 2: TRANSFORMATION RULES ====
[Class naming, parameter extraction, method structure, etc.]

==== SECTION 3: REFERENCE EXAMPLES ====
[Source code → Transformed code pairs showing actual transformations]

==== SECTION 4: OUTPUT REQUIREMENTS ====
[Python code only, no markdown, specific structure, etc.]
```

### Reference Examples to Include

**Example 1: Backside B Transformation**
- Source: `backside para b copy.py` (475 lines)
- Target: `Backside_B_Para_scanner (2).py` (765 lines)
- Show: threading changes, method structure, parameter preservation

**Example 2: D1 Gap Scanner** (to be created)
- Source: User-provided D1 gap code
- Target: Formatted D1GapScanner

**Example 3: A+ Para Scanner** (to be created)
- Source: User-provided A+ code
- Target: Formatted APlusScanner

---

## 📋 WORKFLOW: BUILDING CAPABILITY 1

### Phase 1: Foundation (Current)
- ✅ Backend AI running with OpenRouter/qwen3-coder
- ✅ Frontend Renata chat on /scan page
- ✅ File upload + code detection
- ⏳ **Current Task:** Create hybrid prompt with reference examples

### Phase 2: Template Library Building
**Process:**
1. User provides source code file
2. We work together in Claude Code to format it
3. Validate against Edge.dev standards
4. Save as reference example
5. Add to prompt template library

**Target: 3-5 solid examples**
1. ✅ Backside B (have source + target)
2. ⏳ D1 Gap Scanner (need source from user)
3. ⏳ A+ Para Scanner (need source from user)
4. ⏳ LC D2 Scanner (need source from user)
5. ⏳ Small Cap Gap (need source from user)

### Phase 3: AI Training with Templates
- Update `aiFormattingPrompts.ts` with hybrid prompt
- Include reference examples in prompt
- Test with new code (not in templates)
- Validate AI generalizes, doesn't copy

### Phase 4: Production Readiness
- Error handling: "Can't detect scanner type"
- Fallback: "Using legacy formatting"
- User feedback: "Did this work correctly?"
- Continuous improvement: Learn from failures

---

## 🔧 TECHNICAL IMPLEMENTATION PLAN

### Files to Modify

**1. `/src/services/aiFormattingPrompts.ts`**
- Add technical specifications section
- Add reference examples (source → target pairs)
- Keep prompt conversational-free
- Target: 200-300 lines (technical + examples, no fluff)

**2. `/backend/main.py` - `/api/ai/chat` endpoint**
- Ensure system prompt matches frontend
- Add reference examples to system prompt
- Keep max_tokens at 32000
- Monitor response quality

**3. `/src/services/enhancedFormattingService.ts`**
- Validate response has required methods
- Check for type-specific class names
- Verify threading configuration
- Test parameter preservation

### Validation Checklist
For each formatted code, verify:
- [ ] Class name is type-specific (BacksideBScanner, not UniversalTradingScanner)
- [ ] Has execute_stage1_ultra_fast (or equivalent)
- [ ] Has execute_stage2_ultra_fast (or equivalent)
- [ ] Stage 1 workers = min(128, cpu_cores * 8)
- [ ] Stage 2 workers = min(96, cpu_cores * 6)
- [ ] Batch size = 200
- [ ] Session pooling with HTTPAdapter
- [ ] Polygon API snapshot endpoint used
- [ ] D0 date range: 2025-01-01 to 2025-11-01
- [ ] All original parameters preserved with exact values
- [ ] No hardcoded ticker generation
- [ ] DataFrame filtering for signals (not just iloc[-1])

---

## 📊 SUCCESS METRICS

### Capability 1 Success Criteria
- [ ] Can format Backside B code → 100% match to standards
- [ ] Can format D1 Gap code → 100% match to standards
- [ ] Can format A+ code → 100% match to standards
- [ ] Response time < 60 seconds
- [ ] No AI thought process in response
- [ ] Parameters preserved with 100% accuracy
- [ ] User satisfaction: "This worked perfectly"

### Overall Platform Success
- [ ] Capability 1: 95%+ success rate on single scanners
- [ ] Capability 2: 90%+ success rate on multi-scanners
- [ ] Capability 3: Users can iterate 5+ times successfully
- [ ] Capability 4: Can build working scanner from description

---

## 🗂️ TEMPLATE LIBRARY STRUCTURE

```
/templates
  /backside_b
    source.py          # Original user code
    formatted.py       # Edge.dev standardized version
    transformation.md  # What changed and why
    params.json        # Extracted parameters
  /d1_gap
    source.py
    formatted.py
    transformation.md
    params.json
  /aplus
    ...
```

---

## 📝 NEXT SESSION TASKS

1. **Immediate:**
   - Create hybrid prompt with technical specs + Backside B example
   - Update aiFormattingPrompts.ts
   - Test with user's file

2. **This Week:**
   - Build 2-3 more template examples (user provides source code)
   - Validate each transformation
   - Refine prompt based on learnings

3. **Next Week:**
   - Test with new code (not in templates)
   - Measure success rate
   - Iterate on prompt

---

## 🎓 LEARNING & IMPROVEMENT

### How Renata Gets Smarter
1. **Template Library:** Learn from correct transformations
2. **User Feedback:** "This parameter change broke it" → Learn constraint
3. **Failure Analysis:** "Couldn't detect scanner type" → Improve detection
4. **Success Patterns:** "D1 Gap always needs gap_div_atr_min" → Add to rules

### Long-term Vision
- Renata becomes expert in Edge.dev standardization
- Can handle any scanner type
- Suggests optimizations proactively
- Learns market patterns from successful scans
- Builds custom scanners from natural language

---

**Last Updated:** 2025-12-26
**Owner:** michael durante + claude (ai pair programming team)
**Status:** Active Development - Capability 1 in Progress
