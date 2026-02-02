// Complete Edge.dev Workflow Test
// Tests the full user workflow with actual interactions

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
    baseUrl: 'http://localhost:5657',
    screenshotsDir: '/Users/michaeldurante/ai dev/ce-hub/screenshots',
    backsideScannerPath: '/Users/michaeldurante/Downloads/backside para b copy.py',
    testTimeout: 300000,
    slowMo: 100
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

async function main() {
    console.log('🚀 Starting Complete Edge.dev Workflow Test');

    const browser = await puppeteer.launch({
        headless: false,
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
        await sleep(5000);
        await takeScreenshot(page, '01_initial_load', 'Initial page load');

        // 2. Click RenataAI Assistant button
        console.log('\n💬 Step 2: Opening RenataAI Assistant...');
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const renataButton = buttons.find(el => el.textContent?.includes('RenataAI Assistant'));
            if (renataButton) renataButton.click();
        });
        await sleep(3000);
        await takeScreenshot(page, '02_renata_opened', 'RenataAI Assistant opened');

        // 3. Input the backside scanner code
        console.log('\n📝 Step 3: Inputting backside scanner code...');
        const textarea = await page.evaluateHandle(() => {
            const textareas = Array.from(document.querySelectorAll('textarea'));
            return textareas.find(ta => ta.placeholder?.includes('trading scanners'));
        });

        if (textarea.asElement()) {
            await textarea.asElement().click();
            await textarea.asElement().focus();

            // Clear existing content
            await page.keyboard.down('Control');
            await page.keyboard.press('a');
            await page.keyboard.up('Control');

            // Input the code in chunks to avoid overwhelming
            const chunkSize = 2000;
            for (let i = 0; i < backsideScannerCode.length; i += chunkSize) {
                const chunk = backsideScannerCode.slice(i, i + chunkSize);
                await page.keyboard.type(chunk);
                await sleep(100);
            }

            console.log('✅ Successfully input complete backside scanner code');
            await takeScreenshot(page, '03_code_input_complete', 'Complete backside scanner code input');
        } else {
            console.log('❌ Could not find textarea for code input');
            return;
        }

        // 4. Click Format Code button
        console.log('\n🎨 Step 4: Clicking Format Code button...');
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const formatButton = buttons.find(el => el.textContent?.includes('Format Code'));
            if (formatButton) formatButton.click();
        });
        await sleep(5000); // Wait for formatting
        await takeScreenshot(page, '04_code_formatted', 'Code formatted');

        // 5. Look for "Add to Project" button after formatting
        console.log('\n➕ Step 5: Looking for "Add to Project" button...');
        await sleep(3000);

        const addToProjectFound = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));
            const addButton = buttons.find(el =>
                el.textContent?.toLowerCase().includes('add to project') ||
                el.textContent?.toLowerCase().includes('save to project') ||
                el.textContent?.toLowerCase().includes('create project')
            );
            return !!addButton;
        });

        console.log(`Add to Project button found: ${addToProjectFound}`);

        if (addToProjectFound) {
            console.log('✅ Clicking "Add to Project" button...');
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));
                const addButton = buttons.find(el =>
                    el.textContent?.toLowerCase().includes('add to project') ||
                    el.textContent?.toLowerCase().includes('save to project') ||
                    el.textContent?.toLowerCase().includes('create project')
                );
                if (addButton) addButton.click();
            });
            await sleep(3000);
            await takeScreenshot(page, '05_add_to_project_clicked', 'Add to Project clicked');
        } else {
            console.log('⚠️ "Add to Project" button not found - checking for alternatives...');
            await takeScreenshot(page, '05_no_add_button', 'No Add to Project button found');
        }

        // 6. Look for project creation dialog or navigation
        console.log('\n📁 Step 6: Looking for project creation interface...');
        await sleep(3000);

        const projectCreationFound = await page.evaluate(() => {
            // Look for project creation modal, dialog, or form
            const modals = Array.from(document.querySelectorAll('.modal, .dialog, [role="dialog"]'));
            const forms = Array.from(document.querySelectorAll('form'));
            const projectInputs = Array.from(document.querySelectorAll('input[placeholder*="project"], input[name*="project"]'));

            return {
                modals: modals.length,
                forms: forms.length,
                projectInputs: projectInputs.length
            };
        });

        console.log('Project creation elements:', projectCreationFound);

        if (projectCreationFound.modals > 0 || projectCreationFound.forms > 0) {
            await takeScreenshot(page, '06_project_creation_ui', 'Project creation UI found');

            // Try to fill out project creation form
            const projectCreated = await page.evaluate(() => {
                // Look for project name input
                const nameInputs = Array.from(document.querySelectorAll('input[type="text"], input:not([type])'))
                    .filter(input => !input.type || input.type === 'text');

                if (nameInputs.length > 0) {
                    const nameInput = nameInputs[0];
                    nameInput.value = 'Backside Scanner Test';
                    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
                    nameInput.dispatchEvent(new Event('change', { bubbles: true }));
                }

                // Look for create/submit button
                const buttons = Array.from(document.querySelectorAll('button'))
                    .filter(button =>
                        button.textContent?.toLowerCase().includes('create') ||
                        button.textContent?.toLowerCase().includes('save') ||
                        button.textContent?.toLowerCase().includes('submit')
                    );

                if (buttons.length > 0) {
                    buttons[0].click();
                    return true;
                }

                return false;
            });

            if (projectCreated) {
                console.log('✅ Project creation initiated');
                await sleep(5000);
                await takeScreenshot(page, '07_project_created', 'Project creation completed');
            }
        }

        // 7. Try alternative approach - check if there's a Projects menu or navigation
        console.log('\n🧭 Step 7: Looking for Projects navigation...');

        const navigationElements = await page.evaluate(() => {
            const navLinks = Array.from(document.querySelectorAll('a, button'))
                .map(el => ({
                    text: el.textContent?.trim() || '',
                    href: el.href || '',
                    tag: el.tagName
                }))
                .filter(el =>
                    el.text.toLowerCase().includes('project') ||
                    el.text.toLowerCase().includes('scanner') ||
                    el.href.includes('/project')
                );

            return navLinks;
        });

        console.log('Navigation elements found:', navigationElements);

        if (navigationElements.length > 0) {
            console.log('✅ Found Projects navigation - clicking...');
            await page.evaluate(() => {
                const navLinks = Array.from(document.querySelectorAll('a, button'))
                    .find(el =>
                        el.textContent?.toLowerCase().includes('project') ||
                        el.href.includes('/project')
                    );
                if (navLinks) navLinks.click();
            });
            await sleep(3000);
            await takeScreenshot(page, '08_projects_navigated', 'Projects section navigated');
        }

        // 8. Look for any existing projects and execution controls
        console.log('\n⚡ Step 8: Looking for projects and execution controls...');
        await sleep(3000);

        const projectsAndControls = await page.evaluate(() => {
            // Look for project cards or items
            const projectCards = Array.from(document.querySelectorAll('[class*="project"], [data-testid*="project"]'))
                .map(el => ({
                    text: el.textContent?.trim().slice(0, 100),
                    tag: el.tagName,
                    className: el.className
                }));

            // Look for execution controls
            const executionButtons = Array.from(document.querySelectorAll('button'))
                .filter(button =>
                    button.textContent?.toLowerCase().includes('run') ||
                    button.textContent?.toLowerCase().includes('execute') ||
                    button.textContent?.toLowerCase().includes('start')
                )
                .map(button => button.textContent);

            // Look for date inputs
            const dateInputs = Array.from(document.querySelectorAll('input[type="date"]'));

            return {
                projectCards,
                executionButtons,
                dateInputCount: dateInputs.length
            };
        });

        console.log('Projects and controls found:', projectsAndControls);

        if (projectsAndControls.projectCards.length > 0) {
            console.log('✅ Found project cards - clicking first one...');
            await page.evaluate(() => {
                const projectCards = Array.from(document.querySelectorAll('[class*="project"], [data-testid*="project"]'));
                if (projectCards.length > 0) {
                    projectCards[0].click();
                }
            });
            await sleep(3000);
            await takeScreenshot(page, '09_project_selected', 'Project selected for execution');
        }

        // 9. If execution controls are found, try to set up and run the scanner
        if (projectsAndControls.executionButtons.length > 0) {
            console.log('✅ Found execution controls - setting up test run...');

            // Look for date inputs and set test range
            const dateInputsSet = await page.evaluate(() => {
                const dateInputs = Array.from(document.querySelectorAll('input[type="date"]'));
                if (dateInputs.length >= 2) {
                    dateInputs[0].value = '2025-01-01'; // Start date
                    dateInputs[1].value = '2025-11-01'; // End date
                    return true;
                }
                return false;
            });

            if (dateInputsSet) {
                console.log('✅ Set date range: Jan 1, 2025 to Nov 1, 2025');
                await sleep(1000);
                await takeScreenshot(page, '10_date_range_set', 'Test date range set');
            }

            // Click run/execute button
            console.log('🚀 Starting scanner execution...');
            const executionStarted = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'))
                    .find(button =>
                        button.textContent?.toLowerCase().includes('run') ||
                        button.textContent?.toLowerCase().includes('execute') ||
                        button.textContent?.toLowerCase().includes('start')
                    );
                if (buttons) {
                    buttons.click();
                    return true;
                }
                return false;
            });

            if (executionStarted) {
                console.log('✅ Scanner execution started');
                await sleep(10000); // Wait for execution
                await takeScreenshot(page, '11_execution_in_progress', 'Scanner execution in progress');

                // Look for results
                console.log('📊 Looking for execution results...');
                await sleep(10000);

                const resultsFound = await page.evaluate(() => {
                    const resultsContainers = Array.from(document.querySelectorAll('[class*="result"], [data-testid*="result"], .output, .response'))
                        .filter(el => el.offsetParent !== null);

                    return {
                        count: resultsContainers.length,
                        content: resultsContainers.map(el => el.textContent?.trim().slice(0, 200))
                    };
                });

                console.log('Results found:', resultsFound);

                if (resultsFound.count > 0) {
                    console.log('✅ Execution results displayed!');
                    console.log('Results preview:', resultsFound.content[0]);

                    // Count potential signals
                    const signalCount = (resultsFound.content[0]?.match(/signal/gi) || []).length;
                    console.log(`🎯 Found ${signalCount} signals mentioned in results`);

                    await takeScreenshot(page, '12_final_results', 'Final execution results');
                } else {
                    console.log('⚠️ No results containers found');
                    await takeScreenshot(page, '12_no_results', 'No execution results found');
                }
            }
        } else {
            console.log('⚠️ No execution controls found');
            await takeScreenshot(page, '10_no_execution', 'No execution controls available');
        }

        // 10. Final state analysis
        console.log('\n📈 Step 10: Final workflow analysis...');
        const finalState = await page.evaluate(() => {
            const pageTitle = document.title;
            const url = window.location.href;
            const allText = document.body.innerText.slice(0, 500);

            return {
                pageTitle,
                url,
                contentPreview: allText
            };
        });

        console.log('Final state:');
        console.log(`  - Page title: ${finalState.pageTitle}`);
        console.log(`  - URL: ${finalState.url}`);
        console.log(`  - Content preview: ${finalState.contentPreview}`);

        await takeScreenshot(page, '13_final_workflow_state', 'Complete workflow final state');

        console.log('\n✅ Complete Edge.dev workflow test finished!');
        console.log(`📸 All screenshots saved to: ${config.screenshotsDir}`);

    } catch (error) {
        console.error('❌ Test failed with error:', error);

        try {
            await takeScreenshot(page, 'workflow_error', 'Workflow error occurred');
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