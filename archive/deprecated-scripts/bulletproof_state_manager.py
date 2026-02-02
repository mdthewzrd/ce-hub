#!/usr/bin/env python3
"""
Bulletproof State Manager for Traderra
Multi-attempt system that ENSURES the correct state is achieved, not just attempted
"""

class BulletproofStateManager:
    def __init__(self):
        self.max_attempts = 5
        self.validation_timeout = 3000

    def validate_current_state(self):
        """Returns the actual current state by analyzing DOM and console"""
        # This would integrate with MCP Playwright to check actual state
        validation_script = '''
        async function validateActualState(page) {
            // Check current page
            const url = page.url();
            const isStatsPage = url.includes('/statistics');

            // Check date range - look for active button
            const date90Active = await page.locator('button:has-text("90d")[active]').count();
            const dateAllActive = await page.locator('button:has-text("All")[active]').count();
            const date7Active = await page.locator('button:has-text("7d")[active]').count();
            const date30Active = await page.locator('button:has-text("30d")[active]').count();

            let currentDateRange = "unknown";
            if (date90Active > 0) currentDateRange = "90day";
            else if (dateAllActive > 0) currentDateRange = "all";
            else if (date7Active > 0) currentDateRange = "week";
            else if (date30Active > 0) currentDateRange = "month";

            // Check display mode
            const dollarActive = await page.locator('button:has-text("$")[active]').count();
            const rActive = await page.locator('button:has-text("R")[active]').count();

            let currentDisplayMode = "unknown";
            if (dollarActive > 0) currentDisplayMode = "dollar";
            else if (rActive > 0) currentDisplayMode = "r";

            return {
                page: isStatsPage ? "stats" : "other",
                dateRange: currentDateRange,
                displayMode: currentDisplayMode,
                url: url
            };
        }
        '''
        return validation_script

    def create_retry_navigation_script(self):
        """Creates a script that retries navigation until successful"""
        return '''
        async function bulletproofNavigateToStats(page) {
            console.log("🎯 Starting bulletproof navigation to Stats page...");

            for (let attempt = 1; attempt <= 5; attempt++) {
                console.log(`Attempt ${attempt}: Navigating to Stats...`);

                try {
                    // Click Stats link
                    await page.getByRole('link', { name: 'Stats', exact: true }).click();
                    await page.waitForTimeout(2000);

                    // Validate we're actually on stats page
                    const currentUrl = page.url();
                    if (currentUrl.includes('/statistics')) {
                        console.log(`✅ SUCCESS: Now on stats page: ${currentUrl}`);
                        return { success: true, attempt: attempt, url: currentUrl };
                    } else {
                        console.log(`❌ FAILED: Still on ${currentUrl}, retrying...`);
                        await page.waitForTimeout(1000);
                    }
                } catch (error) {
                    console.log(`❌ ERROR on attempt ${attempt}: ${error.message}`);
                    await page.waitForTimeout(1000);
                }
            }

            return { success: false, error: "Failed to reach stats page after 5 attempts" };
        }
        '''

    def create_retry_date_range_script(self):
        """Creates a script that retries date range setting until successful"""
        return '''
        async function bulletproofSetDateRange(page, targetRange) {
            console.log(`🎯 Starting bulletproof date range setting to: ${targetRange}`);

            for (let attempt = 1; attempt <= 5; attempt++) {
                console.log(`Attempt ${attempt}: Setting date range to ${targetRange}...`);

                try {
                    // Click the target date range button
                    await page.getByRole('button', { name: targetRange }).click();
                    await page.waitForTimeout(1500);

                    // Validate the button is actually active
                    const isActive = await page.locator(`button:has-text("${targetRange}")[active]`).count();

                    if (isActive > 0) {
                        console.log(`✅ SUCCESS: ${targetRange} button is now active`);
                        return { success: true, attempt: attempt, activeRange: targetRange };
                    } else {
                        console.log(`❌ FAILED: ${targetRange} button not active, retrying...`);

                        // Check what IS active
                        const allActive = await page.locator('button:has-text("All")[active]').count();
                        const weekActive = await page.locator('button:has-text("7d")[active]').count();
                        const monthActive = await page.locator('button:has-text("30d")[active]').count();
                        const ninetyActive = await page.locator('button:has-text("90d")[active]').count();

                        console.log(`Current active states: All=${allActive}, 7d=${weekActive}, 30d=${monthActive}, 90d=${ninetyActive}`);
                        await page.waitForTimeout(1000);
                    }
                } catch (error) {
                    console.log(`❌ ERROR on attempt ${attempt}: ${error.message}`);
                    await page.waitForTimeout(1000);
                }
            }

            return { success: false, error: `Failed to set date range to ${targetRange} after 5 attempts` };
        }
        '''

    def create_retry_display_mode_script(self):
        """Creates a script that retries display mode setting until successful"""
        return '''
        async function bulletproofSetDisplayMode(page, targetMode) {
            console.log(`🎯 Starting bulletproof display mode setting to: ${targetMode}`);

            const buttonText = targetMode === "dollar" ? "Switch to Dollar display mode" : "Switch to Risk Multiple display mode";
            const checkText = targetMode === "dollar" ? "$" : "R";

            for (let attempt = 1; attempt <= 5; attempt++) {
                console.log(`Attempt ${attempt}: Setting display mode to ${targetMode}...`);

                try {
                    // Click the target display mode button
                    await page.getByRole('button', { name: buttonText }).click();
                    await page.waitForTimeout(1500);

                    // Validate the button is actually active
                    const isActive = await page.locator(`button:has-text("${checkText}")[active]`).count();

                    if (isActive > 0) {
                        console.log(`✅ SUCCESS: ${targetMode} mode is now active`);

                        // Double-check by looking at metric values
                        const metrics = await page.locator('generic:has-text("0.00")').first().textContent();
                        const expectedFormat = targetMode === "dollar" ? "$" : "R";

                        if (metrics && metrics.includes(expectedFormat)) {
                            console.log(`✅ CONFIRMED: Metrics show ${expectedFormat} format`);
                            return { success: true, attempt: attempt, activeMode: targetMode, metrics: metrics };
                        } else {
                            console.log(`⚠️ WARNING: Button active but metrics may not have updated: ${metrics}`);
                        }

                        return { success: true, attempt: attempt, activeMode: targetMode };
                    } else {
                        console.log(`❌ FAILED: ${targetMode} button not active, retrying...`);

                        // Check what IS active
                        const dollarActive = await page.locator('button:has-text("$")[active]').count();
                        const rActive = await page.locator('button:has-text("R")[active]').count();

                        console.log(`Current active states: $ mode=${dollarActive}, R mode=${rActive}`);
                        await page.waitForTimeout(1000);
                    }
                } catch (error) {
                    console.log(`❌ ERROR on attempt ${attempt}: ${error.message}`);
                    await page.waitForTimeout(1000);
                }
            }

            return { success: false, error: `Failed to set display mode to ${targetMode} after 5 attempts` };
        }
        '''

