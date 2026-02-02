# 🎯 CE-Hub Pydantic AI Service + OpenRouter + CopilotKit Integration

**Date**: 2026-01-05
**Status**: ✅ CONFIGURED AND READY FOR TESTING
**Architecture**: CE-Hub (Pydantic AI) + OpenRouter (LLM) + EdgeDev (CopilotKit UI)

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      CE-HUB ECOSYSTEM                               │
└─────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│  1. CE-HUB PYDANTIC AI SERVICE (Port 8000)                       │
│     - Multi-Agent System (PydanticAI framework)                   │
│     - 4 Specialized Agents                                        │
│     - OpenRouter Integration (Qwen Coder models)                  │
└────────────┬──────────────────────────────────────────────────────┘
             │
             │ HTTP API
             ↓
┌───────────────────────────────────────────────────────────────────┐
│  2. EDGEDEV FRONTEND (Port 5665)                                 │
│     - Next.js Application                                        │
│     - CopilotKit UI Components                                   │
│     - GlobalRenataAgent Chat Interface                            │
│     - API Routes (/api/copilotkit, /api/renata/chat)            │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│  3. OPENROUTER LLM PROVIDER                                       │
│     - Qwen 2.5 Coder 32B Instruct                                 │
│     - API Key: sk-or-v1-f71a...                                  │
│     - Base URL: https://openrouter.ai/api/v1                     │
└───────────────────────────────────────────────────────────────────┘
```

---

## 🤖 CE-Hub Pydantic AI Service

### Location
**Directory**: `/projects/edge-dev-main/pydantic-ai-service/`
**Port**: `8000` (CE-Hub dedicated port)
**Config File**: `.env`

### Configuration

#### Environment Variables (.env)
```bash
# CE-Hub Pydantic AI Service Configuration

# OpenRouter Configuration (Primary - Qwen Coder 3)
OPENROUTER_API_KEY=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
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Model Configuration
AGENT_MODEL=qwen/qwen-2.5-coder-32b-instruct
AGENT_TEMPERATURE=0.7
MAX_TOKENS=4096

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=true

# CORS Origins (EdgeDev + CopilotKit)
CORS_ORIGINS=["http://localhost:3000", "http://localhost:3001", "http://localhost:5665"]

# Database
DATABASE_URL=sqlite:///./trading_agent.db

# EdgeDev Integration
EDGE_DEV_API_URL=http://localhost:5665
EDGE_DEV_SCAN_API=http://localhost:5665/api/systematic/scan
```

### Specialized Agents

#### 1. **TradingAgent** (`trading_agent.py`)
- **Purpose**: Pattern analysis and market intelligence
- **Tools**:
  - `get_market_data()` - Fetch historical data
  - `calculate_technical_indicators()` - Compute RSI, MACD, etc.
  - `identify_patterns()` - Detect chart patterns
  - `assess_market_sentiment()` - Overall market trend analysis

#### 2. **ScanCreatorAgent** (`scan_creator.py`)
- **Purpose**: Generate trading scanners from descriptions
- **Input**: Natural language description
- **Output**: V31-compliant scanner code

#### 3. **BacktestGeneratorAgent** (`backtest_generator.py`)
- **Purpose**: Create backtest configurations
- **Input**: Strategy description and parameters
- **Output**: Backtest setup and execution plan

#### 4. **ParameterOptimizerAgent** (`parameter_optimizer.py`)
- **Purpose**: Optimize scanner parameters
- **Input**: Current parameters and performance metrics
- **Output**: Optimized parameter suggestions

### API Endpoints

#### Health Check
```
GET /health
```

**Response**:
```json
{
  "status": "healthy",
  "service": "edge-dev-trading-agent",
  "version": "0.1.0",
  "agents": {
    "trading_agent": true,
    "scan_creator": true,
    "backtest_generator": true,
    "parameter_optimizer": true
  }
}
```

#### Create Scan
```
POST /api/agent/scan/create
```

**Request**:
```json
{
  "description": "Create a backside_b scanner that finds stocks gapping down 2% with high volume",
  "market_conditions": "bearish",
  "preferences": {
    "risk_tolerance": "medium",
    "holding_period": "1-5 days"
  },
  "existing_scanners": []
}
```

#### Generate Backtest
```
POST /api/agent/backtest/generate
```

#### Optimize Parameters
```
POST /api/agent/parameter/optimize
```

---

## 🎨 EdgeDev Frontend Integration

### CopilotKit Integration

#### Location: `/projects/edge-dev-main/src/app/api/copilotkit/route.ts`

**Current Configuration**:
```typescript
import { CopilotRuntime, OpenAIAdapter, copilotRuntimeNextJSAppRouterEndpoint } from '@copilotkit/runtime';
import OpenAI from 'openai';

// Create OpenAI client configured to use OpenRouter
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || 'your-api-key-here',
  baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
});

// Create the runtime
const runtime = new CopilotRuntime();

