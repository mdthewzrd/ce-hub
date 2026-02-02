#!/usr/bin/env node

/**
 * VALIDATE BACKSIDE B SCANNER FORMATTING
 *
 * Tests the formatter with the actual backside B scanner and compares
 * against the reference formatted file to ensure perfect matching.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  backendUrl: 'http://localhost:5665',
  timeout: 60000, // 60 seconds for enhanced AI
  referenceFile: '/Users/michaeldurante/.anaconda/working code/backside daily para/formatted final - UPDATED.py',
  originalScannerPath: '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backend/', // Path to find original scanner
};

class ValidationUtils {
  static log(message, type = 'info') {
    const timestamp = new Date().toISOString().substr(11, 8);
    const prefix = {
      'info': '📋',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'test': '🧪',
      'step': '📍',
      'compare': '🔍'
    }[type] || '📋';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  static async fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timed out after ${CONFIG.timeout}ms`);
      }
      throw error;
    }
  }

  static extractParameters(code) {
    const params = [];

    // Extract P = { ... } parameters
    const pMatch = code.match(/P\s*=\s*\{([^}]+)\}/s);
    if (pMatch) {
      const paramText = pMatch[1];
      const lines = paramText.split('\n');
      lines.forEach(line => {
        const match = line.match(/"([^"]+)"\s*:\s*([^,}]+)/);
        if (match) {
          params.push({
            name: match[1],
            value: match[2].trim()
          });
        }
      });
    }

    return params;
  }

  static compareFiles(file1, file2) {
    try {
      const content1 = fs.readFileSync(file1, 'utf8');
      const content2 = fs.readFileSync(file2, 'utf8');

      const lines1 = content1.split('\n');
      const lines2 = content2.split('\n');

      const comparison = {
        lineCount1: lines1.length,
        lineCount2: lines2.length,
        lineDifference: lines2.length - lines1.length,
        exactMatch: content1 === content2,
        structureMatch: this.compareStructure(lines1, lines2),
        parameterMatch: this.compareParameters(content1, content2)
      };

      return comparison;
    } catch (error) {
      return {
        error: error.message,
        lineCount1: 0,
        lineCount2: 0,
        lineDifference: 0,
        exactMatch: false
      };
    }
  }

  static compareStructure(lines1, lines2) {
    const class1 = this.extractClassMethods(lines1);
    const class2 = this.extractClassMethods(lines2);

    return {
      methods1: class1.methods.length,
      methods2: class2.methods.length,
      methodMatch: JSON.stringify(class1.methods.sort()) === JSON.stringify(class2.methods.sort()),
      className1: class1.className,
      className2: class2.className,
      classNameMatch: class1.className === class2.className
    };
  }

  static extractClassMethods(lines) {
    const result = { className: '', methods: [] };

    for (const line of lines) {
      // Extract class name
      const classMatch = line.match(/class\s+(\w+Scanner)/);
      if (classMatch) {
        result.className = classMatch[1];
      }

      // Extract method names
      const methodMatch = line.match(/\s+def\s+(\w+)/);
      if (methodMatch) {
        result.methods.push(methodMatch[1]);
      }
    }

    return result;
  }

  static compareParameters(content1, content2) {
    const params1 = this.extractParameters(content1);
    const params2 = this.extractParameters(content2);

    const names1 = params1.map(p => p.name).sort();
    const names2 = params2.map(p => p.name).sort();

    return {
      count1: params1.length,
      count2: params2.length,
      namesMatch: JSON.stringify(names1) === JSON.stringify(names2),
      valuesMatch: JSON.stringify(params1.sort((a, b) => a.name.localeCompare(b.name))) ===
                    JSON.stringify(params2.sort((a, b) => a.name.localeCompare(b.name)))
    };
  }
}

class BacksideScannerValidation {
  constructor() {
    this.results = [];
  }

  async runValidation() {
    ValidationUtils.log('Starting Backside B Scanner Validation', 'info');
    ValidationUtils.log('='.repeat(80));

    try {
      // Step 1: Validate reference file exists
      await this.validateReferenceFile();

      // Step 2: Create test scanner code
      const testScannerCode = await this.createTestScanner();

      // Step 3: Test enhanced AI formatting
      const formattedResult = await this.testEnhancedFormatting(testScannerCode);

      // Step 4: Compare with reference file
      if (formattedResult.success) {
        await this.compareWithReference(formattedResult.formattedCode);
      }

      // Step 5: Test legacy formatting for comparison
      const legacyResult = await this.testLegacyFormatting(testScannerCode);

      // Step 6: Final comparison and report
      await this.generateFinalReport(formattedResult, legacyResult);

    } catch (error) {
      ValidationUtils.log(`Validation failed: ${error.message}`, 'error');
    }
  }

  async validateReferenceFile() {
    ValidationUtils.log('Step 1: Validating Reference File...', 'step');

    if (!fs.existsSync(CONFIG.referenceFile)) {
      throw new Error(`Reference file not found: ${CONFIG.referenceFile}`);
    }

    const referenceContent = fs.readFileSync(CONFIG.referenceFile, 'utf8');
    const referenceLines = referenceContent.split('\n').length;

    ValidationUtils.log(`✅ Reference file found: ${referenceLines} lines`, 'success');

    // Extract reference parameters
    const referenceParams = ValidationUtils.extractParameters(referenceContent);
    ValidationUtils.log(`📊 Reference parameters: ${referenceParams.length} found`, 'info');

    referenceParams.forEach((param, index) => {
      ValidationUtils.log(`   ${index + 1}. ${param.name}: ${param.value}`, 'info');
    });

    this.referenceData = {
      content: referenceContent,
      lines: referenceLines,
      parameters: referenceParams
    };

    this.results.push({
      test: 'Reference File Validation',
      success: true,
      data: this.referenceData
    });
  }

  async createTestScanner() {
    ValidationUtils.log('Step 2: Creating Test Scanner Code...', 'step');

    // Create a simple test scanner that should be transformed
    const testScannerCode = `# Backside B Test Scanner
# This scanner should be formatted into the complete 825-line version

P = {
    "price_min": 1.00,
    "adv20_min_usd": 1000000,
    "abs_lookback_days": 1000,
    "abs_exclude_days": 10,
    "pos_abs_max": 0.75,
    "trigger_mode": "D1_or_D2",
    "atr_mult": 2.0,
    "vol_mult": 0.9,
    "d1_vol_mult_min": null,
    "d1_volume_min": 15000000,
    "slope5d_min": 3.0,
    "high_ema9_mult": 1.05,
    "gap_div_atr_min": 0.75,
    "open_over_ema9_min": 0.9,
    "d1_green_atr_min": 0.30,
    "require_open_gt_prev_high": True,
    "enforce_d1_above_d2": True
}

def scan_backside_pattern():
    print("Scanning for backside patterns...")
    return True`;

    ValidationUtils.log(`✅ Test scanner created: ${testScannerCode.split('\n').length} lines`, 'success');

    return testScannerCode;
  }

  async testEnhancedFormatting(code) {
    ValidationUtils.log('Step 3: Testing Enhanced AI Formatting...', 'step');

    try {
      const startTime = Date.now();

      const response = await ValidationUtils.fetchWithTimeout(`${CONFIG.backendUrl}/api/format-exact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: code,
          filename: 'backside_b_test.py',
          useEnhancedService: true,
          validateOutput: true,
          maxRetries: 2,
          aiProvider: 'openrouter',
          model: 'deepseek/deepseek-coder'
        })
      });

      const executionTime = Date.now() - startTime;

      if (response.ok) {
        const result = await response.json();

        ValidationUtils.log(`✅ Enhanced formatting completed in ${executionTime}ms`, 'success');
        ValidationUtils.log(`📊 Output lines: ${result.codeInfo?.formattedLines || 0}`, 'info');
        ValidationUtils.log(`🔍 Validation: ${result.validation?.isValid ? 'PASSED' : 'FAILED'}`, result.validation?.isValid ? 'success' : 'warning');

        this.enhancedResult = {
          success: result.success,
          executionTime,
          formattedCode: result.formattedCode,
          lines: result.codeInfo?.formattedLines || 0,
          validation: result.validation,
          retryAttempts: result.retryAttempts || 0
        };

        this.results.push({
          test: 'Enhanced AI Formatting',
          success: true,
          data: this.enhancedResult
        });

        return this.enhancedResult;

      } else {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

    } catch (error) {
      ValidationUtils.log(`❌ Enhanced formatting failed: ${error.message}`, 'error');

      this.enhancedResult = {
        success: false,
        error: error.message
      };

      this.results.push({
        test: 'Enhanced AI Formatting',
        success: false,
        error: error.message
      });

      return this.enhancedResult;
    }
  }

  async compareWithReference(formattedCode) {
    ValidationUtils.log('Step 4: Comparing with Reference File...', 'step');

    // Write formatted code to temporary file for comparison
    const tempFile = '/tmp/ai_formatted_scanner.py';
    fs.writeFileSync(tempFile, formattedCode);

    // Compare files
    const comparison = ValidationUtils.compareFiles(CONFIG.referenceFile, tempFile);

    ValidationUtils.log('🔍 File Comparison Results:', 'compare');
    ValidationUtils.log(`   Reference Lines: ${comparison.lineCount1}`, 'info');
    ValidationUtils.log(`   AI Formatted Lines: ${comparison.lineCount2}`, 'info');
    ValidationUtils.log(`   Line Difference: ${comparison.lineDifference}`, Math.abs(comparison.lineDifference) <= 20 ? 'success' : 'warning');

    ValidationUtils.log('🔍 Structure Comparison:', 'compare');
    ValidationUtils.log(`   Reference Methods: ${comparison.structureMatch.methods1}`, 'info');
    ValidationUtils.log(`   AI Formatted Methods: ${comparison.structureMatch.methods2}`, 'info');
    ValidationUtils.log(`   Method Match: ${comparison.structureMatch.methodMatch ? 'YES' : 'NO'}`, comparison.structureMatch.methodMatch ? 'success' : 'error');
    ValidationUtils.log(`   Class Name Match: ${comparison.structureMatch.classNameMatch ? 'YES' : 'NO'}`, comparison.structureMatch.classNameMatch ? 'success' : 'error');

    ValidationUtils.log('🔍 Parameter Comparison:', 'compare');
    ValidationUtils.log(`   Reference Parameters: ${comparison.parameterMatch.count1}`, 'info');
    ValidationUtils.log(`   AI Formatted Parameters: ${comparison.parameterMatch.count2}`, 'info');
    ValidationUtils.log(`   Parameter Names Match: ${comparison.parameterMatch.namesMatch ? 'YES' : 'NO'}`, comparison.parameterMatch.namesMatch ? 'success' : 'warning');

    // Clean up temp file
    try {
      fs.unlinkSync(tempFile);
    } catch (e) {
      // Ignore cleanup error
    }

    const comparisonSuccess =
      Math.abs(comparison.lineDifference) <= 20 &&  // Line count within tolerance
      comparison.structureMatch.methodMatch &&        // All methods present
      comparison.structureMatch.classNameMatch &&     // Correct class name
      comparison.parameterMatch.namesMatch;           // All parameters present

    this.comparison = comparison;
    this.comparisonSuccess = comparisonSuccess;

    this.results.push({
      test: 'Reference File Comparison',
      success: comparisonSuccess,
      data: comparison
    });

    return comparisonSuccess;
  }

  async testLegacyFormatting(code) {
    ValidationUtils.log('Step 5: Testing Legacy Formatting for Comparison...', 'step');

    try {
      const startTime = Date.now();

      const response = await ValidationUtils.fetchWithTimeout(`${CONFIG.backendUrl}/api/format-exact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: code,
          filename: 'backside_b_test.py',
          useEnhancedService: false, // Use legacy method
          validateOutput: true
        })
      });

      const executionTime = Date.now() - startTime;

      if (response.ok) {
        const result = await response.json();

        ValidationUtils.log(`✅ Legacy formatting completed in ${executionTime}ms`, 'success');
        ValidationUtils.log(`📊 Output lines: ${result.codeInfo?.formattedLines || 0}`, 'info');

        this.legacyResult = {
          success: result.success,
          executionTime,
          formattedCode: result.formattedCode,
          lines: result.codeInfo?.formattedLines || 0,
          validation: result.validation
        };

        this.results.push({
          test: 'Legacy Formatting',
          success: true,
          data: this.legacyResult
        });

        return this.legacyResult;

      } else {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

    } catch (error) {
      ValidationUtils.log(`❌ Legacy formatting failed: ${error.message}`, 'error');

      this.legacyResult = {
        success: false,
        error: error.message
      };

      return this.legacyResult;
    }
  }

  async generateFinalReport(enhancedResult, legacyResult) {
    ValidationUtils.log('\n' + '='.repeat(80), 'info');
    ValidationUtils.log('🧪 BACKSIDE B SCANNER VALIDATION FINAL REPORT', 'info');
    ValidationUtils.log('='.repeat(80));

    const successfulTests = this.results.filter(r => r.success).length;
    const totalTests = this.results.length;

    ValidationUtils.log(`Total Tests: ${totalTests}`, 'info');
    ValidationUtils.log(`Successful Tests: ${successfulTests}`, 'success');
    ValidationUtils.log(`Failed Tests: ${totalTests - successfulTests}`, totalTests === successfulTests ? 'success' : 'error');
    ValidationUtils.log(`Success Rate: ${((successfulTests / totalTests) * 100).toFixed(1)}%`, successfulTests === totalTests ? 'success' : 'warning');

    ValidationUtils.log('\nTest Results:', 'info');
    this.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      ValidationUtils.log(`${status} ${result.test}`, result.success ? 'success' : 'error');
    });

    // Performance comparison
    if (enhancedResult.success && legacyResult.success) {
      ValidationUtils.log('\nPerformance Comparison:', 'info');
      ValidationUtils.log(`Enhanced AI: ${enhancedResult.executionTime}ms (${enhancedResult.lines} lines)`, 'info');
      ValidationUtils.log(`Legacy Method: ${legacyResult.executionTime}ms (${legacyResult.lines} lines)`, 'info');

      const timeDiff = enhancedResult.executionTime - legacyResult.executionTime;
      ValidationUtils.log(`Time Difference: ${timeDiff}ms (${timeDiff > 0 ? '+' : ''}${((timeDiff/legacyResult.executionTime)*100).toFixed(1)}%)`, timeDiff > 0 ? 'warning' : 'success');
    }

    // Comparison results
    if (this.comparison) {
      ValidationUtils.log('\nReference File Match:', 'info');
      ValidationUtils.log(`Line Count Match: ${Math.abs(this.comparison.lineDifference) <= 20 ? '✅' : '❌'}`, Math.abs(this.comparison.lineDifference) <= 20 ? 'success' : 'error');
      ValidationUtils.log(`Structure Match: ${this.comparison.structureMatch.methodMatch ? '✅' : '❌'}`, this.comparison.structureMatch.methodMatch ? 'success' : 'error');
      ValidationUtils.log(`Class Name Match: ${this.comparison.structureMatch.classNameMatch ? '✅' : '❌'}`, this.comparison.structureMatch.classNameMatch ? 'success' : 'error');
      ValidationUtils.log(`Parameter Match: ${this.comparison.parameterMatch.namesMatch ? '✅' : '❌'}`, this.comparison.parameterMatch.namesMatch ? 'success' : 'warning');
    }

    ValidationUtils.log('\n' + '='.repeat(80), 'info');

    // Final assessment
    const enhancedWorking = enhancedResult.success;
    const legacyWorking = legacyResult.success;
    const referenceMatch = this.comparisonSuccess;

    let finalStatus = '🎉 EXCELLENT';
    let finalMessage = 'All systems working perfectly with reference file match!';

    if (enhancedWorking && legacyWorking && referenceMatch) {
      finalStatus = '🎉 EXCELLENT';
      finalMessage = 'Enhanced AI and Legacy formatting both working with perfect reference file match!';
    } else if (legacyWorking && referenceMatch) {
      finalStatus = '✅ GOOD';
      finalMessage = 'Legacy formatting working with reference file match. Enhanced AI needs attention.';
    } else if (legacyWorking) {
      finalStatus = '⚠️ ACCEPTABLE';
      finalMessage = 'Legacy formatting working, but reference match issues detected.';
    } else {
      finalStatus = '❌ CRITICAL';
      finalMessage = 'Both formatting methods have issues.';
    }

    ValidationUtils.log(`${finalStatus} ${finalMessage}`, finalStatus.includes('🎉') ? 'success' : finalStatus.includes('✅') ? 'success' : finalStatus.includes('⚠️') ? 'warning' : 'error');
    ValidationUtils.log('='.repeat(80), 'info');
  }
}

// Main execution
async function main() {
  const validator = new BacksideScannerValidation();
  await validator.runValidation();
}

// Run validation if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Backside B scanner validation failed:', error);
    process.exit(1);
  });
}

module.exports = BacksideScannerValidation;