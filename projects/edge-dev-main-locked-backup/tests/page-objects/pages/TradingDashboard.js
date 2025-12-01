/**
 * Trading Dashboard Page Object Model
 *
 * Represents the main trading dashboard interface with methods for
 * interacting with all major components of the Edge.dev platform.
 */

class TradingDashboard {
  constructor(page) {
    this.page = page;

    // Main page elements
    this.logo = page.locator('h1:has-text("Traderra"), [data-testid="app-logo"]');
    this.uploadCodeButton = page.locator('button:has-text("Upload Strategy"), [data-testid="upload-code-button"]');
    this.runScanButton = page.locator('button:has-text("Run Scan"), [data-testid="run-scan"]');
    this.viewToggle = page.locator('[data-testid="view-toggle"], .button-group-professional');

    // Sidebar elements
    this.sidebar = page.locator('.w-72, [data-testid="sidebar"]');
    this.projectsList = page.locator('.sidebar-professional, [data-testid="projects-list"]');
    this.projectItems = page.locator('.sidebar-project-item, [data-testid="project-item"]');

    // Header elements
    this.dashboardHeader = page.locator('.dashboard-header, [data-testid="dashboard-header"]');
    this.projectTitle = page.locator('h2:has-text("Scanner"), [data-testid="project-title"]');

    // Scan results table
    this.scanResultsTable = page.locator('.studio-table, [data-testid="scan-results-table"]');
    this.scanResultRows = page.locator('.studio-table tbody tr, [data-testid="scan-result-row"]');
    this.tickerCells = page.locator('td:nth-child(1), [data-testid="ticker-cell"]');

    // Statistics panel
    this.statisticsPanel = page.locator('.studio-card:has(.section-title:has-text("Statistics")), [data-testid="statistics-panel"]');
    this.metricCards = page.locator('.studio-metric-card, [data-testid="metric-card"]');

    // Chart container
    this.chartContainer = page.locator('.chart-container, [data-testid="chart-container"]');
    this.chartSection = page.locator('.chart-section, [data-testid="chart-section"]');
    this.timeframeButtons = page.locator('button[data-timeframe], .timeframe-button');

    // Modal dialogs
    this.modal = page.locator('.modal-content, [data-testid="modal"]');
    this.uploadModal = page.locator('[data-testid="upload-choice-modal"]');
    this.projectCreationModal = page.locator('.modal-content:has-text("Create New Project")');

    // Loading states
    this.loadingSpinner = page.locator('.studio-spinner, [data-testid="loading"]');
    this.chartLoadingState = page.locator('.chart-container:has-text("Loading")');
  }

  /**
   * Navigation and Page Loading
   */
  async goto() {
    await this.page.goto('/');
    await this.waitForPageLoad();
  }

  async waitForPageLoad() {
    // Wait for critical elements to be visible
    await this.logo.waitFor({ state: 'visible', timeout: 15000 });
    await this.sidebar.waitFor({ state: 'visible', timeout: 10000 });

    // Wait for network idle to ensure data has loaded
    await this.page.waitForLoadState('networkidle', { timeout: 20000 });

    // Additional wait for any dynamic content
    await this.page.waitForTimeout(1000);
  }

