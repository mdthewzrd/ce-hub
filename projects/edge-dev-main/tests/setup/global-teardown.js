const fs = require('fs');
const path = require('path');

/**
 * Global Teardown for Edge.dev Trading Platform Tests
 *
 * This teardown performs the following:
 * 1. Cleans up test artifacts
 * 2. Generates test summary report
 * 3. Archives test results if needed
 * 4. Validates test coverage
 * 5. Sends notifications if configured
 */

async function globalTeardown(config) {
  console.log('🧹 Starting Edge.dev Trading Platform Test Suite Teardown...');

  const teardownStartTime = Date.now();

  try {
    // 1. Generate test summary
    console.log('📊 Generating test summary...');
    await generateTestSummary();

    // 2. Clean up temporary files
    console.log('🗑️  Cleaning up temporary files...');
    cleanupTemporaryFiles();

    // 3. Archive test results if in CI
    if (process.env.CI) {
      console.log('📦 Archiving test results for CI...');
      await archiveTestResults();
    }

    // 4. Generate coverage report
    console.log('📈 Processing test coverage...');
    await processTestCoverage();

    // 5. Cleanup old test artifacts
    console.log('🧽 Cleaning old test artifacts...');
    cleanupOldArtifacts();

    const teardownDuration = Date.now() - teardownStartTime;
    console.log(`✅ Global teardown completed successfully in ${teardownDuration}ms`);

    // Save teardown metadata
    const teardownMetadata = {
      timestamp: new Date().toISOString(),
      duration: teardownDuration,
      environment: process.env.NODE_ENV || 'test',
      platform: process.platform,
      artifactsPreserved: process.env.CI ? true : false
    };

    fs.writeFileSync(
      path.join(__dirname, '../fixtures/teardown-metadata.json'),
      JSON.stringify(teardownMetadata, null, 2)
    );

  } catch (error) {
    console.error('❌ Global teardown encountered issues:', error);
    // Don't throw - teardown issues shouldn't fail the build
  }
}

async function generateTestSummary() {
  try {
    const resultsPath = path.join(process.cwd(), 'test-results/results.json');

    if (!fs.existsSync(resultsPath)) {
      console.log('  ⚠️  No test results file found');
      return;
    }

    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

    const summary = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'test',
      total: results.stats?.total || 0,
      passed: results.stats?.passed || 0,
      failed: results.stats?.failed || 0,
      skipped: results.stats?.skipped || 0,
      duration: results.stats?.duration || 0,
      success: (results.stats?.failed || 0) === 0,
      suites: extractSuiteStats(results)
    };

    const summaryPath = path.join(process.cwd(), 'test-results/test-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

    // Generate human-readable summary
    const readableSummary = generateReadableSummary(summary);
    const readablePath = path.join(process.cwd(), 'test-results/test-summary.md');
    fs.writeFileSync(readablePath, readableSummary);

    console.log(`  ✓ Test summary generated: ${summary.passed}/${summary.total} tests passed`);

    if (summary.failed > 0) {
      console.log(`  ⚠️  ${summary.failed} tests failed`);
    }

  } catch (error) {
    console.log('  ⚠️  Could not generate test summary:', error.message);
  }
}

function extractSuiteStats(results) {
  const suites = {};

  if (results.suites) {
    for (const suite of results.suites) {
      const suiteName = suite.title || 'Unknown Suite';
      suites[suiteName] = {
        total: suite.tests?.length || 0,
        passed: suite.tests?.filter(t => t.outcome === 'passed').length || 0,
        failed: suite.tests?.filter(t => t.outcome === 'failed').length || 0,
        duration: suite.duration || 0
      };
    }
  }

  return suites;
}

