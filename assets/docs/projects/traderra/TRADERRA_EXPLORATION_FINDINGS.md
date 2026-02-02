# Traderra Project Structure & AI Model Implementation - Comprehensive Exploration Report

**Date:** October 29, 2025  
**Status:** Thorough Analysis Complete  
**Running Port:** 6565 (Frontend)  
**Backend Port:** 6500 (FastAPI)

---

## Executive Summary

The Traderra project is a sophisticated AI-powered trading journal and performance analysis platform with a **dynamic model selection system** that intelligently routes queries between multiple AI models based on task complexity. The implementation exposes cost/pricing data throughout the frontend and includes references to Llama models that should be abstracted from user-facing text.

---

## Project Structure Overview

```
traderra/
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   │   └── renata_agent.py       ⭐ Core AI orchestrator
│   │   ├── api/
│   │   │   ├── ai_endpoints.py       ⭐ AI API routes
│   │   │   ├── scan_endpoints.py     📊 Scanning operations
│   │   │   ├── folders.py
│   │   │   └── blocks.py
│   │   ├── core/
│   │   │   ├── archon_client.py      🔗 Knowledge graph integration
│   │   │   ├── config.py             ⚙️ Configuration
│   │   │   └── database.py           📦 PostgreSQL integration
│   │   ├── models/
│   │   └── main.py                   🚀 FastAPI entry point
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   │   └── renata/chat/route.ts     ⭐ Renata chat endpoint
│   │   │   ├── journal/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   └── ...
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   │   ├── model-selector.tsx           ⭐ Full model UI
│   │   │   │   ├── simple-model-selector.tsx
│   │   │   │   └── standalone-renata-chat.tsx  ⭐ Chat interface
│   │   │   ├── dashboard/
│   │   │   ├── journal/
│   │   │   └── ...
│   │   ├── config/
│   │   │   └── openrouter-models.ts             ⭐ MODEL DEFINITIONS & PRICING
│   │   ├── utils/
│   │   │   └── smart-model-routing.ts           ⭐ MODEL SELECTION LOGIC
│   │   └── ...
│   └── package.json
│
└── documentation/
    └── [Various markdown files]
```

---

## Key AI Implementation Files

### 1. **Frontend Model Configuration** (`src/config/openrouter-models.ts`)
**Purpose:** Central registry of all available AI models with pricing

**Key Components:**
- **Model Categories:** 5 categories (Premium, High Performance, Best Value, Specialized, Speed Focused)
- **Model Pricing Data:** Input/output prices per 1M tokens
- **Default Model:** `meta-llama/llama-3.2-3b-instruct` (Free Tier)
- **Available Models:** 24+ models from various providers

**Cost Display Functions:**
```typescript
- formatPrice(price: number): string
- calculateCost(inputTokens, outputTokens, model): number
```

**User-Facing Pricing Exposure:**
- Model selector component displays input/output prices
- Price per 1M tokens shown in dropdown
- Model descriptions mention cost tiers

### 2. **Smart Model Routing** (`src/utils/smart-model-routing.ts`)
**Purpose:** Intelligent model selection based on task complexity

**Model Tier Mapping:**
```typescript
MODEL_TIERS = {
  free: "meta-llama/llama-3.2-3b-instruct",      // Llama 3.2 3B
  advanced: "zhipuai/glm-4-9b-chat",             // GLM 4 9B
  premium: "anthropic/claude-3.5-sonnet",        // Claude 3.5 Sonnet
  specialist: "openai/gpt-4-turbo-preview"       // GPT-4 Turbo
}
```

**Selection Logic:**
1. Analyzes user input for complexity (basic/advanced/complex)
2. Identifies task domain (general/trading/technical/analysis)
3. Selects model based on complexity + domain + Renata mode
4. Fallback mechanism ensures model availability

**User-Facing Text Issues:**
- Line 98: "Basic query - using free **Llama 3.2 3B** for cost efficiency"
- Line 104: "Advanced trading/analysis task - using **GLM 4 9B**..."
- Line 114: "Complex trading task - using **Claude 3.5 Sonnet**..."
- Line 140: Comments reference "Free model" for coaching

### 3. **Chat Interface** (`src/components/chat/standalone-renata-chat.tsx`)
**Purpose:** Main conversational interface with Renata AI

**Features:**
- 4 Renata modes: Renata, Analyst, Coach, Mentor
- Smart model selection integration
- Real-time model recommendations
- Default model: Llama 3.2 3B

**Smart Routing Integration:**
```typescript
const smartRouting = selectOptimalModel(messageToSend, currentMode, selectedModel)
const modelToUse = smartRouting.selectedModel
```

### 4. **Model Selector Component** (`src/components/chat/model-selector.tsx`)
**Purpose:** UI dropdown for manual model selection

