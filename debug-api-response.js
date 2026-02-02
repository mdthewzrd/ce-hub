const { chromium } = require('playwright');

async function debugAPIResponse() {
    console.log('🔍 Debugging API response and message flow...\n');

    try {
        const browser = await chromium.launch({ headless: false });
        const page = await browser.newPage();

        // Log all network requests
        const apiCalls = [];
        page.on('request', (request) => {
            if (request.url().includes('openrouter') || request.url().includes('api/renata')) {
                apiCalls.push({
                    url: request.url(),
                    method: request.method(),
                    postData: request.postData()
                });
                console.log(`📤 API Request: ${request.method()} ${request.url()}`);
            }
        });

        page.on('response', (response) => {
            if (response.url().includes('openrouter') || response.url().includes('api/renata')) {
                console.log(`📥 API Response: ${response.status()} ${response.url()}`);
            }
        });

        page.on('console', (msg) => {
            if (msg.text().includes('API') || msg.text().includes('Sending') || msg.text().includes('Error')) {
                console.log(`📝 Console: ${msg.text()}`);
            }
        });

        await page.goto('http://localhost:5656');
        await page.waitForTimeout(3000);

        // Open Renata chat
        const renataButton = await page.$('button:has-text("Renata")');
        if (renataButton) {
            await renataButton.click();
            await page.waitForTimeout(1000);
        }

        // Upload and test
        const uploadButton = await page.$('button[title*="Upload"]');
        if (uploadButton) {
            await uploadButton.click();
            const fileInput = await page.$('input[type="file"]');
            if (fileInput) {
                await fileInput.setInputFiles('/tmp/test-upload.py');
                await page.waitForTimeout(1000);
            }
        }

        // Check message state before sending
        const messageCountBefore = await page.evaluate(() => {
            return document.querySelectorAll('[style*="background-color"]').length;
        });
        console.log(`Messages before sending: ${messageCountBefore}`);

        // Send message with file
        const sendSuccess = await page.evaluate(() => {
            const input = document.querySelector('input[type="text"]');
            if (input) {
                input.value = 'Please help me format this code';

                // Trigger change event
                input.dispatchEvent(new Event('input', { bubbles: true }));

                // Find and click send button
                const buttons = document.querySelectorAll('button');
                for (const button of buttons) {
                    if (button.querySelector('svg') && button.textContent.trim() === '') {
                        // This is the send button
                        console.log('Clicking send button');
                        button.click();
                        return true;
                    }
                }
            }
            return false;
        });

        if (sendSuccess) {
            console.log('✅ Message send initiated');
            await page.waitForTimeout(8000); // Wait longer for response

            // Check message state after sending
            const messageCountAfter = await page.evaluate(() => {
                const messages = document.querySelectorAll('[style*="background-color"]');
                console.log(`Total messages found: ${messages.length}`);

                // Log message content
                messages.forEach((msg, i) => {
                    console.log(`Message ${i}: ${msg.textContent.substring(0, 50)}...`);
                });

                return messages.length;
            });

            console.log(`Messages after sending: ${messageCountAfter}`);

            // Check for processing indicator
            const processingState = await page.evaluate(() => {
                const loaders = document.querySelectorAll('*');
                let processingFound = false;

                loaders.forEach(el => {
                    if (el.textContent && el.textContent.includes('Thinking')) {
                        processingFound = true;
                    }
                });

                return processingFound;
            });

            console.log(`Processing indicator: ${processingState ? 'Found' : 'Not found'}`);
        }

        console.log(`\n📊 Total API calls made: ${apiCalls.length}`);
        apiCalls.forEach((call, i) => {
            console.log(`${i + 1}. ${call.method} ${call.url}`);
            if (call.postData) {
                console.log(`   Data: ${call.postData.substring(0, 100)}...`);
            }
        });

        await browser.close();

    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
}

debugAPIResponse().catch(console.error);