/**
 * Debug script to simulate the exact flow in standalone-renata-chat.tsx
 * This reproduces the actual issue with the multi-command processing
 */

// Simulate the API call failure
const mockAPI = {
  renata: {
    intelligentChat: async (userInput, uiContext, conversationHistory) => {
      console.log('🚀 Making API call to http://localhost:6500/ai/conversation...');

      // Simulate network failure (backend not running)
      throw new Error('API request failed: Failed to fetch - API server not running');
    }
  }
};

// Simulate the processUserCommand function from standalone-renata-chat.tsx
async function processUserCommand(userMessage) {
  try {
    // Prepare UI context for the AI
    const uiContext = {
      current_page: '/dashboard',
      display_mode: 'dollar',
      filters_active: [],
      time_range: 'all',
      user_location: 'renata_chat_sidebar'
    };

    const conversationHistory = [];

    console.log(`🚀 Processing AI command: "${userMessage}"`);
    console.log(`🎯 Context:`, uiContext);

    // This will fail because backend is not running
    const aiResponse = await mockAPI.renata.intelligentChat(userMessage, uiContext, conversationHistory);
    console.log(`✅ AI Response received:`, aiResponse);

    return aiResponse.response;

  } catch (error) {
    console.error('❌ AI API Error:', error);

    // Enhanced fallback with multi-command simulation for testing
    const lowerMessage = userMessage.toLowerCase().trim();

    // DEBUG: Log the message processing
    console.log('🔍 DEBUG: Processing message:', lowerMessage);
    console.log('🔍 DEBUG: Contains dashboard?', lowerMessage.includes('dashboard'));
    console.log('🔍 DEBUG: Contains 90 days?', lowerMessage.includes('90 days') || lowerMessage.includes('last 90 days'));
    console.log('🔍 DEBUG: Contains R?', lowerMessage.includes(' in r') || lowerMessage.includes('r-multiple') || lowerMessage.includes('r multiples'));

    // Dashboard + 90 days + R pattern (this is the exact pattern from line 197)
    if (lowerMessage.includes('dashboard') &&
        (lowerMessage.includes('last 90 days') || lowerMessage.includes('90 days')) &&
        (lowerMessage.includes(' in r') || lowerMessage.includes('r-multiple') || lowerMessage.includes('r multiples'))) {

      console.log('🧪 Simulating multi-command: dashboard + 90 days + R');

      const mockUIAction = {
        action_type: 'multi_command',
        parameters: {
          commands: [
            { action_type: 'navigation', parameters: { page: '/dashboard' } },
            { action_type: 'date_range', parameters: { date_range: 'last_90_days' } },
            { action_type: 'display_mode', parameters: { mode: 'r' } }
          ]
        }
      };

      // This would apply the state changes
      console.log('🎯 Applying AI state changes:', mockUIAction);
      const result = applyAIStateChanges(mockUIAction);
      console.log('🎯 State changes applied:', result);

      return '🧠 Understanding: Navigate to dashboard and show last 90 days in R-multiples. I\'ve navigated to your dashboard, set the date range to the last 90 days, and switched to R-multiples display mode.';
    }

    // Simple navigation commands as fallback
    if (lowerMessage.includes('dashboard') || lowerMessage.includes('main page')) {
      console.log('🧭 Simple navigation fallback triggered');
      return '🧭 Navigating to dashboard...';
    }

    return 'Sorry, I\'m having trouble connecting right now. Please try again or check your internet connection.';
  }
}

// Simulate the applyAIStateChanges function
async function applyAIStateChanges(uiAction) {
  const { action_type, parameters } = uiAction;
  const appliedChanges = [];

  try {
    switch (action_type) {
      case 'navigation':
        if (parameters.page) {
          console.log(`🧭 Would navigate to: ${parameters.page}`);
          appliedChanges.push(`navigated to ${parameters.page}`);
        }
        break;

      case 'date_range':
        if (parameters.date_range) {
          console.log(`📅 Would set date range to: ${parameters.date_range}`);
          appliedChanges.push(`date range: ${parameters.date_range}`);
        }
        break;

      case 'display_mode':
        if (parameters.mode) {
          console.log(`🎨 Would set display mode to: ${parameters.mode}`);
          appliedChanges.push(`display mode: ${parameters.mode}`);
        }
        break;

      case 'multi_command':
        // Handle multiple commands in sequence
        if (parameters.commands && Array.isArray(parameters.commands)) {
          console.log(`🔧 Processing ${parameters.commands.length} multi-commands:`);
          for (const command of parameters.commands) {
            const result = await applyAIStateChanges(command);
            appliedChanges.push(...result);
          }
        }
        break;

      default:
        console.log(`Unknown action type: ${action_type}`);
    }

    console.log(`✅ Applied state changes: ${appliedChanges.join(', ')}`);
    return appliedChanges;

  } catch (error) {
    console.error('❌ Error applying state changes:', error);
    return [];
  }
}

// Main test
async function main() {
  console.log('='.repeat(80));
  console.log('TESTING RENATA CHAT MULTI-COMMAND SYSTEM');
  console.log('='.repeat(80));

  const testMessage = "go to the dashboard and look at the last 90 days in R";

  console.log(`\n📤 Testing message: "${testMessage}"`);
  console.log('-'.repeat(50));

  const response = await processUserCommand(testMessage);

  console.log('-'.repeat(50));
  console.log(`\n📥 Final response: "${response}"`);

  console.log('\n' + '='.repeat(80));
  console.log('TEST COMPLETE');
  console.log('='.repeat(80));
}

// Run the test
main().catch(console.error);