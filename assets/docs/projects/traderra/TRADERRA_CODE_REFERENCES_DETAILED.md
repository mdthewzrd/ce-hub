# Traderra: Detailed Code References & Implementation Details

**Date:** October 29, 2025  
**Focus:** Specific code locations, line numbers, and implementation details

---

## 1. Model Selection Logic - Smart Model Routing

### File: `traderra/frontend/src/utils/smart-model-routing.ts`

#### Model Tier Definition (Lines 15-20)
```typescript
export const MODEL_TIERS = {
  free: "meta-llama/llama-3.2-3b-instruct",      // Free tier for basic tasks
  advanced: "zhipuai/glm-4-9b-chat",             // Advanced tier for complex analysis
  premium: "anthropic/claude-3.5-sonnet",        // Premium tier for critical tasks
  specialist: "openai/gpt-4-turbo-preview"       // Specialist tier for highest complexity
} as const
```

**Issue:** Model names hardcoded and used in user-facing reasoning text

#### User-Facing Reasoning Text (Lines 96-120)
```typescript
switch (complexity) {
  case 'basic':
    modelRecommendation = MODEL_TIERS.free
    reasoning = "Basic query - using free Llama 3.2 3B for cost efficiency"  // LINE 98 ⚠️
    break

  case 'advanced':
    if (domain === 'trading' || domain === 'analysis') {
      modelRecommendation = MODEL_TIERS.advanced
      reasoning = "Advanced trading/analysis task - using GLM 4 9B for better reasoning"  // LINE 104 ⚠️
    } else {
      modelRecommendation = MODEL_TIERS.free
      reasoning = "Advanced but general task - free model should suffice"  // LINE 107 ⚠️
    }
    break

  case 'complex':
    if (domain === 'trading' || domain === 'analysis' || domain === 'technical') {
      modelRecommendation = MODEL_TIERS.premium
      reasoning = "Complex trading task - using Claude 3.5 Sonnet for best results"  // LINE 114 ⚠️
    } else {
      modelRecommendation = MODEL_TIERS.advanced
      reasoning = "Complex general task - using GLM 4 9B for good performance"  // LINE 117 ⚠️
    }
    break
}
```

**Impact:** These reasoning strings are returned and potentially displayed in console or UI

#### Renata Mode Mapping (Lines 135-145)
```typescript
export function getModelForRenataMode(mode: string): string {
  switch (mode) {
    case 'analyst':
      return MODEL_TIERS.advanced // GLM 4 9B for analytical tasks
    case 'coach':
      return MODEL_TIERS.free     // Free model for coaching conversations
    case 'mentor':
      return MODEL_TIERS.premium  // Claude for thoughtful mentoring
    default:
      return MODEL_TIERS.free     // Default to free model
  }
}
```

**Issue:** Comments reference specific model names

#### Smart Selection Function (Lines 178-228)
```typescript
export function selectOptimalModel(
  userInput: string,
  mode: string = 'renata',
  userSelectedModel?: string
): {
  selectedModel: string
  analysis: TaskAnalysis
  isUserOverride: boolean
} {
  // Returns analysis with .reasoning field that contains model names
}
```

**Usage:** Called in `standalone-renata-chat.tsx` line 75 and logged to console

---

## 2. Model Configuration & Pricing

### File: `traderra/frontend/src/config/openrouter-models.ts`

#### Default Model (Line 301)
```typescript
export const defaultModel = "meta-llama/llama-3.2-3b-instruct"
```

**Issue:** Hardcoded free model as default

#### Cost Display Functions (Lines 329-346)
```typescript
export function formatPrice(price: number): string {
  if (price < 1) {
    return `$${price.toFixed(2)}`
  }
  return `$${price.toFixed(0)}`
}

export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: ModelConfig
): number {
  const inputCost = (inputTokens / 1000000) * model.inputPrice
  const outputCost = (outputTokens / 1000000) * model.outputPrice
  return inputCost + outputCost
}
```

**Issue:** Functions used to display cost information in model selector

#### Model Pricing Data Structure (Lines 4-15)
```typescript
export interface ModelConfig {
  id: string
  name: string
  provider: string
  inputPrice: number  // Per 1M tokens ⚠️
  outputPrice: number // Per 1M tokens ⚠️
  contextLength: number
  description: string
  strengths: string[]
  bestFor: string[]
  badge?: string
}
```

**Issue:** Every model has explicit pricing data

#### Specific Model Examples with Pricing

**Premium Models (Lines 28-74):**
- GPT-4 Turbo: $10.00/$30.00
- GPT-4: $30.00/$60.00
- Claude 3 Opus: $15.00/$75.00
- Gemini Pro 1.5: $3.50/$10.50

**High Performance (Lines 82-127):**
- Claude 3 Sonnet: $3.00/$15.00 (Line 82-92)
- GPT-3.5 Turbo: $0.50/$1.50 (Lines 94-103)
- Claude 3 Haiku: $0.25/$1.25 (Lines 105-115)
- Gemini Pro: $0.50/$1.50 (Lines 117-127)

