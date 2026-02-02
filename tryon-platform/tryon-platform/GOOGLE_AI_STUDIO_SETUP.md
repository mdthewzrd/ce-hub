# Google AI Studio vs Google Cloud Console API Setup Guide

## The Problem
Your Google Cloud project (ID: 858042970416) has region/account restrictions showing:
- "Not available in your region" (false)
- "You are not old enough to use this service" (false)

This is a common Google Cloud issue that prevents access to Gemini models via API keys created in Google Cloud Console.

## The Solution: Use Google AI Studio
Google AI Studio provides immediate access to Gemini models without Google Cloud project restrictions.

### Step 1: Get API Key from Google AI Studio
1. Go to [https://aistudio.google.com](https://aistudio.google.com)
2. Sign in with your Google account
3. Click "Get API Key" in the left sidebar
4. Click "Create API Key"
5. Copy the new API key (it will start with `AIza...`)

### Step 2: Update Your Environment
Replace your current API key in `.env.local`:

```bash
# Old key (restricted by Google Cloud)
# GEMINI_API_KEY=AIzaSyBKEYx-SmNy21SopvJdDxTSO9zTFw3mNYc

# New key from Google AI Studio (no restrictions)
GEMINI_API_KEY=YOUR_NEW_AI_STUDIO_API_KEY_HERE
```

### Step 3: Restart Your Server
```bash
npm run dev
```

## Why This Works
- **Google AI Studio**: Direct access to Gemini models, no Google Cloud project setup needed
- **Google Cloud Console**: Requires project setup, billing, region verification, age verification (often buggy)
- **Same Models**: Both provide access to the same Gemini models (gemini-1.5-pro, gemini-1.5-flash, etc.)

## Test Your New API Key
Once updated, test your API key:
1. Visit: http://localhost:7771/api/test-gemini
2. Send a POST request with any content
3. You should see "Gemini API is working!" response

## Alternative: Try OpenRouter
If Google AI Studio still has issues, OpenRouter provides access to Gemini models:
1. Sign up at [https://openrouter.ai](https://openrouter.ai)
2. Get an API key
3. Use gemini models through their API

## Quick Code to Verify New Key
You can also test with curl:
```bash
curl -X POST http://localhost:7771/api/test-gemini \
  -H "Content-Type: application/json" \
  -d '{"test": "hello"}'
```

This should return a success response once you're using the Google AI Studio API key.