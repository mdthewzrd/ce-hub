/**
 * ENHANCED FORMATTING SERVICE (AI-FIRST WITH TEMPLATE CONTEXT)
 * ==============================================================
 *
 * AI-FIRST ARCHITECTURE:
 * 1. Analyze user input (code or idea)
 * 2. Build rich prompt with:
 *    - All non-negotiable system requirements
 *    - Relevant template examples as few-shot learning
 *    - Dynamic context based on user input
 * 3. Call AI with comprehensive context
 * 4. Validate output against requirements
 *
 * Templates are used as EXAMPLES to teach the AI, not as code to copy.
 */

import {
  BACKSIDE_B_TEMPLATE,
  A_PLUS_TEMPLATE,
  TemplateSelector,
  ParameterExtractor,
  FormatValidator
} from '../app/api/format-exact/enhanced-reference-templates';

import {
  PromptGenerator,
  MASTER_FORMATTING_PROMPT
} from './aiFormattingPrompts';

import {
  SCANNER_TEMPLATES,
  detectScannerType,
  getTemplateKnowledge,
  GROUPED_ENDPOINT_ARCHITECTURE
} from './scannerTemplateKnowledge';

// NEW: AI-FIRST PROMPT ENGINEERING
import {
  buildCompletePrompt,
  buildSystemPrompt,
  PromptContext
} from './renataPromptEngineer';

// PATTERN DETECTION (for context, not for copying)
import { detectScannerType as detectFromPatternLibrary } from './patternDetectionService';

// ===== FORMATTING REQUEST INTERFACES =====

export interface FormattingRequest {
  code: string;
  filename: string;
  aiProvider?: 'openrouter' | 'claude';
  model?: string;
  validateOutput?: boolean;
  maxRetries?: number;
}

export interface FormattingResult {
  success: boolean;
  formattedCode?: string;
  template?: any;
  validation?: any;
  scannerName?: string;  // ← ADD THIS: Extracted scanner name
  scannerType?: string;  // Scanner type detection
  metrics?: {
    originalLines: number;
    formattedLines: number;
    parameterCount: number;
    processingTime: number;
  };
  errors?: string[];
  warnings?: string[];
  retryAttempts?: number;
}

export interface FormattingSession {
  id: string;
  request: FormattingRequest;
  startTime: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: FormattingResult;
  error?: string;
}

// ===== ENHANCED FORMATTING SERVICE =====

export class EnhancedFormattingService {
  private static instance: EnhancedFormattingService;
  private activeSessions: Map<string, FormattingSession> = new Map();

  private constructor() {}

  static getInstance(): EnhancedFormattingService {
    if (!EnhancedFormattingService.instance) {
      EnhancedFormattingService.instance = new EnhancedFormattingService();
    }
    return EnhancedFormattingService.instance;
  }

