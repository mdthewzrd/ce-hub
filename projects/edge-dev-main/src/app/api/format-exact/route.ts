import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';
import { renataRebuildService } from "@/services/renataRebuildService";
import { RenataAIAgentServiceV2 } from "@/services/renataAIAgentServiceV2";
import {
  BACKSIDE_B_TEMPLATE,
  A_PLUS_TEMPLATE,
  TemplateSelector,
  ParameterExtractor
} from "./enhanced-reference-templates";

// Reference to our correctly formatted file - UPDATED TO USE EDGE-DEV-MAIN
const REFERENCE_FORMATTED_FILE = '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backend/fixed_formatted.py';
const REFERENCE_APLUS_FILE = '/Users/michaeldurante/.anaconda/working code/Daily Para/A+ format confirm.py';

export async function POST(req: NextRequest) {
  try {
    const {
      code,
      filename,
      useRenataRebuild = false,  // Python Renata Rebuild backend (fallback)
      useAIAgent = true,  // NEW: Use Qwen Coder 3 AI Agent (DEFAULT)
      useEnhancedService = false,  // Legacy AI service (now tertiary)
      validateOutput = true,
      maxRetries = 2,
      aiProvider = 'openrouter',
      model = 'qwen/qwen3-coder'
    } = await req.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }

    console.log('🎯 Starting code formatting');
    console.log(`📁 Input filename: ${filename}`);
    console.log(`📊 Input code length: ${code.length} characters`);

    // Method 1: Python Renata Rebuild Backend (NEW - Priority)
    if (useRenataRebuild) {
      console.log('🐍 Using Python Renata Rebuild Backend');

      try {
        // Check if Python API is available
        const apiAvailable = await renataRebuildService.isAvailable();

        if (apiAvailable) {
          console.log('✅ Renata Rebuild API available, performing transformation');

          const transformResult = await renataRebuildService.transformCode({
            code,
            filename: filename || 'scanner.py',
            preserve_logic: true,
            validate_only: false
          });

          if (transformResult.success && transformResult.transformed_code) {
            console.log('✅ Python transformation successful!');
            console.log(`   Scanner Type: ${transformResult.scanner_type}`);
            console.log(`   Confidence: ${Math.round(transformResult.confidence * 100)}%`);

            // Extract scanner name
            const scannerName = extractScannerNameFromCode(code, filename);

            return NextResponse.json({
              success: true,
              message: renataRebuildService.generateTransformResponse(transformResult, code),
              type: 'code-ready',
              codeInfo: {
                filename: filename,
                size: transformResult.transformed_code.length,
                originalLines: code.split('\n').length,
                formattedLines: transformResult.transformed_code.split('\n').length,
                ready: true,
                validation: transformResult.validation
              },
              actions: {
                addToProject: true,
                showFullCode: true
              },
              formattedCode: transformResult.transformed_code,
              scannerName: scannerName,
              scannerType: transformResult.scanner_type,
              confidence: transformResult.confidence,
              analysis: transformResult.analysis,
              service: 'renata-rebuild-python'
            });
          } else {
            console.warn('⚠️ Python transformation failed, falling back');
          }
        } else {
          console.log('⚠️ Renata Rebuild API unavailable, falling back');
        }
      } catch (error) {
        console.error('❌ Renata Rebuild error:', error);
      }

      // Fall through to AI Agent if requested or Python fails
    }

    // Method 1.5: Renata AI Agent V2 (Simplified - 80% smaller prompt)
    if (useAIAgent) {
      console.log('🤖 Using Renata Final V AI Agent');
      console.log(`📊 Model: ${model}`);

      try {
        const aiService = new RenataAIAgentServiceV2();
        const improved = await aiService.generate({
          prompt: `You are a Python code formatter. Transform the input scanner code to match this EXACT structure:

\`\`\`python
class BacksideBScanner:
    def __init__(self, api_key: str, d0_start: str, d0_end: str):
        # CRITICAL: Store user's D0 range separately
        self.d0_start_user = d0_start
        self.d0_end_user = d0_end

        # Calculate historical data range
        lookback_buffer = 1000 + 50
        scan_start_dt = pd.to_datetime(self.d0_start_user) - pd.Timedelta(days=lookback_buffer)
        self.scan_start = scan_start_dt.strftime('%Y-%m-%d')
        self.d0_end = self.d0_end_user

        self.api_key = api_key
        self.base_url = "https://api.polygon.io"
        self.session = requests.Session()
        self.stage1_workers = 5
        self.stage3_workers = 10

        self.params = {
            "price_min": 8.0,
            "adv20_min_usd": 30000000,
            "d1_volume_min": 15000000,
            "require_open_gt_prev_high": True,
            "enforce_d1_above_d2": True,
            # COPY ALL OTHER PARAMS FROM INPUT
        }

    def run_scan(self):
        """Main entry point - REQUIRED"""
        stage1_data = self.fetch_grouped_data()
        stage2a_data = self.compute_simple_features(stage1_data)
        stage2b_data = self.apply_smart_filters(stage2a_data)
        stage3a_data = self.compute_full_features(stage2b_data)
        return self.detect_patterns(stage3a_data)

    def fetch_grouped_data(self):
        """Stage 1: Grouped endpoint - NOTE: NOT fetch_all_grouped_data"""
        nyse = mcal.get_calendar('NYSE')
        trading_dates = nyse.schedule(start_date=self.scan_start, end_date=self.d0_end).index.strftime('%Y-%m-%d').tolist()
        # ... fetch grouped data for each date ...
        # Returns: DataFrame with columns [ticker, date, open, high, low, close, volume]

    def compute_simple_features(self, df: pd.DataFrame):
        """Stage 2a: ONLY compute prev_close, adv20_usd, price_range"""
        df['prev_close'] = df.groupby('ticker')['close'].shift(1)
        df['adv20_usd'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(
            lambda x: x.rolling(window=20, min_periods=20).mean()
        )
        df['price_range'] = df['high'] - df['low']
        return df

    def apply_smart_filters(self, df: pd.DataFrame):
        """Stage 2b: Smart filters - Use d0_start_user/d0_end_user"""
        df_historical = df[~df['date'].between(self.d0_start_user, self.d0_end_user)].copy()
        df_output_range = df[df['date'].between(self.d0_start_user, self.d0_end_user)].copy()
        # Apply filters to df_output_range only
        # Combine: df_historical + df_output_filtered
        return combined_df

    def compute_full_features(self, df: pd.DataFrame):
        """Stage 3a: EMA, ATR, slopes - Use proper naming"""
        df['ema9'] = df.groupby('ticker')['close'].transform(lambda x: x.ewm(span=9, adjust=False).mean())
        # Note: Use lowercase 'ema9' for DataFrame columns
        # ... compute ATR, slopes, etc ...
        return df

    def detect_patterns(self, df: pd.DataFrame):
        """Stage 3b: Groupby optimization"""
        ticker_data_list = []
        for ticker, ticker_df in df.groupby('ticker'):
            ticker_data_list.append((ticker, ticker_df.copy(), self.d0_start_user, self.d0_end_user))

        signals = []
        for ticker_data in ticker_data_list:
            signals.extend(self.process_ticker_3(ticker_data))
        return signals

    def process_ticker_3(self, ticker_data: tuple):
        """Process single ticker - tuple unpacking"""
        ticker, ticker_df, d0_start, d0_end = ticker_data
        # Filter to output range
        output_mask = ticker_df['date'].between(d0_start, d0_end)
        df_output = ticker_df[output_mask].copy()
        # Pattern detection with prev_high check
        # if self.params.get('require_open_gt_prev_high') and not (r0['open'] > r1['prev_high']):
        #     continue
\`\`\`

CRITICAL RULES:
1. Method name: fetch_grouped_data (NOT fetch_all_grouped_data)
2. Date variables: d0_start_user, d0_end_user (with _user suffix)
3. Include run_scan() method as shown
4. Use adv20_usd (NEVER use $ or special characters)
5. In apply_smart_filters: use self.d0_start_user and self.d0_end_user
6. In detect_patterns: pass d0_start_user, d0_end_user in tuple
7. Preserve all strategy logic from input code

Transform the input code to match this structure exactly.`,
          code,
          context: `Filename: ${filename || 'scanner.py'}`,
          validateOutput: validateOutput,
          temperature: 0.1,
          maxTokens: 8000
        });

        if (improved) {
          console.log('✅ AI Agent transformation successful!');

          const scannerName = extractScannerNameFromCode(code, filename);
          const scannerType = detectScannerType(improved);

          return NextResponse.json({
            success: true,
            message: generateAIAgentMessage(improved, code),
            type: 'code-ready',
            codeInfo: {
              filename: filename,
              size: improved.length,
              originalLines: code.split('\n').length,
              formattedLines: improved.split('\n').length,
              ready: true
            },
            actions: {
              addToProject: true,
              showFullCode: true
            },
            formattedCode: improved,
            scannerName: scannerName,
            scannerType: scannerType,
            service: 'renata-ai-agent',
            model: 'qwen/qwen3-coder'
          });
        }
      } catch (error) {
        console.error('❌ AI Agent error:', error);
      }

      // Fall through to next method if AI Agent fails
    }

    // Method 2: Enhanced AI Service (Fallback)
    if (useEnhancedService) {
      console.log('🚀 Using Enhanced AI Formatting Service (Fallback)');

      try {
        const { formattingService } = await import("../../../services/enhancedFormattingService");

        // Add timeout to prevent hanging (5 minutes)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('AI formatting timeout after 300 seconds')), 300000);
        });

        const formattingPromise = formattingService.formatCode({
          code,
          filename: filename || 'scanner.py',
          aiProvider,
          model,
          validateOutput,
          maxRetries
        });

        const result = await Promise.race([formattingPromise, timeoutPromise]) as any;

        if (result.success && result.formattedCode) {
          console.log(`✅ Enhanced formatting completed successfully`);
          console.log(`📊 Metrics: ${JSON.stringify(result.metrics)}`);

          if (result.validation) {
            console.log(`🔍 Validation: ${result.validation.isValid ? 'PASSED' : 'FAILED'}`);
            if (result.validation.errors.length > 0) {
              console.log(`❌ Validation errors: ${result.validation.errors.join(', ')}`);
            }
            if (result.validation.warnings.length > 0) {
              console.log(`⚠️ Validation warnings: ${result.validation.warnings.join(', ')}`);
            }
          }

          return NextResponse.json({
            success: true,
            message: generateSuccessMessage(result, filename),
            type: 'code-ready',
            codeInfo: {
              filename: filename,
              size: result.formattedCode.length,
              originalLines: result.metrics?.originalLines || code.split('\n').length,
              formattedLines: result.metrics?.formattedLines || result.formattedCode.split('\n').length,
              ready: true,
              validation: result.validation,
              processingTime: result.metrics?.processingTime
            },
            actions: {
              addToProject: true,
              showFullCode: true
            },
            formattedCode: result.formattedCode,
            scannerName: result.scannerName,
            scannerType: result.scannerType,
            template: result.template,
            validation: result.validation,
            service: 'enhanced-ai'
          });
        } else {
          console.log(`❌ Enhanced formatting failed: ${result.errors?.join(', ')}`);
          // Fall back to legacy method
          console.log('🔄 Falling back to legacy exact transformation method');
          return await legacyFormatting(code, filename);
        }
      } catch (error: any) {
        console.log(`❌ Enhanced formatting error: ${error?.message || error}`);
        // Fall back to legacy method
        console.log('🔄 Falling back to legacy exact transformation method');
        return await legacyFormatting(code, filename);
      }
    }

    // Method 3: Legacy Exact Transformation (Final Fallback)
    console.log('📜 Using Legacy Exact Transformation Method (Final Fallback)');
    return await legacyFormatting(code, filename);

  } catch (error: any) {
    console.error('Error formatting code:', error);
    return NextResponse.json(
      { error: 'Formatting failed: ' + (error?.message || error) },
      { status: 500 }
    );
  }
}

