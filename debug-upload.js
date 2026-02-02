const { chromium } = require('playwright');

async function debugFileUpload() {
    console.log('🔧 Debugging file upload functionality...\n');

    try {
        const browser = await chromium.launch({ headless: false });
        const page = await browser.newPage();

        // Set up console logging
        page.on('console', (msg) => {
            if (msg.type() === 'error' || msg.type() === 'warn') {
                console.log(`🚨 Console ${msg.type()}: ${msg.text()}`);
            }
        });

        await page.goto('http://localhost:5656');
        await page.waitForTimeout(2000);

        // Click Renata button to open chat
        const renataButton = await page.$('button:has-text("Renata")');
        if (renataButton) {
            await renataButton.click();
            await page.waitForTimeout(1000);
        }

        // Get the file input element
        const fileInput = await page.$('input[type="file"][ref*="fileInputRef"]');

        if (fileInput) {
            console.log('✅ Found file input with ref');

            // Add event listeners to debug
            await page.evaluate(() => {
                const input = document.querySelector('input[type="file"][ref*="fileInputRef"]');
                if (input) {
                    console.log('File input found in DOM:', input);

                    input.addEventListener('change', (e) => {
                        console.log('File change event triggered:', e);
                        console.log('Files selected:', e.target.files);

                        if (e.target.files.length > 0) {
                            const file = e.target.files[0];
                            console.log('File details:', {
                                name: file.name,
                                size: file.size,
                                type: file.type
                            });
                        }
                    });
                }
            });

            // Create a test file
            const testFileContent = `
def test_function():
    print("Hello from test file")
    return "success"

# Test Python scanner
if __name__ == "__main__":
    result = test_function()
    print(f"Result: {result}")
            `;

            // Create a temporary file
            const tempPath = '/tmp/test-upload.py';
            require('fs').writeFileSync(tempPath, testFileContent);
            console.log('Created test file:', tempPath);

            // Upload the file
            await fileInput.setInputFiles(tempPath);
            console.log('✅ File uploaded via setInputFiles');

            // Check if file content is being processed
            await page.waitForTimeout(2000);

            // Check if file variables are set
            const fileState = await page.evaluate(() => {
                // Look for React component state
                const appElement = document.querySelector('[style*="bottom: 100px"]');
                if (appElement) {
                    return {
                        found: true,
                        hasFileContent: appElement.textContent.includes('test-upload.py') ||
                                     appElement.textContent.includes('File:') ||
                                     appElement.textContent.includes('📎')
                    };
                }
                return { found: false };
            });

            console.log('File state check:', fileState);

            // Clean up
            require('fs').unlinkSync(tempPath);

        } else {
            console.log('❌ File input not found');
        }

        await browser.close();

    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
}

debugFileUpload().catch(console.error);