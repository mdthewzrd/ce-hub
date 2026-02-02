// Comprehensive End-to-End Validation Test for Edge.dev Platform
// Tests complete user workflow: Format → Add to Project → Run → Get Results

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
    baseUrl: 'http://localhost:5657',
    screenshotsDir: '/Users/michaeldurante/ai dev/ce-hub/screenshots',
    backsideScannerPath: '/Users/michaeldurante/Downloads/backside para b copy.py',
    testTimeout: 300000, // 5 minutes
    slowMo: 100 // Slow down interactions for visibility
};

// Ensure screenshots directory exists
if (!fs.existsSync(config.screenshotsDir)) {
    fs.mkdirSync(config.screenshotsDir, { recursive: true });
}

// Read the backside scanner code
const backsideScannerCode = fs.readFileSync(config.backsideScannerPath, 'utf8');
console.log(`Loaded backside scanner code: ${backsideScannerCode.length} characters`);

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name, description) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `${timestamp}_${name}.png`;
    const filepath = path.join(config.screenshotsDir, filename);

    await page.screenshot({
        path: filepath,
        fullPage: true
    });

    console.log(`📸 Screenshot saved: ${filename} - ${description}`);
    return filepath;
}

async function waitForElement(page, selector, timeout = 10000) {
    try {
        await page.waitForSelector(selector, { timeout });
        return true;
    } catch (error) {
        console.log(`⚠️ Element not found: ${selector}`);
        return false;
    }
}

async function clickElement(page, selector, description) {
    try {
        await page.waitForSelector(selector, { timeout: 10000 });
        await page.click(selector);
        console.log(`✅ Clicked: ${description}`);
        await sleep(1000);
        return true;
    } catch (error) {
        console.log(`❌ Failed to click: ${description} - ${error.message}`);
        return false;
    }
}

async function typeText(page, selector, text, description) {
    try {
        await page.waitForSelector(selector, { timeout: 10000 });
        await page.focus(selector);
        await page.keyboard.down('Control');
        await page.keyboard.press('a');
        await page.keyboard.up('Control');
        await sleep(500);

        // Type the text in smaller chunks to avoid overwhelming the input
        const chunkSize = 1000;
        for (let i = 0; i < text.length; i += chunkSize) {
            const chunk = text.slice(i, i + chunkSize);
            await page.type(selector, chunk);
            await sleep(50);
        }

        console.log(`✅ Typed: ${description} (${text.length} chars)`);
        return true;
    } catch (error) {
        console.log(`❌ Failed to type: ${description} - ${error.message}`);
        return false;
    }
}

