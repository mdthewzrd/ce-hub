# 🚀 PydanticAI Integration Guide for Edge.dev

This guide explains how to set up and use the enhanced PydanticAI service integration with EdgeDev's trading platform.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────┐
│          EdgeDev Frontend          │
│         (Next.js + React)          │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   EnhancedScanBuilderChat   │   │
│  │      (CopilotKit +          │   │
│  │     PydanticAI Service)     │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
                  │
                  │ HTTP/WebSocket
                  ▼
┌─────────────────────────────────────┐
│      PydanticAI Service             │
│       (FastAPI + PydanticAI)       │
│                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│  │Trade│ │Scan │ │Back │ │Param│   │
│  │Agent│ │ Gen │ │test │ │Optim│   │
│  └─────┘ └─────┘ └─────┘ └─────┘   │
└─────────────────────────────────────┘
                  │
                  │ API Calls
                  ▼
┌─────────────────────────────────────┐
│        OpenAI / Anthropic           │
│         (LLM Providers)             │
└─────────────────────────────────────┘
```

## 🚀 Quick Setup

### 1. PydanticAI Service Setup

```bash
# Navigate to the PydanticAI service directory
cd /Users/michaeldurante/ai\ dev/ce-hub/edge-dev/pydantic-ai-service

# Set up environment variables
cp .env.example .env

# Edit .env file with your API keys
# OPENAI_API_KEY=your_openai_key_here
# ANTHROPIC_API_KEY=your_anthropic_key_here  (optional)

# Install dependencies and start service
chmod +x start.sh
./start.sh
```

The service will start on `http://localhost:8001` with:
- **API Documentation**: http://localhost:8001/docs
- **Health Check**: http://localhost:8001/health
- **WebSocket**: ws://localhost:8001/ws/agent

### 2. EdgeDev Frontend Integration

The enhanced chat interface is available at:
- **Component**: `src/components/EnhancedScanBuilderChat.tsx`
- **Service**: `src/services/pydanticAiService.ts`

To integrate into your main page:

```tsx
import EnhancedScanBuilderChat from '@/components/EnhancedScanBuilderChat';

// Replace existing ScanBuilderChat with EnhancedScanBuilderChat
<EnhancedScanBuilderChat />
```

## 🎯 Enhanced Capabilities

### 1. **Natural Language Scan Creation**

**Before (Basic CopilotKit):**
```
User: "Make this scan more aggressive"
AI: Modifies existing parameters
```

**After (PydanticAI Enhanced):**
```
User: "Create a scan for stocks gapping up 3% with high volume that recover above yesterday's close"
AI: Generates complete Python scan code from scratch
```

### 2. **Intelligent Backtest Generation**

**Example Usage:**
```typescript
const backtest = await pydanticAIService.createBacktestFromStrategy(
  "Gap Up Recovery Strategy",
  "Trade stocks that gap up 2-5% and recover above previous close within first hour",
  scanParameters,
  {
    timeframe: "1D",
    marketConditions: "bullish",
    riskParameters: { stopLoss: 5, takeProfit: 15 }
  }
);
```

**Generated Output:**
- Entry/exit rules
- Risk management parameters
- Expected performance metrics
- Complete backtest code template

### 3. **AI-Powered Parameter Optimization**

**Features:**
- Analyzes current scan performance
- Suggests optimal parameter ranges
- Provides confidence scores and rationale
- Offers alternative configurations

### 4. **Real-time Pattern Analysis**

**Capabilities:**
- Market sentiment analysis
- Pattern recognition (gaps, breakouts, reversals)
- Trading opportunity identification
- Risk factor assessment

## 🔧 API Endpoints

### Core Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Service health check |
| `/api/agent/status` | GET | Agent status and capabilities |
| `/api/agent/scan/create` | POST | Create scan from description |
| `/api/agent/backtest/generate` | POST | Generate backtest configuration |
| `/api/agent/parameters/optimize` | PUT | Optimize scan parameters |
| `/api/agent/patterns/analyze` | GET | Analyze market patterns |
| `/ws/agent` | WebSocket | Real-time agent communication |

### Example API Usage

```typescript
// Create a scan from natural language
const scanRequest = {
  description: "Find momentum stocks breaking out with volume confirmation",
  market_conditions: "bullish",
  timeframe: "1D",
  volume_threshold: 1000000,
  preferences: {},
  existing_scanners: []
};

const response = await fetch('http://localhost:8001/api/agent/scan/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(scanRequest)
});

const result = await response.json();
console.log('Generated scan:', result.data);
```

## 🎮 Usage Examples

### Example 1: Create Gap Up Scanner

**User Input:**
```
"Create a scan for stocks gapping up 3% with at least 2x normal volume"
```

**AI Response:**
```python
def gap_up_scanner(data, min_gap_pct=3.0, min_volume_ratio=2.0):
    current = data.iloc[-1]
    previous = data.iloc[-2]

    gap_pct = ((current['open'] - previous['close']) / previous['close']) * 100
    volume_ratio = current['volume'] / data['volume'].rolling(20).mean().iloc[-1]

    return (gap_pct >= min_gap_pct and
            volume_ratio >= min_volume_ratio and
            current['close'] > current['open'])  # Green candle
```

### Example 2: Generate Backtest Strategy

**User Input:**
```
"Create a backtest for a mean reversion strategy on oversold small caps"
```

