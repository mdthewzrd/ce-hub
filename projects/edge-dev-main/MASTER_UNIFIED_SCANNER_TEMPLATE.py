# 🎯 MASTER UNIFIED SCANNER TEMPLATE
# AI-Agent Integrated Design | Universal Scanner Engine Compatible
# Based on Half A+ & Backside B patterns + LC D2 market coverage

import pandas as pd
import numpy as np
import requests
from datetime import datetime
from typing import List, Dict, Any, Optional
import warnings

warnings.filterwarnings("ignore")

# ═══════════════════════════════════════════════════════════════════════════════
# 📋 SCANNER METADATA SECTION
# ═══════════════════════════════════════════════════════════════════════════════

SCANNER_INFO = {
    'name': 'Master Unified Scanner Template',
    'description': 'AI-conversational template combining Half A+ momentum + Backside B triggers',
    'author': 'AI-Agent System',
    'version': '1.0.0',
    'base_patterns': ['half_a_plus', 'backside_para_b'],
    'market_coverage': 'full',  # 'curated', 'full', 'custom'
    'ai_agent_compatible': True,
    'human_in_loop_enabled': True
}

# ═══════════════════════════════════════════════════════════════════════════════
# ⚙️ UNIFIED PARAMETER CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

# 🎛️ AI-Agent Conversational Parameters
# These can be modified through natural language conversation
SCAN_PARAMS = {
    # ────── Market & Liquidity Filters ──────
    'market_filters': {
        'price_min': 8.0,                    # From Backside B: reliable liquidity floor
        'price_max': 1000.0,                 # Prevents outliers
        'volume_min_usd': 30_000_000,        # From Backside B: institutional-grade liquidity
        'market_cap_min': None,              # Optional additional filter
    },

    # ────── Technical Momentum Triggers ──────
    'momentum_triggers': {
        'atr_multiple': 1.0,                 # From Half A+: volatility expansion
        'volume_multiple': 1.5,              # From both: volume confirmation
        'gap_threshold_atr': 0.75,           # From Backside B: gap-up requirement
        'ema_distance_9': 1.5,               # From Half A+: trend alignment
        'ema_distance_20': 2.0,              # From Half A+: stronger trend confirmation
    },

    # ────── Trend & Pattern Analysis ──────
    'trend_analysis': {
        'ema_periods': [9, 20, 50],          # From Half A+: multi-timeframe trend
        'slope_requirements': {              # From Half A+: momentum confirmation
            '3d': 10,                        # 3-day slope minimum %
            '5d': 20,                        # 5-day slope minimum %
            '15d': 40,                       # 15-day slope minimum %
        },
        'multi_day_progression': True,       # From Backside B: D-1 > D-2 requirement
    },

    # ────── Entry & Risk Management ──────
    'entry_criteria': {
        'open_above_prev_high': True,        # From Backside B: breakout confirmation
        'body_color_requirement': True,      # Green candles only
        'close_range_min': 0.7,             # Strong close requirement
        'max_results_per_day': 50,          # Risk management
    },

    # ────── Signal Quality Scoring ──────
    'signal_scoring': {
        'use_parabolic_scoring': False,      # From LC D2: advanced scoring option
        'signal_strength_min': 0.6,         # Quality threshold
        'target_multiplier': 1.08,          # Default 8% target (from Half A+)
        'risk_reward_min': 2.0,             # Minimum R:R ratio
    },

    # ────── AI-Agent Learning Parameters ──────
    'ai_learning': {
        'backtest_validation': True,         # Auto-validate parameter changes
        'explanation_mode': True,            # Explain all changes to user
        'confidence_threshold': 0.8,        # How confident AI needs to be to suggest changes
        'user_approval_required': True,     # Human-in-the-loop checkpoint
    }
}

# ═══════════════════════════════════════════════════════════════════════════════
# 🌍 DYNAMIC SYMBOL MANAGEMENT (From LC D2 + Enhanced)
# ═══════════════════════════════════════════════════════════════════════════════

