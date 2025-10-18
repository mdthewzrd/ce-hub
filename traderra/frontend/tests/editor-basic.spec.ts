import { test, expect } from '@playwright/test';

test.describe('Journal Editor - Basic Functionality', () => {
  test('should load journal page and show entries', async ({ page }) => {
    await page.goto('http://localhost:6565/journal');

    // Wait for journal entries to load
    await page.waitForSelector('[data-testid="journal-entry-card"]', { timeout: 10000 });

    // Check that at least one journal entry is visible
    const entryCards = page.locator('[data-testid="journal-entry-card"]');
    await expect(entryCards).toHaveCountGreaterThan(0);

    // Check that edit button exists
    const editButton = page.locator('[data-testid="edit-journal-entry"]').first();
    await expect(editButton).toBeVisible();
  });

  test('should open editor when clicking edit button', async ({ page }) => {
    await page.goto('http://localhost:6565/journal');

    // Wait for journal entries
    await page.waitForSelector('[data-testid="journal-entry-card"]', { timeout: 10000 });

    // Click the first edit button
    await page.click('[data-testid="edit-journal-entry"]');

    // Check that editor modal opens
    await page.waitForSelector('textarea', { timeout: 5000 });

    // Check that formatting toolbar is present
    await expect(page.locator('button[title*="Bold"]')).toBeVisible();
    await expect(page.locator('button[title*="Italic"]')).toBeVisible();
  });

  test('should apply and remove bold formatting', async ({ page }) => {
    await page.goto('http://localhost:6565/journal');
    await page.waitForSelector('[data-testid="journal-entry-card"]', { timeout: 10000 });
    await page.click('[data-testid="edit-journal-entry"]');
    await page.waitForSelector('textarea', { timeout: 5000 });

    const textarea = page.locator('textarea');

    // Clear and type test text
    await textarea.fill('This is test text');

    // Select "test" (characters 8-12)
    await textarea.click();
    await textarea.press('End'); // Go to end
    await textarea.press('ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft'); // Before "text"
    await textarea.press('Shift+ArrowLeft Shift+ArrowLeft Shift+ArrowLeft Shift+ArrowLeft'); // Select "test"

    // Apply bold formatting
    await page.click('button[title*="Bold"]');

    // Check content has bold markers
    const content1 = await textarea.inputValue();
    expect(content1).toBe('This is **test** text');

    // Select the bold text including markers
    await textarea.click();
    await textarea.press('End');
    await textarea.press('ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft'); // Before closing **
    await textarea.press('Shift+ArrowLeft Shift+ArrowLeft Shift+ArrowLeft Shift+ArrowLeft Shift+ArrowLeft Shift+ArrowLeft Shift+ArrowLeft Shift+ArrowLeft'); // Select **test**

    // Remove bold formatting
    await page.click('button[title*="Bold"]');

    // Check bold markers are removed
    const content2 = await textarea.inputValue();
    expect(content2).toBe('This is test text');
  });
});