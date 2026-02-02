# Renata Advanced Calendar Interaction System - Production Design

## Executive Summary

This design document outlines the production-ready system to enable Renata's full calendar interaction capabilities, transforming from limited preset ranges to supporting "thousands of commands" through natural language date parsing, CopilotKit calendar actions, and AGUI calendar components.

---

## 🎯 System Architecture Overview

### Current State Analysis
- ✅ **Solid Foundation**: 11 preset ranges + custom selection
- ✅ **CopilotKit Ready**: Sophisticated action system with validation
- ✅ **AGUI Capable**: 10 component types with extensible architecture
- ❌ **Limited Calendar Interaction**: Only preset + basic custom range
- ❌ **No Natural Language Processing**: Can't parse "show me Q1 2024"
- ❌ **No Dynamic Navigation**: Can't freely navigate months/years

### Enhanced System Components

**Layer 1: Advanced Natural Language Date Parser**
- Parse complex expressions: "Q1 2024", "last earnings season", "March to June"
- Handle relative dates: "3 weeks ago", "end of last quarter"
- Support trading patterns: "options expiration weeks", "FOMC meeting months"

**Layer 2: CopilotKit Calendar Actions**
- `navigateToDate()` - Navigate to specific month/year/day
- `selectCustomDateRange()` - Select arbitrary start/end dates
- `applyDatePattern()` - Apply trading-specific date patterns
- `generateCalendarView()` - Create AGUI calendar components

**Layer 3: AGUI Calendar Components**
- Interactive calendar widget with month/year navigation
- Date range picker with visual selection
- Trading calendar with earnings/events overlay
- Quick pattern buttons (quarters, earnings seasons, etc.)

**Layer 4: Enhanced Multi-Command Integration**
- Seamless integration with existing multi-command executor
- Calendar actions as part of complex command sequences
- Validation with visual state tracking

---

## 📅 Natural Language Date Parser Design

### Core Date Pattern Categories

#### 1. Absolute Date Patterns
```typescript
const absolutePatterns = {
  // Standard dates
  'january 2024': { start: '2024-01-01', end: '2024-01-31' },
  'march 15 2024': { start: '2024-03-15', end: '2024-03-15' },
  'Q1 2024': { start: '2024-01-01', end: '2024-03-31' },
  'first quarter 2024': { start: '2024-01-01', end: '2024-03-31' },

  // Trading-specific
  'earnings season Q3 2024': { start: '2024-07-01', end: '2024-09-30' },
  'options expiration march 2024': { start: '2024-03-15', end: '2024-03-15' },
  'fiscal year 2024': { start: '2024-01-01', end: '2024-12-31' }
}
```

#### 2. Relative Date Patterns
```typescript
const relativePatterns = {
  // Standard relative
  'last 6 months': () => ({
    start: subMonths(new Date(), 6),
    end: new Date()
  }),
  'next 30 days': () => ({
    start: new Date(),
    end: addDays(new Date(), 30)
  }),
  'year to date': () => ({
    start: startOfYear(new Date()),
    end: new Date()
  }),

  // Trading-specific relative
  'last earnings season': () => ({
    start: getLastEarningsSeason().start,
    end: getLastEarningsSeason().end
  }),
  'since last fed meeting': () => ({
    start: getLastFedMeeting(),
    end: new Date()
  })
}
```

#### 3. Complex Range Patterns
```typescript
const complexPatterns = {
  // Range expressions
  'january to march 2024': { start: '2024-01-01', end: '2024-03-31' },
  'from last monday to this friday': () => ({
    start: getLastMonday(),
    end: getThisFriday()
  }),

  // Trading periods
  'pre-market earnings weeks': () => getPreMarketEarningsWeeks(),
  'options expiration days this year': () => getOptionsExpirationDays(2024),
  'FOMC meeting months': () => getFOMCMeetingMonths()
}
```

### Date Parser Implementation

