"""
Renata Command Parser with Learning Capabilities

This module provides intelligent command parsing that can distinguish between:
- UI commands ("switch to R", "show dollars")
- AI mode commands ("use analyst mode", "coach mode")
- Regular questions ("how's my performance?")

The parser learns from user corrections and stores patterns in Archon knowledge graph.
"""

import logging
from typing import Dict, List, Optional, Any, Literal, Tuple
from datetime import datetime
from enum import Enum
from dataclasses import dataclass
import re

from ..core.archon_client import ArchonClient

logger = logging.getLogger(__name__)


def extract_custom_date_range(text: str) -> Optional[Dict[str, str]]:
    """
    Extract custom date ranges from natural language.

    Examples:
    - "from January 1st to March 15th"
    - "between Jan 1 and Mar 15"
    - "show me December 1st through December 31st"
    - "from 12/1/2024 to 12/31/2024"
    """
    import re
    from datetime import datetime

    # Normalize text for easier parsing
    text = text.lower().strip()

    # Try different patterns for extracting date ranges

    # Pattern 1: "from X to Y"
    if text.startswith('from ') or ' from ' in text:
        if text.startswith('from '):
            parts = text[5:]  # Remove "from " from the beginning
        else:
            parts = text.split(' from ', 1)[1]  # Get everything after "from"

        for separator in [' to ', ' through ', ' until ']:
            if separator in parts:
                date1_str, date2_str = parts.split(separator, 1)
                date1_str = date1_str.strip()
                date2_str = date2_str.strip()

                # Try to parse the dates
                start_date = parse_flexible_date(date1_str)
                end_date = parse_flexible_date(date2_str)

                if start_date and end_date:
                    return {
                        "start_date": start_date,
                        "end_date": end_date,
                        "start_date_formatted": start_date,
                        "end_date_formatted": end_date
                    }

    # Pattern 2: "between X and Y"
    if text.startswith('between ') or ' between ' in text:
        if text.startswith('between '):
            parts = text[8:]  # Remove "between " from the beginning
        else:
            parts = text.split(' between ', 1)[1]  # Get everything after "between"

        if ' and ' in parts:
            date1_str, date2_str = parts.split(' and ', 1)
            date1_str = date1_str.strip()
            date2_str = date2_str.strip()

            # Try to parse the dates
            start_date = parse_flexible_date(date1_str)
            end_date = parse_flexible_date(date2_str)

            if start_date and end_date:
                return {
                    "start_date": start_date,
                    "end_date": end_date,
                    "start_date_formatted": start_date,
                    "end_date_formatted": end_date
                }

    return None


def parse_flexible_date(date_str: str) -> Optional[str]:
    """
    Parse various date formats and return ISO format.
    """
    import re
    from datetime import datetime, timedelta

    date_str = date_str.strip()

    # Handle relative dates
    now = datetime.now()

    if date_str in ['today', 'now']:
        return now.strftime('%Y-%m-%d')
    elif date_str == 'yesterday':
        return (now - timedelta(days=1)).strftime('%Y-%m-%d')
    elif date_str == 'tomorrow':
        return (now + timedelta(days=1)).strftime('%Y-%m-%d')

    # Handle month/day patterns (e.g., "January 1st", "Jan 1", "1/1")
    month_patterns = {
        'january': 1, 'jan': 1,
        'february': 2, 'feb': 2,
        'march': 3, 'mar': 3,
        'april': 4, 'apr': 4,
        'may': 5,
        'june': 6, 'jun': 6,
        'july': 7, 'jul': 7,
        'august': 8, 'aug': 8,
        'september': 9, 'sep': 9, 'sept': 9,
        'october': 10, 'oct': 10,
        'november': 11, 'nov': 11,
        'december': 12, 'dec': 12
    }

    # Pattern: "January 1st", "Jan 1", "January 1"
    month_day_pattern = r'([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?'
    match = re.match(month_day_pattern, date_str, re.IGNORECASE)
    if match:
        month_name = match.group(1).lower()
        day = int(match.group(2))

        if month_name in month_patterns:
            month = month_patterns[month_name]
            year = now.year

            # If the date is in the future, assume it's from last year
            try:
                date_obj = datetime(year, month, day)
                if date_obj > now:
                    year -= 1
                return datetime(year, month, day).strftime('%Y-%m-%d')
            except ValueError:
                pass

    # Pattern: "1/1", "1/1/2024", "12/31/2024"
    numeric_pattern = r'(\d{1,2})/(\d{1,2})(?:/(\d{2,4}))?'
    match = re.match(numeric_pattern, date_str)
    if match:
        month = int(match.group(1))
        day = int(match.group(2))
        year = int(match.group(3)) if match.group(3) else now.year

        # Handle 2-digit years
        if year < 100:
            year += 2000

        try:
            date_obj = datetime(year, month, day)
            # If the date is in the future, assume it's from last year
            if date_obj > now and not match.group(3):
                year -= 1
            return datetime(year, month, day).strftime('%Y-%m-%d')
        except ValueError:
            pass

    # Pattern: "2024-01-01", "2024/01/01"
    iso_pattern = r'(\d{4})[-/](\d{1,2})[-/](\d{1,2})'
    match = re.match(iso_pattern, date_str)
    if match:
        year = int(match.group(1))
        month = int(match.group(2))
        day = int(match.group(3))

        try:
            return datetime(year, month, day).strftime('%Y-%m-%d')
        except ValueError:
            pass

    return None


class CommandType(str, Enum):
    """Types of commands Renata can process"""
    UI_ACTION = "ui_action"           # Switch display modes, filters, etc.
    AI_MODE = "ai_mode"               # Change Renata personality
    QUESTION = "question"             # General trading questions
    CORRECTION = "correction"         # User correcting previous misunderstanding
    GREETING = "greeting"             # Hello, thanks, etc.


