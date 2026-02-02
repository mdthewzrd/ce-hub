#!/usr/bin/env python3
"""
Traderra Systematic Fix Validation Script
Creates MCP Playwright commands to systematically test and validate state management fixes

This script creates a comprehensive test sequence to validate that:
1. Date range selection persists across display mode changes
2. All components maintain state isolation
3. Multi-step workflows work correctly
"""

import json
from datetime import datetime

class TraderraFixValidation:
    """
    Systematic validation script for state management fixes
    """

    def create_fix_validation_sequence(self):
        """
        Create a systematic test sequence to validate state management fixes
        """

        validation_sequence = {
            "comprehensive_state_isolation_test": {
                "description": "Test all state changes in sequence to validate isolation",
                "mcp_playwright_commands": [
                    {
                        "step": 1,
                        "action": "Navigate to dashboard and capture baseline",
                        "command": "navigate",
                        "url": "http://localhost:6565/dashboard",
                        "wait": 3000,
                        "screenshot": "step1_baseline.png"
                    },
                    {
                        "step": 2,
                        "action": "Select 7d date range",
                        "command": "click",
                        "selector": "button[text='7d']",
                        "wait": 1000,
                        "screenshot": "step2_7d_selected.png",
                        "validate_console": ["setSelectedRange updating", "selectedRange=week"]
                    },
                    {
                        "step": 3,
                        "action": "Toggle to R display mode",
                        "command": "click",
                        "selector": "button[text='R']",
                        "wait": 1000,
                        "screenshot": "step3_r_mode_with_7d.png",
                        "validate_state": {
                            "date_range": "7d should still be selected",
                            "display_mode": "R should be active",
                            "expected": "Both states preserved"
                        }
                    },
                    {
                        "step": 4,
                        "action": "Toggle to $ display mode",
                        "command": "click",
                        "selector": "button[text='$']",
                        "wait": 1000,
                        "screenshot": "step4_dollar_mode_with_7d.png",
                        "validate_state": {
                            "date_range": "7d should still be selected",
                            "display_mode": "$ should be active",
                            "expected": "Both states preserved"
                        }
                    },
                    {
                        "step": 5,
                        "action": "Change to Analyst AI mode",
                        "command": "select_option",
                        "selector": "combobox",
                        "value": "Analyst",
                        "wait": 1000,
                        "screenshot": "step5_analyst_mode_full_state.png",
                        "validate_state": {
                            "date_range": "7d should still be selected",
                            "display_mode": "$ should still be active",
                            "ai_mode": "Analyst should be selected",
                            "expected": "All three states preserved"
                        }
                    },
                    {
                        "step": 6,
                        "action": "Change date range to 30d",
                        "command": "click",
                        "selector": "button[text='30d']",
                        "wait": 1000,
                        "screenshot": "step6_30d_full_state.png",
                        "validate_state": {
                            "date_range": "30d should now be selected",
                            "display_mode": "$ should still be active",
                            "ai_mode": "Analyst should still be selected",
                            "expected": "Date range changed, other states preserved"
                        }
                    },
                    {
                        "step": 7,
                        "action": "Change to Coach AI mode",
                        "command": "select_option",
                        "selector": "combobox",
                        "value": "Coach",
                        "wait": 1000,
                        "screenshot": "step7_coach_mode_full_state.png",
                        "validate_state": {
                            "date_range": "30d should still be selected",
                            "display_mode": "$ should still be active",
                            "ai_mode": "Coach should be selected",
                            "expected": "AI mode changed, other states preserved"
                        }
                    },
                    {
                        "step": 8,
                        "action": "Final validation - All date ranges",
                        "command": "multi_click_sequence",
                        "sequence": ["90d", "All", "7d"],
                        "wait_between": 500,
                        "screenshot_after_each": True,
                        "validate_persistence": {
                            "display_mode": "$ should remain active throughout",
                            "ai_mode": "Coach should remain selected throughout"
                        }
                    }
                ]
            },

            "rapid_state_change_test": {
                "description": "Test rapid state changes to identify race conditions",
                "commands": [
                    "Navigate to dashboard",
                    "Rapidly cycle through: 7d->30d->90d->All (500ms intervals)",
                    "Rapidly toggle: $->R->$->R (300ms intervals)",
                    "Rapidly switch AI modes: Renata->Analyst->Coach->Mentor (400ms intervals)",
                    "Validate final state matches last selections"
                ]
            },

            "cross_navigation_state_test": {
                "description": "Test state persistence across page navigation",
                "commands": [
                    "Set specific state: 7d + $ + Analyst",
                    "Navigate to /journal (should 404)",
                    "Navigate back to /dashboard",
                    "Validate state restoration or expected reset behavior"
                ]
            }
        }

        return validation_sequence

    def create_mcp_test_execution_script(self):
        """
        Create executable MCP Playwright test script
        """

        script = '''
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
    console.log("\\n=== STATE MANAGEMENT VALIDATION RESULTS ===");
    let criticalFailures = 0;

    results.forEach(result => {
        const status = result.result ? "✅ PASS" : "❌ FAIL";
        const critical = result.critical ? " [CRITICAL]" : "";
        console.log(`Step ${result.step}: ${result.test}${critical}: ${status}`);

        if (result.critical && !result.result) {
            criticalFailures++;
        }
    });

    console.log(`\\nCritical Failures: ${criticalFailures}`);
    console.log(`Overall Status: ${criticalFailures === 0 ? "✅ PASSED" : "❌ FAILED"}`);

    if (criticalFailures > 0) {
        console.log("\\n🚨 CRITICAL ISSUE CONFIRMED:");
        console.log("Date range selection does NOT persist during display mode changes");
        console.log("This requires immediate fixing before deployment");
    } else {
        console.log("\\n🎉 STATE MANAGEMENT WORKING CORRECTLY!");
        console.log("All components maintain proper state isolation");
    }

    return results;
}

// Export for MCP usage
module.exports = { validateStateManagement };
'''

        return script

    def create_fix_recommendations(self):
        """
        Create specific recommendations for fixing the state management issues
        """

        recommendations = {
            "immediate_fixes_required": {
                "fix_1_state_isolation": {
                    "issue": "Date range state resets during display mode changes",
                    "likely_cause": "Shared state context or component re-mounting",
                    "investigation_steps": [
                        "1. Check if DateRangeContext and DisplayModeContext are properly separated",
                        "2. Verify component mounting/unmounting during display mode changes",
                        "3. Review state management architecture for unintended dependencies",
                        "4. Check for any shared reducers or state management logic"
                    ],
                    "proposed_solution": [
                        "1. Ensure complete separation of state contexts",
                        "2. Implement proper state persistence mechanisms",
                        "3. Add state debugging to track unexpected resets",
                        "4. Create isolated state management for each component"
                    ],
                    "validation_test": "Run comprehensive test script to confirm fix effectiveness"
                },

                "fix_2_console_logging": {
                    "issue": "Inconsistent console logging across components",
                    "solution": [
                        "Add console logging to display mode changes",
                        "Add console logging to AI mode changes",
                        "Standardize logging format across all components",
                        "Include state transition information in logs"
                    ]
                }
            },

            "testing_requirements": {
                "before_deployment": [
                    "✅ All 8 steps of systematic test must pass",
                    "✅ No critical failures in state persistence",
                    "✅ Rapid state change test must pass",
                    "✅ Cross-navigation state behavior validated",
                    "✅ Performance under rapid changes acceptable"
                ],

                "continuous_monitoring": [
                    "Real-time validation of state changes",
                    "Automated detection of state reset issues",
                    "Performance monitoring for state transitions",
                    "User experience impact assessment"
                ]
            }
        }

        return recommendations

