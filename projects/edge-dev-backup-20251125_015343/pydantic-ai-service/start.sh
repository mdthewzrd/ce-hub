#!/bin/bash
# Startup script for Edge.dev PydanticAI Trading Agent Service

echo "🚀 Starting Edge.dev Trading Agent Service..."

# Check if we're in the right directory
if [ ! -f "pyproject.toml" ]; then
    echo "❌ Error: Please run this script from the pydantic-ai-service directory"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️ Warning: .env file not found. Creating from template..."
    cp .env.example .env
    echo "📝 Please edit .env file and add your API keys:"
    echo "   - OPENAI_API_KEY=your_openai_key"
    echo "   - ANTHROPIC_API_KEY=your_anthropic_key"
    echo ""
fi

# Check if poetry is installed
if ! command -v poetry &> /dev/null; then
    echo "❌ Poetry not found. Please install Poetry first:"
    echo "   curl -sSL https://install.python-poetry.org | python3 -"
    exit 1
fi

# Install dependencies if needed
echo "📦 Installing dependencies..."
poetry install

# Run basic test
echo "🧪 Running basic service test..."
poetry run python test_service.py

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Service test passed! Starting the server..."
    echo "📍 Server will be available at: http://localhost:8001"
    echo "📖 API Documentation: http://localhost:8001/docs"
    echo "🔄 WebSocket endpoint: ws://localhost:8001/ws/agent"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""

    # Start the server
    poetry run uvicorn app.main:app --reload --port 8001 --host 0.0.0.0
else
    echo "❌ Service test failed. Please check the errors above."
    exit 1
fi