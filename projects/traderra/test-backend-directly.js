/**
 * Direct test of backend custom date range functionality
 */

const http = require('http');

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testBackendDirectly() {
  console.log('🧪 Testing backend custom date range functionality directly...');

  const testCommands = [
    'from january 1st to january 31st',
    'from december 1st through december 31st',
    'between march 1 and march 15',
    'from 12/1/2024 to 12/31/2024'
  ];

  for (const command of testCommands) {
    console.log(`\n📝 Testing command: "${command}"`);

    try {
      const options = {
        hostname: 'localhost',
        port: 6500,
        path: '/ai/query',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      };

      const data = {
        prompt: command,
        context: {
          user_id: 'test_user',
          page: 'dashboard'
        },
        mode: 'analyst'
      };

      const response = await makeRequest(options, data);

      if (response.status === 200) {
        console.log('✅ Backend responded successfully');

        // Check for UI action in response
        const responseData = response.data;
        if (responseData.ui_action) {
          console.log('🎯 UI Action found:', responseData.ui_action);

          if (responseData.ui_action.action_type === 'set_custom_date_range' ||
              responseData.ui_action.action === 'set_custom_date_range') {
            console.log('📅 Custom date range action detected!');
            console.log(`   Start date: ${responseData.ui_action.start_date || responseData.ui_action.parameters?.start_date}`);
            console.log(`   End date: ${responseData.ui_action.end_date || responseData.ui_action.parameters?.end_date}`);
          } else {
            console.log('⚠️ Different action type:', responseData.ui_action.action_type || responseData.ui_action.action);
          }
        } else {
          console.log('❌ No UI action found in response');
          console.log('Response data:', responseData);
        }

        // Check response text
        if (responseData.response) {
          console.log(`💬 Response: "${responseData.response}"`);
        }
      } else {
        console.log(`❌ Backend returned status ${response.status}`);
        console.log('Response:', response.data);
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
  }

  console.log('\n📊 Backend testing complete!');
}

// Run the test
testBackendDirectly().catch(console.error);