// Create test scan in localStorage for debugging
const STORAGE_KEY = 'traderra_saved_scans';

const testScan = {
  id: `test_scan_5665_${Date.now()}`,
  name: `Test Scan for 5665/scan - ${new Date().toLocaleString()}`,
  createdAt: new Date().toISOString(),
  scanParams: {
    start_date: '2024-01-01',
    end_date: '2024-12-11'
  },
  resultCount: 3,
  scanType: 'LC Scanner',
  description: 'Test scan created specifically for debugging the 5665/scan page',
  results: [
    { ticker: 'SPY', price: 450, confidence: 85, gap: 2.3 },
    { ticker: 'AAPL', price: 190, confidence: 78, gap: 1.8 },
    { ticker: 'MSFT', price: 380, confidence: 92, gap: 1.2 }
  ],
  isFavorite: false
};

// Get existing storage or create new
const existing = localStorage.getItem(STORAGE_KEY);
const storage = existing ? JSON.parse(existing) : {
  version: '1.0',
  scans: [],
  settings: { maxSavedScans: 50, autoCleanupDays: 90 }
};

// Add test scan
storage.scans.push(testScan);
localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));

console.log('✅ Created test scan:', testScan.name);
console.log('📁 Total scans in localStorage:', storage.scans.length);
console.log('🌐 Now visit http://localhost:5665/scan to see if it appears!');