SYMBOL_LISTS = {
    # Curated lists (from original scanners)
    'curated_momentum': [
        'MSTR', 'SMCI', 'DJT', 'NVDA', 'AMD', 'TSLA', 'META', 'BABA', 'TCOM',
        'AMC', 'SOXL', 'MRVL', 'DOCU', 'ZM', 'SNAP', 'RBLX', 'SE', 'PLTR',
        'SNOW', 'RIVN', 'LCID', 'COIN', 'RIOT', 'MARA', 'ARKK', 'SBET', 'TIGR'
    ],
    'large_cap_core': [
        'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NFLX', 'CRM', 'ORCL', 'ADBE',
        'BA', 'QCOM', 'KO', 'PEP', 'ABBV', 'JNJ', 'BAC', 'JPM', 'WMT'
    ],
    'etf_leverage': [
        'SPY', 'QQQ', 'IWM', 'TQQQ', 'SQQQ', 'SPXL', 'SPXS', 'UVXY', 'MSTU'
    ],

    # Dynamic market-wide scanning (AI-Agent can modify)
    'full_market': 'AUTO_FETCH',  # Will be populated by market data API
    'active_symbols': None,       # Currently selected symbol list
}

# ═══════════════════════════════════════════════════════════════════════════════
# 🔧 GLOBAL CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════════

session = requests.Session()
API_KEY = 'Fm7brz4s23eSocDErnL68cE7wspz2K1I'  # Will be env variable in production
BASE_URL = 'https://api.polygon.io'

# ═══════════════════════════════════════════════════════════════════════════════
# 📊 UNIFIED DATA FETCHING & PROCESSING FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def fetch_market_data(symbol: str, start_date: str, end_date: str) -> pd.DataFrame:
    """
    Universal market data fetcher combining best practices from all scanners
    """
    try:
        url = f"{BASE_URL}/v2/aggs/ticker/{symbol}/range/1/day/{start_date}/{end_date}"
        params = {
            'apiKey': API_KEY,
            'adjusted': 'true',
            'sort': 'asc',
            'limit': 50000
        }

        response = session.get(url, params=params)
        response.raise_for_status()

        data = response.json().get('results', [])
        if not data:
            return pd.DataFrame()

        df = pd.DataFrame(data)
        df['Date'] = pd.to_datetime(df['t'], unit='ms')
        df.rename(columns={
            'o': 'Open', 'h': 'High', 'l': 'Low',
            'c': 'Close', 'v': 'Volume'
        }, inplace=True)
        df.set_index('Date', inplace=True)

        return df[['Open', 'High', 'Low', 'Close', 'Volume']].sort_index()

    except Exception as e:
        print(f"Error fetching data for {symbol}: {e}")
        return pd.DataFrame()

def calculate_technical_indicators(df: pd.DataFrame, params: dict = None) -> pd.DataFrame:
    """
    Unified technical indicator calculation combining Half A+ and Backside B methods
    """
    if df.empty:
        return df

    params = params or SCAN_PARAMS
    m = df.copy()

    # ────── Basic Price Action ──────
    m['Prev_Close'] = m['Close'].shift(1)
    m['Prev_Open'] = m['Open'].shift(1)
    m['Prev_High'] = m['High'].shift(1)
    m['Prev_Volume'] = m['Volume'].shift(1)

    # ────── ATR Calculation (From Half A+) ──────
    hi_lo = m['High'] - m['Low']
    hi_prev = (m['High'] - m['Close'].shift(1)).abs()
    lo_prev = (m['Low'] - m['Close'].shift(1)).abs()
    m['TR'] = pd.concat([hi_lo, hi_prev, lo_prev], axis=1).max(axis=1)
    m['ATR_raw'] = m['TR'].rolling(window=14, min_periods=14).mean()
    m['ATR'] = m['ATR_raw'].shift(1)

    # ────── Volume Analysis (From both patterns) ──────
    m['VOL_AVG'] = m['Volume'].rolling(window=14, min_periods=14).mean().shift(1)
    m['ADV20_USD'] = (m['Close'] * m['Volume']).rolling(window=20, min_periods=20).mean().shift(1)

    # ────── EMA Calculations (From Half A+) ──────
    for span in params['trend_analysis']['ema_periods']:
        m[f'EMA_{span}'] = m['Close'].ewm(span=span, adjust=False).mean()

    # ────── Slope Calculations (From Half A+) ──────
    for period, _ in params['trend_analysis']['slope_requirements'].items():
        days = int(period.replace('d', ''))
        m[f'Slope_9_{period}'] = (
            (m['EMA_9'] - m['EMA_9'].shift(days)) / m['EMA_9'].shift(days)
        ) * 100

    # ────── Gap Analysis (From Backside B) ──────
    m['Gap_abs'] = (m['Open'] - m['Prev_Close']).abs()
    m['Gap_over_ATR'] = m['Gap_abs'] / m['ATR']

    # ────── Distance from EMAs (From Half A+) ──────
    m['High_over_EMA9_div_ATR'] = (m['High'] - m['EMA_9']) / m['ATR']
    m['High_over_EMA20_div_ATR'] = (m['High'] - m['EMA_20']) / m['ATR']

    # ────── Body Analysis (From Backside B) ──────
    m['Body_over_ATR'] = (m['Close'] - m['Open']) / m['ATR']
    m['Close_Range'] = (m['Close'] - m['Low']) / (m['High'] - m['Low'])

    # ────── Ratios and Multipliers ──────
    m['Open_over_EMA9'] = m['Open'] / m['EMA_9']
    m['Volume_over_AVG'] = m['Volume'] / m['VOL_AVG']
    m['Range_over_ATR'] = m['TR'] / m['ATR']

    return m.fillna(0)

