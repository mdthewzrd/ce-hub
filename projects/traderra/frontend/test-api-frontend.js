// Test script to simulate the frontend fetch behavior
async function testOpenRouterAPI() {
  console.log('Testing OpenRouter API endpoint...')

  try {
    // Test 1: GET request (like the frontend does on component mount)
    console.log('\n1. Testing GET request...')
    const getResponse = await fetch('http://localhost:6567/api/openrouter-key', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (!getResponse.ok) {
      throw new Error(`GET failed: ${getResponse.status} ${getResponse.statusText}`)
    }

    const getData = await getResponse.json()
    console.log('GET Response:', getData)

    // Test 2: POST request (like when user saves an API key)
    console.log('\n2. Testing POST request...')
    const postResponse = await fetch('http://localhost:6567/api/openrouter-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: 'sk-or-v1-frontend-test-12345'
      })
    })

    if (!postResponse.ok) {
      throw new Error(`POST failed: ${postResponse.status} ${postResponse.statusText}`)
    }

    const postData = await postResponse.json()
    console.log('POST Response:', postData)

    // Test 3: Verify the key was saved with another GET
    console.log('\n3. Testing verification GET request...')
    const verifyResponse = await fetch('http://localhost:6567/api/openrouter-key', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (!verifyResponse.ok) {
      throw new Error(`Verification GET failed: ${verifyResponse.status} ${verifyResponse.statusText}`)
    }

    const verifyData = await verifyResponse.json()
    console.log('Verification Response:', verifyData)

    console.log('\n✅ All tests passed!')

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error('Stack:', error.stack)
  }
}

// Run the test
testOpenRouterAPI()