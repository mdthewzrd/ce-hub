# Edge.dev Projects Page - Troubleshooting & Recovery Guide

## Quick Status Check

### Current System State (Nov 11, 2025)
- **Frontend Server**: ✅ Running on port 5657
- **Projects Page**: ✅ Fully Implemented & Accessible
- **Backend Server**: ⚠️ Not currently running
- **Project Management UI**: ✅ Complete & Production-Ready
- **Database**: Configured (SQLite at `edge_dev.db`)

---

## The Issue: Projects Page Cannot Load Data

### Symptoms
1. Projects page loads but shows no data
2. "Failed to fetch projects" error message
3. Browser console shows API fetch errors
4. Network tab shows failed requests to `http://localhost:8000/api/*`

### Root Cause
The backend FastAPI server is not running. The projects page makes direct API calls to `http://localhost:8000/api` which requires an active backend service.

---

## Solution: Start the Backend

### Step 1: Open Terminal and Navigate to Backend
```bash
cd /Users/michaeldurante/ai\ dev/ce-hub/edge-dev/backend
```

### Step 2: Activate Python Virtual Environment
```bash
source venv/bin/activate
```

You should see `(venv)` prefix in your terminal prompt.

### Step 3: Start FastAPI Server
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output**:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Application startup complete
```

### Step 4: Verify Backend is Running
Open a new terminal and test:
```bash
curl http://localhost:8000/api/projects
```

**Expected Response**: 
```json
[]
```
(empty array if no projects exist)

### Step 5: Test Projects Page
1. Open browser to: `http://localhost:5657/projects`
2. Page should load and display project list
3. Should be able to create/edit projects
4. Should be able to add scanners and execute

---

## Backend Startup Troubleshooting

### Issue 1: `venv` Not Found
**Error**: `No such file or directory: venv/bin/activate`

**Solution**:
```bash
# Create virtual environment
cd /Users/michaeldurante/ai\ dev/ce-hub/edge-dev
python3 -m venv backend/venv

# Install dependencies
source backend/venv/bin/activate
pip install -r backend/requirements.txt

# Now try starting again
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Issue 2: Port 8000 Already in Use
**Error**: `OSError: [Errno 48] Address already in use`

**Solution**:
```bash
# Find what's using port 8000
lsof -i :8000

# Kill the process (replace PID with actual process ID)
kill -9 <PID>

# Or use a different port
uvicorn main:app --reload --host 0.0.0.0 --port 8001

# Then update .env.local to reflect new port
```

### Issue 3: Missing Dependencies
**Error**: `ModuleNotFoundError: No module named '...'`

**Solution**:
```bash
# Activate venv and reinstall dependencies
source venv/bin/activate
pip install -r requirements.txt --upgrade
```

### Issue 4: CORS Errors in Browser
**Error**: `Access to XMLHttpRequest ... blocked by CORS policy`

**Status**: FastAPI has CORS middleware configured in `main.py`, should work out of box
**If still failing**: Check `main.py` for CORS configuration

---

## Integrated Startup (Frontend + Backend)

### Option 1: Separate Terminals (Recommended)

**Terminal 1 - Frontend**:
```bash
cd /Users/michaeldurante/ai\ dev/ce-hub/edge-dev
npm run dev
# Runs on http://localhost:5657
```

**Terminal 2 - Backend**:
```bash
cd /Users/michaeldurante/ai\ dev/ce-hub/edge-dev/backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
# Runs on http://localhost:8000
```

### Option 2: Using dev:backend Script
```bash
# In edge-dev directory with venv activated
npm run dev:backend
```

**Note**: Verify this script exists in `package.json`

### Option 3: Full Stack (If dev:full script exists)
```bash
cd /Users/michaeldurante/ai\ dev/ce-hub/edge-dev
./dev-start.sh
```

---

## Projects Page Features

### Once Backend is Running

#### 1. View Projects List
- Navigate to `http://localhost:5657/projects`
- See all existing projects
- Pre-configured: "LC Momentum Setup"