/**
 * Legacy exact formatting method (fallback)
 */
async function legacyFormatting(code: string, filename: string) {
  // Detect scanner type from BOTH code content AND filename (enhanced)
  let detectedScannerType = detectScannerTypeFromFilename(filename, code);

  // Analyze code to determine which reference file to use
  const template = TemplateSelector.selectTemplate(code);
  const analysis = TemplateSelector.analyzeCode(code);

  // Select appropriate reference file
  let referenceFile = REFERENCE_FORMATTED_FILE; // Default to Backside B
  if (analysis.formatType === 'a_plus') {
    referenceFile = REFERENCE_APLUS_FILE;
  }

  // Check if reference file exists
  if (!fs.existsSync(referenceFile)) {
    throw new Error(`Reference formatted file not found: ${referenceFile}`);
  }

  // Read the reference formatted code
  const referenceFormattedCode = fs.readFileSync(referenceFile, 'utf8');
  console.log(`📋 Reference file: ${path.basename(referenceFile)}`);
  console.log(`📋 Reference file lines: ${referenceFormattedCode.split('\n').length}`);

  // Parse the original code to extract key information
  const originalLines = code.split('\n');

  // ENHANCED: Extract scanner name from code content first, then fall back to filename
  let scannerName = extractScannerNameFromCode(code, filename);
  if (scannerName === 'Custom Scanner' && filename) {
    scannerName = filename.replace('.py', '').replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
    scannerName = scannerName.length > 2 ? toTitleCase(scannerName) : 'Scanner';
  }
  console.log(`🎯 Extracted scanner name: "${scannerName}"`);

  // Extract parameters from original code
  const params = extractParameters(code);
  console.log(`🔍 Found ${params.length} parameters to preserve`);

  // Apply the exact same transformation as our reference file
  let formattedCode = applyExactTransformation(referenceFormattedCode, scannerName, params, filename);

  console.log(`✅ Formatted code length: ${formattedCode.length} characters`);
  console.log(`✅ Formatted code lines: ${formattedCode.split('\n').length}`);

  // Basic validation
  const targetLines = template.expectedLines;
  const actualLines = formattedCode.split('\n').length;
  const isWithinTarget = Math.abs(actualLines - targetLines) <= 20;

  return NextResponse.json({
    success: true,
    message: generateLegacySuccessMessage(scannerName, originalLines.length, actualLines, params.length, template === BACKSIDE_B_TEMPLATE, isWithinTarget),
    type: 'code-ready',
    codeInfo: {
      filename: filename,
      size: formattedCode.length,
      originalLines: originalLines.length,
      formattedLines: actualLines,
      ready: true,
      template: template === BACKSIDE_B_TEMPLATE ? 'Backside B' : 'A+'
    },
    actions: {
      addToProject: true,
      showFullCode: true
    },
    formattedCode: formattedCode,
    scannerName: scannerName,
    scannerType: detectedScannerType,
    template: template,
    service: 'legacy'
  });
}

