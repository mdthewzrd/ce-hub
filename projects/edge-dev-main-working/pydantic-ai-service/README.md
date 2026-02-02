# Edge.dev Trading Agent Service

A PydanticAI-powered service that enhances Edge.dev's trading workflows through intelligent scan creation, backtest generation, and dynamic parameter editing.

## Features

- **Intelligent Scan Creation**: AI-assisted scanner building with natural language processing
- **Dynamic Backtest Generation**: Automated backtest creation based on trading strategies
- **Parameter Optimization**: Smart parameter tuning and validation
- **Pattern Recognition**: AI-powered market pattern detection and strategy suggestions
- **Integration with EdgeDev**: Seamless integration with existing frontend via AG-UI protocol

## Architecture

- **FastAPI Backend**: High-performance API service
- **PydanticAI Agents**: Specialized AI agents for different trading workflows
- **AG-UI Protocol**: CopilotKit integration for enhanced UI interactions
- **SQLAlchemy ORM**: Persistent storage for strategies, backtests, and user data

## Quick Start

```bash
# Install dependencies
poetry install

# Run development server
poetry run uvicorn app.main:app --reload --port 8001

# Run tests
poetry run pytest
```

## API Endpoints

- `POST /api/agent/scan/create` - Create new scan with AI assistance
- `POST /api/agent/backtest/generate` - Generate backtest from strategy description
- `PUT /api/agent/parameters/optimize` - Optimize scan parameters
- `GET /api/agent/patterns/analyze` - Analyze market patterns
- `WebSocket /ws/agent` - Real-time AI agent communication

## Environment Variables

```bash
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
DATABASE_URL=sqlite:///./trading_agent.db
CORS_ORIGINS=http://localhost:3000
```