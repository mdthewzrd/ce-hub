#!/usr/bin/env node

/**
 * CE-Hub Validation Gate Script
 *
 * This script acts as a validation gate that runs user experience tests
 * and provides confidence scores for deployment decisions.
 *
 * Usage:
 * npm run validate          # Run full validation suite
 * npm run validate -- --quick  # Run smoke tests only
 * npm run validate -- --mobile  # Run mobile validation
 * npm run validate -- --trading  # Run trading workflow validation
 */

const { spawn } = require('child_process');
const path = require('path');

class ValidationGate {
  constructor() {
    this.projectRoot = __dirname;
    this.confidenceThreshold = 0.9;
    this.results = [];
  }

  async runCommand(command, args = []) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: 'pipe',
        cwd: this.projectRoot,
        shell: true
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          code,
          stdout,
          stderr
        });
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  async runValidation(type = 'smoke') {
    console.log(`🚀 Running ${type} validation...`);
    const startTime = Date.now();

    try {
      // Map validation types to npm scripts
      const validationCommands = {
        smoke: ['npm', ['run', 'test:smoke']],
        quick: ['npm', ['run', 'test:basic']],
        mobile: ['npm', ['run', 'test:mobile']],
        trading: ['npm', ['run', 'test:trading']],
        performance: ['npm', ['run', 'test:performance']],
        visual: ['npm', ['run', 'test:visual']],
        full: ['npm', ['run', 'test:full']]
      };

      const [command, args] = validationCommands[type] || validationCommands.smoke;

      // Run the validation
      const result = await this.runCommand(command, args);
      const executionTime = (Date.now() - startTime) / 1000;

      // Parse results
      const parsedResults = this.parseTestResults(result.stdout, result.stderr);
      const confidenceScore = this.calculateConfidenceScore(parsedResults);

      const validationResult = {
        type,
        status: result.code === 0 ? 'PASS' : 'FAIL',
        confidenceScore,
        executionTime,
        details: parsedResults,
        command: `${command} ${args.join(' ')}`
      };

      this.results.push(validationResult);

      // Display results
      this.displayResults(validationResult);

      // Make recommendation
      const recommendation = this.makeRecommendation(validationResult);
      console.log(`\n📋 Recommendation: ${recommendation}`);

      return validationResult;

    } catch (error) {
      console.error(`❌ Validation failed: ${error.message}`);
      return {
        type,
        status: 'ERROR',
        confidenceScore: 0,
        executionTime: (Date.now() - startTime) / 1000,
        error: error.message
      };
    }
  }

  parseTestResults(stdout, stderr) {
    const output = stdout + stderr;
    const lines = output.split('\n');

    const results = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      flakyTests: 0,
      skippedTests: 0,
      errors: []
    };

    for (const line of lines) {
      // Parse Playwright test summary
      if (line.includes('passed') || line.includes('failed')) {
        const match = line.match(/(\d+)\s+passed/g);
        if (match) results.passedTests += parseInt(match[0].split(' ')[0]);

        const failedMatch = line.match(/(\d+)\s+failed/g);
        if (failedMatch) results.failedTests += parseInt(failedMatch[0].split(' ')[0]);

        const flakyMatch = line.match(/(\d+)\s+flaky/g);
        if (flakyMatch) results.flakyTests += parseInt(flakyMatch[0].split(' ')[0]);
      }

      // Look for error messages
      if (line.toLowerCase().includes('error') || line.toLowerCase().includes('failed')) {
        results.errors.push(line.trim());
      }
    }

    results.totalTests = results.passedTests + results.failedTests + results.flakyTests + results.skippedTests;
    results.successRate = results.totalTests > 0 ? (results.passedTests / results.totalTests) * 100 : 0;

    return results;
  }

  calculateConfidenceScore(results) {
    let score = 0;

    // Success rate (70% weight)
    const successScore = (results.successRate / 100) * 0.7;
    score += successScore;

    // Error penalty (15% weight)
    const errorPenalty = results.errors.length > 0 ? 0.15 : 0;
    score += (0.15 - errorPenalty);

    // Test coverage bonus (15% weight)
    const coverageBonus = results.totalTests > 10 ? 0.15 : (results.totalTests / 10) * 0.15;
    score += coverageBonus;

    return Math.min(1.0, Math.max(0.0, score));
  }

  displayResults(result) {
    console.log('\n' + '='.repeat(60));
    console.log(`📊 VALIDATION RESULTS: ${result.type.toUpperCase()}`);
    console.log('='.repeat(60));
    console.log(`Status: ${result.status}`);
    console.log(`Confidence Score: ${(result.confidenceScore * 100).toFixed(1)}%`);
    console.log(`Execution Time: ${result.executionTime.toFixed(2)}s`);

    if (result.details) {
      console.log(`Tests Passed: ${result.details.passedTests}/${result.details.totalTests}`);
      console.log(`Success Rate: ${result.details.successRate.toFixed(1)}%`);

      if (result.details.errors.length > 0) {
        console.log('\n⚠️  Errors found:');
        result.details.errors.slice(0, 5).forEach(error => {
          console.log(`  - ${error}`);
        });
        if (result.details.errors.length > 5) {
          console.log(`  ... and ${result.details.errors.length - 5} more errors`);
        }
      }
    }

    if (result.error) {
      console.log(`Error: ${result.error}`);
    }

    console.log('='.repeat(60));
  }

  makeRecommendation(result) {
    if (result.status === 'ERROR') {
      return '❌ Fix validation errors before proceeding';
    }

    if (result.confidenceScore >= this.confidenceThreshold) {
      return '✅ HIGH CONFIDENCE - Ready for deployment';
    }

    if (result.confidenceScore >= 0.7) {
      return '⚠️  MEDIUM CONFIDENCE - Review failed tests before deployment';
    }

    return '❌ LOW CONFIDENCE - Fix issues before deployment';
  }

  async runFullValidation() {
    console.log('🚀 Running CE-Hub Full Validation Suite...\n');

    const validations = ['smoke', 'mobile', 'trading'];
    const results = [];

    for (const validation of validations) {
      const result = await this.runValidation(validation);
      results.push(result);

      // Add spacing between validations
      if (validation !== validations[validations.length - 1]) {
        console.log('\n' + '~'.repeat(60) + '\n');
      }
    }

    // Calculate overall confidence
    const avgConfidence = results.reduce((sum, r) => sum + r.confidenceScore, 0) / results.length;
    const allPassed = results.every(r => r.status === 'PASS');

    console.log('\n' + '='.repeat(60));
    console.log('🎯 OVERALL VALIDATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Overall Status: ${allPassed ? 'PASS' : 'FAIL'}`);
    console.log(`Average Confidence Score: ${(avgConfidence * 100).toFixed(1)}%`);

    const overallRecommendation = avgConfidence >= this.confidenceThreshold && allPassed
      ? '✅ ALL SYSTEMS GO - Ready for production deployment'
      : '⚠️  RECOMMENDATION: Fix failing validations before deployment';

    console.log(`Final Recommendation: ${overallRecommendation}`);
    console.log('='.repeat(60));

    return {
      overallStatus: allPassed ? 'PASS' : 'FAIL',
      averageConfidence: avgConfidence,
      individualResults: results,
      recommendation: overallRecommendation
    };
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const validationType = args[0] || 'smoke';

  const gate = new ValidationGate();

  if (validationType === 'full') {
    await gate.runFullValidation();
    process.exit(gate.results.every(r => r.status === 'PASS') ? 0 : 1);
  } else {
    const result = await gate.runValidation(validationType);
    process.exit(result.status === 'PASS' ? 0 : 1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ValidationGate;