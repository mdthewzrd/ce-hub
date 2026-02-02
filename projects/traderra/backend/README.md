# Traderra Backend - AI-Powered Trading Journal

Professional trading journal and performance analysis platform powered by **Renata**, an adaptive AI agent with Archon knowledge integration.

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│  Frontend: Next.js + AGUI + Co-PilotKit │
├─────────────────────────────────────────┤
│  Backend: FastAPI + PydanticAI          │ ← This Repository
├─────────────────────────────────────────┤
│  AI Knowledge: ARCHON MCP               │ ← CE-Hub Knowledge Backend
├─────────────────────────────────────────┤
│  Data Layer: PostgreSQL + Redis + R2    │
└─────────────────────────────────────────┘
```

### Key Components

- **Renata AI Agent**: Professional trading AI with three personality modes (Analyst/Coach/Mentor)
- **Archon MCP Integration**: Knowledge graph-powered intelligence and continuous learning
- **CE-Hub Workflow**: Plan → Research → Produce → Ingest methodology
- **Trading Analytics**: Advanced performance analysis and pattern recognition

## 🧠 Renata AI Modes

### 🔬 Analyst Mode
- **Tone**: Clinical, direct, minimal emotion
- **Focus**: Raw, unfiltered performance truth
- **Example**: "Expectancy fell 0.2R. Entry timing variance increased. Risk exceeded threshold in 3 trades."

### 👨‍🏫 Coach Mode (Default)
- **Tone**: Professional but constructive
- **Focus**: Results with actionable suggestions
- **Example**: "You performed better managing losses this week. Focus on execution timing to stabilize expectancy."

### 🧙‍♂️ Mentor Mode
- **Tone**: Reflective, narrative-oriented
- **Focus**: Building understanding through reflection
- **Example**: "You showed steadiness under pressure. The expectancy deviation stemmed from subtle confidence shifts. Let's examine where conviction wavered."

## 🚀 Quick Start

### Prerequisites

1. **Archon MCP Server** running on `localhost:8051`
2. Python 3.11+
3. PostgreSQL 15+ with pgvector
4. Redis
5. OpenAI API key

### Installation

1. **Clone and setup environment:**
```bash
cd traderra/backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your actual values
```

3. **Initialize Archon knowledge base:**
```bash
python scripts/init_knowledge.py
```

4. **Start the development server:**
```bash
uvicorn app.main:app --reload --port 6500
```

### Verify Installation

1. **Check API health:**
```bash
curl http://localhost:6500/health
```

2. **Test Archon connectivity:**
```bash
curl http://localhost:6500/debug/archon
```

3. **Test Renata AI:**
```bash
curl http://localhost:6500/debug/renata
```

4. **Interactive API docs:**
Open http://localhost:6500/docs

## 📡 API Endpoints

### Core AI Endpoints

- `POST /ai/query` - General AI conversation with Renata
- `POST /ai/analyze` - Dedicated performance analysis
- `GET /ai/status` - AI system health and Archon connectivity
- `GET /ai/modes` - Available AI personality modes

### Knowledge Management

- `GET /ai/knowledge/search` - Direct Archon RAG queries
- `POST /ai/knowledge/ingest` - Manual insight ingestion

### System

- `GET /health` - System health check
- `GET /` - API information and endpoints

## 🧪 Example Usage

### General AI Query
```bash
curl -X POST "http://localhost:6500/ai/query" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Analyze my performance this week",
    "mode": "coach"
  }'
```

### Performance Analysis
```bash
curl -X POST "http://localhost:6500/ai/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "time_range": "week",
    "basis": "gross",
    "unit": "r_multiple"
  }'
```

### Knowledge Search
```bash
curl "http://localhost:6500/ai/knowledge/search?query=risk%20management&match_count=5"
```

## 🔧 Configuration

### Environment Variables

Key configuration options in `.env`:

```env
# Archon MCP (Required)
ARCHON_BASE_URL="http://localhost:8051"
ARCHON_PROJECT_ID="7816e33d-2c75-41ab-b232-c40e3ffc2c19"

# AI Configuration
OPENAI_API_KEY="your_openai_api_key"
OPENAI_MODEL="gpt-4"

# Database
DATABASE_URL="postgresql+asyncpg://user:pass@localhost:5432/traderra"
REDIS_URL="redis://localhost:6379"