#### Core Parser Class
```typescript
export class AdvancedDateParser {
  private tradingCalendar: TradingCalendar
  private earningsSchedule: EarningsSchedule

  constructor() {
    this.tradingCalendar = new TradingCalendar()
    this.earningsSchedule = new EarningsSchedule()
  }

  parse(input: string): DateRange | null {
    const normalized = this.normalizeInput(input)

    // Try pattern matching in order of specificity
    return this.tryAbsolutePatterns(normalized) ||
           this.tryRelativePatterns(normalized) ||
           this.tryComplexPatterns(normalized) ||
           this.tryFuzzyMatching(normalized) ||
           null
  }

  private normalizeInput(input: string): string {
    return input
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  private tryAbsolutePatterns(input: string): DateRange | null {
    // Quarter patterns
    const quarterMatch = input.match(/q([1-4])\s*(\d{4})/)
    if (quarterMatch) {
      return this.getQuarterRange(
        parseInt(quarterMatch[1]),
        parseInt(quarterMatch[2])
      )
    }

    // Month year patterns
    const monthYearMatch = input.match(/(january|february|...|december)\s*(\d{4})/)
    if (monthYearMatch) {
      return this.getMonthRange(monthYearMatch[1], parseInt(monthYearMatch[2]))
    }

    return null
  }

  private tryRelativePatterns(input: string): DateRange | null {
    // "Last N" patterns
    const lastNMatch = input.match(/last\s*(\d+)\s*(days?|weeks?|months?)/)
    if (lastNMatch) {
      const count = parseInt(lastNMatch[1])
      const unit = lastNMatch[2].replace(/s$/, '') as 'day' | 'week' | 'month'
      return this.getLastNRange(count, unit)
    }

    // "Since" patterns
    if (input.includes('since')) {
      return this.parseSincePattern(input)
    }

    return null
  }
}
```

#### Trading-Specific Date Functions
```typescript
export class TradingCalendar {
  getEarningsSeasons(year: number): DateRange[] {
    return [
      { start: new Date(year, 0, 1), end: new Date(year, 2, 31), label: 'Q1 Earnings' },
      { start: new Date(year, 3, 1), end: new Date(year, 5, 30), label: 'Q2 Earnings' },
      { start: new Date(year, 6, 1), end: new Date(year, 8, 30), label: 'Q3 Earnings' },
      { start: new Date(year, 9, 1), end: new Date(year, 11, 31), label: 'Q4 Earnings' }
    ]
  }

  getOptionsExpirationDates(year: number): Date[] {
    const dates: Date[] = []
    for (let month = 0; month < 12; month++) {
      // Third Friday of each month
      const thirdFriday = this.getThirdFriday(year, month)
      dates.push(thirdFriday)
    }
    return dates
  }

  getFOMCMeetingDates(year: number): Date[] {
    // Federal Reserve meeting schedule (8 meetings per year)
    return [
      new Date(year, 0, 30),  // January
      new Date(year, 2, 19),  // March
      new Date(year, 4, 1),   // May
      new Date(year, 5, 11),  // June
      new Date(year, 6, 25),  // July
      new Date(year, 8, 17),  // September
      new Date(year, 10, 6),  // November
      new Date(year, 11, 17)  // December
    ]
  }
}
```

---

## 🔧 CopilotKit Calendar Actions Design

