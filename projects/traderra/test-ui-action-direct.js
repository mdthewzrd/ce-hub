/**
 * Direct test of UI action processing for date ranges
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

async function testUIActionDirect() {
  console.log('🧪 Testing UI action processing directly...');

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
      prompt: 'All of 2025',
      context: {
        user_id: 'test_user',
        page: 'dashboard'
      },
      mode: 'analyst'
    };

    console.log('📤 Sending request:', JSON.stringify(data, null, 2));

    const response = await makeRequest(options, data);

    if (response.status === 200) {
      console.log('✅ Backend responded successfully');
      console.log('📊 Response data:', JSON.stringify(response.data, null, 2));

      // Check for UI action in response
      const responseData = response.data;
      if (responseData.ui_action) {
        console.log('🎯 UI Action found:', responseData.ui_action);

        if (responseData.ui_action.action_type === 'set_custom_date_range' ||
            responseData.ui_action.action === 'set_custom_date_range') {
          console.log('📅 Custom date range action detected!');

          const startDate = responseData.ui_action.start_date || responseData.ui_action.parameters?.start_date;
          const endDate = responseData.ui_action.end_date || responseData.ui_action.parameters?.end_date;

          console.log(`   Start date: ${startDate}`);
          console.log(`   End date: ${endDate}`);

          const is2025Range = startDate === '2025-01-01' && endDate === '2025-12-31';
          console.log(`   Correct 2025 range: ${is2025Range ? '✅ Yes' : '❌ No'}`);

          return is2025Range;
        } else {
          console.log('⚠️ Different action type:', responseData.ui_action.action_type || responseData.ui_action.action);
        }
      } else {
        console.log('❌ No UI action found in response');
        console.log('Available keys:', Object.keys(responseData));
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

  return false;
}

// Run the test
testUIActionDirect().catch(console.error);