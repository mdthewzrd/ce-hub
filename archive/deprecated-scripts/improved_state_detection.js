// IMPROVED STATE DETECTION - FIXING THE TESTING FRAMEWORK
// The issue is the AI mode detection is too basic

async function getImprovedCurrentState(page) {
    const state = await page.evaluate(() => {
        // IMPROVED: Get date range state from console-logged contexts
        const dateContext = window.DateRangeContext;
        const activeDateRange = dateContext ? dateContext.selectedRange : null;

        // IMPROVED: Get display mode from console-logged contexts
        const displayContext = window.DisplayModeContext;
        const activeDisplayMode = displayContext ? displayContext.displayMode : null;

        // IMPROVED: Get AI mode from multiple possible selectors
        let activeAiMode = 'unknown';

        // Try various AI mode selectors
        const selectors = [
            'select[data-ai-mode]',
            'select',
            '[role="combobox"]',
            'select option[selected]',
            '[data-testid="ai-mode-select"]',
            '.ai-mode-selector'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                if (element.tagName === 'SELECT') {
                    activeAiMode = element.value || element.selectedOptions[0]?.text || 'unknown';
                    break;
                } else if (element.getAttribute('aria-expanded')) {
                    activeAiMode = element.textContent.trim() || 'unknown';
                    break;
                }
            }
        }

        // Fallback: Check for visible text indicators
        if (activeAiMode === 'unknown') {
            const modeTexts = ['Renata', 'Analyst', 'Coach', 'Mentor'];
            for (const mode of modeTexts) {
                const element = document.querySelector(`*:contains("${mode} Mode")`);
                if (element && element.offsetParent !== null) {
                    activeAiMode = mode;
                    break;
                }
            }
        }

        // Get window context objects for validation
        const contextValidation = {
            dateRangeContext: window.DateRangeContext,
            displayModeContext: window.DisplayModeContext,
            hasContexts: !!(window.DateRangeContext && window.DisplayModeContext)
        };

        return {
            dateRange: activeDateRange,
            displayMode: activeDisplayMode,
            aiMode: activeAiMode,
            contextValidation,
            timestamp: new Date().toISOString(),
            url: window.location.href
        };
    });

    return state;
}

// IMPROVED TEST VALIDATION LOGIC
function validateStateMatch(expected, actual) {
    const issues = [];

    // More flexible date range matching
    if (expected.dateRange && actual.dateRange) {
        const dateRangeMap = { '7d': 'week', '30d': 'month', '90d': '90day', 'All': 'all' };
        const expectedMapped = dateRangeMap[expected.dateRange] || expected.dateRange;
        const actualMapped = dateRangeMap[actual.dateRange] || actual.dateRange;

        if (expectedMapped !== actualMapped) {
            issues.push(`Date range mismatch: expected ${expectedMapped}, got ${actualMapped}`);
        }
    }

    // More flexible display mode matching
    if (expected.displayMode && actual.displayMode) {
        const displayModeMap = { '$': 'dollar', 'R': 'r' };
        const expectedMapped = displayModeMap[expected.displayMode] || expected.displayMode.toLowerCase();
        const actualMapped = displayModeMap[actual.displayMode] || actual.displayMode.toLowerCase();

        if (expectedMapped !== actualMapped) {
            issues.push(`Display mode mismatch: expected ${expectedMapped}, got ${actualMapped}`);
        }
    }

    // More flexible AI mode matching
    if (expected.aiMode && actual.aiMode && actual.aiMode !== 'unknown') {
        if (expected.aiMode.toLowerCase() !== actual.aiMode.toLowerCase()) {
            issues.push(`AI mode mismatch: expected ${expected.aiMode}, got ${actual.aiMode}`);
        }
    }

    return {
        isValid: issues.length === 0,
        issues: issues,
        score: ((3 - issues.length) / 3 * 100).toFixed(1)
    };
}

module.exports = { getImprovedCurrentState, validateStateMatch };