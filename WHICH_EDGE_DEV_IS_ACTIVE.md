# 🔍 Which Edge.dev Folder is Active?

**Status**: ✅ **IDENTIFIED THE ACTIVE ONE**
**Active Directory**: `/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/`
**Port**: 5656 (your browser is connected here)

---

## 🎯 **The ACTIVE Edge.dev Directory**

### **✅ This is Your Working Directory**:
```
/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/
```

**How I know**: Your Node.js server (PID 86973) is running from this exact directory on port 5656.

### **🔧 Your .env.local File Location**:
```
/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/.env.local
```

**This is where you add your Clerk keys!**

---

## 🗂️ **All Your Edge.dev Folders (8 Total)**

| Directory | Status | Purpose |
|-----------|--------|---------|
| **`/projects/edge-dev-main/`** | ✅ **ACTIVE** | Your main Next.js platform |
| `/edge-dev/` | 📦 Python scanners | Trading scanner scripts |
| `/projects/edge-dev/` | 📦 Older version | Previous development version |
| `/archive/edge-dev/` | 🗃️ Archive | Old archived version |
| `/projects/edge-dev-backup-*` | 📦 Backups | Safety backups |
| `/projects/edge-dev-main-backup-*` | 📦 Backups | Safety backups |
| `/projects/edge-dev-mobile/` | 📱 Mobile | Mobile development |
| `/assets/docs/projects/edge-dev` | 📚 Docs | Documentation |

---

## 🚀 **For Your Clerk Setup**

### **This is the file to edit**:
```bash
open "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/.env.local"
```

### **Lines to update** (5-6):
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_REAL_KEY_HERE          # ← REPLACE
CLERK_SECRET_KEY=sk_test_YOUR_REAL_SECRET_KEY_HERE                      # ← REPLACE
```

### **Quick Test**:
```bash
# Verify this is the right directory
cd "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main"
ls -la | grep env
```

---

## 💡 **How to Tell Which is Active**

### **Method 1: Check Running Process**
```bash
lsof -i :5656
lsof -p [PID] | grep cwd
```

### **Method 2: Check for Next.js Files**
```bash
# Active directory has these files:
ls -la "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/package.json"
ls -la "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/src/"
ls -la "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/next.config.ts"
```

### **Method 3: Browser Check**
- Your browser is connected to http://localhost:5656
- That server is running from `/projects/edge-dev-main/`

---

## 🎯 **Summary**

**✅ ACTIVE DIRECTORY**: `/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/`
- This is where your Next.js platform is running
- This is where you add your Clerk keys
- This is where you develop your UI

**📦 OTHER FOLDERS**: Safe to ignore - they're old versions, backups, or different components

**Your Clerk setup goes in `/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/.env.local`!** 🚀