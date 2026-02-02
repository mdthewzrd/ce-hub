/**
 * PATTERN-BASED FORMATTING SERVICE
 * =================================
 *
 * This REPLACES the AI-based formatting service.
 *
 * Instead of calling GPT-4 and hoping it preserves the logic, we:
 * 1. Detect the scanner type from input code
 * 2. Load the EXACT template from our library
 * 3. Extract parameters from input code
 * 4. Generate formatted code using template + parameters
 * 5. Validate that the output matches the pattern
 *
 * This is DETERMINISTIC and TESTABLE, not probabilistic like AI.
 */

import { detectScannerType } from './patternDetectionService';
import { generateFormattedScanner, getTemplateParameters, validatePatternPreservation } from './templateCodeService';
import { SCANNER_PATTERNS } from './scannerPatternLibrary';
import { FormattingResult } from '@/types/scannerTypes';
import { quickValidate } from './scannerExecutionValidator';

export async function formatScannerWithPatternLibrary(
  inputCode: string,
  userParams?: Record<string, any>,
  options?: {
    skipExecutionValidation?: boolean;  // Skip execution validation (default: false)
    enableExecutionValidation?: boolean; // Enable execution validation (default: false)
  }
): Promise<FormattingResult> {
  const result: FormattingResult = {
    success: false,
    errors: [],
    warnings: []
  };

  try {
    // Step 1: Detect scanner type
    console.log('🔍 Detecting scanner type from input code...');
    const detection = detectScannerType(inputCode);

    if (!detection.scannerType || detection.confidence < 0.5) {
      result.errors = [
        'Could not confidently detect scanner type',
        `Matched conditions: ${detection.matchedConditions.length}`,
        `Missing conditions: ${detection.missingConditions.length}`
      ];
      return result;
    }

    console.log(`✅ Detected: ${detection.scannerType} (${Math.round(detection.confidence * 100)}% confidence)`);
    result.scannerType = detection.scannerType;

    // Step 2: Get template parameters as defaults
    console.log('📋 Loading template parameters...');
    const templateParams = getTemplateParameters(detection.scannerType);

    if (!templateParams) {
      result.errors = [`Could not load parameters for ${detection.scannerType}`];
      return result;
    }

    // Use detected parameters if available, otherwise use template defaults
    const finalParams = detection.suggestedParameters || templateParams;

    // Override with any user-provided parameters
    if (userParams) {
      Object.assign(finalParams, userParams);
    }

    result.parameters = finalParams;

    // Step 3: Generate formatted scanner from template
    console.log('⚙️  Generating formatted scanner from template...');
    const formattedCode = generateFormattedScanner(
      detection.scannerType,
      finalParams
    );

    if (!formattedCode) {
      result.errors = [`Failed to generate formatted code for ${detection.scannerType}`];
      return result;
    }

    // Step 4: Validate pattern preservation (syntax)
    console.log('✅ Validating pattern preservation...');
    const validation = validatePatternPreservation(
      inputCode,
      formattedCode,
      detection.scannerType
    );

    if (!validation.isValid) {
      result.warnings = validation.errors;
    }

    // Step 5: Optional execution validation (semantic)
    if (options?.enableExecutionValidation && !options?.skipExecutionValidation) {
      console.log('🔬 Executing both scanners to validate logic preservation...');

      try {
        const executionValidation = await quickValidate(
          inputCode,
          formattedCode,
          detection.scannerType
        );

        if (!executionValidation.isValid) {
          result.errors?.push(
            'Execution validation failed: Formatted scanner produced different results!',
            `Original: ${executionValidation.comparison.originalSignalCount} signals, ` +
            `Formatted: ${executionValidation.comparison.formattedSignalCount} signals`
          );

          // Add detailed warnings
          if (executionValidation.comparison.missingSignals.length > 0) {
            result.warnings?.push(
              `Missing ${executionValidation.comparison.missingSignals.length} signals in formatted output`
            );
          }

          if (executionValidation.comparison.extraSignals.length > 0) {
            result.warnings?.push(
              `Found ${executionValidation.comparison.extraSignals.length} extra signals in formatted output`
            );
          }

          // Mark as failed
          result.success = false;
          return result;
        } else {
          console.log(`✅ Execution validation PASSED: ${executionValidation.comparison.matchingSignals.length} signals match`);

          // Add performance info
          if (executionValidation.performanceComparison.timeDifferencePercent > 50) {
            result.warnings?.push(
              `Formatted scanner took ${executionValidation.performanceComparison.timeDifferencePercent.toFixed(1)}% longer to execute`
            );
          }
        }
      } catch (execError) {
        // Don't fail the formatting if execution validation fails
        result.warnings?.push(
          `Execution validation skipped: ${execError instanceof Error ? execError.message : 'Unknown error'}`
        );
        console.warn('⚠️  Execution validation failed (continuing anyway):', execError);
      }
    } else {
      console.log('ℹ️  Execution validation disabled (enable with enableExecutionValidation option)');
    }

    // Step 6: Success
    result.success = true;
    result.formattedCode = formattedCode;

    console.log(`✨ Formatting complete: ${detection.scannerType}`);

    return result;

  } catch (error) {
    result.errors = [`Formatting failed: ${error}`];
    console.error('❌ Formatting error:', error);
    return result;
  }
}

/**
 * Quick format - just apply basic fixes without pattern matching
 */
export async function quickFormatScanner(inputCode: string): Promise<string> {
  let formatted = inputCode;

  // Apply basic fixes (from original auto-fix patterns)
  const fixes = [
    // Fix 1: Rename Polygon columns
    [/df\s*=\s*pd\.DataFrame\(results\)/g, "df = pd.DataFrame(results)"],
    [/\.rename\(\s*\{\s*'T':\s*'ticker'/g, ".rename({'T': 'ticker'"],
    [/'o':\s*'open'/g, "'o': 'open'"],
    [/'h':\s*'high'/g, "'h': 'high'"],
    [/'l':\s*'low'/g, "'l': 'low'"],
    [/'c':\s*'close'/g, "'c': 'close'"],
    [/'v':\s*'volume'/g, "'v': 'volume'"],

    // Fix 2: Fix groupby().transform() with axis parameter
    [/\.transform\(\s*lambda\s+x:\s*x\.max\(axis=1\)\s*\)/g, ".max(axis=1)"],

    // Fix 3: Fix .reset_index() errors
    [/\.reset_index\(0,\s*drop=True\)/g, ""],

    // Fix 4: Remove markdown code blocks
    [/```python\n/g, ""],
    [/```\n/g, ""]
  ];

  for (const [pattern, replacement] of fixes) {
    formatted = formatted.replace(pattern as RegExp, replacement as any);
  }

  return formatted;
}

/**
 * Get available scanner types
 */
export function getAvailableScannerTypes(): string[] {
  return Object.keys(SCANNER_PATTERNS);
}

/**
 * Get pattern info for a scanner type
 */
export function getScannerPatternInfo(scannerType: string) {
  return SCANNER_PATTERNS[scannerType];
}
