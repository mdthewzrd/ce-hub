#!/usr/bin/env node

/**
 * CE-Hub Integrated File Operations with Automatic Validation
 *
 * This module provides enhanced file operation tools that automatically
 * trigger UX validation after changes, making it seamless for Claude agents.
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

class IntegratedFileOperations {
  constructor() {
    this.ceHubRoot = path.resolve(__dirname, '../..');
    this.edgeDevPath = path.join(this.ceHubRoot, 'projects/edge-dev-main');
    this.validationQueue = [];
    this.validationInProgress = false;
  }

  /**
   * Enhanced write function that triggers validation
   */
  async writeWithValidation(filePath, content, options = {}) {
    try {
      // Write the file
      await this.writeFile(filePath, content, options);

      console.log(`📝 Wrote: ${path.relative(this.ceHubRoot, filePath)}`);

      // Queue validation
      this.queueValidation(filePath, 'write');

      return { success: true, filePath };

    } catch (error) {
      console.error(`❌ Write failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enhanced edit function that triggers validation
   */
  async editWithValidation(filePath, oldString, newString, options = {}) {
    try {
      // Perform the edit
      const result = await this.editFile(filePath, oldString, newString, options);

      if (result.success) {
        console.log(`✏️  Edited: ${path.relative(this.ceHubRoot, filePath)}`);

        // Queue validation
        this.queueValidation(filePath, 'edit');
      }

      return result;

    } catch (error) {
      console.error(`❌ Edit failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enhanced delete function that triggers validation
   */
  async deleteWithValidation(filePath) {
    try {
      // Delete the file
      await this.deleteFile(filePath);

      console.log(`🗑️  Deleted: ${path.relative(this.ceHubRoot, filePath)}`);

      // Queue validation for related files
      this.queueValidation(filePath, 'delete');

      return { success: true, filePath };

    } catch (error) {
      console.error(`❌ Delete failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Batch operations with single validation
   */
  async batchOperationsWithValidation(operations) {
    const results = [];
    let hasChanges = false;

    console.log(`📦 Processing ${operations.length} operations...`);

    try {
      // Execute all operations
      for (const op of operations) {
        let result;

        switch (op.type) {
          case 'write':
            result = await this.writeFile(op.filePath, op.content, op.options);
            break;
          case 'edit':
            result = await this.editFile(op.filePath, op.oldString, op.newString, op.options);
            break;
          case 'delete':
            result = await this.deleteFile(op.filePath);
            break;
          default:
            result = { success: false, error: `Unknown operation type: ${op.type}` };
        }

        results.push(result);

        if (result.success) {
          hasChanges = true;
          console.log(`  ✓ ${op.type}: ${path.relative(this.ceHubRoot, op.filePath)}`);
        } else {
          console.log(`  ❌ ${op.type}: ${path.relative(this.ceHubRoot, op.filePath)} - ${result.error}`);
        }
      }

      // Run validation once for all changes
      if (hasChanges && operations.length > 0) {
        console.log('🔍 Running validation for batch operations...');
        await this.runValidationForBatch(operations);
      }

      return {
        success: results.every(r => r.success),
        results,
        hasChanges
      };

    } catch (error) {
      console.error(`❌ Batch operations failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        results
      };
    }
  }

  /**
   * Queue validation for processing
   */
  queueValidation(filePath, operationType) {
    this.validationQueue.push({
      filePath,
      operationType,
      timestamp: Date.now()
    });

    // Process validation queue (debounced)
    this.processValidationQueue();
  }

  /**
   * Process validation queue with debouncing
   */
  processValidationQueue() {
    if (this.validationTimeout) {
      clearTimeout(this.validationTimeout);
    }

    this.validationTimeout = setTimeout(async () => {
      if (this.validationQueue.length > 0 && !this.validationInProgress) {
        await this.executeValidation();
      }
    }, 2000); // 2 second debounce
  }

  /**
   * Execute validation for queued changes
   */
  async executeValidation() {
    if (this.validationInProgress || this.validationQueue.length === 0) {
      return;
    }

    this.validationInProgress = true;

    try {
      const changes = [...this.validationQueue];
      this.validationQueue = [];

      console.log(`\n🚀 Running UX validation for ${changes.length} changes...`);

      // Determine validation type
      const validationType = this.determineValidationType(changes);

      // Run validation
      const result = await this.runValidation(validationType);

      // Display results
      this.displayValidationResults(result);

    } catch (error) {
      console.error('❌ Validation execution failed:', error.message);
    } finally {
      this.validationInProgress = false;

      // Process any new changes that came in during validation
      if (this.validationQueue.length > 0) {
        setTimeout(() => this.processValidationQueue(), 1000);
      }
    }
  }

  /**
   * Determine validation type based on changes
   */
  determineValidationType(changes) {
    const fileTypes = changes.map(c => path.extname(c.filePath));
    const hasStyles = fileTypes.some(ext => ['.css', '.scss', '.sass'].includes(ext));
    const hasConfig = changes.some(c =>
      c.filePath.includes('package.json') ||
      c.filePath.includes('next.config') ||
      c.filePath.includes('tailwind')
    );
    const hasMultipleChanges = changes.length > 3;

    if (hasConfig || hasMultipleChanges) {
      return 'full';
    } else if (hasStyles) {
      return 'visual';
    } else {
      return 'quick';
    }
  }

  /**
   * Run validation
   */
  async runValidation(validationType) {
    return new Promise((resolve, reject) => {
      const validatorPath = path.join(__dirname, 'validate-ux.js');
      const child = spawn('node', [validatorPath, validationType], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: this.ceHubRoot
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
        const result = this.parseValidationResults(stdout, stderr, code);
        resolve(result);
      });

      child.on('error', (error) => {
        reject(error);
      });

      // Timeout after 2 minutes
      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error('Validation timeout'));
      }, 120000);

      child.on('close', () => {
        clearTimeout(timeout);
      });
    });
  }

  /**
   * Parse validation results
   */
  parseValidationResults(stdout, stderr, code) {
    const confidenceMatch = stdout.match(/Confidence Score: ([\d.]+)%/);
    const statusMatch = stdout.match(/Status: (\w+)/);

    const confidenceScore = confidenceMatch ? parseFloat(confidenceMatch[1]) / 100 : 0;
    const status = statusMatch ? statusMatch[1] : (code === 0 ? 'PASS' : 'FAIL');

    return {
      status,
      confidenceScore,
      success: code === 0,
      stdout,
      stderr
    };
  }

  /**
   * Display validation results
   */
  displayValidationResults(result) {
    const emoji = result.status === 'PASS' ? '✅' : '⚠️';
    const confidence = (result.confidenceScore * 100).toFixed(1);

    console.log(`${emoji} Validation Results: ${result.status} (${confidence}% confidence)`);

    if (result.status === 'FAIL' || result.confidenceScore < 0.8) {
      console.log('⚠️  Review needed before proceeding with further changes');
    } else {
      console.log('✅ Changes validated successfully');
    }
  }

  /**
   * Run validation for batch operations
   */
  async runValidationForBatch(operations) {
    // Convert operations to change format
    const changes = operations.map(op => ({
      filePath: op.filePath,
      operationType: op.type,
      timestamp: Date.now()
    }));

    // Determine validation type
    const validationType = this.determineValidationType(changes);

    // Run validation
    await this.runValidation(validationType);
  }

  /**
   * Standard file operations (wrapped from fs.promises)
   */
  async writeFile(filePath, content, options = {}) {
    await fs.writeFile(filePath, content, options);
    return { success: true, filePath };
  }

  async editFile(filePath, oldString, newString, options = {}) {
    const existingContent = await fs.readFile(filePath, 'utf8');

    if (!existingContent.includes(oldString)) {
      throw new Error('Old string not found in file');
    }

    const newContent = existingContent.replace(oldString, newString);
    await fs.writeFile(filePath, newContent, options);

    return { success: true, filePath };
  }

  async deleteFile(filePath) {
    await fs.unlink(filePath);
    return { success: true, filePath };
  }

  async readFile(filePath, options = {}) {
    const content = await fs.readFile(filePath, options);
    return content.toString();
  }
}

// Export for use in other contexts
module.exports = IntegratedFileOperations;

// Create global instance for immediate use
const fileOps = new IntegratedFileOperations();

// Enhanced functions that replace standard file operations
global.writeWithValidation = (filePath, content, options) =>
  fileOps.writeWithValidation(filePath, content, options);

global.editWithValidation = (filePath, oldString, newString, options) =>
  fileOps.editWithValidation(filePath, oldString, newString, options);

global.deleteWithValidation = (filePath) =>
  fileOps.deleteWithValidation(filePath);

global.batchOperationsWithValidation = (operations) =>
  fileOps.batchOperationsWithValidation(operations);

// Export for Claude integration
module.exports.writeWithValidation = global.writeWithValidation;
module.exports.editWithValidation = global.editWithValidation;
module.exports.deleteWithValidation = global.deleteWithValidation;
module.exports.batchOperationsWithValidation = global.batchOperationsWithValidation;