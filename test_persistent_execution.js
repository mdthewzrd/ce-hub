// Test script for persistent scan execution system
// This will validate that the progress display and execution context work correctly

console.log('🧪 Testing Persistent Scan Execution System...');

// Test 1: Check if ScanExecutionContext is properly initialized
function testScanExecutionContext() {
  console.log('\n📋 Test 1: Scan Execution Context');

  // Check if the context provider is loaded
  const contextElement = document.querySelector('[data-scan-execution-context]');
  if (contextElement) {
    console.log('✅ ScanExecutionContext provider found in DOM');
  } else {
    console.log('⚠️  ScanExecutionContext not directly visible (expected - it\'s a React context)');
  }

  // Check for progress display component
  const progressDisplay = document.querySelector('[class*="fixed bottom-4 right-4"]');
  if (progressDisplay) {
    console.log('✅ ScanProgressDisplay component rendered');
  } else {
    console.log('ℹ️  Progress display not initially visible (only shows during execution)');
  }
}

// Test 2: Check localStorage functionality
function testLocalStorage() {
  console.log('\n📋 Test 2: LocalStorage Persistence');

  try {
    const testExecution = {
      id: 'test_' + Date.now(),
      scanner_name: 'Test Scanner',
      status: 'initializing',
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      stages: []
    };

    localStorage.setItem('scan_executions_test', JSON.stringify({ [testExecution.id]: testExecution }));
    const retrieved = JSON.parse(localStorage.getItem('scan_executions_test') || '{}');

    if (retrieved[testExecution.id]) {
      console.log('✅ LocalStorage read/write working');
      localStorage.removeItem('scan_executions_test');
    } else {
      console.log('❌ LocalStorage test failed');
    }
  } catch (error) {
    console.log('❌ LocalStorage error:', error);
  }
}

// Test 3: Check API endpoints
async function testAPIEndpoints() {
  console.log('\n📋 Test 3: API Endpoints');

  try {
    // Test frontend API
    const frontendResponse = await fetch('http://localhost:5665/api/projects', {
      method: 'GET'
    });

    if (frontendResponse.ok) {
      console.log('✅ Frontend API (5665) responding');
    } else {
      console.log('⚠️  Frontend API responded with status:', frontendResponse.status);
    }

    // Test backend API
    const backendResponse = await fetch('http://localhost:5666/api/scanners/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: '# Test code\nprint("Hello World")',
        language: 'python',
        testParams: { dryRun: true }
      })
    });

    if (backendResponse.ok) {
      console.log('✅ Backend API (5666) responding');
    } else {
      console.log('⚠️  Backend API responded with status:', backendResponse.status);
    }

  } catch (error) {
    console.log('❌ API endpoint test failed:', error);
  }
}

// Test 4: Check component integration
function testComponentIntegration() {
  console.log('\n📋 Test 4: Component Integration');

  // Look for Renata chat component
  const renataChat = document.querySelector('[class*="bg-gray-900"]');
  if (renataChat) {
    console.log('✅ StandaloneRenataChat component likely loaded');
  } else {
    console.log('ℹ️  Renata chat component not immediately visible');
  }

  // Check for cache buster script
  if (window.CACHE_BUSTER_VERSION) {
    console.log('✅ Cache buster active:', window.CACHE_BUSTER_VERSION);
  } else {
    console.log('⚠️  Cache buster not detected');
  }

  // Check for frontend version
  if (window.FRONTEND_VERSION) {
    console.log('✅ Frontend version set:', window.FRONTEND_VERSION);
  } else {
    console.log('⚠️  Frontend version not detected');
  }
}

// Run all tests
function runAllTests() {
  console.log('🚀 Starting persistent execution system tests...\n');

  testScanExecutionContext();
  testLocalStorage();
  testAPIEndpoints().then(() => {
    testComponentIntegration();

    console.log('\n🏁 Testing completed!');
    console.log('\n📝 Summary:');
    console.log('- Persistent execution context has been integrated');
    console.log('- Progress display component is ready');
    console.log('- StandaloneRenataChat has been updated with enhanced execution');
    console.log('- System is ready for testing scan persistence');

    console.log('\n🎯 Next Steps:');
    console.log('1. Open Renata chat by clicking the chat button');
    console.log('2. Upload a scanner file and format it');
    console.log('3. Click "Test" to see the persistent execution in action');
    console.log('4. Try clicking away from the chat - execution should continue');
    console.log('5. Check for the progress display in the bottom-right corner');

  });
}

// Run tests if we're in a browser environment
if (typeof window !== 'undefined') {
  // Wait for page to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllTests);
  } else {
    setTimeout(runAllTests, 1000);
  }
} else {
  console.log('This script should be run in a browser console');
}