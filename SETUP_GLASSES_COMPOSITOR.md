# Glasses Compositor - Setup Guide

## Quick Setup (2 minutes)

### Step 1: Get Free Together AI API Key

1. Go to https://together.ai
2. Sign up (free - no credit card required)
3. Get your API key from: https://api.together.xyz/settings/api-keys
4. Free tier: $5 in credits (enough for ~5,000 images!)

### Step 2: Add API Key to .env

```bash
cd "/Users/michaeldurante/ai dev/ce-hub"
echo "TOGETHER_API_KEY=your_key_here" >> .env
```

### Step 3: Start the Server

```bash
cd "/Users/michaeldurante/ai dev/ce-hub"
node glasses-compositor-server.js
```

### Step 4: Open in Browser

```
http://localhost:7712/glasses-compositor
```

## How It Works

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Upload Images  │ ──>  │ Claude Analysis  │ ──>  │ Together AI SDXL│
│  Person + Glasses│      │  (OpenRouter)    │      │  Generation     │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                                        ↓
                                              ┌─────────────────┐
                                              │  Download Result│
                                              │  (with glasses) │
                                              └─────────────────┘
```

## Cost Breakdown

| Quality | Resolution | Cost per Image |
|---------|-----------|----------------|
| Draft   | 768px     | $0.001         |
| Standard| 768px     | $0.002         |
| High    | 1024px    | $0.003         |

**$5 free credit = ~5,000 images!**

## Alternative Services

If you prefer other services, add their API key:

```bash
# Replicate (~$0.002/image)
echo "REPLICATE_API_TOKEN=your_key" >> .env

# Fal.ai (~$0.0015/image)
echo "FAL_KEY=your_key" >> .env

# Google Gemini (free tier)
echo "GEMINI_API_KEY=your_key" >> .env
```

Then I can update the code to use your preferred service.

## Troubleshooting

**"TOGETHER_API_KEY not configured"**
→ Add your API key to .env file

**"OPENROUTER_API_KEY not configured"**
→ You already have this in your .env file

**Generation fails**
→ Check that you have credits in your Together AI account
