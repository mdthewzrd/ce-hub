// Quick script to add test scans to localStorage
console.log('🔧 Adding test scans to localStorage for 5665/scan page...');

const STORAGE_KEY = 'traderra_saved_scans';

const testScans = [
  {
    id: `test_scan_${Date.now()}_1`,
    name: 'LC Frontside D2 Test Scan',
    createdAt: new Date().toISOString(),
    scanParams: {
      start_date: '2024-01-01',
      end_date: '2024-12-11'
    },
    resultCount: 7,
    scanType: 'LC Frontside D2 Extended Scanner',
    description: 'Test scan for debugging the scan page',
    results: [
      { ticker: 'SPY', price: 450, confidence: 85, gap: 2.3 },
      { ticker: 'AAPL', price: 190, confidence: 78, gap: 1.8 },
      { ticker: 'MSFT', price: 380, confidence: 92, gap: 1.2 }
    ],
    isFavorite: false
  },
  {
    id: `test_scan_${Date.now()}_2`,
    name: 'Backside Continuation Test',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    scanParams: {
      start_date: '2024-01-01',
      end_date: '2024-12-10'
    },
    resultCount: 12,
    scanType: 'LC Backside Continuation Scanner',
    description: 'Another test scan for debugging',
    results: [
      { ticker: 'TSLA', price: 240, confidence: 71, gap: 3.1 },
      { ticker: 'NVDA', price: 480, confidence: 89, gap: 2.7 }
    ],
    isFavorite: true
  }
];

// Get existing storage or create new
const existing = localStorage.getItem(STORAGE_KEY);
const storage = existing ? JSON.parse(existing) : {
  version: '1.0',
  scans: [],
  settings: { maxSavedScans: 50, autoCleanupDays: 90 }
};

// Add test scans
testScans.forEach(testScan => {
  storage.scans.push(testScan);
  console.log(`✅ Added test scan: ${testScan.name}`);
});

localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));

console.log(`📁 Total scans now in localStorage: ${storage.scans.length}`);
console.log('🌐 Now visit http://localhost:5665/scan to see the scans!');
console.log('🔍 Check browser console for debug messages...');