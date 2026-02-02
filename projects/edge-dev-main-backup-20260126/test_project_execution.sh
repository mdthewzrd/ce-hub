#!/bin/bash

echo "🧪 Testing Project Execution API..."

# Test the exact project execution API call
curl -X POST http://localhost:5656/api/projects/1765138735846/execute \
  -H "Content-Type: application/json" \
  -d '{
    "date_range": {
      "start_date": "2025-01-01",
      "end_date": "2025-11-01"
    },
    "timeout_seconds": 300
  }' | jq '.'