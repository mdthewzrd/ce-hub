// Test script to verify multi-command state changes work
// Run this in browser console on the dashboard

const testMultiCommand = async () => {
  console.log('🧪 Testing Multi-Command State Changes...')

  // Test case 1: "show me stats for year to date in R"
  console.log('\n📋 Test 1: "show me stats for year to date in R"')
  try {
    const response = await fetch('http://localhost:6500/ai/conversation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_input: "show me stats for year to date in R",
        ui_context: {
          current_page: "/dashboard",
          display_mode: "dollar",
          filters_active: [],
          time_range: "year",
          user_location: "renata_chat_sidebar"
        },
        conversation_history: []
      })
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ AI Response:', result)

      if (result.ui_action) {
        console.log('🎯 UI Action detected:', result.ui_action)

        if (result.ui_action.action_type === 'multi_command') {
          console.log('🔥 Multi-command found!', result.ui_action.parameters.commands)
          result.ui_action.parameters.commands.forEach((cmd, idx) => {
            console.log(`  ${idx + 1}. ${cmd.action_type}:`, cmd.parameters)
          })
        } else {
          console.log('ℹ️ Single action:', result.ui_action.action_type)
        }
      } else {
        console.log('⚠️ No UI action found in response')
      }
    } else {
      console.error('❌ API call failed:', response.status, response.statusText)
    }
  } catch (error) {
    console.error('❌ Test failed:', error)
  }

  // Test case 2: "navigate to trades and show last 90 days in percent"
  console.log('\n📋 Test 2: "navigate to trades and show last 90 days in percent"')
  try {
    const response = await fetch('http://localhost:6500/ai/conversation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_input: "navigate to trades and show last 90 days in percent",
        ui_context: {
          current_page: "/dashboard",
          display_mode: "dollar",
          filters_active: [],
          time_range: "year",
          user_location: "renata_chat_sidebar"
        },
        conversation_history: []
      })
    })

    if (response.ok) {
      const result = await response.json()
      console.log('✅ AI Response:', result)

      if (result.ui_action) {
        console.log('🎯 UI Action detected:', result.ui_action)

        if (result.ui_action.action_type === 'multi_command') {
          console.log('🔥 Multi-command found!', result.ui_action.parameters.commands)
          result.ui_action.parameters.commands.forEach((cmd, idx) => {
            console.log(`  ${idx + 1}. ${cmd.action_type}:`, cmd.parameters)
          })
        } else {
          console.log('ℹ️ Single action:', result.ui_action.action_type)
        }
      } else {
        console.log('⚠️ No UI action found in response')
      }
    } else {
      console.error('❌ API call failed:', response.status, response.statusText)
    }
  } catch (error) {
    console.error('❌ Test failed:', error)
  }

  console.log('\n🏁 Test completed!')
}

// Export for manual testing
window.testMultiCommand = testMultiCommand
console.log('💡 Run testMultiCommand() in console to test multi-command functionality')