**Exposed Information:**
- Model pricing (input/output per 1M tokens)
- Provider names
- Model badges and descriptions
- Context length specifications
- Strengths and best-use cases

**Pricing Display:**
```typescript
{formatPrice(currentModel.inputPrice)}/{formatPrice(currentModel.outputPrice)} per 1M tokens
Output: <span className="font-mono text-orange-400">{formatPrice(model.outputPrice)}</span>
```

### 5. **Backend: Renata Agent** (`backend/app/ai/renata_agent.py`)
**Purpose:** Core AI orchestrator using PydanticAI

**Architecture:**
- Uses `pydantic_ai` for agent management
- Integrates with Archon MCP for knowledge base
- Supports 3 personality modes (Analyst, Coach, Mentor)
- Each mode uses dedicated OpenAI model

**Implementation Details:**
```python
self.analyst_agent = Agent(model=f"openai:{settings.openai_model}")
self.coach_agent = Agent(model=f"openai:{settings.openai_model}")
self.mentor_agent = Agent(model=f"openai:{settings.openai_model}")
```

**Note:** Backend currently uses OpenAI models, not the dynamic selection from frontend

### 6. **API Endpoint** (`src/app/api/renata/chat/route.ts`)
**Purpose:** Next.js API route for Renata chat

**Default:** Uses `anthropic/claude-3.5-sonnet` if no model specified
**Functionality:**
- Accepts message, mode, model, and context
- Calls OpenRouter API with selected model
- Supports cost tracking (API responses include usage)

---

## Dynamic Model Selection Flow

### User Input Analysis
```
User Input
    ↓
Keyword Analysis (complexity scoring)
    ↓
Domain Detection (trading/technical/analysis/general)
    ↓
Determine Complexity Level (basic/advanced/complex)
    ↓
Select Model Tier (free/advanced/premium/specialist)
    ↓
Apply Mode Override (Analyst/Coach/Mentor preferences)
    ↓
Validate Model Availability (fallback hierarchy)
    ↓
Return Selected Model + Reasoning
```

### Complexity Determination
- **Basic:** Simple questions, definitions, information requests
- **Advanced:** Analysis, optimization, strategy discussions
- **Complex:** Comprehensive analysis, deep reasoning, systematic modeling

### Domain-Based Upgrades
- **Trading Domain:** Always upgrades complexity (Llama → GLM → Claude)
- **Analysis Domain:** Upgrades for advanced/complex queries
- **Technical Domain:** Reserved for premium models
- **General Domain:** Uses base tier for complexity level

### Renata Mode Model Mapping
- **Analyst Mode:** GLM 4 9B (Advanced reasoning)
- **Coach Mode:** Llama 3.2 3B (Free tier)
- **Mentor Mode:** Claude 3.5 Sonnet (Premium)
- **Default:** Selected by complexity analysis

---

## User-Facing Text References to Remove

### Location 1: `src/utils/smart-model-routing.ts`
**Lines to Update:**
- **Line 98:** "Basic query - using free **Llama 3.2 3B** for cost efficiency"
  - Replace with: "Basic query - using optimal model for cost efficiency"
  
- **Line 104:** "Advanced trading/analysis task - using **GLM 4 9B** for better reasoning"
  - Replace with: "Advanced trading/analysis task - using advanced model for better reasoning"
  
- **Line 107:** "Advanced but general task - **free model** should suffice"
  - Replace with: "Advanced but general task - basic model should suffice"
  
- **Line 114:** "Complex trading task - using **Claude 3.5 Sonnet** for best results"
  - Replace with: "Complex trading task - using premium model for best results"
  
- **Line 117:** "Complex general task - using **GLM 4 9B** for good performance"
  - Replace with: "Complex general task - using advanced model for good performance"

### Location 2: `src/config/openrouter-models.ts`
**Visible Pricing Data:**
- Input/output prices per 1M tokens (lines 32-33, 97, 149-150, etc.)
- Model descriptions include cost references
- Category headers mention "Best Value", "💰"

### Location 3: `src/components/chat/model-selector.tsx`
**Lines with Pricing Display:**
- **Lines 83-84:** Shows current model pricing
- **Line 160-162:** Input price display
- **Lines 167-176:** Output price and context length display
- **Line 83:** `{formatPrice(currentModel.inputPrice)}/{formatPrice(currentModel.outputPrice)}`

### Location 4: `src/components/chat/simple-model-selector.tsx`
**Pricing mentions in model list display**

---

## Cost Calculation Components

### Cost Display Functions
```typescript
// src/config/openrouter-models.ts
formatPrice(price: number): string
calculateCost(inputTokens, outputTokens, model): number
```

### Cost Tracking Points
1. **Model Configuration:** `inputPrice` and `outputPrice` fields
2. **API Responses:** OpenRouter returns token usage
3. **Potential Dashboard:** Could display conversation costs

