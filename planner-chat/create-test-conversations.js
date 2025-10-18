const fs = require('fs');
const path = require('path');

// Create test conversations for each workflow
async function createTestConversations() {
  const baseUrl = 'http://localhost:7001';

  // Helper function to send chat message
  async function sendChatMessage(message) {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        model: 'meta-llama/llama-3.2-3b-instruct:free'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  }

  // Create conversation 1: Spitball Ideas
  console.log('Creating Spitball Ideas conversation...');
  let conversation1 = `# Live Test: Spitball Ideas Workflow

**Created**: ${new Date().toISOString()}
**Project**: Testing Workflows - Live Tests
**Type**: Strategic Planning

---

## User
I want to create some kind of AI productivity tool but I'm not sure what exactly. Can we brainstorm ideas?

## Planner
`;

  try {
    const response1 = await sendChatMessage('I want to create some kind of AI productivity tool but I\'m not sure what exactly. Can we brainstorm ideas?');
    conversation1 += response1 + '\n\n## User\nI\'d like to spitball ideas from scratch - just brainstorm without any existing materials.\n\n## Planner\n';

    const response2 = await sendChatMessage('I\'d like to spitball ideas from scratch - just brainstorm without any existing materials.');
    conversation1 += response2 + '\n\n## User\nI\'m interested in helping people who get overwhelmed with too many tasks and projects.\n\n## Planner\n';

    const response3 = await sendChatMessage('I\'m interested in helping people who get overwhelmed with too many tasks and projects.');
    conversation1 += response3 + '\n\n## User\nThe prioritization idea sounds interesting. How would that work in practice?\n\n## Planner\n';

    const response4 = await sendChatMessage('The prioritization idea sounds interesting. How would that work in practice?');
    conversation1 += response4 + '\n\n## User\nYes! I love the explaining WHY part. Can we plan this out in detail?\n\n## Planner\n';

    const response5 = await sendChatMessage('Yes! I love the explaining WHY part. Can we plan this out in detail?');
    conversation1 += response5;

    // Save conversation
    const filepath1 = '/Users/michaeldurante/ai dev/ce-hub/planner-chat/projects/testing-workflows/chats/2025-10-12_live-spitball-test.md';
    fs.writeFileSync(filepath1, conversation1);
    console.log('✅ Spitball conversation saved');

  } catch (error) {
    console.error('Error creating spitball conversation:', error.message);
  }

  // Create conversation 2: Upload Documents
  console.log('Creating Upload Documents conversation...');
  let conversation2 = `# Live Test: Upload Documents Workflow

**Created**: ${new Date().toISOString()}
**Project**: Testing Workflows - Live Tests
**Type**: Strategic Planning

---

## User
I want to plan a new SaaS feature and I have research documents I'd like to upload as a starting point.

## Planner
`;

  try {
    const response1 = await sendChatMessage('I want to plan a new SaaS feature and I have research documents I\'d like to upload as a starting point.');
    conversation2 += response1 + '\n\n## User\nI have user interviews, competitor analysis, and wireframes. I want to upload existing documents rather than start from scratch.\n\n## Planner\n';

    const response2 = await sendChatMessage('I have user interviews, competitor analysis, and wireframes. I want to upload existing documents rather than start from scratch.');
    conversation2 += response2 + '\n\n## User\nI want to create a comprehensive feature specification that my development team can use.\n\n## Planner\n';

    const response3 = await sendChatMessage('I want to create a comprehensive feature specification that my development team can use.');
    conversation2 += response3 + '\n\n## User\nWe\'re using React/Node.js, have a 3 month timeline, and it needs to go to PM and design teams too.\n\n## Planner\n';

    const response4 = await sendChatMessage('We\'re using React/Node.js, have a 3 month timeline, and it needs to go to PM and design teams too.');
    conversation2 += response4;

    // Save conversation
    const filepath2 = '/Users/michaeldurante/ai dev/ce-hub/planner-chat/projects/testing-workflows/chats/2025-10-12_live-upload-docs-test.md';
    fs.writeFileSync(filepath2, conversation2);
    console.log('✅ Upload docs conversation saved');

  } catch (error) {
    console.error('Error creating upload docs conversation:', error.message);
  }

  // Create conversation 3: Use Inspiration
  console.log('Creating Use Inspiration conversation...');
  let conversation3 = `# Live Test: Use Inspiration Workflow

**Created**: ${new Date().toISOString()}
**Project**: Testing Workflows - Live Tests
**Type**: Strategic Planning

---

## User
I saw Claude's computer use demo and want to build something similar for e-commerce automation. Can we plan this?

## Planner
`;

  try {
    const response1 = await sendChatMessage('I saw Claude\'s computer use demo and want to build something similar for e-commerce automation. Can we plan this?');
    conversation3 += response1 + '\n\n## User\nI want to use that as inspiration - I loved how it understood visual interfaces for inventory management across platforms.\n\n## Planner\n';

    const response2 = await sendChatMessage('I want to use that as inspiration - I loved how it understood visual interfaces for inventory management across platforms.');
    conversation3 += response2 + '\n\n## User\nExactly! Small e-commerce platforms have bad APIs. I want to sync inventory across Shopify, WooCommerce, and Etsy.\n\n## Planner\n';

    const response3 = await sendChatMessage('Exactly! Small e-commerce platforms have bad APIs. I want to sync inventory across Shopify, WooCommerce, and Etsy.');
    conversation3 += response3 + '\n\n## User\nI need hourly automation with complex pricing rules per platform. Let\'s plan the architecture.\n\n## Planner\n';

    const response4 = await sendChatMessage('I need hourly automation with complex pricing rules per platform. Let\'s plan the architecture.');
    conversation3 += response4;

    // Save conversation
    const filepath3 = '/Users/michaeldurante/ai dev/ce-hub/planner-chat/projects/testing-workflows/chats/2025-10-12_live-inspiration-test.md';
    fs.writeFileSync(filepath3, conversation3);
    console.log('✅ Inspiration conversation saved');

  } catch (error) {
    console.error('Error creating inspiration conversation:', error.message);
  }

  // Create conversation 4: Conversational
  console.log('Creating Conversational workflow conversation...');
  let conversation4 = `# Live Test: Conversational Workflow

**Created**: ${new Date().toISOString()}
**Project**: Testing Workflows - Live Tests
**Type**: Strategic Planning

---

## User
I need help figuring out a knowledge management system for my team. Everything is scattered and hard to find.

## Planner
`;

  try {
    const response1 = await sendChatMessage('I need help figuring out a knowledge management system for my team. Everything is scattered and hard to find.');
    conversation4 += response1 + '\n\n## User\nLet\'s just chat through it. We have stuff in Notion, Google Docs, Slack threads, GitHub wikis.\n\n## Planner\n';

    const response2 = await sendChatMessage('Let\'s just chat through it. We have stuff in Notion, Google Docs, Slack threads, GitHub wikis.');
    conversation4 += response2 + '\n\n## User\nLast week we had a client escalation because nobody could find our troubleshooting guide. It was buried in some old Google Doc.\n\n## Planner\n';

    const response3 = await sendChatMessage('Last week we had a client escalation because nobody could find our troubleshooting guide. It was buried in some old Google Doc.');
    conversation4 += response3 + '\n\n## User\nI think AI answering questions directly would be amazing. Like asking "How do we handle SSL issues?" and getting immediate answers.\n\n## Planner\n';

    const response4 = await sendChatMessage('I think AI answering questions directly would be amazing. Like asking "How do we handle SSL issues?" and getting immediate answers.');
    conversation4 += response4 + '\n\n## User\nWe\'re 15 people, prefer existing tools as foundation, want something working in 1-2 months.\n\n## Planner\n';

    const response5 = await sendChatMessage('We\'re 15 people, prefer existing tools as foundation, want something working in 1-2 months.');
    conversation4 += response5;

    // Save conversation
    const filepath4 = '/Users/michaeldurante/ai dev/ce-hub/planner-chat/projects/testing-workflows/chats/2025-10-12_live-conversational-test.md';
    fs.writeFileSync(filepath4, conversation4);
    console.log('✅ Conversational conversation saved');

  } catch (error) {
    console.error('Error creating conversational conversation:', error.message);
  }

  console.log('\n🎉 All live test conversations created! Check the Testing Workflows project to see the real AI interactions.');
}

// Run the test
createTestConversations().catch(console.error);