def apply_unified_scan_logic(df: pd.DataFrame, params: dict = None) -> pd.DataFrame:
    """
    Unified scan logic combining Half A+ momentum with Backside B triggers
    """
    if df.empty:
        return df

    params = params or SCAN_PARAMS
    m = calculate_technical_indicators(df, params)

    # Extract parameter groups for readability
    market_f = params['market_filters']
    momentum_t = params['momentum_triggers']
    trend_a = params['trend_analysis']
    entry_c = params['entry_criteria']

    # ────── Market Liquidity Gates (From Backside B) ──────
    liquidity_filter = (
        (m['Prev_Close'] >= market_f['price_min']) &
        (m['ADV20_USD'] >= market_f['volume_min_usd'])
    )

    # ────── Momentum Triggers (From Half A+) ──────
    momentum_filter = (
        (m['Range_over_ATR'] >= momentum_t['atr_multiple']) &
        (m['Volume_over_AVG'] >= momentum_t['volume_multiple']) &
        (m['Gap_over_ATR'] >= momentum_t['gap_threshold_atr'])
    )

    # ────── Trend Alignment (From Half A+) ──────
    trend_filter = (
        (m['Slope_9_3d'] >= trend_a['slope_requirements']['3d']) &
        (m['Slope_9_5d'] >= trend_a['slope_requirements']['5d']) &
        (m['Slope_9_15d'] >= trend_a['slope_requirements']['15d']) &
        (m['High_over_EMA9_div_ATR'] >= momentum_t['ema_distance_9']) &
        (m['High_over_EMA20_div_ATR'] >= momentum_t['ema_distance_20'])
    )

    # ────── Entry Quality (From Backside B) ──────
    entry_filter = (
        (m['Body_over_ATR'] >= 0.3) &  # Green candle requirement
        (m['Close_Range'] >= 0.7) &    # Strong close
        (m['Open_over_EMA9'] >= 0.9)   # Respect trend
    )

    # ────── Breakout Confirmation (From Backside B) ──────
    if entry_c['open_above_prev_high']:
        breakout_filter = (m['Open'] > m['Prev_High'])
    else:
        breakout_filter = True

    # ────── Combined Filter Logic ──────
    combined_filter = (
        liquidity_filter &
        momentum_filter &
        trend_filter &
        entry_filter &
        breakout_filter
    )

    return m.loc[combined_filter]

