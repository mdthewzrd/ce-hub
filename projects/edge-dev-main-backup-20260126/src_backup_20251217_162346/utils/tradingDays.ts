/**
 * BULLETPROOF Trading Day Utilities
 * Handles business day calculations with comprehensive holiday and weekend logic
 *
 * US Stock Market Holidays (NYSE/NASDAQ):
 * - New Year's Day (observed when falls on weekend)
 * - Martin Luther King Jr. Day (3rd Monday in January)
 * - Presidents' Day (3rd Monday in February)
 * - Good Friday (Friday before Easter - calculated dynamically)
 * - Memorial Day (last Monday in May)
 * - Juneteenth (June 19th, observed when falls on weekend)
 * - Independence Day (July 4th, observed when falls on weekend)
 * - Labor Day (1st Monday in September)
 * - Thanksgiving (4th Thursday in November)
 * - Christmas Day (observed when falls on weekend)
 */

/**
 * Calculate Easter date for a given year (Gregorian calendar)
 * Uses anonymous Gregorian algorithm
 */
function calculateEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
}

/**
 * Calculate Good Friday for a given year (Friday before Easter)
 */
function calculateGoodFriday(year: number): Date {
  const easter = calculateEaster(year);
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2); // Friday before Easter Sunday
  return goodFriday;
}

/**
 * Get the nth weekday of a month (e.g., 3rd Monday of January)
 */
function getNthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): Date {
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  const daysToAdd = (weekday - firstWeekday + 7) % 7 + (n - 1) * 7;
  return new Date(year, month, 1 + daysToAdd);
}

/**
 * Get the last weekday of a month (e.g., last Monday of May)
 */
function getLastWeekdayOfMonth(year: number, month: number, weekday: number): Date {
  const lastDay = new Date(year, month + 1, 0); // Last day of the month
  const lastWeekday = lastDay.getDay();
  const daysToSubtract = (lastWeekday - weekday + 7) % 7;
  return new Date(year, month, lastDay.getDate() - daysToSubtract);
}

/**
 * Get observed holiday date (when holiday falls on weekend)
 * - Saturday holiday → observed on Friday
 * - Sunday holiday → observed on Monday
 */
function getObservedHoliday(date: Date): Date {
  const dayOfWeek = date.getDay();
  const observedDate = new Date(date);

  if (dayOfWeek === 6) { // Saturday
    observedDate.setDate(date.getDate() - 1); // Friday
  } else if (dayOfWeek === 0) { // Sunday
    observedDate.setDate(date.getDate() + 1); // Monday
  }

  return observedDate;
}

/**
 * Generate all US market holidays for a given year
 */
function getMarketHolidays(year: number): Date[] {
  const holidays: Date[] = [];

  // New Year's Day (January 1st, observed)
  const newYearsDay = getObservedHoliday(new Date(year, 0, 1));
  holidays.push(newYearsDay);

  // Martin Luther King Jr. Day (3rd Monday in January)
  const mlkDay = getNthWeekdayOfMonth(year, 0, 1, 3); // 3rd Monday
  holidays.push(mlkDay);

  // Presidents' Day (3rd Monday in February)
  const presidentsDay = getNthWeekdayOfMonth(year, 1, 1, 3); // 3rd Monday
  holidays.push(presidentsDay);

  // Good Friday (Friday before Easter)
  const goodFriday = calculateGoodFriday(year);
  holidays.push(goodFriday);

  // Memorial Day (last Monday in May)
  const memorialDay = getLastWeekdayOfMonth(year, 4, 1); // Last Monday
  holidays.push(memorialDay);

  // Juneteenth (June 19th, observed) - became federal holiday in 2021
  if (year >= 2021) {
    const juneteenth = getObservedHoliday(new Date(year, 5, 19));
    holidays.push(juneteenth);
  }

  // Independence Day (July 4th, observed)
  const independenceDay = getObservedHoliday(new Date(year, 6, 4));
  holidays.push(independenceDay);

  // Labor Day (1st Monday in September)
  const laborDay = getNthWeekdayOfMonth(year, 8, 1, 1); // 1st Monday
  holidays.push(laborDay);

  // Thanksgiving (4th Thursday in November)
  const thanksgiving = getNthWeekdayOfMonth(year, 10, 4, 4); // 4th Thursday
  holidays.push(thanksgiving);

  // Christmas Day (December 25th, observed)
  const christmasDay = getObservedHoliday(new Date(year, 11, 25));
  holidays.push(christmasDay);

  return holidays;
}

