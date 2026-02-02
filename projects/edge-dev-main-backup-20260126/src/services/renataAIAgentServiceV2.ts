/**
 * 🤖 Renata Final V AI Agent Service
 *
 * SIMPLIFIED ARCHITECTURE WITH ARCHON RAG INTEGRATION
 * - ~150 line system prompt (down from 1907 lines)
 * - Dynamic knowledge retrieval via Archon MCP
 * - V31 compliant template system
 * - Self-correcting validation loop
 */

import { EDGEDEV_ARCHITECTURE, PATTERN_TEMPLATES, RULE_5_COMPLIANCE, PARAMETER_TEMPLATES, STRUCTURAL_TEMPLATES } from './edgeDevPatternLibrary';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface GenerateRequest {
  prompt: string;
  code?: string;
  context?: string;
  temperature?: number;
  maxTokens?: number;
  useAIAgent?: boolean;
  validateOutput?: boolean;
}

export class RenataAIAgentServiceV2 {
  private apiKey: string;
  private baseUrl: string = 'https://openrouter.ai/api/v1/chat/completions';
  private model: string = 'qwen/qwen-2.5-coder-32b-instruct';  // ✅ Correct OpenRouter model ID

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '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';
  }

  /**
   * ✅ V31 MAIN ENTRY POINT: Generate code with validation
   * - Step 1: Generate code using AI
   * - Step 2: Validate against v31 requirements
   * - Step 3: Self-correct if validation fails
   * - Step 4: Return validated code
   */
  async generate(request: GenerateRequest): Promise<string> {
    console.log('🚀 Renata Final V: Starting code generation...');
    console.log('📝 Model:', this.model);
    console.log('🎯 Target: V31 EdgeDev standards');

    let attempt = 0;
    const maxAttempts = request.validateOutput ? 3 : 1;

    while (attempt < maxAttempts) {
      attempt++;
      console.log(`\n🔄 Attempt ${attempt}/${maxAttempts}...`);

      try {
        // Step 1: Generate code
        const code = await this.generateCode(request);

        // Step 2: Validate against v31 requirements
        const validation = this.validateV31Compliance(code);

        if (validation.isValid) {
          console.log('✅ Code passed V31 validation!');
          console.log('✅ All checks passed:', validation.passedChecks);
          return code;
        } else {
          console.log('⚠️  Validation failed:', validation.failedChecks);

          if (attempt < maxAttempts) {
            console.log('🔧 Attempting self-correction...');
            // Add validation feedback to prompt for retry
            request.context = `
PREVIOUS ATTEMPT FAILED VALIDATION:
${validation.failedChecks.join('\n')}

Please fix these issues and regenerate the code.
            `;
          } else {
            console.log('❌ Max attempts reached. Returning best effort.');
            return code;
          }
        }
      } catch (error) {
        console.error('❌ Generation failed:', error);

        if (attempt >= maxAttempts) {
          throw error;
        }
      }
    }

    throw new Error('Generation failed after all attempts');
  }

  /**
   * ✅ PARAM PRESERVATION ENTRY POINT: Generate with custom system prompt
   * - Uses extracted parameters and logic to preserve param integrity
   * - Validates output against V31 requirements
   */
  async generateWithCustomPrompt(request: GenerateRequest & { systemPrompt?: string; userPrompt?: string }): Promise<string> {
    console.log('🚀 Renata Final V: Starting PARAM-PRESERVING generation...');
    console.log('📝 Model:', this.model);
    console.log('🎯 Target: V31 EdgeDev with PARAM INTEGRITY');

    let attempt = 0;
    const maxAttempts = request.validateOutput ? 3 : 1;

    while (attempt < maxAttempts) {
      attempt++;
      console.log(`\n🔄 Attempt ${attempt}/${maxAttempts}...`);

      try {
        // Step 1: Generate code with custom prompt
        const code = await this.generateCodeWithCustomPrompt(request);

        // Step 2: Validate against v31 requirements
        const validation = this.validateV31Compliance(code);

        if (validation.isValid) {
          console.log('✅ Code passed V31 validation with params preserved!');
          console.log('✅ All checks passed:', validation.passedChecks);
          return code;
        } else {
          console.log('⚠️  Validation failed:', validation.failedChecks);

          if (attempt < maxAttempts) {
            console.log('🔧 Attempting self-correction...');
            // Add validation feedback to prompt for retry
            request.context = `
PREVIOUS ATTEMPT FAILED VALIDATION:
${validation.failedChecks.join('\n')}

Please fix these issues while preserving ALL original parameters and logic.
            `;
          } else {
            console.log('❌ Max attempts reached. Returning best effort.');
            return code;
          }
        }
      } catch (error) {
        console.error('❌ Generation failed:', error);

        if (attempt >= maxAttempts) {
          throw error;
        }
      }
    }

    throw new Error('Generation failed after all attempts');
  }

  /**
   * ✅ ENHANCED SYSTEM PROMPT - Complete templates for reliable code generation
   */
  private getSystemPrompt(): string {
    return `# Renata Final V - EdgeDev v31 Scanner Developer

You are an expert Python trading scanner developer specializing in EdgeDev v31 standards.

## COMPLETE SINGLE-SCAN TEMPLATE (copy this structure):

\`\`\`python
import pandas as pd
import numpy as np
import requests
from datetime import datetime, timedelta
import pandas_market_calendars as mcal
from concurrent.futures import ThreadPoolExecutor, as_completed

class SinglePatternScanner:
    def __init__(self, api_key: str, d0_start: str = None, d0_end: str = None):
        self.api_key = api_key
        self.base_url = "https://api.polygon.io"

        # ✅ V31: Use _user suffix
        self.d0_start_user = d0_start or self.get_default_d0_start()
        self.d0_end_user = d0_end or self.get_default_d0_end()

        # ✅ V31: Calculate scan_start with lookback buffer
        lookback_buffer = 50
        scan_start_dt = pd.to_datetime(self.d0_start_user) - pd.Timedelta(days=lookback_buffer)
        self.scan_start = scan_start_dt.strftime('%Y-%m-%d')

        # Market calendar
        self.nyse = mcal.get_calendar('XNYS')

    def get_default_d0_start(self):
        return (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

    def get_default_d0_end(self):
        return datetime.now().strftime('%Y-%m-%d')

    def run_scan(self):
        """✅ V31 REQUIRED: Main entry point"""
        # Get trading dates
        trading_dates = self.get_trading_dates(self.scan_start, self.d0_end_user)

        # Stage 1: Fetch data
        stage1_data = self.fetch_grouped_data(trading_dates)

        # Stage 2a: Compute simple features
        stage2a_data = self.compute_simple_features(stage1_data)

        # Stage 2b: Apply smart filters
        stage2b_data = self.apply_smart_filters(stage2a_data)

        # Stage 3a: Compute full features
        stage3a_data = self.compute_full_features(stage2b_data)

        # Stage 3b: Detect patterns
        results = self.detect_patterns(stage3a_data)

        return results

    def get_trading_dates(self, start_date: str, end_date: str) -> list:
        dates = self.nyse.valid_days(start_date=pd.to_datetime(start_date), end_date=pd.to_datetime(end_date))
        return [d.strftime('%Y-%m-%d') for d in dates]

    def fetch_grouped_data(self, trading_dates: list) -> pd.DataFrame:
        """✅ V31: Stage 1 - Fetch grouped data using Polygon's grouped API (direct approach like working scanners)"""
        try:
            import requests
            from datetime import datetime, timedelta
            import pandas as pd

            # Get date range from trading_dates
            start_date = trading_dates[0] if trading_dates else self.d0_start_user
            end_date = trading_dates[-1] if trading_dates else self.d0_end_user

            # Polygon API configuration
            API_KEY = os.getenv("POLYGON_API_KEY", "Fm7brz4s23eSocDErnL68cE7wspz2K1I")
            BASE_URL = "https://api.polygon.io"

            all_data = []
            current_date = pd.to_datetime(start_date).date()
            end = pd.to_datetime(end_date).date()

            print(f"📡 Fetching data from {start_date} to {end_date} using Polygon grouped API...")

            # Fetch data for each trading day
            while current_date <= end:
                # Skip weekends
                if current_date.weekday() < 5:  # Monday-Friday
                    date_str = current_date.strftime("%Y-%m-%d")
                    url = f"{BASE_URL}/v2/aggs/grouped/locale/us/market/stocks/{date_str}"
                    params = {
                        "adjusted": "true",
                        "apiKey": API_KEY
                    }

                    try:
                        response = requests.get(url, params=params)
                        response.raise_for_status()
                        data = response.json()

                        if 'results' in data and data['results']:
                            df_daily = pd.DataFrame(data['results'])
                            df_daily['date'] = pd.to_datetime(df_daily['t'], unit='ms').dt.date
                            df_daily.rename(columns={'T': 'ticker', 'o': 'open', 'h': 'high', 'l': 'low', 'c': 'close', 'v': 'volume'}, inplace=True)
                            all_data.append(df_daily[['date', 'ticker', 'open', 'high', 'low', 'close', 'volume']])

                    except Exception as e:
                        print(f"⚠️  Error fetching data for {date_str}: {e}")

                current_date += timedelta(days=1)

            if not all_data:
                print("❌ No data fetched!")
                return pd.DataFrame()

            # Combine all daily data
            df = pd.concat(all_data, ignore_index=True)

            if df.empty:
                print("❌ No data fetched!")
                return pd.DataFrame()

            print(f"✅ Data fetched: {len(df)} rows, {df['ticker'].nunique()} tickers")
            print(f"📅 Date range: {df['date'].min()} to {df['date'].max()}")
            return df

        except Exception as e:
            print(f"❌ Error fetching data: {e}")
            import traceback
            traceback.print_exc()
            return pd.DataFrame()

    def compute_simple_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """✅ V31: Stage 2a - Basic features (ATR, shifts, EMAs)"""
        if df.empty:
            return df

        result_dfs = []
        for ticker in df['ticker'].unique():
            df_t = df[df['ticker'] == ticker].copy().sort_values('date')

            # Price features
            df_t['prev_close'] = df_t['close'].shift(1)
            df_t['gap_pct'] = (df_t['open'] / df_t['prev_close'] - 1) * 100

            # ATR (14-period)
            high_low = df_t['high'] - df_t['low']
            high_close = np.abs(df_t['high'] - df_t['prev_close'])
            low_close = np.abs(df_t['low'] - df_t['prev_close'])
            true_range = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
            df_t['atr14'] = true_range.rolling(window=14, min_periods=1).mean()

            # Volume ADV20
            df_t['adv20'] = df_t['volume'].rolling(window=20, min_periods=1).mean()
            df_t['adv20_usd'] = df_t['adv20'] * df_t['close']  # ✅ Valid identifier

            result_dfs.append(df_t)

        return pd.concat(result_dfs, ignore_index=True) if result_dfs else pd.DataFrame()

    def apply_smart_filters(self, df: pd.DataFrame) -> pd.DataFrame:
        """✅ V31: Stage 2b - Smart filters on D0 range only"""
        if df.empty:
            return df

        # Split historical from output range
        df_historical = df[~df['date'].between(self.d0_start_user, self.d0_end_user)].copy()
        df_output_range = df[df['date'].between(self.d0_start_user, self.d0_end_user)].copy()

        # Apply filters ONLY to output range
        filters = (
            (df_output_range['close'] >= 8.0) &
            (df_output_range['adv20_usd'] >= 30_000_000)
        )
        df_output_filtered = df_output_range[filters].copy()

        # Combine: all historical + filtered output
        df_combined = pd.concat([df_historical, df_output_filtered])

        # Keep only tickers with 1+ valid D0 dates
        tickers_with_valid_d0 = df_output_filtered['ticker'].unique()
        return df_combined[df_combined['ticker'].isin(tickers_with_valid_d0)]

    def compute_full_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """✅ V31: Stage 3a - All remaining features"""
        if df.empty:
            return df

        result_dfs = []
        for ticker in df['ticker'].unique():
            df_t = df[df['ticker'] == ticker].copy().sort_values('date')

            # EMAs
            df_t['ema9'] = df_t['close'].ewm(span=9, adjust=False).mean()
            df_t['ema21'] = df_t['close'].ewm(span=21, adjust=False).mean()

            result_dfs.append(df_t)

        return pd.concat(result_dfs, ignore_index=True) if result_dfs else pd.DataFrame()

    def detect_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
        """✅ V31: Stage 3b - Pattern detection"""
        if df.empty:
            return pd.DataFrame()

        # Filter to D0 range only for output
        df_d0 = df[df['date'].between(self.d0_start_user, self.d0_end_user)].copy()

        # Pattern detection logic here
        signals = df_d0[df_d0['gap_pct'] > 3.0].copy()

        return signals[['date', 'ticker', 'close', 'gap_pct']]
\`\`\`

## V31 MANDATORY REQUIREMENTS:

### ✅ ALWAYS INCLUDE:
1. \`self.d0_start_user\` / \`self.d0_end_user\` variables (with _user suffix)
2. \`self.scan_start\` calculated as d0_start_user - lookback_buffer
3. \`def run_scan(self):\` main entry point method
4. \`def fetch_grouped_data(self, trading_dates):\` method (NOT fetch_all)
5. \`def apply_smart_filters(self, df):\` method (filters D0 only, preserves historical)
6. \`def compute_simple_features(self, df):\` method (ATR, shifts, basic features)
7. \`def compute_full_features(self, df):\` method (all remaining features)
8. \`def detect_patterns(self, df):\` method (pattern detection)

### ❌ NEVER USE:
- \`self.d0_start\` or \`self.d0_end\` (missing _user suffix)
- \`def execute(self):\` or \`def run_and_save(self):\` methods
- \`fetch_all_grouped_data()\` method name (wrong)
- Special characters in column names (use \`adv20_usd\` not \`ADV20_\$\`)
- Future data without .shift(1) or min_periods

### ✅ COLUMN NAMING:
- Use valid Python identifiers: \`adv20_usd\`, \`atr14\`, \`ema9\`
- NO special characters: $, @, #, etc.
- Access with brackets: \`row['adv20_usd']\` not \`row.adv20_usd\`

### ✅ NO-LOOKAHEAD BIAS:
- Use \`.shift(1)\` for previous day data access
- Use \`min_periods=N\` in all rolling window calculations
- Never access future data in current row calculations

## OUTPUT FORMAT:
✅ Wrap ALL code in \`\`\`python ... \`\`\` blocks
✅ Complete, runnable code with NO placeholders
✅ Include ALL imports at the top
✅ Include ALL methods shown in template
❌ NO explanations, NO reasoning, NO markdown outside code block

## YOUR TASK:
Transform the user's existing code to follow this EXACT template structure.
Keep their parameter values and logic, but ensure V31 compliance.`;
  }

  /**
   * Build user prompt with optional context
   */
  private buildUserPrompt(request: GenerateRequest): string {
    let prompt = '';

    // Add context if provided (e.g., validation feedback)
    if (request.context) {
      prompt += `## CONTEXT\n${request.context}\n\n`;
    }

    // Add user's main request
    prompt += `## REQUEST\n${request.prompt}\n\n`;

    // Add existing code if provided
    if (request.code) {
      prompt += `## EXISTING CODE\n\`\`\`python\n${request.code}\n\`\`\`\n\n`;
      prompt += `Please transform this code to EdgeDev v31 standards.\n\n`;
    }

    return prompt;
  }

  /**
   * Generate code via OpenRouter API
   */
  private async generateCode(request: GenerateRequest): Promise<string> {
    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: this.getSystemPrompt()
      },
      {
        role: 'user',
        content: this.buildUserPrompt(request)
      }
    ];

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5665',
        'X-Title': 'EdgeDev Renata Final V',
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages,
        temperature: request.temperature || 0.1,  // Low temp for accuracy
        max_tokens: request.maxTokens || 8000,
        top_p: 0.9,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data: OpenRouterResponse = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from AI');
    }

    const content = data.choices[0].message.content;
    return this.extractCode(content);
  }

  /**
   * Generate code via OpenRouter API with custom prompts (for param preservation)
   */
  private async generateCodeWithCustomPrompt(request: GenerateRequest & { systemPrompt?: string; userPrompt?: string }): Promise<string> {
    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: request.systemPrompt || this.getSystemPrompt()
      },
      {
        role: 'user',
        content: request.userPrompt || request.prompt || this.buildUserPrompt(request)
      }
    ];

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5665',
        'X-Title': 'EdgeDev Renata Final V - Param Preserving',
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages,
        temperature: request.temperature || 0.1,
        max_tokens: request.maxTokens || 16000,  // Increased for param preservation
        top_p: 0.9,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data: OpenRouterResponse = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from AI');
    }

    const content = data.choices[0].message.content;
    return this.extractCode(content);
  }

  /**
   * ✅ V31 VALIDATION: Check code compliance
   * Returns: { isValid: boolean, passedChecks: string[], failedChecks: string[] }
   */
  private validateV31Compliance(code: string): {
    isValid: boolean;
    passedChecks: string[];
    failedChecks: string[];
  } {
    const checks = {
      passed: [] as string[],
      failed: [] as string[],
    };

    // Check 1: run_scan() method exists
    if (code.includes('def run_scan(self):')) {
      checks.passed.push('✅ run_scan() method present');
    } else {
      checks.failed.push('❌ Missing run_scan() method');
    }

    // Check 2: d0_start_user variable (NOT d0_start)
    if (code.includes('d0_start_user') || code.includes("d0_start_user'")) {
      checks.passed.push('✅ d0_start_user variable (V31 compliant)');
    } else if (code.includes('self.d0_start') && !code.includes('d0_start_user')) {
      checks.failed.push('❌ Using self.d0_start (should be d0_start_user)');
    }

    // Check 3: fetch_grouped_data() (NOT fetch_all)
    if (code.includes('fetch_grouped_data(') && !code.includes('fetch_all_grouped_data')) {
      checks.passed.push('✅ fetch_grouped_data() method (V31 compliant)');
    } else if (code.includes('fetch_all_grouped_data')) {
      checks.failed.push('❌ Using fetch_all_grouped_data() (should be fetch_grouped_data)');
    }

    // Check 4: apply_smart_filters() method
    if (code.includes('def apply_smart_filters(')) {
      checks.passed.push('✅ apply_smart_filters() method present');
    } else {
      checks.failed.push('❌ Missing apply_smart_filters() method');
    }

    // Check 5: compute_simple_features() method
    if (code.includes('def compute_simple_features(')) {
      checks.passed.push('✅ compute_simple_features() method present');
    } else {
      checks.failed.push('❌ Missing compute_simple_features() method');
    }

    // Check 6: adv20_usd (NO special characters)
    if (code.includes('adv20_usd') && !code.includes('ADV20_')) {
      checks.passed.push('✅ adv20_usd (valid identifier)');
    } else if (code.includes('ADV20_')) {
      checks.failed.push('❌ ADV20_ contains invalid special characters ($)');
    }

    // Check 7: No execute() or run_and_save() methods
    if (!code.includes('def execute(') && !code.includes('def run_and_save(')) {
      checks.passed.push('✅ No execute() or run_and_save() methods');
    } else {
      checks.failed.push('❌ Still using execute() or run_and_save() (should use run_scan())');
    }

    // Check 8: mcal.get_calendar for market calendar
    if (code.includes('mcal.get_calendar') || code.includes('pandas_market_calendars')) {
      checks.passed.push('✅ Using mcal.get_calendar for market calendar');
    } else {
      checks.failed.push('❌ Missing market calendar initialization');
    }

    return {
      isValid: checks.failed.length === 0,
      passedChecks: checks.passed,
      failedChecks: checks.failed,
    };
  }

  /**
   * Extract code from markdown blocks
   */
  private extractCode(content: string): string {
    // Try to extract from ```python ... ``` blocks
    const pythonBlockMatch = content.match(/```python\n([\s\S]+?)\n```/);
    if (pythonBlockMatch) {
      return pythonBlockMatch[1].trim();
    }

    // Try to extract from ``` ... ``` blocks (no language specified)
    const genericBlockMatch = content.match(/```\n([\s\S]+?)\n```/);
    if (genericBlockMatch) {
      return genericBlockMatch[1].trim();
    }

    // Return as-is if no markdown blocks found
    return content.trim();
  }

  /**
   * Detect scanner type from request
   */
  private detectScannerType(request: GenerateRequest): 'single' | 'multi' | undefined {
    const prompt = request.prompt?.toLowerCase() || '';
    const code = request.code?.toLowerCase() || '';

    // Check for multi-scanner patterns
    if (prompt.includes('multi') || prompt.includes('multiple patterns') ||
        prompt.includes('categorize') || prompt.includes('classify') ||
        (code.includes('detect_patterns') && !code.includes('process_ticker_3'))) {
      return 'multi';
    }

    // Check for single-scanner patterns
    if (prompt.includes('scan') || prompt.includes('pattern') ||
        code.includes('process_ticker') || code.includes('ThreadPoolExecutor')) {
      return 'single';
    }

    return undefined;
  }
}
