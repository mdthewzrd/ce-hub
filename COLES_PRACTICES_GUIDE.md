# 🚀 Cole Medin's Development Practices

**Commands, workflows, and patterns from Ottomator Agents**

---

## 🔧 Essential CLI Commands

### Package Management
```bash
# UV - Fast Python package manager (10-100x faster than pip)
uv pip install <package>
uv pip install -e .
uv pip list
uv pip freeze > requirements.txt

# Install from requirements
uv pip install -r requirements.txt

# Development mode
uv pip install -e ".[dev]"
```

### Development Commands
```bash
# Prime - Initialize/prepare development environment
prime                    # Setup/prime the project
prime init              # Initialize new project
prime install           # Install dependencies
prime test              # Run tests
prime lint              # Run linting
prime format            # Format code

# Alternative: using make
make install            # Install dependencies
make test              # Run tests
make lint              # Lint code
make format            # Format code
make dev               # Start development server
```

### Git Workflow
```bash
# Cole's git workflow
git checkout -b feature/name
git commit -am "feature: description"
git push origin feature/name

# Conventional commits
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug in scanner"
git commit -m "docs: update README"
git commit -m "refactor: improve code structure"
git commit -m "test: add tests for vector search"
```

---

## 📁 Project Structure (Ottomator Pattern)

```
project-name/
├── docs/                    # Theory & research
│   ├── agent-fundamentals.md
│   ├── architecture.md
│   └── patterns.md
│
├── examples/                # Minimal pseudocode (<50 lines each)
│   ├── basic_agent.py
│   ├── rag_agent.py
│   └── workflow.py
│
├── implementation/         # Production code
│   ├── agents/
│   ├── tools/
│   ├── tests/
│   └── main.py
│
├── pyproject.toml          # Dependencies with UV
├── README.md
└── .env.example            # Environment template
```

---

## 🎯 Core Principles

### 1. Simplicity Wins
- Start with the simplest solution
- Don't over-engineer
- Add complexity only when validated

### 2. Tools Before Agents
- Build and test tools independently
- Tools are more reliable than agents
- Use agents to orchestrate tools

### 3. Observability From Day One
- Add logging immediately
- Instrument everything
- Make debugging easy

### 4. Fail Fast, Ship Quality
- Prototype with cheap models (Haiku)
- Ship with quality models (Sonnet)
- Test before deploying

### 5. Environment Configuration
```bash
# Always use .env files
cp .env.example .env
# Edit .env with your values

# Never commit .env
echo ".env" >> .gitignore
```

---

## 🔨 Development Workflow

### Starting a New Project
```bash
# 1. Create project structure
mkdir my-project
cd my-project

# 2. Initialize UV
uv init

# 3. Create pyproject.toml
cat > pyproject.toml << 'EOF'
[project]
name = "my-project"
version = "0.1.0"
requires-python = ">=3.10"
dependencies = [
    "pydantic-ai>=0.0.0",
    "fastapi>=0.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0.0",
    "black>=23.0.0",
    "ruff>=0.1.0",
]

[tool.uv]
dev-dependencies = [
    "pytest>=7.0.0",
    "black>=23.0.0",
    "ruff>=0.1.0",
]
EOF

# 4. Install dependencies
uv pip install -e ".[dev]"

# 5. Create .env.example
cat > .env.example << 'EOF'
# API Keys
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here

# Database
DATABASE_URL=postgresql://localhost:5432/mydb
EOF

# 6. Create README
cat > README.md << 'EOF'
# My Project

## Setup
\`\`\`bash
uv pip install -e ".[dev]"
cp .env.example .env
# Edit .env with your values
\`\`\`

## Development
\`\`\`bash
# Run tests
uv run pytest

# Format code
uv run black .

# Lint code
uv run ruff check
\`\`\`
EOF
```

### Daily Development
```bash
# 1. Pull latest changes
git pull origin main

# 2. Install/update dependencies
uv pip install -e ".[dev]"

# 3. Run tests
uv run pytest

# 4. Start coding
# ... make changes ...

# 5. Format and lint
uv run black .
uv run ruff check --fix .

# 6. Test again
uv run pytest

# 7. Commit
git add .
git commit -m "feat: description"
git push
```

