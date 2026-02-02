// 🔧 CACHE BUSTER - Force browser to reload everything
// Update this timestamp to force cache refresh
window.CACHE_BUSTER_VERSION = "2025-11-05-21:46:00-BULLETPROOF-PARAMETER-FIX";
window.FRONTEND_VERSION = "BULLETPROOF_v1.0";

console.log("🔧 CACHE BUSTER ACTIVE:", window.CACHE_BUSTER_VERSION);
console.log("🔧 FRONTEND VERSION:", window.FRONTEND_VERSION);

// Force reload if old version detected
if (localStorage.getItem('frontend_version') !== window.FRONTEND_VERSION) {
  console.log("🔄 NEW VERSION DETECTED - CLEARING CACHE");
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('frontend_version', window.FRONTEND_VERSION);
}