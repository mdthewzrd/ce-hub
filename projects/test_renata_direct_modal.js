const { chromium } = require('playwright');
const path = require('path');

async function testRenataDirectModal() {
    console.log('🧪 Starting Direct Renata Modal Test...\n');

    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    // Enable console logging
    const consoleMessages = [];
    page.on('console', msg => {
        const msgText = msg.text();
        consoleMessages.push({
            type: msg.type(),
            text: msgText,
            timestamp: new Date().toISOString()
        });

        // Only log important messages
        if (msgText.includes('Local formatting service') ||
            msgText.includes('Renata') ||
            msgText.includes('API') ||
            msgText.includes('formatting') ||
            msgText.includes('enhancedRenataCodeService') ||
            msg.type() === 'error' ||
            msg.type() === 'warning') {
            console.log(`[${msg.type().toUpperCase()}] ${msgText}`);
        }
    });

    // Enable network logging
    const networkRequests = [];
    page.on('request', request => {
        networkRequests.push({
            url: request.url(),
            method: request.method(),
            headers: request.headers(),
            timestamp: new Date().toISOString()
        });

        if (request.url().includes('renata') ||
            request.url().includes('chat') ||
            request.url().includes('format') ||
            request.url().includes('api')) {
            console.log(`🌐 [${request.method()}] ${request.url()}`);
        }
    });

    page.on('response', response => {
        if (response.url().includes('renata') ||
            response.url().includes('chat') ||
            response.url().includes('format') ||
            response.url().includes('api')) {
            console.log(`📡 [${response.status()}] ${response.url()}`);
        }
    });

    try {
        // Step 1: Navigate to Edge Dev platform
        console.log('\n📍 Step 1: Navigating to http://localhost:5657...');
        await page.goto('http://localhost:5657', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // Wait for page to load
        await page.waitForTimeout(5000);

        // Step 2: Manually trigger the upload modal by calling openUploadModal
        console.log('\n🚀 Step 2: Manually triggering upload modal...');

        // Try to directly trigger the modal via JavaScript evaluation
        await page.evaluate(() => {
            // Look for any function that might open the upload modal
            if (typeof window.openUploadModal === 'function') {
                window.openUploadModal();
                console.log('✅ Called window.openUploadModal()');
            } else {
                // Try to access React state and set showUploadModal to true
                const reactRoot = document.querySelector('#__next');
                if (reactRoot) {
                    // Find the React instance
                    const reactInstance = reactRoot._reactRootContainer?._internalRoot?.current;
                    if (reactInstance && reactInstance.child && reactInstance.child.child) {
                        // Look for components that might have setShowUploadModal
                        const updateModal = (component) => {
                            if (component && component.stateNode) {
                                const stateNode = component.stateNode;
                                if (stateNode.setShowUploadModal) {
                                    stateNode.setShowUploadModal(true);
                                    console.log('✅ Found and called setShowUploadModal(true)');
                                    return true;
                                }
                            }
                            return false;
                        };

                        // Try to find the component with setShowUploadModal
                        const findAndTrigger = (node) => {
                            if (updateModal(node)) return true;
                            if (node.child) return findAndTrigger(node.child);
                            if (node.sibling) return findAndTrigger(node.sibling);
                            return false;
                        };

                        findAndTrigger(reactInstance.child);
                    }
                }
            }
        });

        // Wait for modal to potentially appear
        await page.waitForTimeout(3000);

        // Check if modal appeared
        const modalVisible = await page.locator('.modal-backdrop, .modal-content').isVisible().catch(() => false);
        console.log(`📋 Modal visible: ${modalVisible}`);

        if (!modalVisible) {
            console.log('⚠️ Modal not triggered automatically, trying alternative approach...');

            // Try to add a button that triggers the modal
            await page.evaluate(() => {
                // Create a temporary button to test modal
                const testButton = document.createElement('button');
                testButton.textContent = 'Test Upload Modal';
                testButton.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                    background: #D4AF37;
                    color: black;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                `;
                testButton.onclick = () => {
                    // Dispatch a custom event that might trigger the modal
                    window.dispatchEvent(new CustomEvent('openUploadModal'));
                };
                document.body.appendChild(testButton);
                console.log('✅ Added test button to page');
            });
        }

        // Take screenshot
        await page.screenshot({ path: 'test_modal_attempt.png', fullPage: true });
        console.log('📸 Screenshot saved: test_modal_attempt.png');

        // Step 3: If modal is visible, proceed with file upload
        if (modalVisible || await page.locator('.modal-backdrop').isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log('\n📁 Step 3: Modal is visible, proceeding with file upload...');

            // Click on "Upload Finalized Code" or "Upload and Format Code" button
            try {
                const finalizedButton = await page.locator('button:has-text("Upload Finalized Code")').first();
                if (await finalizedButton.isVisible({ timeout: 2000 })) {
                    await finalizedButton.click();
                    console.log('✅ Clicked "Upload Finalized Code" button');
                } else {
                    const formatButton = await page.locator('button:has-text("Upload and Format Code")').first();
                    if (await formatButton.isVisible({ timeout: 2000 })) {
                        await formatButton.click();
                        console.log('✅ Clicked "Upload and Format Code" button');
                    }
                }
            } catch (e) {
                console.log('⚠️ Could not find upload mode buttons, trying to click upload area directly...');
            }

            await page.waitForTimeout(2000);

            // Step 4: Upload the test file
            console.log('\n📁 Step 4: Uploading test file...');
            const testFilePath = '/Users/michaeldurante/Downloads/backside para b copy.py';

            // Look for file input
            const fileInput = await page.locator('#fileInput, input[type="file"]').first();
            if (await fileInput.count() > 0) {
                await fileInput.setInputFiles(testFilePath);
                console.log(`✅ File uploaded: ${path.basename(testFilePath)}`);
                await page.waitForTimeout(3000);
            } else {
                console.log('⚠️ No file input found');
            }

            // Step 5: Look for and click Format & Run button
            console.log('\n🚀 Step 5: Looking for Format & Run button...');

            const formatRunButton = await page.locator('button:has-text("Format & Run"), button:has-text("Upload & Run")').first();
            if (await formatRunButton.isVisible({ timeout: 3000 })) {
                console.log('✅ Found Format & Run button');

                // Clear console history before clicking
                consoleMessages.length = 0;
                networkRequests.length = 0;

                await formatRunButton.click();
                console.log('✅ Clicked Format & Run button');

                // Wait for processing
                console.log('⏳ Waiting for processing (45 seconds max)...');
                await page.waitForTimeout(45000);

                // Take final screenshot
                await page.screenshot({ path: 'test_after_processing.png', fullPage: true });
                console.log('📸 Final screenshot saved: test_after_processing.png');

            } else {
                console.log('⚠️ Format & Run button not found');
            }

        } else {
            console.log('❌ Modal could not be triggered');
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        await page.screenshot({ path: 'test_direct_error.png', fullPage: true });
        console.log('📸 Error screenshot saved: test_direct_error.png');
    } finally {
        // Step 6: Analyze results
        console.log('\n📊 Step 6: Analyzing Results...\n');

        // Check for "Local formatting service processing request" messages
        const localFormattingMessages = consoleMessages.filter(msg =>
            msg.text.toLowerCase().includes('local formatting service') ||
            msg.text.toLowerCase().includes('processing request')
        );

        console.log('🔍 Console Analysis:');
        console.log(`   Total console messages: ${consoleMessages.length}`);
        console.log(`   Local formatting messages: ${localFormattingMessages.length}`);

        if (localFormattingMessages.length > 0) {
            console.log('\n❌ ISSUE DETECTED - Local formatting service messages found:');
            localFormattingMessages.forEach(msg => {
                console.log(`   [${msg.type.toUpperCase()}] ${msg.text}`);
            });
        } else {
            console.log('✅ No local formatting service messages detected');
        }

        // Check for Renata API calls
        const renataApiCalls = networkRequests.filter(req =>
            req.url.toLowerCase().includes('renata') ||
            req.url.toLowerCase().includes('chat') ||
            req.url.toLowerCase().includes('format')
        );

        console.log('\n🌐 Network Analysis:');
        console.log(`   Total network requests: ${networkRequests.length}`);
        console.log(`   Renata/API calls: ${renataApiCalls.length}`);

        if (renataApiCalls.length > 0) {
            console.log('\n✅ Renata API calls detected:');
            renataApiCalls.forEach(req => {
                console.log(`   [${req.method}] ${req.url}`);
            });
        } else {
            console.log('\n❌ No Renata API calls detected');
        }

        // Look for enhancedRenataCodeService usage
        const enhancedServiceMessages = consoleMessages.filter(msg =>
            msg.text.includes('enhancedRenataCodeService')
        );

        if (enhancedServiceMessages.length > 0) {
            console.log('\n🤖 Enhanced Renata Code Service messages found:');
            enhancedServiceMessages.forEach(msg => {
                console.log(`   [${msg.type.toUpperCase()}] ${msg.text}`);
            });
        }

        // Final assessment
        console.log('\n🎯 FINAL ASSESSMENT:');
        if (localFormattingMessages.length === 0 && renataApiCalls.length > 0) {
            console.log('✅ SUCCESS: Fix appears to be working correctly!');
            console.log('   - No local formatting service messages detected');
            console.log('   - Renata API calls are being made');
        } else if (localFormattingMessages.length > 0) {
            console.log('❌ ISSUE: Local formatting service is still being used');
            console.log('   - Fix may not have been applied correctly');
        } else if (enhancedServiceMessages.length > 0) {
            console.log('🔄 PARTIAL: Enhanced service is being used but no API calls detected');
            console.log('   - The fix is partially working');
        } else {
            console.log('⚠️  UNCLEAR: No definitive activity detected');
            console.log('   - May need to test with different approach or check implementation');
        }

        console.log('\n📝 Test complete. Browser will remain open for manual inspection.');
        console.log('💡 Screenshots saved for reference: test_modal_attempt.png, test_after_processing.png');
    }
}

// Run the test
testRenataDirectModal().catch(console.error);