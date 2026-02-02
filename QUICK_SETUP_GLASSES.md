# 🕶️ Glasses Compositor - Best Setup (Open Router + Together AI)

## Current Status: Using Open Router + Together AI

This is the **best quality + cheapest price** combination!

### What You Need:

#### 1. Open Router API Key ✅ (Already configured!)
- Used for Claude 3.5 analysis (better than GLM-4V)
- Cost: ~$0.0005 per analysis
- You already have this in your `.env`

#### 2. Together AI API Key (Need to add)
- Used for SDXL image generation (cheapest option)
- Cost: ~$0.001 per image
- **Free $5 credit** when you sign up!

## Quick Setup (2 minutes):

### Step 1: Get Together AI Key (Free $5 credit!)

1. Go to https://together.ai
2. Click "Sign Up" (free - no credit card needed)
3. Get API key from: https://api.together.xyz/settings/api-keys
4. Copy your API key

### Step 2: Add to .env file:

```bash
cd "/Users/michaeldurante/ai dev/ce-hub"
echo "TOGETHER_API_KEY=your_actual_key_here" >> .env
```

### Step 3: Restart server:

```bash
# Kill old server
lsof -ti:7712 | xargs kill -9

# Start new server
cd "/Users/michaeldurante/ai dev/ce-hub"
node glasses-compositor-server.js
```

### Step 4: Open in browser:

```
http://localhost:7712/glasses-compositor
```

## Cost Breakdown:

| Component | Service | Cost |
|-----------|---------|------|
| Analysis | Open Router (Claude 3.5) | ~$0.0005 |
| Generation | Together AI (SDXL) | ~$0.001 |
| **Total** | | **~$0.0015 per image** |

**With $5 free credit = ~3,333 images!**

## Why This Combo is Best:

✅ **Claude 3.5 via Open Router** - Best vision analysis, understands faces/glasses perfectly
✅ **Together AI SDXL** - Cheapest image generation ($0.001)
✅ **Total cost under $0.002** per high-quality image
✅ **Better than GLM** - Claude 3.5 is superior for analysis

## Alternative: Just GLM (No new keys needed)

If you don't want to add Together AI, I can switch to GLM-only version:
- Uses your existing GLM_API_KEY
- Cost: ~$0.002 per image
- Quality: Good, but not as good as Claude

Just let me know if you want to use GLM instead!
