#!/bin/bash
cd "$(dirname "$0")"
# Load from .env.local first (has the valid key)
if [ -f .env.local ]; then
  export $(cat .env.local | grep OPENROUTER | grep -v '^#' | xargs)
fi
echo "Starting backend with API key from .env.local: ${OPENROUTER_API_KEY:0:20}..."
python3 backend/main.py
