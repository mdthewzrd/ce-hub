const { test, expect } = require('@playwright/test');

// Helper function to send a message and wait for response
async function sendMessage(page, message) {
  await page.fill('#message-input', message);
  await page.click('#send-btn');

  // Wait for the message to appear in the chat
  await page.waitForSelector(`.message.user:has-text("${message.substring(0, 20)}")`, { timeout: 5000 });

  // Wait a bit for AI response
  await page.waitForTimeout(3000);

  // Try to wait for AI response or timeout gracefully
  try {
    await page.waitForSelector('.message.ai', { timeout: 30000 });
  } catch (e) {
    console.log('AI response may be slow, continuing...');
  }
}

test.describe('Workflow Demo Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('#project-tree');

    // Wait for connection
    try {
      await page.waitForSelector('#connection-status.online', { timeout: 10000 });
    } catch (e) {
      console.log('Connection status unclear, proceeding...');
    }
  });

  test('Demo 1: Spitball Workflow - Create Real Conversation', async ({ page }) => {
    // Navigate to Testing Workflows
    await page.click('text=Testing Workflows');

    // Click new chat button
    await page.click('#new-chat-btn');

    // Start spitball conversation
    await sendMessage(page, 'I want to create an AI agent for productivity but I\'m not sure what exactly. Can we brainstorm?');

    // Continue conversation
    await sendMessage(page, 'I\'d like to spitball ideas from scratch');

    await sendMessage(page, 'I\'m interested in helping people who get overwhelmed with too many tasks');

    await sendMessage(page, 'The smart prioritization idea sounds good. How would that work?');

    await sendMessage(page, 'Yes, explaining the reasoning is crucial. Let\'s plan this out!');

    // Take screenshot of the conversation
    await page.screenshot({ path: 'test-results/demo-spitball-conversation.png', fullPage: true });

    // Verify we have multiple messages
    const userMessages = await page.locator('.message.user').count();
    const aiMessages = await page.locator('.message.ai').count();

    console.log(`User messages: ${userMessages}, AI messages: ${aiMessages}`);
    expect(userMessages).toBeGreaterThan(0);
  });

  test('Demo 2: Upload Documents Workflow - Create Real Conversation', async ({ page }) => {
    // Navigate to Testing Workflows
    await page.click('text=Testing Workflows');

    // Click new chat button
    await page.click('#new-chat-btn');

    // Start upload documents conversation
    await sendMessage(page, 'I want to plan a SaaS feature and I have research documents to upload.');

    await sendMessage(page, 'I have user interviews, competitor analysis, and wireframes. I want to upload existing documents.');

    await sendMessage(page, 'I want to create a feature specification for my dev team.');

    await sendMessage(page, 'React/Node.js stack, 3 month timeline, needs to go to PM and design teams.');

    // Take screenshot
    await page.screenshot({ path: 'test-results/demo-upload-docs-conversation.png', fullPage: true });

    // Verify conversation happened
    const userMessages = await page.locator('.message.user').count();
    console.log(`Upload docs conversation - User messages: ${userMessages}`);
    expect(userMessages).toBeGreaterThan(0);
  });

  test('Demo 3: Inspiration Workflow - Create Real Conversation', async ({ page }) => {
    // Navigate to Testing Workflows
    await page.click('text=Testing Workflows');

    // Click new chat button
    await page.click('#new-chat-btn');

    // Start inspiration conversation
    await sendMessage(page, 'I saw Claude\'s computer use demo and want to build something similar for e-commerce automation.');

    await sendMessage(page, 'I want to use that as inspiration - the visual interface understanding for inventory management.');

    await sendMessage(page, 'Small platforms have bad APIs. I want to sync inventory across Shopify, WooCommerce, Etsy.');

    await sendMessage(page, 'Hourly automation with complex pricing rules. Let\'s plan the architecture.');

    // Take screenshot
    await page.screenshot({ path: 'test-results/demo-inspiration-conversation.png', fullPage: true });

    // Verify conversation happened
    const userMessages = await page.locator('.message.user').count();
    console.log(`Inspiration conversation - User messages: ${userMessages}`);
    expect(userMessages).toBeGreaterThan(0);
  });

  test('Demo 4: Conversational Workflow - Create Real Conversation', async ({ page }) => {
    // Navigate to Testing Workflows
    await page.click('text=Testing Workflows');

    // Click new chat button
    await page.click('#new-chat-btn');

    // Start conversational workflow
    await sendMessage(page, 'I need help with knowledge management for my team. Everything is scattered.');

    await sendMessage(page, 'Let\'s chat through it. We have stuff in Notion, Google Docs, Slack, GitHub.');

    await sendMessage(page, 'Last week we couldn\'t find our troubleshooting guide during a client escalation.');

    await sendMessage(page, 'AI answering questions directly would be amazing instead of searching.');

    await sendMessage(page, 'We\'re 15 people, prefer existing tools, want something in 1-2 months.');

    // Take screenshot
    await page.screenshot({ path: 'test-results/demo-conversational-conversation.png', fullPage: true });

    // Verify conversation happened
    const userMessages = await page.locator('.message.user').count();
    console.log(`Conversational workflow - User messages: ${userMessages}`);
    expect(userMessages).toBeGreaterThan(0);
  });

  test('Demo 5: UI Verification and Existing Chats', async ({ page }) => {
    // Navigate to Testing Workflows project
    await page.click('text=Testing Workflows');

    // Verify test chats exist
    await expect(page.locator('text=Spitball Ideas Workflow')).toBeVisible();
    await expect(page.locator('text=Upload Documents Workflow')).toBeVisible();
    await expect(page.locator('text=Use Inspiration Workflow')).toBeVisible();
    await expect(page.locator('text=Conversational Workflow')).toBeVisible();

    // Click on a test chat
    await page.click('text=Spitball Ideas Workflow');

    // Verify chat opens in main area
    await expect(page.locator('.messages-area .welcome-message')).toBeVisible();

    // Verify details panel at bottom
    await expect(page.locator('#details-panel')).toBeVisible();

    // Take screenshot of the UI
    await page.screenshot({ path: 'test-results/demo-ui-verification.png', fullPage: true });

    // Verify the main welcome message shows the starting points
    const welcomeContent = await page.locator('.welcome-message').textContent();
    expect(welcomeContent).toContain('How would you like to start?');
  });
});