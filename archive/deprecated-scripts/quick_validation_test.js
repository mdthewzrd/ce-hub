#!/usr/bin/env node

/**
 * QUICK VALIDATION TEST - Testing the improved state detection
 * This validates our fixes before applying to the main testing suite
 */

const { chromium } = require('playwright');
const { getImprovedCurrentState, validateStateMatch } = require('./improved_state_detection.js');

async function quickTest() {
    console.log('🔧 QUICK VALIDATION: Testing improved state detection...');

    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    try {
        // Navigate to dashboard
        await page.goto('http://localhost:6565/dashboard');
        await page.waitForTimeout(3000);

        console.log('✅ Dashboard loaded');

        // Test 1: Baseline state
        console.log('\n🧪 Test 1: Baseline state detection');
        const baselineState = await getImprovedCurrentState(page);
        console.log('📊 Baseline state:', JSON.stringify(baselineState, null, 2));

        // Test 2: Change date range to 7d
        console.log('\n🧪 Test 2: Change date range to 7d');
        await page.locator('button:has-text("7d")').click();
        await page.waitForTimeout(1000);

        const dateChangedState = await getImprovedCurrentState(page);
        console.log('📊 After 7d click:', JSON.stringify(dateChangedState, null, 2));

        const dateValidation = validateStateMatch(
            { dateRange: '7d', displayMode: '$', aiMode: 'Renata' },
            dateChangedState
        );
        console.log('✅ Date validation:', dateValidation);

        // Test 3: Change display mode to R
        console.log('\n🧪 Test 3: Change display mode to R');
        await page.locator('button:has-text("R")').click();
        await page.waitForTimeout(1000);

        const displayChangedState = await getImprovedCurrentState(page);
        console.log('📊 After R click:', JSON.stringify(displayChangedState, null, 2));

        const displayValidation = validateStateMatch(
            { dateRange: '7d', displayMode: 'R', aiMode: 'Renata' },
            displayChangedState
        );
        console.log('✅ Display validation:', displayValidation);

        // Test 4: Change AI mode
        console.log('\n🧪 Test 4: Change AI mode to Analyst');
        const aiSelector = await page.locator('select, [role="combobox"]').first();
        await aiSelector.selectOption(['Analyst']);
        await page.waitForTimeout(1000);

        const aiChangedState = await getImprovedCurrentState(page);
        console.log('📊 After AI change:', JSON.stringify(aiChangedState, null, 2));

        const aiValidation = validateStateMatch(
            { dateRange: '7d', displayMode: 'R', aiMode: 'Analyst' },
            aiChangedState
        );
        console.log('✅ AI validation:', aiValidation);

        // Summary
        console.log('\n📋 SUMMARY:');
        console.log(`🎯 Date range test: ${dateValidation.isValid ? '✅ PASS' : '❌ FAIL'} (${dateValidation.score}%)`);
        console.log(`🎯 Display mode test: ${displayValidation.isValid ? '✅ PASS' : '❌ FAIL'} (${displayValidation.score}%)`);
        console.log(`🎯 AI mode test: ${aiValidation.isValid ? '✅ PASS' : '❌ FAIL'} (${aiValidation.score}%)`);

        const overallSuccess = dateValidation.isValid && displayValidation.isValid && aiValidation.isValid;
        console.log(`\n🏆 OVERALL: ${overallSuccess ? '✅ IMPROVED DETECTION WORKS!' : '❌ NEEDS MORE WORK'}`);

        if (!overallSuccess) {
            console.log('\n🔍 Issues found:');
            [dateValidation, displayValidation, aiValidation].forEach((result, i) => {
                if (result.issues.length > 0) {
                    console.log(`  Test ${i+1}: ${result.issues.join(', ')}`);
                }
            });
        }

    } catch (error) {
        console.error('❌ Quick test failed:', error);
    } finally {
        await browser.close();
    }
}

quickTest().catch(console.error);