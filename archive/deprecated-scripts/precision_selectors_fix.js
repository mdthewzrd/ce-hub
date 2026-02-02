// PRECISION SELECTOR FIXES - Solving the button ambiguity issues

const PRECISION_SELECTORS = {
    // Date range buttons - more specific
    dateRange: {
        '7d': 'button[data-range-value="week"], button:has-text("7d"):not(:has-text("70")):not(:has-text("17"))',
        '30d': 'button[data-range-value="month"], button:has-text("30d"):not(:has-text("30")):not(:has-text("130"))',
        '90d': 'button[data-range-value="90day"], button:has-text("90d"):not(:has-text("90")):not(:has-text("190"))',
        'All': 'button[data-range-value="all"], button:has-text("All"):not(:has-text("Call")):not(:has-text("Small"))'
    },

    // Display mode buttons - highly specific
    displayMode: {
        '$': 'button[data-mode-value="dollar"], button[aria-label*="Dollar"], button[data-button-type="dollar"]',
        'R': 'button[data-mode-value="r"], button[aria-label*="Risk Multiple"], button[data-button-type="risk"]'
    },

    // AI mode selectors - multiple fallbacks
    aiMode: {
        primary: 'select[data-ai-mode], select:has(option:is([value="Renata"], [value="Analyst"], [value="Coach"], [value="Mentor"]))',
        fallback: '[role="combobox"], select:first-of-type',
        container: '.ai-mode-selector, .renata-selector, [data-testid="ai-mode"]'
    }
};

// Enhanced click function with precision
async function precisionClick(page, elementType, value) {
    const selectors = PRECISION_SELECTORS[elementType];
    let targetSelector;

    if (elementType === 'dateRange' || elementType === 'displayMode') {
        targetSelector = selectors[value];
    } else if (elementType === 'aiMode') {
        targetSelector = selectors.primary;
    }

    console.log(`🎯 Precision clicking ${elementType}:${value} with selector: ${targetSelector}`);

    try {
        // Try primary selector first
        const element = await page.locator(targetSelector).first();
        await element.click();
        return true;
    } catch (error) {
        console.log(`⚠️ Primary selector failed, trying fallbacks...`);

        // For display mode, try more specific approach
        if (elementType === 'displayMode') {
            const buttons = await page.locator('button').all();
            for (const button of buttons) {
                const text = await button.textContent();
                const ariaLabel = await button.getAttribute('aria-label');
                const dataType = await button.getAttribute('data-button-type');

                if (value === '$' && (text?.trim() === '$' || ariaLabel?.includes('Dollar') || dataType === 'dollar')) {
                    await button.click();
                    return true;
                } else if (value === 'R' && (text?.trim() === 'R' || ariaLabel?.includes('Risk') || dataType === 'risk')) {
                    await button.click();
                    return true;
                }
            }
        }

        throw new Error(`Could not find element for ${elementType}:${value}`);
    }
}

// Enhanced AI mode selection
async function selectAIMode(page, mode) {
    const selectors = PRECISION_SELECTORS.aiMode;

    try {
        // Try primary selector
        const select = await page.locator(selectors.primary).first();
        await select.selectOption(mode);
        return true;
    } catch (error) {
        // Try fallback selectors
        const fallbackSelect = await page.locator(selectors.fallback).first();
        await fallbackSelect.selectOption(mode);
        return true;
    }
}

// Enhanced state validation with context objects
async function validateWithContexts(page, expected) {
    const state = await page.evaluate((expectedState) => {
        // Access context objects directly from window
        const contexts = {
            dateRange: window.DateRangeContext?.selectedRange,
            displayMode: window.DisplayModeContext?.displayMode,
            pnlMode: window.PnLModeContext?.mode
        };

        // Get DOM state as backup
        const domState = {
            activeDateButton: Array.from(document.querySelectorAll('button')).find(btn =>
                btn.getAttribute('data-active') === 'true' ||
                btn.classList.contains('active') ||
                getComputedStyle(btn).backgroundColor !== 'rgba(0, 0, 0, 0)'
            )?.textContent?.trim(),

            activeDisplayMode: Array.from(document.querySelectorAll('button')).find(btn =>
                btn.getAttribute('data-active') === 'true' &&
                (btn.textContent?.trim() === '$' || btn.textContent?.trim() === 'R')
            )?.textContent?.trim(),

            aiModeSelect: document.querySelector('select')?.value
        };

        return {
            contexts,
            domState,
            expectedState,
            timestamp: new Date().toISOString()
        };
    }, expected);

    return state;
}

module.exports = {
    PRECISION_SELECTORS,
    precisionClick,
    selectAIMode,
    validateWithContexts
};