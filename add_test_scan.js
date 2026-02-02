/**
 * Working Solution: Add Test Scan to Saved Scans
 *
 * This script adds a test scan with the exact data format expected by the CE-Hub saved scans system.
 * Run this script in the browser console on localhost:5665/scan
 */

(function() {
    'use strict';

    // Storage key used by CE-Hub
    const STORAGE_KEY = 'traderra_saved_scans';

    /**
     * Generate unique ID for saved scans (matches the utility function)
     */
    function generateScanId() {
        return `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get current saved scans storage or create default structure
     */
    function getSavedScansStorage() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) {
                return {
                    version: '1.0',
                    scans: [],
                    settings: {
                        maxSavedScans: 50,
                        autoCleanupDays: 90
                    }
                };
            }
            const parsed = JSON.parse(stored);
            return parsed;
        } catch (error) {
            console.error('Error loading saved scans:', error);
            return {
                version: '1.0',
                scans: [],
                settings: {
                    maxSavedScans: 50,
                    autoCleanupDays: 90
                }
            };
        }
    }

    /**
     * Save scans storage to localStorage
     */
    function setSavedScansStorage(storage) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
            return true;
        } catch (error) {
            console.error('Error saving scans to localStorage:', error);
            return false;
        }
    }

    /**
     * Create test scan data with the exact format expected
     */
    function createTestScan() {
        const testResults = [
            {
                symbol: 'SPY',
                ticker: 'SPY',
                date: '2025-12-08',
                scanner_type: 'LC D2 Extended',
                gap_percent: 2.5,
                volume_ratio: 1.8,
                signal_strength: 'Strong',
                entry_price: 450.25,
                target_price: 465.00,
                confidence_score: 85,
                high_chg_atr: 2.1,
                dist_h_9ema_atr: -0.5,
                dist_h_20ema_atr: -0.3,
                ema_stack: true,
                prev_close: 439.75
            },
            {
                symbol: 'QQQ',
                ticker: 'QQQ',
                date: '2025-12-03',
                scanner_type: 'LC D2 Extended',
                gap_percent: 1.8,
                volume_ratio: 1.5,
                signal_strength: 'Moderate',
                entry_price: 485.50,
                target_price: 495.00,
                confidence_score: 72,
                high_chg_atr: 1.7,
                dist_h_9ema_atr: -0.2,
                dist_h_20ema_atr: 0.1,
                ema_stack: false,
                prev_close: 476.85
            },
            {
                symbol: 'NVDA',
                ticker: 'NVDA',
                date: '2025-11-19',
                scanner_type: 'LC D2 Extended',
                gap_percent: 3.2,
                volume_ratio: 2.3,
                signal_strength: 'Strong',
                entry_price: 145.80,
                target_price: 158.00,
                confidence_score: 91,
                high_chg_atr: 2.8,
                dist_h_9ema_atr: -0.7,
                dist_h_20ema_atr: -0.4,
                ema_stack: true,
                prev_close: 141.30
            },
            {
                symbol: 'TSLA',
                ticker: 'TSLA',
                date: '2025-10-08',
                scanner_type: 'LC D2 Extended',
                gap_percent: 4.1,
                volume_ratio: 2.8,
                signal_strength: 'Strong',
                entry_price: 225.40,
                target_price: 245.00,
                confidence_score: 88,
                high_chg_atr: 3.5,
                dist_h_9ema_atr: -0.9,
                dist_h_20ema_atr: -0.6,
                ema_stack: true,
                prev_close: 216.50
            }
        ];

        return {
            id: generateScanId(),
            name: 'Test LC Scanner - Dec 2025',
            description: 'Test scan with SPY (12/8), QQQ (12/3), NVDA (11/19), TSLA (10/8)',
            createdAt: new Date().toISOString(),
            lastRun: new Date().toISOString(),
            scanParams: {
                start_date: '2025-10-01',
                end_date: '2025-12-31',
                filters: {
                    lc_frontside_d2_extended: true,
                    min_gap: 1.5,
                    min_pm_vol: 1.2,
                    min_prev_close: 100
                }
            },
            results: testResults,
            resultCount: testResults.length,
            tags: ['test', 'lc-d2', 'validation'],
            isFavorite: true,
            estimatedResults: '4 symbols',
            scanType: 'LC D2 Extended',
            tickerUniverse: 'SPY, QQQ, NVDA, TSLA'
        };
    }

    /**
     * Add test scan to localStorage
     */
    function addTestScan() {
        console.log('🚀 Adding test scan to saved scans...');

        // Get current storage
        const storage = getSavedScansStorage();

        // Create test scan
        const testScan = createTestScan();

        // Check for duplicate names
        const existingNames = storage.scans.map(scan => scan.name);
        if (existingNames.includes(testScan.name)) {
            testScan.name = testScan.name + ' (Updated)';
        }

        // Add to scans array
        storage.scans.unshift(testScan); // Add to beginning

        // Enforce max scans limit
        if (storage.scans.length > storage.settings.maxSavedScans) {
            storage.scans = storage.scans.slice(0, storage.settings.maxSavedScans);
        }

        // Save to localStorage
        const success = setSavedScansStorage(storage);

        if (success) {
            console.log('✅ Test scan added successfully!');
            console.log('📄 Scan details:', testScan);
            console.log('🔍 Total scans in storage:', storage.scans.length);

            // Verify the scan was added
            const verifyStorage = getSavedScansStorage();
            const addedScan = verifyStorage.scans.find(s => s.id === testScan.id);
            if (addedScan) {
                console.log('✅ Verification passed - scan found in storage');
            } else {
                console.log('❌ Verification failed - scan not found in storage');
            }
        } else {
            console.log('❌ Failed to save test scan');
        }

        return success;
    }

    /**
     * Display current saved scans status
     */
    function showSavedScansStatus() {
        const storage = getSavedScansStorage();
        console.log('📊 Saved Scans Status:');
        console.log('   Storage Version:', storage.version);
        console.log('   Total Scans:', storage.scans.length);
        console.log('   Favorite Scans:', storage.scans.filter(s => s.isFavorite).length);
        console.log('   Max Saved Scans:', storage.settings.maxSavedScans);
        console.log('   Auto Cleanup Days:', storage.settings.autoCleanupDays);

        if (storage.scans.length > 0) {
            console.log('   Recent Scans:');
            storage.scans.slice(0, 5).forEach((scan, index) => {
                console.log(`     ${index + 1}. ${scan.name} (${scan.resultCount} results) - ${scan.isFavorite ? '⭐' : '⚪'}`);
            });
        }
    }

    /**
     * Clear all saved scans (for testing)
     */
    function clearAllScans() {
        if (confirm('Are you sure you want to clear all saved scans? This cannot be undone.')) {
            const storage = {
                version: '1.0',
                scans: [],
                settings: {
                    maxSavedScans: 50,
                    autoCleanupDays: 90
                }
            };
            setSavedScansStorage(storage);
            console.log('🗑️ All saved scans cleared');
        }
    }

    // Execute the solution
    console.log('🎯 CE-Hub Saved Scans - Test Data Injection Script');
    console.log('=====================================================');

    // Show current status
    showSavedScansStatus();
    console.log('');

    // Add the test scan
    addTestScan();
    console.log('');

    // Show updated status
    showSavedScansStatus();
    console.log('');
    console.log('💡 Tips:');
    console.log('   1. Refresh the scan page to see the new scan in the sidebar');
    console.log('   2. The scan should appear as "Test LC Scanner - Dec 2025"');
    console.log('   3. Click on the scan to load and view the results');
    console.log('   4. To clear all scans, run: clearAllScans()');

    // Export functions for manual testing
    window.testScanHelper = {
        addTestScan,
        showSavedScansStatus,
        clearAllScans,
        getSavedScansStorage,
        createTestScan
    };

})();