**Best Value (Lines 134-203):**
- **Llama 3.2 3B: $0.00/$0.00** (Lines 134-144) ⚠️
- GLM 4 9B: $0.10/$0.10 (Lines 146-156) ⚠️
- Llama 3 70B: $0.70/$0.90 (Lines 158-168)
- Llama 3 8B: $0.18/$0.18 (Lines 170-180)
- Mixtral 8x7B: $0.54/$0.54 (Lines 182-191)
- WizardLM 2: $1.00/$1.00 (Lines 193-202)

---

## 3. Model Selector Component - UI Display

### File: `traderra/frontend/src/components/chat/model-selector.tsx`

#### Current Model Display (Lines 73-92)
```typescript
<button
  onClick={handleToggleDropdown}
  className="flex items-center justify-between w-full p-3 bg-[#1a1a1a] border-2 border-gray-600 rounded-lg hover:border-primary/50 transition-colors group cursor-pointer"
>
  <div className="flex items-center space-x-3">
    <Settings className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors" />
    <div className="text-left">
      <div className="text-sm font-medium studio-text">{currentModel.name}</div>
      <div className="text-xs studio-muted">
        {formatPrice(currentModel.inputPrice)}/{formatPrice(currentModel.outputPrice)} per 1M tokens
        {isOpen && <span className="ml-2 text-green-400">[OPEN]</span>}
      </div>  // ⚠️ PRICING DISPLAYED
    </div>
  </div>
  <ChevronDown className={cn(...)} />
</button>
```

**Issue:** Displays current model pricing prominently

#### Model List Pricing Display (Lines 158-176)
```typescript
<div className="flex items-start justify-between mb-2">
  <div className="flex-1">
    <div className="flex items-center space-x-2 mb-1">
      <span className="font-medium studio-text">{model.name}</span>
      {model.badge && (
        <span className={cn(...)}>
          {model.badge}
        </span>
      )}
    </div>
    <div className="text-xs text-gray-400 mb-1">{model.provider}</div>
    <div className="text-xs studio-muted">{model.description}</div>
  </div>
  <div className="text-right ml-3">
    <div className="text-sm font-mono text-green-400">
      {formatPrice(model.inputPrice)}  // ⚠️ INPUT PRICE
    </div>
    <div className="text-xs studio-muted">input</div>
  </div>
</div>

{/* Pricing */}
<div className="flex items-center justify-between text-xs mb-2">
  <div className="flex space-x-4">
    <span className="studio-muted">
      Output: <span className="font-mono text-orange-400">{formatPrice(model.outputPrice)}</span>  // ⚠️ OUTPUT PRICE
    </span>
    <span className="studio-muted">
      Context: <span className="font-mono">{(model.contextLength / 1000).toFixed(0)}K</span>
    </span>
  </div>
</div>
```

**Issue:** Detailed pricing breakdown visible in dropdown

#### Category Headers (Lines 105-119)
```typescript
{modelCategories.map((category, index) => (
  <button
    key={index}
    onClick={() => setActiveCategory(index)}
    className={cn(...)}
  >
    {getCategoryIcon(category.name)}
    <span className="truncate">{category.name.replace(/[🏆💎💰🔬⚡]/g, '').trim()}</span>
  </button>
))}
```

**Issue:** Category names include emoji indicators like "💰 Best Value"

#### Footer with Pricing Reference (Lines 201-214)
```typescript
<div className="border-t border-gray-600 p-3 bg-[#111111]">
  <div className="text-xs studio-muted text-center">
    Prices are per 1M tokens • Updated pricing may vary •  // ⚠️
    <a
      href="https://openrouter.ai/docs#models"
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline ml-1"
    >
      View latest pricing
    </a>
  </div>
</div>
```

**Issue:** Explicit mention of pricing with external link

---

## 4. Chat Interface Integration

### File: `traderra/frontend/src/components/chat/standalone-renata-chat.tsx`

#### Smart Routing Integration (Lines 73-84)
```typescript
const sendMessage = async () => {
  // ...
  try {
    // Use smart routing to select optimal model
    const smartRouting = selectOptimalModel(messageToSend, currentMode, selectedModel)
    const modelToUse = smartRouting.selectedModel

    console.log('Smart routing analysis:', {
      complexity: smartRouting.analysis.complexity,
      domain: smartRouting.analysis.domain,
      selectedModel: modelToUse,
      reasoning: smartRouting.analysis.reasoning,  // ⚠️ LOGGED WITH MODEL NAMES
      isUserOverride: smartRouting.isUserOverride
    })
```

**Issue:** Console logs the reasoning text containing model names

#### Default Model (Line 53)
```typescript
const [selectedModel, setSelectedModel] = useState(defaultModel)
```

**Issue:** Uses defaultModel which is Llama 3.2 3B

#### Renata Modes Definition (Lines 12-41)
```typescript
const RENATA_MODES = [
  {
    id: 'renata' as RenataMode,
    name: 'Renata',
    description: 'AI orchestrator & general assistant',
    color: 'text-primary',
    borderColor: 'border-primary/50',
  },
  // ... other modes
]
```

