/**
 * BULLETPROOF 100-COMMAND TEST SUITE
 * Comprehensive testing of multi-step command execution
 * Goal: 100% success rate on all complex multi-step commands
 */

// Test commands with expected actions
const multiStepCommands = [
  // CATEGORY 1: Navigation + Display Mode (20 commands)
  {
    id: 1,
    command: "Show me the dashboard in dollars",
    expected: [
      { name: "navigateToPage", args: { page: "dashboard" }},
      { name: "setDisplayMode", args: { mode: "dollar" }}
    ]
  },
  {
    id: 2,
    command: "Go to statistics in R mode",
    expected: [
      { name: "navigateToPage", args: { page: "statistics" }},
      { name: "setDisplayMode", args: { mode: "r" }}
    ]
  },
  {
    id: 3,
    command: "Take me to the trades page and show in dollars",
    expected: [
      { name: "navigateToPage", args: { page: "trades" }},
      { name: "setDisplayMode", args: { mode: "dollar" }}
    ]
  },
  {
    id: 4,
    command: "I want to see the journal in R multiples",
    expected: [
      { name: "navigateToPage", args: { page: "journal" }},
      { name: "setDisplayMode", args: { mode: "r" }}
    ]
  },
  {
    id: 5,
    command: "Open analytics and switch to gross mode",
    expected: [
      { name: "navigateToPage", args: { page: "analytics" }},
      { name: "setDisplayMode", args: { mode: "gross" }}
    ]
  },
  {
    id: 6,
    command: "Calendar view in net mode please",
    expected: [
      { name: "navigateToPage", args: { page: "calendar" }},
      { name: "setDisplayMode", args: { mode: "net" }}
    ]
  },
  {
    id: 7,
    command: "Dashboard with R multiple display",
    expected: [
      { name: "navigateToPage", args: { page: "dashboard" }},
      { name: "setDisplayMode", args: { mode: "r" }}
    ]
  },
  {
    id: 8,
    command: "Stats page showing dollar amounts",
    expected: [
      { name: "navigateToPage", args: { page: "statistics" }},
      { name: "setDisplayMode", args: { mode: "dollar" }}
    ]
  },
  {
    id: 9,
    command: "Trades in gross profit mode",
    expected: [
      { name: "navigateToPage", args: { page: "trades" }},
      { name: "setDisplayMode", args: { mode: "gross" }}
    ]
  },
  {
    id: 10,
    command: "Journal with net profit display",
    expected: [
      { name: "navigateToPage", args: { page: "journal" }},
      { name: "setDisplayMode", args: { mode: "net" }}
    ]
  },
  {
    id: 11,
    command: "Switch to analytics and display in dollars",
    expected: [
      { name: "navigateToPage", args: { page: "analytics" }},
      { name: "setDisplayMode", args: { mode: "dollar" }}
    ]
  },
  {
    id: 12,
    command: "Go to calendar showing R values",
    expected: [
      { name: "navigateToPage", args: { page: "calendar" }},
      { name: "setDisplayMode", args: { mode: "r" }}
    ]
  },
  {
    id: 13,
    command: "Navigate to dashboard and show gross",
    expected: [
      { name: "navigateToPage", args: { page: "dashboard" }},
      { name: "setDisplayMode", args: { mode: "gross" }}
    ]
  },
  {
    id: 14,
    command: "Statistics view in net display mode",
    expected: [
      { name: "navigateToPage", args: { page: "statistics" }},
      { name: "setDisplayMode", args: { mode: "net" }}
    ]
  },
  {
    id: 15,
    command: "View trades page with dollar display",
    expected: [
      { name: "navigateToPage", args: { page: "trades" }},
      { name: "setDisplayMode", args: { mode: "dollar" }}
    ]
  },
  {
    id: 16,
    command: "Journal page in R multiple format",
    expected: [
      { name: "navigateToPage", args: { page: "journal" }},
      { name: "setDisplayMode", args: { mode: "r" }}
    ]
  },
  {
    id: 17,
    command: "Open analytics with gross display",
    expected: [
      { name: "navigateToPage", args: { page: "analytics" }},
      { name: "setDisplayMode", args: { mode: "gross" }}
    ]
  },
  {
    id: 18,
    command: "Calendar showing net values",
    expected: [
      { name: "navigateToPage", args: { page: "calendar" }},
      { name: "setDisplayMode", args: { mode: "net" }}
    ]
  },
  {
    id: 19,
    command: "Dashboard in dollar view mode",
    expected: [
      { name: "navigateToPage", args: { page: "dashboard" }},
      { name: "setDisplayMode", args: { mode: "dollar" }}
    ]
  },
  {
    id: 20,
    command: "Go to stats and display R multiples",
    expected: [
      { name: "navigateToPage", args: { page: "statistics" }},
      { name: "setDisplayMode", args: { mode: "r" }}
    ]
  },

  // CATEGORY 2: Navigation + Date Range (20 commands)
  {
    id: 21,
    command: "Dashboard showing today's data",
    expected: [
      { name: "navigateToPage", args: { page: "dashboard" }},
      { name: "setDateRange", args: { range: "today" }}
    ]
  },
  {
    id: 22,
    command: "Statistics for this week",
    expected: [
      { name: "navigateToPage", args: { page: "statistics" }},
      { name: "setDateRange", args: { range: "week" }}
    ]
  },
  {
    id: 23,
    command: "Trades from last month",
    expected: [
      { name: "navigateToPage", args: { page: "trades" }},
      { name: "setDateRange", args: { range: "lastMonth" }}
    ]
  },
  {
    id: 24,
    command: "Journal entries for yesterday",
    expected: [
      { name: "navigateToPage", args: { page: "journal" }},
      { name: "setDateRange", args: { range: "yesterday" }}
    ]
  },
  {
    id: 25,
    command: "Analytics for all time data",
    expected: [
      { name: "navigateToPage", args: { page: "analytics" }},
      { name: "setDateRange", args: { range: "all" }}
    ]
  },
  {
    id: 26,
    command: "Calendar view for this month",
    expected: [
      { name: "navigateToPage", args: { page: "calendar" }},
      { name: "setDateRange", args: { range: "month" }}
    ]
  },
  {
    id: 27,
    command: "Dashboard with 90 day period",
    expected: [
      { name: "navigateToPage", args: { page: "dashboard" }},
      { name: "setDateRange", args: { range: "90day" }}
    ]
  },
  {
    id: 28,
    command: "Stats for last week",
    expected: [
      { name: "navigateToPage", args: { page: "statistics" }},
      { name: "setDateRange", args: { range: "lastWeek" }}
    ]
  },
  {
    id: 29,
    command: "Show trades from today",
    expected: [
      { name: "navigateToPage", args: { page: "trades" }},
      { name: "setDateRange", args: { range: "today" }}
    ]
  },
  {
    id: 30,
    command: "Journal for this week",
    expected: [
      { name: "navigateToPage", args: { page: "journal" }},
      { name: "setDateRange", args: { range: "week" }}
    ]
  },
  {
    id: 31,
    command: "Analytics from yesterday",
    expected: [
      { name: "navigateToPage", args: { page: "analytics" }},
      { name: "setDateRange", args: { range: "yesterday" }}
    ]
  },
  {
    id: 32,
    command: "Calendar showing all data",
    expected: [
      { name: "navigateToPage", args: { page: "calendar" }},
      { name: "setDateRange", args: { range: "all" }}
    ]
  },
  {
    id: 33,
    command: "Dashboard for last month",
    expected: [
      { name: "navigateToPage", args: { page: "dashboard" }},
      { name: "setDateRange", args: { range: "lastMonth" }}
    ]
  },
  {
    id: 34,
    command: "Statistics for this month",
    expected: [
      { name: "navigateToPage", args: { page: "statistics" }},
      { name: "setDateRange", args: { range: "month" }}
    ]
  },
  {
    id: 35,
    command: "Trades over 90 days",
    expected: [
      { name: "navigateToPage", args: { page: "trades" }},
      { name: "setDateRange", args: { range: "90day" }}
    ]
  },
  {
    id: 36,
    command: "Journal from last week",
    expected: [
      { name: "navigateToPage", args: { page: "journal" }},
      { name: "setDateRange", args: { range: "lastWeek" }}
    ]
  },
  {
    id: 37,
    command: "Analytics for today",
    expected: [
      { name: "navigateToPage", args: { page: "analytics" }},
      { name: "setDateRange", args: { range: "today" }}
    ]
  },
  {
    id: 38,
    command: "Calendar for this week",
    expected: [
      { name: "navigateToPage", args: { page: "calendar" }},
      { name: "setDateRange", args: { range: "week" }}
    ]
  },
  {
    id: 39,
    command: "Dashboard showing yesterday's data",
    expected: [
      { name: "navigateToPage", args: { page: "dashboard" }},
      { name: "setDateRange", args: { range: "yesterday" }}
    ]
  },
  {
    id: 40,
    command: "Full history statistics view",
    expected: [
      { name: "navigateToPage", args: { page: "statistics" }},
      { name: "setDateRange", args: { range: "all" }}
    ]
  },

  // CATEGORY 3: Triple Actions - Navigation + Display + Date (30 commands)
  {
    id: 41,
    command: "Dashboard in dollars for today",
    expected: [
      { name: "navigateToPage", args: { page: "dashboard" }},
      { name: "setDisplayMode", args: { mode: "dollar" }},
      { name: "setDateRange", args: { range: "today" }}
    ]
  },
  {
    id: 42,
    command: "Statistics in R mode for this week",
    expected: [
      { name: "navigateToPage", args: { page: "statistics" }},
      { name: "setDisplayMode", args: { mode: "r" }},
      { name: "setDateRange", args: { range: "week" }}
    ]
  },
  {
    id: 43,
    command: "Trades in gross mode for last month",
    expected: [
      { name: "navigateToPage", args: { page: "trades" }},
      { name: "setDisplayMode", args: { mode: "gross" }},
      { name: "setDateRange", args: { range: "lastMonth" }}
    ]
  },
  {
    id: 44,
    command: "Journal in net mode for yesterday",
    expected: [
      { name: "navigateToPage", args: { page: "journal" }},
      { name: "setDisplayMode", args: { mode: "net" }},
      { name: "setDateRange", args: { range: "yesterday" }}
    ]
  },
  {
    id: 45,
    command: "Analytics in dollars for all time",
    expected: [
      { name: "navigateToPage", args: { page: "analytics" }},
      { name: "setDisplayMode", args: { mode: "dollar" }},
      { name: "setDateRange", args: { range: "all" }}
    ]
  },
  {
    id: 46,
    command: "Calendar in R multiples for this month",
    expected: [
      { name: "navigateToPage", args: { page: "calendar" }},
      { name: "setDisplayMode", args: { mode: "r" }},
      { name: "setDateRange", args: { range: "month" }}
    ]
  },
  {
    id: 47,
    command: "Dashboard showing gross profits for 90 days",
    expected: [
      { name: "navigateToPage", args: { page: "dashboard" }},
      { name: "setDisplayMode", args: { mode: "gross" }},
      { name: "setDateRange", args: { range: "90day" }}
    ]
  },
  {
    id: 48,
    command: "Statistics in net display for last week",
    expected: [
      { name: "navigateToPage", args: { page: "statistics" }},
      { name: "setDisplayMode", args: { mode: "net" }},
      { name: "setDateRange", args: { range: "lastWeek" }}
    ]
  },
  {
    id: 49,
    command: "Trades in dollar view for today",
    expected: [
      { name: "navigateToPage", args: { page: "trades" }},
      { name: "setDisplayMode", args: { mode: "dollar" }},
      { name: "setDateRange", args: { range: "today" }}
    ]
  },
  {
    id: 50,
    command: "Journal with R values for this week",
    expected: [
      { name: "navigateToPage", args: { page: "journal" }},
      { name: "setDisplayMode", args: { mode: "r" }},
      { name: "setDateRange", args: { range: "week" }}
    ]
  },
  // Continue with the rest of the 100 commands...
  {
    id: 51,
    command: "Show analytics with gross display for yesterday",
    expected: [
      { name: "navigateToPage", args: { page: "analytics" }},
      { name: "setDisplayMode", args: { mode: "gross" }},
      { name: "setDateRange", args: { range: "yesterday" }}
    ]
  },
  {
    id: 52,
    command: "Calendar in net mode showing all data",
    expected: [
      { name: "navigateToPage", args: { page: "calendar" }},
      { name: "setDisplayMode", args: { mode: "net" }},
      { name: "setDateRange", args: { range: "all" }}
    ]
  },
  {
    id: 53,
    command: "Dashboard in dollar format for last month",
    expected: [
      { name: "navigateToPage", args: { page: "dashboard" }},
      { name: "setDisplayMode", args: { mode: "dollar" }},
      { name: "setDateRange", args: { range: "lastMonth" }}
    ]
  },
  {
    id: 54,
    command: "Statistics with R display for this month",
    expected: [
      { name: "navigateToPage", args: { page: "statistics" }},
      { name: "setDisplayMode", args: { mode: "r" }},
      { name: "setDateRange", args: { range: "month" }}
    ]
  },
  {
    id: 55,
    command: "Trades showing gross values for 90 days",
    expected: [
      { name: "navigateToPage", args: { page: "trades" }},
      { name: "setDisplayMode", args: { mode: "gross" }},
      { name: "setDateRange", args: { range: "90day" }}
    ]
  },
  {
    id: 56,
    command: "Journal in net format for last week",
    expected: [
      { name: "navigateToPage", args: { page: "journal" }},
      { name: "setDisplayMode", args: { mode: "net" }},
      { name: "setDateRange", args: { range: "lastWeek" }}
    ]
  },
  {
    id: 57,
    command: "Analytics in dollars for today",
    expected: [
      { name: "navigateToPage", args: { page: "analytics" }},
      { name: "setDisplayMode", args: { mode: "dollar" }},
      { name: "setDateRange", args: { range: "today" }}
    ]
  },
  {
    id: 58,
    command: "Calendar with R multiples for this week",
    expected: [
      { name: "navigateToPage", args: { page: "calendar" }},
      { name: "setDisplayMode", args: { mode: "r" }},
      { name: "setDateRange", args: { range: "week" }}
    ]
  },
  {
    id: 59,
    command: "Dashboard displaying gross for yesterday",
    expected: [
      { name: "navigateToPage", args: { page: "dashboard" }},
      { name: "setDisplayMode", args: { mode: "gross" }},
      { name: "setDateRange", args: { range: "yesterday" }}
    ]
  },
  {
    id: 60,
    command: "Statistics in net mode for full history",
    expected: [
      { name: "navigateToPage", args: { page: "statistics" }},
      { name: "setDisplayMode", args: { mode: "net" }},
      { name: "setDateRange", args: { range: "all" }}
    ]
  },
  {
    id: 61,
    command: "Trades page in dollar view for last month",
    expected: [
      { name: "navigateToPage", args: { page: "trades" }},
      { name: "setDisplayMode", args: { mode: "dollar" }},
      { name: "setDateRange", args: { range: "lastMonth" }}
    ]
  },
  {
    id: 62,
    command: "Journal showing R values for this month",
    expected: [
      { name: "navigateToPage", args: { page: "journal" }},
      { name: "setDisplayMode", args: { mode: "r" }},
      { name: "setDateRange", args: { range: "month" }}
    ]
  },
  {
    id: 63,
    command: "Analytics with gross display for 90 days",
    expected: [
      { name: "navigateToPage", args: { page: "analytics" }},
      { name: "setDisplayMode", args: { mode: "gross" }},
      { name: "setDateRange", args: { range: "90day" }}
    ]
  },
  {
    id: 64,
    command: "Calendar in net format for last week",
    expected: [
      { name: "navigateToPage", args: { page: "calendar" }},
      { name: "setDisplayMode", args: { mode: "net" }},
      { name: "setDateRange", args: { range: "lastWeek" }}
    ]
  },
  {
    id: 65,
    command: "Dashboard in dollars for today",
    expected: [
      { name: "navigateToPage", args: { page: "dashboard" }},
      { name: "setDisplayMode", args: { mode: "dollar" }},
      { name: "setDateRange", args: { range: "today" }}
    ]
  },
  {
    id: 66,
    command: "Statistics with R multiples for this week",
    expected: [
      { name: "navigateToPage", args: { page: "statistics" }},
      { name: "setDisplayMode", args: { mode: "r" }},
      { name: "setDateRange", args: { range: "week" }}
    ]
  },
  {
    id: 67,
    command: "Trades showing gross profits for yesterday",
    expected: [
      { name: "navigateToPage", args: { page: "trades" }},
      { name: "setDisplayMode", args: { mode: "gross" }},
      { name: "setDateRange", args: { range: "yesterday" }}
    ]
  },
  {
    id: 68,
    command: "Journal in net display for all time data",
    expected: [
      { name: "navigateToPage", args: { page: "journal" }},
      { name: "setDisplayMode", args: { mode: "net" }},
      { name: "setDateRange", args: { range: "all" }}
    ]
  },
  {
    id: 69,
    command: "Analytics in dollar format for last month",
    expected: [
      { name: "navigateToPage", args: { page: "analytics" }},
      { name: "setDisplayMode", args: { mode: "dollar" }},
      { name: "setDateRange", args: { range: "lastMonth" }}
    ]
  },
  {
    id: 70,
    command: "Calendar displaying R values for this month",
    expected: [
      { name: "navigateToPage", args: { page: "calendar" }},
      { name: "setDisplayMode", args: { mode: "r" }},
      { name: "setDateRange", args: { range: "month" }}
    ]
  },

  // CATEGORY 4: Complex Variations and Edge Cases (30 commands)
  {
    id: 71,
    command: "Take me to the dashboard and show everything in dollars for all time",
    expected: [
      { name: "navigateToPage", args: { page: "dashboard" }},
      { name: "setDisplayMode", args: { mode: "dollar" }},
      { name: "setDateRange", args: { range: "all" }}
    ]
  },
  {
    id: 72,
    command: "I want to see stats in R mode for the past 90 days",
    expected: [
      { name: "navigateToPage", args: { page: "statistics" }},
      { name: "setDisplayMode", args: { mode: "r" }},
      { name: "setDateRange", args: { range: "90day" }}
    ]
  },
  {
    id: 73,
    command: "Open the trades page, show gross profits, and filter to this week",
    expected: [
      { name: "navigateToPage", args: { page: "trades" }},
      { name: "setDisplayMode", args: { mode: "gross" }},
      { name: "setDateRange", args: { range: "week" }}
    ]
  },
  {
    id: 74,
    command: "Navigate to journal, switch to net mode, and show yesterday's entries",
    expected: [
      { name: "navigateToPage", args: { page: "journal" }},
      { name: "setDisplayMode", args: { mode: "net" }},
      { name: "setDateRange", args: { range: "yesterday" }}
    ]
  },
  {
    id: 75,
    command: "Go to analytics with dollar display for last week's data",
    expected: [
      { name: "navigateToPage", args: { page: "analytics" }},
      { name: "setDisplayMode", args: { mode: "dollar" }},
      { name: "setDateRange", args: { range: "lastWeek" }}
    ]
  },
  {
    id: 76,
    command: "Calendar view showing R multiples for today only",
    expected: [
      { name: "navigateToPage", args: { page: "calendar" }},
      { name: "setDisplayMode", args: { mode: "r" }},
      { name: "setDateRange", args: { range: "today" }}
    ]
  },
  {
    id: 77,
    command: "Dashboard with gross display mode for this month's data",
    expected: [
      { name: "navigateToPage", args: { page: "dashboard" }},
      { name: "setDisplayMode", args: { mode: "gross" }},
      { name: "setDateRange", args: { range: "month" }}
    ]
  },
  {
    id: 78,
    command: "Statistics page in net format showing last month's results",
    expected: [
      { name: "navigateToPage", args: { page: "statistics" }},
      { name: "setDisplayMode", args: { mode: "net" }},
      { name: "setDateRange", args: { range: "lastMonth" }}
    ]
  },
  {
    id: 79,
    command: "View trades in dollars for the entire history",
    expected: [
      { name: "navigateToPage", args: { page: "trades" }},
      { name: "setDisplayMode", args: { mode: "dollar" }},
      { name: "setDateRange", args: { range: "all" }}
    ]
  },
  {
    id: 80,
    command: "Journal entries with R display for 90 day period",
    expected: [
      { name: "navigateToPage", args: { page: "journal" }},
      { name: "setDisplayMode", args: { mode: "r" }},
      { name: "setDateRange", args: { range: "90day" }}
    ]
  },
  {
    id: 81,
    command: "Analytics showing gross values for this week",
    expected: [
      { name: "navigateToPage", args: { page: "analytics" }},
      { name: "setDisplayMode", args: { mode: "gross" }},
      { name: "setDateRange", args: { range: "week" }}
    ]
  },
  {
    id: 82,
    command: "Calendar with net display for yesterday's data",
    expected: [
      { name: "navigateToPage", args: { page: "calendar" }},
      { name: "setDisplayMode", args: { mode: "net" }},
      { name: "setDateRange", args: { range: "yesterday" }}
    ]
  },
  {
    id: 83,
    command: "Show me dashboard in dollar mode for all available data",
    expected: [
      { name: "navigateToPage", args: { page: "dashboard" }},
      { name: "setDisplayMode", args: { mode: "dollar" }},
      { name: "setDateRange", args: { range: "all" }}
    ]
  },
  {
    id: 84,
    command: "Statistics with R multiples for last week's trading",
    expected: [
      { name: "navigateToPage", args: { page: "statistics" }},
      { name: "setDisplayMode", args: { mode: "r" }},
      { name: "setDateRange", args: { range: "lastWeek" }}
    ]
  },
  {
    id: 85,
    command: "Trades page displaying gross for today's activity",
    expected: [
      { name: "navigateToPage", args: { page: "trades" }},
      { name: "setDisplayMode", args: { mode: "gross" }},
      { name: "setDateRange", args: { range: "today" }}
    ]
  },
  {
    id: 86,
    command: "Journal in net format for this month's entries",
    expected: [
      { name: "navigateToPage", args: { page: "journal" }},
      { name: "setDisplayMode", args: { mode: "net" }},
      { name: "setDateRange", args: { range: "month" }}
    ]
  },
  {
    id: 87,
    command: "Analytics page with dollar values for last month",
    expected: [
      { name: "navigateToPage", args: { page: "analytics" }},
      { name: "setDisplayMode", args: { mode: "dollar" }},
      { name: "setDateRange", args: { range: "lastMonth" }}
    ]
  },
  {
    id: 88,
    command: "Calendar showing R display for 90 day view",
    expected: [
      { name: "navigateToPage", args: { page: "calendar" }},
      { name: "setDisplayMode", args: { mode: "r" }},
      { name: "setDateRange", args: { range: "90day" }}
    ]
  },
  {
    id: 89,
    command: "Dashboard with gross mode for this week's performance",
    expected: [
      { name: "navigateToPage", args: { page: "dashboard" }},
      { name: "setDisplayMode", args: { mode: "gross" }},
      { name: "setDateRange", args: { range: "week" }}
    ]
  },
  {
    id: 90,
    command: "Statistics in net display for yesterday's results",
    expected: [
      { name: "navigateToPage", args: { page: "statistics" }},
      { name: "setDisplayMode", args: { mode: "net" }},
      { name: "setDateRange", args: { range: "yesterday" }}
    ]
  },
  {
    id: 91,
    command: "Trades showing dollars for complete trading history",
    expected: [
      { name: "navigateToPage", args: { page: "trades" }},
      { name: "setDisplayMode", args: { mode: "dollar" }},
      { name: "setDateRange", args: { range: "all" }}
    ]
  },
  {
    id: 92,
    command: "Journal with R values for last week's notes",
    expected: [
      { name: "navigateToPage", args: { page: "journal" }},
      { name: "setDisplayMode", args: { mode: "r" }},
      { name: "setDateRange", args: { range: "lastWeek" }}
    ]
  },
  {
    id: 93,
    command: "Analytics displaying gross profits for today",
    expected: [
      { name: "navigateToPage", args: { page: "analytics" }},
      { name: "setDisplayMode", args: { mode: "gross" }},
      { name: "setDateRange", args: { range: "today" }}
    ]
  },
  {
    id: 94,
    command: "Calendar in net mode for this month's schedule",
    expected: [
      { name: "navigateToPage", args: { page: "calendar" }},
      { name: "setDisplayMode", args: { mode: "net" }},
      { name: "setDateRange", args: { range: "month" }}
    ]
  },
  {
    id: 95,
    command: "Dashboard view in dollars for last month's summary",
    expected: [
      { name: "navigateToPage", args: { page: "dashboard" }},
      { name: "setDisplayMode", args: { mode: "dollar" }},
      { name: "setDateRange", args: { range: "lastMonth" }}
    ]
  },
  {
    id: 96,
    command: "Statistics with R multiples for quarterly data",
    expected: [
      { name: "navigateToPage", args: { page: "statistics" }},
      { name: "setDisplayMode", args: { mode: "r" }},
      { name: "setDateRange", args: { range: "90day" }}
    ]
  },
  {
    id: 97,
    command: "Trades page showing gross for this week's activity",
    expected: [
      { name: "navigateToPage", args: { page: "trades" }},
      { name: "setDisplayMode", args: { mode: "gross" }},
      { name: "setDateRange", args: { range: "week" }}
    ]
  },
  {
    id: 98,
    command: "Journal entries in net format for yesterday",
    expected: [
      { name: "navigateToPage", args: { page: "journal" }},
      { name: "setDisplayMode", args: { mode: "net" }},
      { name: "setDateRange", args: { range: "yesterday" }}
    ]
  },
  {
    id: 99,
    command: "Analytics with dollar display for all time analysis",
    expected: [
      { name: "navigateToPage", args: { page: "analytics" }},
      { name: "setDisplayMode", args: { mode: "dollar" }},
      { name: "setDateRange", args: { range: "all" }}
    ]
  },
  {
    id: 100,
    command: "Calendar showing R values for last week's appointments",
    expected: [
      { name: "navigateToPage", args: { page: "calendar" }},
      { name: "setDisplayMode", args: { mode: "r" }},
      { name: "setDateRange", args: { range: "lastWeek" }}
    ]
  }
];

