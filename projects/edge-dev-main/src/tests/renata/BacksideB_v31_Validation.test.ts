/**
 * Backside B v31 Validation Tests
 *
 * These tests ensure Renata generates Backside B scanners that match v31 specifications.
 * All tests validate critical fixes that prevent bugs like missing DJT 2025-01-14.
 */

import { describe, it, expect } from '@jest/globals';

// Mock Renata service for testing
// In production, this would import the actual Renata service
interface RenataService {
  generateScanner(patternType: string, userDescription?: string): Promise<string>;
}

describe('Renata Backside B v31 Validation', () => {
  let renata: RenataService;

  beforeAll(() => {
    // Initialize Renata service
    // renata = new RenataAIAgentService();
  });

  describe('Performance Optimization Tests', () => {
    it('must use groupby for pre-slicing (O(n) not O(n×m))', async () => {
      const generatedCode = await renata.generateScanner('backside_b');

      // Should use groupby pattern
      expect(generatedCode).toMatch(/for\s+ticker,\s+ticker_df\s+in\s+df\.groupby\('ticker'\)/);

      // Should NOT use the slow filtering pattern
      expect(generatedCode).not.toMatch(/for\s+ticker\s+in\s+df\['ticker'\]\.unique\(\)/);

      // Should NOT scan entire dataframe for each ticker
      expect(generatedCode).not.toMatch(/df\[df\['ticker'\]\s*==\s*ticker\]\.copy\(\)/);
    });

    it('must include performance comment explaining groupby fix', async () => {
      const generatedCode = await renata.generateScanner('backside_b');

      // Should have explanatory comment
      expect(generatedCode).toMatch(/PERFORMANCE FIX|Pre-slice|groupby.*O\(n\)/i);
    });
  });

  describe('Critical prev_high Bug Fix (v30)', () => {
    it('must check r1["prev_high"] not r1["high"]', async () => {
      const generatedCode = await renata.generateScanner('backside_b');

      // Should use prev_high (D-2's high via D-1's prev_high column)
      expect(generatedCode).toMatch(/r0\['open'\]\s*>\s*r1\['prev_high'\]/);

      // Should NOT use r1['high'] (which is D-1's high, not D-2's)
      expect(generatedCode).not.toMatch(/require_open_gt_prev_high.*r1\['high'\]/);
    });

    it('must include require_open_gt_prev_high parameter check', async () => {
      const generatedCode = await renata.generateScanner('backside_b');

      // Should check the parameter
      expect(generatedCode).toMatch(/if\s+self\.params\['require_open_gt_prev_high'\]/);
    });

    it('must output open_gt_prev_high in results', async () => {
      const generatedCode = await renata.generateScanner('backside_b');

      // Should include this field in results output
      expect(generatedCode).toMatch(/'open_gt_prev_high'\s*:\s*bool\(r0\['open'\]\s*>\s*r1\['prev_high'\]\)/);
    });
  });

  describe('adv20_usd Calculation Tests', () => {
    it('must compute adv20_usd WITHOUT shift(1) in Stage 2a', async () => {
      const generatedCode = await renata.generateScanner('backside_b');

      // Match the correct pattern: groupby transform with rolling mean, NO shift
      expect(generatedCode).toMatch(
        /adv20_usd.*\.\s*transform\s*\(\s*lambda\s+x:\s*x\.rolling\s*\(\s*window\s*=\s*20\s*\)\s*\.mean\s*\(\s*\)\s*(?!\.shift\(1\))/
      );
    });

    it('must use groupby(df["ticker"]).transform() for per-ticker calculation', async () => {
      const generatedCode = await renata.generateScanner('backside_b');

      // Should use groupby().transform() pattern
      expect(generatedCode).toMatch(/groupby\s*\(\s*df\[['"]ticker['"]\]\s*\)\.transform/);
    });
  });

  describe('Smart Filter Strategy Tests', () => {
    it('must separate historical from D0 range', async () => {
      const generatedCode = await renata.generateScanner('backside_b');

      // Should have df_historical that excludes output range
      expect(generatedCode).toMatch(/df_historical\s*=\s*df\[~df\[['"]date['"]\]\.between\(/);

      // Should have df_output_range that includes only output range
      expect(generatedCode).toMatch(/df_output_range\s*=\s*df\[df\[['"]date['"]\]\.between\(/);
    });

    it('must apply filters ONLY to D0 range (not historical)', async () => {
      const generatedCode = await renata.generateScanner('backside_b');

      // Should filter df_output_range, not the entire df
      expect(generatedCode).toMatch(/df_output_filtered\s*=\s*df_output_range\s*\[/);
    });

    it('must combine historical + filtered D0 after filtering', async () => {
      const generatedCode = await renata.generateScanner('backside_b');

      // Should concat historical and filtered output
      expect(generatedCode).toMatch(/pd\.concat\s*\(\s*\[\s*df_historical\s*,\s*df_output_filtered\s*\]\s*/);
    });
  });

  describe('Dropna After Features Tests', () => {
    it('must call dropna() AFTER computing features', async () => {
      const generatedCode = await renata.generateScanner('backside_b');

      // Should have dropna call
      expect(generatedCode).toMatch(/df\s*=\s*df\.dropna\s*\(\s*subset\s*=\s*\[?\s*['"]prev_close['"],\s*['"]adv20_usd['"],\s*['"]price_range['"]\s*\]?/);

      // Should appear after feature computations (prev_close, adv20_usd, price_range)
      const prevCloseIndex = generatedCode.indexOf("prev_close'");
      const dropnaIndex = generatedCode.indexOf('dropna');
      expect(dropnaIndex).toBeGreaterThan(prevCloseIndex);
    });
  });

  describe('Parameter Value Tests', () => {
    it('must use pos_abs_max=0.75 (not 0.50)', async () => {
      const generatedCode = await renata.generateScanner('backside_b');

      expect(generatedCode).toMatch(/['"]pos_abs_max['"]\s*:\s*0\.75/);
    });

    it('must use gap_div_atr_min=0.75 (not 0.50)', async () => {
      const generatedCode = await renata.generateScanner('backside_b');

      expect(generatedCode).toMatch(/['"]gap_div_atr_min['"]\s*:\s*0\.75/);
    });

    it('must use open_over_ema9_min=0.9 (not 0.97)', async () => {
      const generatedCode = await renata.generateScanner('backside_b');

      expect(generatedCode).toMatch(/['"]open_over_ema9_min['"]\s*:\s*0\.9/);
    });

    it('must have require_open_gt_prev_high=True', async () => {
      const generatedCode = await renata.generateScanner('backside_b');

      expect(generatedCode).toMatch(/['"]require_open_gt_prev_high['"]\s*:\s*True/);
    });
  });

  describe('Syntax Error Prevention Tests', () => {
    it('must have no syntax errors (no letter O for number 0)', async () => {
      const generatedCode = await renata.generateScanner('backside_b');

      // Check for common v12 typos
      expect(generatedCode).not.toMatch(/window\s*=\s*\d*O/);  // No letter O
      expect(generatedCode).not.toMatch(/min_periods\s*=\s*\d*O/);
      expect(generatedCode).not.toMatch(/\b\d*O\b/);  // Any number followed by O
    });

    it('must use proper number 0 in numeric literals', async () => {
      const generatedCode = await renata.generateScanner('backside_b');

      // Should have number 0, not letter O
      expect(generatedCode).toMatch(/\b0\b/);  // The digit 0 should exist
    });
  });

  describe('Code Completeness Tests', () => {
    it('must be complete (not truncated mid-file)', async () => {
      const generatedCode = await renata.generateScanner('backside_b');

      // Should have closing brace and CLI entry point
      expect(generatedCode).toMatch(/if\s+__name__\s*==\s*['"]__main__['"]/);
    });

    it('must have all required methods', async () => {
      const generatedCode = await renata.generateScanner('backside_b');

      // Should have these critical methods
      expect(generatedCode).toMatch(/def\s+__init__/);
      expect(generatedCode).toMatch(/def\s+get_trading_dates/);
      expect(generatedCode).toMatch(/def\s+fetch_all_grouped_data/);
      expect(generatedCode).toMatch(/def\s+apply_smart_filters/);
      expect(generatedCode).toMatch(/def\s+compute_full_features/);
      expect(generatedCode).toMatch(/def\s+detect_patterns/);
    });

    it('must have D1 volume floor check', async () => {
      const generatedCode = await renata.generateScanner('backside_b');

      expect(generatedCode).toMatch(/d1_volume\s*>=\s*self\.params\[['"]d1_volume_min['"]\]/);
    });

    it('must have D1 > D2 comparisons', async () => {
      const generatedCode = await renata.generateScanner('backside_b');

      // Should check D1 high > D2 high
      expect(generatedCode).toMatch(/r1\[['"]high['"]\]\s*>\s*r2\[['"]high['"]\]/);

      // Should check D1 close > D2 close
      expect(generatedCode).toMatch(/r1\[['"]close['"]\]\s*>\s*r2\[['"]close['"]\]/);
    });

    it('must require minimum 100 days data (not 50)', async () => {
      const generatedCode = await renata.generateScanner('backside_b');

      expect(generatedCode).toMatch(/len\(ticker_df\)\s*<\s*100/);
    });
  });

  describe('Mold Check Tests', () => {
    it('must check all 4 mold criteria (not just doji/red candles)', async () => {
      const generatedCode = await renata.generateScanner('backside_b');

      // TR/ATR check
      expect(generatedCode).toMatch(/['"]TR['"]\s*\/\s*self\.params\[['"]atr_mult['"]\]|atr_ratio/);

      // Volume spike check
      expect(generatedCode).toMatch(/volume.*\/.*avg.*vol|vol_ratio/);

      // Slope check
      expect(generatedCode).toMatch(/slope|EMA_Slope5d/);

      // High/EMA9/ATR check
      expect(generatedCode).toMatch(/high.*\/.*ema9|high_ema9_mult/);
    });

    it('must use parameter values for mold thresholds', async () => {
      const generatedCode = await renata.generateScanner('backside_b');

      expect(generatedCode).toMatch(/['"]atr_mult['"]\s*:\s*0\.9/);
      expect(generatedCode).toMatch(/['"]vol_mult['"]\s*:\s*0\.9/);
      expect(generatedCode).toMatch(/['"]slope5d_min['"]\s*:\s*3\.0/);
      expect(generatedCode).toMatch(/['"]high_ema9_mult['"]\s*:\s*1\.05/);
    });
  });

  describe('DJT 2025-01-14 Test Case', () => {
    it('would detect DJT 2025-01-14 with correct prev_high logic', async () => {
      const generatedCode = await renata.generateScanner('backside_b');

      // Critical check: D0 open ($39.34) > D-2 high ($35.83) via r1['prev_high']
      expect(generatedCode).toMatch(/r0\['open'\]\s*>\s*r1\['prev_high'\]/);
    });
  });
});

/**
 * Integration Tests
 * These tests verify the complete workflow from user input to generated code
 */
describe('Renata Integration Tests', () => {
  describe('Complete Workflow Validation', () => {
    it('should generate complete, working Backside B scanner from simple request', async () => {
      const userRequest = "Create a Backside B scanner for 2025";
      const generatedCode = await renata.generateScanner('backside_b', userRequest);

      // Validate all critical aspects in one test
      expect(generatedCode).toMatch(/for\s+ticker,\s+ticker_df\s+in\s+df\.groupby\('ticker'\)/);  // Performance
      expect(generatedCode).toMatch(/r0\['open'\]\s*>\s*r1\['prev_high'\]/);  // prev_high fix
      expect(generatedCode).toMatch(/__name__\s*==\s*['"]__main__['"]/);  // Complete file
    });

    it('should pass all v31 validation checks', async () => {
      const generatedCode = await renata.generateScanner('backside_b');

      // Run through all validation checks
      const validationChecks = [
        /for\s+ticker,\s+ticker_df\s+in\s+df\.groupby\('ticker'\)/,
        /r0\['open'\]\s*>\s*r1\['prev_high'\]/,
        /adv20_usd.*rolling.*mean(?!\.shift\(1\))/,
        /df_historical.*~df\['date'\]\.between/,
        /df_output_range.*df\['date'\]\.between/,
        /dropna\s*\(\s*subset/,
        /['"]pos_abs_max['"]\s*:\s*0\.75/,
        /__name__\s*==\s*['"]__main__['"]/,
      ];

      validationChecks.forEach(check => {
        expect(generatedCode).toMatch(check);
      });

      // Should NOT have forbidden patterns
      expect(generatedCode).not.toMatch(/for\s+ticker\s+in\s+df\['ticker'\]\.unique\(\)/);
      expect(generatedCode).not.toMatch(/window\s*=\s*\d*O/);
    });
  });
});