# Authentication
CLERK_SECRET_KEY="your_clerk_secret_key"
```

### Archon MCP Setup

The backend requires Archon MCP server running on port 8051. This provides:

- **RAG-powered intelligence** for trading pattern recognition
- **Knowledge graph storage** for continuous learning
- **Cross-session memory** and context preservation
- **CE-Hub workflow coordination**

## 🎯 CE-Hub Integration

This backend follows CE-Hub principles:

### Archon-First Protocol
- All AI operations route through Archon MCP
- Knowledge graph maintains authoritative system state
- RAG queries replace memory-based AI responses

### Plan → Research → Produce → Ingest Workflow

1. **PLAN**: Define analysis requirements and approach
2. **RESEARCH**: Query Archon for relevant trading patterns
3. **PRODUCE**: Generate insights using PydanticAI + Archon context
4. **INGEST**: Store results back to Archon for continuous learning

### Context as Product
- Every AI interaction designed for knowledge reuse
- Intelligence compounds through closed learning loops
- No disposable AI conversations

## 🧠 Knowledge Base

The system includes foundational trading knowledge:

### Core Patterns
- **Risk Management**: Position sizing, stop losses, portfolio heat
- **Performance Analysis**: Expectancy, profit factor, drawdown metrics
- **Trading Psychology**: Emotional control, discipline, bias recognition
- **Market Regimes**: Trend/range/volatility adaptation strategies

### Coaching Strategies
- **Losing Streaks**: Appropriate interventions and psychological support
- **Overconfidence**: Prevention and management techniques
- **Discipline Issues**: Process focus and rule adherence

### Continuous Learning
- User performance patterns are analyzed and stored
- AI coaching effectiveness is tracked and optimized
- Cross-user insights (anonymous) improve coaching quality

## 🔍 Development

### Project Structure
```
app/
├── api/              # FastAPI endpoints
├── ai/               # Renata agent and AI logic
├── core/             # Configuration, dependencies, Archon client
├── models/           # Database models (future)
├── services/         # Business logic (future)
└── main.py           # Application entry point

scripts/
├── init_knowledge.py # Initialize Archon knowledge base
└── ...               # Additional utilities
```

### Adding New AI Features

1. **Query Archon** for relevant patterns in RESEARCH phase
2. **Use PydanticAI** with Archon context in PRODUCE phase
3. **Ingest insights** back to Archon for learning in INGEST phase

Example:
```python
# RESEARCH: Query Archon for context
patterns = await archon.search_trading_knowledge(
    query="risk management patterns",
    match_count=5
)

# PRODUCE: Generate insights with context
result = await ai_agent.analyze(
    data=user_data,
    context=patterns
)

# INGEST: Store for future learning
await archon.ingest_trading_insight(
    insights=result.insights,
    tags=["ai_analysis", "risk_management"]
)
```

## 🚨 Troubleshooting

### Common Issues

1. **Archon Connection Failed**
```bash
# Check if Archon MCP is running
curl http://localhost:8051/health_check

# Verify environment configuration
echo $ARCHON_BASE_URL
```

2. **OpenAI API Errors**
```bash
# Check API key configuration
python -c "import openai; print(openai.api_key[:10])"
```

3. **Knowledge Base Empty**
```bash
# Reinitialize knowledge base
python scripts/init_knowledge.py

# Verify knowledge retrieval
python scripts/init_knowledge.py --verify
```

### Debug Endpoints

When `DEBUG=true`:
- `/debug/archon` - Test Archon MCP connectivity
- `/debug/renata` - Test Renata AI functionality

## 📊 Monitoring

### Health Checks
- API: `GET /health`
- Archon: `GET /ai/status`
- Debug: `GET /debug/archon`

### Logging
Structured JSON logging with:
- Request/response tracking
- AI operation metrics
- Archon query performance
- Error context and debugging

## 🔐 Security

- JWT-based authentication (Clerk integration)
- Row-Level Security (RLS) for multi-tenancy
- API rate limiting and request validation
- Secure Archon MCP communication
- Environment-based configuration

## 📚 API Documentation

When running in development mode:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🤝 Contributing

1. Follow CE-Hub principles and Archon-First protocol
2. All AI features must implement Plan → Research → Produce → Ingest
3. Use PydanticAI for AI agents, Archon for knowledge management
4. Include comprehensive tests for AI workflows
5. Document knowledge patterns and coaching strategies

## 📄 License

[License information to be determined]

---

**Built with ❤️ for professional traders using CE-Hub methodology and Archon knowledge management.**