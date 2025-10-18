const { test, expect } = require('@playwright/test');

// Helper function to wait for AI response
async function waitForAIResponse(page, timeout = 45000) {
  // Wait for typing indicator to appear
  await page.waitForSelector('#typing-indicator:not(.hidden)', { timeout: 5000 });
  // Wait for typing indicator to disappear
  await page.waitForSelector('#typing-indicator.hidden', { timeout });
  // Wait for send button to be enabled
  await page.waitForFunction(() => {
    const sendBtn = document.querySelector('#send-btn');
    return !sendBtn.disabled;
  }, { timeout: 5000 });
}

// Helper function to send a message and wait for response
async function sendMessageAndWait(page, message) {
  await page.fill('#message-input', message);
  await page.click('#send-btn');
  await waitForAIResponse(page);
}

test.describe('Interactive Workflow Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for the app to load completely
    await page.waitForSelector('#project-tree');
    await page.waitForSelector('#connection-status.online', { timeout: 30000 });
  });

  test('Test 1: Spitball Ideas Workflow - Real Chat Interaction', async ({ page }) => {
    // Navigate to Testing Workflows project
    await page.click('text=Testing Workflows');

    // Create a new chat for spitball testing
    await page.click('#new-chat-btn');

    // Fill in some basic text in the input to start a conversation
    await sendMessageAndWait(page, 'I want to create some kind of AI productivity tool but I\'m not sure exactly what. Can we brainstorm ideas?');

    // Verify the AI asks about starting approach with the new workflow
    const lastMessage = page.locator('.message.ai').last();
    await expect(lastMessage).toContainText('How would you like to start?', { timeout: 10000 });

    // Continue the conversation - choose spitball approach
    await sendMessageAndWait(page, 'I\'d like to spitball ideas - just brainstorm from scratch');

    // Verify AI provides focused brainstorming questions
    const secondMessage = page.locator('.message.ai').last();
    await expect(secondMessage).toContainText('brainstorm', { timeout: 10000 });

    // Provide more direction
    await sendMessageAndWait(page, 'I\'m thinking about personal productivity - helping people who get overwhelmed with too many tasks');

    // Verify AI offers specific options
    const thirdMessage = page.locator('.message.ai').last();
    await expect(thirdMessage).toContainText('overwhelmed', { timeout: 10000 });

    // Select one option
    await sendMessageAndWait(page, 'The prioritization idea sounds interesting. How would that work?');

    // Verify AI provides implementation details
    const fourthMessage = page.locator('.message.ai').last();
    await expect(fourthMessage).toContainText('priorit', { timeout: 10000 });

    // Show readiness to plan
    await sendMessageAndWait(page, 'Yes! Can we plan this out in detail?');

    // Verify AI offers to move to planning
    const fifthMessage = page.locator('.message.ai').last();
    await expect(fifthMessage).toContainText('plan', { timeout: 10000 });

    // Take a screenshot of the conversation
    await page.screenshot({ path: 'test-results/spitball-real-conversation.png', fullPage: true });
  });

  test('Test 2: Upload Documents Workflow - Real Chat Interaction', async ({ page }) => {
    // Navigate to Testing Workflows project
    await page.click('text=Testing Workflows');

    // Create a new conversation
    await page.click('#new-chat-btn');

    // Start with upload documents intention
    await sendMessageAndWait(page, 'I want to plan a new SaaS feature and I have research documents to upload as a starting point.');

    // Verify AI asks about document workflow
    const firstResponse = page.locator('.message.ai').last();
    await expect(firstResponse).toContainText('How would you like to start?', { timeout: 10000 });
    await expect(firstResponse).toContainText('upload', { timeout: 5000 });

    // Indicate we have documents
    await sendMessageAndWait(page, 'I have user interviews, competitor analysis, and wireframes. I\'d like to upload existing documents.');

    // Verify AI asks clarifying questions
    const secondResponse = page.locator('.message.ai').last();
    await expect(secondResponse).toContainText('goal', { timeout: 10000 });

    // Provide the goal
    await sendMessageAndWait(page, 'I want to create a comprehensive feature specification for my development team.');

    // Verify AI asks for constraints
    const thirdResponse = page.locator('.message.ai').last();
    await expect(thirdResponse).toContainText('clarification', { timeout: 10000 });

    // Provide constraints
    await sendMessageAndWait(page, 'We\'re using React/Node.js, 3 month timeline, and it needs to go to PM and design teams too.');

    // Verify AI generates comprehensive response
    const fourthResponse = page.locator('.message.ai').last();
    await expect(fourthResponse).toContainText('specification', { timeout: 10000 });

    // Take a screenshot
    await page.screenshot({ path: 'test-results/upload-docs-real-conversation.png', fullPage: true });
  });

  test('Test 3: Use Inspiration Workflow - Real Chat Interaction', async ({ page }) => {
    // Navigate to Testing Workflows project
    await page.click('text=Testing Workflows');

    // Create a new conversation
    await page.click('#new-chat-btn');

    // Start with inspiration reference
    await sendMessageAndWait(page, 'I saw Claude\'s computer use demo and want to build something similar for e-commerce automation. Can we plan this?');

    // Verify AI asks about inspiration workflow
    const firstResponse = page.locator('.message.ai').last();
    await expect(firstResponse).toContainText('How would you like to start?', { timeout: 10000 });
    await expect(firstResponse).toContainText('inspiration', { timeout: 5000 });

    // Provide specific application
    await sendMessageAndWait(page, 'I want to use inspiration - I loved how it understood visual interfaces. I want to build e-commerce inventory automation.');

    // Verify AI connects the inspiration to the problem
    const secondResponse = page.locator('.message.ai').last();
    await expect(secondResponse).toContainText('visual', { timeout: 10000 });

    // Get more specific
    await sendMessageAndWait(page, 'Exactly! Small e-commerce platforms have bad APIs. I want inventory sync across Shopify, WooCommerce, and Etsy.');

    // Verify AI validates the approach
    const thirdResponse = page.locator('.message.ai').last();
    await expect(thirdResponse).toContainText('platform', { timeout: 10000 });

    // Provide technical requirements
    await sendMessageAndWait(page, 'Hourly automation, complex pricing rules per platform, variant management. Let\'s plan the architecture.');

    // Verify AI provides architecture response
    const fourthResponse = page.locator('.message.ai').last();
    await expect(fourthResponse).toContainText('architecture', { timeout: 10000 });

    // Take a screenshot
    await page.screenshot({ path: 'test-results/inspiration-real-conversation.png', fullPage: true });
  });

  test('Test 4: Conversational Workflow - Real Chat Interaction', async ({ page }) => {
    // Navigate to Testing Workflows project
    await page.click('text=Testing Workflows');

    // Create a new conversation
    await page.click('#new-chat-btn');

    // Start with a problem to chat through
    await sendMessageAndWait(page, 'I need help figuring out a knowledge management system for my team. Everything is scattered and hard to find.');

    // Verify AI responds conversationally
    const firstResponse = page.locator('.message.ai').last();
    await expect(firstResponse).toContainText('How would you like to start?', { timeout: 10000 });
    await expect(firstResponse).toContainText('chat through', { timeout: 5000 });

    // Continue conversationally
    await sendMessageAndWait(page, 'Let\'s just chat through it. We have stuff everywhere - Notion, Google Docs, Slack, GitHub wikis.');

    // Verify AI asks follow-up questions
    const secondResponse = page.locator('.message.ai').last();
    await expect(secondResponse).toContainText('scattered', { timeout: 10000 });

    // Provide trigger event
    await sendMessageAndWait(page, 'Last week we had a client escalation because nobody could find our troubleshooting guide. It was buried in some old Google Doc.');

    // Verify AI understands the core problem
    const thirdResponse = page.locator('.message.ai').last();
    await expect(thirdResponse).toContainText('discoverability', { timeout: 10000 });

    // Suggest AI solution
    await sendMessageAndWait(page, 'I think AI answering questions directly would be amazing. Like asking "How do we handle SSL issues for enterprise clients?" and getting immediate answers.');

    // Verify AI explores the solution
    const fourthResponse = page.locator('.message.ai').last();
    await expect(fourthResponse).toContainText('both', { timeout: 10000 });

    // Provide team context
    await sendMessageAndWait(page, 'We\'re 15 people. I\'d rather use existing tools as foundation - don\'t want to build from scratch.');

    // Verify AI provides options
    const fifthResponse = page.locator('.message.ai').last();
    await expect(fifthResponse).toContainText('Perfect size', { timeout: 10000 });

    // Take a screenshot
    await page.screenshot({ path: 'test-results/conversational-real-conversation.png', fullPage: true });
  });

  test('Test 5: Verify Existing Test Chats and UI', async ({ page }) => {
    // Navigate to Testing Workflows project
    await page.click('text=Testing Workflows');

    // Verify all test chats are visible
    await expect(page.locator('text=Spitball Ideas Workflow')).toBeVisible();
    await expect(page.locator('text=Upload Documents Workflow')).toBeVisible();
    await expect(page.locator('text=Use Inspiration Workflow')).toBeVisible();
    await expect(page.locator('text=Conversational Workflow')).toBeVisible();

    // Click on a chat to test the UI behavior
    await page.click('text=Spitball Ideas Workflow');

    // Verify chat opens in main window
    await expect(page.locator('.messages-area .welcome-message')).toBeVisible();
    await expect(page.locator('.welcome-message h2')).toContainText('Spitball Ideas Workflow');

    // Verify details panel is visible at bottom
    await expect(page.locator('#details-panel')).toBeVisible();

    // Verify starting points are in welcome message
    await expect(page.locator('.starting-points')).toBeVisible();
    await expect(page.locator('text=How would you like to start?')).toBeVisible();
    await expect(page.locator('text=Spitball ideas')).toBeVisible();
    await expect(page.locator('text=Upload existing documents')).toBeVisible();
    await expect(page.locator('text=Use inspiration')).toBeVisible();
    await expect(page.locator('text=Just chat through it')).toBeVisible();

    // Take a screenshot of the UI
    await page.screenshot({ path: 'test-results/ui-and-test-chats.png', fullPage: true });
  });
});