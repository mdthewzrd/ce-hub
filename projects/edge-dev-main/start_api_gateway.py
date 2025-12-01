#!/usr/bin/env python3
"""
Startup script for API Gateway with proper environment loading
"""

import os
import sys
from pathlib import Path

def load_env():
    """Load environment variables from .env file"""
    env_path = Path(__file__).parent / '.env'

    if env_path.exists():
        print(f"📄 Loading environment from {env_path}")
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()
                    print(f"   {key.strip()}=***{value.strip()[-4:]}")
    else:
        print(f"⚠️  .env file not found at {env_path}")

def main():
    """Start the API Gateway service"""
    print("🚀 Starting API Gateway with Environment Loading")
    print("=" * 50)

    # Load environment variables
    load_env()

    # Check critical environment variables
    openrouter_key = os.getenv('OPENROUTER_API_KEY')
    if openrouter_key:
        print(f"✅ OpenRouter API Key loaded: {openrouter_key[:10]}...{openrouter_key[-10:]}")
    else:
        print("❌ OpenRouter API Key not found")

    # Change to the correct directory
    service_dir = Path(__file__).parent / 'pydantic-ai-service'
    if service_dir.exists():
        os.chdir(service_dir)
        print(f"📁 Changed to directory: {service_dir}")
    else:
        print(f"❌ Service directory not found: {service_dir}")
        sys.exit(1)

    # Import and start the service
    print("🚀 Starting API Gateway service...")
    try:
        from app.main_glm_enhanced import app
        import uvicorn

        uvicorn.run(app, host="0.0.0.0", port=8001, reload=False)
    except ImportError as e:
        print(f"❌ Import error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Startup error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()