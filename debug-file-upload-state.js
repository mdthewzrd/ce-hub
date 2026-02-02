const { chromium } = require('playwright');

async function debugFileUploadState() {
    console.log('🔍 Debugging file upload state management...\n');

    try {
        const browser = await chromium.launch({ headless: false });
        const page = await browser.newPage();

        // Set up comprehensive logging
        page.on('console', (msg) => {
            if (msg.type() === 'error' || msg.type() === 'warn' || msg.text().includes('File') || msg.text().includes('🔧')) {
                console.log(`📝 Browser: ${msg.text()}`);
            }
        });

        page.on('response', (response) => {
            if (response.url().includes('api/')) {
                console.log(`🌐 API Response: ${response.status()} ${response.url()}`);
            }
        });

        await page.goto('http://localhost:5656');
        await page.waitForTimeout(2000);

        // Open Renata chat
        const renataButton = await page.$('button:has-text("Renata")');
        if (renataButton) {
            await renataButton.click();
            await page.waitForTimeout(1000);
        }

        // Find and click upload button
        const uploadButton = await page.$('button[title*="Upload"]');
        if (uploadButton) {
            await uploadButton.click();
            console.log('✅ Upload button clicked');
        }

        // Find file input
        const fileInput = await page.$('input[type="file"]');
        if (fileInput) {
            console.log('✅ File input found, uploading test file...');

            // Upload the test file
            await fileInput.setInputFiles('/tmp/test-upload.py');
            console.log('✅ File uploaded to input');

            // Wait for React state to update
            await page.waitForTimeout(1000);

            // Check if file content is being processed
            const fileState = await page.evaluate(() => {
                // Look for any file-related elements
                const fileElements = [];
                const allElements = document.querySelectorAll('*');

                for (const el of allElements) {
                    const text = el.textContent || '';
                    const style = window.getComputedStyle(el);
                    const display = style.display;
                    const opacity = style.opacity;

                    if (text.includes('test-upload.py') ||
                        text.includes('📎') ||
                        text.includes('File:') ||
                        (text.includes('KB') && display !== 'none')) {
                        fileElements.push({
                            tag: el.tagName,
                            text: text.substring(0, 50),
                            display: display,
                            opacity: opacity,
                            visible: style.visibility !== 'hidden' && display !== 'none'
                        });
                    }
                }

                // Check React component state (if accessible)
                const reactState = {
                    fileUploadFound: !!document.querySelector('input[type="file"]'),
                    filePreviewVisible: !!document.querySelector('[style*="uploadedFile"]'),
                    anyFileText: !!document.querySelector('*:contains("test-upload.py")'),
                    totalElements: document.querySelectorAll('*').length
                };

                return { fileElements, reactState };
            });

            console.log('📊 File state analysis:', JSON.stringify(fileState, null, 2));

            // Take screenshot for visual debugging
            await page.screenshot({ path: 'file-upload-debug.png', fullPage: true });
            console.log('📸 Screenshot saved as file-upload-debug.png');

            // Try to manually trigger state update
            console.log('🔧 Attempting to trigger React state update...');
            await page.evaluate(() => {
                const input = document.querySelector('input[type="file"]');
                if (input) {
                    // Create a new change event
                    const event = new Event('change', { bubbles: true });
                    input.dispatchEvent(event);
                    console.log('🔄 Change event dispatched');
                }
            });

            await page.waitForTimeout(2000);

            // Check state again
            const finalState = await page.evaluate(() => {
                const fileElements = [];
                const allElements = document.querySelectorAll('*');

                for (const el of allElements) {
                    const text = el.textContent || '';
                    if (text.includes('test-upload.py') ||
                        text.includes('📎') ||
                        text.includes('File:') ||
                        (text.includes('KB') && el.textContent.includes('60.0'))) {
                        fileElements.push({
                            tag: el.tagName,
                            text: text.substring(0, 100),
                            visible: window.getComputedStyle(el).display !== 'none'
                        });
                    }
                }
                return fileElements;
            });

            console.log('📊 Final file state:', JSON.stringify(finalState, null, 2));

        } else {
            console.log('❌ No file input found');
        }

        await browser.close();

    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
}

debugFileUploadState().catch(console.error);