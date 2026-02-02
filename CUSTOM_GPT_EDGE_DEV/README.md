# 🚀 EDGE-DEV CUSTOM GPT - COMPLETE SETUP GUIDE v2.0
## Generate V31-Compliant Trading Scanners with ChatGPT

**Version**: 2.0 Enhanced
**Last Updated**: 2026-01-18
**Status**: ✅ Validated and Enhanced

---

## 📁 WHAT'S INCLUDED (ENHANCED VERSION)

This folder contains everything you need to create a Custom GPT for generating V31-compliant trading scanners:

| File | Purpose | Status |
|------|---------|--------|
| `1_V31_GOLD_STANDARD_COMPACT.md` | Complete V31 rules reference | ✅ Validated |
| `2_CUSTOM_GPT_SYSTEM_PROMPT_ENHANCED.md` | **NEW** Enhanced system prompt (use this) | ✅ Enhanced |
| `3_SCANNER_TEMPLATES.md` | Pre-built templates (with fixes applied) | ✅ Fixed |
| `4_CODE_TRANSFORMATION_GUIDE.md` | Guide for converting legacy code to V31 | ✅ Complete |
| `5_TESTING_VALIDATION_CHECKLIST.md` | Validation protocol + test scripts | ✅ Complete |
| `6_RESPONSE_EXAMPLES.md` | **NEW** 10 example responses for all request types | ✅ Complete |
| `README.md` | This file - master guide | ✅ Updated |

---

## 🆕 WHAT'S NEW IN v2.0

### Enhanced Capabilities
The Custom GPT now handles:

1. ✅ **From-scratch generation** - Describe patterns, get working code
2. ✅ **Legacy transformation** - Convert ANY Python code to V31 standard
3. ✅ **Code editing** - Modify parameters, add features, fix bugs
4. ✅ **V31 validation** - Check code compliance, identify violations
5. ✅ **Parameter extraction** - Organize hardcoded values into self.params
6. ✅ **Debugging support** - Diagnose and fix scanner issues
7. ✅ **Multi-pattern scanners** - Handle complex multi-detection logic

### Improved Documentation

**New File**: `6_RESPONSE_EXAMPLES.md` - 10 complete examples showing:
- How to handle every type of user request
- Before/after comparisons
- Common debugging scenarios
- Multi-pattern scanner construction

**Enhanced System Prompt**: `2_CUSTOM_GPT_SYSTEM_PROMPT_ENHANCED.md`
- Comprehensive request/response protocols
- Handles all input code formats (scripts, functions, classes, fragments)
- Strict V31 enforcement
- Quality standards maintained

**Fixed Templates**: `3_SCANNER_TEMPLATES.md`
- Fixed hardcoded value issue
- Added documentation for design choices
- More robust error handling

---

## ⚡ QUICK START (5 MINUTES)

### Step 1: Create Your Custom GPT