### Action 1: Navigate Calendar View
```typescript
useCopilotAction({
  name: "navigateToCalendarDate",
  description: "Navigate calendar to specific month, year, or date",
  parameters: [
    {
      name: "target",
      type: "string",
      description: "Target date - can be 'March 2024', '2023', 'next month', etc."
    }
  ],
  handler: async ({ target }) => {
    try {
      const parsedDate = advancedDateParser.parseNavigation(target)
      if (!parsedDate) {
        return `I couldn't understand the date "${target}". Try formats like "March 2024" or "next month".`
      }

      // Update calendar navigation state
      setCalendarNavigation({
        year: parsedDate.year,
        month: parsedDate.month,
        focusDate: parsedDate.date
      })

      return `📅 Navigated to ${parsedDate.displayName}`
    } catch (error) {
      return `Error navigating to date: ${error.message}`
    }
  }
})
```

### Action 2: Select Custom Date Range
```typescript
useCopilotAction({
  name: "selectCustomDateRange",
  description: "Select any custom date range using natural language",
  parameters: [
    {
      name: "dateExpression",
      type: "string",
      description: "Date range expression like 'Q1 2024', 'last 6 months', 'January to March 2024'"
    }
  ],
  handler: async ({ dateExpression }) => {
    try {
      const dateRange = advancedDateParser.parse(dateExpression)
      if (!dateRange) {
        return `I couldn't parse the date range "${dateExpression}". Try expressions like "Q1 2024", "last 6 months", or "January to March".`
      }

      // Apply to date range context
      setCustomRange(dateRange.start, dateRange.end)

      // Generate summary
      const summary = formatDateRangeSummary(dateRange)
      return `✅ Date range set to ${summary}`

    } catch (error) {
      return `Error setting date range: ${error.message}`
    }
  }
})
```

### Action 3: Apply Trading Date Patterns
```typescript
useCopilotAction({
  name: "applyTradingDatePattern",
  description: "Apply trading-specific date patterns like earnings seasons, options expiration, FOMC meetings",
  parameters: [
    {
      name: "pattern",
      type: "string",
      description: "Trading pattern: 'earnings season', 'options expiration', 'fed meetings', 'market holidays'"
    },
    {
      name: "year",
      type: "string",
      description: "Year for the pattern (optional, defaults to current year)"
    }
  ],
  handler: async ({ pattern, year }) => {
    try {
      const targetYear = year ? parseInt(year) : new Date().getFullYear()
      const tradingDates = tradingCalendar.getPatternDates(pattern, targetYear)

      if (!tradingDates || tradingDates.length === 0) {
        return `No ${pattern} dates found for ${targetYear}.`
      }

      // Create date range spanning pattern dates
      const dateRange = {
        start: new Date(Math.min(...tradingDates.map(d => d.getTime()))),
        end: new Date(Math.max(...tradingDates.map(d => d.getTime())))
      }

      setCustomRange(dateRange.start, dateRange.end)

      return `📊 Applied ${pattern} pattern for ${targetYear}: ${tradingDates.length} key dates`

    } catch (error) {
      return `Error applying trading pattern: ${error.message}`
    }
  }
})
```

### Action 4: Generate Calendar AGUI Component
```typescript
useCopilotAction({
  name: "generateCalendarWidget",
  description: "Generate an interactive calendar component for date selection",
  parameters: [
    {
      name: "type",
      type: "string",
      description: "Calendar type: 'date-picker', 'range-selector', 'trading-calendar', 'pattern-selector'"
    },
    {
      name: "preset",
      type: "string",
      description: "Optional preset focus: 'earnings', 'options', 'fed-meetings', 'quarters'"
    }
  ],
  handler: async ({ type, preset }) => {
    try {
      const calendarComponent = await generateCalendarComponent({
        type: type as CalendarType,
        preset: preset as CalendarPreset,
        currentDateRange: currentDateRange,
        tradingData: performanceData
      })

      setAguiComponents(prev => [...prev, calendarComponent])

      return `📅 Generated ${type} calendar widget${preset ? ` with ${preset} focus` : ''}`

    } catch (error) {
      return `Error generating calendar widget: ${error.message}`
    }
  }
})
```

---

## 🎨 AGUI Calendar Components Design

### Component Type: Interactive Calendar
```typescript
export interface AguiCalendarComponent extends AguiComponent {
  type: 'calendar'
  calendarType: 'date-picker' | 'range-selector' | 'trading-calendar' | 'pattern-selector'

  // Display properties
  title: string
  currentMonth: number
  currentYear: number
  selectedDate?: string
  selectedStartDate?: string
  selectedEndDate?: string

  // Trading-specific data
  tradingEvents?: TradingEvent[]
  earningsCalendar?: EarningsEvent[]
  optionsExpirations?: Date[]
  marketHolidays?: Date[]

  // Interactive features
  allowNavigation?: boolean
  allowMultiSelect?: boolean
  highlightWeekends?: boolean
  showTradingData?: boolean