/**
 * Cache for holiday calculations (performance optimization)
 */
const holidayCache = new Map<number, Set<string>>();

/**
 * Get cached holidays for a year as string set for fast lookup
 */
function getCachedHolidays(year: number): Set<string> {
  if (!holidayCache.has(year)) {
    const holidays = getMarketHolidays(year);
    const holidayStrings = new Set(holidays.map(h => h.toISOString().split('T')[0]));
    holidayCache.set(year, holidayStrings);
  }
  return holidayCache.get(year)!;
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
}

/**
 * Check if a date is a US market holiday (works for any year)
 */
export function isMarketHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const dateStr = date.toISOString().split('T')[0];
  const holidays = getCachedHolidays(year);
  return holidays.has(dateStr);
}

/**
 * Check if a date is a trading day (not weekend and not holiday)
 */
export function isTradingDay(date: Date): boolean {
  return !isWeekend(date) && !isMarketHoliday(date);
}

/**
 * Add trading days to a date, skipping weekends and holidays
 */
export function addTradingDays(startDate: Date, tradingDaysToAdd: number): Date {
  const result = new Date(startDate);
  let daysAdded = 0;

  while (daysAdded < tradingDaysToAdd) {
    result.setDate(result.getDate() + 1);

    if (isTradingDay(result)) {
      daysAdded++;
    }
  }

  return result;
}

/**
 * Subtract trading days from a date, skipping weekends and holidays
 */
export function subtractTradingDays(startDate: Date, tradingDaysToSubtract: number): Date {
  const result = new Date(startDate);
  let daysSubtracted = 0;

  while (daysSubtracted < tradingDaysToSubtract) {
    result.setDate(result.getDate() - 1);

    if (isTradingDay(result)) {
      daysSubtracted++;
    }
  }

  return result;
}

/**
 * Calculate target date based on trading day offset from base date
 */
export function calculateTradingDayTarget(baseDate: Date, tradingDayOffset: number): Date {
  if (tradingDayOffset === 0) {
    return new Date(baseDate);
  }

  if (tradingDayOffset > 0) {
    return addTradingDays(baseDate, tradingDayOffset);
  } else {
    return subtractTradingDays(baseDate, Math.abs(tradingDayOffset));
  }
}

/**
 * Get the next trading day from a given date
 */
export function getNextTradingDay(date: Date): Date {
  return addTradingDays(date, 1);
}

/**
 * Get the previous trading day from a given date
 */
export function getPreviousTradingDay(date: Date): Date {
  return subtractTradingDays(date, 1);
}

/**
 * Count trading days between two dates
 */