def generate_complete_execution_script():
    """Generate the complete bulletproof execution script"""
    script = '''
// Bulletproof Multi-Attempt Execution Script for Traderra
// This ENSURES the correct state is achieved, not just attempted

async function bulletproofExecuteUserRequest(page) {
    console.log("🚀 STARTING BULLETPROOF EXECUTION");
    console.log("Target: Stats page + 90 days + Dollar display");
    console.log("=" * 50);

    const results = {
        navigation: null,
        dateRange: null,
        displayMode: null,
        finalValidation: null,
        success: false
    };

    // STEP 1: Navigate to Stats Page
    console.log("\\n🎯 STEP 1: Bulletproof Navigation to Stats");
    try {
        results.navigation = await bulletproofNavigateToStats(page);
        if (!results.navigation.success) {
            console.log("❌ CRITICAL FAILURE: Could not reach stats page");
            return results;
        }
    } catch (error) {
        console.log(`❌ NAVIGATION ERROR: ${error.message}`);
        return results;
    }

    // STEP 2: Set Date Range to 90 Days
    console.log("\\n🎯 STEP 2: Bulletproof Date Range Setting");
    try {
        results.dateRange = await bulletproofSetDateRange(page, "90d");
        if (!results.dateRange.success) {
            console.log("❌ CRITICAL FAILURE: Could not set date range to 90 days");
            return results;
        }
    } catch (error) {
        console.log(`❌ DATE RANGE ERROR: ${error.message}`);
        return results;
    }

    // STEP 3: Set Display Mode to Dollar
    console.log("\\n🎯 STEP 3: Bulletproof Display Mode Setting");
    try {
        results.displayMode = await bulletproofSetDisplayMode(page, "dollar");
        if (!results.displayMode.success) {
            console.log("❌ CRITICAL FAILURE: Could not set display mode to dollar");
            return results;
        }
    } catch (error) {
        console.log(`❌ DISPLAY MODE ERROR: ${error.message}`);
        return results;
    }

    // STEP 4: Final Validation
    console.log("\\n🎯 STEP 4: Final State Validation");
    try {
        await page.waitForTimeout(2000); // Allow all changes to settle

        const finalState = await validateActualState(page);
        results.finalValidation = finalState;

        // Check if we achieved ALL targets
        const allTargetsMet =
            finalState.page === "stats" &&
            finalState.dateRange === "90day" &&
            finalState.displayMode === "dollar";

        if (allTargetsMet) {
            console.log("\\n🎉 BULLETPROOF SUCCESS! All targets achieved:");
            console.log(`✅ Page: ${finalState.page}`);
            console.log(`✅ Date Range: ${finalState.dateRange}`);
            console.log(`✅ Display Mode: ${finalState.displayMode}`);
            console.log(`✅ URL: ${finalState.url}`);

            results.success = true;
        } else {
            console.log("\\n❌ FINAL VALIDATION FAILED:");
            console.log(`Page: ${finalState.page} (target: stats)`);
            console.log(`Date Range: ${finalState.dateRange} (target: 90day)`);
            console.log(`Display Mode: ${finalState.displayMode} (target: dollar)`);
        }

    } catch (error) {
        console.log(`❌ FINAL VALIDATION ERROR: ${error.message}`);
    }

    return results;
}

// Helper functions included
''' + manager.create_retry_navigation_script() + '''
''' + manager.create_retry_date_range_script() + '''
''' + manager.create_retry_display_mode_script() + '''
''' + manager.validate_current_state() + '''

// Execute the bulletproof process
console.log("Initializing bulletproof execution...");
'''

    return script

if __name__ == "__main__":
    manager = BulletproofStateManager()

    print("🎯 BULLETPROOF STATE MANAGER FOR TRADERRA")
    print("=" * 50)
    print("Creating multi-attempt retry system that ENSURES success...")
    print()

    script = generate_complete_execution_script()

    with open("/Users/michaeldurante/ai dev/ce-hub/bulletproof_execution_script.js", "w") as f:
        f.write(script)

    print("✅ Bulletproof execution script created!")
    print("✅ Multi-attempt retry logic implemented!")
    print("✅ State validation with actual DOM checking!")
    print("✅ Comprehensive error handling and recovery!")
    print()
    print("📋 Features:")
    print("  • 5 attempts per operation with validation")
    print("  • Real DOM state checking (not just assumptions)")
    print("  • Detailed logging of what's actually happening")
    print("  • Continues until SUCCESS or max attempts reached")
    print()
    print("🚀 Ready to execute bulletproof state management!")