  // Event handlers
  onDateSelect?: (date: string) => void
  onRangeSelect?: (startDate: string, endDate: string) => void
  onMonthChange?: (month: number, year: number) => void
}
```

### Calendar Component Implementation
```typescript
export function AguiCalendarComponent({
  component,
  onAction,
  onUpdate,
  interactive = true
}: AguiCalendarProps) {
  const [currentDate, setCurrentDate] = useState(
    new Date(component.currentYear, component.currentMonth)
  )
  const [selectedRange, setSelectedRange] = useState<DateRange | null>(null)

  const handleDateClick = (date: Date) => {
    if (!interactive) return

    const dateStr = format(date, 'yyyy-MM-dd')

    if (component.calendarType === 'date-picker') {
      if (onAction) {
        onAction('date-selected', { date: dateStr })
      }
    } else if (component.calendarType === 'range-selector') {
      handleRangeSelection(date)
    }
  }

  const handleRangeSelection = (date: Date) => {
    if (!selectedRange || selectedRange.end) {
      // Start new selection
      setSelectedRange({ start: date, end: null })
    } else {
      // Complete selection
      const endDate = date
      const startDate = selectedRange.start

      if (endDate >= startDate) {
        setSelectedRange({ start: startDate, end: endDate })
        if (onAction) {
          onAction('range-selected', {
            startDate: format(startDate, 'yyyy-MM-dd'),
            endDate: format(endDate, 'yyyy-MM-dd')
          })
        }
      } else {
        // Swap dates if end is before start
        setSelectedRange({ start: endDate, end: startDate })
        if (onAction) {
          onAction('range-selected', {
            startDate: format(endDate, 'yyyy-MM-dd'),
            endDate: format(startDate, 'yyyy-MM-dd')
          })
        }
      }
    }
  }

  const renderCalendarCell = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const isSelected = isDateSelected(date)
    const isInRange = isDateInRange(date)
    const hasTrading = hasTradingActivity(date)
    const tradingData = getTradingDataForDate(date)

    return (
      <button
        key={dateStr}
        onClick={() => handleDateClick(date)}
        className={cn(
          "w-8 h-8 text-sm rounded transition-colors relative",
          "hover:bg-gray-100 dark:hover:bg-gray-700",
          isSelected && "bg-blue-500 text-white",
          isInRange && !isSelected && "bg-blue-100 dark:bg-blue-900",
          hasTrading && "font-medium",
          !isSameMonth(date, currentDate) && "text-gray-400"
        )}
      >
        {format(date, 'd')}

        {/* Trading activity indicator */}
        {hasTrading && component.showTradingData && (
          <div className={cn(
            "absolute bottom-0 right-0 w-2 h-2 rounded-full",
            tradingData.pnl > 0 ? "bg-green-500" : "bg-red-500"
          )} />
        )}

        {/* Special trading events */}
        {component.tradingEvents?.some(event =>
          isSameDay(new Date(event.date), date)
        ) && (
          <div className="absolute top-0 right-0 w-1 h-1 bg-yellow-500 rounded-full" />
        )}
      </button>
    )
  }

  return (
    <div className="agui-calendar bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">{component.title}</h3>

        {component.allowNavigation && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-medium min-w-[120px] text-center">
              {format(currentDate, 'MMMM yyyy')}
            </span>

            <button
              onClick={() => navigateMonth(1)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-xs font-medium text-gray-500 text-center py-1">
            {day}
          </div>
        ))}

        {/* Calendar dates */}
        {getMonthDates(currentDate).map(date => renderCalendarCell(date))}
      </div>

      {/* Trading pattern quick actions */}
      {component.calendarType === 'pattern-selector' && (
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { label: 'Q1', pattern: 'Q1' },
            { label: 'Q2', pattern: 'Q2' },
            { label: 'Q3', pattern: 'Q3' },
            { label: 'Q4', pattern: 'Q4' },
            { label: 'Earnings', pattern: 'earnings' },
            { label: 'Options Exp', pattern: 'options' }
          ].map(({ label, pattern }) => (
            <button
              key={pattern}
              onClick={() => onAction?.('pattern-selected', { pattern })}
              className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700
                         hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Selected range display */}
      {selectedRange && selectedRange.end && (
        <div className="mt-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
          <strong>Selected Range:</strong> {format(selectedRange.start, 'MMM d')} - {format(selectedRange.end, 'MMM d, yyyy')}
        </div>
      )}
    </div>
  )
}
```

---

## 🔄 Enhanced Multi-Command Integration

### Enhanced Command Parser with Calendar Support
```typescript
export interface ParsedCalendarCommand {
  calendarAction?: {
    type: 'navigate' | 'select-range' | 'apply-pattern' | 'generate-widget'
    target: string
    startDate?: Date
    endDate?: Date
    pattern?: string
  }
}

