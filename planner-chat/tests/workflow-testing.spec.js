const { test, expect } = require('@playwright/test');

// Helper function to wait for AI response
async function waitForAIResponse(page, timeout = 30000) {
  await page.waitForSelector('#typing-indicator.hidden', { timeout });
  await page.waitForFunction(() => {
    const sendBtn = document.querySelector('#send-btn');
    return !sendBtn.disabled;
  }, { timeout });
}

// Helper function to send a message and wait for response
async function sendMessageAndWait(page, message) {
  await page.fill('#message-input', message);
  await page.click('#send-btn');
  await waitForAIResponse(page);
}

// Helper function to create a new project
async function createProject(page, projectName) {
  await page.click('#new-project-btn');
  await page.waitForSelector('.modal:not(.hidden)');
  await page.fill('#project-title', projectName);
  await page.click('#create-project-btn');
  await page.waitForSelector('.modal.hidden');
}

// Helper function to create a new chat
async function createChat(page, chatTitle) {
  await page.click('#new-chat-btn');
  await page.waitForSelector('.modal:not(.hidden)');
  await page.fill('#chat-title', chatTitle);
  await page.click('#create-chat-btn');
  await page.waitForSelector('.modal.hidden');
}

test.describe('Workflow Testing Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for the app to load completely
    await page.waitForSelector('#project-tree');
    await page.waitForSelector('#connection-status.online');
  });

  test('Test 1: Spitball Ideas Workflow - AI Agent for Productivity', async ({ page }) => {
    // Create new project for this test
    await createProject(page, 'Test: Spitball AI Agent');

    // Create new chat in the project
    await createChat(page, 'Spitball: Productivity AI Agent');

    // Start the conversation with a vague idea
    await sendMessageAndWait(page, 'I want to create some kind of AI agent that helps people with productivity but I\'m not sure exactly what yet. Can we just brainstorm some ideas?');

    // Verify the AI asks about starting approach
    let lastMessage = page.locator('.message.ai').last();
    await expect(lastMessage).toContainText('How would you like to start?');
    await expect(lastMessage).toContainText('spitball ideas');

    // Continue with more specific direction
    await sendMessageAndWait(page, 'I\'m thinking more about personal productivity, especially around helping people who get overwhelmed with too many tasks and projects');

    // Verify AI provides focused options
    lastMessage = page.locator('.message.ai').last();
    await expect(lastMessage).toContainText('overwhelmed');

    // Select one of the options
    await sendMessageAndWait(page, 'The Smart Prioritization Agent sounds really interesting. How would something like that actually work?');

    // Verify AI provides deeper exploration
    lastMessage = page.locator('.message.ai').last();
    await expect(lastMessage).toContainText('Core concept');

    // Show interest in planning
    await sendMessageAndWait(page, 'Yes! The explaining WHY part is crucial. I want to understand the reasoning, not just get told what to do. Can we plan out how this would actually work?');

    // Verify AI offers to move to planning phase
    lastMessage = page.locator('.message.ai').last();
    await expect(lastMessage).toContainText('Ready to move from brainstorming to planning');

    // Take a screenshot of the completed conversation
    await page.screenshot({ path: 'test-results/spitball-workflow.png', fullPage: true });
  });

  test('Test 2: Upload Documents Workflow - SaaS Feature Planning', async ({ page }) => {
    // Create new project for this test
    await createProject(page, 'Test: SaaS Feature Planning');

    // Create new chat in the project
    await createChat(page, 'Upload Docs: Feature Specification');

    // Start with intention to upload documents
    await sendMessageAndWait(page, 'I want to plan out a new feature for my SaaS product. I have some existing research and user feedback documents I\'d like to use as a starting point.');

    // Verify AI asks about document types and goals
    let lastMessage = page.locator('.message.ai').last();
    await expect(lastMessage).toContainText('How would you like to start?');
    await expect(lastMessage).toContainText('upload');

    // Simulate having documents
    await sendMessageAndWait(page, 'I have user interview transcripts, competitor analysis, and some initial wireframes. Let me upload them.');

    // Verify AI acknowledges the uploads and asks clarifying questions
    lastMessage = page.locator('.message.ai').last();
    await expect(lastMessage).toContainText('main goal');

    // Provide the goal
    await sendMessageAndWait(page, 'I want to create a comprehensive feature specification that I can share with my development team.');

    // Verify AI asks for constraints
    lastMessage = page.locator('.message.ai').last();
    await expect(lastMessage).toContainText('Quick clarification');

    // Provide constraints
    await sendMessageAndWait(page, 'Timeline is 3 months, we\'re using React/Node.js stack, and it also needs to go to our product manager and design team.');

    // Verify AI generates comprehensive spec
    lastMessage = page.locator('.message.ai').last();
    await expect(lastMessage).toContainText('comprehensive feature specification');
    await expect(lastMessage).toContainText('React/Node.js');

    // Take a screenshot of the completed conversation
    await page.screenshot({ path: 'test-results/upload-docs-workflow.png', fullPage: true });
  });

  test('Test 3: Use Inspiration Workflow - E-commerce Automation', async ({ page }) => {
    // Create new project for this test
    await createProject(page, 'Test: E-commerce Automation');

    // Create new chat in the project
    await createChat(page, 'Inspiration: Visual Interface Automation');

    // Start with inspiration reference
    await sendMessageAndWait(page, 'I saw this amazing demo of Claude\'s computer use feature and I want to build something similar for automating web tasks. Can we plan this out?');

    // Verify AI asks about specific aspects
    let lastMessage = page.locator('.message.ai').last();
    await expect(lastMessage).toContainText('How would you like to start?');
    await expect(lastMessage).toContainText('inspiration');

    // Provide the specific application
    await sendMessageAndWait(page, 'I loved how it could understand visual interfaces and take actions. I want to build something for e-commerce automation - like automatically managing inventory, updating prices, processing orders across multiple platforms.');

    // Verify AI connects inspiration to the problem
    lastMessage = page.locator('.message.ai').last();
    await expect(lastMessage).toContainText('Visual understanding');

    // Get more specific
    await sendMessageAndWait(page, 'Exactly! Lots of smaller e-commerce platforms have terrible APIs or none at all. I want to start with inventory synchronization across 3-4 platforms. I have experience with Shopify, WooCommerce, and Etsy.');

    // Verify AI validates the approach
    lastMessage = page.locator('.message.ai').last();
    await expect(lastMessage).toContainText('gap');
    await expect(lastMessage).toContainText('visual approach');

    // Provide requirements
    await sendMessageAndWait(page, 'I\'d want it to run every hour, triggered automatically. Pretty complex rules - different pricing strategies per platform, variant management, stock thresholds. Let\'s plan the architecture.');

    // Verify AI provides architecture outline
    lastMessage = page.locator('.message.ai').last();
    await expect(lastMessage).toContainText('Visual E-commerce Automation System Architecture');
    await expect(lastMessage).toContainText('Visual Understanding Engine');

    // Take a screenshot of the completed conversation
    await page.screenshot({ path: 'test-results/inspiration-workflow.png', fullPage: true });
  });

  test('Test 4: Conversational Workflow - Knowledge Management', async ({ page }) => {
    // Create new project for this test
    await createProject(page, 'Test: Knowledge Management');

    // Create new chat in the project
    await createChat(page, 'Chat: Team Knowledge System');

    // Start with a problem statement
    await sendMessageAndWait(page, 'I need to figure out a better system for managing my team\'s knowledge and documentation. Everything is scattered and hard to find.');

    // Verify AI responds conversationally
    let lastMessage = page.locator('.message.ai').last();
    await expect(lastMessage).toContainText('scattered knowledge');
    await expect(lastMessage).toContainText('How would you like to start?');
    await expect(lastMessage).toContainText('chat through');

    // Continue conversationally
    await sendMessageAndWait(page, 'All of the above honestly. We have stuff in Notion, Google Docs, Slack threads, GitHub wikis, and probably other places I\'m forgetting.');

    // Verify AI asks follow-up questions naturally
    lastMessage = page.locator('.message.ai').last();
    await expect(lastMessage).toContainText('death by a thousand');

    // Provide the trigger
    await sendMessageAndWait(page, 'Yeah exactly! And last week we had a client escalation because nobody could find the troubleshooting guide for their specific setup. It was buried in some Google Doc from 6 months ago.');

    // Verify AI understands the core problem
    lastMessage = page.locator('.message.ai').last();
    await expect(lastMessage).toContainText('discoverability');

    // Suggest a solution direction
    await sendMessageAndWait(page, 'I think AI answering questions directly would be amazing. Like instead of searching for docs, I could just ask "How do we handle SSL certificate issues for enterprise clients?" and get the answer immediately.');

    // Verify AI explores the solution
    lastMessage = page.locator('.message.ai').last();
    await expect(lastMessage).toContainText('both sides');

    // Answer the key question
    await sendMessageAndWait(page, 'Good question. I think people would move important stuff if the new system was clearly better, but trying to migrate everything would be a nightmare.');

    // Continue the conversation to solution
    await sendMessageAndWait(page, 'We\'re about 15 people. I\'d rather use an existing tool as the foundation if possible - don\'t want to build a whole knowledge management system from scratch.');

    // Verify AI provides practical options
    lastMessage = page.locator('.message.ai').last();
    await expect(lastMessage).toContainText('Perfect size');
    await expect(lastMessage).toContainText('Notion');

    // Provide preferences
    await sendMessageAndWait(page, 'I think flexible is better for us - we\'re a pretty creative/collaborative team. And I\'d like to get something working in the next month or two.');

    // Verify AI provides concrete plan
    lastMessage = page.locator('.message.ai').last();
    await expect(lastMessage).toContainText('Phase 1');
    await expect(lastMessage).toContainText('Phase 2');
    await expect(lastMessage).toContainText('Phase 3');

    // Take a screenshot of the completed conversation
    await page.screenshot({ path: 'test-results/conversational-workflow.png', fullPage: true });
  });

  test('Test 5: Verify UI Improvements Work', async ({ page }) => {
    // Navigate to Testing Workflows project
    await page.click('text=Testing Workflows');

    // Verify chats are visible
    await expect(page.locator('text=Spitball Ideas Workflow')).toBeVisible();
    await expect(page.locator('text=Upload Documents Workflow')).toBeVisible();
    await expect(page.locator('text=Use Inspiration Workflow')).toBeVisible();
    await expect(page.locator('text=Conversational Workflow')).toBeVisible();

    // Click on a chat to test the new UI behavior
    await page.click('text=Spitball Ideas Workflow');

    // Verify chat opens in main window (not just details panel)
    await expect(page.locator('.messages-area .welcome-message')).toBeVisible();
    await expect(page.locator('.welcome-message h2')).toContainText('Spitball Ideas Workflow');

    // Verify details panel is at bottom and compact
    const detailsPanel = page.locator('#details-panel');
    await expect(detailsPanel).toBeVisible();

    // Verify the details panel contains chat info
    await expect(page.locator('.chat-details')).toContainText('c2699fc02c9c');

    // Take a screenshot of the UI improvements
    await page.screenshot({ path: 'test-results/ui-improvements.png', fullPage: true });
  });
});