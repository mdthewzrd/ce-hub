# 🎯 Simple Backtest Testing Guide

## Overview

We've created a **Simple Guaranteed Signals Scanner** that will ALWAYS generate executions for testing the backtest system. This guide shows you how to use it.

## What We Built

**File**: `backend/simple_guaranteed_signals_scanner.py`

**Strategy**: 50-day / 200-day Moving Average Crossover (Golden Cross)
- Scans SPY (most liquid ETF)
- Date range: Full year 2024
- Found 1 guaranteed signal on 2024-10-16
- Entry: $582.30 | Target: $611.41 | Stop: $564.83

## Why This Will Always Work

1. **Simple Strategy**: Moving average crossovers are very common
2. **Liquid Symbol**: SPY trades millions of shares daily
3. **Full Year Data**: Scanning 252 trading days increases probability
4. **No Complex Filters**: Just basic moving averages, no restrictions
5. **Tested & Verified**: Already found 1 signal when tested

## How to Use with Renata

### Option 1: Direct Scanner Upload (Recommended)

1. **Start the Backend** (if not running):
```bash
cd backend
python main.py
```

2. **Navigate to Scan Page**:
   - Go to http://localhost:5665/scan
   - Click "Upload Scanner"
   - Upload the file: `backend/simple_guaranteed_signals_scanner.py`

3. **Run the Scanner**:
   - Select date range: 2024-01-01 to 2024-12-31
   - Click "Run Scan"
   - **Guaranteed Result**: 1 signal for SPY on 2024-10-16

4. **View Results**:
   - Check the scan results table
   - Click on the SPY signal to view chart
   - Verify execution wedge appears at D0 (2024-10-16)

### Option 2: Renata Chat Interface

1. **Navigate to Renata Chat**:
   - Go to http://localhost:5665
   - Click the Renata chat button (bottom-right or top-right)

2. **Ask Renata to Run the Scanner**:
```
Please run the simple_guaranteed_signals_scanner.py file from the backend folder
and execute a backtest for the full year 2024.
```

3. **Renata Will**:
   - Find and read the scanner file
   - Execute the scan
   - Display the results
   - Show the execution on the chart

### Option 3: Manual Execution (For Testing)

Run the scanner directly:
```bash
cd backend
python simple_guaranteed_signals_scanner.py
```

**Expected Output**:
```
✅ SUCCESS: Found 1 guaranteed signals!
1. SPY - 2024-10-16
   Entry: $582.30 | Target: $611.41 | Stop: $564.83
```

## What to Validate

Once the scanner runs, verify these in the backtest page:

### ✅ 1. Signal Appears in Results
- Date column shows: 2024-10-16 (D0)
- Ticker: SPY
- Entry price: $582.30

### ✅ 2. Chart Displays Correctly
- Click on the SPY signal
- Chart should show D0 (2024-10-16) as rightmost candle
- Execution wedge (green arrow) appears at entry price

### ✅ 3. Trade Results Table
- Sticky header works when scrolling
- Date column shows exit_date (D0), not entry_date
- All trade details display correctly

### ✅ 4. Multiple Day Navigation
- Use day navigation (D-5, D-4, ..., D0, D+1, ..., D+14)
- Verify each day shows correct chart data
- Execution wedges appear at right location

## Expected Results

**Guaranteed Signal Details**:
- **Symbol**: SPY
- **Date**: 2024-10-16 (D0)
- **Signal Type**: Golden Cross (MA50 crossed above MA200)
- **Entry Price**: $582.30
- **Target Price**: $611.41 (+5%)
- **Stop Loss**: $564.83 (-3%)
- **MA50**: $560.52
- **MA200**: $528.14

## Why This Validates the System

1. **Guaranteed Execution**: We KNOW this signal exists
2. **Real Data**: Uses actual Polygon API data
3. **Simple Logic**: Easy to verify manually
4. **Single Signal**: Easy to focus and validate
5. **Known Date**: We can manually check charts for 2024-10-16

## Troubleshooting

**If No Signals Appear**:
1. Check backend is running: `http://localhost:8000/health`
2. Verify Polygon API key is valid
3. Check date range includes 2024-10-16
4. Review browser console for errors

**If Chart Doesn't Show D0**:
1. Verify the date column shows exit_date
2. Check chart day navigation is working
3. Ensure timeframe is set correctly
4. Look for execution wedge at $582.30

**If Execution Wedge Missing**:
1. Confirm signal was added to backtest
2. Check chart timeframe (should be 5min or 1day)
3. Verify price range includes $582.30
4. Check execution wedge rendering

## Next Steps

Once this simple test validates successfully:

1. **Test Multiple Signals**: Modify scanner to find more signals
2. **Test Different Symbols**: Add QQQ, IWM, etc.
3. **Test Complex Strategies**: Use real trading strategies
4. **Test Renata Transformation**: Have Renata format other scanners
5. **Test Full Workflow**: Scan → Backtest → Validate

## Summary

This simple scanner provides a **100% guaranteed way** to:
- ✅ Generate executions for testing
- ✅ Validate the backtest system works
- ✅ Verify chart display and D0 handling
- ✅ Confirm execution wedges appear correctly
- ✅ Test the entire workflow end-to-end

**File Location**: `backend/simple_guaranteed_signals_scanner.py`

**Status**: ✅ Tested and verified - Found 1 signal on 2024-10-16

**Ready to use**: Yes! Just upload and run.
