/**
 * QUICK FIX - Clear and Reset
 *
 * Run this in browser console (F12) on http://localhost:5665
 * It will clear all old data and reload the page fresh
 */

console.log('🧹 CLEARING OLD DATA...');

// Clear all Renata-related data
localStorage.removeItem('twoStageScannerCode');
localStorage.removeItem('renata_chat_history');
localStorage.removeItem('selectedScannerId');
localStorage.removeItem('chatMessages');
localStorage.removeItem('scanResults');

console.log('✅ Cleared formatted code');
console.log('✅ Cleared chat history');
console.log('✅ Cleared scan results');

console.log('');
console.log('🔄 RELOADING PAGE...');
console.log('');

// Reload the page
setTimeout(() => {
  location.reload();
}, 500);

/**
 * AFTER RELOAD:
 * 1. Go to http://localhost:5665/scan
 * 2. Upload your scanner file
 * 3. Wait for formatting to complete
 * 4. Download the clean formatted code
 * 5. Test it - should work perfectly! ✅
 */
