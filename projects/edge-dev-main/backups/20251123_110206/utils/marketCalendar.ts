/**
 * Market Calendar Utility for Edge.dev Charts
 * JavaScript equivalent of pandas market_calendar
 * Handles US equity market trading sessions, holidays, and closed days
 */

export interface TradingSession {
  date: string;
  market_open: Date;
  market_close: Date;
  pre_market_start: Date;
  post_market_end: Date;
  is_trading_day: boolean;
  session_type: 'full' | 'early_close' | 'closed';
}

// US Federal Holidays (NYSE/NASDAQ closed days)
const FEDERAL_HOLIDAYS_2024 = [
  '2024-01-01', // New Year's Day
  '2024-01-15', // Martin Luther King Jr. Day
  '2024-02-19', // Presidents' Day
  '2024-03-29', // Good Friday
  '2024-05-27', // Memorial Day
  '2024-06-19', // Juneteenth
  '2024-07-04', // Independence Day
  '2024-09-02', // Labor Day
  '2024-11-28', // Thanksgiving
  '2024-12-25', // Christmas Day
];

const FEDERAL_HOLIDAYS_2025 = [
  '2025-01-01', // New Year's Day
  '2025-01-20', // Martin Luther King Jr. Day
  '2025-02-17', // Presidents' Day
  '2025-04-18', // Good Friday
  '2025-05-26', // Memorial Day
  '2025-06-19', // Juneteenth
  '2025-07-04', // Independence Day
  '2025-09-01', // Labor Day
  '2025-11-27', // Thanksgiving
  '2025-12-25', // Christmas Day
];

// Early close days (1:00 PM ET close)
const EARLY_CLOSE_DAYS_2024 = [
  '2024-07-03', // Day before Independence Day
  '2024-11-29', // Day after Thanksgiving
  '2024-12-24', // Christmas Eve
];

const EARLY_CLOSE_DAYS_2025 = [
  '2025-07-03', // Day before Independence Day
  '2025-11-28', // Day after Thanksgiving
  '2025-12-24', // Christmas Eve
];

// Combine all holidays
const ALL_HOLIDAYS = [
  ...FEDERAL_HOLIDAYS_2024,
  ...FEDERAL_HOLIDAYS_2025,
];

const ALL_EARLY_CLOSE = [
  ...EARLY_CLOSE_DAYS_2024,
  ...EARLY_CLOSE_DAYS_2025,
];

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
}

/**
 * Check if a date is a market holiday
 */
export function isMarketHoliday(date: Date): boolean {
  // Validate the date before calling toISOString
  if (isNaN(date.getTime())) {
    console.error(`Invalid date passed to isMarketHoliday:`, date);
    return false; // Invalid dates are not holidays
  }
  const dateStr = date.toISOString().split('T')[0];
  return ALL_HOLIDAYS.includes(dateStr);
}

/**
 * Check if a date is an early close day
 */
export function isEarlyCloseDay(date: Date): boolean {
  // Validate the date before calling toISOString
  if (isNaN(date.getTime())) {
    console.error(`Invalid date passed to isEarlyCloseDay:`, date);
    return false; // Invalid dates are not early close days
  }
  const dateStr = date.toISOString().split('T')[0];
  return ALL_EARLY_CLOSE.includes(dateStr);
}

/**
 * Check if a date is a trading day
 */
export function isTradingDay(date: Date): boolean {
  return !isWeekend(date) && !isMarketHoliday(date);
}

/**
 * Get market session times for a given date
 */