def format_standardized_results(df: pd.DataFrame, symbol: str, params: dict = None) -> List[Dict[str, Any]]:
    """
    Universal result formatter maintaining compatibility with existing platform
    """
    if df.empty:
        return []

    params = params or SCAN_PARAMS
    results = []

    for date, row in df.iterrows():
        # Calculate signal strength score
        atr_strength = min(row.get('Range_over_ATR', 0) / 3.0, 1.0)  # Normalize to 0-1
        volume_strength = min(row.get('Volume_over_AVG', 0) / 5.0, 1.0)  # Normalize to 0-1
        trend_strength = min(row.get('Slope_9_5d', 0) / 50.0, 1.0)  # Normalize to 0-1
        signal_strength = (atr_strength + volume_strength + trend_strength) / 3.0

        # Determine signal quality
        if signal_strength >= 0.8:
            quality = 'Strong'
        elif signal_strength >= 0.6:
            quality = 'Moderate'
        else:
            quality = 'Weak'

        # ✅ STANDARDIZED RESULT FORMAT (Universal Scanner Engine Compatible)
        result = {
            'symbol': symbol,
            'ticker': symbol,  # Required for Universal Scanner Engine
            'date': date.strftime('%Y-%m-%d'),
            'scanner_type': 'unified_master',

            # ────── Core Metrics (Standardized) ──────
            'gap_percent': round(float(row.get('Gap_over_ATR', 0)), 2),
            'volume_ratio': round(float(row.get('Volume_over_AVG', 0)), 2),
            'signal_strength': quality,
            'signal_score': round(signal_strength, 3),
            'entry_price': round(float(row.get('Open', 0)), 2),
            'target_price': round(float(row.get('Open', 0) * params['signal_scoring']['target_multiplier']), 2),

            # ────── Detailed Technical Metrics ──────
            'atr_multiple': round(float(row.get('Range_over_ATR', 0)), 2),
            'volume_multiple': round(float(row.get('Volume_over_AVG', 0)), 2),
            'slope_3d': round(float(row.get('Slope_9_3d', 0)), 2),
            'slope_5d': round(float(row.get('Slope_9_5d', 0)), 2),
            'slope_15d': round(float(row.get('Slope_9_15d', 0)), 2),
            'ema9_distance_atr': round(float(row.get('High_over_EMA9_div_ATR', 0)), 2),
            'ema20_distance_atr': round(float(row.get('High_over_EMA20_div_ATR', 0)), 2),
            'gap_atr': round(float(row.get('Gap_over_ATR', 0)), 2),
            'body_atr': round(float(row.get('Body_over_ATR', 0)), 2),
            'close_range': round(float(row.get('Close_Range', 0)), 2),
            'open_ema9_ratio': round(float(row.get('Open_over_EMA9', 0)), 2),

            # ────── Market Context ──────
            'prev_close': round(float(row.get('Prev_Close', 0)), 2),
            'adv20_usd': int(row.get('ADV20_USD', 0)),
            'breakout_confirmed': bool(row.get('Open', 0) > row.get('Prev_High', 0)),

            # ────── AI-Agent Metadata ──────
            'template_version': SCANNER_INFO['version'],
            'base_patterns': SCANNER_INFO['base_patterns'],
            'parameter_source': 'unified_template',
            'ai_confidence': round(signal_strength, 3)
        }

        results.append(result)

    return results

# ═══════════════════════════════════════════════════════════════════════════════
# 🎯 UNIVERSAL SCANNER ENGINE COMPATIBLE FUNCTION (Required)
# ═══════════════════════════════════════════════════════════════════════════════

def scan_symbol(symbol: str, start_date: str, end_date: str) -> List[Dict[str, Any]]:
    """
    🎯 REQUIRED FUNCTION: Universal Scanner Engine Compatible

    Main entry point for scanning individual symbols
    Combines Half A+ momentum analysis with Backside B trigger precision
    """
    try:
        # Fetch market data
        df = fetch_market_data(symbol, start_date, end_date)
        if df.empty:
            return []

        # Apply unified scan logic
        hits_df = apply_unified_scan_logic(df, SCAN_PARAMS)
        if hits_df.empty:
            return []

        # Format and return standardized results
        return format_standardized_results(hits_df, symbol, SCAN_PARAMS)

    except Exception as e:
        print(f"Error scanning {symbol}: {str(e)}")
        return []

# ═══════════════════════════════════════════════════════════════════════════════
# 🤖 AI-AGENT INTEGRATION FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def get_active_symbols(list_name: str = 'curated_momentum') -> List[str]:
    """Get currently active symbol list based on user preference or AI recommendation"""
    if list_name == 'full_market':
        # In production, this would fetch from market data API
        return SYMBOL_LISTS['curated_momentum'] + SYMBOL_LISTS['large_cap_core']
    return SYMBOL_LISTS.get(list_name, SYMBOL_LISTS['curated_momentum'])

