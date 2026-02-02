/**
 * Proper Market Calendar Implementation
 * JavaScript equivalent of pandas market_calendar
 * Fixes timezone and session boundary issues
 */

export interface ProperTradingSession {
  date: string;
  isOpen: boolean;
  preMarketStart: Date;
  marketOpen: Date;
  marketClose: Date;
  postMarketEnd: Date;
  timezone: 'EST' | 'EDT';
  utcOffset: number;
}

/**
 * Get proper DST dates for a given year (US rules)
 * DST starts: 2nd Sunday in March at 2:00 AM
 * DST ends: 1st Sunday in November at 2:00 AM
 */
function getDSTDates(year: number): { start: Date; end: Date } {
  // Find 2nd Sunday in March
  const march1 = new Date(year, 2, 1); // March 1st
  const firstSundayMarch = new Date(year, 2, 7 - march1.getDay());
  const secondSundayMarch = new Date(firstSundayMarch.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Find 1st Sunday in November
  const nov1 = new Date(year, 10, 1); // November 1st
  const firstSundayNov = new Date(year, 10, 7 - nov1.getDay());

  return {
    start: new Date(year, secondSundayMarch.getMonth(), secondSundayMarch.getDate(), 2, 0, 0),
    end: new Date(year, firstSundayNov.getMonth(), firstSundayNov.getDate(), 2, 0, 0)
  };
}

/**
 * Check if date is in Daylight Saving Time
 */
function isDST(date: Date): boolean {
  const year = date.getFullYear();
  const { start, end } = getDSTDates(year);
  return date >= start && date < end;
}

/**
 * Convert EST/EDT time to UTC timestamp
 */
function marketTimeToUTC(year: number, month: number, day: number, hour: number, minute: number = 0): Date {
  const marketDate = new Date(year, month, day, hour, minute, 0);
  const isEDT = isDST(marketDate);

  // EST = UTC-5, EDT = UTC-4
  const offsetHours = isEDT ? 4 : 5;

  // Create UTC timestamp representing market time
  return new Date(Date.UTC(year, month, day, hour + offsetHours, minute, 0));
}

/**
 * Check if date is a US market holiday
 */
function isMarketHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  // 2024-2025 market holidays
  const holidays = [
    '2024-01-01', '2024-01-15', '2024-02-19', '2024-03-29', '2024-05-27',
    '2024-06-19', '2024-07-04', '2024-09-02', '2024-11-28', '2024-12-25',
    '2025-01-01', '2025-01-20', '2025-02-17', '2025-04-18', '2025-05-26',
    '2025-06-19', '2025-07-04', '2025-09-01', '2025-11-27', '2025-12-25'
  ];

  return holidays.includes(dateStr);
}

/**
 * Get proper trading session for a date
 */
export function getProperTradingSession(date: Date): ProperTradingSession {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const dayOfWeek = date.getDay();

  const timezone = isDST(date) ? 'EDT' : 'EST';
  const utcOffset = isDST(date) ? -4 : -5;

  // Market sessions in ET (will be converted to UTC)
  const preMarketStart = marketTimeToUTC(year, month, day, 4, 0);    // 4:00 AM ET
  const marketOpen = marketTimeToUTC(year, month, day, 9, 30);       // 9:30 AM ET
  const marketClose = marketTimeToUTC(year, month, day, 16, 0);      // 4:00 PM ET
  const postMarketEnd = marketTimeToUTC(year, month, day, 20, 0);    // 8:00 PM ET

  // Check if market is open (not weekend, not holiday)
  const isOpen = dayOfWeek !== 0 && dayOfWeek !== 6 && !isMarketHoliday(date);

  return {
    date: date.toISOString().split('T')[0],
    isOpen,
    preMarketStart,
    marketOpen,
    marketClose,
    postMarketEnd,
    timezone,
    utcOffset
  };
}

/**
 * Validate if timestamp is within extended trading hours (4am-8pm ET)
 */
export function isWithinExtendedHours(timestamp: number): boolean {
  const date = new Date(timestamp);
  const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  // Skip weekends and holidays
  if (localDate.getDay() === 0 || localDate.getDay() === 6 || isMarketHoliday(localDate)) {
    return false;
  }

  const session = getProperTradingSession(localDate);
  const time = new Date(timestamp);

  // Check if within extended hours (4am-8pm ET)
  return time >= session.preMarketStart && time <= session.postMarketEnd;
}

/**
 * Convert UTC timestamp to market time for display
 */
export function utcToMarketTime(timestamp: number): { marketTime: Date; timezone: string } {
  const utcDate = new Date(timestamp);
  const isEDT = isDST(utcDate);
  const offsetHours = isEDT ? -4 : -5;

  const marketTime = new Date(utcDate.getTime() + (offsetHours * 60 * 60 * 1000));

  return {
    marketTime,
    timezone: isEDT ? 'EDT' : 'EST'
  };
}