async function testCommand(commandData) {
  const { id, command, expected } = commandData;

  try {
    const response = await fetch('http://localhost:6565/api/copilotkit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operationName: 'generateCopilotResponse',
        query: `
          mutation generateCopilotResponse($data: CopilotResponseInput!) {
            generateCopilotResponse(data: $data) {
              threadId
              runId
              extensions
              messages {
                __typename
                id
                createdAt
                content
                role
                parentMessageId
                status {
                  __typename
                  code
                }
              }
              metaEvents {
                __typename
                id
                name
                args
                timestamp
              }
            }
          }
        `,
        variables: {
          data: {
            messages: [{
              content: command,
              role: 'user'
            }]
          }
        }
      })
    });

    const data = await response.json();
    const actions = data?.data?.generateCopilotResponse?.metaEvents || [];

    // Check if all expected actions are present
    let matchedActions = 0;
    const missingActions = [];
    const extraActions = [];

    for (const expectedAction of expected) {
      const found = actions.find(action =>
        action.name === expectedAction.name &&
        JSON.stringify(action.args) === JSON.stringify(expectedAction.args)
      );
      if (found) {
        matchedActions++;
      } else {
        missingActions.push(expectedAction);
      }
    }

    // Check for extra actions not in expected
    for (const action of actions) {
      const found = expected.find(expectedAction =>
        action.name === expectedAction.name &&
        JSON.stringify(action.args) === JSON.stringify(expectedAction.args)
      );
      if (!found) {
        extraActions.push(action);
      }
    }

    const successRate = (matchedActions / expected.length * 100).toFixed(1);
    const isSuccess = matchedActions === expected.length && extraActions.length === 0;

    return {
      id,
      command,
      expected: expected.length,
      found: actions.length,
      matched: matchedActions,
      successRate: parseFloat(successRate),
      isSuccess,
      missingActions,
      extraActions,
      actions: actions.map(a => ({ name: a.name, args: a.args }))
    };

  } catch (error) {
    return {
      id,
      command,
      expected: expected.length,
      found: 0,
      matched: 0,
      successRate: 0,
      isSuccess: false,
      error: error.message,
      missingActions: expected,
      extraActions: [],
      actions: []
    };
  }
}

