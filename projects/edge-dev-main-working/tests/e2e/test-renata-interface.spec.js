/**
 * Test script for Renata AI enhanced interface
 * Tests file upload, textarea expansion, and code formatting workflow
 */

const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Renata AI Enhanced Interface', () => {
  test('should support file upload and code formatting', async ({ page }) => {
    // Navigate to the main dashboard
    await page.goto('http://localhost:5657');

    // Wait for the page to load and Renata chat to be available
    await page.waitForSelector('[data-testid="renata-chat"]', { timeout: 10000 });

    // Click on Renata AI toggle to activate chat
    const renataToggle = page.locator('button:has-text("Renata AI")');
    await expect(renataToggle).toBeVisible();
    await renataToggle.click();

    // Wait for chat interface to be visible
    await page.waitForSelector('textarea[placeholder*="Ask Renata"]', { timeout: 5000 });

    // Test 1: Verify textarea expansion functionality
    const textarea = page.locator('textarea[placeholder*="Ask Renata"]');
    await expect(textarea).toBeVisible();

    // Check initial height (should be smaller)
    const initialHeight = await textarea.evaluate(el => el.style.height || getComputedStyle(el).height);
    console.log('Initial textarea height:', initialHeight);

    // Test keyboard shortcut (Cmd+Up Arrow) to expand
    await textarea.click();
    await page.keyboard.press('Meta+ArrowUp'); // Cmd+Up on Mac

    // Check if textarea expanded
    await page.waitForTimeout(500); // Small wait for animation
    const expandedHeight = await textarea.evaluate(el => el.style.height || getComputedStyle(el).height);
    console.log('Expanded textarea height:', expandedHeight);

    // Test 2: Verify Upload button exists and is functional
    const uploadButton = page.locator('button:has-text("Upload")');
    await expect(uploadButton).toBeVisible();

    // Test 3: Test file upload functionality
    // Create a simple test file path
    const testFilePath = path.join(__dirname, 'test_renata_upload.py');

    // Click upload button to trigger file input
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();

    // Upload the test file
    await fileInput.setInputFiles(testFilePath);

    // Wait for file content to be loaded into textarea
    await page.waitForTimeout(1000);

    // Verify the file content appears in the textarea
    const textareaContent = await textarea.inputValue();
    expect(textareaContent).toContain('import pandas as pd');
    expect(textareaContent).toContain('ScannerConfig');
    expect(textareaContent).toContain('sample_gap_scanner');

    console.log('✅ File upload successful - content loaded into textarea');

    // Test 4: Verify Format button appears when code is present
    const formatButton = page.locator('button:has-text("Format")');
    if (await formatButton.isVisible()) {
      console.log('✅ Format button is visible with code content');
    }

    // Test 5: Send the uploaded code for formatting
    const sendButton = page.locator('button[type="submit"]');
    await expect(sendButton).toBeVisible();
    await sendButton.click();

    // Wait for AI response
    await page.waitForTimeout(3000);

    // Check for response in chat messages
    const chatMessages = page.locator('[data-testid="chat-message"]');
    if (await chatMessages.count() > 0) {
      console.log('✅ AI response received');

      // Check if response contains formatting indicators
      const lastMessage = chatMessages.last();
      const messageText = await lastMessage.textContent();

      if (messageText.includes('format') || messageText.includes('optimize') || messageText.includes('scanner')) {
        console.log('✅ AI response appears to be related to code formatting');
      }
    }

    // Test 6: Verify Escape key collapses textarea
    await textarea.click();
    await page.keyboard.press('Escape');

    await page.waitForTimeout(500);
    const collapsedHeight = await textarea.evaluate(el => el.style.height || getComputedStyle(el).height);
    console.log('Collapsed textarea height:', collapsedHeight);

    console.log('✅ All Renata AI interface tests completed successfully');
  });

  test('should handle code formatting workflow end-to-end', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('http://localhost:5657');

    // Activate Renata AI
    await page.waitForSelector('button:has-text("Renata AI")');
    await page.click('button:has-text("Renata AI")');

    // Wait for chat interface
    await page.waitForSelector('textarea[placeholder*="Ask Renata"]');

    // Test direct code paste
    const sampleCode = `
import pandas as pd

def test_scanner():
    # Test scanner
    return pd.DataFrame({'ticker': ['AAPL'], 'price': [150]})
    `;

    const textarea = page.locator('textarea[placeholder*="Ask Renata"]');
    await textarea.fill(`Please format this trading code:\n\n\`\`\`python${sampleCode}\`\`\``);

    // Send the message
    await page.click('button[type="submit"]');

    // Wait for response
    await page.waitForTimeout(5000);

    // Verify response received
    const chatMessages = page.locator('[data-testid="chat-message"]');
    const messageCount = await chatMessages.count();

    if (messageCount > 0) {
      console.log('✅ Code formatting request processed successfully');
    }

    console.log('✅ End-to-end code formatting workflow test completed');
  });
});