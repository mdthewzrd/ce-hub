#!/bin/bash

echo "=========================================================================="
echo "📊 FINAL RESULTS COMPARISON"
echo "=========================================================================="
echo ""

# Check Renata output
echo "=== RENATA SCANNER RESULTS ==="
if [ -f /tmp/renata_output.log ]; then
    echo "Signals Found:"
    grep "Final signals" /tmp/renata_output.log || echo "Not found"
    echo ""
    echo "Unique Tickers:"
    grep "Unique tickers:" /tmp/renata_output.log || echo "Not found"
    echo ""
    echo "Stages Completed:"
    grep "Stage.*Complete" /tmp/renata_output.log || echo "Not found"
fi

echo ""
echo "=== WORKING REFERENCE RESULTS ==="
if [ -f /tmp/working_output.log ]; then
    echo "Signals Found:"
    grep "Final signals" /tmp/working_output.log || echo "Not found"
    echo ""
    echo "Unique Tickers:"
    grep "Unique tickers:" /tmp/working_output.log || echo "Not found"
    echo ""
    echo "Stages Completed:"
    grep "Stage.*Complete" /tmp/working_output.log || echo "Not found"
fi

echo ""
echo "=========================================================================="
echo "📋 SIGNALS COMPARISON"
echo "=========================================================================="
echo ""

RENATA_SIGNALS=$(grep "Final signals (D0 range):" /tmp/renata_output.log | grep -oE "[0-9]+" || echo "0")
WORKING_SIGNALS=$(grep "Final signals (D0 range):" /tmp/working_output.log | grep -oE "[0-9]+" || echo "0")

echo "Renata: $RENATA_SIGNALS signals"
echo "Working Reference: $WORKING_SIGNALS signals"
echo ""

if [ "$RENATA_SIGNALS" = "$WORKING_SIGNALS" ] && [ "$RENATA_SIGNALS" != "0" ]; then
    echo "✅✅✅ PERFECT MATCH! Both scanners found $RENATA_SIGNALS signals!"
elif [ "$RENATA_SIGNALS" != "0" ] && [ "$WORKING_SIGNALS" != "0" ]; then
    DIFF=$((WORKING_SIGNALS - RENATA_SIGNALS))
    echo "Signal difference: $DIFF"
fi

echo ""
echo "=========================================================================="
echo "📄 CSV FILES"
echo "=========================================================================="
echo ""

if [ -f /tmp/scanner_results.csv ]; then
    RENATA_CSV_LINES=$(wc -l < /tmp/scanner_results.csv)
    echo "Renata CSV: $RENATA_CSV_LINES lines (including header)"
    echo ""
    echo "First 10 signals from Renata:"
    head -11 /tmp/scanner_results.csv
fi

echo ""
echo "=========================================================================="

# Check for TypeError
echo ""
echo "=== ERROR CHECK ==="
if grep -q "TypeError.*unsupported operand" /tmp/renata_output.log; then
    echo "❌ Renata: TypeError with grouped operations"
else
    echo "✅ Renata: No TypeError - grouped operations working!"
fi

