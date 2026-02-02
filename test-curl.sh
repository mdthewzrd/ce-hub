#!/bin/bash

echo "Testing Project Execution Endpoint with curl"

curl -X POST http://localhost:8000/api/projects/test123/execute \
  -H "Content-Type: application/json" \
  -d '{"date_range":{"start_date":"2025-01-01","end_date":"2025-11-01"},"scanner_code":"test code"}'

echo -e "\n\nTesting existing scan endpoint (should work):"

curl -X POST http://localhost:8000/api/scan/execute \
  -H "Content-Type: application/json" \
  -d '{"start_date":"2025-01-01","end_date":"2025-11-01","scanner_type":"uploaded","uploaded_code":"test code"}'