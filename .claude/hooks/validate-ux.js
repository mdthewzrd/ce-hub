#!/usr/bin/env node

/**
 * CE-Hub Automatic UX Validation Hook
 *
 * This hook automatically runs user experience validation after any
 * significant changes to ensure Claude agents always validate their work.
 */

const { spawn } = require('child_process');
const path = require('path');

class AutomaticUXValidation {
  constructor() {
    this.ceHubRoot = path.resolve(__dirname, '../..');
    this.edgeDevPath = path.join(this.ceHubRoot, 'projects/edge-dev-main');
    this.thresholds = {
      quickValidation: true, // Run quick validation by default
      confidenceThreshold: 0.8,
      maxValidationTime: 120000 // 2 minutes max
    };
  }

  async runValidation(validationType = 'quick') {
    console.log(`🔍 CE-Hub Automatic UX Validation (${validationType})`);
    console.log('=' .repeat(60));

    try {
      // Change to edge-dev directory
      process.chdir(this.edgeDevPath);

      // Check if development server is running
      const serverRunning = await this.checkDevServer();

      if (!serverRunning) {
        console.log('⚠️  Development server not running, starting validation server...');
        await this.startValidationServer();
      }

      // Run validation based on type
      const result = await this.executeValidation(validationType);

      // Display results
      this.displayResults(result);

      // Return validation result for Claude to understand
      return {
        success: result.status === 'PASS',
        confidence: result.confidenceScore,
        issues: result.issues || [],
        recommendations: result.recommendations || [],
        shouldProceed: result.confidenceScore >= this.thresholds.confidenceThreshold
      };

    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      return {
        success: false,
        confidence: 0,
        issues: [error.message],
        recommendations: ['Fix validation errors before proceeding'],
        shouldProceed: false
      };
    }
  }

  async checkDevServer() {
    return new Promise((resolve) => {
      const curl = spawn('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', 'http://localhost:5657']);

      curl.on('close', (code) => {
        resolve(code === 0);
      });

      curl.on('error', () => {
        resolve(false);
      });
    });
  }

  async startValidationServer() {
    console.log('🚀 Starting CE-Hub validation server...');

    return new Promise((resolve, reject) => {
      const server = spawn('npm', ['run', 'dev'], {
        cwd: this.edgeDevPath,
        detached: true,
        stdio: 'pipe'
      });

      // Give server time to start
      let attempts = 0;
      const maxAttempts = 30;

      const checkServer = async () => {
        attempts++;
        const isRunning = await this.checkDevServer();

        if (isRunning) {
          console.log('✅ Validation server started successfully');
          resolve();
        } else if (attempts < maxAttempts) {
          setTimeout(checkServer, 2000);
        } else {
          reject(new Error('Failed to start validation server'));
        }
      };

      setTimeout(checkServer, 5000);

      server.on('error', (error) => {
        reject(error);
      });

      server.unref();
    });
  }

  async executeValidation(validationType) {
    const commands = {
      quick: ['node', 'scripts/validation-gate.js', 'quick'],
      mobile: ['node', 'scripts/validation-gate.js', 'mobile'],
      full: ['node', 'scripts/validation-gate.js', 'full'],
      performance: ['npm', 'run', 'test:performance']
    };

    const command = commands[validationType] || commands.quick;

    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const child = spawn(command[0], command.slice(1), {
        cwd: this.edgeDevPath,
        stdio: 'pipe',
        timeout: this.thresholds.maxValidationTime
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
        const executionTime = Date.now() - startTime;

        try {
          const result = this.parseValidationOutput(stdout, stderr, code, executionTime);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  parseValidationOutput(stdout, stderr, code, executionTime) {
    // Extract confidence score and status from output
    const confidenceMatch = stdout.match(/Confidence Score: ([\d.]+)%/);
    const statusMatch = stdout.match(/Status: (\w+)/);

    const confidenceScore = confidenceMatch ? parseFloat(confidenceMatch[1]) / 100 : 0;
    const status = statusMatch ? statusMatch[1] : (code === 0 ? 'PASS' : 'FAIL');

    // Extract issues and recommendations
    const issues = [];
    const recommendations = [];

    if (stderr.includes('Error:') || stderr.includes('FAIL')) {
      issues.push('Test execution failed');
    }

    if (stdout.includes('⚠️')) {
      const warnings = stdout.match(/⚠️\s*([^\n]+)/g) || [];
      issues.push(...warnings.map(w => w.replace('⚠️', '').trim()));
    }

    if (stdout.includes('Recommendation:')) {
      const recommendationMatch = stdout.match(/Recommendation:\s*([^\n]+)/);
      if (recommendationMatch) {
        recommendations.push(recommendationMatch[1].trim());
      }
    }

    return {
      status,
      confidenceScore,
      executionTime,
      issues,
      recommendations,
      stdout,
      stderr,
      exitCode: code
    };
  }

  displayResults(result) {
    console.log('\n📊 CE-Hub Validation Results:');
    console.log(`   Status: ${result.status}`);
    console.log(`   Confidence: ${(result.confidenceScore * 100).toFixed(1)}%`);
    console.log(`   Duration: ${(result.executionTime / 1000).toFixed(1)}s`);

    if (result.issues.length > 0) {
      console.log('\n⚠️  Issues:');
      result.issues.forEach(issue => console.log(`   - ${issue}`));
    }

    if (result.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      result.recommendations.forEach(rec => console.log(`   - ${rec}`));
    }

    const emoji = result.confidenceScore >= 0.9 ? '🟢' :
                  result.confidenceScore >= 0.7 ? '🟡' : '🔴';

    console.log(`\n${emoji} Overall: ${result.shouldProceed ? 'PROCEED' : 'REVIEW NEEDED'}`);
    console.log('=' .repeat(60));
  }
}

// Export for use in other contexts
module.exports = AutomaticUXValidation;

// Run directly if called
if (require.main === module) {
  const validator = new AutomaticUXValidation();
  const validationType = process.argv[2] || 'quick';

  validator.runValidation(validationType)
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Validation failed:', error);
      process.exit(1);
    });
}