function generateReadableSummary(summary) {
  const passRate = summary.total > 0 ? ((summary.passed / summary.total) * 100).toFixed(1) : '0';
  const status = summary.success ? '✅ PASSED' : '❌ FAILED';

  let markdown = `# Edge.dev Trading Platform Test Summary\n\n`;
  markdown += `**Status:** ${status}\n`;
  markdown += `**Timestamp:** ${summary.timestamp}\n`;
  markdown += `**Environment:** ${summary.environment}\n\n`;

  markdown += `## Overall Results\n\n`;
  markdown += `| Metric | Value |\n`;
  markdown += `|--------|-------|\n`;
  markdown += `| Total Tests | ${summary.total} |\n`;
  markdown += `| Passed | ${summary.passed} |\n`;
  markdown += `| Failed | ${summary.failed} |\n`;
  markdown += `| Skipped | ${summary.skipped} |\n`;
  markdown += `| Pass Rate | ${passRate}% |\n`;
  markdown += `| Duration | ${(summary.duration / 1000).toFixed(2)}s |\n\n`;

  if (Object.keys(summary.suites).length > 0) {
    markdown += `## Test Suites\n\n`;
    markdown += `| Suite | Passed | Failed | Total | Duration |\n`;
    markdown += `|-------|--------|--------|-------|----------|\n`;

    for (const [suiteName, stats] of Object.entries(summary.suites)) {
      const suitePassRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : '0';
      markdown += `| ${suiteName} | ${stats.passed} | ${stats.failed} | ${stats.total} | ${(stats.duration / 1000).toFixed(2)}s |\n`;
    }
    markdown += `\n`;
  }

  markdown += `## Test Categories\n\n`;
  markdown += `This test suite covers:\n`;
  markdown += `- 🏠 **Page Load & Basic Functionality**: Core application loading and navigation\n`;
  markdown += `- 📊 **Chart Interactions**: Trading chart visualization and data handling\n`;
  markdown += `- 💼 **Trading Interface**: Trading-specific UI components and workflows\n`;
  markdown += `- 📱 **Mobile Responsiveness**: Cross-device compatibility testing\n`;
  markdown += `- 👁️ **Visual Regression**: UI consistency and visual validation\n`;
  markdown += `- ⚡ **Performance**: Load times and responsiveness testing\n\n`;

  if (summary.failed > 0) {
    markdown += `## ⚠️ Failed Tests\n\n`;
    markdown += `${summary.failed} test(s) failed. Check the detailed HTML report for more information.\n\n`;
  }

  markdown += `---\n`;
  markdown += `*Generated by Edge.dev Playwright Test Suite*\n`;

  return markdown;
}

function cleanupTemporaryFiles() {
  const tempFiles = [
    'test-results/.tmp',
    'tests/fixtures/temp',
    '.playwright-cache'
  ];

  for (const file of tempFiles) {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`  ✓ Cleaned: ${file}`);
    }
  }
}

async function archiveTestResults() {
  // In CI environments, preserve test artifacts
  const artifactsDir = path.join(process.cwd(), 'test-artifacts');
  const resultsDir = path.join(process.cwd(), 'test-results');

  if (fs.existsSync(resultsDir)) {
    if (!fs.existsSync(artifactsDir)) {
      fs.mkdirSync(artifactsDir, { recursive: true });
    }

    // Copy important files
    const filesToArchive = [
      'test-summary.json',
      'test-summary.md',
      'results.json',
      'junit.xml'
    ];

    for (const file of filesToArchive) {
      const srcPath = path.join(resultsDir, file);
      const destPath = path.join(artifactsDir, file);

      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`  ✓ Archived: ${file}`);
      }
    }
  }
}

async function processTestCoverage() {
  // Placeholder for test coverage processing
  // This would integrate with coverage tools like nyc, c8, etc.

  const coverageDir = path.join(process.cwd(), 'coverage');
  if (fs.existsSync(coverageDir)) {
    console.log('  ✓ Test coverage data found');

    // Generate coverage summary
    const coverageSummary = {
      timestamp: new Date().toISOString(),
      message: 'Coverage analysis available in coverage directory',
      location: './coverage/index.html'
    };

    fs.writeFileSync(
      path.join(process.cwd(), 'test-results/coverage-summary.json'),
      JSON.stringify(coverageSummary, null, 2)
    );
  } else {
    console.log('  ⚠️  No coverage data found');
  }
}

function cleanupOldArtifacts() {
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 days
  const now = Date.now();

  const artifactDirs = [
    'test-results/screenshots',
    'test-results/videos',
    'test-results/traces'
  ];

  let cleanedCount = 0;

  for (const dir of artifactDirs) {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) continue;

    const files = fs.readdirSync(fullPath);
    for (const file of files) {
      const filePath = path.join(fullPath, file);
      const stats = fs.statSync(filePath);

      if (now - stats.mtime.getTime() > maxAgeMs) {
        fs.unlinkSync(filePath);
        cleanedCount++;
      }
    }
  }

  if (cleanedCount > 0) {
    console.log(`  ✓ Cleaned ${cleanedCount} old test artifacts`);
  } else {
    console.log('  ✓ No old artifacts to clean');
  }
}

module.exports = globalTeardown;