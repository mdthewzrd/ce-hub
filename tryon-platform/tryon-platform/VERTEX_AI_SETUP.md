# Vertex AI Service Account Setup Guide

## Step 1: Create a Service Account in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (or create a new one)
3. Navigate to: **IAM & Admin** > **Service Accounts**
4. Click **+ Create Service Account**
5. Enter service account details:
   - Name: `vertex-ai-service`
   - Description: `Service account for Vertex AI API access`
6. Click **Create and Continue**

## Step 2: Grant Required Permissions

Assign the following roles to your service account:
- **Vertex AI User** (`roles/aiplatform.user`) - Required for Vertex AI API
- **Service Account Token Creator** (`roles/iam.serviceAccountTokenCreator`) - For authentication

## Step 3: Create and Download Service Account Key

1. Click on the service account you just created
2. Go to **Keys** tab
3. Click **Add Key** > **Create New Key**
4. Select **JSON** format
5. Click **Create** - this will download a JSON file

## Step 4: Configure the Application

### Option A: Set Environment Variable (Recommended)
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"
```

### Option B: Add to .env.local
Copy the contents of your service account JSON and add to `.env.local`:
```bash
GOOGLE_CREDENTIALS='{"type":"service_account","project_id":"..."}'
```

## Step 5: Enable Required APIs

In Google Cloud Console, enable these APIs for your project:
1. **Vertex AI API** - https://console.cloud.google.com/apis/library/aiplatform.googleapis.com
2. **Cloud Resource Manager API** - https://console.cloud.google.com/apis/library/cloudresourcemanager.googleapis.com

## Step 6: Restart the Server

After setting up the service account key:
```bash
# Kill the current server (Ctrl+C)
# Then restart with the new credentials:
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
cd /Users/michaeldurante/ai\ dev/ce-hub/tryon-platform/tryon-platform
npm run dev
```

## Verification

Test the setup by visiting: http://localhost:7771

The application should now use Vertex AI with your Google Cloud credits!

---

## Troubleshooting

### "Permission denied" errors
- Verify the service account has the `Vertex AI User` role
- Check that the correct project is selected in gcloud: `gcloud config set project YOUR_PROJECT_ID`

### "API key not valid" warnings
- The `GEMINI_API_KEY` in `.env.local` is still used as a fallback
- With `vertexai: true`, the service account credentials are primary

### Region errors
- Ensure your Google Cloud project is in a supported region
- Supported regions: `us-central1`, `us-west1`, `us-east1`, `europe-west1`, `europe-west4`
