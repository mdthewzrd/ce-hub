# Journal System Validation Script

## Manual Testing Procedures

### Prerequisites
1. Navigate to the journal page: `http://localhost:3000/journal`
2. Ensure the system is running with mock data loaded
3. Open browser developer tools for console logging verification

## Test Case 1: Folder Navigation Validation

### Procedure:
1. **Verify Default Folder Selection**
   - Expected: Daily Trades folder should be selected by default (folder-1-1)
   - Expected: Should show 2 entries (YIBO trades)
   - Console should show: "📁 Default folder selected: folder-1-1"

2. **Test Trading Journal Parent Folder**
   - Click on "Trading Journal" (folder-1)
   - Expected: Should show all 8 entries from child folders (Daily Trades + Daily Reviews + Weekly Reviews)
   - Verify: Entry count shows "8 entries" in Trading Journal

3. **Test Daily Reviews Folder**
   - Click on "Daily Reviews" (folder-1-2)
   - Expected: Should show 5 daily review entries
   - Verify: All entries have "Daily Review" in title
   - Console should show: "📁 Folder selected: folder-1-2"

4. **Test Strategies Parent Folder**
   - Click on "Strategies" (folder-2)
   - Expected: Should show 2 entries (Swing + Day trading entries)
   - Verify: LPO swing trade and CMAX day trade visible

5. **Test Swing Trading Folder**
   - Click on "Swing Trading" (folder-2-1)
   - Expected: Should show 1 entry (LPO trade)
   - Verify: "Excellent LPO Swing Trade" visible

### Validation Points:
- [ ] Folder highlighting works correctly
- [ ] Entry counts match expectations
- [ ] Content updates immediately on folder selection
- [ ] Console logging confirms folder selection events

## Test Case 2: Time Period Filtering Validation

### Setup:
First, select "All" time period to see baseline entry count.

### Procedure:
1. **Test "All" Filter**
   - Expected: Shows all entries regardless of date
   - Note the total count for comparison

2. **Test "90d" Filter**
   - Expected: Should show most entries (data mostly from 2024-2025)
   - May show fewer entries than "All" depending on current date

3. **Test "30d" and "7d" Filters**
   - Expected: May show very few or no entries (data is historical)
   - This validates the time filtering logic is working

### Validation Points:
- [ ] Filter buttons update selection state
- [ ] Entry count changes appropriately
- [ ] No JavaScript errors in console
- [ ] Results summary updates correctly

## Test Case 3: Search Functionality Validation

### Procedure:
1. **Search by Symbol**
   - Enter "YIBO" in search
   - Expected: Shows 2 entries (both YIBO trades)
   - Verify: Only YIBO-related entries visible

2. **Search by Date**
   - Enter "2025-01-09" in search
   - Expected: Shows January 9th daily review
   - Verify: Only one entry matches

3. **Search by Content**
   - Enter "momentum" in search
   - Expected: Shows entries containing "momentum" in content
   - Verify: YIBO momentum trade appears

4. **Search by Title**
   - Enter "Daily Review" in search
   - Expected: Shows all 5 daily review entries
   - Verify: Only review entries visible

### Validation Points:
- [ ] Search is case-insensitive
- [ ] Search matches title, content, and date fields
- [ ] Search results update in real-time
- [ ] Clear search button works correctly

## Test Case 4: Calendar Integration Validation

### Procedure:
1. **Test Direct Navigation**
   - Navigate to: `http://localhost:3000/journal?focus=daily-reviews&date=2025-01-09`
   - Expected: Daily Reviews folder auto-selected
   - Expected: Search automatically populated with "2025-01-09"
   - Expected: Shows January 9th daily review entry

2. **Verify URL Parameter Parsing**
   - Check console for: "Navigating to daily review for date: 2025-01-09"
   - Verify: selectedFolderId changes to 'folder-1-2'
   - Verify: Search filters applied automatically

### Validation Points:
- [ ] URL parameters parsed correctly
- [ ] Folder switches automatically
- [ ] Search filter applied
- [ ] UI state reflects navigation

## Test Case 5: Filter Combination Validation

### Procedure:
1. **Folder + Time Period Combination**
   - Select Daily Reviews folder
   - Apply 90d time filter
   - Expected: Shows daily reviews from last 90 days only

2. **Folder + Search Combination**
   - Select Daily Trades folder
   - Search for "YIBO"
   - Expected: Shows only YIBO trades (2 entries)

3. **All Filters Combined**
   - Select Trading Journal (parent folder)
   - Apply 90d time filter
   - Search for "review"
   - Expected: Shows only review entries from last 90 days

### Validation Points:
- [ ] Filters work in combination
- [ ] No filter conflicts or errors
- [ ] Results summary accurately reflects applied filters
- [ ] Performance remains smooth with multiple filters

## Test Case 6: State Management Validation

### Procedure:
1. **Navigation Persistence**
   - Select a folder and apply filters
   - Refresh the page
   - Expected: State may reset (depending on implementation)
   - Check if intended behavior matches actual behavior

2. **Filter State Synchronization**
   - Apply search filter
   - Change folder selection
   - Expected: Search should persist or clear based on design intent
   - Verify: UI controls reflect actual applied filters

### Validation Points:
- [ ] Filter state consistency maintained
- [ ] No orphaned or conflicting filter states
- [ ] UI accurately represents applied filters
- [ ] Clear filters functionality works correctly

## Expected Console Output Examples

```javascript
// Folder selection logging
🖱️ Folder clicked: {folderId: "folder-1-2", folderName: "Daily Reviews", hasChildren: false}
📁 Folder selected: folder-1-2

// Filter application logging
🔍 Search filter applied: "2025-01-09"
⏰ Time period filter applied: "90d"
📊 Filtered entries count: 3

// Calendar navigation logging
📅 Calendar navigation detected: focus=daily-reviews, date=2025-01-09
🎯 Auto-selecting Daily Reviews folder
```

## Common Issues to Watch For

### Performance Issues:
- [ ] Slow folder switching (>1 second)
- [ ] Laggy search input response
- [ ] Memory leaks with repeated filtering

### UI/UX Issues:
- [ ] Folder selection not visually clear
- [ ] Search input doesn't show current filter
- [ ] Entry counts don't match actual displayed entries
- [ ] Empty states not handled gracefully

### Data Issues:
- [ ] Missing entries in expected folders
- [ ] Incorrect entry counts
- [ ] Search not finding expected content
- [ ] Date filters showing wrong entries

## Success Criteria Summary

✅ **PASS**: All folder navigation works correctly with proper entry display
✅ **PASS**: Time period filters function as designed (accounting for data dates)
✅ **PASS**: Search functionality covers all specified fields
✅ **PASS**: Calendar integration auto-selects correct folder and applies date filter
✅ **PASS**: Filter combinations work without conflicts
✅ **PASS**: State management maintains consistency

## Failure Investigation Steps

If any test fails:

1. **Check Console Logs**
   - Look for error messages
   - Verify expected logging output
   - Check for missing function calls

2. **Inspect Network Tab**
   - Ensure mock data is loading correctly
   - Check for failed API calls (if any)

3. **Examine State**
   - Use React DevTools to inspect component state
   - Verify filter state variables
   - Check folder selection state

4. **Review Code Logic**
   - Trace through filtering logic
   - Verify data transformation functions
   - Check folder-to-content mappings

This validation script provides comprehensive testing coverage for all critical journal system functionality.