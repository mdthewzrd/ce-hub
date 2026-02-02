# Traderra Exploration - Quick Reference Guide

**Created:** October 29, 2025  
**Status:** Complete Codebase Analysis

---

## Executive Summary

Traderra is a sophisticated AI-powered trading journal with **dynamic model selection** that routes queries to different AI models (Llama, GLM-4, Claude, GPT-4) based on task complexity. The system currently **exposes cost/pricing data** and **mentions specific model names** in user-facing text.

---

## Three Critical Issues Found

### 1. User-Facing Model Names (HIGH PRIORITY)
**Location:** `smart-model-routing.ts` lines 98, 104, 107, 114, 117

**Problem:** Reasoning text displays specific model names
- "using free Llama 3.2 3B for cost efficiency"
- "using GLM 4 9B for better reasoning"
- "using Claude 3.5 Sonnet for best results"

**Impact:** Users see internal model selection logic and pricing strategy

### 2. Prominent Pricing Display (HIGH PRIORITY)
**Location:** `model-selector.tsx` lines 83-84, 160-162, 167-176

**Problem:** Model selector shows per-token costs
- Input price: `$0.00` to `$30.00`
- Output price: `$0.00` to `$75.00`
- "Prices are per 1M tokens" in footer

**Impact:** Users see detailed cost breakdown for every model

### 3. Cost-Based Model Defaults (MEDIUM PRIORITY)
**Location:** `openrouter-models.ts` line 301, `smart-model-routing.ts` line 16

**Problem:** System defaults to free Llama model for cost reasons

**Impact:** Model selection is cost-driven, not capability-driven (visible in implementation)

---

## File-by-File Impact Assessment

| File | Issue | Priority | Lines |
|------|-------|----------|-------|
| `smart-model-routing.ts` | Model names in reasoning text | HIGH | 98, 104, 107, 114, 117 |
| `model-selector.tsx` | Pricing display in UI | HIGH | 83, 160, 170, 201 |
| `openrouter-models.ts` | Cost data in all models | MEDIUM | 8-9, 32-203 |
| `standalone-renata-chat.tsx` | Console logs model names | LOW | 75-84 |
| `simple-model-selector.tsx` | Pricing in dropdown | LOW | formatPrice() calls |
| `renata/chat/route.ts` | Hard-coded model default | MEDIUM | 6 |
| `renata_agent.py` | Static model config | MEDIUM | 119-158 |

---

## The Model Tiers System

```
TIER 0: Free         → Llama 3.2 3B ($0.00/$0.00)
TIER 1: Advanced     → GLM 4 9B ($0.10/$0.10)
TIER 2: Premium      → Claude 3.5 Sonnet ($3.00/$15.00)
TIER 3: Specialist   → GPT-4 Turbo ($10.00/$30.00)
```

**Selection Logic:**
- **Basic queries** → Free tier (Llama)
- **Advanced trading queries** → Advanced tier (GLM)
- **Complex trading queries** → Premium tier (Claude)
- **Expert/Specialist queries** → Specialist tier (GPT-4)

**Mode Override:**
- Analyst mode → Advanced (GLM)
- Coach mode → Free (Llama)
- Mentor mode → Premium (Claude)

---

## Key Functions to Modify

### 1. Model Selection Reasoning (MUST CHANGE)
```typescript
// BEFORE
reasoning = "Basic query - using free Llama 3.2 3B for cost efficiency"

// AFTER
reasoning = "Basic query - optimized for efficiency"
```

### 2. Model Display (MUST CHANGE)
```typescript
// BEFORE
{formatPrice(currentModel.inputPrice)}/{formatPrice(currentModel.outputPrice)} per 1M tokens

// AFTER
{currentModel.description}
```

### 3. Price Functions (CONSIDER REMOVING)
```typescript
formatPrice() - Used in 8+ locations
calculateCost() - Not currently used in UI
```

---

## Data Flow Diagram

