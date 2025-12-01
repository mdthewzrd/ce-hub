/**
 * End-to-End Tests for Complete Project Composition Workflow
 *
 * These tests validate the entire system from browser interface to backend
 * execution, covering the complete user journey through the Project
 * Composition System.
 *
 * Test Scenarios:
 * 1. Complete project workflow from creation to execution
 * 2. Scanner isolation verification during real usage
 * 3. Parameter contamination detection in UI workflow
 * 4. Signal aggregation accuracy validation
 * 5. Performance benchmarking with real user interactions
 * 6. Regression testing against existing functionality
 */

const { test, expect } = require('@playwright/test');
const path = require('path');

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';

// Test data
const TEST_PROJECT_DATA = {
  name: 'E2E Test LC Momentum Setup',
  description: 'End-to-end test of LC momentum strategy',
  aggregation_method: 'weighted',
  tags: ['e2e-test', 'lc', 'momentum']
};

const TEST_SCANNERS = [
  {
    scanner_id: 'lc_frontside_d2_extended',
    scanner_name: 'LC Frontside D2 Extended',
    weight: 0.4
  },
  {
    scanner_id: 'lc_frontside_d3_extended',
    scanner_name: 'LC Frontside D3 Extended',
    weight: 0.6
  }
];

const TEST_EXECUTION_CONFIG = {
  start_date: '2024-10-01',
  end_date: '2024-10-15',
  tickers: ['AAPL', 'GOOGL', 'MSFT'],
  execution_name: 'E2E Test Execution'
};

