#!/usr/bin/env node
/**
 * 🔍 Debug Saved Scans Storage
 * Examines what's actually stored in localStorage for saved scans
 */

const STORAGE_KEY = 'traderra_saved_scans';

function debugSavedScansStorage() {
    console.log('🔍 DEBUGGING SAVED SCANS STORAGE');
    console.log('=' * 50);

    // Note: This is meant to be run in browser console or with localStorage simulation
    console.log('Copy and paste this script into your browser console:');
    console.log('');
    console.log(`
// Debug script to examine saved scans storage
const STORAGE_KEY = 'traderra_saved_scans';

function debugSavedScansStorage() {
    console.log('🔍 DEBUGGING SAVED SCANS STORAGE');
    console.log('='.repeat(50));

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        console.log('❌ No saved scans found in localStorage');
        return;
    }

    let parsed;
    try {
        parsed = JSON.parse(stored);
    } catch (error) {
        console.log('❌ Error parsing localStorage data:', error);
        return;
    }

    console.log('📊 Storage Overview:');
    console.log('   Version:', parsed.version);
    console.log('   Total scans:', parsed.scans?.length || 0);
    console.log('');

    if (!parsed.scans || parsed.scans.length === 0) {
        console.log('📭 No scans found in storage');
        return;
    }

    console.log('📋 SCAN DETAILS:');
    console.log('='.repeat(50));

    parsed.scans.forEach((scan, index) => {
        console.log('\\n🔍 Scan', index + 1, ':');
        console.log('   ID:', scan.id);
        console.log('   Name:', scan.name);
        console.log('   Created:', scan.createdAt);
        console.log('   Last Run:', scan.lastRun || 'Never');
        console.log('   Result Count:', scan.resultCount);
        console.log('   Has Results?:', !!scan.results);

        if (scan.results && scan.results.length > 0) {
            console.log('   📈 Sample Results:');
            scan.results.slice(0, 3).forEach((result, i) => {
                console.log('      ', i+1, ':', result.ticker, 'on', result.date);
            });
        } else {
            console.log('   ⚠️  No results stored');
        }

        console.log('   📅 Date Range:', scan.scanParams?.start_date, 'to', scan.scanParams?.end_date);
        console.log('   🔧 Scan Type:', scan.scanType);

        if (scan.uploadedCode) {
            console.log('   📄 Has Uploaded Code:', scan.uploadedCode.length, 'characters');
        }
    });

    // Check for result duplication
    console.log('\\n🔄 CHECKING FOR RESULT DUPLICATION:');
    console.log('='.repeat(50));

    const scanResults = parsed.scans.map(scan => ({
        name: scan.name,
        id: scan.id,
        resultCount: scan.resultCount,
        firstResult: scan.results?.[0]?.ticker || 'No results'
    }));

    scanResults.forEach((scan, i) => {
        scanResults.forEach((otherScan, j) => {
            if (i !== j && scan.firstResult === otherScan.firstResult && scan.firstResult !== 'No results') {
                console.log('⚠️  DUPLICATE RESULTS DETECTED:');
                console.log('   "' + scan.name + '" and "' + otherScan.name + '" have same first result:', scan.firstResult);
            }
        });
    });
}

debugSavedScansStorage();
    `);
}

debugSavedScansStorage();