**AI Response:**
- **Entry Rules**: RSI < 30, Price < $50, Volume > 1.5x average
- **Exit Rules**: RSI > 50, Stop loss at 8%, Take profit at 15%
- **Risk Management**: 2% position size, max 10 positions, daily loss limit 5%
- **Expected Performance**: 65% win rate, 1.8 profit factor, 12% annual return

### Example 3: Parameter Optimization

**User Input:**
```
"Optimize my current scan for better risk-adjusted returns"
```

**AI Analysis:**
- Current Sharpe Ratio: 1.2
- Recommended Changes: Tighten volume filter (1.5x → 2.0x), reduce max positions
- Expected Improvement: +15% Sharpe ratio, -20% drawdown
- Confidence: 78%

## 🔍 Monitoring & Debugging

### Health Checks

```bash
# Check service health
curl http://localhost:8001/health

# Check agent status
curl http://localhost:8001/api/agent/status
```

### Logs

Monitor service logs for debugging:
```bash
# In the pydantic-ai-service directory
tail -f logs/trading_agent.log
```

### Frontend Integration Status

The frontend automatically detects PydanticAI service availability:
- **Green indicator**: Enhanced mode active
- **Red indicator**: Fallback to basic CopilotKit mode

## 🛠️ Development Workflow

### 1. Start Development Environment

```bash
# Terminal 1: Start EdgeDev frontend
cd /Users/michaeldurante/ai\ dev/ce-hub/edge-dev
npm run dev

# Terminal 2: Start PydanticAI service
cd pydantic-ai-service
./start.sh
```

### 2. Test Integration

1. Open http://localhost:3000
2. Click on Renata AI chat
3. Verify "Enhanced Mode" indicator is green
4. Test commands:
   - "Create a scan for momentum breakouts"
   - "Analyze current market patterns"
   - "Optimize my scan parameters"

### 3. Add New Capabilities

To add new AI capabilities:

1. **Backend**: Add new endpoint in `app/main.py`
2. **Agent**: Implement logic in appropriate agent file
3. **Frontend**: Add new action in `EnhancedScanBuilderChat.tsx`
4. **Service**: Add method to `pydanticAiService.ts`

## 🚨 Troubleshooting

### Common Issues

**1. Service Won't Start**
```bash
# Check Python environment
python --version  # Should be 3.11+

# Install Poetry if missing
curl -sSL https://install.python-poetry.org | python3 -

# Clear poetry cache
poetry cache clear --all .
poetry install
```

**2. API Key Issues**
```bash
# Verify .env file
cat .env | grep API_KEY

# Test with minimal key
echo "OPENAI_API_KEY=sk-test" > .env
```

**3. Frontend Not Connecting**
```
Check browser console for CORS errors
Verify service is running on port 8001
Ensure EdgeDev is running on port 3000
```

**4. Agent Not Responding**
```
Check /api/agent/status endpoint
Review logs for initialization errors
Verify LLM provider API quotas
```

### Performance Tuning

**For Better Response Times:**
- Use `haiku` model for quick operations
- Enable response caching
- Optimize prompt lengths
- Use WebSocket for real-time features

**For Better Accuracy:**
- Use `sonnet` or `opus` models
- Provide more context in prompts
- Include historical performance data
- Fine-tune confidence thresholds

## 📊 Metrics & Analytics

### Service Metrics

Monitor these key metrics:
- **Agent Response Time**: Target < 3 seconds
- **Success Rate**: Target > 95%
- **API Error Rate**: Target < 1%
- **WebSocket Connections**: Monitor for leaks

### Trading Metrics

Track AI-generated strategy performance:
- **Scan Accuracy**: Backtested vs. actual performance
- **Parameter Optimization ROI**: Before vs. after optimization
- **Pattern Analysis Hit Rate**: Predicted vs. actual patterns
- **User Satisfaction**: Adoption of AI suggestions

## 🔒 Security Considerations

### API Security

1. **API Keys**: Store securely, rotate regularly
2. **Rate Limiting**: Implement per-user limits
3. **Input Validation**: Sanitize all user inputs
4. **CORS**: Configure properly for production

### Data Privacy

1. **No PII Storage**: Don't store personal trading data
2. **Temporary Processing**: Clear sensitive data after processing
3. **Audit Logging**: Track all AI decisions
4. **Compliance**: Follow financial data regulations

## 🚀 Production Deployment

### Environment Setup

```bash
# Production environment variables
export OPENAI_API_KEY=your_production_key
export ANTHROPIC_API_KEY=your_production_key
export DATABASE_URL=postgresql://...
export HOST=0.0.0.0
export PORT=8001
export DEBUG=false
export CORS_ORIGINS=https://yourdomain.com
```

### Docker Deployment

```dockerfile
# Dockerfile for PydanticAI service
FROM python:3.11-slim

WORKDIR /app
COPY pyproject.toml poetry.lock ./
RUN pip install poetry && poetry install --no-dev
COPY . .

EXPOSE 8001
CMD ["poetry", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

### Scaling Considerations

1. **Load Balancing**: Multiple service instances
2. **Caching**: Redis for response caching
3. **Database**: PostgreSQL for production data
4. **Monitoring**: Prometheus + Grafana setup
5. **Error Tracking**: Sentry integration

---

## 📚 Additional Resources

- **PydanticAI Documentation**: https://ai.pydantic.dev/
- **CopilotKit Docs**: https://copilotkit.ai/
- **FastAPI Guide**: https://fastapi.tiangolo.com/
- **Trading AI Best Practices**: Internal wiki

For questions or issues, check the troubleshooting section above or create an issue in the repository.