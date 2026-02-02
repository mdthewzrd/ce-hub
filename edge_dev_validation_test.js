// Targeted Edge.dev Platform Validation Test
// Focused on the specific platform structure and workflow

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
    baseUrl: 'http://localhost:5657',
    screenshotsDir: '/Users/michaeldurante/ai dev/ce-hub/screenshots',
    backsideScannerPath: '/Users/michaeldurante/Downloads/backside para b copy.py',
    testTimeout: 300000,
    slowMo: 50
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
    console.log('🚀 Starting Targeted Edge.dev Platform Validation Test');

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

        // 2. Look for any clickable elements to interact with
        console.log('\n🔍 Step 2: Analyzing page structure...');
        const pageStructure = await page.evaluate(() => {
            const allButtons = Array.from(document.querySelectorAll('button, a, [role="button"]'))
                .map(el => ({
                    tag: el.tagName,
                    text: el.textContent?.trim() || '',
                    className: el.className,
                    id: el.id,
                    ariaLabel: el.getAttribute('aria-label'),
                    clickable: el.onclick || el.href
                }))
                .filter(el => el.text || el.ariaLabel);

            const allInputs = Array.from(document.querySelectorAll('input, textarea'))
                .map(el => ({
                    tag: el.tagName,
                    type: el.type || 'text',
                    placeholder: el.placeholder || '',
                    className: el.className,
                    id: el.id
                }));

            return { buttons: allButtons, inputs: allInputs };
        });

        console.log('Found buttons:');
        pageStructure.buttons.slice(0, 10).forEach(btn => {
            console.log(`  - ${btn.text || btn.ariaLabel || btn.className} (${btn.tag})`);
        });

        console.log('Found inputs:');
        pageStructure.inputs.forEach(input => {
            console.log(`  - ${input.placeholder || input.type || input.className} (${input.tag})`);
        });

        // 3. Try to find and click the RenataAI Assistant button
        console.log('\n💬 Step 3: Clicking RenataAI Assistant button...');
        const renataButton = await page.evaluateHandle(() => {
            const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));
            return buttons.find(el =>
                el.textContent?.includes('Renata') ||
                el.textContent?.includes('AI') ||
                el.textContent?.includes('Assistant')
            );
        });

        if (renataButton.asElement()) {
            await renataButton.asElement().click();
            console.log('✅ Clicked RenataAI Assistant button');
            await sleep(3000);
            await takeScreenshot(page, '02_renata_clicked', 'RenataAI Assistant clicked');
        } else {
            console.log('❌ RenataAI Assistant button not found');
            await takeScreenshot(page, '02_no_renata', 'No Renata button found');
        }

        // 4. Look for any way to input the scanner code
        console.log('\n📝 Step 4: Looking for code input methods...');
        await sleep(2000);

        // Check if there's a way to upload or input code
        const inputMethods = await page.evaluate(() => {
            const methods = [];

            // Look for file uploads
            const fileInputs = Array.from(document.querySelectorAll('input[type="file"]'));
            if (fileInputs.length > 0) {
                methods.push({ type: 'file-upload', count: fileInputs.length });
            }

            // Look for text areas
            const textareas = Array.from(document.querySelectorAll('textarea'));
            if (textareas.length > 0) {
                methods.push({ type: 'textarea', count: textareas.length, details: textareas.map(t => ({ placeholder: t.placeholder, className: t.className })) });
            }

            // Look for contenteditable divs
            const editableDivs = Array.from(document.querySelectorAll('[contenteditable="true"]'));
            if (editableDivs.length > 0) {
                methods.push({ type: 'contenteditable', count: editableDivs.length });
            }

            // Look for code blocks or editors
            const codeElements = Array.from(document.querySelectorAll('code, pre, .code-editor, .monaco-editor, .ace_editor'));
            if (codeElements.length > 0) {
                methods.push({ type: 'code-editor', count: codeElements.length });
            }

            return methods;
        });

        console.log('Available input methods:');
        inputMethods.forEach(method => {
            console.log(`  - ${method.type}: ${method.count} found`);
            if (method.details) {
                method.details.forEach(detail => console.log(`    * ${detail.placeholder || detail.className}`));
            }
        });

        // 5. Try to input the scanner code using available methods
        let codeInputSuccessful = false;

        if (inputMethods.some(m => m.type === 'textarea')) {
            console.log('📋 Step 5a: Trying to input code via textarea...');
            const textareas = await page.$$('textarea');
            for (let i = 0; i < textareas.length; i++) {
                try {
                    await textareas[i].click();
                    await textareas[i].focus();
                    await page.keyboard.down('Control');
                    await page.keyboard.press('a');
                    await page.keyboard.up('Control');

                    // Type the first 1000 characters as a test
                    const testCode = backsideScannerCode.slice(0, 1000);
                    await textareas[i].type(testCode);

                    console.log(`✅ Input code to textarea ${i}`);
                    codeInputSuccessful = true;
                    await takeScreenshot(page, `05_code_textarea_${i}`, 'Code input via textarea');
                    break;
                } catch (error) {
                    console.log(`❌ Failed to input to textarea ${i}: ${error.message}`);
                }
            }
        }

        if (!codeInputSuccessful && inputMethods.some(m => m.type === 'contenteditable')) {
            console.log('📋 Step 5b: Trying to input code via contenteditable...');
            const editableDivs = await page.$$('[contenteditable="true"]');
            for (let i = 0; i < editableDivs.length; i++) {
                try {
                    await editableDivs[i].click();
                    await editableDivs[i].focus();

                    // Type a smaller test snippet
                    const testSnippet = backsideScannerCode.slice(0, 200);
                    await page.keyboard.type(testSnippet);

                    console.log(`✅ Input code to editable div ${i}`);
                    codeInputSuccessful = true;
                    await takeScreenshot(page, `05_code_editable_${i}`, 'Code input via contenteditable');
                    break;
                } catch (error) {
                    console.log(`❌ Failed to input to editable div ${i}: ${error.message}`);
                }
            }
        }

        if (!codeInputSuccessful) {
            console.log('⚠️ Could not find suitable input method for code');
            await takeScreenshot(page, '05_no_code_input', 'No code input method found');
        }

        // 6. Look for way to trigger processing
        console.log('\n⚡ Step 6: Looking for processing controls...');
        await sleep(2000);

        const processingControls = await page.evaluate(() => {
            const controls = [];

            // Look for format/analyze buttons
            const formatButtons = Array.from(document.querySelectorAll('button'))
                .filter(el => el.textContent?.toLowerCase().includes('format') ||
                              el.textContent?.toLowerCase().includes('analyze') ||
                              el.textContent?.toLowerCase().includes('process') ||
                              el.textContent?.toLowerCase().includes('submit') ||
                              el.textContent?.toLowerCase().includes('send'));

            if (formatButtons.length > 0) {
                controls.push({ type: 'format-buttons', count: formatButtons.length, details: formatButtons.map(b => b.textContent) });
            }

            // Look for project-related controls
            const projectButtons = Array.from(document.querySelectorAll('button'))
                .filter(el => el.textContent?.toLowerCase().includes('project') ||
                              el.textContent?.toLowerCase().includes('add'));

            if (projectButtons.length > 0) {
                controls.push({ type: 'project-buttons', count: projectButtons.length, details: projectButtons.map(b => b.textContent) });
            }

            return controls;
        });

        console.log('Processing controls found:');
        processingControls.forEach(control => {
            console.log(`  - ${control.type}: ${control.count} found`);
            control.details?.forEach(detail => console.log(`    * ${detail}`));
        });

        // 7. Try to navigate to projects section directly
        console.log('\n📁 Step 7: Navigating to projects section...');

        try {
            await page.goto(`${config.baseUrl}/projects`, { waitUntil: 'networkidle2' });
            console.log('✅ Navigated to /projects');
            await sleep(3000);
            await takeScreenshot(page, '07_projects_page', 'Projects page loaded');
        } catch (error) {
            console.log(`❌ Could not navigate to /projects: ${error.message}`);
        }

        // 8. Look for any existing projects or ways to create one
        console.log('\n🔍 Step 8: Analyzing projects section...');
        const projectsAnalysis = await page.evaluate(() => {
            const projectElements = Array.from(document.querySelectorAll('[class*="project"], [data-testid*="project"], [id*="project"]'))
                .map(el => ({
                    tag: el.tagName,
                    text: el.textContent?.trim().slice(0, 100),
                    className: el.className,
                    id: el.id
                }));

            const createButtons = Array.from(document.querySelectorAll('button'))
                .filter(el => el.textContent?.toLowerCase().includes('create') ||
                              el.textContent?.toLowerCase().includes('new') ||
                              el.textContent?.toLowerCase().includes('add'))
                .map(el => el.textContent);

            const uploadButtons = Array.from(document.querySelectorAll('button, input[type="file"]'))
                .filter(el => el.textContent?.toLowerCase().includes('upload') ||
                              el.type === 'file')
                .map(el => el.textContent || 'file input');

            return { projectElements, createButtons, uploadButtons };
        });

        console.log('Projects section analysis:');
        console.log(`  - Project elements: ${projectsAnalysis.projectElements.length}`);
        projectsAnalysis.projectElements.forEach(el => {
            console.log(`    * ${el.tag}: ${el.text.slice(0, 50)}...`);
        });
        console.log(`  - Create buttons: ${projectsAnalysis.createButtons.length}`);
        projectsAnalysis.createButtons.forEach(btn => console.log(`    * ${btn}`));
        console.log(`  - Upload buttons: ${projectsAnalysis.uploadButtons.length}`);
        projectsAnalysis.uploadButtons.forEach(btn => console.log(`    * ${btn}`));

        // 9. Try file upload approach if available
        if (projectsAnalysis.uploadButtons.length > 0) {
            console.log('\n📤 Step 9: Trying file upload approach...');

            // Create a temporary file with the scanner code
            const tempFilePath = '/tmp/backside_scanner.py';
            fs.writeFileSync(tempFilePath, backsideScannerCode);
            console.log(`✅ Created temporary file: ${tempFilePath}`);

            // Look for file input elements
            const fileInputs = await page.$$('input[type="file"]');
            for (let i = 0; i < fileInputs.length; i++) {
                try {
                    await fileInputs[i].uploadFile(tempFilePath);
                    console.log(`✅ Uploaded file to input ${i}`);
                    await takeScreenshot(page, `09_file_uploaded_${i}`, 'File uploaded successfully');
                    break;
                } catch (error) {
                    console.log(`❌ Failed to upload to input ${i}: ${error.message}`);
                }
            }
        }

        // 10. Final comprehensive screenshot and analysis
        console.log('\n📊 Step 10: Final platform analysis...');
        await sleep(2000);

        const finalAnalysis = await page.evaluate(() => {
            const allInteractive = Array.from(document.querySelectorAll('button, a, input, textarea, select, [role="button"], [contenteditable="true"]'))
                .map(el => ({
                    tag: el.tagName,
                    type: el.type || '',
                    text: el.textContent?.trim().slice(0, 50) || '',
                    className: el.className,
                    id: el.id,
                    visible: el.offsetParent !== null
                }))
                .filter(el => el.visible);

            return {
                totalInteractiveElements: allInteractive.length,
                elementTypes: allInteractive.reduce((acc, el) => {
                    acc[el.tag] = (acc[el.tag] || 0) + 1;
                    return acc;
                }, {}),
                sampleElements: allInteractive.slice(0, 20)
            };
        });

        console.log('Final platform analysis:');
        console.log(`  - Total interactive elements: ${finalAnalysis.totalInteractiveElements}`);
        console.log('  - Element types:');
        Object.entries(finalAnalysis.elementTypes).forEach(([tag, count]) => {
            console.log(`    * ${tag}: ${count}`);
        });

        await takeScreenshot(page, '10_final_analysis', 'Final platform state');

        // 11. Try direct API test as fallback
        console.log('\n🔌 Step 11: Testing API endpoints directly...');

        try {
            // Test the formatting API endpoint
            const formatResponse = await page.evaluate(async () => {
                try {
                    const response = await fetch('/api/format', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            code: `# Test scanner\nprint("Hello world")`
                        })
                    });
                    return { status: response.status, ok: response.ok };
                } catch (error) {
                    return { error: error.message };
                }
            });

            console.log('API format test result:', formatResponse);
        } catch (error) {
            console.log('API test failed:', error.message);
        }

        console.log('\n✅ Targeted validation test completed!');
        console.log(`📸 All screenshots saved to: ${config.screenshotsDir}`);

    } catch (error) {
        console.error('❌ Test failed with error:', error);

        try {
            await takeScreenshot(page, 'error_state', 'Error occurred during test');
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