
// Traderra State Management Fix Validation Script
// Execute this with MCP Playwright to systematically test state isolation

async function validateStateManagement(page) {
    console.log("🔍 Starting Comprehensive State Management Validation...");

    const results = [];

    // Step 1: Navigate and baseline
    console.log("Step 1: Navigate to dashboard");
    await page.goto('http://localhost:6565/dashboard');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'step1_baseline.png', fullPage: true });

    // Step 2: Select 7d date range
    console.log("Step 2: Select 7d date range");
    await page.getByRole('button', { name: '7d' }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'step2_7d_selected.png', fullPage: true });

    const step2_7d_active = await page.locator('button:has-text("7d")[active]').count();
    results.push({ step: 2, test: "7d_selection", result: step2_7d_active > 0 });

    // Step 3: Toggle to R mode (critical test - does 7d persist?)
    console.log("Step 3: Toggle to R display mode - CRITICAL TEST");
    await page.getByRole('button', { name: 'Switch to Risk Multiple display mode' }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'step3_r_mode_CRITICAL_TEST.png', fullPage: true });

    const step3_7d_still_active = await page.locator('button:has-text("7d")[active]').count();
    const step3_r_active = await page.locator('button:has-text("R")[active]').count();
    results.push({
        step: 3,
        test: "date_range_persistence_during_display_toggle",
        result: step3_7d_still_active > 0,
        critical: true,
        display_mode_working: step3_r_active > 0
    });

    // Step 4: Toggle to $ mode
    console.log("Step 4: Toggle to $ display mode");
    await page.getByRole('button', { name: 'Switch to Dollar display mode' }).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'step4_dollar_mode.png', fullPage: true });

    const step4_7d_still_active = await page.locator('button:has-text("7d")[active]').count();
    const step4_dollar_active = await page.locator('button:has-text("$")[active]').count();
    results.push({
        step: 4,
        test: "date_range_persistence_during_second_display_toggle",
        result: step4_7d_still_active > 0,
        critical: true,
        display_mode_working: step4_dollar_active > 0
    });

    // Step 5: Change AI mode
    console.log("Step 5: Change to Analyst AI mode");
    await page.getByRole('combobox').first().selectOption(['Analyst']);
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'step5_analyst_mode.png', fullPage: true });

    const step5_7d_still_active = await page.locator('button:has-text("7d")[active]').count();
    const step5_dollar_still_active = await page.locator('button:has-text("$")[active]').count();
    const step5_analyst_selected = await page.locator('option:has-text("Analyst")[selected]').count();
    results.push({
        step: 5,
        test: "full_state_isolation_with_ai_mode",
        date_range_preserved: step5_7d_still_active > 0,
        display_mode_preserved: step5_dollar_still_active > 0,
        ai_mode_working: step5_analyst_selected > 0
    });

    // Generate comprehensive report
    console.log("\n=== STATE MANAGEMENT VALIDATION RESULTS ===");
    let criticalFailures = 0;

    results.forEach(result => {
        const status = result.result ? "✅ PASS" : "❌ FAIL";
        const critical = result.critical ? " [CRITICAL]" : "";
        console.log(`Step ${result.step}: ${result.test}${critical}: ${status}`);

        if (result.critical && !result.result) {
            criticalFailures++;
        }
    });

    console.log(`\nCritical Failures: ${criticalFailures}`);
    console.log(`Overall Status: ${criticalFailures === 0 ? "✅ PASSED" : "❌ FAILED"}`);

    if (criticalFailures > 0) {
        console.log("\n🚨 CRITICAL ISSUE CONFIRMED:");
        console.log("Date range selection does NOT persist during display mode changes");
        console.log("This requires immediate fixing before deployment");
    } else {
        console.log("\n🎉 STATE MANAGEMENT WORKING CORRECTLY!");
        console.log("All components maintain proper state isolation");
    }

    return results;
}

// Export for MCP usage
module.exports = { validateStateManagement };