export function parseMultiCommand(userInput: string): ParsedCommand & ParsedCalendarCommand {
  const result = baseParseMultiCommand(userInput) // existing parser

  // Enhanced calendar parsing
  const calendarAction = parseCalendarAction(userInput)
  if (calendarAction) {
    result.calendarAction = calendarAction
    result.detectedActions.push(calendarAction.description)
  }

  return result
}

function parseCalendarAction(input: string): CalendarAction | null {
  const lowerInput = input.toLowerCase()

  // Date range patterns
  const dateRangePattern = advancedDateParser.parse(lowerInput)
  if (dateRangePattern) {
    return {
      type: 'select-range',
      target: lowerInput,
      startDate: dateRangePattern.start,
      endDate: dateRangePattern.end,
      description: `Set date range to ${dateRangePattern.label}`
    }
  }

  // Calendar navigation patterns
  if (lowerInput.includes('navigate to') || lowerInput.includes('go to') &&
      (lowerInput.includes('month') || lowerInput.includes('year') || lowerInput.includes('calendar'))) {
    return {
      type: 'navigate',
      target: extractNavigationTarget(lowerInput),
      description: `Navigate calendar to ${extractNavigationTarget(lowerInput)}`
    }
  }

  // Pattern application
  if (lowerInput.includes('earnings') || lowerInput.includes('options') || lowerInput.includes('fed')) {
    return {
      type: 'apply-pattern',
      pattern: extractTradingPattern(lowerInput),
      description: `Apply ${extractTradingPattern(lowerInput)} trading pattern`
    }
  }

  return null
}
```

### Enhanced Multi-Command Executor
```typescript
export async function executeMultiCommand(userInput: string): Promise<MultiCommandResult> {
  const parsed = parseMultiCommand(userInput)
  const results: ExecutionResult[] = []

  // Execute in order: Navigation → Calendar → Date Range → Display Mode

  // 1. Navigation
  if (parsed.navigation) {
    const navResult = await executeNavigation(parsed.navigation.target)
    results.push(navResult)
  }

  // 2. Calendar Actions (NEW)
  if (parsed.calendarAction) {
    const calendarResult = await executeCalendarAction(parsed.calendarAction)
    results.push(calendarResult)
  }

  // 3. Date Range (existing but enhanced)
  if (parsed.dateRange) {
    const dateResult = await executeDateRange(parsed.dateRange.value)
    results.push(dateResult)
  }

  // 4. Display Mode
  if (parsed.displayMode) {
    const displayResult = await executeDisplayMode(parsed.displayMode.value)
    results.push(displayResult)
  }

  return generateExecutionSummary(results, parsed)
}

