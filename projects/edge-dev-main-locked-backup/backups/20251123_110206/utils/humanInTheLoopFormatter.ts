/**
 * Human-in-the-Loop Formatter API Service
 *
 * This service integrates with the backend to provide intelligent parameter
 * discovery and collaborative formatting capabilities.
 */

interface Parameter {
  name: string;
  value: any;
  type: 'filter' | 'config' | 'threshold' | 'unknown';
  confidence: number;
  line: number;
  context: string;
  suggested_description?: string;
  user_confirmed?: boolean;
  user_edited?: boolean;
}

interface ParameterExtractionResult {
  success: boolean;
  parameters: Parameter[];
  scanner_type: string;
  confidence_score: number;
  analysis_time: number;
  suggestions: string[];
}

interface FormattingStep {
  id: string;
  title: string;
  description: string;
  type: string;
  suggestions: any[];
  preview_code?: string;
}

interface CollaborativeFormattingResult {
  success: boolean;
  formatted_code: string;
  steps_completed: FormattingStep[];
  user_feedback: Record<string, any>;
  learning_insights: string[];
  final_confidence: number;
}

interface UserFeedback {
  parameter_confirmations: Record<string, boolean>;
  parameter_edits: Record<string, any>;
  step_approvals: Record<string, boolean>;
  overall_satisfaction: number;
  improvement_suggestions: string[];
}

export class HumanInTheLoopFormatterService {
  private readonly API_BASE_URL = 'http://localhost:8000';

