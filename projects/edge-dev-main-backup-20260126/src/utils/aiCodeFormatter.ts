/**
 * 🚀 AI-Powered Code Formatter for Renata
 *
 * Integrates with powerful, affordable AI models for intelligent code formatting
 * Supports Qwen, Gemini, Claude, and other models via OpenRouter
 * Default: Qwen-2.5-72B-Instruct (most cost-effective)
 */

export interface CodeFormattingOptions {
  model?: 'qwen-2.5-72b-instruct' | 'gemini-1.5-flash-8b' | 'claude-3-5-haiku' | 'gemini-2.0-flash';
  preserveParameters?: boolean;
  detectScannerType?: boolean;
  filename?: string;
}

export interface FormattingResult {
  success: boolean;
  formattedCode: string;
  scannerType: string;
  scannerName?: string;  // NEW: Actual scanner name extracted from code content
  integrityVerified: boolean;
  originalSignature: string;
  formattedSignature: string;
  optimizations: string[];
  warnings: string[];
  errors: string[];
  model: string;
  cost?: number;
}

class AICodeFormatter {
  private readonly API_ENDPOINTS = {
    'gemini': 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent',
    'openrouter': 'https://openrouter.ai/api/v1/chat/completions'
  };

  private readonly MODEL_CONFIGS = {
    'qwen-2.5-72b-instruct': {
      provider: 'openrouter',
      openrouterModel: 'qwen/qwen-2.5-72b-instruct', // Correct OpenRouter model ID
      costPerToken: 0.00000012, // Very affordable
      maxTokens: 200000
    },
    'gemini-1.5-flash-8b': {
      provider: 'gemini',
      costPerToken: 0.00000015, // Very affordable
      maxTokens: 1000000
    },
    'claude-3-5-haiku': {
      provider: 'openrouter',
      openrouterModel: 'anthropic/claude-3.5-haiku', // Correct OpenRouter model ID
      costPerToken: 0.00000025, // Very affordable
      maxTokens: 200000
    },
    'gemini-2.0-flash': {
      provider: 'gemini',
      costPerToken: 0.00000035,
      maxTokens: 1000000
    }
  };

