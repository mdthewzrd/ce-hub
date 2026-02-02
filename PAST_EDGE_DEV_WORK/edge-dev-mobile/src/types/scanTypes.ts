/**
 * TypeScript interfaces for LC Scanner features
 * Supports chart day navigation and saved scans functionality
 */

// Backend standardized result format (matches Universal Scanner Engine)
export interface ScanResult {
  symbol: string;
  ticker: string;
  date: string;
  scanner_type: string;

  // Core standardized metrics
  gap_percent: number;
  volume_ratio: number | null;
  signal_strength: 'Strong' | 'Moderate';
  entry_price: number;
  target_price: number;

  // Legacy fields for backward compatibility
  gapPercent?: number;
  volume?: number;
  score?: number;
}

// Extended scan result with additional pattern metadata
export interface EnhancedScanResult extends ScanResult {
  id?: string;
  close?: number;
  gap_pct?: number; // Legacy
  v_ua?: number; // Legacy
  confidence_score?: number;
  parabolic_score?: number;

  // LC pattern specific fields
  high_chg_atr?: number;
  dist_h_9ema_atr?: number;
  dist_h_20ema_atr?: number;
  ema_stack?: boolean;
  prev_close?: number;

  // Additional detailed metrics from sophisticated scanners
  trigger?: string;
  pos_abs_1000d?: number;
  d1_body_atr?: number;
  d1_volume_shares?: number;
  d1_vol_avg_ratio?: number;
  vol_sig_max?: number;
  gap_atr?: number;
  open_prev_high?: boolean;
  open_ema9_ratio?: number;
  d1_above_d2_high?: boolean;
  d1_close_above_d2?: boolean;
  slope_9_5d?: number;
  high_ema9_atr_trigger?: number;
  adv20_usd?: number;
}

// Chart day navigation state
export interface ChartDayState {
  currentDay: Date;
  referenceDay: Date; // Original Day 0 LC pattern date
  dayOffset: number; // Days from reference (0 = Day 0, 1 = Day 1, etc.)
  isLoading: boolean;
  hasData: boolean;
  maxAvailableDays: number;
}

// Market data for multi-day progression
export interface MultiDayMarketData {
  [dayOffset: number]: {
    date: string;
    chartData: import('../components/EdgeChart').ChartData;
    marketSession: import('../utils/marketCalendar').TradingSession;
    isComplete: boolean;
  };
}

// Saved scan configuration
export interface SavedScan {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  lastRun?: string;

  // Scan parameters (preserved from original scan)
  scanParams: {
    start_date: string;
    end_date: string;
    filters: {
      lc_frontside_d2_extended?: boolean;
      lc_frontside_d3_extended_1?: boolean;
      min_gap?: number;
      min_pm_vol?: number;
      min_prev_close?: number;
      [key: string]: any;
    };
  };

  // Cached results (optional - can be reloaded)
  results?: EnhancedScanResult[];
  resultCount: number;

  // Metadata
  tags?: string[];
  isFavorite?: boolean;
  estimatedResults?: string;
  scanType?: string;
  tickerUniverse?: string;
}

// Scan execution status
export interface ScanExecutionState {
  isExecuting: boolean;
  scanId?: string;
  progress?: number;
  message?: string;
  error?: string;
}

// LocalStorage structure for saved scans
export interface SavedScansStorage {
  version: string;
  scans: SavedScan[];
  settings: {
    maxSavedScans: number;
    autoCleanupDays: number;
  };
}

// Chart navigation actions
export type ChartNavigationAction =
  | { type: 'NEXT_DAY' }
  | { type: 'PREVIOUS_DAY' }
  | { type: 'GO_TO_DAY'; dayOffset: number }
  | { type: 'RESET_TO_REFERENCE' }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_DATA'; dayOffset: number; data: any }
  | { type: 'SET_MAX_DAYS'; maxDays: number };

// Saved scan actions
export type SavedScanAction =
  | { type: 'SAVE_SCAN'; scan: Omit<SavedScan, 'id' | 'createdAt'> }
  | { type: 'LOAD_SCAN'; scanId: string }
  | { type: 'DELETE_SCAN'; scanId: string }
  | { type: 'UPDATE_SCAN'; scanId: string; updates: Partial<SavedScan> }
  | { type: 'TOGGLE_FAVORITE'; scanId: string }
  | { type: 'RENAME_SCAN'; scanId: string; newName: string };

// API response types
export interface ScanApiResponse {
  success: boolean;
  scan_id?: string;
  message?: string;
  results?: any[];
  progress_percent?: number;
  status?: 'pending' | 'running' | 'completed' | 'error';
}

// Chart data fetching types
export interface ChartDataRequest {
  ticker: string;
  date: string; // Specific date for Day N
  timeframe: import('../config/globalChartConfig').Timeframe;
  extendedHours?: boolean;
}

export interface ChartDataResponse {
  success: boolean;
  chartData?: import('../components/EdgeChart').ChartData;
  marketSession?: import('../utils/marketCalendar').TradingSession;
  error?: string;
}

// Component prop types
export interface ChartDayNavigationProps {
  currentState: ChartDayState;
  onNavigate: (action: ChartNavigationAction) => void;
  ticker: string;
  disabled?: boolean;
}

export interface SavedScansSidebarProps {
  savedScans: SavedScan[];
  onLoadScan: (scan: SavedScan) => void;
  onDeleteScan: (scanId: string) => void;
  onRenameScan: (scanId: string, newName: string) => void;
  onToggleFavorite: (scanId: string) => void;
  isVisible: boolean;
  selectedScanId?: string;
}

export interface SaveScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (scanData: Omit<SavedScan, 'id' | 'createdAt'>) => void;
  currentScanParams: SavedScan['scanParams'];
  currentResults: EnhancedScanResult[];
}