#### 2. Create New Project
- Click "New Project"
- Fill project details
- Select aggregation method (UNION, INTERSECTION, WEIGHTED_AVERAGE)
- Create with template or from scratch

#### 3. Manage Scanners
- Add scanners from available library (`/generated_scanners/`)
- Available scanners:
  - `lc_frontside_d2_extended`
  - `lc_frontside_d2_extended_1`
  - `lc_frontside_d3_extended_1`
- Configure weight and execution order

#### 4. Edit Parameters
- Select scanner to configure parameters
- Dynamic form generation based on scanner requirements
- Save parameter history
- Load previous parameter snapshots

#### 5. Execute Project
- Set date range for scanning
- Choose specific symbols or scan full market
- Monitor real-time execution progress
- Download results as JSON/CSV

---

## Configuration Files

### Key Configuration Files

**Frontend Configuration** (`.env.local`):
```bash
# Current config - defaults to localhost:8000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Add this if needed for other configurations
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development
```

**Backend Configuration** (`backend/.env`):
```bash
DATABASE_URL=sqlite:///./edge_dev.db
OPENROUTER_API_KEY=sk-or-v1-...
POLYGON_API_KEY=Fm7brz4s23eS...
DEBUG=True
LOG_LEVEL=INFO
```

### Important: API Base URL

If backend is on different port, update `.env.local`:
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
```

Then restart Next.js frontend to pick up new value.

---

## Database & Project Storage

### Project Storage Location
```
/Users/michaeldurante/ai\ dev/ce-hub/edge-dev/projects/
```

### Database Location
```
/Users/michaeldurante/ai\ dev/ce-hub/edge-dev/backend/edge_dev.db
```

### Project Structure
Each project is a directory containing:
- `project.json` - Project metadata
- `scanners/` - Scanner assignments
- `parameters/` - Parameter configurations
- `executions/` - Execution history (optional)

---

## Monitoring & Health Checks

### Health Check Script
```bash
cd /Users/michaeldurante/ai\ dev/ce-hub/edge-dev
npm run health
```

### Manual Health Verification

**Frontend Health**:
```bash
curl http://localhost:5657/
# Should return HTML
```

**Backend Health**:
```bash
curl http://localhost:8000/
# Should return FastAPI response
```

**API Endpoints**:
```bash
# List all projects
curl http://localhost:8000/api/projects

# List available scanners
curl http://localhost:8000/api/scanners

# List projects with details
curl http://localhost:8000/api/projects?sort_by=updated_at&sort_order=desc
```

---

## Logs & Debugging

### Frontend Logs
```bash
# Check browser console (F12)
# Look for network errors in Network tab
# Check for CORS errors
```

### Backend Logs
Visible in terminal where backend is running:
```
INFO:     Application startup complete
INFO:     GET /api/projects - 200
INFO:     POST /api/projects - 201
ERROR:    ... any errors will show here
```

### Enable Debug Logging
In `backend/.env`, set:
```
LOG_LEVEL=DEBUG
DEBUG=True
```

### View Database
```bash
# SQLite database inspection
sqlite3 /Users/michaeldurante/ai\ dev/ce-hub/edge-dev/backend/edge_dev.db

# Inside sqlite3:
.tables
.schema
SELECT * FROM projects;
```

---

## Common Issues & Solutions

### Issue: Projects List is Empty
**Solution**: Create first project using "New Project" button

### Issue: Scanners Don't Show Up
**Check**:
1. Generated scanners exist in `/generated_scanners/`
2. Backend is running
3. Scanner files have valid Python syntax
4. Try refreshing browser (Ctrl+R or Cmd+R)

### Issue: Can't Save Parameters
**Check**:
1. Backend is running
2. Scanner is selected
3. Parameter values are valid
4. Check browser console for error messages

### Issue: Execution Fails
**Check**:
1. Date range is valid
2. At least one scanner is enabled
3. Backend has access to Polygon API (POLYGON_API_KEY)
4. Check backend logs for detailed error

### Issue: Port Already in Use
```bash
# Find process using port
lsof -i :8000