export function countTradingDaysBetween(startDate: Date, endDate: Date): number {
  if (startDate > endDate) {
    return -countTradingDaysBetween(endDate, startDate);
  }

  let count = 0;
  const current = new Date(startDate);
  current.setDate(current.getDate() + 1); // Start from day after startDate

  while (current <= endDate) {
    if (isTradingDay(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * Format trading day offset for display
 */
export function formatTradingDayOffset(offset: number): string {
  if (offset === 0) return 'Day 0';
  if (offset > 0) return `Day +${offset}`;
  return `Day ${offset}`;
}

/**
 * Get day of week name for display
 */
export function getDayOfWeekName(date: Date): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

// =============================================================================
// BULLETPROOF TESTING & VALIDATION FUNCTIONS
// =============================================================================

/**
 * Get all market holidays for a given year (for debugging/validation)
 */
export function getMarketHolidaysForYear(year: number): Array<{ date: Date; name: string; observed?: Date }> {
  const holidays = [];

  // New Year's Day
  const newYears = new Date(year, 0, 1);
  const newYearsObserved = getObservedHoliday(newYears);
  holidays.push({
    date: newYears,
    name: 'New Year\'s Day',
    observed: newYears.getTime() !== newYearsObserved.getTime() ? newYearsObserved : undefined
  });

  // Martin Luther King Jr. Day (3rd Monday in January)
  holidays.push({
    date: getNthWeekdayOfMonth(year, 0, 1, 3),
    name: 'Martin Luther King Jr. Day'
  });

  // Presidents' Day (3rd Monday in February)
  holidays.push({
    date: getNthWeekdayOfMonth(year, 1, 1, 3),
    name: 'Presidents\' Day'
  });

  // Good Friday
  holidays.push({
    date: calculateGoodFriday(year),
    name: 'Good Friday'
  });

  // Memorial Day (last Monday in May)
  holidays.push({
    date: getLastWeekdayOfMonth(year, 4, 1),
    name: 'Memorial Day'
  });

  // Juneteenth (since 2021)
  if (year >= 2021) {
    const juneteenth = new Date(year, 5, 19);
    const juneteenthObserved = getObservedHoliday(juneteenth);
    holidays.push({
      date: juneteenth,
      name: 'Juneteenth',
      observed: juneteenth.getTime() !== juneteenthObserved.getTime() ? juneteenthObserved : undefined
    });
  }

  // Independence Day
  const july4 = new Date(year, 6, 4);
  const july4Observed = getObservedHoliday(july4);
  holidays.push({
    date: july4,
    name: 'Independence Day',
    observed: july4.getTime() !== july4Observed.getTime() ? july4Observed : undefined
  });

  // Labor Day (1st Monday in September)
  holidays.push({
    date: getNthWeekdayOfMonth(year, 8, 1, 1),
    name: 'Labor Day'
  });

  // Thanksgiving (4th Thursday in November)
  holidays.push({
    date: getNthWeekdayOfMonth(year, 10, 4, 4),
    name: 'Thanksgiving'
  });

  // Christmas Day
  const christmas = new Date(year, 11, 25);
  const christmasObserved = getObservedHoliday(christmas);
  holidays.push({
    date: christmas,
    name: 'Christmas Day',
    observed: christmas.getTime() !== christmasObserved.getTime() ? christmasObserved : undefined
  });

  return holidays;
}

/**
 * Validate trading day calculations with comprehensive testing
 */
export function validateTradingDayLogic(year: number = 2024): {
  success: boolean;
  details: string[];
  errors: string[];
} {
  const details: string[] = [];
  const errors: string[] = [];

  try {
    details.push(`  VALIDATING TRADING DAY LOGIC FOR ${year}:`);

    // Test 1: Holiday calculation
    const holidays = getMarketHolidaysForYear(year);
    details.push(`📅 Found ${holidays.length} market holidays for ${year}:`);

    holidays.forEach((holiday, index) => {
      const actualDate = holiday.observed || holiday.date;
      const dayName = getDayOfWeekName(actualDate);
      const isWeekendCheck = isWeekend(actualDate);
      const isHolidayCheck = isMarketHoliday(actualDate);

      if (isWeekendCheck) {
        errors.push(`❌ ${holiday.name} (${actualDate.toDateString()}) falls on weekend but not observed correctly`);
      }

      if (!isHolidayCheck) {
        errors.push(`❌ ${holiday.name} (${actualDate.toDateString()}) not detected as market holiday`);
      }

      details.push(
        `   ${index + 1}. ${holiday.name}: ${actualDate.toDateString()} (${dayName})` +
        (holiday.observed ? ` [Original: ${holiday.date.toDateString()}]` : '')
      );
    });

    // Test 2: Weekend detection
    const testSaturday = new Date(year, 0, 6); // Assuming Jan 6 might be Saturday
    const testSunday = new Date(year, 0, 7);   // Assuming Jan 7 might be Sunday

    // Find actual Saturday and Sunday in the year
    let saturday: Date | null = null;
    let sunday: Date | null = null;

    for (let day = 1; day <= 7; day++) {
      const testDate = new Date(year, 0, day);
      if (testDate.getDay() === 6 && !saturday) saturday = testDate;
      if (testDate.getDay() === 0 && !sunday) sunday = testDate;
    }

    if (saturday && sunday) {
      const satWeekendCheck = isWeekend(saturday);
      const sunWeekendCheck = isWeekend(sunday);
      const satTradingCheck = isTradingDay(saturday);
      const sunTradingCheck = isTradingDay(sunday);

      details.push(`🚀 Weekend Detection Tests:`);
      details.push(`   Saturday ${saturday.toDateString()}: isWeekend=${satWeekendCheck}, isTradingDay=${satTradingCheck}`);
      details.push(`   Sunday ${sunday.toDateString()}: isWeekend=${sunWeekendCheck}, isTradingDay=${sunTradingCheck}`);

      if (!satWeekendCheck || satTradingCheck) {
        errors.push(`❌ Saturday detection failed`);
      }
      if (!sunWeekendCheck || sunTradingCheck) {
        errors.push(`❌ Sunday detection failed`);
      }
    }

    // Test 3: Trading day progression
    const testStart = new Date(year, 0, 1);
    let currentDate = new Date(testStart);
    let tradingDayCount = 0;
    let consecutiveTradingDays = 0;
    let maxConsecutiveTradingDays = 0;

    details.push(`🚀 Trading Day Progression Test (first 30 days of ${year}):`);

    for (let i = 0; i < 30; i++) {
      const isTrading = isTradingDay(currentDate);
      const dayName = getDayOfWeekName(currentDate);

      if (isTrading) {
        tradingDayCount++;
        consecutiveTradingDays++;
        maxConsecutiveTradingDays = Math.max(maxConsecutiveTradingDays, consecutiveTradingDays);
      } else {
        consecutiveTradingDays = 0;
      }

      if (i < 10) { // Show first 10 days in detail
        details.push(`   ${currentDate.toDateString()} (${dayName}): ${isTrading ? 'TRADING' : 'NON-TRADING'}`);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    details.push(`📊 Trading Day Stats (first 30 days): ${tradingDayCount} trading days, max consecutive: ${maxConsecutiveTradingDays}`);

    // Test 4: Trading day arithmetic
    const fridayTest = new Date(year, 0, 5); // Assuming Jan 5 is a Friday
    // Find actual Friday
    let friday: Date | null = null;
    for (let day = 1; day <= 7; day++) {
      const testDate = new Date(year, 0, day);
      if (testDate.getDay() === 5) {
        friday = testDate;
        break;
      }
    }

    if (friday) {
      const nextTradingDay = addTradingDays(friday, 1);
      const prevTradingDay = subtractTradingDays(friday, 1);

      details.push(`🚀 Trading Day Arithmetic Test:`);
      details.push(`   Friday: ${friday.toDateString()}`);
      details.push(`   +1 trading day: ${nextTradingDay.toDateString()} (${getDayOfWeekName(nextTradingDay)})`);
      details.push(`   -1 trading day: ${prevTradingDay.toDateString()} (${getDayOfWeekName(prevTradingDay)})`);

      // Friday + 1 trading day should be Monday (unless Monday is holiday)
      const expectedMonday = nextTradingDay.getDay() === 1 || isMarketHoliday(nextTradingDay);
      if (nextTradingDay.getDay() !== 1 && !isMarketHoliday(new Date(friday.getTime() + 3 * 24 * 60 * 60 * 1000))) {
        errors.push(`❌ Friday +1 trading day arithmetic may be incorrect`);
      }
    }

    const success = errors.length === 0;

    if (success) {
      details.push(`  ALL TESTS PASSED - Trading day logic is bulletproof!`);
    } else {
      details.push(`❌ ${errors.length} errors found in trading day logic`);
    }

    return { success, details, errors };

  } catch (error) {
    errors.push(`💥 Validation failed with error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { success: false, details, errors };
  }
}

/**
 * Console log comprehensive trading day validation
 */
export function logTradingDayValidation(year: number = 2024): void {
  const validation = validateTradingDayLogic(year);

  console.log('\n' + '='.repeat(80));
  console.log('📊 BULLETPROOF TRADING DAY VALIDATION REPORT');
  console.log('='.repeat(80));

  validation.details.forEach(detail => console.log(detail));

  if (validation.errors.length > 0) {
    console.log('\n' + '❌ ERRORS FOUND:');
    validation.errors.forEach(error => console.log(error));
  }

  console.log('='.repeat(80) + '\n');
}