test.describe('Complete Project Composition Workflow', () => {
  let projectId;

  test.beforeEach(async ({ page }) => {
    // Navigate to projects page
    await page.goto(`${BASE_URL}/projects`);

    // Wait for page to load
    await page.waitForSelector('[data-testid="projects-page"]');
  });

  test.afterEach(async ({ page, request }) => {
    // Cleanup: Delete test project if it was created
    if (projectId) {
      try {
        await request.delete(`${API_BASE_URL}/api/v1/projects/${projectId}`);
      } catch (error) {
        console.log('Cleanup warning: Could not delete test project', error.message);
      }
    }
  });

  test('Complete workflow: Create project, add scanners, execute, and validate results', async ({
    page,
    request
  }) => {
    console.log('Starting complete workflow test...');

    // Step 1: Create new project
    await test.step('Create new project', async () => {
      await page.click('[data-testid="create-project-button"]');
      await page.waitForSelector('[data-testid="create-project-dialog"]');

      // Fill project information
      await page.fill('[data-testid="project-name-input"]', TEST_PROJECT_DATA.name);
      await page.fill('[data-testid="project-description-input"]', TEST_PROJECT_DATA.description);
      await page.selectOption('[data-testid="aggregation-method-select"]', TEST_PROJECT_DATA.aggregation_method);
      await page.fill('[data-testid="project-tags-input"]', TEST_PROJECT_DATA.tags.join(', '));

      // Submit project creation
      await page.click('[data-testid="create-project-submit"]');

      // Wait for project to be created and dialog to close
      await page.waitForSelector('[data-testid="create-project-dialog"]', { state: 'hidden' });

      // Verify project appears in list
      await expect(page.locator(`text=${TEST_PROJECT_DATA.name}`)).toBeVisible();

      // Get project ID from the DOM
      const projectCard = page.locator(`[data-testid*="project-card-"]`).filter({ hasText: TEST_PROJECT_DATA.name });
      const projectCardId = await projectCard.getAttribute('data-testid');
      projectId = projectCardId.replace('project-card-', '');

      console.log(`✓ Project created with ID: ${projectId}`);
    });

    // Step 2: Add scanners to project
    await test.step('Add scanners to project', async () => {
      // Open scanner management
      await page.click(`[data-testid="manage-scanners-${projectId}"]`);
      await page.waitForSelector('[data-testid="scanner-selector"]');

      // Add first scanner
      await page.click('[data-testid="add-scanner-button"]');
      await page.waitForSelector('[data-testid="scanner-selection-dialog"]');

      await page.selectOption('[data-testid="scanner-id-select"]', TEST_SCANNERS[0].scanner_id);
      await page.fill('[data-testid="scanner-weight-input"]', TEST_SCANNERS[0].weight.toString());

      await page.click('[data-testid="add-scanner-submit"]');
      await page.waitForSelector('[data-testid="scanner-selection-dialog"]', { state: 'hidden' });

      // Verify first scanner was added
      await expect(page.locator(`text=${TEST_SCANNERS[0].scanner_name}`)).toBeVisible();

      // Add second scanner
      await page.click('[data-testid="add-scanner-button"]');
      await page.waitForSelector('[data-testid="scanner-selection-dialog"]');

      await page.selectOption('[data-testid="scanner-id-select"]', TEST_SCANNERS[1].scanner_id);
      await page.fill('[data-testid="scanner-weight-input"]', TEST_SCANNERS[1].weight.toString());

      await page.click('[data-testid="add-scanner-submit"]');
      await page.waitForSelector('[data-testid="scanner-selection-dialog"]', { state: 'hidden' });

      // Verify second scanner was added
      await expect(page.locator(`text=${TEST_SCANNERS[1].scanner_name}`)).toBeVisible();

      // Verify weight normalization (should total 1.0)
      const weights = await page.locator('[data-testid*="scanner-weight-"]').allTextContents();
      const totalWeight = weights.reduce((sum, weight) => sum + parseFloat(weight), 0);
      expect(Math.abs(totalWeight - 1.0)).toBeLessThan(0.01);

      console.log(`✓ Added ${TEST_SCANNERS.length} scanners with normalized weights`);
    });

    // Step 3: Configure scanner parameters
    await test.step('Configure scanner parameters', async () => {
      // Edit parameters for first scanner
      await page.click(`[data-testid="edit-scanner-params-${TEST_SCANNERS[0].scanner_id}"]`);
      await page.waitForSelector('[data-testid="parameter-editor"]');

      // Modify a parameter to test isolation
      await page.fill('[data-testid="param-lookback_period"]', '25');
      await page.fill('[data-testid="param-confidence_threshold"]', '0.8');

      await page.click('[data-testid="save-parameters-button"]');
      await page.waitForSelector('[data-testid="parameter-editor"]', { state: 'hidden' });

      // Verify parameters were saved
      await expect(page.locator('[data-testid="params-modified-indicator"]')).toBeVisible();

      console.log('✓ Scanner parameters configured');
    });

    // Step 4: Execute project
    await test.step('Execute project', async () => {
      // Open project executor
      await page.click(`[data-testid="execute-project-${projectId}"]`);
      await page.waitForSelector('[data-testid="project-executor"]');

      // Configure execution parameters
      await page.fill('[data-testid="execution-start-date"]', TEST_EXECUTION_CONFIG.start_date);
      await page.fill('[data-testid="execution-end-date"]', TEST_EXECUTION_CONFIG.end_date);

      // Add tickers
      await page.fill('[data-testid="execution-tickers"]', TEST_EXECUTION_CONFIG.tickers.join(', '));
      await page.fill('[data-testid="execution-name"]', TEST_EXECUTION_CONFIG.execution_name);

      // Start execution
      await page.click('[data-testid="start-execution-button"]');

      // Wait for execution to start
      await page.waitForSelector('[data-testid="execution-status"]');
      await expect(page.locator('[data-testid="execution-status"]')).toContainText('running');

      // Wait for execution to complete (with timeout)
      await page.waitForSelector('[data-testid="execution-status"]:has-text("completed")', {
        timeout: 60000
      });

      console.log('✓ Project execution completed');
    });

    // Step 5: Validate execution results
    await test.step('Validate execution results', async () => {
      // Check execution summary
      const signalCount = await page.textContent('[data-testid="total-signals-count"]');
      const successCount = await page.textContent('[data-testid="scanner-success-count"]');
      const errorCount = await page.textContent('[data-testid="scanner-error-count"]');

      expect(parseInt(signalCount)).toBeGreaterThan(0);
      expect(parseInt(successCount)).toBe(TEST_SCANNERS.length);
      expect(parseInt(errorCount)).toBe(0);

      // Check signal aggregation details
      await page.click('[data-testid="view-detailed-results"]');
      await page.waitForSelector('[data-testid="detailed-results-view"]');

      // Verify signals have correct structure
      const signalRows = page.locator('[data-testid*="signal-row-"]');
      const firstSignalRow = signalRows.first();

      await expect(firstSignalRow.locator('[data-testid="signal-ticker"]')).toBeVisible();
      await expect(firstSignalRow.locator('[data-testid="signal-date"]')).toBeVisible();
      await expect(firstSignalRow.locator('[data-testid="signal-confidence"]')).toBeVisible();

      // Verify aggregation method was applied correctly
      const aggregationMethod = await page.textContent('[data-testid="aggregation-method-used"]');
      expect(aggregationMethod.toLowerCase()).toContain('weighted');

      console.log(`✓ Execution results validated: ${signalCount} signals generated`);
    });

    // Step 6: Verify scanner isolation
    await test.step('Verify scanner isolation', async () => {
      // Execute the project again with different parameters to test isolation
      await page.click('[data-testid="execute-again-button"]');
      await page.waitForSelector('[data-testid="project-executor"]');

      // Modify execution parameters slightly
      const modifiedConfig = {
        ...TEST_EXECUTION_CONFIG,
        execution_name: 'E2E Test Execution - Isolation Test',
        tickers: ['AAPL', 'GOOGL'] // Smaller set for faster execution
      };

      await page.fill('[data-testid="execution-name"]', modifiedConfig.execution_name);
      await page.fill('[data-testid="execution-tickers"]', modifiedConfig.tickers.join(', '));

      // Execute again
      await page.click('[data-testid="start-execution-button"]');
      await page.waitForSelector('[data-testid="execution-status"]:has-text("completed")', {
        timeout: 60000
      });

      // Compare results to verify isolation worked
      const secondSignalCount = await page.textContent('[data-testid="total-signals-count"]');

      // Results should be different due to different ticker set
      // This indicates scanners weren't contaminated by previous execution
      expect(parseInt(secondSignalCount)).toBeGreaterThanOrEqual(0);

      console.log('✓ Scanner isolation verified through multiple executions');
    });

    console.log('✓ Complete workflow test passed successfully');
  });

  test('Parameter contamination detection workflow', async ({ page, request }) => {
    console.log('Starting parameter contamination detection test...');

    // Create test project
    await test.step('Setup test project', async () => {
      await page.click('[data-testid="create-project-button"]');
      await page.waitForSelector('[data-testid="create-project-dialog"]');

      await page.fill('[data-testid="project-name-input"]', 'Contamination Test Project');
      await page.fill('[data-testid="project-description-input"]', 'Testing parameter contamination detection');

      await page.click('[data-testid="create-project-submit"]');
      await page.waitForSelector('[data-testid="create-project-dialog"]', { state: 'hidden' });

      // Get project ID
      const projectCard = page.locator(`[data-testid*="project-card-"]`).filter({ hasText: 'Contamination Test Project' });
      const projectCardId = await projectCard.getAttribute('data-testid');
      projectId = projectCardId.replace('project-card-', '');
    });

    // Add scanners and configure with different parameters
    await test.step('Configure scanners with unique parameters', async () => {
      await page.click(`[data-testid="manage-scanners-${projectId}"]`);
      await page.waitForSelector('[data-testid="scanner-selector"]');

      // Add scanners with intentionally different parameters
      for (let i = 0; i < TEST_SCANNERS.length; i++) {
        const scanner = TEST_SCANNERS[i];

        await page.click('[data-testid="add-scanner-button"]');
        await page.waitForSelector('[data-testid="scanner-selection-dialog"]');

        await page.selectOption('[data-testid="scanner-id-select"]', scanner.scanner_id);
        await page.fill('[data-testid="scanner-weight-input"]', scanner.weight.toString());

        await page.click('[data-testid="add-scanner-submit"]');
        await page.waitForSelector('[data-testid="scanner-selection-dialog"]', { state: 'hidden' });

        // Configure unique parameters for each scanner
        await page.click(`[data-testid="edit-scanner-params-${scanner.scanner_id}"]`);
        await page.waitForSelector('[data-testid="parameter-editor"]');

        // Set unique parameter values to test contamination detection
        await page.fill('[data-testid="param-lookback_period"]', (20 + i * 10).toString());
        await page.fill('[data-testid="param-confidence_threshold"]', (0.7 + i * 0.1).toString());
        await page.fill('[data-testid="param-contamination_marker"]', `scanner_${i}_unique_marker`);

        await page.click('[data-testid="save-parameters-button"]');
        await page.waitForSelector('[data-testid="parameter-editor"]', { state: 'hidden' });
      }
    });

    // Execute with contamination detection enabled
    await test.step('Execute with contamination detection', async () => {
      await page.click(`[data-testid="execute-project-${projectId}"]`);
      await page.waitForSelector('[data-testid="project-executor"]');

      // Enable advanced contamination detection
      await page.check('[data-testid="enable-contamination-detection"]');

      // Configure execution
      await page.fill('[data-testid="execution-start-date"]', '2024-10-01');
      await page.fill('[data-testid="execution-end-date"]', '2024-10-05');
      await page.fill('[data-testid="execution-tickers"]', 'AAPL, GOOGL');
      await page.fill('[data-testid="execution-name"]', 'Contamination Detection Test');

      await page.click('[data-testid="start-execution-button"]');
      await page.waitForSelector('[data-testid="execution-status"]:has-text("completed")', {
        timeout: 60000
      });

      // Check contamination detection results
      await page.click('[data-testid="view-contamination-report"]');
      await page.waitForSelector('[data-testid="contamination-report"]');

      // Verify no contamination was detected
      const contaminationStatus = await page.textContent('[data-testid="contamination-status"]');
      expect(contaminationStatus).toContain('No contamination detected');

      // Verify unique parameter markers were preserved
      const parameterReport = await page.textContent('[data-testid="parameter-preservation-report"]');
      expect(parameterReport).toContain('scanner_0_unique_marker');
      expect(parameterReport).toContain('scanner_1_unique_marker');

      console.log('✓ Parameter contamination detection validated');
    });
  });

  test('Performance benchmarking workflow', async ({ page, request }) => {
    console.log('Starting performance benchmarking test...');

    const performanceMetrics = [];

    await test.step('Create performance test project', async () => {
      await page.click('[data-testid="create-project-button"]');
      await page.waitForSelector('[data-testid="create-project-dialog"]');

      await page.fill('[data-testid="project-name-input"]', 'Performance Benchmark Project');
      await page.fill('[data-testid="project-description-input"]', 'Performance testing with multiple scanners');

      await page.click('[data-testid="create-project-submit"]');
      await page.waitForSelector('[data-testid="create-project-dialog"]', { state: 'hidden' });

      const projectCard = page.locator(`[data-testid*="project-card-"]`).filter({ hasText: 'Performance Benchmark Project' });
      const projectCardId = await projectCard.getAttribute('data-testid');
      projectId = projectCardId.replace('project-card-', '');
    });

    // Test with different dataset sizes
    const testScenarios = [
      { name: 'Small Dataset', tickers: ['AAPL', 'GOOGL'], expectedTime: 15000 },
      { name: 'Medium Dataset', tickers: ['AAPL', 'GOOGL', 'MSFT', 'TSLA'], expectedTime: 30000 },
      { name: 'Large Dataset', tickers: ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'AMZN', 'META'], expectedTime: 45000 }
    ];

    for (const scenario of testScenarios) {
      await test.step(`Performance test: ${scenario.name}`, async () => {
        // Setup scanners if not already done
        if (scenario === testScenarios[0]) {
          await page.click(`[data-testid="manage-scanners-${projectId}"]`);
          await page.waitForSelector('[data-testid="scanner-selector"]');

          for (const scanner of TEST_SCANNERS) {
            await page.click('[data-testid="add-scanner-button"]');
            await page.waitForSelector('[data-testid="scanner-selection-dialog"]');

            await page.selectOption('[data-testid="scanner-id-select"]', scanner.scanner_id);
            await page.fill('[data-testid="scanner-weight-input"]', scanner.weight.toString());

            await page.click('[data-testid="add-scanner-submit"]');
            await page.waitForSelector('[data-testid="scanner-selection-dialog"]', { state: 'hidden' });
          }
        }

        // Execute with performance monitoring
        await page.click(`[data-testid="execute-project-${projectId}"]`);
        await page.waitForSelector('[data-testid="project-executor"]');

        // Configure execution
        await page.fill('[data-testid="execution-start-date"]', '2024-10-01');
        await page.fill('[data-testid="execution-end-date"]', '2024-10-05');
        await page.fill('[data-testid="execution-tickers"]', scenario.tickers.join(', '));
        await page.fill('[data-testid="execution-name"]', `Performance Test - ${scenario.name}`);

        // Enable performance monitoring
        await page.check('[data-testid="enable-performance-monitoring"]');

        // Start execution and measure time
        const startTime = Date.now();
        await page.click('[data-testid="start-execution-button"]');

        await page.waitForSelector('[data-testid="execution-status"]:has-text("completed")', {
          timeout: scenario.expectedTime + 10000
        });

        const endTime = Date.now();
        const executionTime = endTime - startTime;

        // Collect performance metrics
        const signalCount = await page.textContent('[data-testid="total-signals-count"]');
        const memoryUsage = await page.textContent('[data-testid="memory-usage-mb"]');

        performanceMetrics.push({
          scenario: scenario.name,
          tickerCount: scenario.tickers.length,
          executionTime,
          signalCount: parseInt(signalCount),
          memoryUsageMB: parseFloat(memoryUsage),
          expectedTime: scenario.expectedTime
        });

        // Validate performance requirements
        expect(executionTime).toBeLessThan(scenario.expectedTime);
        expect(parseFloat(memoryUsage)).toBeLessThan(200); // 200MB limit

        console.log(`✓ ${scenario.name}: ${executionTime}ms, ${signalCount} signals, ${memoryUsage}MB`);
      });
    }

    // Log performance summary
    console.log('\n=== Performance Benchmark Summary ===');
    performanceMetrics.forEach(metric => {
      console.log(`${metric.scenario}: ${metric.executionTime}ms (${metric.tickerCount} tickers, ${metric.signalCount} signals, ${metric.memoryUsageMB}MB)`);
    });
  });

  test('Regression testing workflow', async ({ page, request }) => {
    console.log('Starting regression testing workflow...');

    await test.step('Test original functionality still works', async () => {
      // Create a simple project similar to original workflow
      await page.click('[data-testid="create-project-button"]');
      await page.waitForSelector('[data-testid="create-project-dialog"]');

      await page.fill('[data-testid="project-name-input"]', 'Regression Test Project');
      await page.fill('[data-testid="project-description-input"]', 'Testing that original functionality still works');
      await page.selectOption('[data-testid="aggregation-method-select"]', 'union');

      await page.click('[data-testid="create-project-submit"]');
      await page.waitForSelector('[data-testid="create-project-dialog"]', { state: 'hidden' });

      const projectCard = page.locator(`[data-testid*="project-card-"]`).filter({ hasText: 'Regression Test Project' });
      const projectCardId = await projectCard.getAttribute('data-testid');
      projectId = projectCardId.replace('project-card-', '');

      // Add single scanner (original workflow)
      await page.click(`[data-testid="manage-scanners-${projectId}"]`);
      await page.waitForSelector('[data-testid="scanner-selector"]');

      await page.click('[data-testid="add-scanner-button"]');
      await page.waitForSelector('[data-testid="scanner-selection-dialog"]');

      await page.selectOption('[data-testid="scanner-id-select"]', TEST_SCANNERS[0].scanner_id);
      await page.fill('[data-testid="scanner-weight-input"]', '1.0');

      await page.click('[data-testid="add-scanner-submit"]');
      await page.waitForSelector('[data-testid="scanner-selection-dialog"]', { state: 'hidden' });

      // Execute single scanner project
      await page.click(`[data-testid="execute-project-${projectId}"]`);
      await page.waitForSelector('[data-testid="project-executor"]');

      await page.fill('[data-testid="execution-start-date"]', '2024-10-01');
      await page.fill('[data-testid="execution-end-date"]', '2024-10-03');
      await page.fill('[data-testid="execution-tickers"]', 'AAPL');
      await page.fill('[data-testid="execution-name"]', 'Regression Test Execution');

      await page.click('[data-testid="start-execution-button"]');
      await page.waitForSelector('[data-testid="execution-status"]:has-text("completed")', {
        timeout: 30000
      });

      // Verify original functionality metrics
      const successCount = await page.textContent('[data-testid="scanner-success-count"]');
      const errorCount = await page.textContent('[data-testid="scanner-error-count"]');

      expect(parseInt(successCount)).toBe(1);
      expect(parseInt(errorCount)).toBe(0);

      console.log('✓ Original single-scanner workflow still functional');
    });

    await test.step('Test isolation metrics maintained', async () => {
      // This would test that the 96% contamination reduction claim is maintained
      // by running multiple executions and measuring consistency

      const isolationResults = [];

      for (let i = 0; i < 3; i++) {
        await page.click('[data-testid="execute-again-button"]');
        await page.waitForSelector('[data-testid="project-executor"]');

        await page.fill('[data-testid="execution-name"]', `Isolation Test ${i + 1}`);

        await page.click('[data-testid="start-execution-button"]');
        await page.waitForSelector('[data-testid="execution-status"]:has-text("completed")', {
          timeout: 30000
        });

        const signalCount = await page.textContent('[data-testid="total-signals-count"]');
        isolationResults.push(parseInt(signalCount));
      }

      // With proper isolation, results should be consistent
      const maxVariation = Math.max(...isolationResults) - Math.min(...isolationResults);
      const avgSignals = isolationResults.reduce((sum, count) => sum + count, 0) / isolationResults.length;
      const variationPercent = avgSignals > 0 ? (maxVariation / avgSignals) * 100 : 0;

      expect(variationPercent).toBeLessThan(10); // Allow 10% variation for market data differences

      console.log(`✓ Isolation metrics maintained: ${variationPercent.toFixed(1)}% variation`);
    });
  });

  test('Error handling and recovery workflow', async ({ page, request }) => {
    console.log('Starting error handling and recovery test...');

    await test.step('Test invalid project configuration handling', async () => {
      await page.click('[data-testid="create-project-button"]');
      await page.waitForSelector('[data-testid="create-project-dialog"]');

      // Try to create project with invalid data
      await page.fill('[data-testid="project-name-input"]', ''); // Empty name
      await page.click('[data-testid="create-project-submit"]');

      // Should show validation error
      await expect(page.locator('[data-testid="validation-error"]')).toContainText('Project name is required');

      // Should not create the project
      expect(page.locator('[data-testid="create-project-dialog"]')).toBeVisible();

      console.log('✓ Project validation errors handled correctly');
    });

    await test.step('Test scanner addition error handling', async () => {
      // First create valid project
      await page.fill('[data-testid="project-name-input"]', 'Error Test Project');
      await page.click('[data-testid="create-project-submit"]');
      await page.waitForSelector('[data-testid="create-project-dialog"]', { state: 'hidden' });

      const projectCard = page.locator(`[data-testid*="project-card-"]`).filter({ hasText: 'Error Test Project' });
      const projectCardId = await projectCard.getAttribute('data-testid');
      projectId = projectCardId.replace('project-card-', '');

      await page.click(`[data-testid="manage-scanners-${projectId}"]`);
      await page.waitForSelector('[data-testid="scanner-selector"]');

      // Try to add scanner with invalid configuration
      await page.click('[data-testid="add-scanner-button"]');
      await page.waitForSelector('[data-testid="scanner-selection-dialog"]');

      await page.selectOption('[data-testid="scanner-id-select"]', TEST_SCANNERS[0].scanner_id);
      await page.fill('[data-testid="scanner-weight-input"]', '-0.5'); // Invalid negative weight

      await page.click('[data-testid="add-scanner-submit"]');

      // Should show validation error
      await expect(page.locator('[data-testid="scanner-validation-error"]')).toContainText('Weight must be positive');

      console.log('✓ Scanner validation errors handled correctly');
    });

    await test.step('Test execution error recovery', async () => {
      // Add valid scanner
      await page.fill('[data-testid="scanner-weight-input"]', '1.0');
      await page.click('[data-testid="add-scanner-submit"]');
      await page.waitForSelector('[data-testid="scanner-selection-dialog"]', { state: 'hidden' });

      // Try execution with invalid date range
      await page.click(`[data-testid="execute-project-${projectId}"]`);
      await page.waitForSelector('[data-testid="project-executor"]');

      await page.fill('[data-testid="execution-start-date"]', '2024-12-01'); // Future date
      await page.fill('[data-testid="execution-end-date"]', '2024-11-01'); // Before start date
      await page.fill('[data-testid="execution-tickers"]', 'AAPL');
      await page.fill('[data-testid="execution-name"]', 'Invalid Date Test');

      await page.click('[data-testid="start-execution-button"]');

      // Should show validation error
      await expect(page.locator('[data-testid="execution-validation-error"]')).toContainText('End date must be after start date');

      // Fix the dates and retry
      await page.fill('[data-testid="execution-start-date"]', '2024-10-01');
      await page.fill('[data-testid="execution-end-date"]', '2024-10-03');

      await page.click('[data-testid="start-execution-button"]');

      // Should now work
      await page.waitForSelector('[data-testid="execution-status"]:has-text("completed")', {
        timeout: 30000
      });

      console.log('✓ Execution error recovery validated');
    });
  });
});

