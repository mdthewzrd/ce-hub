/**
 * CLEAR LOCAL STORAGE AND REFORMAT
 *
 * Run this in the browser console to clear old formatted code and force regeneration
 */

console.log("🧹 CLEARING RENATA'S FORMATTED CODE FROM LOCAL STORAGE...");

// Clear the old formatted code
localStorage.removeItem('twoStageScannerCode');

console.log("✅ Cleared!");

// Verify it's gone
const check = localStorage.getItem('twoStageScannerCode');
if (check === null) {
  console.log("✅ Confirmed: No formatted code in localStorage");
  console.log("");
  console.log("📝 NEXT STEPS:");
  console.log("1. Upload your scanner file again through Renata");
  console.log("2. Renata will format it with the NEW improved template");
  console.log("3. The new format will have:");
  console.log("   - Proper initialization output showing workers and date ranges");
  console.log("   - Stage headers with separator lines");
  console.log("   - Progress indicators during execution");
  console.log("   - Final summary with signal counts");
  console.log("");
  console.log("4. Execute the project - it will use the new formatted code!");
} else {
  console.log("❌ Failed to clear - still exists");
}
