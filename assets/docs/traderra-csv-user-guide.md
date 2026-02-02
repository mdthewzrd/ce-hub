# Traderra CSV Upload - User Support Manual

## Quick Start Guide

### Overview
The Traderra CSV upload feature allows you to import your trading data from various brokers and platforms, including TradervUE, TD Ameritrade, Interactive Brokers, and others. This guide will help you successfully upload your trades and troubleshoot any issues.

### Supported Formats
- **TradervUE Export Files** (.csv)
- **TD Ameritrade Trade History** (.csv)
- **Interactive Brokers Flex Queries** (.csv)
- **Generic CSV** (with required columns)

### File Requirements
- **Format**: CSV files only (.csv extension)
- **Size Limit**: Maximum 50MB per file
- **Encoding**: UTF-8, Latin-1, or Windows-1252
- **Required Columns**: Symbol, Action, Quantity, Price, Date

## Step-by-Step Upload Process

### Step 1: Prepare Your CSV File

#### From TradervUE
1. Log into your TradervUE account
2. Navigate to "Trades" → "Export"
3. Select date range for your trades
4. Choose "CSV" format
5. Download the exported file
6. **No modifications needed** - file is ready for upload

#### From TD Ameritrade
1. Log into TD Ameritrade
2. Go to "My Account" → "History & Statements"
3. Select "Transactions"
4. Choose date range
5. Export as CSV
6. **Note**: Manual review may be needed for options formatting

#### From Interactive Brokers
1. Log into Account Management
2. Navigate to "Reports" → "Flex Queries"
3. Create/run Trade Confirmation query
4. Download CSV format
5. **Note**: Symbol format may need adjustment for options

### Step 2: Upload Your File

1. **Navigate to Upload Page**
   - Go to Traderra dashboard
   - Click "Import Trades" or "Upload CSV"

2. **Select Your File**
   - Click "Choose File" or drag-and-drop your CSV
   - File name should appear below button
   - Green checkmark indicates file is ready

3. **Preview Validation (Recommended)**
   - Click "Preview" to validate before uploading
   - Review detected format and sample data
   - Check for any validation warnings

4. **Upload and Process**
   - Click "Upload" to begin processing
   - Progress bar shows processing status
   - Wait for completion message

### Step 3: Review Results

1. **Success Summary**
   - Total trades processed
   - Valid trades imported
   - Any validation errors or warnings

2. **Verify Your Data**
   - Check trade list for completeness
   - Verify PnL calculations are accurate
   - Confirm dates and symbols are correct

## Common Issues and Solutions

### 🚫 Upload Failed: "File Format Not Recognized"

**Cause**: CSV format doesn't match expected structure

**Solution**:
1. Check that file has .csv extension
2. Open file in Excel/Google Sheets to verify data structure
3. Ensure required columns are present:
   - Symbol (stock/option symbol)
   - Action (BUY, SELL, etc.)
   - Quantity (number of shares/contracts)
   - Price (entry/exit price)
   - Date (trade date)

**Example Fix**:
```
❌ Wrong header: "Stock Symbol" → ✅ Correct: "Symbol"
❌ Wrong header: "Trade Type" → ✅ Correct: "Action"
```

### 🚫 Upload Failed: "Invalid Date Format"

**Cause**: Date format not recognized by system

**Supported Formats**:
- `MM/DD/YYYY` (US format)
- `YYYY-MM-DD` (ISO format)
- `DD/MM/YYYY` (European format)
- `MM-DD-YYYY` (US with dashes)

**Solution**:
1. Open CSV in Excel/Google Sheets
2. Select date column
3. Format as one of the supported formats
4. Save and re-upload

### 🚫 Partial Upload: "Only Some Trades Imported"

**Cause**: Some trades failed validation

**Check For**:
1. **Missing Required Data**
   - Empty symbol, quantity, or price fields
   - Invalid or missing dates

2. **Options Trade Issues**
   - For manual entries: Symbol and basic info is sufficient
   - For TradervUE imports: Strike price and expiry required

3. **Data Format Issues**
   - Non-numeric values in price/quantity fields
   - Special characters in symbol names

**Solution Steps**:
1. Download error report from upload results
2. Fix indicated issues in original CSV
3. Re-upload corrected file

### 🚫 Error: "File Too Large"

**Cause**: CSV file exceeds 50MB limit

**Solution**:
1. **Split Large Files**
   - Break into smaller date ranges
   - Upload multiple files separately

2. **Optimize File Size**
   - Remove unnecessary columns
   - Compress whitespace/formatting

### 🚫 Error: "PnL Calculations Don't Match"

**Cause**: Commission or fee calculation differences

**Troubleshooting**:
1. **Check Commission Components**
   - Verify all fees are included in original file
   - SEC fees, TAF fees, FINRA fees should be separate columns

2. **Decimal Precision**
   - Ensure prices have appropriate decimal places
   - Round to 2-4 decimal places for currencies

3. **Options Multiplier**
   - Options contracts multiply by 100 automatically
   - Single contract = 100 shares equivalent

### 🚫 Options Trades Rejected

**For TradervUE Imports**:
- Strike price and expiry date are required
- Symbol format: `AAPL240315C150` (Stock + Date + Call/Put + Strike)

**For Manual Entries**:
- Strike price and expiry date are optional
- Basic symbol information is sufficient

**Solution**:
```
✅ TradervUE Format:
Symbol: AAPL240315C150
Strike: 150.00
Expiry: 2024-03-15

✅ Manual Entry Format:
Symbol: AAPL Call Option
Strike: (optional)
Expiry: (optional)
```

## Advanced Troubleshooting