  async formatCode(code: string, options: CodeFormattingOptions = {}): Promise<FormattingResult> {
    const model = options.model || 'qwen-2.5-72b-instruct';
    const config = this.MODEL_CONFIGS[model];

    console.log(`🤖 AI Code Formatter: Using ${model} for intelligent formatting`);

    // ENHANCED: Extract scanner NAME from code content (function names, class names, etc.)
    const extractedScannerName = this.extractScannerNameFromCode(code, options.filename || '');
    console.log(`📝 Extracted scanner name: "${extractedScannerName}"`);

    try {
      const prompt = this.buildFormattingPrompt(code, options);
      const response = await this.callAI(prompt, model, config);

      // Store the originally detected scanner type to preserve it through corrections
      const originalScannerType = response.scannerType || this.detectScannerType(code);

      // Check parameters and retry if needed
      const maxRetries = 2;
      let currentCode = response.formattedCode;
      let currentResponse = response;
      let retryCount = 0;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const parameterValidation = this.validateParameters(code, currentCode);

        if (parameterValidation.valid) {
          // Success! Parameters preserved exactly
          console.log(`✅ Parameters preserved exactly on attempt ${attempt}`);
          break;
        }

        // Parameters were changed - ask AI to fix
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`🔄 AI modified parameters on attempt ${attempt}, requesting correction...`);

          const correctionPrompt = this.buildCorrectionPrompt(code, currentCode, parameterValidation.changes, originalScannerType);
          currentResponse = await this.callAI(correctionPrompt, model, config);
          currentCode = currentResponse.formattedCode;

          if (!currentResponse || !currentResponse.formattedCode) {
            // AI failed to respond, use current code
            break;
          }
        } else {
          console.log(`❌ Max retries (${maxRetries}) reached, using last attempt`);
        }
      }

      // Final validation
      const finalValidation = this.validateParameters(code, currentCode);
      if (!finalValidation.valid) {
        console.error('❌ AI could not preserve parameters after retries, using original code');
        return {
          success: false,
          formattedCode: code, // Return original code unchanged
          scannerType: this.detectScannerType(code),
          scannerName: extractedScannerName,  // Include extracted scanner name
          integrityVerified: false,
          originalSignature: this.generateSignature(code),
          formattedSignature: this.generateSignature(code),
          optimizations: [],
          warnings: ['Could not preserve parameters, used original code'],
          errors: ['Failed after ' + maxRetries + ' attempts'],
          model: model
        };
      }

      return {
        success: true,
        formattedCode: currentCode,
        scannerType: currentResponse.scannerType || this.detectScannerType(currentCode),
        scannerName: extractedScannerName,  // Include extracted scanner name
        integrityVerified: true,
        originalSignature: this.generateSignature(code),
        formattedSignature: this.generateSignature(currentCode),
        optimizations: currentResponse.optimizations || [],
        warnings: currentResponse.warnings || [`Parameters preserved after ${retryCount} corrections`],
        errors: currentResponse.errors || [],
        model: model,
        cost: (response.cost || 0) + (currentResponse.cost || 0)
      };

    } catch (error) {
      console.error('❌ AI formatting failed:', error);

      // Fallback to basic formatting
      return {
        success: false,
        formattedCode: this.basicFormat(code),
        scannerType: 'unknown',
        scannerName: extractedScannerName,  // Include extracted scanner name
        integrityVerified: false,
        originalSignature: this.generateSignature(code),
        formattedSignature: this.generateSignature(code),
        optimizations: [],
        warnings: ['AI formatting failed, used basic formatting'],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        model: 'fallback'
      };
    }
  }

  private formatOriginalParameters(originalCode: string): string {
    const params = this.extractParameters(originalCode);
    let formatted = '';

    for (const [key, value] of params) {
      formatted += `  ${key}: ${value}\n`;
    }

    return formatted.trim();
  }

  private formatCodeForComparison(code: string): string {
    // Return code in a format that's easy to compare
    return '```python\n' + code + '\n```';
  }

  private buildCorrectionPrompt(originalCode: string, currentCode: string, changes: string[], originalScannerType: string): string {
    return `
CRITICAL: You modified trading parameters which is FORBIDDEN.

**❌ PARAMETERS CHANGED (Forbidden):**
${changes.map(change => `  - ${change}`).join('\n')}

**📋 ORIGINAL PARAMETERS TO PRESERVE EXACTLY:**
${this.formatOriginalParameters(originalCode)}

**📋 YOUR CURRENT INCORRECT CODE (with changes):**
${this.formatCodeForComparison(currentCode)}

**✅ CORRECTION REQUIRED:**
1. **RESTORE ALL PARAMETERS** to their EXACT original values
2. **DO NOT MODIFY** any numerical parameter values
3. **DO NOT CHANGE** any trading strategy logic
4. **ONLY OPTIMIZE** API calls and code structure
5. **COPY EXACT PARAMETER VALUES** from original to your corrected code

**🔧 FIX THE CODE BY:**
1. Copying ALL parameter values EXACTLY from original
2. Keeping all trading conditions unchanged
3. Only applying API optimization improvements
4. Maintaining exact parameter names and values

Return your corrected code as JSON:
{
  "formattedCode": "// Corrected code with exact parameters preserved",
  "scannerType": "${originalScannerType}",
  "optimizations": ["Parameters corrected and preserved"],
  "warnings": [],
  "errors": [],
  "correctionNeeded": true
}
`;
}

  private buildFormattingPrompt(code: string, options: CodeFormattingOptions): string {
    // Extract filename from options or code
    const filename = options.filename || 'unknown_scanner.py';

    return `
You are an expert trading scanner code formatter specializing in POLYGON API OPTIMIZATION. Format the following Python trading scanner code with these requirements:

🎯 **SCANNER TYPE IDENTIFICATION (CRITICAL - DO NOT SKIP)**

**Filename:** ${filename}
**Rule 1: Use the filename FIRST**
- If filename contains "gap" → "Small Cap Gap Scanner"
- If filename contains "backside" or "para" → "Backside B Para Scanner"
- If filename contains "a_plus" or "a-plus" → "A+ Para Scanner"
- If filename contains "lc" or "d2" → "LC D2 Scanner"
- Otherwise use pattern matching below

**Rule 2: Pattern Matching (ONLY if filename is unclear)**
- ✅ "Small Cap Gap Scanner" if code has: ema200, "d2 == 0", "c<=ema200*0.8", ".csv" with "gap"
- ✅ "Backside B Para Scanner" if code has: "para" + "decline", "bag_day", "adv20_min_usd"
- ✅ "A+ Para Scanner" if code has: "ADV20_" prefix, "a_plus" naming
- ✅ "LC D2 Scanner" if code has: "lc_" prefix, "d2 >= 0.3"

**Rule 3: DO NOT DEFAULT TO "BACKSIDE B"**
- Just seeing "gap", "pm_high", or "pm_vol" does NOT make it Backside B
- These are common variables used by MANY scanner types
- Look for UNIQUE patterns (like ema200) before deciding

**Rule 4: Use exact names from above**
- "Small Cap Gap Scanner" (NOT "Gap Scanner" or "Backside B")
- "Backside B Para Scanner" (NOT "Backside" or "Para Scanner")
- "A+ Para Scanner" (NOT "A Plus" or "A+")
- "LC D2 Scanner" (NOT "LC" or "D2 Scanner")

🚀 **CRITICAL: API OPTIMIZATION REQUIREMENT**
- **REPLACE individual API calls with GROUPED API** to eliminate rate limiting
- Use Polygon's grouped endpoint: \`/v2/aggs/grouped/locale/us/market/stocks/{date}\`
- This reduces API calls from 31,800+ to ~238 (99.3% reduction)

**FORMATTING REQUIREMENTS:**
1. **EXACT PARAMETER PRESERVATION** - Copy ALL parameters EXACTLY as written, no changes
2. **API OPTIMIZATION ONLY** - ONLY replace individual ticker loops with grouped API calls
3. **STRUCTURE IMPROVEMENTS** - Better code organization, documentation, performance
4. **NO TRADING LOGIC CHANGES** - Keep all if/else conditions and parameter checks exactly
5. **PERFORMANCE OPTIMIZATION** - Better algorithms, batching, threading - NOT trading parameters

**API OPTIMIZATION EXAMPLE:**
❌ OLD (Individual API):
\`\`\`python
for ticker in SYMBOLS:
    url = f"{BASE_URL}/v2/aggs/ticker/{ticker}/range/1/day/{start}/{end}"
    # ... fetch data
\`\`\`

✅ NEW (Grouped API):
\`\`\`python
def fetch_grouped_daily(date: str):
    url = f"{BASE_URL}/v2/aggs/grouped/locale/us/market/stocks/{date}"
    # Fetch ALL symbols in ONE API call (use Python boolean values)
    response = session.get(url, params={"apiKey": API_KEY, "adjusted": True})
    # Process response to get data for all target symbols
\`\`\`

**⚠️ CRITICAL PARAMETER PRESERVATION WARNING ⚠️**
- ❌ FORBIDDEN: Changing adv20_min_usd: 30000000 → 20000000
- ❌ FORBIDDEN: Changing pos_abs_max: 0.75 → 0.85
- ❌ FORBIDDEN: Changing atr_mult: 0.9 → 0.8
- ❌ FORBIDDEN: Changing ANY numerical parameter values
- ❌ FORBIDDEN: Modifying boolean parameters
- ❌ FORBIDDEN: Changing trigger_mode: "D1_or_D2"
- ❌ FORBIDDEN: Modifying ANY trading logic conditions

**✅ ALLOWED ONLY:**
- API call optimization (grouped endpoints)
- Code structure improvements
- Adding documentation
- Performance optimizations
- Dynamic ticker selection (but keeping parameter checks)

**CRITICAL PYTHON BOOLEAN EXAMPLES:**
- ❌ WRONG: \`"require_open_gt_prev_high": true\`
- ✅ CORRECT: \`"require_open_gt_prev_high": True\`
- ❌ WRONG: \`"adjusted": "true"\`
- ✅ CORRECT: \`"adjusted": True\`

**CRITICAL TICKER SELECTION EXAMPLES:**
- ❌ WRONG: \`original_universe = ['AAPL', 'MSFT', 'GOOGL']\` (HARDCODED)
- ❌ WRONG: \`qualified_tickers = set(['MSTR', 'SMCI'])\` (PRE-DEFINED)
- ✅ CORRECT: \`market_universe = fetch_polygon_market_universe()\` (DYNAMIC)
- ✅ CORRECT: \`qualified_tickers = set()\` (START EMPTY, QUALIFY ALL)

**SMART FILTERING REQUIREMENT:**
- MUST use \`apply_smart_temporal_filters()\` for ALL tickers
- MUST qualify based on live data analysis (volume, price, patterns)
- NO pre-qualified or guaranteed ticker inclusion

**BATCH PROCESSING REQUIREMENT:**
- MUST implement batch processing with 500 tickers per batch
- MUST use \`self.batch_size = 500\` in scanner constructor
- MUST process market universe in controlled batches to prevent API overload
- MUST show batch progress: "Batch 1/24: Processing 500 tickers..."

**PERFORMANCE OPTIMIZATION:**
- Use ThreadPoolExecutor with max_workers = cpu_count() or 16
- Process batches sequentially with concurrent requests within each batch
- Update progress every 50 tickers within each batch
- Show qualification rates per batch and overall

Scanner code to format:
\`\`\`python
${code}
\`\`\`

Return your response as JSON:
{
  "formattedCode": "// Optimized code with grouped API",
  "scannerType": "detected_type",
  "optimizations": ["Used Polygon grouped API - 99.3% API reduction", "Eliminated rate limiting", "Enhanced performance"],
  "warnings": ["any warnings about parameters"],
  "errors": ["any errors found"],
  "apiOptimization": {
    "originalApiCalls": "number_of_individual_calls",
    "optimizedApiCalls": "number_of_grouped_calls",
    "reductionPercentage": "99.3"
  }
}
`;
  }

  private async callAI(prompt: string, model: string, config: any): Promise<any> {
    if (config.provider === 'gemini') {
      return await this.callGemini(prompt, model, config);
    } else if (config.provider === 'openrouter') {
      return await this.callOpenRouter(prompt, model, config);
    }
    throw new Error(`Unsupported provider: ${config.provider}`);
  }

  private async callGemini(prompt: string, model: string, config: any): Promise<any> {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY');
    }

    const response = await fetch(`${this.API_ENDPOINTS.gemini}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8000,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.candidates[0]?.content?.parts[0]?.text;

    if (!generatedText) {
      throw new Error('No response from Gemini');
    }

    // Parse JSON response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from Gemini');
    }

    const result = JSON.parse(jsonMatch[0]);
    const tokens = this.estimateTokens(prompt + generatedText);

    return {
      formattedCode: result.formattedCode || result.formatted_code || prompt,
      scannerType: result.scannerType || result.scanner_type || 'unknown',
      optimizations: result.optimizations || [],
      warnings: result.warnings || [],
      errors: result.errors || [],
      cost: tokens * config.costPerToken
    };
  }

  private async callOpenRouter(prompt: string, model: string, config: any): Promise<any> {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error('OpenRouter API key not configured. Please set OPENROUTER_API_KEY');
    }

    // Use the correct OpenRouter model ID from config
    const openrouterModelId = config.openrouterModel || model;

    const response = await fetch(this.API_ENDPOINTS.openrouter, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5657',
        'X-Title': 'Renata AI Code Formatter'
      },
      body: JSON.stringify({
        model: openrouterModelId,
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.1,
        max_tokens: 8000,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0]?.message?.content;

    if (!generatedText) {
      throw new Error('No response from OpenRouter');
    }

    // Parse JSON response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from OpenRouter');
    }

    const result = JSON.parse(jsonMatch[0]);
    const tokens = this.estimateTokens(prompt + generatedText);

    return {
      formattedCode: result.formattedCode || result.formatted_code || generatedText,
      scannerType: result.scannerType || result.scanner_type || 'unknown',
      optimizations: result.optimizations || [],
      warnings: result.warnings || [],
      errors: result.errors || [],
      cost: tokens * config.costPerToken
    };
  }

  private basicFormat(code: string): string {
    // Basic fallback formatting
    return `# Basic formatted code
${code}
# Basic formatting complete`;
  }

  private generateSignature(code: string): string {
    // Simple hash for integrity checking
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      const char = code.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Validate that no parameters were changed during AI formatting
   */
  private validateParameters(originalCode: string, formattedCode: string): {valid: boolean, changes: string[]} {
    const changes: string[] = [];

    // Extract parameters from original code
    const originalParams = this.extractParameters(originalCode);
    const formattedParams = this.extractParameters(formattedCode);

    // Compare parameter values
    for (const [key, originalValue] of originalParams) {
      const formattedValue = formattedParams.get(key);

      if (formattedValue !== originalValue) {
        changes.push(`Parameter ${key}: ${originalValue} → ${formattedValue}`);
      }
    }

    // Check for missing parameters
    for (const key of originalParams.keys()) {
      if (!formattedParams.has(key)) {
        changes.push(`Parameter ${key}: REMOVED`);
      }
    }

    // Check for extra parameters
    for (const key of formattedParams.keys()) {
      if (!originalParams.has(key)) {
        changes.push(`Parameter ${key}: ADDED`);
      }
    }

    return {
      valid: changes.length === 0,
      changes: changes
    };
  }

  private extractParameters(code: string): Map<string, string> {
    const params = new Map();

    // Match parameter definitions (both formats)
    const paramPatterns = [
      /(\w+)\s*:\s*([^,\n}]+)/g,  // "key": value
      /P\["([^"]+)"\]\s*=\s*([^,\n}]+)/g  // P["key"] = value
    ];

    paramPatterns.forEach(pattern => {
      const matches = code.matchAll(pattern);
      for (const match of matches) {
        const key = match[1].trim();
        let value = match[2].trim();

        // Clean up the value
        value = value.replace(/["',]/g, '').trim();

        params.set(key, value);
      }
    });

    return params;
  }

  /**
   * Extract scanner NAME from code content (separate from scanner TYPE)
   * This extracts the actual name like "D1 Gaps" or "Test Small Cap Gaps"
   * rather than the type like "Small Cap Gap Scanner"
   */
  private extractScannerNameFromCode(code: string, filename: string = ''): string {
    // Priority 1: Extract from function names in the code
    const functionPatterns = [
      /def\s+(scan_[a-zA-Z0-9_]+)\s*\(/gi,           // def scan_xxx()
      /def\s+([a-zA-Z0-9_]+_scan)\s*\(/gi,           // def xxx_scan()
      /def\s+([a-zA-Z0-9_]+_scanner)\s*\(/gi,        // def xxx_scanner()
      /def\s+(scan_[a-zA-Z0-9_]+_signals)\s*\(/gi,   // def scan_xxx_signals()
      /def\s+([a-zA-Z0-9_]+_gap)\s*\(/gi,            // def xxx_gap()
      /def\s+([a-zA-Z0-9_]+_d1)\s*\(/gi,             // def xxx_d1()
      /def\s+(get_[a-zA-Z0-9_]+)\s*\(/gi,            // def get_xxx()
    ];

    for (const pattern of functionPatterns) {
      const matches = code.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          const funcName = match[1];
          // Convert function name to readable scanner name
          const readableName = funcName
            .replace(/^(scan_|_scan|_scanner|scanner_)/g, '')
            .replace(/^(get_)/g, '')
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .trim()
            .replace(/\s+/g, ' ');
          if (readableName.length > 2) {
            console.log(`🎯 Extracted scanner name from function: "${readableName}"`);
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
        console.log(`🎯 Extracted scanner name from class: "${readableName}"`);
        return this.toTitleCase(readableName) + ' Scanner';
      }
    }

    // Priority 3: Extract from docstrings/comments
    const docstringPatterns = [
      /"""[^"]*?([Dd]1\s*[Gg]ap[^"]*?)"""/i,
      /"""[^"]*?([Ss]mall\s*[Cc]ap\s*[Gg]ap[^"]*?)"""/i,
      /"""[^"]*?([Bb]ackside[^"]*?)"""/i,
      /"""[^"]*?([Ll][Cc]\s*[Dd]2[^"]*?)"""/i,
      /"""[^"]*?([Aa]\+\s*[Pp]ara[^"]*?)"""/i,
      /#.*?Scanner:\s*([^\n]+)/i,
      /#.*?([Dd]1\s*[Gg]ap)/i,
      /#.*?([Ss]mall\s*[Cc]ap\s*[Gg]ap])/i,
      /#.*?([Bb]ackside)/i,
    ];

    for (const pattern of docstringPatterns) {
      const match = code.match(pattern);
      if (match && match[1]) {
        const name = match[1].trim();
        console.log(`🎯 Extracted scanner name from docstring: "${name}"`);
        return this.toTitleCase(name);
      }
    }

    // Priority 4: Use filename with smart parsing
    if (filename) {
      const basename = filename.replace(/\.py$/, '').replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
      const filenameName = this.toTitleCase(basename.replace(/\s+/g, ' '));
      if (filenameName.length > 2 && filenameName !== 'Scanner') {
        console.log(`🎯 Extracted scanner name from filename: "${filenameName}"`);
        return filenameName;
      }
    }

    console.log(`🎯 Using default scanner name`);
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
        if (['d1', 'lc', 'a+', 'd2'].includes(word.toLowerCase())) {
          return word.toUpperCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ')
      .trim();
  }

  /**
   * Enhanced scanner type detection using weighted pattern scoring
   * Analyzes code semantics rather than just keyword matching
   */
  private detectScannerType(code: string): string {
    const codeLower = code.toLowerCase();

    // Initialize scores for all scanner types
    const scores: Record<string, number> = {
      'gap_scanner': 0,
      'backside_b': 0,
      'a_plus': 0,
      'lc_d2': 0,
      'custom': 0
    };

    // ========== GAP SCANNER PATTERNS (HIGH CONFIDENCE) ==========
    // EMA200 filter is UNIQUE to Gap Scanner - strongest indicator
    if (codeLower.includes('ema200') || codeLower.includes('ema * 0.8')) {
      scores.gap_scanner += 50;
    }

    // D2 exclusion (d2 == 0) - Gap scanners avoid D2 days
    if (codeLower.includes('d2 == 0') || codeLower.includes('d2==0')) {
      scores.gap_scanner += 20;
    }

    // EMA validation condition
    if (codeLower.includes('close <= ema200') || codeLower.includes('c<=ema200') ||
        codeLower.includes('c <= ema200')) {
      scores.gap_scanner += 30;
    }

    // Pre-market gap up logic (unique direction)
    if (codeLower.includes('pm_high / prev_close') && codeLower.includes('>= 0.5')) {
      scores.gap_scanner += 25;
    }

    // Open above previous high
    if (codeLower.includes('open / prev_high') && codeLower.includes('>= 0.3')) {
      scores.gap_scanner += 15;
    }

    // Gap-related output filename
    if (codeLower.includes('.csv') && codeLower.includes('gap')) {
      scores.gap_scanner += 25;
    }

    // High pre-market volume threshold (5M+)
    if (codeLower.includes('pm_vol') && (codeLower.includes('5000000') || codeLower.includes('5_000_000'))) {
      scores.gap_scanner += 10;
    }

    // ========== BACKSIDE B PARA PATTERNS ==========
    // Para B decline pattern
    if (codeLower.includes('para') && codeLower.includes('decline')) {
      scores.backside_b += 40;
    }

    // Bag day tracking (unique to Backside B)
    if (codeLower.includes('bag_day')) {
      scores.backside_b += 30;
    }

    // Traditional Backside B parameter pattern
    if (codeLower.includes('adv20_min_usd') && codeLower.includes('abs_')) {
      scores.backside_b += 50;
    }

    // Para B specific logic
    if (codeLower.includes('para_b') || codeLower.includes('para b')) {
      scores.backside_b += 35;
    }

    // ========== A+ PARA PATTERNS ==========
    // A+ parameter prefix
    if (codeLower.includes('adv20_') && !codeLower.includes('adv20_min_usd')) {
      scores.a_plus += 50;
    }

    // A+ specific naming
    if (codeLower.includes('a_plus') || codeLower.includes('a-plus')) {
      scores.a_plus += 30;
    }

    // Para without decline (A+ is different from Backside B)
    if (codeLower.includes('para') && !codeLower.includes('decline')) {
      scores.a_plus += 25;
    }

    // ========== LC D2 PATTERNS ==========
    // LC prefix
    if (codeLower.includes('lc_')) {
      scores.lc_d2 += 40;
    }

    // D2 pattern (looks for D2, unlike Gap Scanner which excludes it)
    if (codeLower.includes('d2 >= 0.3') || codeLower.includes('d2>=0.3')) {
      scores.lc_d2 += 30;
    }

    // LC-specific logic
    if (codeLower.includes('lc_d2') || codeLower.includes('lc-d2')) {
      scores.lc_d2 += 35;
    }

    // Frontside D2/D3 patterns
    if (codeLower.includes('frontside_d2') || codeLower.includes('frontside_d3')) {
      scores.lc_d2 += 25;
    }

    // ========== CUSTOM SCANNER ==========
    if (codeLower.includes('custom_')) {
      scores.custom += 50;
    }

    // Find the scanner type with the highest score
    let maxScore = 0;
    let detectedType = 'unknown';

    for (const [type, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedType = type;
      }
    }

    // Debug logging (can be removed in production)
    console.log(`🔍 Scanner Detection Scores:`, scores);
    console.log(`🎯 Detected: ${detectedType} (score: ${maxScore})`);

    // Return user-friendly names
    const typeNames: Record<string, string> = {
      'gap_scanner': 'Small Cap Gap Scanner',
      'backside_b': 'Backside B Para Scanner',
      'a_plus': 'A+ Para Scanner',
      'lc_d2': 'LC D2 Scanner',
      'custom': 'Custom Scanner'
    };

    return typeNames[detectedType] || 'Unknown Scanner';
  }

  getAvailableModels(): Array<{model: string, cost: number, description: string}> {
    return [
      {
        model: 'qwen-2.5-72b-instruct',
        cost: 0.00000012,
        description: 'Most cost-effective, excellent for code (Recommended)'
      },
      {
        model: 'gemini-1.5-flash-8b',
        cost: 0.00000015,
        description: 'Fast, affordable by Google'
      },
      {
        model: 'claude-3-5-haiku',
        cost: 0.00000025,
        description: 'Excellent for code by Anthropic'
      },
      {
        model: 'gemini-2.0-flash',
        cost: 0.00000035,
        description: 'Next generation with advanced reasoning'
      }
    ];
  }
}

// Export singleton instance
export const aiCodeFormatter = new AICodeFormatter();
export default aiCodeFormatter;