def update_parameters_via_conversation(user_request: str, current_params: dict) -> Dict[str, Any]:
    """
    AI-Agent function to translate natural language requests into parameter changes

    Examples:
    - "Make it more aggressive" → increase atr_multiple, decrease volume_min_usd
    - "Focus on small caps" → adjust price filters
    - "Only strong signals" → increase signal_strength_min
    """
    # This would contain the actual AI logic for parameter translation
    # For now, returning structure for illustration
    return {
        'parameter_changes': {},
        'explanation': f"User request: '{user_request}' - Parameter translation pending",
        'confidence': 0.0,
        'requires_approval': True,
        'backtest_impact': "Analysis pending"
    }

def explain_parameter_impact(old_params: dict, new_params: dict) -> str:
    """Generate human-readable explanation of parameter changes and their likely impact"""
    changes = []
    # Logic to compare parameters and generate explanations
    return "Parameter change explanations would be generated here"

def validate_parameters_with_backtest(params: dict, symbols: List[str]) -> Dict[str, Any]:
    """Quick backtest validation of parameter changes"""
    return {
        'backtest_period': '30_days',
        'total_signals': 0,
        'win_rate': 0.0,
        'avg_return': 0.0,
        'max_drawdown': 0.0,
        'recommendation': 'pending_analysis'
    }

# ═══════════════════════════════════════════════════════════════════════════════
# 📊 SCANNER CONFIGURATION METADATA
# ═══════════════════════════════════════════════════════════════════════════════

SCANNER_CONFIG = {
    'name': SCANNER_INFO['name'],
    'description': SCANNER_INFO['description'],
    'version': SCANNER_INFO['version'],
    'timeframe': 'Daily',
    'market_coverage': SCANNER_INFO['market_coverage'],
    'base_patterns': SCANNER_INFO['base_patterns'],
    'standardized': True,
    'universal_compatible': True,
    'ai_agent_compatible': SCANNER_INFO['ai_agent_compatible'],
    'human_in_loop': SCANNER_INFO['human_in_loop_enabled'],

    # Parameter modification capabilities for AI-Agent
    'conversational_parameters': [
        'market_filters', 'momentum_triggers', 'trend_analysis',
        'entry_criteria', 'signal_scoring'
    ],
    'parameter_ranges': {
        'atr_multiple': {'min': 0.5, 'max': 5.0, 'default': 1.0},
        'volume_multiple': {'min': 1.0, 'max': 10.0, 'default': 1.5},
        'gap_threshold_atr': {'min': 0.1, 'max': 2.0, 'default': 0.75},
        'signal_strength_min': {'min': 0.3, 'max': 0.95, 'default': 0.6}
    }
}

# ═══════════════════════════════════════════════════════════════════════════════
# 🧪 TEST ENTRY POINT & VALIDATION
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("🎯 Master Unified Scanner Template - AI-Agent Ready")
    print(f"   Version: {SCANNER_INFO['version']}")
    print(f"   Base Patterns: {', '.join(SCANNER_INFO['base_patterns'])}")
    print(f"   Market Coverage: {SCANNER_INFO['market_coverage']}")
    print(f"   AI-Agent Compatible: {SCANNER_INFO['ai_agent_compatible']}")
    print(f"   Human-in-Loop: {SCANNER_INFO['human_in_loop_enabled']}")

    # Test with curated symbols
    test_symbols = ['AAPL', 'MSTR', 'SMCI']
    start_date = "2024-01-01"
    end_date = datetime.now().strftime("%Y-%m-%d")

    print(f"\n🧪 Testing with symbols: {test_symbols}")
    print(f"   Date range: {start_date} to {end_date}")
    print(f"   Parameters: {len(SCAN_PARAMS)} parameter groups configured")

    total_results = 0
    for symbol in test_symbols:
        results = scan_symbol(symbol, start_date, end_date)
        total_results += len(results)
        print(f"   {symbol}: {len(results)} signals found")

        if results:
            latest = results[-1]
            print(f"     Latest signal: {latest['date']} | Quality: {latest['signal_strength']} | Entry: ${latest['entry_price']}")

    print(f"\n✅ Template validation complete: {total_results} total signals found")
    print("🤖 Ready for AI-Agent integration and conversational parameter tuning")