### Encoding Issues

**Symptoms**: Strange characters, garbled text
**Cause**: File encoding not supported

**Solution**:
1. Open CSV in text editor (Notepad++, VSCode)
2. Save as UTF-8 encoding
3. Re-upload file

### Large File Performance

**Symptoms**: Upload times out or fails
**Optimization Tips**:
1. Upload during off-peak hours
2. Split files by date ranges
3. Remove unnecessary columns before upload
4. Ensure stable internet connection

### Data Validation Errors

**Common Validation Issues**:

1. **Invalid Symbol Format**
   ```
   ❌ Wrong: "APPLE INC"
   ✅ Correct: "AAPL"
   ```

2. **Invalid Action Values**
   ```
   ❌ Wrong: "Purchase", "Sale"
   ✅ Correct: "BUY", "SELL"
   ```

3. **Invalid Quantities**
   ```
   ❌ Wrong: "1.5 shares"
   ✅ Correct: "1" or "2"
   ```

### Performance Issues

**If Upload is Slow**:
1. Check file size (smaller files process faster)
2. Verify internet connection stability
3. Try uploading during off-peak hours
4. Contact support if issues persist

## Data Format Reference

### Required Columns

| Column Name | Description | Example | Required |
|-------------|-------------|---------|----------|
| Symbol | Stock/option symbol | AAPL, TSLA240315C200 | Yes |
| Action | Trade action | BUY, SELL, SHORT, COVER | Yes |
| Quantity | Number of shares/contracts | 100, 1, 50 | Yes |
| Price | Entry or exit price | 150.25, 5.50 | Yes |
| Date | Trade execution date | 2024-01-15, 01/15/2024 | Yes |

### Optional Columns

| Column Name | Description | Example | Notes |
|-------------|-------------|---------|-------|
| Commission | Trading commission | 1.50, 0.65 | Improves PnL accuracy |
| SEC Fee | SEC regulatory fee | 0.25 | For US trades |
| TAF Fee | Trading Activity Fee | 0.10 | For US trades |
| Strike Price | Options strike price | 150.00 | Required for TradervUE options |
| Expiry Date | Options expiry | 2024-03-15 | Required for TradervUE options |

### Symbol Format Guidelines

#### Stock Symbols
```
✅ Correct: AAPL, TSLA, MSFT
❌ Incorrect: Apple Inc., Tesla Motors
```

#### Options Symbols

**TradervUE Format**:
```
✅ Format: AAPL240315C150
   - AAPL = underlying stock
   - 240315 = expiry date (YYMMDD)
   - C = Call option (P for Put)
   - 150 = strike price
```

**Alternative Formats**:
```
✅ Also Accepted: AAPL 03/15/24 150 Call
✅ Also Accepted: AAPL_031524C150
```

## FAQ - Frequently Asked Questions

### Q: Can I upload multiple CSV files at once?
**A**: Currently, you can upload one file at a time. For multiple files, upload them sequentially.

### Q: Will uploading duplicate trades create duplicates in my account?
**A**: The system includes duplicate detection. Identical trades (same symbol, date, price, quantity) will be flagged and require confirmation before importing.

### Q: How do I know if my PnL calculations are correct?
**A**: The system validates PnL calculations against your original data. Any discrepancies will be highlighted in the upload results. You can also manually verify a few trades to confirm accuracy.

### Q: Can I edit trades after uploading?
**A**: Yes, uploaded trades can be edited individually through the trade management interface. Bulk editing is available for certain fields.

### Q: What happens if my upload fails partway through?
**A**: The system processes trades in batches. Successfully processed trades are saved even if later batches fail. You can re-upload the file to process remaining trades.

### Q: How long are my uploaded files stored?
**A**: CSV files are processed immediately and not permanently stored. Only the extracted trade data is saved to your account.

### Q: Can I download my trades back to CSV format?
**A**: Yes, you can export your trades from Traderra back to CSV format at any time through the export feature.

### Q: Why are some of my options trades missing strike prices?
**A**: For manual entries, strike prices are optional. For imported TradervUE data, strike prices are required and missing data indicates an issue with the original export.

### Q: My broker isn't listed in supported formats. Can I still upload?
**A**: Yes, as long as your CSV contains the required columns in a recognizable format. The system attempts to auto-detect the format, and you can manually map columns if needed.

### Q: How do I report an issue or get additional support?
**A**:
- Check this troubleshooting guide first
- Visit the Help Center for additional resources
- Contact support at support@traderra.com
- Include your upload error details and a sample of your CSV data (with sensitive information removed)

## Contact Support

### When to Contact Support
- Upload fails consistently despite following troubleshooting steps
- PnL calculations appear incorrect after verification
- Large-scale data import issues
- Questions about data security or privacy
- Feature requests or enhancement suggestions

### Information to Include
1. **Error Details**
   - Exact error message
   - Screenshot of error screen
   - Steps that led to the error

2. **File Information**
   - Source platform (TradervUE, TD Ameritrade, etc.)
   - Approximate file size and number of trades
   - Sample of CSV data (remove sensitive information)

3. **Expected vs. Actual Results**
   - What you expected to happen
   - What actually happened
   - Any discrepancies in data or calculations

### Support Channels
- **Email**: support@traderra.com
- **Help Center**: help.traderra.com
- **Live Chat**: Available during business hours (9 AM - 6 PM EST)

### Response Times
- **Critical Issues**: Within 4 hours
- **General Support**: Within 24 hours
- **Feature Requests**: Within 72 hours

---

*This user guide is updated regularly. For the latest version and additional resources, visit our Help Center at help.traderra.com*