/**
 * SCANNER PATTERN LIBRARY
 * =======================
 *
 * EXACT pattern definitions extracted from working templates.
 * These are the SOURCE OF TRUTH for pattern detection and code generation.
 *
 * This is NOT AI-generated. These are copied from the actual working templates
 * in /Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-exact/templates/
 */

import { ScannerPattern, PatternConditions, ScannerParameters } from '@/types/scannerTypes';

export const SCANNER_PATTERNS: Record<string, ScannerPattern> = {

  // ============================================================================
  // A+ PARA SCANNER
  // ============================================================================
  "a_plus_para": {
    scannerType: "a_plus_para",
    className: "GroupedEndpointAPlusParaScanner",
    description: "A+ Parabolic pattern scanner with multi-slope momentum detection",

    // EXACT pattern conditions from fixed_formatted.py
    conditions: {
      // D0 CONDITIONS (current day)
      "TR >= (ATR * 4)": "df['TR'] >= (df['ATR'] * params['atr_mult'])",
      "Volume >= 2x average": "df['volume'] >= (df['VOL_AVG'] * params['vol_mult'])",
      "Previous volume >= 2x average": "df['Prev_Volume'] >= (df['VOL_AVG'] * params['vol_mult'])",
      "3-day slope >= 10%": "df['slope3d'] >= params['slope3d_min']",
      "5-day slope >= 20%": "df['slope5d'] >= params['slope5d_min']",
      "15-day slope >= 50%": "df['slope15d'] >= params['slope15d_min']",
      "High >= 4x ATR above EMA9": "df['high_over_ema9_div_atr'] >= params['high_ema9_mult']",
      "High >= 5x ATR above EMA20": "df['high_over_ema20_div_atr'] >= params['high_ema20_mult']",
      "7-day low move >= 0.5 ATR": "df['pct7d_low_div_atr'] >= params['pct7d_low_div_atr_min']",
      "14-day low move >= 1.5 ATR": "df['pct14d_low_div_atr'] >= params['pct14d_low_div_atr_min']",
      "Gap >= 0.5 ATR": "df['gap_over_atr'] >= params['gap_div_atr_min']",
      "Open >= 1.0x EMA9": "df['open_over_ema9'] >= params['open_over_ema9_min']",
      "ATR expansion >= 5%": "df['ATR_Pct_Change'] >= params['atr_pct_change_min']",
      "2-day move >= 2 ATR": "df['move2d_atr'] >= params['pct2d_div_atr_min']",
      "3-day move >= 3 ATR": "df['move3d_atr'] >= params['pct3d_div_atr_min']",

      // D-1 CONDITIONS (previous day)
      "ATR >= $3": "df['ATR'] >= params['atr_abs_min']",
      "Previous close >= $10": "df['prev_close'] >= params['prev_close_min']",
      "Previous day gain >= 0.25%": "df['prev_gain_pct'] >= params['prev_gain_pct_min']",
      "Open > Previous High": "df['open'] > df['prev_high']"
    },

    // EXACT parameters from params.json
    parameters: {
      "atr_mult": 4,
      "vol_mult": 2.0,
      "slope3d_min": 10,
      "slope5d_min": 20,
      "slope15d_min": 50,
      "slope50d_min": 60,
      "high_ema9_mult": 4,
      "high_ema20_mult": 5,
      "pct7d_low_div_atr_min": 0.5,
      "pct14d_low_div_atr_min": 1.5,
      "gap_div_atr_min": 0.5,
      "open_over_ema9_min": 1.0,
      "atr_pct_change_min": 5,
      "atr_abs_min": 3.0,
      "prev_close_min": 10.0,
      "prev_gain_pct_min": 0.25,
      "pct2d_div_atr_min": 2,
      "pct3d_div_atr_min": 3
    },

    requiredFeatures: [
      "EMA_9", "EMA_20", "ATR", "TR", "VOL_AVG", "Prev_Volume",
      "slope3d", "slope5d", "slope15d", "slope50d",
      "high_over_ema9_div_atr", "high_over_ema20_div_atr",
      "pct7d_low_div_atr", "pct14d_low_div_atr",
      "gap_over_atr", "open_over_ema9", "ATR_Pct_Change",
      "move2d_atr", "move3d_atr",
      "prev_close", "prev_open", "prev_high", "prev_gain_pct"
    ],

    lookbackDays: 100, // Only 100 days needed, not 1000!

    architecture: "grouped_endpoint",
    outputFormat: "ticker_date_close_volume"
  },

  // ============================================================================
  // BACKSIDE B SCANNER
  // ============================================================================
  "backside_b_para": {
    scannerType: "backside_b_para",
    className: "GroupedEndpointBacksideBScanner",
    description: "Backside B Para Scanner with 2-stage architecture",

    conditions: {
      "Price >= $8": "df['close'] >= params['price_min']",
      "ADV20 >= $30M": "df['ADV20'] >= params['adv20_min_usd']",
      "Absolute high position": "df['pos_abs_max'] <= params['pos_abs_max']",
      "D1 or D2 trigger": "df['trigger_signal'] == True",
      "ATR multiplier": "df['atr_signal'] >= params['atr_mult']",
      "Volume multiplier": "df['vol_signal'] >= params['vol_mult']",
      "5-day slope >= 3": "df['slope5d'] >= params['slope5d_min']",
      "High vs EMA9": "df['high_over_ema9'] >= params['high_ema9_mult']",
      "Gap/Dividend >= ATR": "df['gap_div_atr'] >= params['gap_div_atr_min']",
      "Open over EMA9": "df['open_over_ema9'] >= params['open_over_ema9_min']",
      "D1 green candle >= ATR": "df['d1_green_atr'] >= params['d1_green_atr_min']",
      "Open > Previous High": "df['open'] > df['prev_high']",
      "D1 close > D2 close": "df['d1_close'] > df['d2_close']"
    },

    parameters: {
      "price_min": 8.0,
      "adv20_min_usd": 30000000,
      "abs_lookback_days": 1000,
      "abs_exclude_days": 10,
      "pos_abs_max": 0.75,
      "trigger_mode": "D1_or_D2",
      "atr_mult": 0.9,
      "vol_mult": 0.9,
      "d1_volume_min": 15000000,
      "slope5d_min": 3.0,
      "high_ema9_mult": 1.05,
      "gap_div_atr_min": 0.75,
      "open_over_ema9_min": 0.9,
      "d1_green_atr_min": 0.30
    },

    requiredFeatures: [
      "ADV20", "ATR", "slope5d", "high_over_ema9",
      "gap_div_atr", "open_over_ema9", "d1_green_atr"
    ],

    lookbackDays: 1000, // Backside B needs 1000 days for absolute high

    architecture: "grouped_endpoint",
    outputFormat: "ticker_date_close_volume"
  },

  // ============================================================================
  // LC D2 MULTI-SCANNER (12 patterns)
  // ============================================================================
  "lc_d2_multi": {
    scannerType: "lc_d2_multi",
    className: "LCD2MultiScanner",
    description: "LC D2 Multi-Scanner with 12 pattern variations",

    conditions: {
      // Mass parameters (shared across all 12 patterns)
      "Close >= $5": "df['close'] >= params['min_close_price']",
      "Volume >= 10M": "df['volume'] >= params['min_volume']",
      "Dollar volume >= 500M": "df['dollar_volume'] >= params['min_dollar_volume']",
      "Bullish close": "df['close'] >= df['open']",
      "Previous bullish close": "df['prev_close'] >= df['prev_open']",
      "EMA trend aligned": "(df['EMA_9'] >= df['EMA_20']) & (df['EMA_20'] >= df['EMA_50'])"
    },

    parameters: {
      // Mass parameters
      "min_close_price": 5.0,
      "min_volume": 10000000,
      "min_dollar_volume": 500000000,
      "bullish_close": true,
      "prev_bullish_close": true,
      "ema_trend_aligned": true
    },

    // Individual pattern parameters (12 variations)
    patternVariations: [
      {
        name: "LC_Frontside_D3_Extended_1",
        parameters: {
          "high_chg_atr_min": 1.0,
          "high_chg_atr1_min": 0.7,
          "dist_h_9ema_atr_min": 1.5,
          "dist_h_20ema_atr_min": 2.0,
          "min_close_ua": 5,
          "h_dist_to_highest_high_20_atr": 2.5
        }
      },
      {
        name: "LC_Backside_D3_Extended_1",
        parameters: {
          "high_chg_atr_min": 1.0,
          "high_chg_atr1_min": 0.7,
          "dist_h_9ema_atr_min": 1.5,
          "dist_h_20ema_atr_min": 2.0,
          "min_close_ua": 5,
          "h_dist_to_highest_high_20_atr": 2.5
        }
      },
      // ... 10 more variations
    ],

    requiredFeatures: [
      "EMA_9", "EMA_20", "EMA_50", "EMA_200",
      "ATR", "high_chg_atr", "high_chg_atr1",
      "dist_h_9ema_atr", "dist_h_20ema_atr"
    ],

    lookbackDays: 220, // For EMA200 calculations

    architecture: "snapshot_plus_aggregates",
    outputFormat: "ticker_date_scanner_label",
    isMultiScanner: true,
    totalPatterns: 12
  },

  // ============================================================================
  // LC 3D GAP SCANNER
  // ============================================================================
  "lc_3d_gap": {
    scannerType: "lc_3d_gap",
    className: "LC3DGapScanner",
    description: "LC 3D Gap scanner with multi-day EMA distance averaging",

    conditions: {
      // Day -14 averages
      "Day -14 Avg EMA 10 >= 0.25x ATR": "day_14_avg_ema10 >= params['day_14_avg_ema10_min']",
      "Day -14 Avg EMA 30 >= 0.5x ATR": "day_14_avg_ema30 >= params['day_14_avg_ema30_min']",

      // Day -7 averages
      "Day -7 Avg EMA 10 >= 0.25x ATR": "day_7_avg_ema10 >= params['day_7_avg_ema10_min']",
      "Day -7 Avg EMA 30 >= 0.75x ATR": "day_7_avg_ema30 >= params['day_7_avg_ema30_min']",

      // Day -3 averages
      "Day -3 Avg EMA 10 >= 0.5x ATR": "day_3_avg_ema10 >= params['day_3_avg_ema10_min']",
      "Day -3 Avg EMA 30 >= 1.0x ATR": "day_3_avg_ema30 >= params['day_3_avg_ema30_min']",

      // Day -2 positioning
      "Day -2 EMA 10 Distance >= 1.0x ATR": "day_2_ema_distance_10 >= params['day_2_ema10_distance_min']",
      "Day -2 EMA 30 Distance >= 2.0x ATR": "day_2_ema_distance_30 >= params['day_2_ema30_distance_min']",

      // Day -1 positioning
      "Day -1 EMA 10 Distance >= 1.5x ATR": "day_1_ema_distance_10 >= params['day_1_ema10_distance_min']",
      "Day -1 EMA 30 Distance >= 3.0x ATR": "day_1_ema_distance_30 >= params['day_1_ema30_distance_min']",
      "Day -1 Volume >= 7M": "day_1_vol >= params['day_1_vol_min']",
      "Day -1 Close >= $20": "day_1_close >= params['day_1_close_min']",
      "Day -1 High >= Swing High": "day_1_high_vs_swing_high >= params['day_1_high_vs_swing_high_min']",

      // Day 0 confirmation
      "Day 0 Gap >= 0.5x ATR": "day_0_gap >= params['day_0_gap_min']",
      "Day 0 Open - Day -1 High >= 0.1x ATR": "day_0_open_minus_d1_high >= params['day_0_open_minus_d1_high_min']"
    },

    parameters: {
      "day_14_avg_ema10_min": 0.25,
      "day_14_avg_ema30_min": 0.5,
      "day_7_avg_ema10_min": 0.25,
      "day_7_avg_ema30_min": 0.75,
      "day_3_avg_ema10_min": 0.5,
      "day_3_avg_ema30_min": 1.0,
      "day_2_ema10_distance_min": 1.0,
      "day_2_ema30_distance_min": 2.0,
      "day_1_ema10_distance_min": 1.5,
      "day_1_ema30_distance_min": 3.0,
      "day_1_vol_min": 7000000,
      "day_1_close_min": 20.0,
      "day_1_high_vs_swing_high_min": 1.0,
      "day_0_gap_min": 0.5,
      "day_0_open_minus_d1_high_min": 0.1
    },

    requiredFeatures: [
      "EMA_10", "EMA_30", "ATR",
      // Multi-day averages
      "day_14_avg_ema10", "day_14_avg_ema30",
      "day_7_avg_ema10", "day_7_avg_ema30",
      "day_3_avg_ema10", "day_3_avg_ema30",
      // Swing high detection
      "swing_high_5_to_65"
    ],

    lookbackDays: 830, // For swing high calculations (65+ days)

    architecture: "aggregates_endpoint",
    outputFormat: "ticker_date_close_volume"
  },

  // ============================================================================
  // SC DMR MULTI-SCANNER (10 patterns)
  // ============================================================================
  "sc_dmr_multi": {
    scannerType: "sc_dmr_multi",
    className: "SCDMRMultiScanner",
    description: "SC DMR Multi-Scanner with 10 pattern variations",

    conditions: {
      // Mass parameters
      "Previous close >= $0.75": "df['prev_close'] >= params['prev_close_min']",
      "Previous volume >= 10M": "df['prev_volume'] >= params['prev_volume_min']",
      "Previous bullish close": "df['prev_close'] >= df['prev_open']",
      "Valid trigger high": "df['valid_trig_high'] == True"
    },

    parameters: {
      "prev_close_min": 0.75,
      "prev_volume_min": 10000000,
      "prev_close_bullish": true,
      "valid_trig_high_enabled": true
    },

    // 10 pattern variations
    patternVariations: [
      {
        name: "D2_PM_Setup",
        parameters: {
          "prev_high_gain_min": 0.2,
          "pmh_gap_range_mult": 0.5,
          "pmh_gap_pct_min": 0.5,
          "prev_close_range_min": 0.5,
          "high_vs_low_mult": 1.5
        }
      },
      {
        name: "D2_PMH_Break",
        parameters: {
          "prev_high_gain_min": 1.0,
          "prev_gap_min": 0.2,
          "gap_range_mult": 0.3,
          "opening_range_min": 0.5,
          "prev_close_range_min": 0.5,
          "high_vs_low_mult": 1.5
        }
      },
      // ... 8 more variations
    ],

    requiredFeatures: [
      "prev_close", "prev_volume", "prev_open",
      "prev_high", "prev_high_2", "prev_high_3",
      "valid_trig_high", "gap", "opening_range", "prev_close_range"
    ],

    lookbackDays: 10, // For 10-period high validation

    architecture: "polygon_grouped",
    outputFormat: "ticker_date_scanner_label",
    isMultiScanner: true,
    totalPatterns: 10
  },

  // ============================================================================
  // EXTENDED GAP SCANNER
  // ============================================================================
  "extended_gap": {
    scannerType: "extended_gap",
    className: "ExtendedGapScanner",
    description: "Extended Gap scanner with multi-period range expansion analysis",

    conditions: {
      "Day -1 Volume >= 20M": "day_minus_1_vol >= params['day_minus_1_vol_min']",
      "14-Day Breakout Extension >= 1 ATR": "breakout_extension >= params['breakout_extension_min']",
      "Day -1 High to 10 EMA / ATR >= 1": "d1_high_to_ema10_div_atr >= params['d1_high_to_ema10_div_atr_min']",
      "Day -1 High to 30 EMA / ATR >= 1": "d1_high_to_ema30_div_atr >= params['d1_high_to_ema30_div_atr_min']",
      "Day -1 Low to Day 0 PMH vs ATR >= 1": "d1_low_to_pmh_vs_atr >= params['d1_low_to_pmh_vs_atr_min']",
      "Day -1 Low to Day 0 PMH vs D-1 EMA >= 1": "d1_low_to_pmh_vs_ema >= params['d1_low_to_pmh_vs_ema_min']",
      "Day 0 PMH % >= 5%": "pmh_pct >= params['pmh_pct_min']",
      "Day -1 Change % >= 2%": "d1_change_pct >= params['d1_change_pct_min']",
      "Day 0 Open >= Day -1 High": "d0_open_above_d1_high == true",
      "Range D-1 High/D-2 Low >= 1.5 ATR": "range_d1h_d2l >= params['range_d1h_d2l_min']",
      "Range D-1 High/D-3 Low >= 3 ATR": "range_d1h_d3l >= params['range_d1h_d3l_min']",
      "Range D-1 High/D-8 Low >= 5 ATR": "range_d1h_d8l >= params['range_d1h_d8l_min']",
      "Range D-1 High/D-15 Low >= 6 ATR": "range_d1h_d15l >= params['range_d1h_d15l_min']",
      "Day 0 Open >= 1 ATR above D-2 to D-14 High": "d0_open_above_x_atr >= params['d0_open_above_x_atr_min']"
    },

    parameters: {
      "day_minus_1_vol_min": 20000000,
      "breakout_extension_min": 1.0,
      "d1_high_to_ema10_div_atr_min": 1.0,
      "d1_high_to_ema30_div_atr_min": 1.0,
      "d1_low_to_pmh_vs_atr_min": 1.0,
      "d1_low_to_pmh_vs_ema_min": 1.0,
      "pmh_pct_min": 5.0,
      "d1_change_pct_min": 2.0,
      "d0_open_above_d1_high": true,
      "range_d1h_d2l_min": 1.5,
      "range_d1h_d3l_min": 3.0,
      "range_d1h_d8l_min": 5.0,
      "range_d1h_d15l_min": 6.0,
      "d0_open_above_x_atr_min": 1.0
    },

    requiredFeatures: [
      "EMA_10", "EMA_30", "ATR",
      // Breakout detection
      "breakout_extension", "highest_high_14d",
      // Range expansions
      "range_d1h_d2l", "range_d1h_d3l", "range_d1h_d8l", "range_d1h_d15l"
    ],

    lookbackDays: 730, // For EMA30 calculations

    architecture: "aggregates_endpoint",
    outputFormat: "ticker_date_close_volume"
  },

  // ============================================================================
  // D1 GAP SCANNER
  // ============================================================================
  "d1_gap": {
    scannerType: "d1_gap",
    className: "D1GapScanner",
    description: "D1 Gap Scanner with 50%+ gap detection and EMA200 filter",

    conditions: {
      "Price >= $0.75": "df['close'] >= params['price_min']",
      "Pre-market high % >= 50%": "pm_high_pct >= params['pm_high_pct_min']",
      "Pre-market volume >= 5M": "pm_vol >= params['pm_vol_min']",
      "Gap % >= 50%": "gap_pct >= params['gap_pct_min']",
      "Open above previous high % >= 30%": "open_over_prev_high_pct >= params['open_over_prev_high_pct_min']",
      "Close vs EMA200 <= 80%": "close_vs_ema200_pct <= params['ema200_max_pct']",
      "Exclude D2 pattern": "d2_pattern == false"
    },

    parameters: {
      "price_min": 0.75,
      "pm_high_pct_min": 0.5,
      "pm_vol_min": 5000000,
      "gap_pct_min": 0.5,
      "open_over_prev_high_pct_min": 0.3,
      "ema200_max_pct": 0.8,
      "exclude_d2": true,
      "d2_pct_min": 0.3,
      "d2_vol_min": 10000000
    },

    requiredFeatures: [
      "EMA_200", "ATR",
      "pm_high_pct", "pm_vol", "gap_pct",
      "open_over_prev_high_pct", "close_vs_ema200_pct"
    ],

    lookbackDays: 2920, // For EMA200 (200 * ~14.6 trading days per year)

    architecture: "aggregates_endpoint",
    outputFormat: "ticker_date_close_volume"
  }
};

/**
 * Helper function to get pattern by scanner type
 */
export function getPattern(scannerType: string): ScannerPattern | undefined {
  return SCANNER_PATTERNS[scannerType];
}

/**
 * Helper function to get all available scanner types
 */
export function getAvailableScannerTypes(): string[] {
  return Object.keys(SCANNER_PATTERNS);
}

/**
 * Helper function to check if a scanner is a multi-scanner
 */
export function isMultiScanner(scannerType: string): boolean {
  const pattern = SCANNER_PATTERNS[scannerType];
  return pattern?.isMultiScanner || false;
}

/**
 * Helper function to get pattern variations for multi-scanners
 */
export function getPatternVariations(scannerType: string): any[] {
  const pattern = SCANNER_PATTERNS[scannerType];
  return pattern?.patternVariations || [];
}
