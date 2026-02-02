const { chromium } = require('playwright');

async function debugMessageContent() {
    console.log('🔧 Debugging message content...\n');

    try {
        const browser = await chromium.launch({ headless: false });
        const page = await browser.newPage();

        // Enable console logging
        page.on('console', msg => {
            console.log(`📝 Browser Console: ${msg.text()}`);
        });

        await page.goto('http://localhost:5656');
        await page.waitForTimeout(3000);

        // Open Renata chat
        const renataButton = await page.$('button:has-text("Renata")');
        if (renataButton) {
            await renataButton.click();
            await page.waitForTimeout(1000);
        }

        // Simple test scanner
        const testScanner = `
def scan_symbol(symbol, data):
    return {'symbol': symbol, 'score': 1.0}
P = {}
`;

        require('fs').writeFileSync('/tmp/debug-message.py', testScanner);

        // Upload and format
        await page.click('button[title*="Upload"]');
        await page.setInputFiles('input[type="file"]', '/tmp/debug-message.py');
        await page.waitForTimeout(1000);

        // Click Format Code
        await page.evaluate(() => {
            const buttons = document.querySelectorAll('button');
            for (const button of buttons) {
                if (button.textContent.includes('Format Code')) {
                    button.click();
                    return true;
                }
            }
            return false;
        });

        console.log('⏳ Waiting for AI response...');
        await page.waitForTimeout(8000);

        // Debug message content
        const messageDebug = await page.evaluate(() => {
            const aiMessages = document.querySelectorAll('[style*="background-color: #2a2a2a"]');
            const debugInfo = [];

            aiMessages.forEach((message, index) => {
                const content = message.textContent || '';
                const innerHTML = message.innerHTML || '';

                debugInfo.push({
                    index,
                    contentLength: content.length,
                    contentPreview: content.substring(0, 200) + '...',
                    hasViewFullCode: content.includes('View Full Code'),
                    hasViewFullCodeBold: content.includes('**📋 View Full Code:**'),
                    hasShowFullCode: content.includes('Show Full Code'),
                    hasFormattedCodeReady: content.includes('formattedCodeReady'),
                    innerHTMLLength: innerHTML.length,
                    innerHTMLPreview: innerHTML.substring(0, 200) + '...'
                });
            });

            return debugInfo;
        });

        console.log('\n📊 Message Debug Info:');
        messageDebug.forEach((msg, i) => {
            console.log(`Message ${i}:`);
            console.log(`  Content Length: ${msg.contentLength}`);
            console.log(`  Has "View Full Code": ${msg.hasViewFullCode}`);
            console.log(`  Has "**📋 View Full Code:**": ${msg.hasViewFullCodeBold}`);
            console.log(`  Has "Show Full Code": ${msg.hasShowFullCode}`);
            console.log(`  Content Preview: ${msg.contentPreview}`);
            console.log('');
        });

        await browser.close();

    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
}

debugMessageContent().catch(console.error);