# 🚀 EDGE-DEV CUSTOM GPT - FINAL SETUP GUIDE
## 8000 Character Compliant Configuration

**Version**: 2.1 Final
**Status**: ✅ Ready to Use

---

## 🚨 IMPORTANT: 8000 CHARACTER LIMIT

ChatGPT Custom Instructions field has an **8000 character maximum**.

---

## 📁 FILE GUIDE - Which File for Which Purpose

### FOR CHATGPT CONFIGURATION

#### 1. SYSTEM INSTRUCTIONS (Copy This Entire File)
**File**: `2_SYSTEM_PROMPT_CONDENSED.md`

**Full Path**:
```
/Users/michaeldurante/ai dev/ce-hub/CUSTOM_GPT_EDGE_DEV/2_SYSTEM_PROMPT_CONDENSEED.md
```

**Size**: 4803 characters (60% of limit)

**What It Contains**:
- Edge-Dev V31 identity and expertise
- All 7 V31 critical rules with examples
- Mandatory class structure template
- Request handling protocols
- Output format requirements
- Validation checklist
- Parameter templates

#### 2. KNOWLEDGE UPLOAD (Upload This File)
**File**: `1_V31_GOLD_STANDARD_COMPACT.md`

**Full Path**:
```
/Users/michaeldurante/ai dev/ce-hub/CUSTOM_GPT_EDGE_DEV/1_V31_GOLD_STANDARD_COMPACT.md
```

**Purpose**: Reference material for the GPT to consult when generating code.

---

### FOR YOUR REFERENCE (Open While Configuring)

#### 3. RESPONSE EXAMPLES
**File**: `6_RESPONSE_EXAMPLES.md`

**Full Path**:
```
/Users/michaeldurante/ai dev/ce-hub/CUSTOM_GPT_EDGE_DEV/6_RESPONSE_EXAMPLES.md
```

**What It Contains**: 10 detailed examples showing how the GPT should handle different request types (generation, transformation, editing, validation, debugging)

#### 4. SCANNER TEMPLATES
**File**: `3_SCANNER_TEMPLATES.md`

**Full Path**:
```
/Users/michaeldurante/ai dev/ce-hUB/CUSTOM_GPT_EDGE_DEV/3_SCANNER_TEMPLATES.md
```

**What It Contains**: Pre-built templates for common patterns (Gap Up, Momentum, Pullback, Volume Surge)

#### 5. TRANSFORMATION GUIDE
**File**: `4_CODE_TRANSFORMATION_GUIDE.md`

**Full Path**:
```
/Users/michaeldurante/ai dev/ce-hUB/CUSTOM_GPT_EDGE_DEV/4_CODE_TRANSFORMATION_GUIDE.md
```

**What It Contains**: Step-by-step guide for converting various legacy code formats to V31

#### 6. VALIDATION CHECKLIST
**File**: `5_TESTING_VALIDATION_CHECKLIST.md`

**Full Path**:
```
/Users/michaeldurante/ai dev/ce-hUB/CUSTOM_GPT_EDGE_DEV/5_TESTING_VALIDATION_CHECKLIST.md
```

**What It Contains**: Complete validation protocol with test scripts

#### 7. MASTER README
**File**: `README.md`

**Full Path**:
```
/Users/michaeldurante/ai dev/ce-hUB/CUSTOM_GPT_EDGE_DEV/README.md
```

**What It Contains**: This file - complete guide to all documentation

---

## ⚡ QUICK SETUP STEPS

### 1. Open ChatGPT
```
https://chat.openai.com/
```

### 2. Create Your GPT
- Click **"Explore GPTs"**
- Click **"Create"**
- Click **"Configure"**

### 3. Basic Information
**Name**: Edge-Dev V31 Scanner Expert

**Description**:
```
Generate V31-compliant trading scanners from natural language descriptions, transform legacy Python scanner code to V31 standard, edit parameters, validate code compliance with Edge-Dev V31 Gold Standard, and debug scanner issues.
```

### 4. Instructions Field (CRITICAL)
1. Open: `/Users/michaeldurante/ai dev/ce-hub/CUSTOM_GPT_EDGE_DEV/2_SYSTEM_PROMPT_CONDENSE.md`
2. Select All (Cmd+A / Ctrl+A)
3. Copy (Cmd+C / Ctrl+C)
4. Paste into ChatGPT's Instructions field
5. Verify character count is ~4803 characters

### 5. Knowledge Field
**Upload**: `/Users/michaeldurante/ai dev/ce-hub/CUSTOM_GPT_EDGE_DEV/1_V31_GOLD_STANDARD_COMPACT.md`

### 6. Capabilities
- ✅ Code Interpreter: ENABLE
- ❌ Web Browsing: DISABLE (not needed)
- ❌ DALL-E: DISABLE (not needed)

### 7. Create and Publish
- Click "Create" or "Publish"
- Your Custom GPT is now ready to use

---

## 🎯 TEST YOUR GPT

### Test 1: From-Scratch Generation
```
Generate a V31-compliant scanner for stocks that:
- Gap up at least 7%
- Volume at least 2.5x average
- Close in top 30% of range
- Price above $10
```

**Expected Output**: Complete V31-compliant scanner class with:
- All 5 stages implemented
- Parameters in self.params
- Validation checklist
- Usage example

### Test 2: Code Transformation
```
Transform this scanner code to V31 standard:

[Paste your existing scanner code]
```

