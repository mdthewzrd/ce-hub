# Traderra Port 6565 Configuration Guide

**Quick Answer**: Traderra frontend is already configured to run on port 6565.

---

## Current Configuration

### Port 6565 - Already Set

The frontend in `/Users/michaeldurante/ai dev/ce-hub/traderra/frontend/package.json` is already configured:

```json
{
  "scripts": {
    "dev": "next dev -p 6565",
    "start": "next start -p 6565"
  }
}
```

**Status**: Port 6565 is hardcoded in the npm scripts.

---

## Running on Port 6565

### Quick Start

```bash
# Navigate to frontend
cd /Users/michaeldurante/ai\ dev/ce-hub/traderra/frontend

# Start development server (automatically uses port 6565)
npm run dev

# Expected output:
# ▲ Next.js 14.2.0
# - Local: http://localhost:6565
```

### Access the Application

```bash
# In your browser
open http://localhost:6565

# Or from command line
curl http://localhost:6565
```

---

## If Port 6565 is Already in Use

### Option 1: Kill Process Using Port

```bash
# Find process using port 6565
lsof -i :6565

# Kill the process
kill -9 <PID>

# Or on macOS:
lsof -i :6565 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### Option 2: Use a Different Port

If you need to change the port, edit `package.json`:

```json
{
  "scripts": {
    "dev": "next dev -p 3000",
    "start": "next start -p 3000"
  }
}
```

Then run:
```bash
npm run dev
```

### Option 3: Override at Runtime

```bash
# Start on port 3000 instead of 6565
next dev -p 3000

# Or using npm
npm run dev -- -p 3000

# Or using environment variable
PORT=3000 npm run dev
```

---

## System Ports Configuration

### Full Stack Port Layout

| Component | Port | URL | Status |
|-----------|------|-----|--------|
| **Frontend** | **6565** | http://localhost:6565 | Running |
| Backend API | 6500 | http://localhost:6500 | Running |
| API Documentation | 6500/docs | http://localhost:6500/docs | Debug Only |

### Backend on Port 6500

The backend uses port 6500. If you need to change it, modify `/traderra/backend/app/main.py`:

```python
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=6500,  # Change this number
        reload=settings.debug,
    )
```

Or run with different port:

```bash
uvicorn app.main:app --port 6501
```

---

## Frontend-Backend Communication

The frontend connects to the backend through API rewrites configured in `next.config.js`:

```javascript
async rewrites() {
  return [
    {
      source: '/api/backend/:path*',
      destination: 'http://localhost:6500/api/:path*',
    },
  ];
}
```

**Important**: If you change the backend port, update this configuration:

```javascript
async rewrites() {
  return [
    {
      source: '/api/backend/:path*',
      destination: 'http://localhost:YOUR_NEW_BACKEND_PORT/api/:path*',
    },
  ];
}
```

---

## Environment Variables for Port Configuration

### Frontend (.env.local)

```env
# Backend API (must match backend port)
NEXT_PUBLIC_API_URL=http://localhost:6500

# Frontend URL (for reference)
NEXT_PUBLIC_APP_URL=http://localhost:6565
```

### Backend (.env)

```env
# CORS configuration (includes frontend port)
ALLOWED_ORIGINS='["http://localhost:6565","http://localhost:3000"]'
```

If you change either port, update these environment variables.

---

## Verify Port 6565 is Running

```bash
# Test if server is running
curl http://localhost:6565

# Expected response: HTML content of the application

# Check with lsof
lsof -i :6565

# Check with netstat
netstat -an | grep 6565

# Check with ss
ss -tuln | grep 6565
```

---

## Troubleshooting Port 6565

### Issue: Port Already in Use

```bash
# Find what's using port 6565
lsof -i :6565
# Output: COMMAND    PID     USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
#         node      1234  user    22u  IPv6 0x12345678abcdef   0t0  TCP [::1]:6565 (LISTEN)

# Kill the process
kill -9 1234
```

### Issue: Port Access Denied

```bash
# Port 6565 requires elevated privileges
# Check if running with proper permissions
sudo npm run dev
```

### Issue: Address Already in Use Error

```bash
# When starting npm run dev:
# ❌ Port 6565 is already in use

# Solution 1: Kill existing process
lsof -i :6565 | awk 'NR!=1 {print $2}' | xargs kill -9

# Solution 2: Use different port
next dev -p 3000

# Solution 3: Wait for port to be released (OS level)
sleep 10 && npm run dev
```

---

## Production Deployment on Port 6565

### Build and Run

```bash
# Build the application
npm run build

# Start production server on port 6565
npm start

# Or with environment variable
PORT=6565 npm start
```

### Using with Nginx/Apache Reverse Proxy

If your application is behind a reverse proxy:

```nginx
# nginx.conf
upstream nextjs {
    server localhost:6565;
}

server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Docker Configuration for Port 6565

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 6565

CMD ["npm", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  traderra-frontend:
    build: ./frontend
    ports:
      - "6565:6565"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:6500
      - PORT=6565
    depends_on:
      - traderra-backend

  traderra-backend:
    build: ./backend
    ports:
      - "6500:6500"
    environment:
      - PORT=6500
```

Run with:
```bash
docker-compose up
```

---

## Performance Considerations

### Port 6565 Performance

- Next.js development server handles ~500-1000 concurrent connections
- Production build (npm start) significantly better performance
- Use `npm run build && npm start` for production testing

### Memory Usage

```bash
# Monitor memory during development
top -p $(lsof -t -i :6565)

# Check if port is using too much memory
ps aux | grep 6565
```

---

## Common Configurations

### Development Setup

```bash
# Terminal 1: Backend
cd traderra/backend
source venv/bin/activate
uvicorn app.main:app --reload --port 6500

# Terminal 2: Frontend (automatically on 6565)
cd traderra/frontend
npm run dev
```

### Production Setup

```bash
# Build frontend
npm run build

# Start on port 6565
npm start

# Or with process manager (PM2)
pm2 start "npm start" --name "traderra-frontend" -- --port 6565
```

### Docker Compose

```bash
cd /Users/michaeldurante/ai\ dev/ce-hub/traderra
docker-compose up -d
# Frontend: http://localhost:6565
# Backend: http://localhost:6500
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Start on 6565 | `npm run dev` |
| Start on different port | `next dev -p 3000` |
| Check if 6565 is free | `lsof -i :6565` |
| Kill process on 6565 | `lsof -i :6565 \| awk 'NR!=1 {print $2}' \| xargs kill -9` |
| Test frontend | `curl http://localhost:6565` |
| Test backend | `curl http://localhost:6500/health` |
| Build for production | `npm run build` |
| Run production server | `npm start` |

---

## Summary

**Traderra is already configured to run on port 6565.**

To start:
```bash
cd /Users/michaeldurante/ai\ dev/ce-hub/traderra/frontend
npm run dev
```

Then visit: http://localhost:6565

The backend runs on port 6500 and communicates with the frontend through API rewrites.

---

**For complete documentation, see**: `/Users/michaeldurante/ai dev/ce-hub/TRADERRA_APPLICATION_STRUCTURE_GUIDE.md`

