# Setting Up Real Claude API Connection

## 🚀 Current Status

✅ **Claude API Server**: Running on port 8108
✅ **Mobile Interface**: Updated to use real API
❌ **API Key**: Needs valid Anthropic API key

## 📋 What's Working Now

When you send a message, the mobile interface will:
- Connect to the Claude API server on port 8108
- Show you proper error messages if the API key is invalid
- Display token usage and real responses when configured

## 🔑 Getting Your Anthropic API Key

### Option 1: Claude Code Desktop App (Recommended)
1. **Install Claude Code** from: https://claude.ai/download
2. **Open Claude Code** and sign in
3. **Go to Settings** → API Keys
4. **Copy your API key** (starts with `sk-ant-api03-`)

### Option 2: Anthropic Console
1. **Go to**: https://console.anthropic.com/account/keys
2. **Sign in** or create an account
3. **Create new API key**
4. **Copy the key** (starts with `sk-ant-api03-`)

## ⚙️ Configure Your API Key

1. **Edit the .env file**:
   ```bash
   nano .env
   ```

2. **Replace the placeholder**:
   ```env
   ANTHROPIC_API_KEY=sk-ant-api03-YOUR_ACTUAL_KEY_HERE
   CLAUDE_API_KEY=sk-ant-api03-YOUR_ACTUAL_KEY_HERE
   ```

3. **Restart the Claude server**:
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart:
   node claude-server.js
   ```

## 🧪 Test the Connection

### Method 1: Mobile Interface
1. **Open**: http://100.95.223.19:8105/mobile-truly-optimized.html
2. **Send a test message**: "hello claude"
3. **Check response**: Should get real Claude response

### Method 2: Direct API Test
```bash
curl -X POST http://100.95.223.19:8108/claude \
  -H "Content-Type: application/json" \
  -d '{"question": "Hello, can you respond?"}'
```

## 📱 Mobile Usage

Once configured:
- **Real Claude responses** instead of mock data
- **Token usage tracking** in mobile interface
- **Multiple Claude models** available
- **Proper error handling** with helpful messages

## 🔧 Troubleshooting

### ❌ "Connection Error"
- **Check**: Claude server running on port 8108?
- **Fix**: `node claude-server.js`

### ❌ "API Error: Invalid API Key"
- **Check**: API key in .env file
- **Fix**: Add valid Anthropic API key

### ❌ "Server responded with 401"
- **Check**: API key format and validity
- **Fix**: Get fresh API key from Claude Code

### ❌ "Network connection failed"
- **Check**: IP address and ports
- **Fix**: Make sure both servers are running

## 🎯 Next Steps

1. **Get API key** from Claude Code or Anthropic Console
2. **Update .env file** with real API key
3. **Restart Claude server**
4. **Test mobile interface**
5. **Enjoy real Claude responses!**

---

**📱 Mobile Access**: http://100.95.223.19:8105/mobile-truly-optimized.html
**🔧 API Server**: http://100.95.223.19:8108 (for testing)