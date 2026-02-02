/**
 * Scan Results Table Component Page Object Model
 *
 * Specialized component for interacting with the trading scan results table
 * in the Edge.dev platform.
 */

class ScanResultsTable {
  constructor(page, selector = '.studio-table, [data-testid="scan-results-table"]') {
    this.page = page;
    this.selector = selector;
    this.table = page.locator(selector);
    this.tbody = page.locator(`${selector} tbody`);
    this.rows = page.locator(`${selector} tbody tr, [data-testid="scan-result-row"]`);
    this.headers = page.locator(`${selector} thead th`);
  }

  /**
   * Table Loading and Visibility
   */
  async waitForTable(timeout = 10000) {
    await this.table.waitFor({ state: 'visible', timeout });

    // Wait for at least one data row (excluding header)
    await this.page.waitForFunction((sel) => {
      const table = document.querySelector(sel);
      if (!table) return false;

      const tbody = table.querySelector('tbody');
      if (!tbody) return false;

      const rows = tbody.querySelectorAll('tr');
      return rows.length > 0;
    }, this.selector, { timeout });

    // Additional wait for data to stabilize
    await this.page.waitForTimeout(500);
  }

  async isVisible() {
    try {
      await this.waitForTable(5000);
      return true;
    } catch {
      return false;
    }
  }

  async isEmpty() {
    try {
      await this.table.waitFor({ state: 'visible', timeout: 5000 });
      const rowCount = await this.rows.count();
      return rowCount === 0;
    } catch {
      return true;
    }
  }

  /**
   * Table Structure and Headers
   */
  async getHeaders() {
    await this.waitForTable();
    const headerElements = await this.headers.all();
    const headers = [];

    for (const header of headerElements) {
      const text = await header.textContent();
      headers.push(text?.trim() || '');
    }

    return headers;
  }

  async validateHeaders(expectedHeaders) {
    const actualHeaders = await this.getHeaders();

    const validation = {
      valid: true,
      expected: expectedHeaders,
      actual: actualHeaders,
      missing: [],
      extra: []
    };

    for (const expected of expectedHeaders) {
      if (!actualHeaders.includes(expected)) {
        validation.missing.push(expected);
        validation.valid = false;
      }
    }

    for (const actual of actualHeaders) {
      if (!expectedHeaders.includes(actual)) {
        validation.extra.push(actual);
      }
    }

    return validation;
  }

  /**
   * Row Operations
   */
  async getRowCount() {
    await this.waitForTable();
    return await this.rows.count();
  }

  async getRowData(rowIndex) {
    await this.waitForTable();
    const row = this.rows.nth(rowIndex);
    const cells = await row.locator('td').all();
    const rowData = {};

    const headers = await this.getHeaders();

    for (let i = 0; i < cells.length && i < headers.length; i++) {
      const cellText = await cells[i].textContent();
      const headerText = headers[i].toLowerCase().replace(/\s+/g, '_');
      rowData[headerText] = cellText?.trim() || '';
    }

    return rowData;
  }

  async getAllRowsData() {
    await this.waitForTable();
    const rowCount = await this.getRowCount();
    const allData = [];

    for (let i = 0; i < rowCount; i++) {
      const rowData = await this.getRowData(i);
      allData.push(rowData);
    }

    return allData;
  }

  async findRowByTicker(ticker) {
    await this.waitForTable();
    const allData = await this.getAllRowsData();

    return allData.find(row =>
      row.ticker && row.ticker.toUpperCase() === ticker.toUpperCase()
    );
  }

  async getRowByTicker(ticker) {
    await this.waitForTable();
    return this.rows.filter({ hasText: ticker.toUpperCase() }).first();
  }

  /**
   * Row Interactions
   */
  async clickRow(rowIndex) {
    await this.waitForTable();
    const row = this.rows.nth(rowIndex);
    await row.click();
    await this.page.waitForTimeout(1000); // Wait for any selection effects
  }

  async clickRowByTicker(ticker) {
    await this.waitForTable();
    const row = await this.getRowByTicker(ticker);
    await row.click();
    await this.page.waitForTimeout(1000);
  }

  async hoverRow(rowIndex) {
    await this.waitForTable();
    const row = this.rows.nth(rowIndex);
    await row.hover();
    await this.page.waitForTimeout(300);
  }

  async isRowSelected(rowIndex) {
    await this.waitForTable();
    const row = this.rows.nth(rowIndex);

    return await row.evaluate(el => {
      return el.classList.contains('selected') ||
             el.classList.contains('active') ||
             el.getAttribute('aria-selected') === 'true';
    });
  }

  async getSelectedRow() {
    await this.waitForTable();
    const rows = await this.rows.all();

    for (let i = 0; i < rows.length; i++) {
      const isSelected = await rows[i].evaluate(el => {
        return el.classList.contains('selected') ||
               el.classList.contains('active') ||
               el.getAttribute('aria-selected') === 'true';
      });

      if (isSelected) {
        return {
          index: i,
          element: rows[i],
          data: await this.getRowData(i)
        };
      }
    }

    return null;
  }

  /**
   * Data Validation and Analysis
   */
  async validateRowData(rowIndex, expectedData) {
    const actualData = await this.getRowData(rowIndex);
    const validation = {
      valid: true,
      differences: {}
    };

    for (const [key, expectedValue] of Object.entries(expectedData)) {
      const actualValue = actualData[key];

      if (actualValue !== expectedValue) {
        validation.valid = false;
        validation.differences[key] = {
          expected: expectedValue,
          actual: actualValue
        };
      }
    }

    return validation;
  }

