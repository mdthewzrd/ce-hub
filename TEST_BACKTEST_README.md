# 🧪 Test Backtest Scanner - Quick Start Guide

## 📁 File Location

```
/Users/michaeldurante/ai dev/ce-hub/TEST_BACKTEST_SCANNER.py
```

## 🚀 How to Test the /backtest Page

### Step 1: Navigate to Backtest Page
```
http://localhost:5665/backtest
```

### Step 2: Upload the Test Scanner
1. Click the **"New Backtest"** button (bottom-left corner)
2. The **Renata AI** popup will appear
3. Upload the `TEST_BACKTEST_SCANNER.py` file
4. The system will parse and execute the backtest

### Step 3: Expected Results

**What Should Happen:**
✅ File upload succeeds
✅ Scanner parameters are extracted
✅ Backtest runs on historical data (Polygon API)
✅ Trades are generated (10-20 expected)
✅ Statistics are calculated (50+ metrics)
✅ Results appear in the panels

**Expected Performance:**
- **Total Return**: 5-12% (over 6 months)
- **Win Rate**: 50-60%
- **Max Drawdown**: <15%
- **Sharpe Ratio**: 0.8-1.5
- **Profit Factor**: 1.3-1.8

## 📊 Test Scanner Details

### Strategy: R-Multiple Mean Reversion

**Entry Logic:**
- **Long**: RSI < 30 AND price below lower Bollinger Band
- **Short**: RSI > 70 AND price above upper Bollinger Band

**Risk Management:**
- **Stop Loss**: 2R (2 × ATR from entry)
- **Profit Target**: 1.5R (1.5 × risk distance)
- **Position Sizing**: 1% of equity per trade
- **Max Positions**: 10 concurrent

**Universe:**
```
AAPL, MSFT, GOOGL, AMZN, META, NVDA, TSLA
```

**Test Period:**
```
June 1, 2024 → December 31, 2024 (6 months)
```

## 🔍 What This Tests

**1. File Upload System**
- Scanner code upload
- Parameter extraction
- Metadata parsing

**2. Backtest Engine**
- Historical data fetching (Polygon API)
- Signal generation
- Trade execution simulation
- Slippage and commission calculation

**3. Statistics Calculation**
- Core performance metrics (15)
- Trade statistics (12)
- Risk metrics (10)
- R-multiple analysis (8)
- Validation metrics (13)

**4. UI Components**
- Results panel (trade list)
- Statistics panel (5 tabs)
- Charts area (equity curve, trades)
- Renata popup integration

## 📈 Expected Output Format

### Trade List (Results Panel)
```
Ticker  | Entry Date  | Exit Date  | P&L      | R-Multiple
--------|-------------|------------|----------|------------
AAPL    | 2024-06-15  | 2024-06-18  | +$245.00 | +0.67R
MSFT    | 2024-06-20  | 2024-06-25  | +$312.00 | +1.12R
GOOGL   | 2024-07-02  | 2024-07-08  | -$178.00 | -0.89R
...
```

### Statistics Panel (Core Tab)
```
Total Return:   7.5%
CAGR:           8.2%
Max Drawdown:   -8.9%
Sharpe Ratio:   1.23
Win Rate:       58%
Profit Factor:  1.65
```

### R-Multiple Tab
```
Avg R-Multiple:     0.45R
Expectancy (R):     0.23R
Best Trade:         2.4R
Worst Trade:        -1.8R
```

## 🛠️ Troubleshooting

**If upload fails:**
1. Check file is at correct path
2. Verify Python code is valid (no syntax errors)
3. Check browser console for errors

**If no trades generated:**
1. Verify Polygon API is accessible
2. Check date range (needs historical data)
3. Ensure symbols are valid

**If statistics look wrong:**
1. Check parameters (initial capital, risk %)
2. Verify stop/target calculations
3. Review trade log for anomalies

## 🎯 Success Criteria

The test is **SUCCESSFUL** if:
- ✅ File uploads without errors
- ✅ Backtest completes in <30 seconds
- ✅ Trade list appears with 10-20 trades
- ✅ All statistics tabs show data
- ✅ Charts render correctly
- ✅ P&L sums match total return
- ✅ R-multiples are calculated correctly

## 📝 Notes

- This is a **MEAN REVERSION** strategy (tends to be reliable)
- Uses **R-MULTIPLE** position sizing (industry standard)
- **Conservative** risk management (1% per trade)
- **No pyramiding** (simpler to validate)
- **Synthetic parameters** (for testing only)

## 🚀 Next Steps After Testing

Once the test passes, you can:
1. **Modify parameters** to test different configurations
2. **Upload your own scanners** from /scan page
3. **Use Renata AI** to create custom strategies
4. **Compare multiple backtests** side-by-side
5. **Run validation** (walk-forward, Monte Carlo)

---

**Created**: January 9, 2025
**Purpose**: Test /backest page functionality
**Status**: Ready for upload ✅