  /**
   * Main formatting method with comprehensive validation and retry logic
   */
  async formatCode(request: FormattingRequest): Promise<FormattingResult> {
    const sessionId = `format_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session: FormattingSession = {
      id: sessionId,
      request: {
        ...request,
        validateOutput: request.validateOutput !== false, // Default to true
        maxRetries: request.maxRetries || 3
      },
      startTime: Date.now(),
      status: 'pending'
    };

    this.activeSessions.set(sessionId, session);

    try {
      session.status = 'processing';

      // =====================================================================
      // AI-FIRST APPROACH: Use AI with rich template context
      // =====================================================================
      console.log('\n🤖 STEP 1: Building AI prompt with template context...');

      // Detect scanner type for context (not for copying)
      const detection = detectFromPatternLibrary(request.code);
      console.log(`   Context: ${detection.scannerType || 'unknown scanner'} (${Math.round(detection.confidence * 100)}% confidence)`);

      // Build rich prompt with all requirements and template examples
      const promptContext: PromptContext = {
        task: 'format',
        userInput: request.code,
        detectedType: detection.scannerType || undefined,
        requirements: [
          '3-stage grouped endpoint architecture',
          'Parallel workers (stage1=5, stage3=10)',
          'Full market scanning',
          'Parameter integrity',
          'Code structure standards'
        ],
        relevantExamples: [], // Will be populated by buildCompletePrompt
        userIntent: 'Format uploaded code to Edge Dev standards'
      };

      const completePrompt = buildCompletePrompt(promptContext);
      console.log(`   Prompt size: ${completePrompt.length} characters`);
      console.log(`   System prompt: ${buildSystemPrompt().length} characters`);
      console.log(`   Few-shot examples: Included`);

      // Call AI with rich context
      console.log('\n🤖 STEP 2: Calling AI with rich context...');
      const aiResult = await this.callAIWithContext(completePrompt, request);

      if (aiResult.success) {
        console.log('✨ AI formatting SUCCESSFUL');
        session.status = 'completed';
        session.result = aiResult;

        console.log(`✅ Formatting completed in ${Date.now() - session.startTime}ms (AI-FIRST)`);
        return session.result;
      } else {
        throw new Error(aiResult.errors?.join(', ') || 'AI formatting failed');
      }

      // =====================================================================
      // NO PATTERN-BASED FALLBACK - AI ALWAYS DOES THE WORK
      // =====================================================================
      console.log('\n🤖 STEP 2: Using AI-based formatting...');

      // Step 1: Analyze and select template
      const template = TemplateSelector.selectTemplate(request.code);
      const analysis = TemplateSelector.analyzeCode(request.code);

      console.log(`🎯 Selected template: ${template === BACKSIDE_B_TEMPLATE ? 'Backside B' : 'A+'}`);
      console.log(`📊 Analysis: ${analysis.formatType} format, ${analysis.complexity} complexity, ${analysis.confidence}% confidence`);

      // Step 2: Extract parameters with multiple methods
      const extractedParams = ParameterExtractor.extractParameters(request.code);
      console.log(`🔍 Extracted ${extractedParams.length} parameters from original code`);

      // Step 2.5: Detect scanner type for proper prompt generation
      const detectedScannerType = this.detectScannerTypeFromCode(request.code) || 'Unknown';
      console.log(`🎯 Detected scanner type: "${detectedScannerType}"`);

      // Step 3: Generate COMPREHENSIVE AI prompt for complete code generation
      // 🎯 CRITICAL: Use generateDetailedPrompt with detected scanner type
      // generateFormattingPrompt only produces ~316 lines (incomplete)
      const aiPrompt = PromptGenerator.generateDetailedPrompt(request.code, request.filename, detectedScannerType);
      console.log(`📝 Generated ${aiPrompt.length} character COMPREHENSIVE prompt for AI formatting`);

      // DEBUG: Log the actual prompt being sent
      console.log('🐛 DEBUG - Prompt being sent to AI:');
      console.log(aiPrompt.substring(0, 1000) + '...'); // Show first 1000 chars
      console.log('🐛 DEBUG - Checking for critical requirements in prompt...');
      console.log('  - Contains FormattedBacksideParaBScanner:', aiPrompt.includes('FormattedBacksideParaBScanner'));
      console.log('  - Contains timedelta import:', aiPrompt.includes('timedelta'));
      console.log('  - Contains class name warnings:', aiPrompt.includes('CLASS NAME CONSISTENCY'));

      // Step 3.5: Extract scanner name from code content (for fallback)
      const extractedScannerName = this.extractScannerNameFromCode(request.code, request.filename);
      console.log(`🏷️ Extracted scanner name: "${extractedScannerName}"`);

      // Step 4: Attempt formatting with retry logic
      let result = await this.attemptFormatting(request, aiPrompt, template, 0);

      // Step 5: Basic validation if requested (flexible - not template-based)
      // The attemptFormatting method already does basic validation, so we just use that result
      if (request.validateOutput && result.success && result.formattedCode) {
        // Basic validation is already done in attemptFormatting
        // Skip template-based validation for AI-generated code (allows any scanner type)
        if ((result.warnings?.length ?? 0) > 0) {
          console.log(`⚠️ Validation warnings: ${result.warnings?.join(', ')}`);
        }
      }

      // Step 6: Calculate final metrics
      const processingTime = Date.now() - session.startTime;
      result.metrics = {
        originalLines: request.code.split('\n').length,
        formattedLines: result.formattedCode?.split('\n').length ?? 0,
        parameterCount: extractedParams.length,
        processingTime
      };

      // Add extracted scanner name to result
      result.scannerName = extractedScannerName;
      console.log(`🏷️ Final scanner name: "${result.scannerName}"`);

      session.status = result.success ? 'completed' : 'failed';
      session.result = result;

      console.log(`✅ Formatting ${result.success ? 'completed' : 'failed'} in ${processingTime}ms`);

      return result;

    } catch (error) {
      session.status = 'failed';
      session.error = error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        errors: [session.error],
        metrics: {
          originalLines: request.code.split('\n').length,
          formattedLines: 0,
          parameterCount: 0,
          processingTime: Date.now() - session.startTime
        },
        retryAttempts: 0
      };
    } finally {
      // Clean up session after delay
      setTimeout(() => {
        this.activeSessions.delete(sessionId);
      }, 60000); // Keep for 1 minute
    }
  }

  /**
   * Attempt formatting with specified prompt and template
   */
  private async attemptFormatting(
    request: FormattingRequest,
    prompt: string,
    template: any,
    attempt: number
  ): Promise<FormattingResult> {
    try {
      if (attempt > 0) {
        console.log(`🔄 Retry attempt ${attempt}/${request.maxRetries!}`);
      }

      // Call AI service with enhanced prompt (extended timeout)
      const aiResponse = await this.callAIService(prompt, request.aiProvider, request.model, 300000); // 300 second timeout (5 minutes)

      if (!aiResponse.success || !aiResponse.formattedCode) {
        return {
          success: false,
          errors: aiResponse.errors || ['AI formatting failed'],
          retryAttempts: attempt
        };
      }

      // Validate basic structure
      console.log('🔍 DEBUG - Code to validate (first 500 chars):', aiResponse.formattedCode?.substring(0, 500));
      console.log('🔍 DEBUG - Code length:', aiResponse.formattedCode?.length);
      const basicValidation = this.validateBasicStructure(aiResponse.formattedCode, template);

      if (!basicValidation.isValid) {
        // 🎯 CRITICAL: Check if validation failed due to markdown blocks
        const hasMarkdownErrors = basicValidation.errors.some(err =>
          err.toLowerCase().includes('markdown') || err.toLowerCase().includes('```')
        );

        if (hasMarkdownErrors && attempt < request.maxRetries!) {
          console.warn('⚠️ AI returned markdown blocks - retrying with explicit instructions...');

          // Retry with stronger prompt that explicitly forbids markdown
          const antiMarkdownPrompt = this.addAntiMarkdownInstructions(prompt);

          // Recursive retry with modified prompt
          return this.attemptFormatting(
            { ...request, maxRetries: request.maxRetries },
            antiMarkdownPrompt,
            template,
            attempt + 1
          );
        }