def main():
    print("🔧 TRADERRA STATE MANAGEMENT FIX VALIDATION")
    print("=" * 60)

    validator = TraderraFixValidation()

    # Save validation sequence
    sequence = validator.create_fix_validation_sequence()
    with open("/Users/michaeldurante/ai dev/ce-hub/traderra_fix_validation_sequence.json", "w") as f:
        json.dump(sequence, f, indent=2)

    # Save MCP test script
    script = validator.create_mcp_test_execution_script()
    with open("/Users/michaeldurante/ai dev/ce-hub/traderra_mcp_validation_script.js", "w") as f:
        f.write(script)

    # Save fix recommendations
    recommendations = validator.create_fix_recommendations()
    with open("/Users/michaeldurante/ai dev/ce-hub/traderra_fix_recommendations.json", "w") as f:
        json.dump(recommendations, f, indent=2)

    print("📋 VALIDATION SEQUENCE CREATED: traderra_fix_validation_sequence.json")
    print("🧪 MCP TEST SCRIPT CREATED: traderra_mcp_validation_script.js")
    print("🔧 FIX RECOMMENDATIONS CREATED: traderra_fix_recommendations.json")
    print()
    print("🎯 NEXT STEPS:")
    print("1. 🔧 Fix the date range reset issue in the codebase")
    print("2. 🧪 Execute the MCP validation script to test the fix")
    print("3. 📊 Validate all 8 test steps pass without critical failures")
    print("4. ✅ Deploy only after 100% validation success")
    print()
    print("⚠️  CRITICAL: Do not deploy until state isolation is fixed!")

if __name__ == "__main__":
    main()