  async isPageLoaded() {
    try {
      await this.logo.waitFor({ state: 'visible', timeout: 5000 });
      await this.sidebar.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Project Management
   */
  async getProjects() {
    await this.projectItems.first().waitFor({ state: 'visible', timeout: 10000 });
    const projects = await this.projectItems.all();
    const projectData = [];

    for (const project of projects) {
      const fullText = await project.textContent();
      const isActive = await project.evaluate(el =>
        el.classList.contains('active') ||
        el.querySelector('.active') !== null
      );

      // Extract clean project name without status information
      const cleanName = fullText?.trim()
        .replace(/Active\s*•\s*Ready$/i, '')
        .replace(/Inactive$/i, '')
        .trim();

      projectData.push({
        element: project,
        name: cleanName,
        active: isActive
      });
    }

    return projectData;
  }

  async selectProject(projectName) {
    const project = this.projectItems.filter({ hasText: projectName });
    await project.click();
    await this.page.waitForTimeout(1000); // Wait for project loading
  }

  async getActiveProject() {
    const projects = await this.projectItems.all();

    for (const project of projects) {
      const isActive = await project.evaluate(el =>
        el.classList.contains('active') ||
        el.querySelector('.active') !== null
      );

      if (isActive) {
        const fullText = await project.textContent();
        // Extract clean project name without status information
        const cleanName = fullText?.trim()
          .replace(/Active\s*•\s*Ready$/i, '')
          .replace(/Inactive$/i, '')
          .trim();
        return cleanName;
      }
    }

    // Fallback: return first project if no active found
    const firstProject = this.projectItems.first();
    const fullText = await firstProject.textContent();
    const cleanName = fullText?.trim()
      .replace(/Active\s*•\s*Ready$/i, '')
      .replace(/Inactive$/i, '')
      .trim();
    return cleanName;
  }

  /**
   * Scan Operations
   */
  async runScan() {
    const isDisabled = await this.runScanButton.isDisabled();
    if (isDisabled) {
      throw new Error('Run Scan button is disabled');
    }

    await this.runScanButton.click();

    // Wait for scan to start (button becomes disabled or shows "Running...")
    await this.page.waitForFunction(() => {
      const button = document.querySelector('button:has-text("Run Scan"), [data-testid="run-scan"]');
      return button && (button.disabled || button.textContent.includes('Running'));
    }, { timeout: 5000 });

    // Wait for scan to complete
    await this.page.waitForFunction(() => {
      const button = document.querySelector('button:has-text("Run Scan"), [data-testid="run-scan"]');
      return button && !button.disabled && !button.textContent.includes('Running');
    }, { timeout: 30000 });

    await this.page.waitForTimeout(1000); // Additional wait for results to render
  }

  async getScanResults() {
    // Wait for results table to be visible
    await this.scanResultsTable.waitFor({ state: 'visible', timeout: 10000 });

    const rows = await this.scanResultRows.all();
    const results = [];

    for (const row of rows) {
      const cells = await row.locator('td').all();
      if (cells.length >= 4) {
        const ticker = await cells[0].textContent();
        const gapPercent = await cells[1].textContent();
        const volume = await cells[2].textContent();
        const rMultiple = await cells[3].textContent();

        results.push({
          ticker: ticker?.trim(),
          gapPercent: gapPercent?.trim(),
          volume: volume?.trim(),
          rMultiple: rMultiple?.trim(),
          element: row
        });
      }
    }

    return results;
  }

  async selectTicker(ticker) {
    const tickerRow = this.scanResultRows.filter({ hasText: ticker });
    await tickerRow.click();
    await this.page.waitForTimeout(1500); // Wait for chart data loading
  }

  /**
   * Chart Operations
   */
  async waitForChart() {
    // Wait for chart container to be visible (longer timeout for parallel execution)
    await this.chartContainer.waitFor({ state: 'visible', timeout: 25000 });

    // Wait for chart content (canvas, svg, plotly div, or placeholder content)
    await this.page.waitForFunction(() => {
      const container = document.querySelector('.chart-container, [data-testid="chart-container"]');
      if (!container) return false;

      const hasCanvas = container.querySelector('canvas');
      const hasSvg = container.querySelector('svg');
      const hasPlotly = container.querySelector('.plotly-graph-div');
      const hasPlaceholder = container.textContent && container.textContent.includes('Click on a ticker');

      return hasCanvas || hasSvg || hasPlotly || hasPlaceholder;
    }, { timeout: 25000 });

    // Additional wait for chart rendering (longer for parallel execution)
    await this.page.waitForTimeout(3000);
  }

  async isChartVisible() {
    try {
      await this.waitForChart();
      return true;
    } catch {
      return false;
    }
  }

  async getChartData() {
    await this.waitForChart();

    return await this.page.evaluate(() => {
      const container = document.querySelector('.chart-container, [data-testid="chart-container"]');
      if (!container) return null;

      // Try to get Plotly data
      const plotlyDiv = container.querySelector('.plotly-graph-div');
      if (plotlyDiv && window.Plotly) {
        return {
          type: 'plotly',
          data: plotlyDiv.data || null,
          layout: plotlyDiv.layout || null
        };
      }

      // Try to get canvas data
      const canvas = container.querySelector('canvas');
      if (canvas) {
        return {
          type: 'canvas',
          width: canvas.width,
          height: canvas.height,
          hasContent: canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.some(pixel => pixel !== 0)
        };
      }

      return { type: 'unknown' };
    });
  }

  async changeTimeframe(timeframe) {
    const timeframeButton = this.page.locator(`button:has-text("${timeframe}"), [data-timeframe="${timeframe}"]`);
    if (await timeframeButton.isVisible({ timeout: 2000 })) {
      await timeframeButton.click();
      await this.page.waitForTimeout(1000);
      await this.waitForChart(); // Wait for chart to re-render
    } else {
      throw new Error(`Timeframe button for "${timeframe}" not found`);
    }
  }

  async hoverChart(x = 0.5, y = 0.5) {
    const box = await this.chartContainer.boundingBox();
    if (box) {
      await this.page.mouse.move(
        box.x + box.width * x,
        box.y + box.height * y
      );
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * View Mode Operations
   */
  async switchToTableView() {
    const tableButton = this.page.locator('button:has-text("Table"), [data-view="table"]');
    if (await tableButton.isVisible({ timeout: 2000 })) {
      await tableButton.click();
      await this.page.waitForTimeout(500);
    }
  }

  async switchToChartView() {
    const chartButton = this.page.locator('button:has-text("Chart"), [data-view="chart"]');
    if (await chartButton.isVisible({ timeout: 2000 })) {
      await chartButton.click();
      await this.page.waitForTimeout(1000);
      // Just wait for chart container to be visible, not full content (for parallel execution)
      await this.chartContainer.waitFor({ state: 'visible', timeout: 10000 });
    }
  }

  async getCurrentViewMode() {
    try {
      const isTableActive = await this.page.locator('[data-view="table"].active').isVisible({ timeout: 1000 });
      return isTableActive ? 'table' : 'chart';
    } catch {
      // Fallback to checking aria-pressed attribute
      const tablePressed = await this.page.locator('[data-view="table"][aria-pressed="true"]').isVisible({ timeout: 1000 }).catch(() => false);
      return tablePressed ? 'table' : 'chart';
    }
  }

  /**
   * Statistics Operations
   */
  async getStatistics() {
    await this.statisticsPanel.waitFor({ state: 'visible', timeout: 10000 });

    const metrics = await this.metricCards.all();
    const stats = {};

    for (const metric of metrics) {
      const label = await metric.locator('.studio-metric-label').textContent();
      const value = await metric.locator('.studio-metric-value').textContent();

      if (label && value) {
        stats[label.trim()] = value.trim();
      }
    }

    return stats;
  }

  /**
   * Code Upload Operations
   */
  async openUploadModal() {
    await this.uploadCodeButton.click();
    await this.uploadModal.waitFor({ state: 'visible', timeout: 5000 });
  }

  async uploadCode(code, mode = 'finalized') {
    await this.openUploadModal();

    // Select upload mode
    if (mode === 'finalized') {
      await this.page.click('button:has-text("Upload Finalized Code")');
    } else {
      await this.page.click('button:has-text("Format Code with AI")');
    }

    // Enter code
    await this.page.fill('textarea', code);

    // Submit
    const submitButton = mode === 'finalized' ?
      'button:has-text("Upload & Run")' :
      'button:has-text("Format & Run")';

    await this.page.click(submitButton);

    // Wait for modal to close or transition
    await this.page.waitForTimeout(2000);
  }

  /**
   * Utility Methods
   */
  async takeScreenshot(name) {
    return await this.page.screenshot({
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true
    });
  }

  async waitForLoadingToComplete() {
    // Wait for any loading spinners to disappear
    await this.page.waitForFunction(() => {
      const spinners = document.querySelectorAll('.studio-spinner, [data-testid="loading"]');
      return spinners.length === 0 || Array.from(spinners).every(spinner => !spinner.isVisible);
    }, { timeout: 30000 });
  }

  async isInMobileView() {
    const viewport = this.page.viewportSize();
    return viewport && viewport.width <= 768;
  }

  async getPageTitle() {
    return await this.page.title();
  }

  async getCurrentURL() {
    return this.page.url();
  }
}

module.exports = { TradingDashboard };