1. Go to [chat.openai.com](https://chat.openai.com)
2. Click **"Explore GPTs"** → **"Create"** → **"Configure"**
3. **Name**: Edge-Dev V31 Scanner Expert
4. **Description**: Convert, generate, edit, and validate V31-compliant trading scanners. Expert in Python scanner architecture, Polygon.io API, and Edge-Dev V31 Gold Standard.
5. **Instructions**: **Copy contents of `2_CUSTOM_GPT_SYSTEM_PROMPT_ENHANCED.md`**
6. **Knowledge**: Upload `1_V31_GOLD_STANDARD_COMPACT.md`
7. **Capabilities**: Code Interpreter enabled, Web Browsing disabled

### Step 2: Test Your Custom GPT

**Test 1: From-Scratch Generation**
```
Generate a V31-compliant scanner that finds stocks gapping up 8% with volume 2.5x average and close in top 25% of range.
```

**Test 2: Code Transformation**
```
Transform this code to V31 standard:

[Paste your existing scanner code]
```

**Test 3: Code Editing**
```
In my gap scanner, change the minimum gap from 5% to 7% and add a filter for price above $15.
```

**Test 4: Code Validation**
```
Check if this scanner is V31 compliant:

[Paste code to validate]
```

---

## 📖 COMPLETE DOCUMENTATION GUIDE

### For First-Time Setup

1. **Read**: `README.md` (this file) - overview
2. **Create**: Set up your Custom GPT using `2_CUSTOM_GPT_SYSTEM_PROMPT_ENHANCED.md`
3. **Reference**: Keep `1_V31_GOLD_STANDARD_COMPACT.md` handy for understanding V31
4. **Learn Examples**: Review `6_RESPONSE_EXAMPLES.md` to see how the GPT handles different requests

### For Daily Use

| Task | Reference File |
|------|-----------------|
| Understanding V31 rules | `1_V31_GOLD_STANDARD_COMPACT.md` |
| Quick starting point | `3_SCANNER_TEMPLATES.md` |
| Converting old code | `4_CODE_TRANSFORMATION_GUIDE.md` |
| Validating your code | `5_TESTING_VALIDATION_CHECKLIST.md` |
| Example responses | `6_RESPONSE_EXAMPLES.md` |

---

## 🎯 CAPABILITY MATRIX

| What You Want to Do | Use This | Custom GPT Will |
|-------------------|-----------|----------------|
| Generate new scanner from description | System prompt + Templates | Create complete V31 class |
| Convert legacy scanner to V31 | System prompt + Transformation guide | Transform any code to V31 |
| Edit existing scanner parameters | System prompt + Response examples | Modify while preserving V31 |
| Fix broken scanner | System prompt + Debug examples | Diagnose and repair issues |
| Validate V31 compliance | System prompt + Checklist | Audit code against 7 rules |
| Extract parameters | System prompt | Organize into self.params |
| Optimize parameters | System prompt + Response examples | Suggest ranges and trade-offs |

---

## 📋 ENHANCED CAPABILITIES BREAKDOWN

### 1. FROM-SCRATCH GENERATION

**Input**: Natural language description
**Output**: Complete V31-compliant scanner class

**Example prompts**:
- "Generate a scanner for momentum breakouts with EMA alignment and volume confirmation"
- "Create a scanner that finds pullbacks to EMA20 support with volume dry-up"
- "Build a scanner for stocks making new highs after 3-day decline"

### 2. CODE TRANSFORMATION

**Handles All Input Types**:
- Standalone scripts with symbol loops
- Function-based scanners
- Legacy class-based scanners
- Multi-pattern scanners (10+ patterns)
- Code fragments or pseudocode
- Mixed/unknown architecture

**Output**: Complete V31-compliant class with preserved detection logic

**Example prompts**:
- "Convert this standalone script to V31: [paste code]"
- "Transform this function-based scanner to V31 standard: [paste code]"
- "This scanner has 12 patterns - convert to V31: [paste code]"

### 3. CODE EDITING

**Types of Edits**:
- Change parameter values
- Add new filters or features
- Remove or modify conditions
- Combine multiple scanners
- Optimize performance

**Example prompts**:
- "Change gap_percent_min from 0.05 to 0.08 in my scanner"
- "Add a filter for stocks above $20"
- "Add EMA slope confirmation to my momentum scanner"
- "Make my scanner less restrictive - it's too strict"

### 4. CODE VALIDATION

**Checks Against**:
- All 7 V31 critical rules
- Proper class structure
- Correct parameter organization
- Appropriate error handling
- Output format compliance

**Example prompts**:
- "Is this scanner V31 compliant? [paste code]"
- "What V31 violations exist in this code? [paste code]"
- "Audit this scanner against V31 standard: [paste code]"

### 5. PARAMETER WORK

**Services**:
- Extract hardcoded values
- Organize into logical groups
- Suggest optimization ranges
- Document parameter interactions

**Example prompts**:
- "Extract all parameters from this scanner: [paste code]"
- "What parameters should I use for [pattern description]?"
- "Organize these parameters: [paste messy code]"

### 6. DEBUGGING SUPPORT

**Diagnoses**:
- Zero results issues
- Performance problems
- API errors
- Logic errors
- Date range problems

**Example prompts**:
- "My scanner returns 0 results, help: [paste code]"
- "Why is my scanner so slow? [paste code]"
- "I'm getting 'API key invalid' error"

---

## 🔧 COMMON WORKFLOWS

### Workflow 1: Generate → Test → Deploy
```
1. Describe pattern to Custom GPT
2. Get complete V31 scanner
3. Test with small date range
4. Validate with checklist
5. Deploy to production
```

### Workflow 2: Transform → Validate → Deploy
```
1. Paste existing code to Custom GPT
2. Get V31-compliant version
3. Compare with original logic
4. Test and validate
5. Replace old scanner
```

### Workflow 3: Iterate → Optimize → Deploy
```
1. Run scanner with initial parameters
2. Analyze results quality
3. Ask Custom GPT to adjust parameters
4. Re-run and compare
5. Optimize based on backtest
```

---

## 📊 PARAMETER REFERENCE (QUICK GUIDE)

### Mass Parameters (Use Everywhere)
```python
"price_min": 8.0,              # Minimum stock price
"adv20_min_usd": 30_000_000,   # Minimum daily dollar volume
"volume_min": 1_000_000,       # Minimum daily volume (shares)
```

### Gap Parameters
```python
"gap_percent_min": 0.05,       # 5% gap minimum
"gap_percent_max": 0.30,       # 30% gap maximum
"gap_atr_min": 0.75,          # 0.75 ATR gap size
"volume_ratio_min": 1.5,       # 1.5x average volume
```

### Momentum Parameters
```python
"ema_9_slope_5d_min": 10,      # 10% 5-day EMA slope
"ema_9_slope_15d_min": 20,     # 20% 15-day EMA slope
"high_over_ema9_atr_min": 1.5, # High 1.5 ATR above EMA9
"atr_multiple_min": 1.0,        # Range is 1x ATR
```

### Entry Quality Parameters
```python
"close_range_min": 0.7,        # Close in top 30% of range
"open_above_prev_high": True,  # Open above previous high
"body_atr_min": 0.3,           # Body size at least 0.3 ATR
```

---

## 🚨 COMMON ISSUES & SOLUTIONS

### Issue: "Custom GPT generates wrong code"

**Solution**: Ensure you used `2_CUSTOM_GPT_SYSTEM_PROMPT_ENHANCED.md` (not the old version)

### Issue: "Transformation missed my pattern logic"

**Solution**: Be explicit about preserving detection logic:
```
Transform this code to V31 but PRESERVE ALL DETECTION LOGIC exactly:
[paste code]
```

### Issue: "Generated code has errors"

**Solution**: Ask for clarification or regeneration:
```
The generated code has an error on line 45. Please fix it.
```

### Issue: "Scanner returns 0 results"

**Solution**: Use the debugging protocol:
```
My scanner returns 0 results when it should find signals.
Here's my code: [paste code]
Date range: 2024-01-01 to 2024-12-31
```

---

## 📈 PERFORMANCE EXPECTATIONS

### V31 vs Legacy Architecture

| Metric | Legacy | V31 | Improvement |
|--------|--------|-----|-------------|
| API calls | ~19,000 | ~250 | 76x fewer |
| Execution time | 10-20 min | 30-60 sec | 10-20x faster |
| Parallel processing | No | Yes | 10x faster |
| Correctness | Bug-prone | Robust | 100% accurate |

### Typical Scan Times

| Date Range | Expected Time |
|------------|--------------|
| 1 month | 20-30 seconds |
| 3 months | 45-60 seconds |
| 1 year | 90-120 seconds |

---

## 🎓 LEARNING PATH

### Beginner
1. Start with simple gap scanner template
2. Learn V31 7 rules
3. Test with small date ranges
4. Gradually add complexity

### Intermediate
1. Transform your existing scanners
2. Edit parameters to optimize
3. Combine multiple patterns
4. Validate all code against V31

### Advanced
1. Create multi-pattern systems
2. Build scanner composition projects
3. Optimize for specific market conditions
4. Contribute patterns back to template library

---

## 🔗 RELATED RESOURCES

### Edge-Dev Documentation
- V31 Gold Standard (full specification)
- Renata V2 Integration Guide
- Universal Scanner Engine Docs

### External Resources
- [Polygon.io API Documentation](https://polygon.io/docs)
- [Pandas Documentation](https://pandas.pydata.org/docs/)
- [pandas_market_calendars](https://pypi.org/project/pandas-market-calendars/)

---

## 📝 CHANGELOG

### Version 2.0 (2026-01-18) - ENHANCED EDITION
- **NEW**: `2_CUSTOM_GPT_SYSTEM_PROMPT_ENHANCED.md` - Comprehensive prompt for all task types
- **NEW**: `6_RESPONSE_EXAMPLES.md` - 10 detailed example responses
- **FIXED**: Hardcoded value issue in templates
- **ENHANCED**: Coverage for editing, validation, debugging, parameter work
- **UPDATED**: README with complete capability matrix

### Version 1.0 (2026-01-18)
- Initial release with 5 core documents
- Basic generation and transformation support

---

## ❓ FREQUENTLY ASKED QUESTIONS

**Q: Can I use this with other Polygon endpoints?**
A: Yes, but the grouped endpoint (`/v2/aggs/grouped/...`) is most efficient for market-wide scanning.

**Q: Do I need a paid Polygon account?**
A: Yes, you'll need a paid account for production scanning. Free tier is too limited.

**Q: Can I modify the templates?**
A: Absolutely! Templates are starting points - customize for your needs.

**Q: What if the GPT makes mistakes?**
A: Use the validation checklist to identify issues, then ask for fixes.

**Q: Can I share my Custom GPT with my team?**
A: Yes! You can share it publicly or with specific team members.

**Q: Does this work for options scanners too?**
A: The V31 architecture applies to any scanner. You'll need to modify data fetching for options data.

---

## 📧 SUPPORT

For issues or questions:
1. Check this README first
2. Review the validation checklist
3. Consult the response examples
4. Test with the example prompts

---

## 🎉 NEXT STEPS

### After Setup
1. ✅ Create your Custom GPT with enhanced prompt
2. ✅ Test with example prompts
3. ✅ Validate output quality
4. ✅ Build your scanner library

### For Production Use
1. Generate your core scanners
2. Transform existing library to V31
3. Set up validation pipeline
4. Deploy to edge-dev backend

### Advanced Usage
1. Build scanner composition system
2. Create parameter optimization workflows
3. Set up automated testing
4. Contribute learnings back

---

**END OF README v2.0**

*The enhanced Custom GPT documentation is ready for production use. Happy scanning! 🚀*
