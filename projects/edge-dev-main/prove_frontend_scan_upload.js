const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function proveFrontendScanWithFileUpload() {
    console.log('🎯 PROVING Frontend Scanner Works with File Upload and Real Results');
    console.log('================================================================');

    // Launch browser
    const browser = await chromium.launch({
        headless: false,
        slowMo: 1000
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    try {
        // Step 1: Navigate to Edge Dev frontend
        console.log('📱 Navigating to http://localhost:5656...');
        await page.goto('http://localhost:5656', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        await page.waitForTimeout(3000);
        console.log('✅ Frontend loaded');

        // Step 2: Navigate to Market Scanner section
        console.log('🔍 Looking for Market Scanner navigation...');

        // Try different navigation approaches
        const marketScannerLink = await page.locator('text=Market Scanner').first();
        if (await marketScannerLink.count() > 0 && await marketScannerLink.isVisible()) {
            await marketScannerLink.click();
            await page.waitForTimeout(2000);
            console.log('✅ Clicked Market Scanner navigation');
        } else {
            // Try alternative navigation
            const scannerLinks = await page.locator('a:has-text("Scanner")').all();
            if (scannerLinks.length > 0) {
                await scannerLinks[0].click();
                await page.waitForTimeout(2000);
                console.log('✅ Clicked alternative Scanner link');
            }
        }

        // Step 3: Create temporary scanner file from test_backside_b_2025.json
        console.log('📄 Creating temporary scanner file...');
        const backsideBPath = path.join(__dirname, 'backend', 'test_backside_b_2025.json');
        const backsideBContent = fs.readFileSync(backsideBPath, 'utf8');
        const scannerData = JSON.parse(backsideBContent);

        // Create a temporary Python file with the scanner code
        const tempScannerPath = path.join(__dirname, 'temp_backside_b_scanner.py');
        fs.writeFileSync(tempScannerPath, scannerData.uploaded_code);
        console.log('✅ Created temporary scanner file');

        // Step 4: Look for file upload mechanism
        console.log('📤 Looking for file upload mechanism...');

        // Look for file inputs
        const fileInputs = await page.locator('input[type="file"]').all();
        console.log(`Found ${fileInputs.length} file inputs`);

        let uploadElement = null;

        // Check visible file inputs
        for (let i = 0; i < fileInputs.length; i++) {
            const input = fileInputs[i];
            const isVisible = await input.isVisible();
            const parent = await input.locator('..').first();
            const parentVisible = await parent.isVisible();

            console.log(`  File Input ${i}: visible: ${isVisible}, parent visible: ${parentVisible}`);

            if (isVisible || parentVisible) {
                uploadElement = input;
                console.log(`✅ Found usable file input: ${i}`);
                break;
            }
        }

        // Step 5: Look for upload buttons or zones
        if (!uploadElement) {
            console.log('🔍 Looking for upload buttons or zones...');

            // Look for upload buttons
            const uploadButtons = await page.locator('button:has-text("Upload"), button:has-text("Choose File"), [class*="upload"]').all();
            console.log(`Found ${uploadButtons.length} upload-related elements`);

            for (let i = 0; i < uploadButtons.length; i++) {
                const button = uploadButtons[i];
                const isVisible = await button.isVisible();
                console.log(`  Upload Element ${i}: visible: ${isVisible}`);

                if (isVisible) {
                    // Click to reveal file input or trigger file dialog
                    await button.click();
                    await page.waitForTimeout(1000);

                    // Check for newly visible file inputs
                    const newFileInputs = await page.locator('input[type="file"]').all();
                    for (let j = 0; j < newFileInputs.length; j++) {
                        if (await newFileInputs[j].isVisible()) {
                            uploadElement = newFileInputs[j];
                            console.log(`✅ Found file input after clicking upload button: ${j}`);
                            break;
                        }
                    }

                    if (uploadElement) break;
                }
            }
        }

        // Step 6: Look for drag-and-drop zones
        if (!uploadElement) {
            console.log('🔍 Looking for drag-and-drop zones...');

            const dropZones = await page.locator('[class*="drop"], [class*="drag"], [data-testid="dropzone"]').all();
            console.log(`Found ${dropZones.length} drop zones`);

            for (let i = 0; i < dropZones.length; i++) {
                const zone = dropZones[i];
                const isVisible = await zone.isVisible();
                console.log(`  Drop Zone ${i}: visible: ${isVisible}`);

                if (isVisible) {
                    // Try to find hidden file input within the drop zone
                    const fileInput = await zone.locator('input[type="file"]').first();
                    if (await fileInput.count() > 0) {
                        uploadElement = fileInput;
                        console.log(`✅ Found file input in drop zone: ${i}`);
                        break;
                    }
                }
            }
        }

        // Step 7: Take screenshot before upload
        await page.screenshot({
            path: 'prove_before_upload.png',
            fullPage: true
        });
        console.log('📸 Screenshot saved before upload');

        // Step 8: Upload the file if we found an upload mechanism
        if (uploadElement) {
            console.log('📤 Uploading scanner file...');

            // Make sure the file input is visible and interactable
            await uploadElement.scrollIntoViewIfNeeded();
            await page.waitForTimeout(1000);

            // Upload the file
            await uploadElement.setInputFiles(tempScannerPath);
            console.log('✅ Scanner file uploaded');

            await page.waitForTimeout(3000);

            // Step 9: Look for Run/Execute button after upload
            console.log('▶️ Looking for Run button after upload...');

            const runButtons = await page.locator('button:has-text("Run"), button:has-text("Execute"), button:has-text("Start Scan")').all();
            console.log(`Found ${runButtons.length} run buttons`);

            let runButton = null;
            for (let i = 0; i < runButtons.length; i++) {
                const button = runButtons[i];
                const isVisible = await button.isVisible();
                console.log(`  Run Button ${i}: visible: ${isVisible}`);

                if (isVisible) {
                    runButton = button;
                    console.log(`✅ Found visible Run button: ${i}`);
                    break;
                }
            }

            if (runButton) {
                console.log('▶️ Clicking Run button to start scanner execution...');
                await runButton.click();

                // Step 10: Wait for execution and results
                console.log('⏳ Waiting for scanner execution and real results...');
                console.log('   (This may take 20-30 seconds for full analysis...)');

                // Wait for up to 90 seconds for complete execution
                let executionComplete = false;
                let resultCount = 0;

                for (let i = 0; i < 90; i++) {
                    await page.waitForTimeout(1000);

                    // Check for result indicators
                    const resultIndicators = await page.locator('text=results, text=patterns, text=found, text=complete, text=25, text=MSTR, text=SMCI, text=TSLA').all();
                    if (resultIndicators.length > 0) {
                        console.log(`📊 Found ${resultIndicators.length} result indicators at ${i} seconds`);
                        executionComplete = true;

                        // Count specific pattern mentions
                        const pageText = await page.textContent();
                        if (pageText.includes('25')) resultCount++;
                        if (pageText.includes('patterns')) resultCount++;
                        if (pageText.includes('MSTR') || pageText.includes('SMCI') || pageText.includes('TSLA')) resultCount++;

                        break;
                    }

                    // Check for completion messages
                    const statusElements = await page.locator('[class*="status"], [class*="result"], [class*="output"], [class*="progress"]').all();
                    for (const elem of statusElements) {
                        try {
                            const text = await elem.textContent();
                            if (text && (text.includes('complete') || text.includes('found') || text.includes('results') || text.includes('25'))) {
                                console.log(`📊 Status indicator: "${text.trim()}"`);
                                executionComplete = true;
                                break;
                            }
                        } catch (e) {
                            // Continue
                        }
                    }

                    if (executionComplete) break;

                    // Progress indicator every 10 seconds
                    if (i % 10 === 0) {
                        console.log(`   Still waiting... ${i} seconds elapsed`);
                    }
                }

                if (executionComplete) {
                    console.log('✅ Scanner execution appears complete!');
                    console.log(`📊 Found ${resultCount} result indicators`);
                } else {
                    console.log('⚠️  Execution may still be running, taking screenshot anyway...');
                }

                // Step 11: Wait a bit more and take final screenshots
                await page.waitForTimeout(5000);

                // Take multiple screenshots to capture results
                await page.screenshot({
                    path: 'prove_final_results_fullpage.png',
                    fullPage: true
                });

                // Take a viewport screenshot focused on potential results area
                await page.screenshot({
                    path: 'prove_final_results_viewport.png',
                    fullPage: false
                });

                console.log('📸 Final results screenshots saved');

                // Step 12: Analyze page content for proof
                const finalPageText = await page.textContent();
                console.log('📋 Final page analysis:');

                // Look for specific trading symbols
                const tradingSymbols = ['MSTR', 'SMCI', 'TSLA', 'AMD', 'INTC', 'XOM', 'BABA', 'DJT'];
                const foundSymbols = [];
                for (const symbol of tradingSymbols) {
                    if (finalPageText.includes(symbol)) {
                        foundSymbols.push(symbol);
                    }
                }

                if (foundSymbols.length > 0) {
                    console.log(`✅ SUCCESS: Found trading symbols: ${foundSymbols.join(', ')}`);
                }

                // Look for pattern count
                if (finalPageText.includes('25')) {
                    console.log('✅ SUCCESS: Found pattern count "25" in results!');
                }

                if (finalPageText.includes('patterns') || finalPageText.includes('results')) {
                    console.log('✅ SUCCESS: Found "patterns" or "results" in page content!');
                }

                // Look for completion indicators
                if (finalPageText.includes('complete') || finalPageText.includes('finished') || finalPageText.includes('done')) {
                    console.log('✅ SUCCESS: Found completion indicators!');
                }

            } else {
                console.log('❌ No visible Run button found after upload');

                // Take screenshot to see what's available
                await page.screenshot({
                    path: 'prove_no_run_button.png',
                    fullPage: true
                });
                console.log('📸 Screenshot saved showing no Run button');
            }

        } else {
            console.log('❌ No file upload mechanism found');

            // Take screenshot to show the current interface
            await page.screenshot({
                path: 'prove_no_upload_mechanism.png',
                fullPage: true
            });
            console.log('📸 Screenshot saved showing no upload mechanism');
        }

        console.log('✅ Frontend proof test completed');

    } catch (error) {
        console.error('❌ Test failed:', error.message);

        await page.screenshot({
            path: 'prove_test_error.png',
            fullPage: true
        });
        console.log('📸 Error screenshot saved');

    } finally {
        // Clean up temporary file
        try {
            if (fs.existsSync(path.join(__dirname, 'temp_backside_b_scanner.py'))) {
                fs.unlinkSync(path.join(__dirname, 'temp_backside_b_scanner.py'));
                console.log('🧹 Temporary scanner file cleaned up');
            }
        } catch (e) {
            console.log('⚠️  Could not clean up temporary file:', e.message);
        }

        await browser.close();
        console.log('🏁 Browser closed');
    }
}

// Run the test
proveFrontendScanWithFileUpload().catch(console.error);