**Expected Output**: Complete V31-compliant scanner with:
- Transformation summary
- Before/after comparison
- Validation checklist

### Test 3: Parameter Editing
```
In my gap scanner, change:
- gap_percent_min from 0.05 to 0.08
- price_min from 8.0 to 15.0
```

**Expected Output**: Complete updated scanner with highlighted changes.

---

## 📊 CAPABILITY SUMMARY

### What Your GPT Can Do

| Task | How to Ask | Expected Output |
|------|------------|---------------|
| Generate scanner from description | "Generate a scanner for..." | Complete V31 class |
| Transform legacy code | "Transform this to V31: [paste code]" | V31-compliant version |
| Edit parameters | "Change X parameter to Y in my scanner" | Updated complete scanner |
| Validate code | "Check if V31 compliant: [paste code]" | Audit report + fixes |
| Extract parameters | "Extract all parameters from: [paste code]" | Organized self.params |
| Debug issues | "My scanner returns 0 results, help: [paste code]" | Diagnosis + fix |
| Combine patterns | "Create scanner for patterns X, Y, and Z" | Multi-pattern scanner |

---

## 🔍 FILE VERIFICATION

Before using, verify files exist:

```bash
ls -la "/Users/michaeldurante/ai dev/ce-hUB/CUSTOM_GPT_EDGE_DEV/"
```

Should show 7 files in the folder.

**Check condensed prompt size**:
```bash
wc -m "/Users/michaeldurante/ai dev/ce-hUB/CUSTOM_GPT_EDGE_DEV/2_SYSTEM_PROMPT_CONDENSEED.md"
```

Should show approximately 4803 characters.

---

## 📋 WHAT'S IN EACH FILE

| File | Purpose | Use For |
|------|---------|-----|
| `2_SYSTEM_PROMPT_CONDENSED.md` | **SYSTEM PROMPT** | **Paste into ChatGPT Instructions** |
| `1_V31_GOLD_STANDARD_COMPACT.md` | **KNOWLEDGE** | Upload to ChatGPT Knowledge |
| `6_RESPONSE_EXAMPLES.md` | **REFERENCE** | Keep open while configuring for examples |
| `3_SCANNER_TEMPLATES.md` | **REFERENCE** | Keep open while configuring for templates |
| `4_CODE_TRANSFORMATION_GUIDE.md` | **REFERENCE** | Keep open while configuring for transformation guide |
| `5_TESTING_VALIDATION_CHECKLIST.md` | **REFERENCE** | Keep open while configuring for validation |
| `README.md` | **GUIDE** | Master overview (not pasted into GPT) |

---

## ⚠️ COMMON CONFIGURATION MISTAKES TO AVOID

### Mistake 1: Pasting the Old System Prompt
❌ **Don't use**: `2_CUSTOM_GPT_SYSTEM_PROMPT.md` (too long)

✅ **Use**: `2_SYSTEM_PROMPT_CONDENSED.md` (fits in limit)

### Mistake 2: Pasting a Partial Prompt
❌ **Don't**: Summarize or extract key points only

✅ **Do**: Paste the ENTIRE file contents

### Mistake 3: Not Uploading Knowledge
❌ **Don't**: Skip uploading the V31 Gold Standard file

✅ **Do**: Upload `1_V31_GOLD_STANDARD_COMPACT.md` to Knowledge

### Mistake 4: Not Testing Before Using
❌ **Don't**: Start using for production without testing

✅ **Do**: Test with at least 2-3 simple requests first

---

## 🎯 SUCCESS CRITERIA

Your Custom GPT is working correctly if:

- ✅ Generates complete code (never snippets)
- ✅ Includes validation checklist in every response
- ✅ Enforces all 7 V31 rules
- ✅ Handles all task types (generate, transform, edit, validate, extract, debug)
- ✅ Returns V31-compliant code every time

---

## 🔧 TROUBLESHOOTING

### Problem: "Instructions field doesn't save"
**Solution**: Ensure character count is under 8000 characters. The condensed prompt is 4803 characters.

### Problem: "GPT generates non-V31 code"
**Solution**: Verify you used the condensed system prompt, not the old enhanced version. The condensed prompt explicitly enforces V31 compliance.

### Problem: "GPT misses some of my requirements"
**Solution**: Be more specific in your request. List all requirements clearly.

---

## 📈 PERFORMANCE EXPECTATIONS

A properly configured Custom GPT should:
- Generate complete scanners in 10-20 seconds
- Transform legacy code in 15-30 seconds
- Validate code in 5-10 seconds
- Always include validation checklist with responses

---

## 🎓 LEARNING CURVE

### Week 1: Basic Setup and Testing
- Configure Custom GPT with condensed prompt
- Test with simple gap scanner generation
- Validate existing code

### Week 2: Code Transformation
- Transform your existing scanner library
- Learn V31 architecture through practice
- Build scanner library

### Week 3: Advanced Features
- Multi-pattern scanners
- Parameter optimization
- Performance tuning

---

## 🔗 SUPPORT

For issues or questions:
1. Check this README for guidance
2. Review the QUICK_START.md file
3. Reference the specific documentation files
4. Test with the example prompts provided

---

**END OF FINAL SETUP GUIDE**

The condensed system prompt is ready to use! Follow the setup steps above and you'll have a fully functional V31 scanner expert Custom GPT in 5 minutes. 🚀
