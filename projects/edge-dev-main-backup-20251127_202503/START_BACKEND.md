# 🚀 Start the Backside B Scan Server

## ✅ THE ONLY BACKEND YOU NEED

**File**: `backend/backside_b_scan.py`
**Port**: `5659` (moved from 8003 to avoid conflicts)
**Name**: Backside B Scan Server

## 🎯 Quick Start

```bash
cd "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main"
python backend/backside_b_scan.py
```

## 📋 What It Does

- ✅ **AI Code Formatting** with DeepSeek ($0.00014/M tokens)
- ✅ **OpenRouter Integration** (your API key configured)
- ✅ **Project Management** (create/list projects)
- ✅ **File Upload Processing**
- ✅ **Parameter Integrity Verification**

## 🔍 Check if Running

```bash
curl http://localhost:5659/health | python3 -m json.tool
```

**Look for**: `"server": "Backside B Scan"` and `"service": "✅ THE ONLY BACKEND YOU NEED"`

## 🌐 Endpoints

- `GET /` - Server info
- `GET /health` - Health check with clear identification
- `POST /api/format/code` - AI code formatting
- `GET /api/projects` - List projects
- `POST /api/projects` - Create projects

## 🎯 Frontend Integration

- **Site**: http://localhost:5657
- **Backend**: http://localhost:5659 (this server)
- **Status**: ✅ Fully functional

---

**This is the ONLY backend server you need to run.** All other backend files have been removed.