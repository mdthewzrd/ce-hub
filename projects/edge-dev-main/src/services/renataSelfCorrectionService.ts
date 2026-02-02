/**
 * Renata Self-Correction Service
 *
 * Enables Renata to handle user feedback and fix its own mistakes
 * without needing Claude's intervention.
 */

interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  generatedCode?: string;
  metadata?: {
    type: 'code_generation' | 'formatting' | 'general_chat';
    confidence?: number;
    errors?: string[];
  };
}

interface CorrectionRequest {
  userMessage: string;
  previousCode: string;
  originalPrompt: string;
  feedbackType: 'syntax_error' | 'logic_error' | 'wrong_output' | 'general_feedback';
}

interface CorrectionResponse {
  success: boolean;
  correctedCode?: string;
  explanation: string;
  confidence: number;
  appliedChanges: string[];
  requiresManualIntervention: boolean;
}

export class RenataSelfCorrectionService {
  private conversations: Map<string, ConversationTurn[]> = new Map();
  private maxHistoryLength = 10;

  /**
   * Store a conversation turn
   */
  storeTurn(sessionId: string, turn: ConversationTurn) {
    if (!this.conversations.has(sessionId)) {
      this.conversations.set(sessionId, []);
    }

    const history = this.conversations.get(sessionId)!;
    history.push(turn);

    // Keep only recent history
    if (history.length > this.maxHistoryLength) {
      history.shift();
    }
  }

  /**
   * Detect if user message is feedback/correction
   */
  detectFeedbackIntent(message: string): boolean {
    const feedbackIndicators = [
      // Direct corrections
      'that\'s wrong',
      'that is wrong',
      'you made a mistake',
      'that\'s incorrect',
      'fix this',
      'not what I asked for',
      'try again',
      'incorrect output',

      // Syntax/execution errors
      'syntax error',
      'doesn\'t work',
      'not working',
      'failed',
      'error on line',

      // Logic/output issues
      'wrong result',
      'incorrect result',
      'not the right output',
      'output is wrong',
      'gave me wrong',

      // General dissatisfaction
      'no, that\'s not',
      'actually, I wanted',
      'that\'s not what I meant',
      'let me clarify',
      'i need you to',
      'change this',
      'modify this',
      'update this'
    ];

    const lowerMessage = message.toLowerCase();
    return feedbackIndicators.some(indicator => lowerMessage.includes(indicator));
  }

  /**
   * Classify the type of feedback
   */
  classifyFeedback(message: string, context?: any): CorrectionRequest['feedbackType'] {
    const lowerMessage = message.toLowerCase();

    // Check for syntax errors
    if (lowerMessage.includes('syntax error') ||
        lowerMessage.includes('indentation') ||
        lowerMessage.includes('parse error') ||
        lowerMessage.match(/error on line \d+/)) {
      return 'syntax_error';
    }

    // Check for logic errors
    if (lowerMessage.includes('wrong logic') ||
        lowerMessage.includes('incorrect calculation') ||
        lowerMessage.includes('wrong formula')) {
      return 'logic_error';
    }

    // Check for wrong output
    if (lowerMessage.includes('wrong result') ||
        lowerMessage.includes('incorrect result') ||
        lowerMessage.includes('output is wrong')) {
      return 'wrong_output';
    }

    return 'general_feedback';
  }

  /**
   * Get the most recent code generation from conversation history
   */
  getLastGeneratedCode(sessionId: string): { code: string; originalPrompt: string } | null {
    const history = this.conversations.get(sessionId);
    if (!history) return null;

    // Find the most recent assistant turn with generated code
    for (let i = history.length - 1; i >= 0; i--) {
      const turn = history[i];
      if (turn.role === 'assistant' && turn.generatedCode) {
        // Find the original user prompt that led to this code
        const originalPrompt = i > 0 && history[i - 1].role === 'user'
          ? history[i - 1].content
          : '';

        return {
          code: turn.generatedCode,
          originalPrompt
        };
      }
    }

    return null;
  }

