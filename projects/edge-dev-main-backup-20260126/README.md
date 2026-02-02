# edge-dev-main - Trading Scanner & Backtesting Platform

**Location:** `/Users/michaeldurante/ai-dev-workspaces/edge-dev-main`

**Status:** Active Development

---

## 📁 Project Structure

```
edge-dev-main/
├── backend/           <- Python FastAPI backend
│   ├── scanner.py     <- Trading scanner
│   ├── backtest.py    <- Backtesting engine
│   └── [API endpoints]
│
├── src/               <- Next.js frontend
│   ├── app/           <- Next.js app directory
│   ├── components/    <- React components
│   └── [UI code]
│
└── [project files]
```

---

## 🚀 Quick Start

### Start Backend
```bash
cd backend
python main.py
# Backend runs on http://localhost:8000
```

### Start Frontend
```bash
npm run dev
# Frontend runs on http://localhost:3000
```

---

## 🎯 Current Focus

- [ ] RAG integration for scanner
- [ ] Enhanced backtesting
- [ ] UI improvements

---

## 🔗 Related Workspaces

- **CE-Hub:** `/Users/michaeldurante/ai-dev-workspaces/CE-Hub`
  - Templates and workflows
  - Session management
  - Message transformer

---

**Use CE-Hub templates when working on this project:**
```bash
# Start a work session
cat /Users/michaeldurante/ai-dev-workspaces/CE-Hub/.claude/instructions/SESSION_INIT.md

# Transform a message
python /Users/michaeldurante/ai-dev-workspaces/CE-Hub/transform.py "your message"
```
