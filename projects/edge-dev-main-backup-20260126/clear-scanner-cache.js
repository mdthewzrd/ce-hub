// Clear scanner cache and test extraction
console.log('🧹 Clearing scanner cache...');

localStorage.removeItem('twoStageScannerCode');
localStorage.removeItem('twoStageScannerName');
localStorage.removeItem('twoStageActiveCode');
localStorage.removeItem('twoStageActiveName');

console.log('✅ Cache cleared! Now re-upload your file.');
console.log('Check browser console for "🏷️ Extracted scanner name from code:" log');