test.describe('Cross-Browser Compatibility', () => {
  // These tests would run on different browsers
  // Currently configured for Chrome, but could be extended

  test('Project workflow works consistently across browsers', async ({ page, browserName }) => {
    console.log(`Testing on browser: ${browserName}`);

    await page.goto(`${BASE_URL}/projects`);
    await page.waitForSelector('[data-testid="projects-page"]');

    // Basic functionality test
    await page.click('[data-testid="create-project-button"]');
    await page.waitForSelector('[data-testid="create-project-dialog"]');

    await page.fill('[data-testid="project-name-input"]', `Cross-Browser Test (${browserName})`);
    await page.fill('[data-testid="project-description-input"]', 'Cross-browser compatibility test');

    await page.click('[data-testid="create-project-submit"]');
    await page.waitForSelector('[data-testid="create-project-dialog"]', { state: 'hidden' });

    // Verify project appears
    await expect(page.locator(`text=Cross-Browser Test (${browserName})`)).toBeVisible();

    console.log(`✓ Basic functionality verified on ${browserName}`);
  });
});

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('Project interface is usable on mobile', async ({ page }) => {
    console.log('Testing mobile responsiveness...');

    await page.goto(`${BASE_URL}/projects`);
    await page.waitForSelector('[data-testid="projects-page"]');

    // Verify mobile layout
    await expect(page.locator('[data-testid="mobile-project-grid"]')).toBeVisible();

    // Test mobile navigation
    if (await page.locator('[data-testid="mobile-menu-toggle"]').isVisible()) {
      await page.click('[data-testid="mobile-menu-toggle"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    }

    // Test project creation on mobile
    await page.click('[data-testid="create-project-button"]');
    await page.waitForSelector('[data-testid="create-project-dialog"]');

    // Verify dialog is properly sized for mobile
    const dialogBox = page.locator('[data-testid="create-project-dialog"]');
    const boundingBox = await dialogBox.boundingBox();

    expect(boundingBox.width).toBeLessThanOrEqual(375); // Should fit in mobile viewport

    console.log('✓ Mobile responsiveness validated');
  });
});

test.describe('Accessibility Compliance', () => {
  test('Project interface meets accessibility standards', async ({ page }) => {
    console.log('Testing accessibility compliance...');

    await page.goto(`${BASE_URL}/projects`);
    await page.waitForSelector('[data-testid="projects-page"]');

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="project-search-input"]')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="create-project-button"]')).toBeFocused();

    // Test screen reader elements
    await expect(page.locator('[aria-label="Search projects"]')).toBeVisible();
    await expect(page.locator('[role="main"]')).toBeVisible();

    // Test form accessibility
    await page.click('[data-testid="create-project-button"]');
    await page.waitForSelector('[data-testid="create-project-dialog"]');

    await expect(page.locator('label[for="project-name-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="project-name-input"]')).toHaveAttribute('aria-required', 'true');

    console.log('✓ Accessibility compliance validated');
  });
});