**Note:** Modes don't mention models directly, but model selection happens per mode

---

## 5. API Route Handler

### File: `traderra/frontend/src/app/api/renata/chat/route.ts`

#### Model Parameter (Line 6)
```typescript
export async function POST(req: NextRequest) {
  try {
    const { message, mode = 'renata', model = 'anthropic/claude-3.5-sonnet', context } = await req.json()
```

**Issue:** Default model hardcoded in API

#### Cost Tracking (Not Currently Implemented)
- API receives usage data from OpenRouter response:
  ```typescript
  // response.data.usage contains:
  // - prompt_tokens: number
  // - completion_tokens: number
  // - total_tokens: number
  ```

**Current Status:** Usage data received but not displayed to user

---

## 6. Simple Model Selector

### File: `traderra/frontend/src/components/chat/simple-model-selector.tsx`

#### Model List with Pricing (Implied)
```typescript
// File imports and uses:
import { getAllModels, getModelById, formatPrice, defaultModel } from '@/config/openrouter-models'

// Displays models as:
{model.name} - {model.provider} (${formatPrice(model.inputPrice)}/{formatPrice(model.outputPrice)})
```

**Issue:** Similar pricing display as full model selector

---

## 7. Backend: Renata Agent

### File: `traderra/backend/app/ai/renata_agent.py`

#### Model Configuration (Lines 119-158)
```python
self.analyst_agent = Agent(
    model=f"openai:{settings.openai_model}",
    system_prompt=base_prompt + """...""",
    deps_type=TradingContext,
)

self.coach_agent = Agent(
    model=f"openai:{settings.openai_model}",
    system_prompt=base_prompt + """...""",
    deps_type=TradingContext,
)

self.mentor_agent = Agent(
    model=f"openai:{settings.openai_model}",
    system_prompt=base_prompt + """...""",
    deps_type=TradingContext,
)
```

**Issue:** Backend uses static OpenAI models, not dynamic routing

**Mismatch:** Frontend selects optimal model, but backend ignores it and uses configured OpenAI model

---

## 8. Cost/Price References Across Codebase

### Explicit Cost References

| File | Line(s) | Reference |
|------|---------|-----------|
| openrouter-models.ts | 8-9 | `inputPrice`, `outputPrice` in interface |
| openrouter-models.ts | 32-39, 44-49, etc. | Pricing data in every model definition |
| openrouter-models.ts | 329-346 | `formatPrice()` and `calculateCost()` functions |
| model-selector.tsx | 83, 160, 170 | Direct price display in UI |
| smart-model-routing.ts | 98, 104, 107, 114, 117 | Model names in reasoning text |

### Implicit Cost References

| File | Pattern | Issue |
|------|---------|-------|
| openrouter-models.ts | Category names like "💰 Best Value" | Emoji suggests cost focus |
| model-selector.tsx | Color coding (green=$, orange=$) | Visual cost emphasis |
| All chat components | `defaultModel` usage | Defaults to free tier (Llama) |

---

## 9. Configuration Points

### Environment Variables
- **Frontend:** `OPENROUTER_API_KEY` (`.env.local`)
- **Backend:** `OPENAI_API_KEY` (`.env`)
- **Both:** May use `OPENAI_MODEL` setting

### Hardcoded Defaults
```typescript
// Smart routing defaults
free: "meta-llama/llama-3.2-3b-instruct"
advanced: "zhipuai/glm-4-9b-chat"
premium: "anthropic/claude-3.5-sonnet"
specialist: "openai/gpt-4-turbo-preview"

// Component defaults
defaultModel: "meta-llama/llama-3.2-3b-instruct"
API default: "anthropic/claude-3.5-sonnet"
```

---

## 10. Data Flow & Dependencies

### Import Chain
```
standalone-renata-chat.tsx
    └── imports smart-model-routing.ts
        └── imports openrouter-models.ts

model-selector.tsx
    └── imports openrouter-models.ts
```

### Function Dependencies
```
selectOptimalModel()
    └── analyzeTaskComplexity()
        └── ADVANCED_KEYWORDS, BASIC_KEYWORDS, COMPLEX_KEYWORDS
    └── getModelForRenataMode()
        └── MODEL_TIERS
    └── getFallbackModel()
        └── validateModelId()
```

---

## Key Takeaways

1. **Widespread Model Name Exposure:** Model names appear in reasoning text, console logs, UI labels
2. **Prominent Pricing Display:** Every model selector shows per-token costs
3. **Default Is Free Model:** Llama 3.2 3B used as default for cost reasons
4. **Backend Mismatch:** Frontend intelligence not used by backend
5. **No Cost Hiding Currently:** Cost information not hidden from users
6. **Hardcoded Model Strings:** Model IDs hardcoded in multiple places

---

## Priority Fix Order

1. **Text Abstraction** (smart-model-routing.ts reasoning strings)
2. **Cost Hiding** (model-selector.tsx pricing display)
3. **Configuration Abstraction** (openrouter-models.ts model references)
4. **Backend Alignment** (renata_agent.py model selection)
5. **Console Logging** (standalone-renata-chat.tsx debug logs)