### Hidden Cost Tracking
- Backend may track costs via OpenRouter API responses
- Usage data in API responses (input_tokens, output_tokens)
- Not currently displayed in UI but available for future use

---

## Key Technical Findings

### 1. **Dual Model Selection System**
- **Frontend:** Dynamic, complexity-based routing through smart-model-routing.ts
- **Backend:** Static configuration in renata_agent.py (uses OpenAI models only)
- **API Endpoint:** Accepts model parameter but defaults to Claude 3.5 Sonnet

### 2. **Model Coverage**
- **Free Tier:** Llama 3.2 3B (0 cost)
- **Advanced Tier:** GLM 4 9B ($0.10 in/out)
- **Premium Tier:** Claude 3.5 Sonnet ($3.00/$15.00)
- **Specialist Tier:** GPT-4 Turbo ($10.00/$30.00)

### 3. **Integration Points**
- OpenRouter API (`https://openrouter.ai/api/v1/chat/completions`)
- Archon MCP for knowledge graph integration
- PostgreSQL + pgvector for persistence
- Redis for caching

### 4. **Configuration**
- Environment variables: `OPENROUTER_API_KEY`, `OPENAI_API_KEY`
- Settings via `settings.openai_model` in backend
- Default model globally configurable

---

## Abstraction Requirements

### 1. **Model Names to Abstract**
Replace specific model names with generic descriptors:
- "Llama 3.2 3B" → "Fast model" or "Basic model"
- "GLM 4 9B" → "Advanced model" or "Reasoning model"
- "Claude 3.5 Sonnet" → "Premium model" or "Sophisticated analysis model"
- "GPT-4 Turbo" → "Expert model" or "Specialist model"

### 2. **Cost References to Hide**
Remove or hide:
- `formatPrice()` function output in user-facing text
- Model pricing tier information
- Per-token cost calculations
- "Free", "Cost", "$X.XX per 1M tokens" mentions

### 3. **Model Selection Reasoning**
Keep internal but hide from users:
- Complexity analysis scores
- Domain detection results
- Model recommendation logic
- Fallback hierarchy details

---

## Integration Architecture

### Frontend → Backend Flow
```
StandaloneRenataChat (UI)
    ↓
selectOptimalModel() [smart-model-routing.ts]
    ↓
/api/renata/chat POST (route.ts)
    ↓
OpenRouter API (external)
    ↓
Response back to UI
```

### Backend Flow
```
Main FastAPI app
    ↓
Renata Agent (renata_agent.py)
    ↓
PydanticAI Agents (3 modes)
    ↓
Archon MCP Client (knowledge integration)
    ↓
OpenAI/OpenRouter API
```

---

## Configuration Files to Review

### Backend Configuration
- `/backend/app/core/config.py` - Settings and environment variables
- `/backend/.env` - API keys and credentials

### Frontend Configuration
- `/frontend/.env.local` - API keys
- `/frontend/src/config/openrouter-models.ts` - Model definitions

---

## Recommendations for User-Facing Changes

### Phase 1: Text Abstraction
1. Update `smart-model-routing.ts` reasoning text
2. Create a `MODEL_NAMES` mapping for abstraction
3. Replace all model names with generic descriptors

### Phase 2: Cost Hiding
1. Create a `shouldShowPricing()` function in config
2. Conditionally render cost information
3. Remove cost from default model selector view

### Phase 3: Model Selection UX
1. Simplify model selector to hide pricing by default
2. Show "Performance Level" instead of model name
3. Display selection reasoning without specific model names

### Phase 4: Backend Alignment
1. Ensure backend uses same model selection logic as frontend
2. Update renata_agent.py to use OpenRouter models
3. Sync model tier mapping across layers

---

## Critical Code Sections for Modification

### High Priority
- `src/utils/smart-model-routing.ts` (reasoning text)
- `src/config/openrouter-models.ts` (cost hiding)
- `src/components/chat/model-selector.tsx` (UI abstraction)

### Medium Priority
- `src/components/chat/standalone-renata-chat.tsx` (console logs)
- `src/app/api/renata/chat/route.ts` (model naming)
- `backend/app/ai/renata_agent.py` (model selection alignment)

### Low Priority
- `src/components/chat/simple-model-selector.tsx`
- Documentation files with model references

---

## Environment & Ports

- **Frontend:** Running on port 6565
- **Backend:** Running on port 6500 (FastAPI)
- **Development:** Both configured for local development
- **Archon MCP:** localhost:8051 (for knowledge integration)
- **PostgreSQL:** Local database
- **Redis:** Local instance on default port

---

## Next Steps

1. **Audit all user-facing components** for model name references
2. **Create abstraction layer** for model naming
3. **Implement cost hiding** in configuration UI
4. **Test model selection logic** with different input types
5. **Align backend implementation** with frontend strategy
6. **Update documentation** to reflect changes