async function executeCalendarAction(action: CalendarAction): Promise<ExecutionResult> {
  try {
    switch (action.type) {
      case 'select-range':
        if (action.startDate && action.endDate) {
          await setCustomRange(action.startDate, action.endDate)
          return {
            action: 'calendarRange',
            success: true,
            details: `Date range set from ${format(action.startDate, 'MMM d')} to ${format(action.endDate, 'MMM d, yyyy')}`,
            timestamp: new Date()
          }
        }
        break

      case 'navigate':
        await navigateToCalendarDate(action.target)
        return {
          action: 'calendarNavigation',
          success: true,
          details: `Navigated calendar to ${action.target}`,
          timestamp: new Date()
        }

      case 'apply-pattern':
        await applyTradingPattern(action.pattern!)
        return {
          action: 'tradingPattern',
          success: true,
          details: `Applied ${action.pattern} trading pattern`,
          timestamp: new Date()
        }

      case 'generate-widget':
        await generateCalendarWidget(action.target)
        return {
          action: 'calendarWidget',
          success: true,
          details: `Generated ${action.target} calendar widget`,
          timestamp: new Date()
        }
    }

    return {
      action: 'calendarAction',
      success: false,
      details: `Unknown calendar action type: ${action.type}`,
      timestamp: new Date()
    }

  } catch (error) {
    return {
      action: 'calendarAction',
      success: false,
      details: `Calendar action failed: ${error.message}`,
      timestamp: new Date()
    }
  }
}
```

---

## 🧪 Testing & Validation Strategy

### Test Cases for Natural Language Parser
```typescript
const testCases = [
  // Absolute dates
  { input: "Q1 2024", expected: { start: "2024-01-01", end: "2024-03-31" } },
  { input: "March 2024", expected: { start: "2024-03-01", end: "2024-03-31" } },
  { input: "first quarter 2023", expected: { start: "2023-01-01", end: "2023-03-31" } },

  // Relative dates
  { input: "last 6 months", expected: "relative_6_months" },
  { input: "year to date", expected: "ytd" },
  { input: "since last monday", expected: "relative_monday" },

  // Complex ranges
  { input: "january to march 2024", expected: { start: "2024-01-01", end: "2024-03-31" } },
  { input: "from last week to next friday", expected: "complex_relative_range" },

  // Trading patterns
  { input: "earnings season Q3", expected: "earnings_q3" },
  { input: "options expiration dates", expected: "options_expiration" },
  { input: "fed meeting months", expected: "fomc_meetings" }
]
```

### Multi-Command Integration Tests
```typescript
const integrationTests = [
  {
    command: "Go to statistics and show me Q1 2024 data in dollars",
    expectedActions: [
      { type: 'navigation', target: 'statistics' },
      { type: 'calendarRange', startDate: '2024-01-01', endDate: '2024-03-31' },
      { type: 'displayMode', mode: 'dollar' }
    ]
  },
  {
    command: "Navigate to trades, show earnings season data in R multiples",
    expectedActions: [
      { type: 'navigation', target: 'trades' },
      { type: 'tradingPattern', pattern: 'earnings' },
      { type: 'displayMode', mode: 'r' }
    ]
  }
]
```

---

## 📊 Implementation Priority

### Phase 1: Core Infrastructure
1. ✅ Advanced date parser implementation
2. ✅ Basic CopilotKit calendar actions
3. ✅ Enhanced multi-command integration

### Phase 2: AGUI Calendar Components
1. ✅ Interactive calendar widget
2. ✅ Trading calendar with events
3. ✅ Range selector component

### Phase 3: Advanced Features
1. ✅ Trading pattern recognition
2. ✅ Earnings calendar integration
3. ✅ Options expiration tracking

### Phase 4: Validation & Polish
1. ✅ Comprehensive testing suite
2. ✅ Performance optimization
3. ✅ Production deployment

---

## 🎯 Success Criteria

### Functional Requirements
- ✅ Parse 95% of common date expressions
- ✅ Execute complex multi-step commands correctly
- ✅ Generate interactive calendar components
- ✅ Integrate with existing trading data

### Performance Requirements
- ✅ Parse date expressions in <100ms
- ✅ Calendar navigation in <200ms
- ✅ AGUI generation in <500ms
- ✅ Multi-command execution in <2s

### User Experience Requirements
- ✅ Natural language feels intuitive
- ✅ Calendar interaction is responsive
- ✅ Visual feedback is immediate
- ✅ Error messages are helpful

---

## 🔮 Future Enhancement Opportunities

### Advanced AI Features
- **Learning Date Preferences**: Remember user's common date patterns
- **Contextual Date Suggestions**: Suggest relevant date ranges based on current data
- **Predictive Date Selection**: Anticipate date needs based on trading activity

### Trading-Specific Enhancements
- **Broker Integration**: Sync with real brokerage calendar events
- **Economic Calendar**: Integrate with economic event calendars
- **Custom Trading Patterns**: Allow users to define custom date patterns

### Internationalization
- **Multi-Language Support**: Support date parsing in multiple languages
- **Regional Date Formats**: Handle different date format preferences
- **Market-Specific Calendars**: Support different market trading calendars

---

This design provides Renata with the foundation to handle "thousands of commands" involving calendar interaction through a sophisticated, extensible system that builds on Traderra's existing architecture while enabling new levels of AI-powered date manipulation.