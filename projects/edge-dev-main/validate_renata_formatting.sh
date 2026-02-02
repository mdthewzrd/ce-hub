#!/bin/bash

# Renata Formatting Validation Script
# Run this anytime to verify Renata's formatting is working correctly

echo "=========================================================================="
echo "RENATA FORMATTING VALIDATION"
echo "=========================================================================="
echo ""

# Check if Python test exists
if [ -f "/tmp/renata_formatting_validation.py" ]; then
    python /tmp/renata_formatting_validation.py
else
    echo "❌ Error: Validation test not found at /tmp/renata_formatting_validation.py"
    echo "Please ensure the test file exists."
    exit 1
fi