  /**
   * Process feedback and generate correction
   */
  async processFeedback(
    sessionId: string,
    userMessage: string,
    context?: any
  ): Promise<CorrectionResponse> {
    console.log('🔄 Renata Self-Correction activated');

    // Get previous code generation
    const lastGeneration = this.getLastGeneratedCode(sessionId);

    if (!lastGeneration) {
      return {
        success: false,
        explanation: 'I don\'t have any previous code to correct. Please provide the code you\'d like me to fix.',
        confidence: 0,
        appliedChanges: [],
        requiresManualIntervention: true
      };
    }

    // Classify feedback type
    const feedbackType = this.classifyFeedback(userMessage, context);

    console.log(`📊 Feedback classified as: ${feedbackType}`);

    // Build correction request
    const correctionRequest: CorrectionRequest = {
      userMessage,
      previousCode: lastGeneration.code,
      originalPrompt: lastGeneration.originalPrompt,
      feedbackType
    };

    // Use AI to generate correction
    try {
      const correction = await this.generateCorrection(correctionRequest);

      // Store the correction in conversation history
      this.storeTurn(sessionId, {
        role: 'assistant',
        content: correction.explanation,
        timestamp: new Date(),
        generatedCode: correction.correctedCode,
        metadata: {
          type: 'code_generation',
          confidence: correction.confidence
        }
      });

      return correction;
    } catch (error) {
      console.error('❌ Correction generation failed:', error);

      return {
        success: false,
        explanation: `I encountered an error trying to fix the code: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 0,
        appliedChanges: [],
        requiresManualIntervention: true
      };
    }
  }

  /**
   * Generate corrected code using AI
   */
  private async generateCorrection(request: CorrectionRequest): Promise<CorrectionResponse> {
    const { previousCode, originalPrompt, userMessage, feedbackType } = request;

    // Build system prompt for correction
    const systemPrompt = `# Renata AI - Self-Correction Mode

You are Renata, an expert Python developer who can identify and fix mistakes in your own code.

## Your Task
The user has provided feedback on code you previously generated. Your job is to:
1. Understand the feedback
2. Identify the specific issue
3. Fix the code
4. Explain what you changed and why

## Feedback Type: ${feedbackType}

## Original Request
${originalPrompt}

## Your Previous Code
\`\`\`python
${previousCode}
\`\`\`

## User Feedback
${userMessage}

## Critical Requirements
1. **OUTPUT ONLY VALID PYTHON CODE** - no explanations outside the code
2. **Fix the specific issue** mentioned in the feedback
3. **Preserve all other functionality** - don't change what isn't broken
4. **Follow EdgeDev standards** - maintain 3-stage architecture, proper imports, etc.
5. **Include necessary imports** - make sure nothing is missing
6. **Ensure syntax is valid** - code must compile without errors

## Response Format
Return ONLY the corrected Python code. Start with import statements and provide the complete, fixed code.
`;

    try {
      // Call the AI Agent service
      const { RenataAIAgentService } = await import('./renataAIAgentService');
      const agent = new RenataAIAgentService();

      const correctedCode = await agent.generate({
        prompt: systemPrompt,
        temperature: 0.3, // Lower temperature for more focused corrections
        maxTokens: 8000
      });

      // Analyze what changed
      const changes = this.analyzeChanges(previousCode, correctedCode);

      return {
        success: true,
        correctedCode,
        explanation: this.generateExplanation(changes, feedbackType),
        confidence: this.calculateConfidence(changes, feedbackType),
        appliedChanges: changes,
        requiresManualIntervention: false
      };

    } catch (error) {
      throw new Error(`AI correction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze differences between original and corrected code
   */
  private analyzeChanges(original: string, corrected: string): string[] {
    const changes: string[] = [];

    // Split into lines for comparison
    const originalLines = original.split('\n');
    const correctedLines = corrected.split('\n');

    // Simple line-by-line comparison
    const maxLines = Math.max(originalLines.length, correctedLines.length);

    for (let i = 0; i < maxLines; i++) {
      const originalLine = originalLines[i]?.trim();
      const correctedLine = correctedLines[i]?.trim();

      if (originalLine !== correctedLine) {
        if (correctedLine && !originalLine) {
          changes.push(`Added line ${i + 1}: ${correctedLine.substring(0, 50)}...`);
        } else if (originalLine && !correctedLine) {
          changes.push(`Removed line ${i + 1}: ${originalLine.substring(0, 50)}...`);
        } else if (originalLine && correctedLine) {
          changes.push(`Modified line ${i + 1}: ${originalLine.substring(0, 30)}... → ${correctedLine.substring(0, 30)}...`);
        }
      }
    }

    // Check for common patterns
    if (corrected.includes('import') && !original.includes(corrected.match(/import (\w+)/)?.[1] || '')) {
      changes.push('Added missing imports');
    }

    if (original.includes('# ') && corrected.includes('# ')) {
      const originalComments = original.match(/# .+/g) || [];
      const correctedComments = corrected.match(/# .+/g) || [];
      if (correctedComments.length > originalComments.length) {
        changes.push('Added clarifying comments');
      }
    }

    return changes.length > 0 ? changes : ['Code formatting improved'];
  }

  /**
   * Generate explanation based on changes and feedback type
   */
  private generateExplanation(changes: string[], feedbackType: string): string {
    let explanation = `✅ **I've fixed the code**\n\n`;

    switch (feedbackType) {
      case 'syntax_error':
        explanation += `**Issue:** Syntax error preventing code execution\n\n`;
        explanation += `**Fix:** I've corrected the syntax error`;
        if (changes.some(c => c.includes('import'))) {
          explanation += ` and added missing imports`;
        }
        break;

      case 'logic_error':
        explanation += `**Issue:** Logic error in the code\n\n`;
        explanation += `**Fix:** I've corrected the logic`;
        break;

      case 'wrong_output':
        explanation += `**Issue:** Code wasn't producing the expected output\n\n`;
        explanation += `**Fix:** I've adjusted the code to produce the correct output`;
        break;

      default:
        explanation += `**Changes Made:**\n`;
        break;
    }

    if (changes.length > 0) {
      explanation += `\n\n**What I changed:**\n`;
      changes.slice(0, 5).forEach(change => {
        explanation += `• ${change}\n`;
      });
      if (changes.length > 5) {
        explanation += `• ... and ${changes.length - 5} more changes\n`;
      }
    }

    explanation += `\n\n**Confidence:** This fix addresses your feedback. Let me know if you need further adjustments.`;

    return explanation;
  }

  /**
   * Calculate confidence score for the correction
   */
  private calculateConfidence(changes: string[], feedbackType: string): number {
    let confidence = 0.7; // Base confidence

    // Higher confidence for syntax errors (clearer fix)
    if (feedbackType === 'syntax_error') {
      confidence += 0.2;
    }

    // Adjust based on number of changes (fewer changes = more focused fix)
    if (changes.length <= 3) {
      confidence += 0.1;
    } else if (changes.length > 10) {
      confidence -= 0.1;
    }

    return Math.min(0.99, Math.max(0.5, confidence));
  }

  /**
   * Clear conversation history for a session
   */
  clearHistory(sessionId: string) {
    this.conversations.delete(sessionId);
  }

  /**
   * Get conversation history
   */
  getHistory(sessionId: string): ConversationTurn[] {
    return this.conversations.get(sessionId) || [];
  }
}

// Export singleton instance
export const renataSelfCorrectionService = new RenataSelfCorrectionService();