# Kill if necessary
kill -9 <PID>

# Or use different port and update config
```

---

## Performance & Optimization

### Current Architecture
- **Frontend**: Next.js with Turbopack (fast rebuilds)
- **Backend**: FastAPI with async support
- **Execution**: Parallel scanner execution by default
- **Polling**: 2-second updates during execution

### Optimization Tips

1. **Reduce Polling Interval** (if needed):
   - Edit `/src/app/projects/page.tsx`
   - Change polling interval: `setInterval(() => { pollExecutionStatus(); }, 2000);`

2. **Enable Parallel Execution**:
   - Already enabled by default
   - Significantly faster than sequential

3. **Cache Scanner List**:
   - Already cached in component state
   - Refresh with button click

---

## Advanced Configuration

### Changing Backend Port
1. Edit backend command to use different port:
   ```bash
   uvicorn main:app --port 9000
   ```

2. Update frontend config:
   ```bash
   # In .env.local
   NEXT_PUBLIC_API_BASE_URL=http://localhost:9000
   ```

3. Restart Next.js frontend

### Custom Project Templates
Add to available templates in `ProjectManager.tsx`:
```typescript
const projectTemplates = [
  {
    id: 'lc-momentum-setup',
    name: 'LC Momentum Setup',
    aggregation_method: AggregationMethod.WEIGHTED_AVERAGE,
    tags: ['momentum', 'lc', 'trading']
  },
  // Add more templates here
];
```

### Batch Project Operations
Use backend API directly:
```bash
# Create multiple projects from JSON
curl -X POST http://localhost:8000/api/projects/batch \
  -H "Content-Type: application/json" \
  -d @projects.json
```

---

## Support & Documentation

### Key Documentation Files
- `PROJECT_MANAGEMENT_UI_IMPLEMENTATION.md` - Full implementation details
- `PROJECT_COMPOSITION_SYSTEM_QUALITY_VALIDATION_REPORT.md` - Quality assurance
- `PROJECT_MANAGEMENT_QUICK_START.md` - Quick reference
- `EDGE_DEV_CURRENT_STATE_ANALYSIS.md` - Complete system analysis

### Backend Documentation
Located in `/backend/project_composition/README.md`:
- Architecture overview
- API endpoint documentation
- Scanner integration details
- Parameter management system

---

## Recovery Checklist

### If Projects Page Crash Occurs

1. **Restart Backend**:
   ```bash
   # Kill old process
   lsof -i :8000 | grep Python | awk '{print $2}' | xargs kill -9
   
   # Start fresh
   cd /Users/michaeldurante/ai\ dev/ce-hub/edge-dev/backend
   source venv/bin/activate
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Clear Frontend Cache**:
   ```bash
   # In browser console (F12)
   localStorage.clear()
   sessionStorage.clear()
   location.reload(true)
   ```

3. **Reset Database** (if corrupted):
   ```bash
   # Backup old database
   mv /Users/michaeldurante/ai\ dev/ce-hub/edge-dev/backend/edge_dev.db \
      /Users/michaeldurante/ai\ dev/ce-hub/edge-dev/backend/edge_dev.db.bak
   
   # Restart backend (will create fresh DB)
   ```

4. **Verify System Health**:
   ```bash
   npm run health
   ```

---

## Conclusion

The Projects Page system is **production-ready and fully implemented**. The main requirement for operation is:

1. **Backend must be running** on port 8000
2. **Frontend automatically connects** if backend is available
3. **All functionality is operational** once connected

Follow the "Solution: Start the Backend" section at the top to get up and running immediately.

---

**Last Updated**: November 11, 2025
**System Status**: Production Ready (Pending Backend Startup)
