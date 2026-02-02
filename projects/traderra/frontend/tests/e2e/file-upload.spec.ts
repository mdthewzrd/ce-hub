import { test, expect } from '@playwright/test'

test.describe('File Upload to Renata Chat', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:6565')

    // Wait for page to load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Additional wait for initialization
  })

  test('should upload CSV file and receive acknowledgment', async ({ page }) => {
    console.log('=== Starting File Upload Test ===')

    // Step 1: Find the chat file input directly
    console.log('Step 1: Looking for chat file input...')
    const chatFileInput = page.locator('input[type="file"][accept=".csv"]')
    await expect(chatFileInput).toBeAttached({ timeout: 5000 })

    // Step 3: Create a test CSV file
    console.log('Step 3: Creating test CSV file...')
    const testCSV = `Open Datetime,Close Datetime,Symbol,Side,Volume,Entry Price,Exit Price,Net P&L
2024-01-15 09:30:00,2024-01-15 10:15:00,AAPL,Long,100,150.25,152.30,205.0
2024-01-16 14:00:00,2024-01-16 14:30:00,TSLA,Short,50,210.50,208.25,112.5
2024-01-17 10:00:00,2024-01-17 11:00:00,MSFT,Long,75,380.00,385.50,412.5`

    // Step 4: Upload the CSV file
    console.log('Step 4: Uploading CSV file...')
    await chatFileInput.setInputContent({
      name: 'test-trades.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(testCSV, 'utf-8')
    })

    // Step 5: Wait for file to appear in UI
    console.log('Step 5: Waiting for file indicator...')
    const fileIndicator = page.locator('text=📎 test-trades.csv')
    await expect(fileIndicator).toBeVisible({ timeout: 5000 })
    console.log('✅ File indicator visible')

    // Step 6: Type message
    console.log('Step 6: Typing message...')
    const chatInput = page.locator('input[placeholder*="Chat with Renata"]')
    await chatInput.fill('upload my trades')
    console.log('✅ Message typed')

    // Step 7: Click send button
    console.log('Step 7: Clicking send button...')
    const sendButton = page.locator('button').filter(has =>
      has.textContent('Send') || has.innerHTML?.includes('Send')
    ).first()
    await sendButton.click()
    console.log('✅ Send button clicked')

    // Step 8: Wait for AI response
    console.log('Step 8: Waiting for AI response...')
    await page.waitForTimeout(5000)

    // Step 9: Check response for file acknowledgment
    console.log('Step 9: Checking response...')
    const response = await page.locator('.bg-studio-accent\\/50, .border-border').last()
    const responseText = await response.textContent()

    console.log('AI Response:', responseText)
    console.log('Contains "FILE UPLOADED"?', responseText.includes('FILE UPLOADED'))
    console.log('Contains "received" or "acknowledges"?',
      responseText.includes('received') || responseText.includes('acknowledges'))

    // Assertions
    expect(responseText.length).toBeGreaterThan(0)

    // Check if file was acknowledged
    const hasFileUpload = responseText.includes('FILE UPLOADED') ||
                          responseText.includes('received') ||
                          responseText.includes('acknowledges')

    if (hasFileUpload) {
      console.log('✅ SUCCESS: File was acknowledged in response!')
    } else {
      console.log('❌ FAIL: File was NOT acknowledged')
      console.log('Full response:', responseText)
    }

    expect(hasFileUpload).toBe(true)
  })

  test('API endpoint receives file data directly', async ({ page }) => {
    // Listen for API calls
    const apiCalls = []

    await page.route('**/api/agui', async route => {
      const postData = await route.request.postData()
      if (postData) {
        apiCalls.push(JSON.parse(postData.toString()))
      }
      return route.continue()
    })

    await page.goto('http://localhost:6565')
    await page.waitForLoadState('networkidle')

    // Upload file via chat
    const chatFileInput = page.locator('input[type="file"][accept=".csv"]')
    await chatFileInput.setInputContent({
      name: 'test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('A,B,C\n1,2,3', 'utf-8')
    })

    // Send message
    const chatInput = page.locator('input[placeholder*="Chat with Renata"]')
    await chatInput.fill('test')

    const sendButton = page.locator('button').filter(has =>
      has.textContent('Send') || has.innerHTML?.includes('Send')
    ).first()
    await sendButton.click()

    await page.waitForTimeout(3000)

    // Check API calls
    console.log('=== API Calls ===')
    console.log('Number of API calls:', apiCalls.length)

    if (apiCalls.length > 0) {
      const call = apiCalls[0]
      console.log('API Call data:')
      console.log('  Has attachedFile?', !!call.attachedFile)
      console.log('  File name:', call.attachedFile?.name)
      console.log('  Has content?', !!call.attachedFile?.content)
      console.log('  Content length:', call.attachedFile?.content?.length || 0)

      expect(call.attachedFile).toBeDefined()
      expect(call.attachedFile.content.length).toBeGreaterThan(0)
    } else {
      console.log('❌ No API calls were made')
    }
  })
})