        return {
          success: false,
          errors: basicValidation.errors,
          warnings: basicValidation.warnings,
          retryAttempts: attempt
        };
      }

      // 🎯 AUTO-FIX STAGE: Apply automatic fixes to common code issues
      console.log('🔧 Running auto-fix validation...');
      const autoFixedCode = this.applyAutoFixes(aiResponse.formattedCode);
      const fixesApplied = autoFixedCode !== aiResponse.formattedCode;

      if (fixesApplied) {
        console.log('✅ Auto-fixes applied to generated code');
      } else {
        console.log('✅ No auto-fixes needed');
      }

      return {
        success: true,
        formattedCode: autoFixedCode,  // Use auto-fixed code
        scannerType: aiResponse.scannerType,
        template: template,
        retryAttempts: attempt,
        warnings: basicValidation.warnings
      };

    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown formatting error'],
        retryAttempts: attempt
      };
    }
  }

  /**
   * Call AI service for code formatting
   */
  private async callAIService(
    prompt: string,
    provider: string = 'openrouter',
    model: string = 'qwen/qwen3-coder',  // 480B MoE - with provider routing to avoid Hyperbolic failures
    timeout: number = 300000  // 5 minutes default timeout
  ): Promise<{ success: boolean; formattedCode?: string; scannerType?: string; errors?: string[] }> {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`AI service timeout after ${timeout}ms`)), timeout);
      });

      // Create the fetch promise - DO NOT parse JSON, get raw Python code
      const fetchPromise = fetch('http://localhost:5666/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: prompt,
          model: model,  // Pass the model through
          personality: 'expert-trading-developer',
          parseJson: false,  // ← DISABLED: Get raw Python code, not JSON
          extractFields: []  // ← DISABLED: No field extraction needed
        })
      });

      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        throw new Error(`AI service returned ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // DEBUG: Log the actual response from AI
      console.log('🔍 DEBUG - AI Response structure:', {
        hasMessage: !!result.message,
        messageType: typeof result.message,
        messagePreview: result.message ? result.message.substring(0, 200) : 'N/A',
        hasFormattedCode: !!result.formattedCode,
        formattedCodePreview: result.formattedCode ? result.formattedCode.substring(0, 200) : 'N/A'
      });

      // Handle multiple response formats:
      // 1. Pure Python code in result.message (NEW - expected after prompt fix)
      // 2. JSON format with formattedCode field (OLD - for backwards compatibility)
      let codeToUse: string | undefined;

      if (result.message && typeof result.message === 'string') {
        // Check if result.message contains JSON (old format) or is pure Python (new format)
        const trimmedMessage = result.message.trim();

        if (trimmedMessage.startsWith('{') || trimmedMessage.startsWith('[')) {
          // Old JSON format - parse and extract formattedCode
          try {
            const parsedJson = JSON.parse(trimmedMessage);
            codeToUse = parsedJson.formattedCode || parsedJson.code;
          } catch (e) {
            // If parsing fails, treat as Python code
            codeToUse = trimmedMessage;
          }
        } else {
          // New pure Python format - use directly
          codeToUse = trimmedMessage;
        }
      } else if (result.formattedCode) {
        // Fallback to formattedCode field
        codeToUse = result.formattedCode;
      }

      if (codeToUse && codeToUse.trim().length > 0) {
        // 🎯 CRITICAL: Strip markdown code blocks if present
        let cleanCode = codeToUse.trim();

        // Remove opening ```python or ``` markers
        if (cleanCode.startsWith('```')) {
          const firstNewline = cleanCode.indexOf('\n');
          if (firstNewline !== -1) {
            cleanCode = cleanCode.substring(firstNewline + 1);
          }
        }

        // Remove closing ``` markers
        if (cleanCode.endsWith('```')) {
          const lastTripleBacktick = cleanCode.lastIndexOf('```');
          if (lastTripleBacktick !== -1) {
            cleanCode = cleanCode.substring(0, lastTripleBacktick);
          }
        }

        // Trim again to remove any extra whitespace
        cleanCode = cleanCode.trim();

        console.log('🧹 Cleaned code - removed markdown blocks');
        console.log('🔍 Cleaned code preview (first 200 chars):', cleanCode.substring(0, 200));

        // Detect scanner type from the code
        const detectedType = this.detectScannerTypeFromCode(cleanCode);

        return {
          success: true,
          formattedCode: cleanCode,
          scannerType: detectedType
        };
      } else {
        return {
          success: false,
          errors: [result.error || 'No formatted code returned from AI']
        };
      }

    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'AI service call failed']
      };
    }
  }

  /**
   * Call AI with rich template context (AI-FIRST APPROACH)
   *
   * This method uses the prompt engineering system to provide:
   * 1. All non-negotiable system requirements
   * 2. Relevant template examples as few-shot learning
   * 3. Dynamic context based on user input
   *
   * Templates teach the AI PATTERNS, not code to copy.
   */
  private async callAIWithContext(
    prompt: string,  // Rich prompt from buildCompletePrompt()
    request: FormattingRequest
  ): Promise<FormattingResult> {
    try {
      console.log('🤖 Calling AI with rich template context...');

      // Call the existing AI service with our enhanced prompt
      const aiResult = await this.callAIService(
        prompt,
        request.aiProvider || 'openrouter',
        request.model || 'qwen/qwen3-coder',
        300000  // 5 minute timeout
      );

      if (!aiResult.success || !aiResult.formattedCode) {
        return {
          success: false,
          errors: aiResult.errors || ['AI service failed'],
          metrics: {
            originalLines: request.code.split('\n').length,
            formattedLines: 0,
            parameterCount: 0,
            processingTime: 0
          }
        };
      }

      // Extract parameters from formatted code
      const extractedParams = ParameterExtractor.extractParameters(aiResult.formattedCode);
      console.log(`   Extracted ${extractedParams.length} parameters`);

      // Basic validation
      const validation = FormatValidator.validateBasic(aiResult.formattedCode);
      console.log(`   Validation: ${validation.isValid ? 'PASSED' : 'FAILED'}`);

      // Extract scanner name
      const scannerName = this.extractScannerNameFromCode(aiResult.formattedCode, request.filename);

      // 🔑 INJECT POLYGON API KEY - Ensure formatted code is ready to run
      const codeWithApiKey = this.injectPolygonApiKey(aiResult.formattedCode);

      if (codeWithApiKey !== aiResult.formattedCode) {
        console.log('🔑 Injected Polygon API key into formatted code');
      }

      // 🔧 AUTO-FIX STRUCTURAL BUGS - Fix common code generation errors
      const codeWithFixes = this.autoFixStructuralBugs(codeWithApiKey);

      if (codeWithFixes !== codeWithApiKey) {
        console.log('🔧 Applied structural bug fixes');
      }

      return {
        success: true,
        formattedCode: codeWithFixes,  // Use code with API key + structural fixes
        scannerName: scannerName,
        scannerType: aiResult.scannerType,
        validation: validation,
        warnings: validation.warnings,
        errors: validation.isValid ? [] : validation.errors,
        metrics: {
          originalLines: request.code.split('\n').length,
          formattedLines: aiResult.formattedCode.split('\n').length,
          parameterCount: extractedParams.length,
          processingTime: 0  // Will be set by caller
        }
      };

    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'AI with context failed'],
        metrics: {
          originalLines: request.code.split('\n').length,
          formattedLines: 0,
          parameterCount: 0,
          processingTime: 0
        }
      };
    }
  }

  /**
   * Detect scanner type from code content
   */
  private detectScannerTypeFromCode(code: string): string {
    const codeLower = code.toLowerCase();

    // Detect backside B scanner patterns
    if (codeLower.includes('backside') && codeLower.includes('para b')) {
      return 'Backside B Para Scanner';
    }
    if (codeLower.includes('backside') && codeLower.includes('b')) {
      return 'Backside B Scanner';
    }

    // Detect A+ scanner patterns
    if (codeLower.includes('a+') && codeLower.includes('para')) {
      return 'A+ Para Scanner';
    }
    if (codeLower.includes('half a+') || codeLower.includes('a_plus')) {
      return 'Half A+ Scanner';
    }
    if (codeLower.includes('a plus') || codeLower.includes('aplus')) {
      return 'A+ Scanner';
    }

    // Detect LC D2 scanner patterns
    if (codeLower.includes('lc') && codeLower.includes('d2')) {
      return 'LC D2 Scanner';
    }
    if (codeLower.includes('lc') && codeLower.includes('frontside')) {
      return 'LC Frontside Scanner';
    }
    if (codeLower.includes('lc scanner')) {
      return 'LC Scanner';
    }

    // Detect parabolic scanners
    if (codeLower.includes('parabolic') && codeLower.includes('daily')) {
      return 'Daily Parabolic Scanner';
    }
    if (codeLower.includes('parabolic')) {
      return 'Parabolic Scanner';
    }

    // Detect gap scanners
    if (codeLower.includes('gap') && codeLower.includes('scan')) {
      return 'Gap Scanner';
    }

    // Detect momentum scanners
    if (codeLower.includes('momentum')) {
      return 'Momentum Scanner';
    }

    // Detect D1/D2 gap scanners
    if (codeLower.includes('d1') && codeLower.includes('gap')) {
      return 'D1 Gap Scanner';
    }
    if (codeLower.includes('d2') && codeLower.includes('gap')) {
      return 'D2 Gap Scanner';
    }

    // Default: Enhanced Scanner
    return 'Enhanced Scanner';
  }

  /**
   * 🔑 INJECT POLYGON API KEY - Ensure formatted code has API key configured
   *
   * Detects common API key patterns and injects the user's Polygon API key
   * This ensures the formatted code is ready-to-run without manual edits
   */
  private injectPolygonApiKey(code: string): string {
    const POLYGON_API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I";
    let modified = false;
    let result = code;

    // Pattern 1: os.getenv("POLYGON_API_KEY") - module level or assignment
    // Match patterns like:
    // - api_key = os.getenv("POLYGON_API_KEY")
    // - os.getenv("POLYGON_API_KEY")
    // - os.getenv('POLYGON_API_KEY', '')
    const osGetenvPattern = /os\.getenv\(['"]POLYGON_API_KEY['"](?:,\s*['"][^'"]*['"])?\)/g;
    if (osGetenvPattern.test(result)) {
      result = result.replace(osGetenvPattern, `"${POLYGON_API_KEY}"`);
      modified = true;
      console.log('   🔑 Replaced os.getenv("POLYGON_API_KEY") with API key');
    }

    // Pattern 2: self.api_key = None or placeholder
    if (result.includes('self.api_key = None') || result.includes('self.api_key=None')) {
      result = result.replace(/self\.api_key\s*=\s*None/g, `self.api_key = "${POLYGON_API_KEY}"`);
      modified = true;
      console.log('   🔑 Replaced self.api_key = None with API key');
    }

    // Pattern 3: API_KEY = os.getenv("POLYGON_API_KEY") - module level
    const apiKeyGetenvPattern = /API_KEY\s*=\s*os\.getenv\(['"]POLYGON_API_KEY['"](?:,\s*['"][^'"]*['"])?\)/g;
    if (apiKeyGetenvPattern.test(result)) {
      result = result.replace(apiKeyGetenvPattern, `API_KEY = "${POLYGON_API_KEY}"`);
      modified = true;
      console.log('   🔑 Replaced API_KEY = os.getenv with API key');
    }

    // Pattern 4: api_key="YOUR_API_KEY" or similar placeholder
    if (result.includes('YOUR_API_KEY') || result.includes('your_api_key_here') || result.includes('YOUR_KEY')) {
      result = result.replace(/YOUR_API_KEY|your_api_key_here|YOUR_KEY/gi, POLYGON_API_KEY);
      modified = true;
      console.log('   🔑 Replaced placeholder API key with actual key');
    }

    // Pattern 5: Empty quotes for api_key
    if (result.includes('self.api_key = ""') || result.includes('self.api_key = ""')) {
      result = result.replace(/self\.api_key\s*=\s*""/g, `self.api_key = "${POLYGON_API_KEY}"`);
      modified = true;
      console.log('   🔑 Replaced empty api_key string');
    }

    // Pattern 6: API_KEY = "" (module-level)
    if (result.includes('API_KEY = ""')) {
      result = result.replace(/API_KEY\s*=\s*""/g, `API_KEY = "${POLYGON_API_KEY}"`);
      modified = true;
      console.log('   🔑 Replaced empty module-level API_KEY');
    }

    // Pattern 7: Environment variable imports that aren't set
    if (result.includes('import os') && (result.includes('POLYGON_API_KEY') || result.includes('API_KEY'))) {
      // Check if it's trying to use env var but not setting it
      if (!result.includes('os.environ') && !result.includes('os.getenv')) {
        // Code imports os but doesn't use env var - this is fine
      }
    }

    // Pattern 8: params.get("api_key") or similar (from dict-based params)
    if (result.includes('params["api_key"]') || result.includes("params['api_key']")) {
      // This one is tricky - it's accessing params dict, not self.api_key
      // We need to add the api_key to the params dict initialization
      const paramsMatch = result.match(/self\.params\s*=\s*\{([^}]+)\}/);
      if (paramsMatch) {
        const paramsContent = paramsMatch[1];
        // Check if api_key is NOT in params
        if (!paramsContent.includes('api_key') && !paramsContent.includes('API_KEY')) {
          // Add api_key to the beginning of params dict
          result = result.replace(
            /self\.params\s*=\s*\{/,
            `self.params = {\n            "api_key": "${POLYGON_API_KEY}",`
          );
          modified = true;
          console.log('   🔑 Added api_key to self.params dict');
        }
      }
    }

    if (modified) {
      console.log('✅ API key injection complete');
    } else {
      console.log('ℹ️  API key already present or no injection needed');
    }

    return result;
  }

  /**
   * 🔧 AUTO-FIX COMMON STRUCTURAL BUGS
   *
   * Detects and fixes common code generation errors that prevent scanners from running:
   * 1. Missing self.api_key = api_key in __init__
   * 2. Attribute name mismatches (scan_start vs d0_start, etc.)
   * 3. Parameters accepted but never stored as instance variables
   */
  private autoFixStructuralBugs(code: string): string {
    let result = code;
    let fixesApplied = 0;

    console.log('🔧 Running structural bug auto-fix...');

    // FIX 1: Missing self.api_key = api_key in __init__
    // Pattern: __init__ has api_key parameter but doesn't store it
    const initMatch = result.match(/def __init__\(self[^)]*api_key\s*:\s*str[^)]*\):/);
    if (initMatch) {
      // Check if self.api_key is assigned in __init__
      const initBlockMatch = result.match(/def __init__\(self[^)]*api_key[^)]*\):([\s\S]*?)(?=\n    def |\n\nclass |\Z)/);
      if (initBlockMatch) {
        const initBlock = initBlockMatch[1];
        // Check if api_key is used ANYWHERE in the code (not just init block)
        const apiKeyUsedAnywhere = result.includes('self.api_key') ||
                                  result.includes('apiKey = self.api_key') ||
                                  result.includes('"apiKey": self.api_key') ||
                                  result.includes("'apiKey': self.api_key");

        if (!initBlock.includes('self.api_key = api_key') &&
            !initBlock.includes('self.api_key=api_key') &&
            apiKeyUsedAnywhere) {
          // API key is used somewhere but never assigned - add the assignment
          const insertPos = result.indexOf('\n', initMatch.index) + 1;
          const indent = '        '; // Match __init__ indentation

          result = result.slice(0, insertPos) +
                  `${indent}# Store API key\n${indent}self.api_key = api_key\n` +
                  result.slice(insertPos);
          fixesApplied++;
          console.log('   🔧 Added missing: self.api_key = api_key');
        }
      }
    }

    // FIX 2: Attribute name mismatches - common patterns
    const fixes = [
      // scan_start/scan_end -> d0_start/d0_end
      { wrong: 'self.scan_start', right: 'self.d0_start', desc: 'scan_start → d0_start' },
      { wrong: 'self.scan_end', right: 'self.d0_end', desc: 'scan_end → d0_end' },

      // date_range_start/date_range_end -> d0_start/d0_end
      { wrong: 'self.date_range_start', right: 'self.d0_start', desc: 'date_range_start → d0_start' },
      { wrong: 'self.date_range_end', right: 'self.d0_end', desc: 'date_range_end → d0_end' },

      // start_date/end_date -> d0_start/d0_end
      { wrong: 'self.start_date', right: 'self.d0_start', desc: 'start_date → d0_start' },
      { wrong: 'self.end_date', right: 'self.d0_end', desc: 'end_date → d0_end' },
    ];

    fixes.forEach(fix => {
      const regex = new RegExp(fix.wrong.replace(/\./g, '\\.'), 'g');
      const count = (result.match(regex) || []).length;
      if (count > 0) {
        result = result.replace(regex, fix.right);
        fixesApplied++;
        console.log(`   🔧 Fixed ${count}x: ${fix.desc}`);
      }
    });

    // FIX 3: Detect parameters accepted but never stored
    // Pattern: def __init__(self, param1, param2): but no self.param1 = param1
    const paramMatch = result.match(/def __init__\(self,\s*([^)]+)\):/);
    if (paramMatch) {
      const params = paramMatch[1].split(',').map(p => p.trim());
      const initBlockMatch = result.match(/def __init__\(self[^)]*\):([\s\S]*?)(?=\n    def |\n\nclass |\Z)/);

      if (initBlockMatch) {
        const initBlock = initBlockMatch[1];

        params.forEach(param => {
          // Extract parameter name (handle type hints like "api_key: str")
          const paramName = param.split(':')[0].split('=')[0].trim();

          if (paramName && !paramName.startsWith('_')) {
            // Check if it's stored
            const expectedAssignment = `self.${paramName} = ${paramName}`;
            const altAssignment = `self.${paramName}=${paramName}`;

            if (!initBlock.includes(expectedAssignment) &&
                !initBlock.includes(altAssignment) &&
                result.includes(`self.${paramName}`)) {
              // Parameter is used but not stored - add assignment
              const afterInit = (initBlockMatch.index ?? 0) + initBlockMatch[0].length;
              const insertPos = result.indexOf('\n', initBlockMatch.index ?? 0) + 1;
              const indent = '        ';

              result = result.slice(0, insertPos) +
                      `${indent}self.${paramName} = ${paramName}\n` +
                      result.slice(insertPos);
              fixesApplied++;
              console.log(`   🔧 Added missing: self.${paramName} = ${paramName}`);
            }
          }
        });
      }
    }

    if (fixesApplied > 0) {
      console.log(`✅ Applied ${fixesApplied} structural bug fixes`);
    } else {
      console.log('ℹ️  No structural bugs found');
    }

    return result;
  }

  /**
   * Validate basic structure of formatted code - Scanner-type-flexible validation
   */
  private validateBasicStructure(code: string, template: any): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 🎯 CRITICAL VALIDATION 1: Check for markdown code blocks
    const trimmedCode = code.trim();
    if (trimmedCode.startsWith('```')) {
      errors.push('Code starts with markdown code blocks (```python or ```). AI returned markdown instead of pure Python code.');
      console.error('❌ VALIDATION ERROR: Code contains markdown blocks');
      console.error('Code starts with:', trimmedCode.substring(0, 100));
    }
    if (trimmedCode.endsWith('```')) {
      errors.push('Code ends with markdown code blocks (```). AI returned markdown instead of pure Python code.');
    }

    // 🎯 CRITICAL VALIDATION 2: Check for basic Python syntax
    // Code should start with valid Python statements (import, class, def, #, etc.)
    const firstLine = trimmedCode.split('\n')[0].trim();
    const validPythonStarts = [
      'import', 'from', 'class', 'def', '#', '"""',
      "'''", 'try:', 'if', 'for', 'while', 'with'
    ];

    const isValidPythonStart = validPythonStarts.some(start => firstLine.startsWith(start));
    if (!isValidPythonStart) {
      errors.push(`Code doesn't start with valid Python. First line: "${firstLine}"`);
      console.error('❌ VALIDATION ERROR: Invalid Python start:', firstLine);
    }

    // 🎯 CRITICAL VALIDATION 3: Check for common syntax errors
    // Look for obvious patterns that indicate broken code
    const suspiciousPatterns = [
      { pattern: /```python\s*$/, msg: 'Contains opening markdown block' },
      { pattern: /```\s*$/, msg: 'Contains closing markdown block' },
      { pattern: /^\s*```python\s*$/m, msg: 'Has markdown blocks in middle' },
      { pattern: /\n\s*```\s*\n/m, msg: 'Has markdown blocks in middle' },
    ];

    suspiciousPatterns.forEach(({ pattern, msg }) => {
      if (pattern.test(code)) {
        errors.push(`Syntax validation failed: ${msg}`);
        console.error(`❌ VALIDATION ERROR: ${msg}`);
      }
    });

    // Check for core imports (flexible - don't require all 8)
    const coreImports = [
      'import pandas as pd',
      'import numpy as np',
      'import requests'
    ];

    let hasCoreImports = 0;
    coreImports.forEach(importLine => {
      if (code.includes(importLine)) {
        hasCoreImports++;
        console.log(`✓ Found import: "${importLine}"`);
      } else {
        console.log(`✗ Missing import: "${importLine}" in first 200 chars: "${code.substring(0, 200)}"`);
      }
    });

    console.log(`🔍 Import check result: ${hasCoreImports}/${coreImports.length} found`);
    console.log(`🔍 Code starts with: "${code.substring(0, 100)}"`);

    if (hasCoreImports < 2) {
      errors.push(`Missing core imports (pandas, numpy, requests)`);
    }

    // Check for ANY valid scanner class (type-specific)
    const classMatch = code.match(/class\s+(\w+Scanner)\s*:/);
    if (!classMatch) {
      errors.push('Missing valid scanner class (should be type-specific, e.g., D1GapScanner, BacksideBScanner)');
    } else {
      const className = classMatch[1];
      // Warn if using deprecated "Universal" naming
      if (className === 'UniversalTradingScanner') {
        warnings.push('Using deprecated "UniversalTradingScanner" - should use type-specific naming');
      }
    }

    // Check for minimum viable methods (flexible - not template-based)
    const methodMatches = code.match(/def\s+\w+\(/g) || [];
    const methodCount = methodMatches.length;

    // Require at least 5 methods for basic functionality
    if (methodCount < 5) {
      errors.push(`Insufficient methods: ${methodCount} found, minimum 5 required`);
    }

    // Check for key method patterns (flexible approach)
    const hasInit = code.includes('def __init__');
    const hasMainExecution = code.match(/def\s+(run_|main|execute|scan)/);

    if (!hasInit) {
      warnings.push('Missing __init__ method');
    }
    if (!hasMainExecution) {
      warnings.push('Missing main execution method (run_, main, execute, or scan)');
    }

    // Check line count (flexible range for different scanner types)
    const lineCount = code.split('\n').length;
    if (lineCount < 300) {
      warnings.push(`Line count is quite low (${lineCount}) - may be missing functionality`);
    }
    if (lineCount > 1200) {
      warnings.push(`Line count is very high (${lineCount}) - may be unnecessarily complex`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Extract scanner name from code content by analyzing:
   * - Function names (def scan_xxx, def xxx_scanner)
   * - Class names (class XxxScanner)
   * - Docstrings and comments
   * - File naming patterns
   */
  private extractScannerNameFromCode(code: string, filename: string): string {
    const filenameLower = (filename || '').toLowerCase();

    // Priority 1: Extract from function names in the code
    const functionPatterns = [
      /def\s+(scan_[a-zA-Z0-9_]+)\s*\(/gi,
      /def\s+([a-zA-Z0-9_]+_scan)\s*\(/gi,
      /def\s+([a-zA-Z0-9_]+_scanner)\s*\(/gi,
      /def\s+(scan_[a-zA-Z0-9_]+_signals)\s*\(/gi,
      /def\s+([a-zA-Z0-9_]+_gap)\s*\(/gi,
      /def\s+(get_[a-zA-Z0-9_]+)\s*\(/gi,
    ];

    for (const pattern of functionPatterns) {
      const matches = code.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          const funcName = match[1];
          // Convert function name to readable scanner name
          const readableName = funcName
            .replace(/^(scan_|_scan|_scanner|scanner_|get_)/g, '')
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .trim()
            .replace(/\s+/g, ' ');
          if (readableName.length > 2) {
            return this.toTitleCase(readableName);
          }
        }
      }
    }

    // Priority 2: Extract from class names
    const classMatch = code.match(/class\s+([A-Z][a-zA-Z0-9_]*Scanner)\s*:/i);
    if (classMatch && classMatch[1]) {
      const className = classMatch[1];
      const readableName = className
        .replace(/Scanner$/i, '')
        .replace(/([A-Z])/g, ' $1')
        .trim();
      if (readableName.length > 2) {
        return this.toTitleCase(readableName) + ' Scanner';
      }
    }

    // Priority 3: Extract from docstrings/comments
    const docstringPatterns = [
      /"""[^\"]*?([Dd]1\s*[Gg]ap[^\"]*?)"""/i,
      /"""[^\"]*?([Ss]mall\s*[Cc]ap\s*[Gg]ap[^\"]*?)"""/i,
      /"""[^\"]*?([Bb]ackside[^\"]*?)"""/i,
      /"""[^\"]*?([Ll][Cc]\s*[Dd]2[^\"]*?)"""/i,
      /"""[^\"]*?([Aa]\+\s*[Pp]ara[^\"]*?)"""/i,
      /#.*?([Dd]1\s*[Gg]ap)/i,
      /#.*?([Ss]mall\s*[Cc]ap\s*[Gg]ap])/i,
      /#.*?([Bb]ackside)/i,
    ];

    for (const pattern of docstringPatterns) {
      const match = code.match(pattern);
      if (match && match[1]) {
        return this.toTitleCase(match[1].trim());
      }
    }

    // Priority 4: Use filename with smart parsing
    if (filename) {
      const basename = filename.replace(/\.py$/, '').replace(/[^a-zA-Z0-9\s]/g, ' ').trim();

      // Parse filename components intelligently
      const filenameName = this.toTitleCase(basename.replace(/\s+/g, ' '));
      if (filenameName.length > 2) {
        return filenameName;
      }
    }

    return 'Custom Scanner';
  }

  /**
   * Convert string to title case
   */
  private toTitleCase(str: string): string {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => {
        // Keep certain abbreviations uppercase
        if (['d1', 'lc', 'a+'].includes(word.toLowerCase())) {
          return word.toUpperCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ')
      .trim();
  }

  /**
   * Add anti-markdown instructions to prompt
   * Called when AI returns code with markdown blocks
   */
  private addAntiMarkdownInstructions(originalPrompt: string): string {
    const antiMarkdownWarning = `

╔═══════════════════════════════════════════════════════════════════════════════╗
║                    ⚠️ CRITICAL: OUTPUT FORMAT ERROR                           ║
╚═══════════════════════════════════════════════════════════════════════════════╝

YOUR PREVIOUS RESPONSE CONTAINED MARKDOWN CODE BLOCKS WHICH CAUSED SYNTAX ERRORS.

🚨 ABSOLUTE REQUIREMENTS:
1. DO NOT wrap code in \`\`\`python or \`\`\` markdown blocks
2. Output MUST start with: import pandas as pd
3. Output MUST end with the last line of Python code (no \`\`\`)
4. Output ONLY pure Python executable code
5. NO explanations, NO markdown formatting, NO code blocks

✅ CORRECT FORMAT:
import pandas as pd
import numpy as np
# ... rest of code ...
scanner = BacksideBScanner(api_key=API_KEY)
signals = scanner.execute()
print(signals)

❌ WRONG FORMAT (DO NOT DO THIS):
\`\`\`python
import pandas as pd
...
\`\`\`

RETRY: Generate the complete scanner code WITHOUT markdown blocks.
`;

    return originalPrompt + antiMarkdownWarning;
  }

  /**
   * Apply automatic fixes to common code issues
   * This is the SELF-CHECKING system that catches and fixes errors before returning code
   */
  private applyAutoFixes(code: string): string {
    let fixedCode = code;
    let fixesApplied: string[] = [];

    // Fix 1: Replace .reset_index(0, drop=True) with .transform()
    const resetIndexPattern = /\.groupby\(['"](\w+)['"]\)\[['"](\w+)['"]\]\.rolling\([^)]+\)\.mean\(\)\.reset_index\(0,\s*drop=True\)/g;
    if (resetIndexPattern.test(fixedCode)) {
      fixedCode = fixedCode.replace(resetIndexPattern, (match, groupCol, valueCol) => {
        const newCode = `.groupby(df['${groupCol}']).transform(lambda x: x.rolling(window=20, min_periods=1).mean())`;
        fixesApplied.push(`Fixed .reset_index() error for ${groupCol}.${valueCol}`);
        return newCode;
      });
      console.log(`🔧 Fixed ${fixesApplied.length} .reset_index() errors`);
    }

    // Fix 2: Replace Polygon column names ('T', 'c', 'v', 'o', 'h', 'l') with readable names
    const columnReplacements = [
      { pattern: /groupby\('T'\)/g, fix: "groupby('ticker')", desc: "T → ticker" },
      { pattern: /groupby\("T"\)/g, fix: 'groupby("ticker")', desc: 'T → ticker' },
      { pattern: /\[['c']\]/g, fix: "['close']", desc: 'c → close' },
      { pattern: /\[['v']\]/g, fix: "['volume']", desc: 'v → volume' },
      { pattern: /\[['o']\]/g, fix: "['open']", desc: 'o → open' },
      { pattern: /\[['h']\]/g, fix: "['high']", desc: 'h → high' },
      { pattern: /\[['l']\]/g, fix: "['low']", desc: 'l → low' },
      { pattern: /df\['c'\]/g, fix: "df['close']", desc: "df['c'] → df['close']" },
      { pattern: /df\['v'\]/g, fix: "df['volume']", desc: "df['v'] → df['volume']" },
      { pattern: /df\['T'\]/g, fix: "df['ticker']", desc: "df['T'] → df['ticker']" },
    ];

    columnReplacements.forEach(({ pattern, fix, desc }) => {
      const before = fixedCode;
      fixedCode = fixedCode.replace(pattern, fix);
      if (before !== fixedCode) {
        fixesApplied.push(desc);
      }
    });

    if (fixesApplied.length > 0) {
      console.log(`🔧 Fixed ${fixesApplied.length} column naming issues:`, fixesApplied);
    }

    // Fix 3: Ensure proper import statement for pandas_market_calendars
    if (fixedCode.includes('mcal.get_calendar') && !fixedCode.includes('import pandas_market_calendars')) {
      fixedCode = fixedCode.replace(
        'import pandas as pd',
        'import pandas as pd\nimport pandas_market_calendars as mcal'
      );
      fixesApplied.push('Added pandas_market_calendars import');
      console.log('🔧 Added missing pandas_market_calendars import');
    }

    // Fix 4: Check for common syntax errors in groupby operations
    const badGroupByPattern = /df\.groupby\(['"]T['"]\)\[['"\w]+['"]\]\.rolling/g;
    if (badGroupByPattern.test(fixedCode)) {
      console.warn('⚠️ Found unsafe groupby with Polygon column names - attempting fix...');
      // Try to add column renaming if not present
      if (!fixedCode.includes("rename(columns={'T':")) {
        const insertPoint = fixedCode.indexOf('df = pd.DataFrame(data[\'results\'])');
        if (insertPoint !== -1) {
          const renameCode = `df = df.rename(columns={
                'T': 'ticker',
                'o': 'open',
                'h': 'high',
                'l': 'low',
                'c': 'close',
                'v': 'volume',
                'vw': 'vwap',
                't': 'timestamp'
            })`;
          fixedCode = fixedCode.substring(0, insertPoint) +
            fixedCode.substring(insertPoint).replace('df = pd.DataFrame(data[\'results\'])',
              'df = pd.DataFrame(data[\'results\'])\n            ' + renameCode);
          fixesApplied.push('Added column renaming to prevent groupby errors');
          console.log('🔧 Added column renaming to fix groupby operations');
        }
      }
    }

    // Fix 5: Fix groupby().transform() with axis parameter in lambda
    // This causes KeyError because transform lambda receives Series not DataFrame
    const groupbyTransformAxisPattern = /df\[['"]?TR['"]?\] = df\.groupby\(['"]\w+['"]\)\[\[['"][\w_]+['"], ['"][\w_]+['"], ['"][\w_]+['"]\]\]\.transform\(\s*lambda x: x\.max\(axis=1\)\s*\)/g;
    if (groupbyTransformAxisPattern.test(fixedCode)) {
      fixedCode = fixedCode.replace(groupbyTransformAxisPattern, (match) => {
        // Extract the column names from the pattern
        const columnMatch = match.match(/\[\[(['"][\w_]+['"], ['"][\w_]+['"], ['"][\w_]+['"])\]\]/);
        if (columnMatch) {
          const columns = columnMatch[1].replace(/'/g, '').replace(/"/g, '').split(', ').map(c => `'${c}'`).join(', ');
          const newCode = `df['TR'] = df[[${columns}]].max(axis=1)`;
          fixesApplied.push('Fixed groupby().transform() with axis parameter → direct .max()');
          console.log('🔧 Fixed groupby transform axis error');
          return newCode;
        }
        return match;
      });
    }

    // Fix 6: Remove any remaining markdown blocks
    if (fixedCode.includes('```python')) {
      fixedCode = fixedCode.replace(/```python\n?/g, '');
      fixesApplied.push('Removed markdown code blocks');
      console.log('🔧 Stripped markdown code blocks');
    }
    if (fixedCode.endsWith('```\n')) {
      fixedCode = fixedCode.slice(0, -4);
      fixesApplied.push('Removed trailing markdown blocks');
      console.log('🔧 Removed trailing ```');
    }

    // Log summary
    if (fixesApplied.length > 0) {
      console.log(`✅ Total auto-fixes applied: ${fixesApplied.length}`);
    }

    return fixedCode;
  }

  /**
   * Get active formatting sessions
   */
  getActiveSessions(): FormattingSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): FormattingSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Cancel active session
   */
  cancelSession(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (session && session.status === 'processing') {
      session.status = 'failed';
      session.error = 'Session cancelled by user';
      return true;
    }
    return false;
  }

  /**
   * Get formatting statistics
   */
  getStatistics(): {
    totalSessions: number;
    activeSessions: number;
    successRate: number;
    averageProcessingTime: number;
  } {
    const sessions = Array.from(this.activeSessions.values());
    const completedSessions = sessions.filter(s => s.status === 'completed');
    const successCount = completedSessions.filter(s => s.result?.success).length;

    const averageProcessingTime = completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + (s.result?.metrics?.processingTime || 0), 0) / completedSessions.length
      : 0;

    return {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.status === 'processing').length,
      successRate: completedSessions.length > 0 ? successCount / completedSessions.length : 0,
      averageProcessingTime
    };
  }
}

// ===== EXPORT MAIN INTERFACE =====

export const formattingService = EnhancedFormattingService.getInstance();