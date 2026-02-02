# Journal Data Mapping Validation

## Content Item to Folder Mapping Verification

This document provides the exact expected mappings between content items and folders for validation testing.

## Folder Structure with Expected Content

### 📁 Trading Journal (folder-1)
**Expected Total: 8 entries (sum of all children)**

#### 📅 Daily Trades (folder-1-1) - 2 entries
1. **Strong Momentum Play on YIBO** (content-1)
   - Symbol: YIBO
   - Entry: $49.86 → Exit: $51.52
   - P&L: +$531.20
   - Date: 2024-01-29
   - Category: win, Emotion: confident

2. **Quick Loss on YIBO Reversal** (content-2)
   - Symbol: YIBO
   - Entry: $52.15 → Exit: $51.45
   - P&L: -$84.00
   - Date: 2024-01-29
   - Category: loss, Emotion: frustrated

#### 📋 Daily Reviews (folder-1-2) - 5 entries
1. **Daily Review - January 2nd, 2025** (content-5)
   - Date: 2025-01-02
   - Total Trades: 2, Win Rate: 100%
   - Total P&L: +$485.20

2. **Daily Review - January 3rd, 2025** (content-6)
   - Date: 2025-01-03
   - Total Trades: 4, Win Rate: 75%
   - Total P&L: +$1,485.75

3. **Daily Review - January 9th, 2025** (content-7)
   - Date: 2025-01-09
   - Total Trades: 5, Win Rate: 80%
   - Total P&L: +$1,245.60

4. **Daily Review - January 15th, 2025** (content-8)
   - Date: 2025-01-15
   - Total Trades: 3, Win Rate: 100%
   - Total P&L: +$985.40

5. **Daily Review - January 30th, 2025** (content-9)
   - Date: 2025-01-30
   - Total Trades: 6, Win Rate: 83.33%
   - Total P&L: +$1,485.90

#### ⭐ Weekly Reviews (folder-1-3) - 1 entry
1. **Weekly Review - January 2024** (content-10)
   - Week Performance: 8 trades, 75% win rate
   - Total P&L: +$2,105.80
   - Best Trade: LPO swing (+$1,636.60)

### 📁 Strategies (folder-2)
**Expected Total: 2 entries (sum of all children)**

#### 📈 Swing Trading (folder-2-1) - 1 entry
1. **Excellent LPO Swing Trade** (content-3)
   - Symbol: LPO
   - Entry: $65.20 → Exit: $66.87
   - P&L: +$1,636.60
   - Date: 2024-01-28
   - Category: win, Emotion: excited

#### 📈 Day Trading (folder-2-2) - 1 entry
1. **Range Trading CMAX** (content-4)
   - Symbol: CMAX
   - Entry: $21.15 → Exit: $21.26
   - P&L: +$22.00
   - Date: 2024-01-26
   - Category: win, Emotion: neutral

### 📁 Research (folder-3) - 1 entry
1. **Market Research - Biotech Sector** (content-11)
   - Sector: Biotechnology
   - Focus: FDA approvals, momentum analysis
   - Watchlist: YIBO, CRSP, EDIT, NTLA
   - Date: 2024-01-25

## Search Test Cases

### Symbol-Based Search
- **"YIBO"** → Should return 2 entries (content-1, content-2) + 1 research mention
- **"LPO"** → Should return 1 entry (content-3) + weekly review mention
- **"CMAX"** → Should return 1 entry (content-4)

### Date-Based Search
- **"2025-01-09"** → Should return 1 entry (content-7)
- **"2024-01-29"** → Should return 2 entries (content-1, content-2)
- **"january"** → Should return multiple entries with January dates

### Content-Based Search
- **"momentum"** → Should find YIBO trade (content-1) and biotech research
- **"swing"** → Should find LPO trade (content-3) and weekly review
- **"breakout"** → Should find YIBO trade (content-1)
- **"range"** → Should find CMAX trade (content-4)

## Calendar Integration Test Cases

### URL Navigation Tests
1. **`?focus=daily-reviews&date=2025-01-09`**
   - Should auto-select Daily Reviews folder
   - Should apply search filter "2025-01-09"
   - Should show 1 matching entry

2. **`?focus=daily-reviews&date=2025-01-02`**
   - Should auto-select Daily Reviews folder
   - Should apply search filter "2025-01-02"
   - Should show 1 matching entry

3. **`?focus=daily-reviews&date=invalid-date`**
   - Should auto-select Daily Reviews folder
   - Should apply search filter but show no results

## Time Period Filter Expected Results

### Current Date Context: October 25, 2025

#### "All" Time Period
- **Expected**: All 9 entries visible
- **Reasoning**: No date restrictions

#### "90d" Time Period (From ~July 27, 2025)
- **Expected**: 0 entries (all mock data is from January 2024-2025)
- **Reasoning**: All entries predate the 90-day cutoff

#### "30d" Time Period (From ~September 25, 2025)
- **Expected**: 0 entries
- **Reasoning**: All entries predate the 30-day cutoff

#### "7d" Time Period (From ~October 18, 2025)
- **Expected**: 0 entries
- **Reasoning**: All entries predate the 7-day cutoff

**Note**: This validates that time filtering logic works correctly, even when no entries fall within the time range.

## Filter Combination Test Cases

### Folder + Search Combinations
1. **Daily Trades + "YIBO"** → 2 entries
2. **Daily Reviews + "january"** → 5 entries
3. **Strategies + "swing"** → 1 entry
4. **Trading Journal + "review"** → 6 entries (5 daily + 1 weekly)

### Folder + Time Period Combinations
1. **Daily Reviews + "All"** → 5 entries
2. **Trading Journal + "All"** → 8 entries
3. **Any folder + "7d"** → 0 entries (due to data age)

### Triple Filter Combinations
1. **Trading Journal + "All" + "2025"** → 5 entries (all 2025 reviews)
2. **Strategies + "All" + "LPO"** → 1 entry
3. **Daily Trades + "All" + "YIBO"** → 2 entries

## Validation Checklist

### Data Integrity
- [ ] All 9 content items properly mapped to correct folders
- [ ] Entry counts match folder contentCount properties
- [ ] No duplicate entries across folders
- [ ] All required fields populated correctly

### Folder Navigation
- [ ] Parent folder selection shows child folder entries
- [ ] Leaf folder selection shows only direct entries
- [ ] Folder highlighting indicates current selection
- [ ] Content count badges match actual entry count

### Search Functionality
- [ ] Case-insensitive matching works
- [ ] Multi-field search covers title, content, date
- [ ] Search results update in real-time
- [ ] Search terms highlight in results (if implemented)

### Time Period Filtering
- [ ] Date calculations are accurate
- [ ] Filter applies to entry dates correctly
- [ ] Historical data handled appropriately
- [ ] UI indicates active time filter

### State Management
- [ ] Filter states don't conflict
- [ ] URL parameters properly parsed
- [ ] Filter combinations work logically
- [ ] State persistence behaves as designed

## Expected UI Behavior

### Empty States
- **Folder with no entries**: "No entries in [folder name]"
- **Search with no results**: "No entries match your filters"
- **Time filter excluding all**: "No entries match your filters"

### Loading States
- **Folder switching**: Immediate update (mock data)
- **Search input**: Real-time filtering
- **Time period change**: Immediate recalculation

### Error States
- **Invalid folder ID**: Graceful fallback to all entries
- **Malformed search**: Continue with partial matching
- **Network issues**: Show cached/mock data

This mapping validation ensures all expected data relationships are correctly implemented and testable.