const serviceAdapter = new OpenAIAdapter({
  openai,
  model: "qwen/qwen-2.5-72b-instruct:free", // OpenRouter model format
});
```

**Features**:
- ✅ Already configured with OpenRouter
- ✅ Uses Qwen 2.5 72B Instruct (free tier)
- ✅ Integrated with EdgeDev layout
- ✅ Provides UI components for agent interaction

### GlobalRenataAgent Chat UI

#### Location: `/projects/edge-dev-main/src/components/GlobalRenataAgent.tsx`

**Current Status**:
- ✅ Uses local Renata Orchestrator agents (rule-based fallback)
- ⏳ **TODO**: Update to call CE-Hub Pydantic AI service (port 8000)

**Integration Plan**:
1. Replace `callLocalRenata()` with calls to CE-Hub service
2. Replace `callScanAPI()` with CE-Hub scan creator agent
3. Keep CopilotKit UI components
4. Add agent status indicators

---

## 🔗 OpenRouter Configuration

### API Key Location
**File**: `/projects/edge-dev-main/.env.local`
```bash
OPENROUTER_API_KEY=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
```

### Available Models

#### Qwen Coder Models (Code-Specialized)
1. **qwen/qwen-2.5-coder-32b-instruct** ⭐ RECOMMENDED
   - 32B parameters
   - Code-specialized
   - Good for scanner generation and optimization

2. **qwen/qwen-2.5-72b-instruct**
   - 72B parameters
   - General purpose
   - Better for complex reasoning

3. **qwen/qwen-2.5-coder-7b-instruct**
   - 7B parameters
   - Faster responses
   - Good for simple tasks

### Model Selection Logic

```python
def get_model(model_name: str = None):
    """Get the appropriate PydanticAI model based on provider"""
    model = model_name or settings.AGENT_MODEL
    provider = settings.LLM_PROVIDER.lower()

    if provider == "openrouter":
        return OpenAIModel(
            model=model,
            api_key=settings.OPENROUTER_API_KEY,
            base_url=settings.OPENROUTER_BASE_URL
        )
```

---

## 🚀 Starting the Services

### 1. Start CE-Hub Pydantic AI Service (Port 8000)

```bash
cd /Users/michaeldurante/ai\ dev/ce-hub/projects/edge-dev-main/pydantic-ai-service

# Option 1: Using Python directly
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Option 2: Using start script
./start.sh

# Option 3: Using poetry
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Verify it's running**:
```bash
curl http://localhost:8000/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "service": "edge-dev-trading-agent",
  "version": "0.1.0",
  "agents": {
    "trading_agent": true,
    "scan_creator": true,
    "backtest_generator": true,
    "parameter_optimizer": true
  }
}
```

### 2. Start EdgeDev Frontend (Port 5665)

```bash
cd /Users/michaeldurante/ai\ dev/ce-hub/projects/edge-dev-main
npm run dev
```

**Verify it's running**: Open http://localhost:5665

### 3. Test CopilotKit Integration

```bash
curl http://localhost:5665/api/copilotkit/info
```

**Expected Response**:
```json
{
  "agent": "default",
  "version": "1.0.0",
  "capabilities": [
    "analyzeCode",
    "convertToV31",
    "generateScanner",
    "executeScan",
    "optimizeParameters"
  ]
}
```

---

## 📊 Data Flow

### Scanner Generation Flow

```
User Input (GlobalRenataAgent UI)
    ↓
EdgeDev Frontend (/api/renata/chat or direct CE-Hub API call)
    ↓
CE-Hub Pydantic AI Service (Port 8000)
    ↓
ScanCreatorAgent (PydanticAI)
    ↓
OpenRouter API (Qwen Coder 32B)
    ↓
Generated Scanner Code (V31-compliant)
    ↓
EdgeDev Scan API (/api/systematic/scan)
    ↓
Scanner Execution + Results
    ↓
Display in UI
```

### Parameter Optimization Flow

```
User: "Optimize my lc-d2 scanner"
    ↓
EdgeDev Frontend
    ↓
CE-Hub ParameterOptimizerAgent
    ↓
OpenRouter (Qwen Coder)
    ↓
Optimized Parameters + Recommendations
    ↓
Display in Chat UI
```

---

## 🔧 Configuration Files

### 1. CE-Hub Service Config

**File**: `pydantic-ai-service/.env`
**Updated**: 2026-01-05
- ✅ Port changed to 8000
- ✅ OpenRouter API key added
- ✅ Model set to qwen-2.5-coder-32b-instruct
- ✅ CORS origins include EdgeDev (5665)

### 2. CE-Hub Service Core Config

**File**: `pydantic-ai-service/app/core/config.py`
**Updated**: 2026-01-05
- ✅ Added OPENROUTER_API_KEY and OPENROUTER_BASE_URL
- ✅ Added LLM_PROVIDER setting
- ✅ Updated port to 8000
- ✅ Added EDGE_DEV_SCAN_API URL

### 3. Base Agent Implementation

**File**: `pydantic-ai-service/app/agents/base_agent.py`
**Updated**: 2026-01-05
- ✅ Added `get_model()` function for provider selection
- ✅ Updated `__init__` to use `get_model()`
- ✅ Updated `get_model_info()` to return provider info

### 4. EdgeDev CopilotKit Route