  async getSortedColumn(columnHeader) {
    await this.waitForTable();
    const allData = await this.getAllRowsData();
    const columnKey = columnHeader.toLowerCase().replace(/\s+/g, '_');

    return allData.map(row => row[columnKey]).filter(value => value !== '');
  }

  async validateNumericColumn(columnHeader, options = {}) {
    const columnData = await this.getSortedColumn(columnHeader);
    const { minValue, maxValue, allowNegative = true } = options;

    const validation = {
      valid: true,
      errors: [],
      statistics: {
        count: columnData.length,
        validNumbers: 0,
        invalidValues: []
      }
    };

    for (const value of columnData) {
      // Remove percentage signs and other formatting
      const cleanValue = value.replace(/[%,$M]/g, '');
      const numValue = parseFloat(cleanValue);

      if (isNaN(numValue)) {
        validation.valid = false;
        validation.errors.push(`Invalid numeric value: ${value}`);
        validation.statistics.invalidValues.push(value);
      } else {
        validation.statistics.validNumbers++;

        if (!allowNegative && numValue < 0) {
          validation.valid = false;
          validation.errors.push(`Negative value not allowed: ${value}`);
        }

        if (minValue !== undefined && numValue < minValue) {
          validation.valid = false;
          validation.errors.push(`Value below minimum: ${value} < ${minValue}`);
        }

        if (maxValue !== undefined && numValue > maxValue) {
          validation.valid = false;
          validation.errors.push(`Value above maximum: ${value} > ${maxValue}`);
        }
      }
    }

    return validation;
  }

  async getColumnStats(columnHeader) {
    const columnData = await this.getSortedColumn(columnHeader);
    const numericValues = [];

    for (const value of columnData) {
      const cleanValue = value.replace(/[%,$M]/g, '');
      const numValue = parseFloat(cleanValue);
      if (!isNaN(numValue)) {
        numericValues.push(numValue);
      }
    }

    if (numericValues.length === 0) {
      return null;
    }

    numericValues.sort((a, b) => a - b);

    return {
      count: numericValues.length,
      min: numericValues[0],
      max: numericValues[numericValues.length - 1],
      median: numericValues[Math.floor(numericValues.length / 2)],
      average: numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
    };
  }

  /**
   * Sorting and Filtering
   */
  async sortByColumn(columnHeader) {
    await this.waitForTable();
    const headerCell = this.page.locator(`${this.selector} th:has-text("${columnHeader}")`);

    if (await headerCell.isVisible({ timeout: 2000 })) {
      await headerCell.click();
      await this.page.waitForTimeout(1000); // Wait for sort to complete
    } else {
      throw new Error(`Column header "${columnHeader}" not found`);
    }
  }

  async getSortDirection(columnHeader) {
    await this.waitForTable();
    const headerCell = this.page.locator(`${this.selector} th:has-text("${columnHeader}")`);

    return await headerCell.evaluate(el => {
      if (el.classList.contains('sort-asc') || el.getAttribute('aria-sort') === 'ascending') {
        return 'asc';
      } else if (el.classList.contains('sort-desc') || el.getAttribute('aria-sort') === 'descending') {
        return 'desc';
      }
      return 'none';
    });
  }

  /**
   * Search and Filter
   */
  async searchTable(searchTerm) {
    const allData = await this.getAllRowsData();

    return allData.filter(row => {
      return Object.values(row).some(value =>
        value.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }

  async filterByColumn(columnHeader, filterValue) {
    const allData = await this.getAllRowsData();
    const columnKey = columnHeader.toLowerCase().replace(/\s+/g, '_');

    return allData.filter(row =>
      row[columnKey] && row[columnKey].toLowerCase().includes(filterValue.toLowerCase())
    );
  }

  /**
   * Table State and Utilities
   */
  async refreshTable() {
    // Trigger a refresh if there's a refresh button
    const refreshButton = this.page.locator('button:has-text("Refresh"), [data-testid="refresh-table"]');

    if (await refreshButton.isVisible({ timeout: 2000 })) {
      await refreshButton.click();
      await this.waitForTable();
    }
  }

  async takeScreenshot(name) {
    await this.waitForTable();
    return await this.table.screenshot({
      path: `test-results/screenshots/table-${name}-${Date.now()}.png`
    });
  }

  async scrollToRow(rowIndex) {
    await this.waitForTable();
    const row = this.rows.nth(rowIndex);
    await row.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(300);
  }

  async getVisibleRowRange() {
    await this.waitForTable();
    const tableBox = await this.table.boundingBox();
    if (!tableBox) return { start: 0, end: 0 };

    const rows = await this.rows.all();
    let visibleStart = -1;
    let visibleEnd = -1;

    for (let i = 0; i < rows.length; i++) {
      const rowBox = await rows[i].boundingBox();
      if (rowBox) {
        const isVisible = rowBox.y >= tableBox.y &&
                         rowBox.y + rowBox.height <= tableBox.y + tableBox.height;

        if (isVisible) {
          if (visibleStart === -1) visibleStart = i;
          visibleEnd = i;
        }
      }
    }

    return {
      start: Math.max(0, visibleStart),
      end: Math.max(0, visibleEnd)
    };
  }
}

module.exports = { ScanResultsTable };