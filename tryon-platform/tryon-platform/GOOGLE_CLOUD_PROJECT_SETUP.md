# How to Create a New Google Cloud Project for Gemini API Access

## The Issue
Your current project (ID: 858042970416) has region restrictions preventing Gemini API access, despite having $300 in credits.

## Solution: Create a New Project in a Supported Region

### Step 1: Create New Google Cloud Project
1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown at the top
3. Click "NEW PROJECT"
4. Project name: `Gemini API Project` (or any name)
5. **IMPORTANT**: Choose a supported region:
   - United States: `us-central1` (Iowa)
   - United States: `us-west1` (Oregon)
   - United States: `us-west2` (Los Angeles)
   - Europe: `europe-west1` (Belgium)
   - Europe: `europe-west4` (Netherlands)

### Step 2: Enable Billing for New Project
1. In your new project, go to billing
2. Link your existing billing account (the one with $300 credits)
3. Your credits will automatically apply to the new project

### Step 3: Enable Gemini API
1. In your new project, go to "APIs & Services" > "Library"
2. Search for "Generative Language API"
3. Click "Enable"

### Step 4: Create API Key
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the new API key

### Step 5: Update Your Environment
Replace your `.env.local` file:
```bash
# New project API key
GEMINI_API_KEY=YOUR_NEW_PROJECT_API_KEY_HERE
```

### Step 6: Test
```bash
npm run dev
# Then visit: http://localhost:7771/api/test-gemini
```

## Supported Regions
Google services work best in these regions:
- **North America**: us-central1, us-west1, us-west2, us-east1
- **Europe**: europe-west1, europe-west4, europe-west3
- **Asia**: asia-southeast1, asia-northeast1

## If You Still Get Region Errors
Try creating the project with a VPN set to:
- United States
- United Kingdom
- Germany
- Canada

Once the project is created in a supported region, your $300 credits will work perfectly with Gemini!

## Quick Test Script
```bash
curl -X POST http://localhost:7771/api/test-gemini \
  -H "Content-Type: application/json" \
  -d '{"test": "hello"}'
```

This should return success with your new project's API key.