/**
 * SCANNER TYPE DEFINITIONS
 * =========================
 *
 * Type definitions for the pattern library system
 */

export interface ScannerPattern {
  scannerType: string;
  className: string;
  description: string;

  // Pattern conditions (exact code from templates)
  conditions: PatternConditions;

  // EXACT parameters from params.json
  parameters: ScannerParameters;

  // Required features for this pattern
  requiredFeatures: string[];

  // Lookback period in days
  lookbackDays: number;

  // Architecture type
  architecture: 'grouped_endpoint' | 'snapshot_plus_aggregates' | 'polygon_grouped' | 'aggregates_endpoint';

  // Output format
  outputFormat: string;

  // Multi-scanner properties
  isMultiScanner?: boolean;
  totalPatterns?: number;
  patternVariations?: PatternVariation[];
}

export interface PatternConditions {
  [conditionName: string]: string; // Description → Code
}

export interface ScannerParameters {
  [paramName: string]: number | boolean | string;
}

export interface PatternVariation {
  name: string;
  parameters: ScannerParameters;
}

/**
 * Formatting result
 */
export interface FormattingResult {
  success: boolean;
  formattedCode?: string;
  scannerType?: string;
  parameters?: ScannerParameters;
  errors?: string[];
  warnings?: string[];
}

/**
 * Pattern detection result
 */
export interface PatternDetectionResult {
  scannerType?: string;
  confidence: number;
  matchedConditions: string[];
  missingConditions: string[];
  suggestedParameters?: ScannerParameters;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  originalSignals?: number;
  formattedSignals?: number;
  signalMatch?: boolean;
  errors?: string[];
}
