const { chromium } = require('playwright');

/**
 * 🔍 DEBUG CHAT INTERFACE INTEGRATION
 * Test why AGUI/CopilotKit can't control the calendar through the chat
 */

async function debugChatInterface() {
    console.log('🔍 DEBUGGING CHAT INTERFACE INTEGRATION');
    console.log('======================================');

    const browser = await chromium.launch({
        headless: false,
        viewport: { width: 1280, height: 720 }
    });

    const page = await browser.newPage();

    try {
        // Navigate to dashboard
        console.log('🌐 Navigating to dashboard...');
        await page.goto('http://localhost:6565/dashboard');
        await page.waitForTimeout(5000);

        // Monitor all network requests and console messages
        const networkLogs = [];
        const consoleLogs = [];

        page.on('request', request => {
            if (request.url().includes('copilotkit')) {
                networkLogs.push({
                    type: 'request',
                    url: request.url(),
                    method: request.method(),
                    postData: request.postData()
                });
            }
        });

        page.on('response', response => {
            if (response.url().includes('copilotkit')) {
                networkLogs.push({
                    type: 'response',
                    url: response.url(),
                    status: response.status()
                });
            }
        });

        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('AGUI') || text.includes('CopilotKit') || text.includes('chat') || text.includes('Renata')) {
                consoleLogs.push(`${new Date().toLocaleTimeString()}: ${text}`);
            }
        });

        // Check if chat input exists and is functional
        console.log('\\n🔍 CHECKING CHAT INTERFACE...');
        const chatInfo = await page.evaluate(() => {
            // Look for chat input elements
            const inputs = Array.from(document.querySelectorAll('input, textarea'));
            const chatInputs = inputs.filter(input =>
                input.placeholder && (
                    input.placeholder.toLowerCase().includes('renata') ||
                    input.placeholder.toLowerCase().includes('chat') ||
                    input.placeholder.toLowerCase().includes('ask') ||
                    input.placeholder.toLowerCase().includes('message')
                )
            );

            // Look for send buttons
            const buttons = Array.from(document.querySelectorAll('button'));
            const sendButtons = buttons.filter(btn =>
                btn.textContent && (
                    btn.textContent.toLowerCase().includes('send') ||
                    btn.innerHTML.includes('send') ||
                    btn.getAttribute('type') === 'submit'
                )
            );

            // Check for CopilotKit providers
            const hasCopilotProvider = !!window.CopilotKit || !!document.querySelector('[data-copilot]');

            return {
                chatInputs: chatInputs.map(input => ({
                    tagName: input.tagName,
                    placeholder: input.placeholder,
                    id: input.id,
                    className: input.className
                })),
                sendButtons: sendButtons.map(btn => ({
                    text: btn.textContent?.trim(),
                    id: btn.id,
                    className: btn.className
                })),
                hasCopilotProvider,
                totalInputs: inputs.length,
                totalButtons: buttons.length
            };
        });

        console.log('📱 CHAT INTERFACE ANALYSIS:');
        console.log(`Total inputs found: ${chatInfo.totalInputs}`);
        console.log(`Chat inputs: ${chatInfo.chatInputs.length}`);
        console.log(`Send buttons: ${chatInfo.sendButtons.length}`);
        console.log(`CopilotKit provider: ${chatInfo.hasCopilotProvider}`);

        if (chatInfo.chatInputs.length > 0) {
            console.log('\\n📝 CHAT INPUTS:');
            chatInfo.chatInputs.forEach((input, i) => {
                console.log(`  ${i + 1}. ${input.tagName}: "${input.placeholder}"`);
            });
        }

        // Try to find and use the actual chat interface
        console.log('\\n🧪 TESTING ACTUAL CHAT INTERFACE...');

        // Look for the chat input that's likely used for Renata
        const chatTest = await page.evaluate(async () => {
            try {
                // Find the most likely chat input
                const inputs = Array.from(document.querySelectorAll('input, textarea'));
                let chatInput = inputs.find(input =>
                    input.placeholder && input.placeholder.toLowerCase().includes('renata')
                ) || inputs.find(input =>
                    input.placeholder && input.placeholder.toLowerCase().includes('ask')
                ) || inputs.find(input =>
                    input.type === 'text' && input.offsetParent !== null
                );

                if (!chatInput) {
                    return { success: false, error: 'No chat input found' };
                }

                console.log('🎯 Found chat input:', chatInput.placeholder);

                // Try to type in it
                chatInput.focus();
                chatInput.value = 'show me year to date';

                // Trigger input events
                chatInput.dispatchEvent(new Event('input', { bubbles: true }));
                chatInput.dispatchEvent(new Event('change', { bubbles: true }));

                // Look for submit method
                const form = chatInput.closest('form');
                const sendButton = form ? form.querySelector('button[type="submit"]') :
                                 document.querySelector('button').textContent?.includes('send') ?
                                 document.querySelector('button') : null;

                if (sendButton) {
                    console.log('🚀 Clicking send button...');
                    sendButton.click();
                    return { success: true, method: 'button', placeholder: chatInput.placeholder };
                } else if (form) {
                    console.log('📤 Submitting form...');
                    form.submit();
                    return { success: true, method: 'form', placeholder: chatInput.placeholder };
                } else {
                    console.log('⌨️ Trying Enter key...');
                    chatInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13 }));
                    return { success: true, method: 'enter', placeholder: chatInput.placeholder };
                }

            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        console.log('💬 CHAT TEST RESULT:');
        console.log(chatTest);

        // Wait for any responses
        await page.waitForTimeout(5000);

        // Check what happened
        console.log('\\n📡 NETWORK ACTIVITY:');
        if (networkLogs.length > 0) {
            networkLogs.forEach(log => {
                console.log(`${log.type.toUpperCase()}: ${log.method || ''} ${log.url}`);
                if (log.postData) {
                    console.log(`  Data: ${log.postData.substring(0, 100)}...`);
                }
            });
        } else {
            console.log('❌ NO COPILOTKIT NETWORK ACTIVITY DETECTED');
        }

        console.log('\\n📝 CONSOLE LOGS:');
        if (consoleLogs.length > 0) {
            consoleLogs.slice(-10).forEach(log => console.log(`  ${log}`));
        } else {
            console.log('❌ NO RELEVANT CONSOLE ACTIVITY');
        }

        // Check final button states
        const finalStates = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')).filter(btn => {
                const text = btn.textContent?.trim();
                return text && (text === '7d' || text === '30d' || text === '90d' || text === 'YTD' || text === 'All');
            });

            return buttons.map(btn => ({
                text: btn.textContent?.trim(),
                isActive: btn.className.includes('bg-[#B8860B]') || btn.className.includes('traderra-date-active')
            }));
        });

        console.log('\\n📊 FINAL BUTTON STATES:');
        finalStates.forEach(btn => {
            console.log(`  "${btn.text}": ${btn.isActive ? 'ACTIVE' : 'inactive'}`);
        });

        // Determine the issue
        console.log('\\n🔍 DIAGNOSIS:');
        if (chatInfo.chatInputs.length === 0) {
            console.log('❌ ISSUE: No chat interface found');
        } else if (networkLogs.length === 0) {
            console.log('❌ ISSUE: Chat interface exists but no CopilotKit network activity');
            console.log('   This suggests the chat is not properly connected to the API');
        } else {
            console.log('✅ Chat interface is working with CopilotKit');
        }

        return {
            chatFound: chatInfo.chatInputs.length > 0,
            networkActivity: networkLogs.length > 0,
            chatWorking: chatTest.success
        };

    } catch (error) {
        console.error('❌ Debug error:', error.message);
        return null;
    } finally {
        await browser.close();
    }
}

// Run the chat interface debug
debugChatInterface()
    .then(result => {
        if (result) {
            console.log('\\n🎯 SUMMARY:');
            console.log(`Chat Interface Found: ${result.chatFound ? '✅' : '❌'}`);
            console.log(`Network Activity: ${result.networkActivity ? '✅' : '❌'}`);
            console.log(`Chat Working: ${result.chatWorking ? '✅' : '❌'}`);

            if (!result.chatFound) {
                console.log('\\n🔧 SOLUTION: Need to implement/fix chat interface');
            } else if (!result.networkActivity) {
                console.log('\\n🔧 SOLUTION: Chat interface exists but not connected to CopilotKit API');
            }
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('\\n💥 Chat debug failed:', error);
        process.exit(1);
    });