  /**
   * Extract parameters from code using AI analysis
   */
  async extractParameters(code: string): Promise<ParameterExtractionResult> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/format/extract-parameters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code
        })
      });

      if (!response.ok) {
        throw new Error(`Parameter extraction failed: ${response.status}`);
      }

      const result = await response.json();

      return {
        success: result.success || false,
        parameters: this.normalizeParameters(result.parameters || []),
        scanner_type: result.scanner_type || 'unknown',
        confidence_score: result.confidence_score || 0,
        analysis_time: result.analysis_time || 0,
        suggestions: result.suggestions || []
      };
    } catch (error) {
      console.error('Parameter extraction error:', error);

      // Fallback to client-side analysis
      return this.clientSideParameterExtraction(code);
    }
  }

  /**
   * Client-side parameter extraction as fallback
   */
  private clientSideParameterExtraction(code: string): ParameterExtractionResult {
    const parameters: Parameter[] = [];
    const lines = code.split('\n');

    // Simple regex patterns for common trading parameters
    const patterns = [
      // Numeric thresholds
      {
        regex: /(\w*(?:min|max|threshold|limit|percent|pct|mult|ratio)\w*)\s*[=:]\s*([0-9.]+)/gi,
        type: 'threshold' as const
      },
      // Volume patterns
      {
        regex: /(volume\w*)\s*[><=]\s*([0-9.]+)/gi,
        type: 'filter' as const
      },
      // Price patterns
      {
        regex: /(price\w*|close\w*|open\w*)\s*[><=]\s*([0-9.]+)/gi,
        type: 'filter' as const
      },
      // Configuration values
      {
        regex: /([A-Z_]{2,})\s*=\s*([0-9.]+|"[^"]*"|'[^']*')/gi,
        type: 'config' as const
      }
    ];

    patterns.forEach(pattern => {
      let match;
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);

      while ((match = regex.exec(code)) !== null) {
        const lineIndex = code.substring(0, match.index).split('\n').length - 1;
        const lineContent = lines[lineIndex]?.trim() || '';

        parameters.push({
          name: match[1],
          value: this.parseValue(match[2]),
          type: pattern.type,
          confidence: this.calculateConfidence(match[1], pattern.type),
          line: lineIndex + 1,
          context: lineContent,
          suggested_description: this.generateDescription(match[1], pattern.type),
          user_confirmed: false,
          user_edited: false
        });
      }
    });

    // Remove duplicates
    const uniqueParameters = parameters.filter((param, index, array) =>
      array.findIndex(p => p.name === param.name && p.line === param.line) === index
    );

    return {
      success: true,
      parameters: uniqueParameters,
      scanner_type: this.detectScannerType(code),
      confidence_score: uniqueParameters.length > 0 ? 0.7 : 0.3,
      analysis_time: Date.now(),
      suggestions: this.generateSuggestions(uniqueParameters)
    };
  }

  /**
   * Perform collaborative formatting step
   */
  async performFormattingStep(
    code: string,
    stepId: string,
    parameters: Parameter[],
    userChoices: Record<string, any>
  ): Promise<{
    success: boolean;
    preview_code: string;
    step_result: any;
    next_suggestions: string[];
  }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/format/collaborative-step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          step_id: stepId,
          parameters: parameters.filter(p => p.user_confirmed !== false),
          user_choices: userChoices
        })
      });

      if (!response.ok) {
        throw new Error(`Formatting step failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Formatting step error:', error);

      // Fallback to client-side step processing
      return this.clientSideFormattingStep(code, stepId, parameters, userChoices);
    }
  }

  /**
   * Submit user feedback for learning
   */
  async submitUserFeedback(
    originalCode: string,
    finalCode: string,
    feedback: UserFeedback
  ): Promise<{ success: boolean; learning_applied: boolean }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/format/user-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          original_code: originalCode,
          final_code: finalCode,
          feedback: feedback,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`Feedback submission failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Feedback submission error:', error);

      // Store feedback locally for future use
      this.storeLocalFeedback(feedback);

      return { success: false, learning_applied: false };
    }
  }

  /**
   * Get formatting suggestions based on historical user preferences
   */
  async getPersonalizedSuggestions(code: string): Promise<{
    suggestions: string[];
    confidence: number;
    based_on_history: boolean;
  }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/format/personalized-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code })
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Personalized suggestions error:', error);
    }

    // Fallback to generic suggestions
    return {
      suggestions: [
        'Consider adding async/await patterns for better performance',
        'Add comprehensive error handling for production use',
        'Include progress tracking for long-running scans'
      ],
      confidence: 0.5,
      based_on_history: false
    };
  }

  // Helper methods
  private normalizeParameters(parameters: any[]): Parameter[] {
    return parameters.map(param => ({
      name: param.name || 'unknown',
      value: param.value,
      type: param.type || 'unknown',
      confidence: param.confidence || 0,
      line: param.line || 0,
      context: param.context || '',
      suggested_description: param.suggested_description || '',
      user_confirmed: param.user_confirmed || false,
      user_edited: param.user_edited || false
    }));
  }

  private parseValue(value: string): any {
    // Try to parse as number
    const num = parseFloat(value);
    if (!isNaN(num)) {
      return num;
    }

    // Remove quotes if string
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }

    return value;
  }

  private calculateConfidence(name: string, type: string): number {
    // Higher confidence for well-known parameter names
    const wellKnownNames = [
      'prev_close_min', 'volume_threshold', 'gap_percent',
      'atr_mult', 'slope3d_min', 'vol_mult'
    ];

    let confidence = 0.5;

    if (wellKnownNames.some(known => name.toLowerCase().includes(known.toLowerCase()))) {
      confidence += 0.3;
    }

    if (type === 'filter' && name.includes('min') || name.includes('max')) {
      confidence += 0.2;
    }

    return Math.min(confidence, 0.95);
  }

  private generateDescription(name: string, type: string): string {
    const descriptions: Record<string, string> = {
      'prev_close_min': 'Minimum previous close price filter for stock selection',
      'volume_threshold': 'Minimum volume requirement for liquidity validation',
      'gap_percent': 'Gap percentage threshold for pattern detection',
      'atr_mult': 'ATR multiplier for volatility-based filtering',
      'slope3d_min': 'Minimum 3-day slope for momentum detection',
      'vol_mult': 'Volume multiplier for unusual activity detection'
    };

    return descriptions[name.toLowerCase()] || `${type} parameter: ${name}`;
  }

  private detectScannerType(code: string): string {
    const codeLower = code.toLowerCase();

    if (codeLower.includes('lc_frontside') || codeLower.includes('late_continuation')) {
      return 'lc_scanner';
    }

    if (codeLower.includes('atr_mult') || codeLower.includes('parabolic')) {
      return 'a_plus_scanner';
    }

    if (codeLower.includes('async def main') || codeLower.includes('asyncio.run')) {
      return 'sophisticated_async_scanner';
    }

    return 'custom_scanner';
  }

  private generateSuggestions(parameters: Parameter[]): string[] {
    const suggestions: string[] = [];

    if (parameters.some(p => p.type === 'filter')) {
      suggestions.push('Consider adding validation for filter parameters');
    }

    if (parameters.some(p => p.name.includes('volume'))) {
      suggestions.push('Volume-based filtering detected - ensure proper liquidity validation');
    }

    if (parameters.length > 5) {
      suggestions.push('Many parameters detected - consider parameter grouping for better organization');
    }

    return suggestions;
  }

  private clientSideFormattingStep(
    code: string,
    stepId: string,
    parameters: Parameter[],
    userChoices: Record<string, any>
  ) {
    // Simple client-side step processing
    let preview_code = code;

    switch (stepId) {
      case 'parameter_discovery':
        // Add parameter validation
        const parameterBlock = parameters
          .filter(p => p.user_confirmed !== false)
          .map(p => `${p.name.toUpperCase()} = ${JSON.stringify(p.value)}  # User confirmed`)
          .join('\n');

        preview_code = `# HUMAN-VALIDATED PARAMETERS\n${parameterBlock}\n\n${code}`;
        break;

      case 'infrastructure_enhancement':
        if (userChoices.add_async && !code.includes('async def')) {
          preview_code = code.replace(
            'def main(',
            'async def main('
          );
        }
        break;

      case 'optimization':
        if (userChoices.add_multiprocessing) {
          preview_code = `import multiprocessing\n${code}`;
        }
        break;

      default:
        break;
    }

    return {
      success: true,
      preview_code,
      step_result: { applied: true },
      next_suggestions: ['Preview generated successfully']
    };
  }

  private storeLocalFeedback(feedback: UserFeedback): void {
    try {
      const existingFeedback = localStorage.getItem('hitl_formatter_feedback');
      const feedbackHistory = existingFeedback ? JSON.parse(existingFeedback) : [];

      feedbackHistory.push({
        ...feedback,
        timestamp: Date.now()
      });

      // Keep only last 100 feedback entries
      if (feedbackHistory.length > 100) {
        feedbackHistory.splice(0, feedbackHistory.length - 100);
      }

      localStorage.setItem('hitl_formatter_feedback', JSON.stringify(feedbackHistory));
    } catch (error) {
      console.error('Error storing local feedback:', error);
    }
  }
}

export const humanInTheLoopFormatter = new HumanInTheLoopFormatterService();

// Hook for React components
export function useHumanInTheLoopFormatter() {
  return {
    extractParameters: humanInTheLoopFormatter.extractParameters.bind(humanInTheLoopFormatter),
    performFormattingStep: humanInTheLoopFormatter.performFormattingStep.bind(humanInTheLoopFormatter),
    submitUserFeedback: humanInTheLoopFormatter.submitUserFeedback.bind(humanInTheLoopFormatter),
    getPersonalizedSuggestions: humanInTheLoopFormatter.getPersonalizedSuggestions.bind(humanInTheLoopFormatter)
  };
}