async function main() {
    console.log('🚀 Starting Comprehensive Edge.dev Platform Validation Test');
    console.log(`📁 Screenshots will be saved to: ${config.screenshotsDir}`);

    const browser = await puppeteer.launch({
        headless: false, // Show the browser for debugging
        defaultViewport: { width: 1920, height: 1080 },
        slowMo: config.slowMo,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        page.setDefaultTimeout(30000);

        // 1. Navigate to the application
        console.log('\n📍 Step 1: Navigating to Edge.dev platform...');
        await page.goto(config.baseUrl, { waitUntil: 'networkidle2' });
        await sleep(3000);
        await takeScreenshot(page, '01_initial_load', 'Initial page load');

        // 2. Open Renata chat
        console.log('\n💬 Step 2: Opening Renata chat...');
        const renataSelector = 'button[aria-label="Open Renata chat"], .renata-chat-button, [data-testid="renata-chat-button"], .chat-button, button:has-text("Chat"), button:has-text("Renata")';

        // Try multiple possible selectors for the chat button
        const chatSelectors = [
            'button[aria-label="Open Renata chat"]',
            '.renata-chat-button',
            '[data-testid="renata-chat-button"]',
            '.chat-button',
            'button:has-text("Chat")',
            'button:has-text("Renata")',
            '.chat-bubble',
            '[data-cy="chat-button"]'
        ];

        let chatOpened = false;
        for (const selector of chatSelectors) {
            console.log(`Trying chat selector: ${selector}`);
            if (await clickElement(page, selector, 'Renata chat button')) {
                chatOpened = true;
                break;
            }
        }

        if (!chatOpened) {
            console.log('🔍 Looking for any clickable elements that might open chat...');
            const allButtons = await page.$$eval('button', buttons =>
                buttons.map(btn => btn.textContent?.trim() || btn.getAttribute('aria-label') || btn.className)
                    .filter(text => text && (text.toLowerCase().includes('chat') || text.toLowerCase().includes('renata') || text.toLowerCase().includes('ai')))
            );
            console.log('Available chat-related buttons:', allButtons);
        }

        await sleep(3000);
        await takeScreenshot(page, '02_chat_opened', 'Renata chat opened');

        // 3. Find and focus on the chat input
        console.log('\n📝 Step 3: Locating chat input...');
        const inputSelectors = [
            'textarea[placeholder*="Message"]',
            'textarea[placeholder*="Type"]',
            '.chat-input textarea',
            '[data-testid="chat-input"]',
            '.message-input',
            'textarea',
            'input[type="text"]'
        ];

        let inputFound = false;
        for (const selector of inputSelectors) {
            const element = await page.$(selector);
            if (element) {
                console.log(`✅ Found input with selector: ${selector}`);
                inputFound = true;
                break;
            }
        }

        if (!inputFound) {
            console.log('🔍 Looking for any textarea or input elements...');
            const inputs = await page.$$eval('textarea, input[type="text"]', inputs =>
                inputs.map(input => input.placeholder || input.className || input.id)
            );
            console.log('Available inputs:', inputs);
        }

        // 4. Paste the backside scanner code
        console.log('\n📋 Step 4: Pasting backside scanner code...');

        // Try to find the chat input and paste the code
        let codePasted = false;
        for (const selector of inputSelectors) {
            const element = await page.$(selector);
            if (element) {
                const isVisible = await element.evaluate(el => {
                    const style = window.getComputedStyle(el);
                    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
                });

                if (isVisible) {
                    console.log(`✅ Using visible input: ${selector}`);
                    codePasted = await typeText(page, selector, backsideScannerCode, 'Backside scanner code');
                    if (codePasted) break;
                }
            }
        }

        if (!codePasted) {
            console.log('❌ Could not paste code - trying alternative approach...');
            // Try to focus the first visible textarea
            await page.evaluate(() => {
                const textarea = document.querySelector('textarea');
                if (textarea) {
                    textarea.focus();
                    textarea.select();
                }
            });
            await sleep(1000);
            await page.keyboard.type(backsideScannerCode.slice(0, 1000)); // Type first 1000 chars as test
        }

        await sleep(2000);
        await takeScreenshot(page, '03_code_pasted', 'Backside scanner code pasted');

        // 5. Send the message for formatting
        console.log('\n📤 Step 5: Sending message for formatting...');
        const sendSelectors = [
            'button[aria-label*="Send"]',
            '.send-button',
            '[data-testid="send-button"]',
            'button:has-text("Send")',
            'button:has-text("Submit")',
            '.submit-button'
        ];

        let messageSent = false;
        for (const selector of sendSelectors) {
            if (await clickElement(page, selector, 'Send button')) {
                messageSent = true;
                break;
            }
        }

        if (!messageSent) {
            // Try Enter key
            await page.keyboard.press('Enter');
            console.log('✅ Sent message using Enter key');
        }

        await sleep(5000); // Wait for AI response
        await takeScreenshot(page, '04_message_sent', 'Message sent, waiting for formatting');

        // 6. Wait for formatting and check for "Add to Project" button
        console.log('\n⏳ Step 6: Waiting for code formatting and "Add to Project" button...');
        await sleep(10000); // Wait longer for AI processing

        const addToProjectSelectors = [
            'button:has-text("Add to Project")',
            '[data-testid="add-to-project"]',
            '.add-to-project-button',
            'button[aria-label*="Add to project"]'
        ];

        let addToProjectFound = false;
        for (const selector of addToProjectSelectors) {
            const element = await page.$(selector);
            if (element) {
                const isVisible = await element.evaluate(el => {
                    const style = window.getComputedStyle(el);
                    return style.display !== 'none' && style.visibility !== 'hidden';
                });
                if (isVisible) {
                    console.log(`✅ Found "Add to Project" button: ${selector}`);
                    addToProjectFound = true;
                    break;
                }
            }
        }

        await takeScreenshot(page, '05_after_formatting', addToProjectFound ? 'Code formatted, Add to Project button found' : 'After formatting - no Add to Project button visible');

        // 7. Click "Add to Project" if found
        if (addToProjectFound) {
            console.log('\n➕ Step 7: Clicking "Add to Project" button...');
            let projectAdded = false;
            for (const selector of addToProjectSelectors) {
                if (await clickElement(page, selector, 'Add to Project button')) {
                    projectAdded = true;
                    break;
                }
            }

            if (projectAdded) {
                await sleep(3000);
                await takeScreenshot(page, '06_project_add_clicked', 'Add to Project clicked');

                // Look for project creation modal or confirmation
                await sleep(2000);
                await takeScreenshot(page, '07_project_creation', 'Project creation process');
            }
        } else {
            console.log('❌ "Add to Project" button not found - checking page content...');
            const pageContent = await page.evaluate(() => {
                return document.body.innerText.slice(0, 1000);
            });
            console.log('Page content preview:', pageContent);
        }

        // 8. Navigate to Projects section
        console.log('\n📁 Step 8: Navigating to Projects section...');
        const projectSelectors = [
            'a:has-text("Projects")',
            'button:has-text("Projects")',
            '[data-testid="projects-nav"]',
            '.projects-nav',
            '.nav-item:has-text("Projects")'
        ];

        let projectsNavigated = false;
        for (const selector of projectSelectors) {
            if (await clickElement(page, selector, 'Projects navigation')) {
                projectsNavigated = true;
                break;
            }
        }

        if (!projectsNavigated) {
            // Try direct URL navigation
            await page.goto(`${config.baseUrl}/projects`, { waitUntil: 'networkidle2' });
            console.log('✅ Navigated directly to /projects');
        }

        await sleep(3000);
        await takeScreenshot(page, '08_projects_section', 'Projects section loaded');

        // 9. Look for the newly created project
        console.log('\n🔍 Step 9: Looking for newly created project...');
        await sleep(2000);

        const projectCardSelectors = [
            '.project-card',
            '[data-testid="project-card"]',
            '.scanner-project',
            '.project-item'
        ];

        let projectFound = false;
        for (const selector of projectCardSelectors) {
            const projects = await page.$$(selector);
            if (projects.length > 0) {
                console.log(`✅ Found ${projects.length} project(s) with selector: ${selector}`);
                projectFound = true;

                // Try to click the first project
                if (await clickElement(page, selector, 'First project card')) {
                    await sleep(3000);
                    await takeScreenshot(page, '09_project_opened', 'Project details opened');
                }
                break;
            }
        }

        if (!projectFound) {
            console.log('❌ No projects found - checking page content...');
            const projectsContent = await page.evaluate(() => {
                const projects = document.querySelectorAll('[class*="project"], [data-testid*="project"]');
                return Array.from(projects).map(p => p.textContent?.trim().slice(0, 100));
            });
            console.log('Project elements found:', projectsContent);
        }

        // 10. Look for execution controls
        console.log('\n⚡ Step 10: Looking for scanner execution controls...');
        const executionSelectors = [
            'button:has-text("Run")',
            'button:has-text("Execute")',
            'button:has-text("Start Scan")',
            '[data-testid="run-scanner"]',
            '.run-button',
            '.execute-button'
        ];

        let executionFound = false;
        for (const selector of executionSelectors) {
            const element = await page.$(selector);
            if (element) {
                const isVisible = await element.evaluate(el => {
                    const style = window.getComputedStyle(el);
                    return style.display !== 'none' && style.visibility !== 'hidden';
                });
                if (isVisible) {
                    console.log(`✅ Found execution button: ${selector}`);
                    executionFound = true;
                    break;
                }
            }
        }

        if (executionFound) {
            // Look for date range inputs
            console.log('📅 Looking for date range inputs...');
            const dateInputs = await page.$$('input[type="date"]');
            if (dateInputs.length >= 2) {
                console.log('✅ Found date range inputs');

                // Set start date to Jan 1, 2025
                await dateInputs[0].evaluate(el => el.value = '2025-01-01');
                console.log('✅ Set start date to 2025-01-01');

                // Set end date to Nov 1, 2025
                await dateInputs[1].evaluate(el => el.value = '2025-11-01');
                console.log('✅ Set end date to 2025-11-01');

                await sleep(1000);
                await takeScreenshot(page, '10_date_range_set', 'Date range set to Jan 1 - Nov 1, 2025');
            }

            // Click execute button
            let executed = false;
            for (const selector of executionSelectors) {
                if (await clickElement(page, selector, 'Execute/Run button')) {
                    executed = true;
                    break;
                }
            }

            if (executed) {
                console.log('⏳ Waiting for execution to complete...');
                await sleep(15000); // Wait for execution

                await takeScreenshot(page, '11_execution_started', 'Scanner execution started');

                // Look for results
                console.log('📊 Looking for execution results...');
                await sleep(10000);

                const resultSelectors = [
                    '.results-container',
                    '[data-testid="results"]',
                    '.scan-results',
                    '.execution-results'
                ];

                let resultsFound = false;
                for (const selector of resultSelectors) {
                    const element = await page.$(selector);
                    if (element) {
                        const isVisible = await element.evaluate(el => {
                            const style = window.getComputedStyle(el);
                            return style.display !== 'none' && style.visibility !== 'hidden';
                        });
                        if (isVisible) {
                            console.log(`✅ Found results container: ${selector}`);
                            resultsFound = true;
                            break;
                        }
                    }
                }

                await takeScreenshot(page, '12_final_results', resultsFound ? 'Execution results displayed' : 'Execution completed - no results container found');

                if (resultsFound) {
                    // Extract results text
                    const resultsText = await page.evaluate(() => {
                        const resultsElement = document.querySelector('.results-container, [data-testid="results"], .scan-results, .execution-results');
                        return resultsElement ? resultsElement.innerText : 'No results text found';
                    });

                    console.log('📈 Results preview:');
                    console.log(resultsText.slice(0, 500));

                    // Check for expected number of signals
                    const signalCount = (resultsText.match(/signal/gi) || []).length;
                    console.log(`🎯 Found ${signalCount} signals mentioned in results`);
                }
            }
        }

        // 11. Final state screenshot
        await sleep(2000);
        await takeScreenshot(page, '13_final_state', 'Final state of the application');

        console.log('\n✅ Comprehensive validation test completed!');
        console.log(`📸 All screenshots saved to: ${config.screenshotsDir}`);

    } catch (error) {
        console.error('❌ Test failed with error:', error);

        // Try to take a final error screenshot
        try {
            const pages = await browser.pages();
            if (pages.length > 0) {
                await takeScreenshot(pages[0], 'error_state', 'Error occurred during test');
            }
        } catch (screenshotError) {
            console.log('Could not capture error screenshot:', screenshotError.message);
        }

    } finally {
        await browser.close();
        console.log('🔚 Browser closed');
    }
}

// Run the test
main().catch(console.error);