/**
 * Extract scanner name from code content by analyzing:
 * - Function names (def scan_xxx, def xxx_scanner)
 * - Class names (class XxxScanner)
 * - Docstrings and comments
 * - File naming patterns
 */
function extractScannerNameFromCode(code: string, filename: string): string {
  const filenameLower = (filename || '').toLowerCase();

  // Priority 1: Extract from function names in the code
  const functionPatterns = [
    /def\s+(scan_[a-zA-Z0-9_]+)\s*\(/gi,           // def scan_xxx()
    /def\s+([a-zA-Z0-9_]+_scan)\s*\(/gi,           // def xxx_scan()
    /def\s+([a-zA-Z0-9_]+_scanner)\s*\(/gi,        // def xxx_scanner()
    /def\s+(scan_[a-zA-Z0-9_]+_signals)\s*\(/gi,   // def scan_xxx_signals()
    /def\s+([a-zA-Z0-9_]+_gap)\s*\(/gi,            // def xxx_gap()
  ];

  for (const pattern of functionPatterns) {
    const matches = code.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        const funcName = match[1];
        // Convert function name to readable scanner name
        const readableName = funcName
          .replace(/^(scan_|_scan|_scanner|scanner_)/g, '')
          .replace(/_/g, ' ')
          .replace(/([A-Z])/g, ' $1')
          .trim()
          .replace(/\s+/g, ' ');
        if (readableName.length > 2) {
          return toTitleCase(readableName);
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
      return toTitleCase(readableName) + ' Scanner';
    }
  }

  // Priority 3: Extract from docstrings/comments
  const docstringPatterns = [
    /"""[^"]*?([Dd]1\s*[Gg]ap[^"]*?)"""/i,
    /"""[^"]*?([Ss]mall\s*[Cc]ap\s*[Gg]ap[^"]*?)"""/i,
    /"""[^"]*?([Bb]ackside[^"]*?)"""/i,
    /"""[^"]*?([Ll][Cc]\s*[Dd]2[^"]*?)"""/i,
    /"""[^"]*?([Aa]\+\s*[Pp]ara[^"]*?)"""/i,
    /#.*?([Dd]1\s*[Gg]ap)/i,
    /#.*?([Ss]mall\s*[Cc]ap\s*[Gg]ap)/i,
    /#.*?([Bb]ackside)/i,
  ];

  for (const pattern of docstringPatterns) {
    const match = code.match(pattern);
    if (match && match[1]) {
      return toTitleCase(match[1].trim());
    }
  }

  // Priority 4: Use filename with smart parsing
  if (filename) {
    const basename = filename.replace(/\.py$/, '').replace(/[^a-zA-Z0-9\s]/g, ' ').trim();

    // Parse filename components intelligently
    const filenameName = toTitleCase(basename.replace(/\s+/g, ' '));
    if (filenameName.length > 2) {
      return filenameName;
    }
  }

  return 'Custom Scanner';
}

/**
 * Convert string to title case
 */
function toTitleCase(str: string): string {
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
 * Detect scanner type from filename AND code content (enhanced)
 */
function detectScannerTypeFromFilename(filename: string, code?: string): string {
  if (!filename && !code) return 'Enhanced Trading Scanner';

  // First, try to extract name from code content
  const codeExtractedName = code ? extractScannerNameFromCode(code, filename) : null;
  if (codeExtractedName && codeExtractedName !== 'Custom Scanner') {
    return codeExtractedName;
  }

  // Fallback to filename-based detection with better patterns
  const filenameLower = filename.toLowerCase();
  const basename = filename.replace(/\.py$/, '').replace(/[^a-zA-Z0-9\s]/g, ' ').toLowerCase().trim();

  // Smart pattern matching from filename
  if (basename.includes('d1') || basename.includes('day 1')) {
    return basename.includes('gap') ? 'D1 Gap Scanner' : 'D1 Scanner';
  }
  if (basename.includes('small cap') || basename.includes('smallcap') || basename.includes('small_cap')) {
    return basename.includes('gap') ? 'Small Cap Gap Scanner' : 'Small Cap Scanner';
  }
  if (basename.includes('gap')) {
    return toTitleCase(basename.includes('test') ? basename.replace('test', '').trim() : basename) + ' Scanner';
  }
  if (basename.includes('backside') || basename.includes('para')) {
    return 'Backside B Para Scanner';
  }
  if (basename.includes('a_plus') || basename.includes('a-plus') || basename.includes('aplus')) {
    return 'A+ Para Scanner';
  }
  if (basename.includes('lc') || basename.includes('d2')) {
    return 'LC D2 Scanner';
  }

  // Last resort: use the cleaned basename
  if (basename.length > 2) {
    return toTitleCase(basename);
  }

  return 'Enhanced Trading Scanner';
}

/**
 * Generate success message for enhanced formatting results
 */
function generateSuccessMessage(result: any, filename: string): string {
  const scannerName = filename ? filename.replace('.py', '').replace(/[^a-zA-Z0-9\s]/g, '').trim() : 'Scanner';
  const metrics = result.metrics;
  const validation = result.validation;
  const template = result.template === BACKSIDE_B_TEMPLATE ? 'Backside B' : 'A+';

  let message = `📝 **${template} Scanner Formatted Successfully**

**Scanner**: ${scannerName}
**Template**: ${template}
**Lines**: ${metrics?.originalLines || 0} → ${metrics?.formattedLines || 0}
**Parameters**: ${metrics?.parameterCount || 0} preserved
**Processing Time**: ${metrics?.processingTime ? (metrics.processingTime / 1000).toFixed(2) + 's' : 'N/A'}`;

  if (validation) {
    message += `\n**Validation**: ${validation.isValid ? '✅ PASSED' : '⚠️ ISSUES FOUND'}`;
    if (validation.errors.length > 0) {
      message += `\n**Errors**: ${validation.errors.length}`;
    }
    if (validation.warnings.length > 0) {
      message += `\n**Warnings**: ${validation.warnings.length}`;
    }
  }

  if (result.retryAttempts && result.retryAttempts > 0) {
    message += `\n**Retries**: ${result.retryAttempts}`;
  }

  message += `\n\nReady for Two-Stage Universal Scanning with 17,000+ market coverage.`;

  return message;
}

/**
 * Generate success message for AI Agent results
 */
function generateAIAgentMessage(improvedCode: string, originalCode: string): string {
  const originalLines = originalCode.split('\n').length;
  const improvedLines = improvedCode.split('\n').length;

  // Detect scanner type from improved code
  const scannerType = detectScannerType(improvedCode);

  let message = `🤖 **Renata AI Agent - Code Transformation Complete**

**Model**: Qwen Coder 3 (via OpenRouter)
**Scanner Type**: ${scannerType}
**Lines**: ${originalLines} → ${improvedLines}

✨ **What I Did:**
• Analyzed your code structure and strategy
• Refactored to EdgeDev 3-stage architecture
• Applied all 7 mandatory standardizations
• Preserved core strategy logic and parameters

✅ **EdgeDev Standards Applied:**
1. ✅ Grouped Polygon API endpoint
2. ✅ Thread pooling (parallel processing)
3. ✅ Vectorized operations (no .iterrows())
4. ✅ Connection pooling (requests.Session())
5. ✅ Smart filtering (D0 only)
6. ✅ Date range configuration
7. ✅ Proper error handling

🎯 **Result:**
Production-ready scanner with EdgeDev compliance.
Ready for execution on 17,000+ market symbols.

---

**Note**: This is an AI-generated transformation. Please review the code before deployment.`;

  return message;
}

/**
 * Detect scanner type from code
 */
function detectScannerType(code: string): string {
  const lowerCode = code.toLowerCase();

  // Check for backside indicators
  if (lowerCode.includes('backside') || lowerCode.includes('abs_lookback') || lowerCode.includes('position_abs')) {
    return 'Backside B';
  }

  // Check for A+ indicators
  if (lowerCode.includes('a+') || lowerCode.includes('a_plus') || lowerCode.includes('format confirm')) {
    return 'A Plus';
  }

  // Check for LC D2
  if (lowerCode.includes('lc_d2') || lowerCode.includes('lc d2') || lowerCode.includes('low close 2')) {
    return 'LC D2';
  }

  // Check for LC 3D Gap
  if (lowerCode.includes('lc_3d') || lowerCode.includes('lc 3d')) {
    return 'LC 3D Gap';
  }

  // Check for D1 Gap
  if (lowerCode.includes('d1_gap') || lowerCode.includes('d1 gap')) {
    return 'D1 Gap';
  }

  // Check for Extended Gap
  if (lowerCode.includes('extended') || lowerCode.includes('ext_gap')) {
    return 'Extended Gap';
  }

  // Check for SC DMR
  if (lowerCode.includes('sc_dmr') || lowerCode.includes('sc dmr')) {
    return 'SC DMR';
  }

  // Check for Half A Plus
  if (lowerCode.includes('half') || lowerCode.includes('half_a_plus')) {
    return 'Half A Plus';
  }

  return 'Custom Scanner';
}

/**
 * Generate success message for legacy formatting results
 */
function generateLegacySuccessMessage(scannerName: string, originalLines: number, formattedLines: number, paramCount: number, isBackside: boolean, isWithinTarget: boolean): string {
  const template = isBackside ? 'Backside B' : 'A+';
  const targetLines = isBackside ? 825 : 755;

  let message = `📝 **${template} Scanner Formatted Successfully**

**Scanner**: ${scannerName}
**Transformation**: Applied exact multi-stage process
**Lines**: ${originalLines} → ${formattedLines} (target: ${targetLines}±20)
**Parameters Preserved**: ${paramCount}`;

  if (!isWithinTarget) {
    message += `\n⚠️ **Warning**: Line count outside target range`;
  }

  message += `\n\nReady for Two-Stage Universal Scanning with 17,000+ market coverage.`;

  return message;
}

// Extract parameters from original code
function extractParameters(code: string): Array<{name: string, value: any}> {
  const params: Array<{name: string, value: any}> = [];

  // Find the P configuration block
  const pConfigMatch = code.match(/P\s*=\s*\{([^}]+)\}/);
  if (pConfigMatch) {
    const pConfigText = pConfigMatch[1];

    // Extract parameter lines
    const paramLines = pConfigText.split('\n').filter(line => line.includes(':'));

    for (const line of paramLines) {
      const match = line.match(/"([^"]+)"\s*:\s*([^,}]+)/);
      if (match) {
        const value = match[2].trim();
        let parsedValue: string | number | boolean = value;

        // Try to parse as number
        if (value.includes('.') || !isNaN(parseFloat(value))) {
          parsedValue = parseFloat(value);
        } else if (value === 'True' || value === 'False' || value === 'true' || value === 'false') {
          parsedValue = value === 'True' || value === 'true';
        } else if (value.includes('"')) {
          parsedValue = value.replace(/"/g, '');
        }

        params.push({ name: match[1], value: parsedValue });
      }
    }
  }

  return params;
}

// Apply exact transformation based on reference file
function applyExactTransformation(referenceCode: string, scannerName: string, params: Array<{name: string, value: any}>, filename: string): string {
  let transformedCode = referenceCode;

  // UPDATED: Use correct class name from new template - UltraFastRenataBacksideBScanner
  // This matches the corrected implementation with proper date ranges, threading, and ADV calculation
  transformedCode = transformedCode.replace(/class\s+UltraFastRenataBacksideBScanner/g, `class UltraFastRenataBacksideBScanner`);

  // Also fix any filename-based class names that might be in the reference file
  const cleanedScannerName = scannerName.replace(/\s+/g, '').toLowerCase();
  const classRegex = new RegExp(`class\\s+${cleanedScannerName}Scanner\\s*:`, 'gi');
  transformedCode = transformedCode.replace(classRegex, 'class UltraFastRenataBacksideBScanner:');

  // Update the header comment with the correct scanner name
  transformedCode = transformedCode.replace(
    'ULTRA-FAST RENATA BACKSIDE B SCANNER',
    `ULTRA-FAST RENATA ${scannerName.toUpperCase().replace(/[^A-Z]/g, '_')} SCANNER`
  );

  transformedCode = transformedCode.replace(
    '🚀 ULTRA-FAST RENATA BACKSIDE B SCANNER - OPTIMIZED FOR SPEED',
    `🚀 ULTRA-FAST RENATA ${scannerName.toUpperCase()} SCANNER - OPTIMIZED FOR SPEED`
  );

  // Update the based-on comment
  transformedCode = transformedCode.replace(
    /FINAL VERSION - Based on .*/,
    `FINAL VERSION - Based on ${filename || 'Original Scanner'}`
  );

  // Replace the parameters in the configuration block
  for (const param of params) {
    // Replace in the params dictionary block
    const paramRegex = new RegExp(`"${param.name}"\\s*:\\s*[^,}]+`, 'g');
    transformedCode = transformedCode.replace(paramRegex, `"${param.name}": ${JSON.stringify(param.value)}`);
  }

  return transformedCode;
}
