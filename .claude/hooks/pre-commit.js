#!/usr/bin/env node

/**
 * CE-Hub Pre-Commit Hook
 *
 * Automatically runs UX validation before any significant changes are committed,
 * ensuring Claude agents always validate their work before making changes permanent.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

class PreCommitValidator {
  constructor() {
    this.ceHubRoot = path.resolve(__dirname, '../..');
    this.edgeDevPath = path.join(this.ceHubRoot, 'projects/edge-dev-main');
  }

  async run() {
    console.log('🔒 CE-Hub Pre-Commit Validation');
    console.log('=' .repeat(50));

    try {
      // Check what files changed
      const changedFiles = this.getChangedFiles();

      if (this.shouldRunValidation(changedFiles)) {
        console.log('📁 Changed files detected, running UX validation...');

        // Run automatic UX validation
        const result = await this.runAutomaticValidation();

        if (!result.shouldProceed) {
          console.log('\n❌ VALIDATION FAILED - Commit blocked');
          console.log('Please fix the issues before committing:');
          result.issues.forEach(issue => console.log(`  - ${issue}`));
          console.log('\nRecommendations:');
          result.recommendations.forEach(rec => console.log(`  - ${rec}`));

          process.exit(1);
        }

        console.log('\n✅ VALIDATION PASSED - Proceeding with commit');
      } else {
        console.log('📝 No significant changes detected, skipping validation');
      }

    } catch (error) {
      console.error('❌ Pre-commit validation failed:', error.message);
      process.exit(1);
    }
  }

  getChangedFiles() {
    try {
      // Get staged files
      const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' });
      const modified = execSync('git diff --name-only', { encoding: 'utf8' });

      return {
        staged: staged.trim().split('\n').filter(f => f),
        modified: modified.trim().split('\n').filter(f => f)
      };
    } catch (error) {
      // If not in a git repo, check for recent file changes
      return {
        staged: [],
        modified: this.getRecentChanges()
      };
    }
  }

  getRecentChanges() {
    const recentFiles = [];
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    // Check for recent changes in key directories
    const keyDirs = [
      'src',
      'public',
      'components',
      'pages',
      'styles',
      'scripts',
      'config'
    ];

    try {
      keyDirs.forEach(dir => {
        const fullPath = path.join(this.edgeDevPath, dir);
        if (fs.existsSync(fullPath)) {
          const files = this.getRecentFilesInDir(fullPath, oneHourAgo);
          recentFiles.push(...files);
        }
      });
    } catch (error) {
      // Ignore errors in file system checks
    }

    return recentFiles;
  }

  getRecentFilesInDir(dirPath, since) {
    const recentFiles = [];

    try {
      const files = fs.readdirSync(dirPath, { withFileTypes: true });

      files.forEach(file => {
        if (file.isFile()) {
          const filePath = path.join(dirPath, file.name);
          const stats = fs.statSync(filePath);

          if (stats.mtime.getTime() > since) {
            recentFiles.push(path.relative(this.edgeDevPath, filePath));
          }
        }
      });
    } catch (error) {
      // Ignore errors
    }

    return recentFiles;
  }

  shouldRunValidation(changedFiles) {
    const allChangedFiles = [...changedFiles.staged, ...changedFiles.modified];

    // Check if any important files changed
    const significantPatterns = [
      /\.tsx?$/,
      /\.jsx?$/,
      /\.s?css$/,
      /\.module\.css$/,
      /tailwind\.config/,
      /next\.config/,
      /\.tsconfig$/,
      /src\//,
      /components\//,
      /pages\//,
      /public\//
    ];

    return allChangedFiles.some(file =>
      significantPatterns.some(pattern => pattern.test(file))
    );
  }

  async runAutomaticValidation() {
    const AutomaticUXValidation = require('./validate-ux.js');
    const validator = new AutomaticUXValidation();

    // Run quick validation for pre-commit
    return await validator.runValidation('quick');
  }
}

// Run pre-commit validation
if (require.main === module) {
  const validator = new PreCommitValidator();
  validator.run()
    .then(() => {
      console.log('✅ Pre-commit validation completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Pre-commit validation failed:', error);
      process.exit(1);
    });
}

module.exports = PreCommitValidator;