@dataclass
class ParsedCommand:
    """Result of parsing a user command"""
    command_type: CommandType
    intent: str
    confidence: float
    parameters: Dict[str, Any]
    ui_context: Optional[str] = None
    suggested_response: Optional[str] = None
    learning_pattern: Optional[Dict[str, Any]] = None


@dataclass
class UIContext:
    """Current UI state for context-aware parsing"""
    current_page: str = "unknown"           # stats, journal, dashboard, calendar, etc.
    display_mode: str = "unknown"           # dollar, r, percent, etc.
    pnl_mode: str = "unknown"               # gross, net
    filters_active: List[str] = None        # active filters
    time_range: str = "unknown"             # 7d, 30d, 90d, ytd, all, etc.
    user_location: str = "unknown"          # specific UI section
    calendar_view: str = "unknown"          # year, month (for calendar page)
    calendar_year: int = None               # current year on calendar
    calendar_month: int = None              # current month on calendar (0-11)


class CommandParser:
    """
    Intelligent command parser that learns from user interactions

    Key Features:
    - Context-aware parsing (knows what page user is on)
    - Learning from corrections
    - Pattern recognition
    - Confidence scoring
    """

    def __init__(self, archon_client: ArchonClient):
        self.archon = archon_client
        self.patterns = self._load_base_patterns()
        self.user_patterns: Dict[str, Dict] = {}

    def _load_base_patterns(self) -> Dict[str, List[Dict]]:
        """Load base command patterns"""
        return {
            CommandType.UI_ACTION: [
                {
                    "patterns": ["switch to r", "use r", "show r", "r mode", "r-multiple", "in r", "in r-multiple", "show in r", "change to r", "display in r"],
                    "intent": "switch_to_r_display",
                    "context_required": ["stats", "performance", "analytics"],
                    "parameters": {"display_mode": "r_multiple"},
                    "response": "I'll help you switch to R-multiple display mode."
                },
                {
                    "patterns": ["switch to dollar", "show dollar", "dollar mode", "$ mode", "switch to $", "in dollars", "show in dollars", "in $", "display in dollars", "change to dollars", "dollar", "show $", "$", "dollar display", "usd", "show usd", "in usd", "use dollars", "dollar view", "dollar format"],
                    "intent": "switch_to_dollar_display",
                    "context_required": ["any"],
                    "parameters": {"display_mode": "dollar"},
                    "response": "I'll switch to dollar display mode."
                },
                {
                    "patterns": ["switch to percent", "show percent", "percent mode", "% mode", "switch to %", "in percent", "show in percent", "in %", "display in percent", "change to percent", "percentage mode", "percent", "show %", "%", "percentage", "percent format", "percent view", "show percentage", "percentage display"],
                    "intent": "switch_to_percent_display",
                    "context_required": ["any"],
                    "parameters": {"display_mode": "percent"},
                    "response": "I'll switch to percentage display mode."
                },
                {
                    "patterns": ["switch to r", "show r", "r mode", "switch to r-multiple", "in r", "show in r", "display in r", "change to r", "r multiple", "r-multiple", "r multiple mode", "show r-multiple", "r-multiple display", "in r-multiple", "use r", "r view", "r format"],
                    "intent": "switch_to_r_display",
                    "context_required": ["any"],
                    "parameters": {"display_mode": "r"},
                    "response": "I'll switch to R-multiple display mode."
                },
                # Filter Management Commands
                {
                    "patterns": ["add filter for", "filter by", "set filter", "add a filter", "create filter", "apply filter"],
                    "intent": "add_filter",
                    "context_required": ["any"],
                    "parameters": {"filter_action": "add"},
                    "response": "I'll help you add a filter. What would you like to filter by?"
                },
                {
                    "patterns": ["remove filter", "delete filter", "clear filter", "remove all filters", "reset filters", "clear all filters"],
                    "intent": "remove_filter",
                    "context_required": ["any"],
                    "parameters": {"filter_action": "remove"},
                    "response": "I'll remove the specified filters."
                },
                {
                    "patterns": ["show only profitable trades", "filter profitable trades", "profitable trades only", "show winning trades only"],
                    "intent": "filter_profitable_trades",
                    "context_required": ["stats", "journal", "dashboard"],
                    "parameters": {"filter_type": "profitability", "filter_value": "profitable"},
                    "response": "I'll filter to show only profitable trades."
                },
                {
                    "patterns": ["show only losing trades", "filter losing trades", "losing trades only", "show losing trades only"],
                    "intent": "filter_losing_trades",
                    "context_required": ["stats", "journal", "dashboard"],
                    "parameters": {"filter_type": "profitability", "filter_value": "losing"},
                    "response": "I'll filter to show only losing trades."
                },
                {
                    "patterns": ["show only long trades", "filter long trades", "long positions only", "show long positions only"],
                    "intent": "filter_long_trades",
                    "context_required": ["stats", "journal", "dashboard"],
                    "parameters": {"filter_type": "direction", "filter_value": "long"},
                    "response": "I'll filter to show only long trades."
                },
                {
                    "patterns": ["show only short trades", "filter short trades", "short positions only", "show short positions only"],
                    "intent": "filter_short_trades",
                    "context_required": ["stats", "journal", "dashboard"],
                    "parameters": {"filter_type": "direction", "filter_value": "short"},
                    "response": "I'll filter to show only short trades."
                },
                {
                    "patterns": ["filter by symbol", "show only symbol", "filter symbol", "symbol filter"],
                    "intent": "filter_by_symbol",
                    "context_required": ["stats", "journal", "dashboard"],
                    "parameters": {"filter_type": "symbol"},
                    "response": "I'll filter trades by symbol. Which symbol would you like to focus on?"
                },
                {
                    "patterns": ["show recent trades", "filter recent trades", "recent trades only", "last few trades"],
                    "intent": "filter_recent_trades",
                    "context_required": ["stats", "journal", "dashboard"],
                    "parameters": {"filter_type": "timeframe", "filter_value": "recent"},
                    "response": "I'll filter to show only recent trades."
                },
                {
                    "patterns": ["show large trades", "filter large trades", "big trades only", "filter by size"],
                    "intent": "filter_large_trades",
                    "context_required": ["stats", "journal", "dashboard"],
                    "parameters": {"filter_type": "size", "filter_value": "large"},
                    "response": "I'll filter to show only large trades."
                },
                {
                    "patterns": ["show small trades", "filter small trades", "small trades only", "filter by size small"],
                    "intent": "filter_small_trades",
                    "context_required": ["stats", "journal", "dashboard"],
                    "parameters": {"filter_type": "size", "filter_value": "small"},
                    "response": "I'll filter to show only small trades."
                },
                {
                    "patterns": ["what filters are active", "show active filters", "current filters", "list filters"],
                    "intent": "show_active_filters",
                    "context_required": ["any"],
                    "parameters": {"filter_action": "show"},
                    "response": "I'll show you all currently active filters."
                },
                {
                    "patterns": ["clear all filters", "remove all filters", "reset all filters", "no filters"],
                    "intent": "clear_all_filters",
                    "context_required": ["any"],
                    "parameters": {"filter_action": "clear_all"},
                    "response": "I'll clear all active filters."
                },
                {
                    "patterns": ["go to dashboard", "dashboard", "open dashboard", "show dashboard", "navigate to dashboard"],
                    "intent": "navigate_to_dashboard",
                    "context_required": ["any"],
                    "parameters": {"navigation": "dashboard"},
                    "response": "I'll navigate you to the dashboard."
                },
                {
                    "patterns": ["go to journal", "journal", "open journal", "show journal", "navigate to journal", "trading journal"],
                    "intent": "navigate_to_journal",
                    "context_required": ["any"],
                    "parameters": {"navigation": "journal"},
                    "response": "I'll navigate you to the trading journal."
                },
                {
                    "patterns": ["go to stats", "stats", "statistics", "open stats", "show stats", "navigate to stats", "analytics", "let's go to stats", "let's go to the stats", "let's go to the stats page", "take me to stats", "take me to the stats page"],
                    "intent": "navigate_to_stats",
                    "context_required": ["any"],
                    "parameters": {"navigation": "stats"},
                    "response": "I'll navigate you to the statistics page."
                },
                {
                    "patterns": ["go to calendar", "calendar", "open calendar", "show calendar", "navigate to calendar", "trading calendar", "let's go to calendar", "take me to calendar", "go to the calendar", "show the calendar"],
                    "intent": "navigate_to_calendar",
                    "context_required": ["any"],
                    "parameters": {"navigation": "calendar"},
                    "response": "I'll navigate you to the trading calendar."
                },
                {
                    "patterns": ["switch to gross", "show gross", "gross pnl", "gross mode", "switch to gross pnl", "before commissions", "without fees", "gross display", "use gross", "in gross", "gross p&l", "show gross p&l"],
                    "intent": "switch_to_gross_pnl",
                    "context_required": ["any"],
                    "parameters": {"pnl_mode": "gross"},
                    "response": "I'll switch to Gross P&L mode (before commissions)."
                },
                {
                    "patterns": ["switch to net", "show net", "net pnl", "net mode", "switch to net pnl", "after commissions", "with fees", "net display", "use net", "in net", "net p&l", "show net p&l", "after fees", "including commissions"],
                    "intent": "switch_to_net_pnl",
                    "context_required": ["any"],
                    "parameters": {"pnl_mode": "net"},
                    "response": "I'll switch to Net P&L mode (after commissions)."
                },
                {
                    "patterns": ["year view", "show year view", "switch to year view", "yearly view", "show all months", "monthly overview", "view by year", "go to year view", "calendar year view", "show year calendar"],
                    "intent": "switch_calendar_year_view",
                    "context_required": ["calendar"],
                    "parameters": {"calendar_view": "year"},
                    "response": "I'll switch the calendar to year view to show all months."
                },
                {
                    "patterns": ["month view", "show month view", "switch to month view", "monthly view", "detailed month view", "view by month", "go to month view", "calendar month view", "show month calendar", "show month details"],
                    "intent": "switch_calendar_month_view",
                    "context_required": ["calendar"],
                    "parameters": {"calendar_view": "month"},
                    "response": "I'll switch the calendar to month view for detailed view."
                },
                {
                    "patterns": ["overview tab", "show overview", "go to overview", "switch to overview", "overview", "show overview tab", "open overview", "navigate to overview", "stats overview"],
                    "intent": "switch_to_stats_overview",
                    "context_required": ["stats", "statistics", "analytics"],
                    "parameters": {"stats_tab": "overview"},
                    "response": "I'll switch to the Overview tab on the statistics page."
                },
                {
                    "patterns": ["analytics tab", "show analytics", "go to analytics", "switch to analytics", "analytics", "show analytics tab", "open analytics", "navigate to analytics", "stats analytics", "detailed analytics"],
                    "intent": "switch_to_stats_analytics",
                    "context_required": ["stats", "statistics"],
                    "parameters": {"stats_tab": "analytics"},
                    "response": "I'll switch to the Analytics tab on the statistics page."
                },
                {
                    "patterns": ["performance tab", "show performance", "go to performance", "switch to performance", "performance", "show performance tab", "open performance", "navigate to performance", "stats performance", "detailed performance"],
                    "intent": "switch_to_stats_performance",
                    "context_required": ["stats", "statistics"],
                    "parameters": {"stats_tab": "performance"},
                    "response": "I'll switch to the Performance tab on the statistics page."
                },
                # ==================== JOURNAL PAGE ====================
                {
                    "patterns": ["new journal entry", "add journal entry", "create journal entry", "open journal entry", "new entry", "add entry", "journal entry", "write entry", "create entry", "start new journal", "add to journal", "log trade"],
                    "intent": "open_journal_new_entry",
                    "context_required": ["journal", "any"],
                    "parameters": {"modal": "new_entry"},
                    "response": "I'll open the new journal entry modal for you."
                },
                {
                    "patterns": ["show journal entries", "scroll to entries", "view entries", "journal entries", "go to entries", "show entries", "see entries"],
                    "intent": "scroll_journal_entries",
                    "context_required": ["journal"],
                    "parameters": {"scroll_target": "entries"},
                    "response": "I'll scroll to the journal entries section."
                },
                {
                    "patterns": ["grid view", "card view", "show grid", "switch to grid", "journal grid", "grid layout"],
                    "intent": "switch_journal_grid_view",
                    "context_required": ["journal"],
                    "parameters": {"view_mode": "grid"},
                    "response": "I'll switch the journal to grid view."
                },
                {
                    "patterns": ["list view", "switch to list", "journal list", "show list", "list layout"],
                    "intent": "switch_journal_list_view",
                    "context_required": ["journal"],
                    "parameters": {"view_mode": "list"},
                    "response": "I'll switch the journal to list view."
                },
                # ==================== TRADES PAGE ====================
                {
                    "patterns": ["new trade", "add trade", "create trade", "open trade", "add new trade", "log trade", "enter trade", "record trade", "manual trade"],
                    "intent": "open_new_trade_modal",
                    "context_required": ["trades", "any"],
                    "parameters": {"modal": "new_trade"},
                    "response": "I'll open the new trade modal for you."
                },
                {
                    "patterns": ["import trades", "upload trades", "import data", "upload data", "import csv", "bulk import", "import file"],
                    "intent": "open_import_modal",
                    "context_required": ["trades", "any"],
                    "parameters": {"modal": "import"},
                    "response": "I'll open the trade import modal for you."
                },
                {
                    "patterns": ["show trades table", "scroll to trades", "view trades table", "go to trades", "trades table"],
                    "intent": "scroll_trades_table",
                    "context_required": ["trades"],
                    "parameters": {"scroll_target": "table"},
                    "response": "I'll scroll to the trades table section."
                },
                {
                    "patterns": ["show trades summary", "trades summary", "view summary", "trade summary"],
                    "intent": "scroll_trades_summary",
                    "context_required": ["trades"],
                    "parameters": {"scroll_target": "summary"},
                    "response": "I'll scroll to the trades summary section."
                },
                # ==================== SETTINGS PAGE ====================
                {
                    "patterns": ["profile settings", "go to profile", "profile section", "my profile", "account settings", "account"],
                    "intent": "switch_to_profile_settings",
                    "context_required": ["settings"],
                    "parameters": {"section": "profile"},
                    "response": "I'll switch to the Profile settings section."
                },
                {
                    "patterns": ["trading settings", "go to trading", "trading section", "trade settings", "trading parameters"],
                    "intent": "switch_to_trading_settings",
                    "context_required": ["settings"],
                    "parameters": {"section": "trading"},
                    "response": "I'll switch to the Trading settings section."
                },
                {
                    "patterns": ["integrations settings", "go to integrations", "integrations section", "connected apps", "third party"],
                    "intent": "switch_to_integrations_settings",
                    "context_required": ["settings"],
                    "parameters": {"section": "integrations"},
                    "response": "I'll switch to the Integrations settings section."
                },
                {
                    "patterns": ["notifications settings", "go to notifications", "notifications section", "alerts settings", "alert settings"],
                    "intent": "switch_to_notifications_settings",
                    "context_required": ["settings"],
                    "parameters": {"section": "notifications"},
                    "response": "I'll switch to the Notifications settings section."
                },
                {
                    "patterns": ["appearance settings", "go to appearance", "appearance section", "theme settings", "display settings"],
                    "intent": "switch_to_appearance_settings",
                    "context_required": ["settings"],
                    "parameters": {"section": "appearance"},
                    "response": "I'll switch to the Appearance settings section."
                },
                {
                    "patterns": ["data settings", "go to data", "data section", "data management", "backup settings", "export settings"],
                    "intent": "switch_to_data_settings",
                    "context_required": ["settings"],
                    "parameters": {"section": "data"},
                    "response": "I'll switch to the Data & Exports settings section."
                },
                {
                    "patterns": ["security settings", "go to security", "security section", "privacy settings", "account security"],
                    "intent": "switch_to_security_settings",
                    "context_required": ["settings"],
                    "parameters": {"section": "security"},
                    "response": "I'll switch to the Security settings section."
                },
                {
                    "patterns": ["save settings", "apply settings", "save changes", "update settings"],
                    "intent": "save_settings",
                    "context_required": ["settings"],
                    "parameters": {"action": "save"},
                    "response": "I'll save your settings."
                },
                {
                    "patterns": ["export data", "export settings", "export trades", "download data", "backup data"],
                    "intent": "export_data",
                    "context_required": ["settings"],
                    "parameters": {"action": "export"},
                    "response": "I'll export your data."
                },
                {
                    "patterns": ["import data", "import settings", "import trades", "load data", "restore data", "upload data"],
                    "intent": "import_data",
                    "context_required": ["settings"],
                    "parameters": {"action": "import"},
                    "response": "I'll open the data import dialog."
                },
                # ==================== DAILY SUMMARY PAGE ====================
                {
                    "patterns": ["yesterday summary", "show yesterday", "yesterday trades", "go to yesterday", "previous day"],
                    "intent": "navigate_daily_summary_yesterday",
                    "context_required": ["daily-summary", "daily summary", "summary"],
                    "parameters": {"date_direction": "prev"},
                    "response": "I'll show yesterday's daily summary."
                },
                {
                    "patterns": ["tomorrow summary", "show tomorrow", "next day summary", "go to tomorrow", "next day"],
                    "intent": "navigate_daily_summary_tomorrow",
                    "context_required": ["daily-summary", "daily summary", "summary"],
                    "parameters": {"date_direction": "next"},
                    "response": "I'll show tomorrow's daily summary."
                },
                {
                    "patterns": ["today summary", "show today", "today trades", "go to today", "current day"],
                    "intent": "navigate_daily_summary_today",
                    "context_required": ["daily-summary", "daily summary", "summary"],
                    "parameters": {"date": "today"},
                    "response": "I'll show today's daily summary."
                },
                {
                    "patterns": ["show summary stats", "daily stats", "summary statistics", "scroll to stats"],
                    "intent": "scroll_daily_summary_stats",
                    "context_required": ["daily-summary", "daily summary", "summary"],
                    "parameters": {"scroll_target": "stats"},
                    "response": "I'll scroll to the daily summary stats section."
                },
                {
                    "patterns": ["show summary trades", "daily trades", "summary trades", "scroll to trades"],
                    "intent": "scroll_daily_summary_trades",
                    "context_required": ["daily-summary", "daily summary", "summary"],
                    "parameters": {"scroll_target": "trades"},
                    "response": "I'll scroll to the daily summary trades section."
                },
                {
                    "patterns": ["show january", "go to january", "january", "view january", "open january", "switch to january", "show jan", "go to jan", "jan"],
                    "intent": "navigate_to_january",
                    "context_required": ["calendar"],
                    "parameters": {"calendar_month": 0, "calendar_view": "month"},
                    "response": "I'll navigate to January on the calendar."
                },
                {
                    "patterns": ["show february", "go to february", "february", "view february", "open february", "switch to february", "show feb", "go to feb", "feb"],
                    "intent": "navigate_to_february",
                    "context_required": ["calendar"],
                    "parameters": {"calendar_month": 1, "calendar_view": "month"},
                    "response": "I'll navigate to February on the calendar."
                },
                {
                    "patterns": ["show march", "go to march", "march", "view march", "open march", "switch to march", "show mar", "go to mar", "mar"],
                    "intent": "navigate_to_march",
                    "context_required": ["calendar"],
                    "parameters": {"calendar_month": 2, "calendar_view": "month"},
                    "response": "I'll navigate to March on the calendar."
                },
                {
                    "patterns": ["show april", "go to april", "april", "view april", "open april", "switch to april", "show apr", "go to apr", "apr"],
                    "intent": "navigate_to_april",
                    "context_required": ["calendar"],
                    "parameters": {"calendar_month": 3, "calendar_view": "month"},
                    "response": "I'll navigate to April on the calendar."
                },
                {
                    "patterns": ["show may", "go to may", "may", "view may", "open may", "switch to may"],
                    "intent": "navigate_to_may",
                    "context_required": ["calendar"],
                    "parameters": {"calendar_month": 4, "calendar_view": "month"},
                    "response": "I'll navigate to May on the calendar."
                },
                {
                    "patterns": ["show june", "go to june", "june", "view june", "open june", "switch to june", "show jun", "go to jun", "jun"],
                    "intent": "navigate_to_june",
                    "context_required": ["calendar"],
                    "parameters": {"calendar_month": 5, "calendar_view": "month"},
                    "response": "I'll navigate to June on the calendar."
                },
                {
                    "patterns": ["show july", "go to july", "july", "view july", "open july", "switch to july", "show jul", "go to jul", "jul"],
                    "intent": "navigate_to_july",
                    "context_required": ["calendar"],
                    "parameters": {"calendar_month": 6, "calendar_view": "month"},
                    "response": "I'll navigate to July on the calendar."
                },
                {
                    "patterns": ["show august", "go to august", "august", "view august", "open august", "switch to august", "show aug", "go to aug", "aug"],
                    "intent": "navigate_to_august",
                    "context_required": ["calendar"],
                    "parameters": {"calendar_month": 7, "calendar_view": "month"},
                    "response": "I'll navigate to August on the calendar."
                },
                {
                    "patterns": ["show september", "go to september", "september", "view september", "open september", "switch to september", "show sep", "go to sep", "sept", "sep"],
                    "intent": "navigate_to_september",
                    "context_required": ["calendar"],
                    "parameters": {"calendar_month": 8, "calendar_view": "month"},
                    "response": "I'll navigate to September on the calendar."
                },
                {
                    "patterns": ["show october", "go to october", "october", "view october", "open october", "switch to october", "show oct", "go to oct", "oct"],
                    "intent": "navigate_to_october",
                    "context_required": ["calendar"],
                    "parameters": {"calendar_month": 9, "calendar_view": "month"},
                    "response": "I'll navigate to October on the calendar."
                },
                {
                    "patterns": ["show november", "go to november", "november", "view november", "open november", "switch to november", "show nov", "go to nov", "nov"],
                    "intent": "navigate_to_november",
                    "context_required": ["calendar"],
                    "parameters": {"calendar_month": 10, "calendar_view": "month"},
                    "response": "I'll navigate to November on the calendar."
                },
                {
                    "patterns": ["show december", "go to december", "december", "view december", "open december", "switch to december", "show dec", "go to dec", "dec"],
                    "intent": "navigate_to_december",
                    "context_required": ["calendar"],
                    "parameters": {"calendar_month": 11, "calendar_view": "month"},
                    "response": "I'll navigate to December on the calendar."
                },
                {
                    "patterns": ["next year", "go to next year", "calendar next year", "show next year", "forward one year", "advance year", "go forward", "forward", "click right", "right arrow", "next", "advance"],
                    "intent": "navigate_calendar_next_year",
                    "context_required": ["any"],
                    "parameters": {"calendar_year_action": "next"},
                    "response": "I'll advance the calendar to the next year."
                },
                {
                    "patterns": ["previous year", "go to previous year", "calendar previous year", "show previous year", "back one year", "last year", "go back a year", "go back", "back", "click left", "left arrow", "previous", "back one"],
                    "intent": "navigate_calendar_previous_year",
                    "context_required": ["any"],
                    "parameters": {"calendar_year_action": "previous"},
                    "response": "I'll go back to the previous year on the calendar."
                },
                {
                    "patterns": ["show 2026", "go to 2026", "calendar 2026", "year 2026", "switch to 2026", "view 2026", "open 2026", "change to 2026", "navigate to 2026"],
                    "intent": "navigate_calendar_to_2026",
                    "context_required": ["any"],
                    "parameters": {"calendar_year": 2026},
                    "response": "I'll navigate the calendar to 2026."
                },
                {
                    "patterns": ["show 2025", "go to 2025", "calendar 2025", "year 2025", "switch to 2025", "view 2025", "open 2025", "change to 2025", "navigate to 2025"],
                    "intent": "navigate_calendar_to_2025",
                    "context_required": ["any"],
                    "parameters": {"calendar_year": 2025},
                    "response": "I'll navigate the calendar to 2025."
                },
                {
                    "patterns": ["show 2024", "go to 2024", "calendar 2024", "year 2024", "switch to 2024", "view 2024", "open 2024", "change to 2024", "navigate to 2024"],
                    "intent": "navigate_calendar_to_2024",
                    "context_required": ["any"],
                    "parameters": {"calendar_year": 2024},
                    "response": "I'll navigate the calendar to 2024."
                },
                {
                    "patterns": ["show 2023", "go to 2023", "calendar 2023", "year 2023", "switch to 2023", "view 2023", "open 2023", "change to 2023", "navigate to 2023"],
                    "intent": "navigate_calendar_to_2023",
                    "context_required": ["any"],
                    "parameters": {"calendar_year": 2023},
                    "response": "I'll navigate the calendar to 2023."
                },
                {
                    "patterns": ["show 2022", "go to 2022", "calendar 2022", "year 2022", "switch to 2022", "view 2022", "open 2022", "change to 2022", "navigate to 2022"],
                    "intent": "navigate_calendar_to_2022",
                    "context_required": ["any"],
                    "parameters": {"calendar_year": 2022},
                    "response": "I'll navigate the calendar to 2022."
                },
                {
                    "patterns": ["show 2021", "go to 2021", "calendar 2021", "year 2021", "switch to 2021", "view 2021", "open 2021", "change to 2021", "navigate to 2021"],
                    "intent": "navigate_calendar_to_2021",
                    "context_required": ["any"],
                    "parameters": {"calendar_year": 2021},
                    "response": "I'll navigate the calendar to 2021."
                },
                {
                    "patterns": ["show 2027", "go to 2027", "calendar 2027", "year 2027", "switch to 2027", "view 2027", "open 2027", "change to 2027", "navigate to 2027"],
                    "intent": "navigate_calendar_to_2027",
                    "context_required": ["any"],
                    "parameters": {"calendar_year": 2027},
                    "response": "I'll navigate the calendar to 2027."
                },
                {
                    "patterns": ["filter by", "show only", "filter", "apply filter"],
                    "intent": "apply_filter",
                    "context_required": ["any"],
                    "parameters": {"action": "filter"},
                    "response": "I'll help you apply filters to your data."
                },
                {
                    "patterns": ["show me the last 6 months", "last 6 months", "past 6 months", "6 months", "last six months", "6m", "6 month", "six months", "past six months"],
                    "intent": "set_date_range_last_6_months",
                    "context_required": ["any"],
                    "parameters": {"date_range": "custom", "range_type": "last6months"},
                    "response": "I'll set the date range to the last 6 months."
                },
                {
                    "patterns": ["show me the last 3 months", "last 3 months", "past 3 months", "3 months", "last three months", "3m", "3 month", "three months", "past three months"],
                    "intent": "set_date_range_last_3_months",
                    "context_required": ["any"],
                    "parameters": {"date_range": "custom", "range_type": "last3months"},
                    "response": "I'll set the date range to the last 3 months."
                },
                {
                    "patterns": ["show me last month", "last month", "previous month", "past month", "1 month ago", "thirty days", "past thirty days"],
                    "intent": "set_date_range_last_month",
                    "context_required": ["any"],
                    "parameters": {"date_range": "custom", "range_type": "lastmonth"},
                    "response": "I'll set the date range to last month."
                },
                {
                    "patterns": ["show me year to date", "year to date", "ytd", "this year so far", "year-to-date", "this year", "current year", "since january 1", "since start of year"],
                    "intent": "set_date_range_ytd",
                    "context_required": ["any"],
                    "parameters": {"date_range": "custom", "range_type": "ytd"},
                    "response": "I'll set the date range to year to date."
                },
                {
                    "patterns": ["show me this week", "this week", "current week", "week to date"],
                    "intent": "set_date_range_this_week",
                    "context_required": ["any"],
                    "parameters": {"date_range": "week"},
                    "response": "I'll set the date range to this week."
                },
                {
                    "patterns": ["show me this month", "this month", "current month", "month to date"],
                    "intent": "set_date_range_this_month",
                    "context_required": ["any"],
                    "parameters": {"date_range": "month"},
                    "response": "I'll set the date range to this month."
                },
                {
                    "patterns": ["show me today", "today only", "just today"],
                    "intent": "set_date_range_today",
                    "context_required": ["any"],
                    "parameters": {"date_range": "today"},
                    "response": "I'll set the date range to today."
                },
                {
                    "patterns": ["yesterday", "show yesterday", "yesterday only", "just yesterday", "yesterday data", "data from yesterday", "1 day ago", "previous day"],
                    "intent": "set_date_range_yesterday",
                    "context_required": ["any"],
                    "parameters": {"date_range": "custom", "range_type": "yesterday"},
                    "response": "I'll set the date range to yesterday."
                },
                {
                    "patterns": ["last week", "show last week", "previous week"],
                    "intent": "set_date_range_last_week",
                    "context_required": ["any"],
                    "parameters": {"date_range": "week"},
                    "response": "I'll set the date range to last week."
                },
                {
                    "patterns": ["last 7 days", "past 7 days", "last seven days", "7 days", "7d", "seven days", "past seven days", "previous 7 days", "1 week"],
                    "intent": "set_date_range_last_7_days",
                    "context_required": ["any"],
                    "parameters": {"date_range": "7d"},
                    "response": "I'll set the date range to the last 7 days."
                },
                {
                    "patterns": ["last 30 days", "past 30 days", "last thirty days", "30 days", "30d", "thirty days", "past thirty days", "previous 30 days", "1 month"],
                    "intent": "set_date_range_last_30_days",
                    "context_required": ["any"],
                    "parameters": {"date_range": "30d"},
                    "response": "I'll set the date range to the last 30 days."
                },
                {
                    "patterns": ["this quarter", "current quarter", "show this quarter"],
                    "intent": "set_date_range_this_quarter",
                    "context_required": ["any"],
                    "parameters": {"date_range": "quarter"},
                    "response": "I'll set the date range to this quarter."
                },
                {
                    "patterns": ["last quarter", "previous quarter", "show last quarter"],
                    "intent": "set_date_range_last_quarter",
                    "context_required": ["any"],
                    "parameters": {"date_range": "custom", "range_type": "last_quarter"},
                    "response": "I'll set the date range to last quarter."
                },
                {
                    "patterns": ["all of 2025", "2025 only", "just 2025", "year 2025", "in 2025", "2025 data", "show 2025"],
                    "intent": "set_date_range_year_2025",
                    "context_required": ["any"],
                    "parameters": {"date_range": "custom", "range_type": "year_2025"},
                    "response": "I'll set the date range to 2025."
                },
                {
                    "patterns": ["all of 2024", "2024 only", "just 2024", "year 2024", "in 2024", "2024 data", "show 2024"],
                    "intent": "set_date_range_year_2024",
                    "context_required": ["any"],
                    "parameters": {"date_range": "custom", "range_type": "year_2024"},
                    "response": "I'll set the date range to 2024."
                },
                {
                    "patterns": ["show me everything", "all time", "all data", "complete history", "all history", "since beginning", "show all", "all trades", "entire history", "full history"],
                    "intent": "set_date_range_all_time",
                    "context_required": ["any"],
                    "parameters": {"date_range": "all"},
                    "response": "I'll set the date range to all time."
                }
            ],
            CommandType.AI_MODE: [
                {
                    "patterns": ["analyst mode", "use analyst", "switch to analyst", "be analyst"],
                    "intent": "change_to_analyst",
                    "context_required": ["any"],
                    "parameters": {"ai_mode": "analyst"},
                    "response": "Switching to analyst mode - direct, data-focused analysis."
                },
                {
                    "patterns": ["coach mode", "use coach", "switch to coach", "be coach"],
                    "intent": "change_to_coach",
                    "context_required": ["any"],
                    "parameters": {"ai_mode": "coach"},
                    "response": "Switching to coach mode - constructive guidance and accountability."
                },
                {
                    "patterns": ["mentor mode", "use mentor", "switch to mentor", "be mentor"],
                    "intent": "change_to_mentor",
                    "context_required": ["any"],
                    "parameters": {"ai_mode": "mentor"},
                    "response": "Switching to mentor mode - reflective insights and long-term perspective."
                },
                {
                    "patterns": ["renata mode", "ai mode", "assistant mode"],
                    "intent": "clarify_mode_request",
                    "context_required": ["any"],
                    "parameters": {"clarification_needed": True},
                    "response": "I have three modes: analyst (direct), coach (constructive), or mentor (reflective). Which would you prefer?"
                }
            ],
            CommandType.CORRECTION: [
                {
                    "patterns": ["no", "not that", "wrong", "i meant", "actually", "no i meant"],
                    "intent": "correction",
                    "context_required": ["any"],
                    "parameters": {"correction": True},
                    "response": "I understand you're correcting me. Could you clarify what you meant?"
                }
            ],
            CommandType.GREETING: [
                {
                    "patterns": ["hello", "hi", "hey", "sup", "yo", "wassup"],
                    "intent": "greeting",
                    "context_required": ["any"],
                    "parameters": {},
                    "response": "Hello! I'm Renata, your trading performance analyst. How can I help you today?"
                }
            ]
        }

    async def parse_command(
        self,
        user_input: str,
        ui_context: UIContext,
        conversation_history: Optional[List[Dict]] = None
    ) -> ParsedCommand:
        """
        Parse user command with context awareness and learning

        Args:
            user_input: Raw user input
            ui_context: Current UI state
            conversation_history: Recent conversation for context

        Returns:
            ParsedCommand with type, intent, confidence, and parameters
        """

        # Clean and normalize input
        normalized_input = user_input.lower().strip()

        # Check for custom date range patterns first (high priority)
        custom_date_range = extract_custom_date_range(user_input)  # Use original input for better parsing
        if custom_date_range:
            return ParsedCommand(
                command_type=CommandType.UI_ACTION,
                intent="set_custom_date_range",
                confidence=0.9,
                parameters={
                    "date_range": "custom",
                    "start_date": custom_date_range["start_date"],
                    "end_date": custom_date_range["end_date"],
                    "start_date_formatted": custom_date_range["start_date_formatted"],
                    "end_date_formatted": custom_date_range["end_date_formatted"]
                },
                ui_context=ui_context.current_page,
                suggested_response=f"I'll set the date range from {custom_date_range['start_date_formatted']} to {custom_date_range['end_date_formatted']}."
            )

        # Check for correction patterns first
        if conversation_history and len(conversation_history) > 0:
            correction_result = self._detect_correction(normalized_input, conversation_history)
            if correction_result:
                return correction_result

        # Try pattern matching for each command type
        best_match = None
        highest_confidence = 0.0

        for command_type, patterns in self.patterns.items():
            for pattern_group in patterns:
                confidence = self._calculate_confidence(
                    normalized_input,
                    pattern_group,
                    ui_context
                )

                if confidence > highest_confidence:
                    highest_confidence = confidence
                    best_match = (command_type, pattern_group, confidence)

        # Check user-learned patterns
        user_match = await self._check_user_patterns(normalized_input, ui_context)
        if user_match and user_match[2] > highest_confidence:
            best_match = user_match
            highest_confidence = user_match[2]

        # Build result
        if best_match and highest_confidence > 0.3:  # Confidence threshold
            command_type, pattern_group, confidence = best_match

            return ParsedCommand(
                command_type=command_type,
                intent=pattern_group["intent"],
                confidence=confidence,
                parameters=pattern_group.get("parameters", {}),
                ui_context=ui_context.current_page,
                suggested_response=pattern_group.get("response"),
                learning_pattern={
                    "input": user_input,
                    "normalized": normalized_input,
                    "context": ui_context.__dict__,
                    "timestamp": datetime.now().isoformat()
                }
            )

        # Default to question type
        return ParsedCommand(
            command_type=CommandType.QUESTION,
            intent="general_question",
            confidence=1.0,
            parameters={"query": user_input},
            ui_context=ui_context.current_page,
            suggested_response=None
        )

    def _calculate_confidence(
        self,
        user_input: str,
        pattern_group: Dict,
        ui_context: UIContext
    ) -> float:
        """Calculate confidence score for pattern match"""

        base_confidence = 0.0

        # Check pattern matching
        for pattern in pattern_group["patterns"]:
            if pattern in user_input:
                # Exact substring match
                base_confidence = max(base_confidence, 0.8)

                # Bonus for exact match
                if user_input.strip() == pattern:
                    base_confidence = 1.0
                    break

        # Fuzzy matching for partial matches
        if base_confidence == 0.0:
            for pattern in pattern_group["patterns"]:
                similarity = self._fuzzy_similarity(user_input, pattern)
                base_confidence = max(base_confidence, similarity * 0.6)

        # Context bonus/penalty
        context_required = pattern_group.get("context_required", ["any"])
        if context_required != ["any"]:
            if ui_context.current_page in context_required:
                base_confidence += 0.2  # Context match bonus
            else:
                base_confidence *= 0.5  # Wrong context penalty

        return min(base_confidence, 1.0)

    def _fuzzy_similarity(self, text1: str, text2: str) -> float:
        """Simple fuzzy string similarity"""
        words1 = set(text1.split())
        words2 = set(text2.split())

        if not words1 or not words2:
            return 0.0

        intersection = words1.intersection(words2)
        union = words1.union(words2)

        return len(intersection) / len(union)

    def _detect_correction(
        self,
        user_input: str,
        conversation_history: List[Dict]
    ) -> Optional[ParsedCommand]:
        """Detect if user is correcting a previous misunderstanding"""

        correction_indicators = ["no", "not", "wrong", "i meant", "actually"]

        if any(indicator in user_input for indicator in correction_indicators):
            last_interaction = conversation_history[-1] if conversation_history else None

            return ParsedCommand(
                command_type=CommandType.CORRECTION,
                intent="correction_detected",
                confidence=0.9,
                parameters={
                    "correction_text": user_input,
                    "previous_response": last_interaction.get("response") if last_interaction else None
                },
                suggested_response="I understand you're correcting me. Could you explain what you meant?"
            )

        return None

    async def _check_user_patterns(
        self,
        user_input: str,
        ui_context: UIContext
    ) -> Optional[Tuple[CommandType, Dict, float]]:
        """Check for user-learned patterns stored in Archon"""

        try:
            # Query Archon for user command patterns
            query = f"user command pattern: {user_input[:50]}"
            result = await self.archon.search_trading_knowledge(query, match_count=3)

            if result.success and result.data:
                for pattern_doc in result.data:
                    # Check if this is a learned command pattern
                    content = pattern_doc.get("content", {})
                    if isinstance(content, dict) and content.get("type") == "command_pattern":
                        pattern_data = content.get("pattern", {})
                        confidence = self._calculate_confidence(
                            user_input,
                            pattern_data,
                            ui_context
                        )

                        if confidence > 0.5:
                            return (
                                CommandType(pattern_data.get("command_type", "question")),
                                pattern_data,
                                confidence
                            )

        except Exception as e:
            logger.warning(f"Failed to check user patterns: {e}")

        return None

    async def learn_from_correction(
        self,
        original_command: str,
        correction: str,
        ui_context: UIContext,
        correct_intent: str,
        correct_command_type: CommandType
    ):
        """Learn new pattern from user correction"""

        # Create learning pattern
        learning_data = {
            "type": "command_pattern",
            "pattern": {
                "patterns": [original_command.lower().strip()],
                "intent": correct_intent,
                "command_type": correct_command_type.value,
                "context_required": [ui_context.current_page],
                "parameters": {"learned_from_correction": True},
                "response": f"I understand you want to {correct_intent}",
                "learned_from": {
                    "original": original_command,
                    "correction": correction,
                    "timestamp": datetime.now().isoformat(),
                    "context": ui_context.__dict__
                }
            }
        }

        try:
            # Store in Archon for future reference
            from ..core.archon_client import TradingInsight

            insight = TradingInsight(
                content=learning_data,
                tags=["command_learning", "user_correction", f"page_{ui_context.current_page}"],
                insight_type="command_pattern"
            )

            await self.archon.ingest_trading_insight(insight)
            logger.info(f"Learned new command pattern: {original_command} -> {correct_intent}")

        except Exception as e:
            logger.error(f"Failed to store learned pattern: {e}")

    async def get_learning_stats(self) -> Dict[str, Any]:
        """Get statistics about learned patterns"""

        try:
            result = await self.archon.search_trading_knowledge(
                "command_pattern type:command_pattern",
                match_count=50
            )

            if result.success:
                patterns = result.data
                return {
                    "total_learned_patterns": len(patterns),
                    "pattern_types": {},
                    "most_recent": patterns[0] if patterns else None
                }

        except Exception as e:
            logger.error(f"Failed to get learning stats: {e}")

        return {"error": "Could not retrieve learning statistics"}


# Singleton instance
_command_parser: Optional[CommandParser] = None

def get_command_parser(archon_client: ArchonClient) -> CommandParser:
    """Get or create command parser singleton"""
    global _command_parser
    if _command_parser is None:
        _command_parser = CommandParser(archon_client)
    return _command_parser