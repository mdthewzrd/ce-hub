const { chromium } = require('playwright');

async function quickDashboardTest() {
    console.log('🔥 QUICK DASHBOARD CALENDAR TEST');
    console.log('================================');

    const browser = await chromium.launch({
        headless: false,
        viewport: { width: 1280, height: 720 }
    });

    const page = await browser.newPage();

    try {
        // Go directly to dashboard
        console.log('🌐 Navigating to dashboard...');
        await page.goto('http://localhost:6565/dashboard');
        await page.waitForTimeout(3000);

        // Check initial state
        const initial = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')).filter(btn => {
                const text = btn.textContent?.trim();
                return text && ['7d', '30d', '90d', 'YTD', 'All'].includes(text);
            });
            return buttons.map(btn => ({
                text: btn.textContent?.trim(),
                isActive: btn.className.includes('bg-[#B8860B]') || btn.className.includes('traderra-date-active')
            }));
        });

        console.log('📊 INITIAL STATE:');
        initial.forEach(btn => console.log(`  "${btn.text}": ${btn.isActive ? '🟡 ACTIVE' : '⚪ inactive'}`));

        // Test API call
        console.log('\n🧪 Testing "show me 7 days"...');
        const result = await page.evaluate(async () => {
            const response = await fetch('/api/copilotkit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operationName: "generateCopilotResponse",
                    query: `mutation generateCopilotResponse($data: CopilotResponseInput!) {
                        generateCopilotResponse(data: $data) {
                            extensions { clientScript }
                            messages { content }
                        }
                    }`,
                    variables: {
                        data: {
                            messages: [{ content: "show me 7 days", role: "user" }]
                        }
                    }
                })
            });

            const data = await response.json();
            const clientScript = data?.data?.generateCopilotResponse?.extensions?.clientScript;

            if (clientScript) {
                eval(clientScript);
            }

            return {
                success: true,
                hasScript: !!clientScript,
                message: data?.data?.generateCopilotResponse?.messages?.[0]?.content
            };
        });

        await page.waitForTimeout(2000);

        // Check final state
        const final = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')).filter(btn => {
                const text = btn.textContent?.trim();
                return text && ['7d', '30d', '90d', 'YTD', 'All'].includes(text);
            });
            return buttons.map(btn => ({
                text: btn.textContent?.trim(),
                isActive: btn.className.includes('bg-[#B8860B]') || btn.className.includes('traderra-date-active')
            }));
        });

        console.log('\n📊 FINAL STATE:');
        final.forEach(btn => console.log(`  "${btn.text}": ${btn.isActive ? '🟡 ACTIVE' : '⚪ inactive'}`));

        const initialActive = initial.find(btn => btn.isActive)?.text;
        const finalActive = final.find(btn => btn.isActive)?.text;

        console.log('\n🎯 RESULT:');
        console.log(`API Success: ${result.success ? '✅' : '❌'}`);
        console.log(`Script Present: ${result.hasScript ? '✅' : '❌'}`);
        console.log(`State Change: ${initialActive !== finalActive ? '✅' : '❌'}`);
        console.log(`Expected "7d": ${finalActive === '7d' ? '✅' : '❌'}`);

        return finalActive === '7d';

    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    } finally {
        await browser.close();
    }
}

quickDashboardTest()
    .then(success => {
        console.log(success ? '\n🎉 DASHBOARD CALENDAR WORKING!' : '\n❌ Dashboard calendar broken');
        process.exit(success ? 0 : 1);
    });