```
User Input (Chat)
    ↓
selectOptimalModel(input, mode)
    ├─ analyzeTaskComplexity(input)
    │   └─ Returns: complexity, domain
    ├─ getModelForRenataMode(mode)
    │   └─ Returns: tier-based model
    └─ Returns: selectedModel + reasoning
    ↓
/api/renata/chat (POST)
    ├─ Model parameter
    └─ Context
    ↓
OpenRouter API
    ├─ Calls with selected model
    └─ Returns: response + usage
    ↓
Response to User
```

---

## Implementation Strategy

### Phase 1: Text Abstraction (1-2 hours)
1. Create `MODEL_DESCRIPTIONS` constant
2. Replace model names with tier descriptions
3. Update reasoning text in smart-model-routing.ts

### Phase 2: Cost Hiding (2-3 hours)
1. Add `shouldShowPricing` configuration flag
2. Conditionally render pricing in model-selector.tsx
3. Remove price from default view

### Phase 3: Backend Alignment (2-3 hours)
1. Update renata_agent.py to accept model parameter
2. Test model selection across all modes
3. Verify cost tracking works

### Phase 4: Testing & Validation (2-3 hours)
1. Test model selection with different inputs
2. Verify reasoning text abstraction
3. Ensure pricing hidden from users

**Total Effort:** 7-11 hours

---

## Testing Checklist

- [ ] Basic query uses fast model (no model name visible)
- [ ] Trading query upgrades to advanced model (no model name visible)
- [ ] Complex trading query uses premium model (no model name visible)
- [ ] Model selector hidden or pricing not shown
- [ ] Console logs don't show model names
- [ ] Backend uses model parameter correctly
- [ ] Cost data not accessible to frontend UI

---

## Absolute File Paths

All paths are absolute from project root:

```
/Users/michaeldurante/ai dev/ce-hub/traderra/
├── frontend/src/utils/smart-model-routing.ts
├── frontend/src/config/openrouter-models.ts
├── frontend/src/components/chat/model-selector.tsx
├── frontend/src/components/chat/standalone-renata-chat.tsx
├── frontend/src/components/chat/simple-model-selector.tsx
├── frontend/src/app/api/renata/chat/route.ts
└── backend/app/ai/renata_agent.py
```

---

## Environment Details

- **Frontend Port:** 6565
- **Backend Port:** 6500
- **API:** OpenRouter (openrouter.ai/api/v1)
- **Models:** 24+ from 10+ providers
- **Default:** Llama 3.2 3B (free)
- **Storage:** PostgreSQL + pgvector

---

## Key Insights

1. **Dynamic Selection is Sophisticated:** Uses complexity analysis + domain detection + mode preference
2. **Cost-Driven Design:** Defaults to free model; upgrades based on task complexity
3. **Two-Layer System:** Frontend has smart routing; backend doesn't use it
4. **No User Opt-Out:** Model selection is automatic based on input analysis
5. **Cost Opacity Goal:** System should hide model selection and cost details from users

---

## Next Actions

1. **Read Full Reports:** 
   - TRADERRA_EXPLORATION_FINDINGS.md (comprehensive)
   - TRADERRA_CODE_REFERENCES_DETAILED.md (specific lines)

2. **Implementation Planning:**
   - Decide on abstraction approach (tier names, descriptions)
   - Plan cost hiding UI/UX
   - Schedule backend updates

3. **Testing Protocol:**
   - Create test cases for model selection
   - Verify user-facing text abstraction
   - Validate pricing is hidden

---

## Contact Points for Questions

- **Smart Routing:** `src/utils/smart-model-routing.ts` (243 lines)
- **Model Config:** `src/config/openrouter-models.ts` (346 lines)
- **UI Display:** `src/components/chat/model-selector.tsx` (218 lines)
- **Chat Interface:** `src/components/chat/standalone-renata-chat.tsx` (170+ lines)
- **API Endpoint:** `src/app/api/renata/chat/route.ts` (100+ lines)
- **Backend AI:** `backend/app/ai/renata_agent.py` (424 lines)

