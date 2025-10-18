import { test, expect } from '@playwright/test';

test.describe('Journal Editor', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the journal page
    await page.goto('http://localhost:6565/journal');

    // Wait for the page to load
    await page.waitForSelector('[data-testid="journal-entry-card"]', { timeout: 10000 });

    // Click the edit button on the first journal entry
    await page.click('[data-testid="edit-journal-entry"]', { timeout: 5000 });

    // Wait for the editor modal to open
    await page.waitForSelector('textarea', { timeout: 5000 });
  });

  test('should display formatting toolbar', async ({ page }) => {
    // Check if all formatting buttons are present
    await expect(page.locator('button[title*="Bold"]')).toBeVisible();
    await expect(page.locator('button[title*="Italic"]')).toBeVisible();
    await expect(page.locator('button[title*="Heading 1"]')).toBeVisible();
    await expect(page.locator('button[title*="Heading 2"]')).toBeVisible();
    await expect(page.locator('button[title*="Bullet List"]')).toBeVisible();
  });

  test('should apply bold formatting to selected text', async ({ page }) => {
    const textarea = page.locator('textarea');

    // Clear existing content and type test text
    await textarea.fill('This is test text');

    // Select the word "test"
    await textarea.focus();
    await page.keyboard.press('Control+a'); // Select all
    await page.keyboard.press('ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight');
    await page.keyboard.down('Shift');
    await page.keyboard.press('ArrowRight ArrowRight ArrowRight ArrowRight');
    await page.keyboard.up('Shift');

    // Click bold button
    await page.click('button[title*="Bold"]');

    // Check that the text now contains bold formatting
    const content = await textarea.inputValue();
    expect(content).toContain('**test**');
  });

  test('should remove bold formatting when applied to already bold text', async ({ page }) => {
    const textarea = page.locator('textarea');

    // Type text with existing bold formatting
    await textarea.fill('This is **bold** text');

    // Select the bold text (including asterisks)
    await textarea.focus();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight');
    await page.keyboard.down('Shift');
    await page.keyboard.press('ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight');
    await page.keyboard.up('Shift');

    // Click bold button to remove formatting
    await page.click('button[title*="Bold"]');

    // Check that the asterisks are removed
    const content = await textarea.inputValue();
    expect(content).toBe('This is bold text');
  });

  test('should apply italic formatting to selected text', async ({ page }) => {
    const textarea = page.locator('textarea');

    // Clear and type test text
    await textarea.fill('This is test text');

    // Select the word "test"
    await textarea.focus();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight');
    await page.keyboard.down('Shift');
    await page.keyboard.press('ArrowRight ArrowRight ArrowRight ArrowRight');
    await page.keyboard.up('Shift');

    // Click italic button
    await page.click('button[title*="Italic"]');

    // Check that the text now contains italic formatting
    const content = await textarea.inputValue();
    expect(content).toContain('*test*');
  });

  test('should apply heading 1 formatting to current line', async ({ page }) => {
    const textarea = page.locator('textarea');

    // Type test text
    await textarea.fill('This is a heading');

    // Place cursor anywhere in the line
    await textarea.focus();
    await page.keyboard.press('ArrowRight ArrowRight ArrowRight');

    // Click heading 1 button
    await page.click('button[title*="Heading 1"]');

    // Check that the line now has heading formatting
    const content = await textarea.inputValue();
    expect(content).toBe('# This is a heading');
  });

  test('should toggle heading 1 formatting', async ({ page }) => {
    const textarea = page.locator('textarea');

    // Type text with existing heading
    await textarea.fill('# This is a heading');

    // Place cursor in the line
    await textarea.focus();
    await page.keyboard.press('ArrowRight ArrowRight ArrowRight');

    // Click heading 1 button to remove formatting
    await page.click('button[title*="Heading 1"]');

    // Check that the heading formatting is removed
    const content = await textarea.inputValue();
    expect(content).toBe('This is a heading');
  });

  test('should apply bullet list formatting', async ({ page }) => {
    const textarea = page.locator('textarea');

    // Type test text
    await textarea.fill('This is a list item');

    // Click bullet list button
    await page.click('button[title*="Bullet List"]');

    // Check that bullet formatting is applied
    const content = await textarea.inputValue();
    expect(content).toBe('- This is a list item');
  });

  test('should work with keyboard shortcuts', async ({ page }) => {
    const textarea = page.locator('textarea');

    // Type and select text
    await textarea.fill('This is test text');
    await textarea.focus();
    await page.keyboard.press('Control+a');
    await page.keyboard.press('ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight');
    await page.keyboard.down('Shift');
    await page.keyboard.press('ArrowRight ArrowRight ArrowRight ArrowRight');
    await page.keyboard.up('Shift');

    // Use Ctrl+B for bold
    await page.keyboard.press('Control+b');

    let content = await textarea.inputValue();
    expect(content).toContain('**test**');

    // Select the same text again and use Ctrl+I for italic
    await page.keyboard.down('Shift');
    await page.keyboard.press('ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft ArrowLeft');
    await page.keyboard.up('Shift');

    await page.keyboard.press('Control+i');

    content = await textarea.inputValue();
    expect(content).toContain('***test***');
  });

  test('should preserve cursor position after formatting', async ({ page }) => {
    const textarea = page.locator('textarea');

    // Type text
    await textarea.fill('Start middle end');

    // Place cursor in middle
    await textarea.focus();
    await page.keyboard.press('ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight');

    // Select "middle"
    await page.keyboard.down('Shift');
    await page.keyboard.press('ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight ArrowRight');
    await page.keyboard.up('Shift');

    // Apply bold formatting
    await page.click('button[title*="Bold"]');

    // Check content
    const content = await textarea.inputValue();
    expect(content).toBe('Start **middle** end');

    // Check cursor position (should be after the formatted text)
    const selectionStart = await textarea.evaluate((el: HTMLTextAreaElement) => el.selectionStart);
    const selectionEnd = await textarea.evaluate((el: HTMLTextAreaElement) => el.selectionEnd);

    // Cursor should be positioned after "middle" but before the closing **
    expect(selectionStart).toBe(14); // After "Start **middle"
    expect(selectionEnd).toBe(14);
  });

  test('should convert markdown to HTML on save', async ({ page }) => {
    const textarea = page.locator('textarea');

    // Type markdown content
    await textarea.fill('# Heading\n\n**Bold text** and *italic text*\n\n- Bullet one\n- Bullet two');

    // Click save button
    await page.click('button:has-text("Save Entry")');

    // Wait for modal to close and check that the content is properly formatted in the view
    await page.waitForSelector('textarea', { state: 'hidden', timeout: 5000 });

    // Check that the content is now properly formatted in the journal entry
    await expect(page.locator('.journal-content')).toContainText('Heading');
    await expect(page.locator('.journal-content strong')).toContainText('Bold text');
    await expect(page.locator('.journal-content em')).toContainText('italic text');
    await expect(page.locator('.journal-content li')).toContainText('Bullet one');
  });
});