export function getMarketSession(date: Date): TradingSession {
  // Validate the date before calling toISOString
  if (isNaN(date.getTime())) {
    console.error(`Invalid date passed to getMarketSession:`, date);
    // Return a fallback session for invalid dates
    const fallbackDate = new Date('2024-10-25'); // Use a known valid trading day
    return getMarketSession(fallbackDate);
  }

  const dateStr = date.toISOString().split('T')[0];
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Create times in Eastern Time (market timezone) - using UTC offset calculation
  // EST = UTC-5, EDT = UTC-4 (daylight saving time roughly Mar-Nov)
  const isDST = month > 2 && month < 11; // Rough DST approximation
  const utcHourOffset = isDST ? 4 : 5; // Hours to add to ET to get UTC

  // Convert to UTC timestamps for Eastern Time
  const pre_market_start = new Date(Date.UTC(year, month, day, 4 + utcHourOffset, 0, 0)); // 4:00 AM ET
  const market_open = new Date(Date.UTC(year, month, day, 9 + utcHourOffset, 30, 0));     // 9:30 AM ET

  // Market close depends on if it's an early close day
  const market_close = isEarlyCloseDay(date)
    ? new Date(Date.UTC(year, month, day, 13 + utcHourOffset, 0, 0))   // 1:00 PM ET (early close)
    : new Date(Date.UTC(year, month, day, 16 + utcHourOffset, 0, 0));  // 4:00 PM ET (normal close)

  const post_market_end = new Date(Date.UTC(year, month, day, 20 + utcHourOffset, 0, 0)); // 8:00 PM ET

  // Determine session type
  let session_type: 'full' | 'early_close' | 'closed' = 'closed';
  const is_trading_day = isTradingDay(date);

  if (is_trading_day) {
    session_type = isEarlyCloseDay(date) ? 'early_close' : 'full';
  }

  return {
    date: dateStr,
    market_open,
    market_close,
    pre_market_start,
    post_market_end,
    is_trading_day,
    session_type
  };
}

/**
 * Get all trading days between two dates
 */
