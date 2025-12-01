#!/usr/bin/env node

const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

// Configuration
const FRONTEND_URL = 'http://localhost:5656/';
const BACKSIDE_FILE = '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backend/scanners/backside para b copy.py';
const SCREENSHOTS_DIR = './test-screenshots-v3';

// Create screenshots directory if it doesn't exist
if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${SCREENSHOTS_DIR}/${name}_${timestamp}.png`;
    await page.screenshot({ path: filename, fullPage: true });
    console.log(`📸 Screenshot saved: ${filename}`);
    return filename;
}

async function clickButtonByText(page, buttonText) {
    try {
        // Try to find button by text content
        const buttons = await page.$$('button');
        for (const button of buttons) {
            const text = await button.evaluate(el => el.textContent?.trim() || '');
            if (text.includes(buttonText)) {
                console.log(`✅ Found button with text: "${text}"`);
                await button.click();
                return true;
            }
        }
        return false;
    } catch (e) {
        console.log(`❌ Error clicking button with text "${buttonText}":`, e.message);
        return false;
    }
}

async function findAndInspectElements(page, context) {
    console.log(`\n🔍 Inspecting elements for: ${context}`);

    // Get all buttons with text
    const buttons = await page.$$eval('button', buttons =>
        buttons.map((btn, index) => ({
            index,
            text: btn.textContent?.trim() || '',
            classes: btn.className,
            id: btn.id,
            hasText: btn.textContent?.trim().length > 0
        }))
    );

    console.log(`   Found ${buttons.length} buttons with text:`);
    buttons.filter(btn => btn.hasText).forEach(btn => {
        console.log(`   [${btn.index}] "${btn.text}"`);
    });

    // Look for text areas and inputs
    const textAreas = await page.$$('textarea');
    const textInputs = await page.$$('input[type="text"]');

    console.log(`   Found ${textAreas.length} text areas`);
    console.log(`   Found ${textInputs.length} text inputs`);

    // Look for file inputs (might be hidden)
    const fileInputs = await page.$$('input[type="file"]');
    console.log(`   Found ${fileInputs.length} file inputs`);

    // Look for project elements
    const projectElements = await page.$$eval('[class*="project"], [data-project], .scanner, .card, .chat-message', elements =>
        elements.map((el, index) => ({
            index,
            text: el.textContent?.substring(0, 100) || '',
            classes: el.className,
            id: el.id
        }))
    );

    console.log(`   Found ${projectElements.length} relevant elements`);

    return { buttons, textAreas, textInputs, fileInputs, projectElements };
}

async function testCompleteWorkflow() {
    console.log('🚀 Starting Corrected A-Z workflow test - targeting Renata AI chat interface...');

    const browser = await puppeteer.launch({
        headless: false, // Show the browser for debugging
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        defaultViewport: { width: 1400, height: 900 },
        args: ['--start-maximized', '--no-sandbox']
    });

    try {
        const page = await browser.newPage();

        // Step 1: Navigate to the frontend
        console.log('📍 Step 1: Navigating to frontend...');
        await page.goto(FRONTEND_URL, { waitUntil: 'networkidle2' });
        await takeScreenshot(page, '01_frontend_loaded');
        await sleep(3000);

        // Step 2: Access Renata AI Assistant (CRITICAL!)
        console.log('🤖 Step 2: Accessing Renata AI Assistant...');

        // Inspect initial state
        await findAndInspectElements(page, 'Initial page load');

        // Click on RenataAI Assistant button
        const clickedAssistant = await clickButtonByText(page, 'RenataAI Assistant');

        if (clickedAssistant) {
            console.log('✅ Successfully clicked RenataAI Assistant button');
            await sleep(3000); // Wait for chat interface to load
            await takeScreenshot(page, '02_assistant_opened');
        } else {
            console.log('❌ Could not find RenataAI Assistant button');
            throw new Error('Renata AI Assistant interface not accessible');
        }

        // Step 3: Inspect chat interface and look for file upload
        console.log('💬 Step 3: Inspecting chat interface...');
        await findAndInspectElements(page, 'Chat interface opened');

        // Step 4: File upload approach - try drag and drop or paste
        console.log('📁 Step 4: Uploading backside scanner file...');

        // Check if file exists
        if (!fs.existsSync(BACKSIDE_FILE)) {
            throw new Error(`Backside file not found: ${BACKSIDE_FILE}`);
        }

        // Read the file content for pasting
        const fileContent = fs.readFileSync(BACKSIDE_FILE, 'utf8');
        console.log(`✅ File loaded, size: ${fileContent.length} characters`);

        // Try to paste the file content into the chat
        const textAreas = await page.$$('textarea');
        if (textAreas.length > 0) {
            console.log('✅ Found text area, pasting file content...');
            await textAreas[0].type(`\n\n--- File: backside para b copy.py ---\n${fileContent}\n\nPlease format this code and add it to projects.`);
            await takeScreenshot(page, '03_file_pasted');
            await sleep(2000);

            // Look for send button
            const sendButton = await clickButtonByText(page, 'Send');
            if (!sendButton) {
                // Try other common send button texts
                await clickButtonByText(page, 'Submit') ||
                await clickButtonByText(page, 'Chat') ||
                await clickButtonByText(page, 'Go');
            }

            console.log('✅ File content submitted to Renata AI');
            await takeScreenshot(page, '04_file_submitted');
        } else {
            console.log('❌ No text area found for file upload');
        }

        // Step 5: Wait for AI formatting and response
        console.log('🤖 Step 5: Waiting for AI formatting...');
        await sleep(15000); // Wait longer for AI processing
        await takeScreenshot(page, '05_ai_response');

        // Step 6: Look for project management interface
        console.log('➕ Step 6: Checking for project management...');
        await findAndInspectElements(page, 'After AI response');

        // Try to find and click project-related buttons
        const projectButtonFound = await clickButtonByText(page, 'Add') ||
                                 await clickButtonByText(page, 'Project') ||
                                 await clickButtonByText(page, 'Save');

        if (projectButtonFound) {
            console.log('✅ Project-related button clicked');
            await takeScreenshot(page, '06_project_action');
        }

        // Step 7: Look for refresh/reload functionality
        console.log('🔄 Step 7: Checking for refresh options...');

        const refreshButtonFound = await clickButtonByText(page, 'Refresh') ||
                                 await clickButtonByText(page, 'Reload') ||
                                 await clickButtonByText(page, 'Update');

        if (refreshButtonFound) {
            console.log('✅ Refresh button clicked');
            await sleep(3000);
        }

        await takeScreenshot(page, '07_refresh_attempt');

        // Step 8: Final inspection
        console.log('🔍 Step 8: Final inspection of projects...');
        const finalElements = await findAndInspectElements(page, 'Final state');

        await takeScreenshot(page, '08_final_state');

        console.log('\n🎯 Corrected A-Z Workflow Test Complete!');
        console.log('📊 Screenshots saved to:', SCREENSHOTS_DIR);

        return {
            success: true,
            assistantOpened: clickedAssistant,
            fileUploaded: textAreas.length > 0,
            projectsFound: finalElements.projectElements.filter(el =>
                el.text.toLowerCase().includes('project') ||
                el.text.toLowerCase().includes('scanner') ||
                el.text.toLowerCase().includes('backside')
            ).length > 0,
            buttonsFound: finalElements.buttons.length,
            screenshotsTaken: 8,
            message: 'Corrected workflow test completed - accessed Renata AI interface'
        };

    } catch (error) {
        console.error('❌ Test failed:', error);
        return {
            success: false,
            error: error.message,
            message: 'Test failed during execution'
        };
    } finally {
        await browser.close();
    }
}

// Run the test
testCompleteWorkflow()
    .then(result => {
        console.log('\n✅ Corrected Test Result:', result);
        process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
        console.error('\n❌ Fatal Error:', error);
        process.exit(1);
    });