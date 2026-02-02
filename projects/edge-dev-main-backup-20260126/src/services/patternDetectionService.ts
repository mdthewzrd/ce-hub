/**
 * PATTERN DETECTION SERVICE
 * ========================
 *
 * Analyzes input scanner code and matches it to known patterns from the library.
 * This is NOT AI-based - it's deterministic pattern matching.
 */

import { SCANNER_PATTERNS, getAvailableScannerTypes } from './scannerPatternLibrary';
import { PatternDetectionResult, ScannerParameters } from '@/types/scannerTypes';

/**
 * Detect scanner type from input code
 */
export function detectScannerType(inputCode: string): PatternDetectionResult {
  const result: PatternDetectionResult = {
    scannerType: undefined,
    confidence: 0,
    matchedConditions: [],
    missingConditions: [],
    suggestedParameters: undefined
  };

  // Normalize input code for analysis
  const normalizedCode = normalizeCode(inputCode);

  // Extract conditions from input code
  const inputConditions = extractConditions(inputCode);

  // Score each scanner type
  const scores: Array<{ scannerType: string; score: number; matches: string[] }> = [];

  for (const scannerType of getAvailableScannerTypes()) {
    const pattern = SCANNER_PATTERNS[scannerType];
    const { score, matches } = scorePatternMatch(inputConditions, pattern.conditions);

    scores.push({
      scannerType,
      score,
      matches
    });
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  // Get best match
  const bestMatch = scores[0];

  if (bestMatch && bestMatch.score > 0.3) {
    // Minimum 30% confidence to claim a match
    result.scannerType = bestMatch.scannerType;
    result.confidence = bestMatch.score;
    result.matchedConditions = bestMatch.matches;

    // Get missing conditions
    const pattern = SCANNER_PATTERNS[bestMatch.scannerType];
    const allConditionNames = Object.keys(pattern.conditions);
    result.missingConditions = allConditionNames.filter(
      name => !bestMatch.matches.includes(name)
    );

    // Extract parameters from code
    result.suggestedParameters = extractParameters(inputCode, bestMatch.scannerType);
  }

  return result;
}

/**
 * Normalize code for analysis
 */
function normalizeCode(code: string): string {
  return code
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/#.*/g, '') // Remove comments
    .trim();
}

/**
 * Extract conditions from input code
 */
function extractConditions(code: string): Set<string> {
  const conditions = new Set<string>();

  // Look for common pattern indicators
  const indicators = [
    // Slope patterns
    /slope(?:\d*)d\s*[><=]+\s*[\d.]+/gi,
    // ATR patterns
    /atr\s*[><=]+\s*[\d.]+/gi,
    // EMA patterns
    /ema(?:\d*)\s*[><=]+\s*[\d.]+/gi,
    // Volume patterns
    /volume\s*[><=]+\s*\d+/gi,
    // Gap patterns
    /gap\s*[%]?\s*[><=]+\s*[\d.]+/gi,
    // Position patterns
    /high.*low\s*[><=]+.*atr/gi,
    // Range patterns
    /range\s*[><=]+\s*[\d.]+.*atr/gi
  ];

  for (const indicator of indicators) {
    const matches = code.match(indicator);
    if (matches) {
      matches.forEach(m => conditions.add(m));
    }
  }

  return conditions;
}

/**
 * Score how well input matches a pattern
 */
function scorePatternMatch(
  inputConditions: Set<string>,
  patternConditions: Record<string, string>
): { score: number; matches: string[] } {
  const matches: string[] = [];
  const patternConditionDescriptions = Object.keys(patternConditions);

  for (const description of patternConditionDescriptions) {
    const code = patternConditions[description];

    // Check if any input condition matches this pattern condition
    for (const inputCond of inputConditions) {
      if (conditionsMatch(inputCond, code)) {
        matches.push(description);
        break;
      }
    }
  }

  const score = matches.length / patternConditionDescriptions.length;

  return { score, matches };
}

/**
 * Check if two conditions match
 */
function conditionsMatch(input: string, pattern: string): boolean {
  // Normalize both
  const normInput = input.toLowerCase().replace(/\s+/g, '');
  const normPattern = pattern.toLowerCase().replace(/\s+/g, '');

  // Extract key terms
  const inputTerms = extractTerms(normInput);
  const patternTerms = extractTerms(normPattern);

  // Check if pattern terms are subset of input terms
  let matchCount = 0;
  patternTerms.forEach(t => {
    if (inputTerms.has(t)) matchCount++;
  });
  const requiredMatches = Math.max(2, patternTerms.size * 0.6); // Need at least 60% match

  return matchCount >= requiredMatches;
}

/**
 * Extract key terms from condition
 */
function extractTerms(condition: string): Set<string> {
  const terms = new Set<string>();

  // Extract variable names
  const varMatches = condition.match(/[a-z_][a-z0-9_]*/gi);
  if (varMatches) {
    varMatches.forEach(v => terms.add(v));
  }

  // Extract operators
  if (condition.includes('>=')) terms.add('gte');
  if (condition.includes('<=')) terms.add('lte');
  if (condition.includes('>')) terms.add('gt');
  if (condition.includes('<')) terms.add('lt');
  if (condition.includes('==')) terms.add('eq');

  // Extract common indicators
  if (condition.includes('atr')) terms.add('atr');
  if (condition.includes('ema')) terms.add('ema');
  if (condition.includes('slope')) terms.add('slope');
  if (condition.includes('volume')) terms.add('volume');
  if (condition.includes('gap')) terms.add('gap');

  return terms;
}

/**
 * Extract parameters from input code
 */
function extractParameters(code: string, scannerType: string): ScannerParameters | undefined {
  const pattern = SCANNER_PATTERNS[scannerType];
  if (!pattern) return undefined;

  const params: ScannerParameters = {};

  // Look for parameter assignments
  const paramAssignments = code.match(/(\w+)\s*[=:]\s*([\d.]+|true|false)/gi);

  if (paramAssignments) {
    for (const assignment of paramAssignments) {
      const match = assignment.match(/(\w+)\s*[=:]\s*([\d.]+|true|false)/i);
      if (match) {
        const [, name, value] = match;

        // Only include parameters that are in our pattern definition
        if (name in pattern.parameters) {
          if (value === 'true') {
            params[name] = true;
          } else if (value === 'false') {
            params[name] = false;
          } else if (value.includes('.')) {
            params[name] = parseFloat(value);
          } else {
            params[name] = parseInt(value, 10);
          }
        }
      }
    }
  }

  // For any missing parameters, use defaults from pattern
  for (const [name, defaultValue] of Object.entries(pattern.parameters)) {
    if (!(name in params)) {
      params[name] = defaultValue;
    }
  }

  return params;
}

/**
 * Get template code for a scanner type
 */
export function getTemplateCode(scannerType: string): string | undefined {
  // This will load the actual template files in the next step
  // For now, return undefined to indicate we need to implement this
  return undefined;
}
