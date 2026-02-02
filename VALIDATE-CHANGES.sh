#!/bin/bash

# CE-Hub Quick Validation Command
# Run this after making any changes to validate they work

echo "🔍 CE-Hub Validation - Checking your changes..."
echo ""

cd "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main"

# Run quick validation
npm run test:quick

# Get exit code
EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ **Validation Results: PASSED** - Your changes are ready!"
    echo "   - Page loads correctly"
    echo "   - Mobile responsive"
    echo "   - No critical errors"
else
    echo "⚠️ **Validation Results: NEEDS ATTENTION**"
    echo "   - Some tests failed - check the report above"
    echo "   - Fix issues before considering changes complete"
fi

echo ""
echo "📊 Full report: http://localhost:9323"