async function runBulletproofTest() {
  console.log('🎯 BULLETPROOF 100-COMMAND TEST SUITE');
  console.log('Goal: 100% success rate on all multi-step commands\n');

  const results = [];
  let totalSuccess = 0;
  let totalCommands = multiStepCommands.length;

  // Test all commands
  for (let i = 0; i < multiStepCommands.length; i++) {
    const commandData = multiStepCommands[i];
    console.log(`Testing ${i + 1}/${totalCommands}: "${commandData.command}"`);

    const result = await testCommand(commandData);
    results.push(result);

    if (result.isSuccess) {
      totalSuccess++;
      console.log(`✅ Success (${result.successRate}%)`);
    } else {
      console.log(`❌ Failed (${result.successRate}%) - Expected: ${result.expected}, Found: ${result.found}, Matched: ${result.matched}`);
      if (result.missingActions.length > 0) {
        console.log(`  Missing: ${result.missingActions.map(a => `${a.name}(${JSON.stringify(a.args)})`).join(', ')}`);
      }
      if (result.extraActions.length > 0) {
        console.log(`  Extra: ${result.extraActions.map(a => `${a.name}(${JSON.stringify(a.args)})`).join(', ')}`);
      }
    }
    console.log('');

    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Generate comprehensive report
  const overallSuccessRate = (totalSuccess / totalCommands * 100).toFixed(1);
  const failed = results.filter(r => !r.isSuccess);

  console.log('🏁 BULLETPROOF TEST RESULTS');
  console.log('=' + '='.repeat(50));
  console.log(`Overall Success Rate: ${overallSuccessRate}% (${totalSuccess}/${totalCommands})`);
  console.log(`Passed: ${totalSuccess}`);
  console.log(`Failed: ${failed.length}`);
  console.log('');

  if (failed.length > 0) {
    console.log('❌ FAILED COMMANDS:');
    failed.forEach(result => {
      console.log(`  ${result.id}: "${result.command}" (${result.successRate}%)`);
      if (result.missingActions.length > 0) {
        console.log(`    Missing: ${result.missingActions.map(a => `${a.name}(${JSON.stringify(a.args)})`).join(', ')}`);
      }
    });
    console.log('');
  }

  // Category analysis
  const categories = {
    'Navigation + Display (1-20)': results.slice(0, 20),
    'Navigation + Date (21-40)': results.slice(20, 40),
    'Triple Actions (41-70)': results.slice(40, 70),
    'Complex Variations (71-100)': results.slice(70, 100)
  };

  console.log('📊 CATEGORY BREAKDOWN:');
  for (const [category, categoryResults] of Object.entries(categories)) {
    const categorySuccess = categoryResults.filter(r => r.isSuccess).length;
    const categoryRate = (categorySuccess / categoryResults.length * 100).toFixed(1);
    console.log(`  ${category}: ${categoryRate}% (${categorySuccess}/${categoryResults.length})`);
  }

  console.log('');
  console.log(overallSuccessRate === '100.0' ?
    '🎉 BULLETPROOF SYSTEM ACHIEVED! 🎉' :
    '🔧 System needs improvement to achieve bulletproof status'
  );

  return {
    overallSuccessRate: parseFloat(overallSuccessRate),
    totalSuccess,
    totalCommands,
    failed,
    results,
    categories
  };
}

// Run the test
runBulletproofTest().then(testResults => {
  process.exit(testResults.overallSuccessRate === 100 ? 0 : 1);
}).catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});