export function getTradingDaysBetween(startDate: Date, endDate: Date): TradingSession[] {
  const sessions: TradingSession[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const session = getMarketSession(currentDate);
    if (session.is_trading_day) {
      sessions.push(session);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return sessions;
}

/**
 * Get all days (including non-trading) between two dates with session info
 */
export function getAllDaysBetween(startDate: Date, endDate: Date): TradingSession[] {
  const sessions: TradingSession[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    sessions.push(getMarketSession(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return sessions;
}

/**
 * Filter data points to only include trading sessions
 * Used to remove weekends and holidays from chart data
 */
export function filterTradingDaysOnly<T extends { t: number }>(
  data: T[],
  timezone: string = 'America/New_York'
): T[] {
  return data.filter(point => {
    const date = new Date(point.t);
    return isTradingDay(date);
  });
}

/**
 * Get next trading day after a given date
 */
export function getNextTradingDay(date: Date): Date {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  while (!isTradingDay(nextDay)) {
    nextDay.setDate(nextDay.getDate() + 1);
  }

  return nextDay;
}

/**
 * Get previous trading day before a given date
 */
export function getPreviousTradingDay(date: Date): Date {
  const prevDay = new Date(date);
  prevDay.setDate(prevDay.getDate() - 1);

  while (!isTradingDay(prevDay)) {
    prevDay.setDate(prevDay.getDate() - 1);
  }

  return prevDay;
}

/**
 * Generate holiday ranges for chart gaps
 */
export function generateHolidayBreaks(): Array<{ bounds: [string, string] }> {
  const holidayRanges: Array<{ bounds: [string, string] }> = [];

  // Convert single holidays to date ranges (day before to day after)
  ALL_HOLIDAYS.forEach(holiday => {
    const holidayDate = new Date(holiday + 'T00:00:00');
    const dayBefore = new Date(holidayDate.getTime() - 24 * 60 * 60 * 1000);
    const dayAfter = new Date(holidayDate.getTime() + 24 * 60 * 60 * 1000);

    holidayRanges.push({
      bounds: [dayBefore.toISOString().split('T')[0], dayAfter.toISOString().split('T')[0]]
    });
  });

  return holidayRanges;
}

/**
 * Generate market session break ranges for Plotly charts
 * UPDATED: No overnight gaps for extended hours - show continuous 4am-8pm data
 * Only removes weekends (Sat-Mon) and official market holidays
 */
export function generateMarketBreaks(timeframe: string = 'day') {
  if (timeframe === 'day') {
    // For daily charts, hide weekends and holidays
    return [
      { bounds: ["sat", "mon"] }, // Hide weekends
      ...generateHolidayBreaks()   // Hide holidays
    ];
  } else {
    // For intraday charts: MINIMAL gap removal to preserve 4am-8pm continuity
    // Only remove weekends and official holidays - NOT individual missing hours
    // This allows natural extended hours display with pre-market and after-hours data
    return [
      { bounds: ["sat", "mon"] }, // Hide weekends only
      ...generateHolidayBreaks()   // Hide official market holidays only
    ];
  }
}

/**
 * Generate market session shading for intraday charts
 * Pre-market: 4am-9:30am (dark grey)
 * After-hours: 4pm-8pm (dark grey)
 */
export function generateMarketSessionShapes(startDate: string, endDate: string) {
  // Import proper market calendar here to avoid circular imports
  const { getProperTradingSession } = require('./properMarketCalendar');

  const shapes: any[] = [];
  const currentDate = new Date(startDate + 'T00:00:00');
  const endDateTime = new Date(endDate + 'T00:00:00');

  console.log(`🎨 Generating market session shapes from ${startDate} to ${endDate}`);

  while (currentDate <= endDateTime) {
    if (isTradingDay(currentDate)) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const session = getProperTradingSession(currentDate); // Use proper market calendar

      console.log(`📅 ${dateStr}: Pre-market ${session.preMarketStart.toISOString()} to ${session.marketOpen.toISOString()}`);
      console.log(`📅 ${dateStr}: After-hours ${session.marketClose.toISOString()} to ${session.postMarketEnd.toISOString()}`);

      // Pre-market shading: 4am - 9:30am EST/EDT
      shapes.push({
        type: 'rect',
        xref: 'x',
        yref: 'paper',
        x0: session.preMarketStart.toISOString(),
        x1: session.marketOpen.toISOString(),
        y0: 0,
        y1: 1,
        fillcolor: 'rgba(128, 128, 128, 0.25)', // More prominent grey shading
        line: { width: 0 },
        layer: 'below'
      });

      // After-hours shading: 4pm - 8pm EST/EDT
      shapes.push({
        type: 'rect',
        xref: 'x',
        yref: 'paper',
        x0: session.marketClose.toISOString(),
        x1: session.postMarketEnd.toISOString(),
        y0: 0,
        y1: 1,
        fillcolor: 'rgba(128, 128, 128, 0.25)', // More prominent grey shading
        line: { width: 0 },
        layer: 'below'
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log(`🎨 Generated ${shapes.length} market session shapes`);
  return shapes;
}

/**
 * Validate and clean timestamp data based on market calendar
 */
export function validateMarketTimestamp(timestamp: number, timeframe: string): boolean {
  const date = new Date(timestamp);

  // Always check if it's a trading day
  if (!isTradingDay(date)) {
    return false;
  }

  // For intraday data, check if within extended trading hours (4am-8pm ET)
  if (timeframe !== 'day') {
    const session = getMarketSession(date);
    const time = new Date(timestamp);

    return time >= session.pre_market_start && time <= session.post_market_end;
  }

  return true;
}

/**
 * Get market status for current time
 */
export function getCurrentMarketStatus(): {
  status: 'pre_market' | 'market_open' | 'post_market' | 'closed';
  session: TradingSession;
  next_open?: Date;
  next_close?: Date;
} {
  const now = new Date();
  const session = getMarketSession(now);

  if (!session.is_trading_day) {
    const nextTradingDay = getNextTradingDay(now);
    const nextSession = getMarketSession(nextTradingDay);

    return {
      status: 'closed',
      session,
      next_open: nextSession.market_open
    };
  }

  // Check current time against session periods
  if (now < session.pre_market_start) {
    return {
      status: 'closed',
      session,
      next_open: session.pre_market_start
    };
  } else if (now < session.market_open) {
    return {
      status: 'pre_market',
      session,
      next_open: session.market_open
    };
  } else if (now < session.market_close) {
    return {
      status: 'market_open',
      session,
      next_close: session.market_close
    };
  } else if (now < session.post_market_end) {
    return {
      status: 'post_market',
      session,
      next_close: session.post_market_end
    };
  } else {
    const nextTradingDay = getNextTradingDay(now);
    const nextSession = getMarketSession(nextTradingDay);

    return {
      status: 'closed',
      session,
      next_open: nextSession.pre_market_start
    };
  }
}