---

## 🤖 Agent Development Patterns

### PydanticAI Agent Template
```python
from pydantic_ai import Agent, RunContext
from pydantic_ai.tools import tool

# Initialize agent
agent = Agent(
    'openai:gpt-4o',
    system_prompt=(
        'You are a specialized agent for...'
    ),
)

# Add tools
@agent.tool_plain
def my_tool(ctx: RunContext[None], arg: str) -> str:
    """Tool description."""
    # Tool logic
    return result

# Run agent
result = await agent.run("user message")
print(result.data)
```

### Testing Pattern
```python
import pytest
from my_agent import agent

@pytest.mark.asyncio
async def test_agent_basic():
    result = await agent.run("test message")
    assert result.data
    assert "expected" in result.data

@pytest.mark.asyncio
async def test_agent_with_context():
    result = await agent.run("test with context")
    assert result.data
```

---

## 📊 Code Quality Standards

### Formatting (Black)
```bash
# Format code
uv run black .

# Check formatting
uv run black --check .

# Configuration in pyproject.toml
[tool.black]
line-length = 100
target-version = ['py310']
```

### Linting (Ruff)
```bash
# Lint code
uv run ruff check .

# Fix issues
uv run ruff check --fix .

# Configuration in pyproject.toml
[tool.ruff]
line-length = 100
select = ["E", "F", "I", "N", "W"]
```

### Type Checking (MyPy)
```bash
# Check types
uv run mypy .

# Configuration in pyproject.toml
[tool.mypy]
python_version = "3.10"
warn_return_any = true
warn_unused_configs = true
```

---

## 🧪 Testing Practices

### Test Structure
```
tests/
├── unit/              # Unit tests
│   ├── test_agent.py
│   └── test_tools.py
├── integration/       # Integration tests
│   └── test_workflow.py
└── e2e/              # End-to-end tests
    └── test_system.py
```

### Running Tests
```bash
# All tests
uv run pytest

# Unit tests only
uv run pytest tests/unit/

# With coverage
uv run pytest --cov=my_module --cov-report=html

# Verbose output
uv run pytest -v

# Stop on first failure
uv run pytest -x
```

---

## 🚀 Deployment Workflow

### Pre-Deployment Checklist
```bash
# 1. Run full test suite
uv run pytest

# 2. Check code quality
uv run black --check .
uv run ruff check .
uv run mypy .

# 3. Run security scan
uv pip install safety
uv run safety check

# 4. Build
uv build

# 5. Test build
uv pip install dist/*.whl
```

### Git Tagging
```bash
# Tag release
git tag -a v0.1.0 -m "Release version 0.1.0"
git push origin v0.1.0
```

---

## 💡 Pro Tips

### 1. Environment Management
```bash
# Use .env for local dev
# Use environment variables in production
export DATABASE_URL="postgresql://..."
```

### 2. Logging
```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

logger.info("Message")
logger.error("Error: %s", error)
```

### 3. Error Handling
```python
try:
    result = risky_operation()
except Exception as e:
    logger.error("Operation failed: %s", e)
    raise
```

### 4. Documentation
```bash
# Generate docs
uv pip install mkdocs
uv run mkdocs serve

# Or use docstrings
def function(arg: str) -> str:
    """Function description.

    Args:
        arg: Description

    Returns:
        Description
    """
    return arg
```

---

## 🔗 Quick Reference

| **Command** | **Purpose** |
|-------------|-------------|
| `uv pip install` | Install packages |
| `prime` / `make dev` | Start development |
| `uv run pytest` | Run tests |
| `uv run black .` | Format code |
| `uv run ruff check` | Lint code |
| `git commit -m "feat:"` | Commit with convention |
| `git tag v0.1.0` | Tag release |

---

**This is how Cole builds production-grade agents and systems efficiently!** 🚀
