#!/usr/bin/env node

/**
 * CE-Hub Automatic File Change Validator
 *
 * This script automatically detects file changes and runs UX validation,
 * making it completely seamless for Claude and agents.
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const { watch } = require('chokidar');

class FileChangeValidator {
  constructor() {
    this.ceHubRoot = path.resolve(__dirname, '../..');
    this.edgeDevPath = path.join(this.ceHubRoot, 'projects/edge-dev-main');
    this.validationRunning = false;
    this.validationQueue = [];
    this.watchers = [];

    this.config = {
      // Files/directories to watch for changes
      watchPaths: [
        path.join(this.edgeDevPath, 'src'),
        path.join(this.edgeDevPath, 'public'),
        path.join(this.edgeDevPath, 'components'),
        path.join(this.edgeDevPath, 'pages'),
        path.join(this.edgeDevPath, 'scripts'),
        path.join(this.edgeDevPath, 'styles'),
        path.join(this.edgeDevPath, '*.json'),
        path.join(this.edgeDevPath, '*.js'),
        path.join(this.edgeDevPath, '*.ts'),
        path.join(this.edgeDevPath, '*.css')
      ],

      // Debounce time (ms) to avoid running validation too frequently
      debounceTime: 3000,

      // Validation types for different change types
      validationRules: {
        // Component changes → quick validation
        component: ['quick'],

        // Style changes → visual validation
        style: ['quick', 'visual'],

        // Configuration changes → full validation
        config: ['full'],

        // Multiple changes → full validation
        multiple: ['full']
      },

      // File patterns for classification
      patterns: {
        component: /\.(tsx?|jsx?)$/,
        style: /\.(css|scss|sass|module\.css)$/,
        config: /\.(json|js|ts)$/,
        page: /\.(tsx?|jsx?)$/
      }
    };
  }

  start() {
    console.log('👁️  CE-Hub Automatic Validation Monitor Started');
    console.log(`Watching: ${this.config.watchPaths.length} paths`);
    console.log('Press Ctrl+C to stop\n');

    // Setup file watchers
    this.config.watchPaths.forEach(watchPath => {
      if (fs.existsSync(watchPath)) {
        const watcher = watch(watchPath, {
          ignored: /node_modules|\.git|test-results/,
          persistent: true,
          ignoreInitial: true
        });

        watcher.on('change', (filePath) => this.handleFileChange('change', filePath));
        watcher.on('add', (filePath) => this.handleFileChange('add', filePath));
        watcher.on('unlink', (filePath) => this.handleFileChange('delete', filePath));

        this.watchers.push(watcher);
      }
    });

    // Graceful shutdown
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }

  handleFileChange(type, filePath) {
    console.log(`📝 File ${type}: ${path.relative(this.edgeDevPath, filePath)}`);

    // Classify the change
    const changeType = this.classifyChange(filePath);

    // Add to validation queue
    this.validationQueue.push({
      filePath,
      type,
      changeType,
      timestamp: Date.now()
    });

    // Trigger validation (debounced)
    this.scheduleValidation();
  }

  classifyChange(filePath) {
    const relativePath = path.relative(this.edgeDevPath, filePath);

    // Check if it's a config file
    if (this.patterns.config.test(relativePath)) {
      if (relativePath.includes('package.json') ||
          relativePath.includes('next.config') ||
          relativePath.includes('tailwind')) {
        return 'config';
      }
    }

    // Check if it's a style file
    if (this.patterns.style.test(relativePath)) {
      return 'style';
    }

    // Check if it's a component file
    if (this.patterns.component.test(relativePath)) {
      return 'component';
    }

    // Default to component
    return 'component';
  }

  scheduleValidation() {
    // Clear any pending validation
    if (this.validationTimeout) {
      clearTimeout(this.validationTimeout);
    }

    // Schedule new validation
    this.validationTimeout = setTimeout(() => {
      this.processValidationQueue();
    }, this.config.debounceTime);
  }

  async processValidationQueue() {
    if (this.validationQueue.length === 0 || this.validationRunning) {
      return;
    }

    this.validationRunning = true;

    try {
      const changes = [...this.validationQueue];
      this.validationQueue = [];

      console.log(`\n🔍 Processing ${changes.length} file changes...`);

      // Determine validation type
      const validationType = this.determineValidationType(changes);

      // Run validation
      await this.runValidation(validationType);

    } catch (error) {
      console.error('❌ Validation failed:', error.message);
    } finally {
      this.validationRunning = false;

      // Check if more changes came in during validation
      if (this.validationQueue.length > 0) {
        setTimeout(() => this.processValidationQueue(), 1000);
      }
    }
  }

  determineValidationType(changes) {
    const changeTypes = changes.map(c => c.changeType);
    const uniqueTypes = [...new Set(changeTypes)];

    // If multiple types changed, run full validation
    if (uniqueTypes.length > 1) {
      return 'full';
    }

    // Get validation rules for the change type
    const changeType = uniqueTypes[0];
    const validations = this.config.validationRules[changeType] || ['quick'];

    // Return the most comprehensive validation
    return validations.includes('full') ? 'full' :
           validations.includes('visual') ? 'visual' : 'quick';
  }

  async runValidation(validationType) {
    console.log(`🚀 Running ${validationType} validation...`);

    return new Promise((resolve, reject) => {
      const validatorPath = path.join(__dirname, 'validate-ux.js');
      const child = spawn('node', [validatorPath, validationType], {
        stdio: 'inherit',
        cwd: this.ceHubRoot
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Validation completed successfully');
          resolve();
        } else {
          console.log('⚠️  Validation completed with issues');
          resolve(); // Don't reject, just continue
        }
      });

      child.on('error', (error) => {
        console.error('❌ Validation process error:', error);
        reject(error);
      });

      // Set timeout
      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error('Validation timeout'));
      }, 120000); // 2 minutes

      child.on('close', () => {
        clearTimeout(timeout);
      });
    });
  }

  stop() {
    console.log('\n🛑 Stopping CE-Hub Validation Monitor...');

    // Clear any pending validation
    if (this.validationTimeout) {
      clearTimeout(this.validationTimeout);
    }

    // Close all file watchers
    this.watchers.forEach(watcher => {
      watcher.close();
    });

    console.log('✅ CE-Hub Validation Monitor stopped');
    process.exit(0);
  }
}

// Start monitoring if run directly
if (require.main === module) {
  const monitor = new FileChangeValidator();
  monitor.start();
}

module.exports = FileChangeValidator;