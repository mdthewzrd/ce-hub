#!/usr/bin/env node

/**
 * PRECISION SELECTOR VALIDATION TEST
 * Quick test to validate our precision fixes work correctly
 */

const { chromium } = require('playwright');
const { PRECISION_SELECTORS, precisionClick, selectAIMode, validateWithContexts } = require('./precision_selectors_fix.js');
const { getImprovedCurrentState, validateStateMatch } = require('./improved_state_detection.js');

async function rapidPrecisionTest() {
    console.log('⚡ RAPID PRECISION SELECTOR VALIDATION TEST');
    console.log('🎯 Testing precision fixes for button selector ambiguity...');

    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    try {
        // Navigate
        await page.goto('http://localhost:6565/dashboard');
        await page.waitForTimeout(3000);
        console.log('✅ Dashboard loaded');

        // Test 1: Precision Date Range Selection
        console.log('\n🧪 TEST 1: Precision Date Range Selection');
        try {
            await precisionClick(page, 'dateRange', '7d');
            await page.waitForTimeout(1000);

            const state = await getImprovedCurrentState(page);
            console.log('📊 State after 7d click:', state);
            console.log('✅ DATE RANGE: Precision selector worked!');
        } catch (error) {
            console.log('❌ DATE RANGE: Failed -', error.message);
        }

        // Test 2: Precision Display Mode Selection
        console.log('\n🧪 TEST 2: Precision Display Mode Selection');
        try {
            await precisionClick(page, 'displayMode', 'R');
            await page.waitForTimeout(1000);

            const state = await getImprovedCurrentState(page);
            console.log('📊 State after R click:', state);
            console.log('✅ DISPLAY MODE: Precision selector worked!');
        } catch (error) {
            console.log('❌ DISPLAY MODE: Failed -', error.message);
        }

        // Test 3: AI Mode Selection
        console.log('\n🧪 TEST 3: AI Mode Selection');
        try {
            await selectAIMode(page, 'Analyst');
            await page.waitForTimeout(1000);

            const state = await getImprovedCurrentState(page);
            console.log('📊 State after Analyst select:', state);
            console.log('✅ AI MODE: Enhanced selector worked!');
        } catch (error) {
            console.log('❌ AI MODE: Failed -', error.message);
        }

        // Test 4: Comprehensive State Validation
        console.log('\n🧪 TEST 4: Comprehensive State Validation');
        try {
            const finalState = await getImprovedCurrentState(page);
            const validation = validateStateMatch(
                { dateRange: '7d', displayMode: 'R', aiMode: 'Analyst' },
                finalState
            );

            console.log('📊 Final state:', JSON.stringify(finalState, null, 2));
            console.log('📋 Validation result:', validation);

            if (validation.isValid) {
                console.log('✅ COMPREHENSIVE: All states validated successfully!');
            } else {
                console.log('❌ COMPREHENSIVE: Validation issues -', validation.issues.join(', '));
            }
        } catch (error) {
            console.log('❌ COMPREHENSIVE: Failed -', error.message);
        }

        // Test 5: Button Ambiguity Resolution
        console.log('\n🧪 TEST 5: Button Ambiguity Resolution Test');
        try {
            // Count all buttons that contain "R"
            const allRButtons = await page.locator('button:has-text("R")').count();
            console.log(`📊 Total buttons containing "R": ${allRButtons}`);

            // Test our precision selector
            const precisionSelector = PRECISION_SELECTORS.displayMode.R;
            const precisionButtons = await page.locator(precisionSelector).count();
            console.log(`🎯 Precision selector matches: ${precisionButtons}`);

            if (precisionButtons === 1) {
                console.log('✅ AMBIGUITY: Precision selector correctly identifies single target!');
            } else {
                console.log(`❌ AMBIGUITY: Precision selector still ambiguous (${precisionButtons} matches)`);
            }
        } catch (error) {
            console.log('❌ AMBIGUITY: Test failed -', error.message);
        }

        console.log('\n🏁 RAPID PRECISION TEST COMPLETED');

    } catch (error) {
        console.error('💥 Rapid test failed:', error);
    } finally {
        await browser.close();
        console.log('🧹 Browser closed');
    }
}

rapidPrecisionTest().catch(console.error);