**File**: `src/app/api/copilotkit/route.ts`
**Status**: ✅ Already configured with OpenRouter
- ✅ Uses OPENROUTER_API_KEY from environment
- ✅ Model: qwen/qwen-2.5-72b-instruct:free
- ✅ Base URL: https://openrouter.ai/api/v1

### 5. EdgeDev Environment

**File**: `.env.local`
**Status**: ✅ Already has OpenRouter API key
- ✅ OPENROUTER_API_KEY configured

---

## ✅ Testing Checklist

### CE-Hub Service Testing
- [ ] Start pydantic-ai-service on port 8000
- [ ] Check health endpoint returns all agents ready
- [ ] Verify OpenRouter connection working
- [ ] Test scan creation endpoint
- [ ] Test parameter optimization endpoint
- [ ] Check logs show "Using OpenRouter with model: qwen..."

### EdgeDev Integration Testing
- [ ] Start EdgeDev on port 5665
- [ ] Verify CopilotKit endpoint accessible
- [ ] Test GlobalRenataAgent chat interface
- [ ] Verify chat can call CE-Hub service
- [ ] Test scanner generation from chat
- [ ] Test parameter optimization from chat

### End-to-End Testing
- [ ] User requests scanner generation in chat
- [ ] Request goes to CE-Hub service
- [ ] CE-Hub calls OpenRouter with Qwen
- [ ] Generated scanner returned to EdgeDev
- [ ] Scanner displayed in chat
- [ ] User can execute scanner
- [ ] Results shown with agent attribution

---

## 🎯 Key Benefits

### 1. **Centralized Agent System**
- All agents managed in CE-Hub service
- Easy to add new agents
- Consistent agent interface
- Reusable across projects

### 2. **OpenRouter Flexibility**
- Easy to switch models
- No model lock-in
- Cost optimization (free tier available)
- Latest models always available

### 3. **CopilotKit UI Integration**
- Modern, responsive UI
- Built-in agent state management
- Easy to add new features
- Excellent developer experience

### 4. **Clear Separation of Concerns**
```
CE-Hub (Port 8000)      → Agent Logic + Coordination
EdgeDev (Port 5665)      → UI + User Interaction
OpenRouter (External)    → LLM Intelligence
```

---

## 🔄 Future Enhancements

### Short-term
1. ✅ Configure OpenRouter integration
2. ⏳ Update GlobalRenataAgent to call CE-Hub
3. ⏳ Add agent status monitoring in UI
4. ⏳ Implement streaming responses

### Medium-term
1. Add more specialized agents (backtesting, risk management)
2. Implement agent memory and learning
3. Add multi-agent workflows
4. Create agent marketplace

### Long-term
1. Knowledge graph integration (Archon)
2. Agent training and fine-tuning
3. Cross-project agent sharing
4. Agent analytics and optimization

---

## 📝 Usage Examples

### Example 1: Generate Scanner via CE-Hub

```bash
curl -X POST http://localhost:8000/api/agent/scan/create \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Create a backside_b scanner that finds stocks gapping down 2% with high volume",
    "market_conditions": "bearish",
    "preferences": {
      "risk_tolerance": "medium",
      "holding_period": "1-5 days"
    }
  }'
```

### Example 2: Optimize Parameters via CE-Hub

```bash
curl -X POST http://localhost:8000/api/agent/parameter/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "scan_id": "lc-d2",
    "current_parameters": {
      "gap_threshold": 2.5,
      "min_volume": 1000000
    },
    "performance_metrics": {
      "sharpe_ratio": 1.2,
      "win_rate": 0.45
    },
    "optimization_goals": ["maximize_sharpe", "improve_win_rate"]
  }'
```

### Example 3: Chat via GlobalRenataAgent

```
User: "Create a scanner for stocks gapping up 3% with volume confirmation"

[Behind the scenes]
→ GlobalRenataAgent calls CE-Hub /api/agent/scan/create
→ CE-Hub ScanCreatorAgent processes request
→ OpenRouter Qwen Coder generates scanner code
→ CE-Hub returns formatted scanner
→ GlobalRenataAgent displays results with agent attribution
```

---

## 🎓 Summary

### What Was Configured

1. ✅ **CE-Hub Pydantic AI Service** (Port 8000)
   - Updated to use OpenRouter with Qwen Coder models
   - Configured with 4 specialized agents
   - CORS enabled for EdgeDev frontend

2. ✅ **OpenRouter Integration**
   - API key configured
   - Model selection: qwen-2.5-coder-32b-instruct
   - Provider switching logic implemented

3. ✅ **EdgeDev Frontend**
   - CopilotKit already configured with OpenRouter
   - Ready to integrate with CE-Hub service

### Next Steps

1. **Start CE-Hub service** on port 8000
2. **Update GlobalRenataAgent** to call CE-Hub instead of local agents
3. **Test integration** end-to-end
4. **Add monitoring** and logging
5. **Document usage** patterns and examples

---

**Configuration Completed**: 2026-01-05
**Status**: ✅ Ready for Testing
**Ports**: CE-Hub (8000), EdgeDev (5665), CopilotKit (via EdgeDev)
**Model**: Qwen 2.5 Coder 32B Instruct (via OpenRouter)
