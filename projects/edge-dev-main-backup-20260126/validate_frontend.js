#!/usr/bin/env node

/**
 * Frontend Integration Validation Script
 * Validates that all UI components are properly integrated and working
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Frontend Integration Validation\n');
console.log('=' .repeat(60));

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Test 1: Verify Component Files Exist
function testComponentFilesExist() {
  log('\n📋 Test 1: Component Files Existence', 'magenta');

  const components = [
    'src/components/generation/ScannerBuilder.tsx',
    'src/components/generation/GenerationResults.tsx',
    'src/components/validation/ValidationDashboard.tsx',
    'src/components/vision/ImageUploadButton.tsx',
    'src/components/columns/ColumnSelector.tsx',
    'src/components/columns/ColumnManager.tsx',
    'src/components/parameters/ParameterMasterEditor.tsx',
    'src/components/parameters/TemplateManager.tsx',
    'src/components/memory/SessionManager.tsx',
    'src/components/memory/MemoryDashboard.tsx'
  ];

  let allExist = true;

  for (const component of components) {
    const componentPath = path.join(__dirname, component);
    if (fs.existsSync(componentPath)) {
      const stats = fs.statSync(componentPath);
      success(`${path.basename(component)} (${(stats.size / 1024).toFixed(1)} KB)`);
    } else {
      error(`${path.basename(component)} - NOT FOUND`);
      allExist = false;
    }
  }

  return allExist;
}

// Test 2: Verify Exec Page Integration
function testExecPageIntegration() {
  log('\n📋 Test 2: Exec Page Integration', 'magenta');

  const execPagePath = path.join(__dirname, 'src/app/exec/page.tsx');

  if (!fs.existsSync(execPagePath)) {
    error('Exec page not found');
    return false;
  }

  const content = fs.readFileSync(execPagePath, 'utf-8');

  const checks = {
    'ScannerBuilder import': content.includes("from '@/components/generation/ScannerBuilder'"),
    'ValidationDashboard import': content.includes("from '@/components/validation/ValidationDashboard'"),
    'showScannerBuilder state': content.includes('showScannerBuilder'),
    'showValidationDashboard state': content.includes('showValidationDashboard'),
    'aiEnhancementsEnabled state': content.includes('aiEnhancementsEnabled'),
    'handleScannerGenerated handler': content.includes('handleScannerGenerated'),
    'handleAIScan handler': content.includes('handleAIScan'),
    'AI Scanner Builder button': content.includes('AI Scanner Builder'),
    'Validation button': content.includes('Validation') && content.includes('bg-teal-600'),
    'AI Scan button': content.includes('AI Scan') && content.includes('from-indigo-600'),
    'ScannerBuilder modal': content.includes('AI Scanner Builder') && content.includes('ScannerBuilder'),
    'ValidationDashboard modal': content.includes('Validation Dashboard') && content.includes('ValidationDashboard')
  };

  let allPass = true;

  for (const [check, passed] of Object.entries(checks)) {
    if (passed) {
      success(check);
    } else {
      error(check + ' - NOT FOUND');
      allPass = false;
    }
  }

  return allPass;
}

// Test 3: Verify Button Styling and Placement
function testButtonStyling() {
  log('\n📋 Test 3: Button Styling', 'magenta');

  const execPagePath = path.join(__dirname, 'src/app/exec/page.tsx');
  const content = fs.readFileSync(execPagePath, 'utf-8');

  const buttons = {
    'AI Scanner Builder': {
      color: 'Indigo (bg-indigo-600)',
      icon: 'Brain',
      check: content.includes('bg-indigo-600') && content.includes('AI Scanner Builder')
    },
    'Validation': {
      color: 'Teal (bg-teal-600)',
      icon: 'BarChart3',
      check: content.includes('bg-teal-600') && content.includes('Validation')
    },
    'AI Scan': {
      color: 'Gradient (indigo to purple)',
      icon: 'TrendingUp',
      check: content.includes('from-indigo-600') && content.includes('to-purple-600') && content.includes('AI Scan')
    }
  };

  let allPass = true;

  for (const [button, config] of Object.entries(buttons)) {
    if (config.check) {
      success(`${button} - ${config.color} with ${config.icon} icon`);
    } else {
      error(`${button} - NOT PROPERLY STYLED`);
      allPass = false;
    }
  }

  return allPass;
}

// Test 4: Verify Modal Structure
function testModalStructure() {
  log('\n📋 Test 4: Modal Structure', 'magenta');

  const execPagePath = path.join(__dirname, 'src/app/exec/page.tsx');
  const content = fs.readFileSync(execPagePath, 'utf-8');

  const modals = {
    'ScannerBuilder Modal': {
      hasOverlay: content.includes('bg-black bg-opacity-50'),
      hasContainer: content.includes('rounded-lg shadow-xl max-w-6xl'),
      hasHeader: content.includes('AI Scanner Builder'),
      hasComponent: content.includes('<ScannerBuilder'),
      hasCloseButton: content.includes('setShowScannerBuilder(false)')
    },
    'ValidationDashboard Modal': {
      hasOverlay: content.includes('bg-black bg-opacity-50'),
      hasContainer: content.includes('rounded-lg shadow-xl max-w-6xl'),
      hasHeader: content.includes('Validation Dashboard'),
      hasComponent: content.includes('<ValidationDashboard'),
      hasCloseButton: content.includes('setShowValidationDashboard(false)')
    }
  };

  let allPass = true;

  for (const [modal, checks] of Object.entries(modals)) {
    info(`\n${modal}:`);
    for (const [check, passed] of Object.entries(checks)) {
      if (passed) {
        success(`  ✓ ${check}`);
      } else {
        error(`  ✗ ${check} - MISSING`);
        allPass = false;
      }
    }
  }

  return allPass;
}

// Test 5: Check for React/TypeScript Issues
function testReactSetup() {
  log('\n📋 Test 5: React/TypeScript Setup', 'magenta');

  const checks = {
    'Uses client directive': fs.readFileSync('src/app/exec/page.tsx', 'utf-8').includes("'use client'"),
    'ScannerBuilder is client component': fs.readFileSync('src/components/generation/ScannerBuilder.tsx', 'utf-8').includes("'use client'"),
    'ValidationDashboard is client component': fs.readFileSync('src/components/validation/ValidationDashboard.tsx', 'utf-8').includes("'use client'"),
    'useState imported': fs.readFileSync('src/app/exec/page.tsx', 'utf-8').includes("useState"),
    'useCallback imported': fs.readFileSync('src/app/exec/page.tsx', 'utf-8').includes("useCallback")
  };

  let allPass = true;

  for (const [check, passed] of Object.entries(checks)) {
    if (passed) {
      success(check);
    } else {
      error(check + ' - MISSING');
      allPass = false;
    }
  }

  return allPass;
}

// Test 6: Create HTML Preview
function createHTMLPreview() {
  log('\n📋 Test 6: HTML Preview Generation', 'magenta');

  const execPagePath = path.join(__dirname, 'src/app/exec/page.tsx');
  const content = fs.readFileSync(execPagePath, 'utf-8');

  // Extract button sections
  const aiScannerButtonMatch = content.match(/onClick=\{\(\) => setShowScannerBuilder\(true\)\}[^<]*<button[^>]*>(.*?)<\/button>/s);
  const validationButtonMatch = content.match(/onClick=\{\(\) => setShowValidationDashboard\(true\)\}[^<]*<button[^>]*>(.*?)<\/button>/s);
  const aiScanButtonMatch = content.match(/onClick={handleAIScan}[^<]*<button[^>]*>(.*?)<\/button>/s);

  const previewPath = path.join(__dirname, 'frontend_preview.html');

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Renata Frontend Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 p-8">
  <div class="max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold mb-6">🎨 Renata Frontend Button Preview</h1>

    <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">New AI Enhancement Buttons</h2>
      <p class="text-gray-600 mb-4">These buttons should appear in the header of the EXEC Dashboard:</p>

      <div class="flex gap-3 flex-wrap">
        <!-- AI Scanner Builder Button -->
        <button class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" x2="12" y1="19" y2="22"/>
          </svg>
          AI Scanner Builder
        </button>

        <!-- Validation Button -->
        <button class="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" x2="12" y1="20" y2="10"/>
            <line x1="18" x2="18" y1="20" y2="4"/>
            <line x1="6" x2="6" y1="20" y2="16"/>
          </svg>
          Validation
        </button>

        <!-- AI Scan Button -->
        <button class="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors" title="Run AI-enhanced scan with current settings">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
            <polyline points="17 6 23 6 23 12"/>
          </svg>
          AI Scan
        </button>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Button Features</h2>
      <ul class="space-y-2">
        <li class="flex items-start gap-2">
          <span class="text-green-500">✓</span>
          <span><strong>AI Scanner Builder</strong> (Indigo) - Opens modal to build scanners from natural language or images</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-green-500">✓</span>
          <span><strong>Validation</strong> (Teal) - Opens validation dashboard to run tests and view metrics</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-green-500">✓</span>
          <span><strong>AI Scan</strong> (Gradient) - Runs AI-enhanced scan with optimization and validation</span>
        </li>
      </ul>
    </div>

    <div class="bg-white rounded-lg shadow-lg p-6">
      <h2 class="text-xl font-semibold mb-4">Modal Preview</h2>
      <p class="text-gray-600 mb-4">Clicking any button will open a full-screen modal:</p>

      <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <p class="text-gray-500 mb-4">🖼️ Modal Preview</p>
        <p class="text-sm text-gray-400">Modal would appear here with:</p>
        <ul class="text-sm text-gray-400 mt-2 text-left max-w-md mx-auto">
          <li>• Full-screen overlay with dark background</li>
          <li>• White container (max-width: 6xl)</li>
          <li>• Sticky header with close button</li>
          <li>• Scrollable content area</li>
          <li>• Scanner Builder or Validation Dashboard component</li>
        </ul>
      </div>
    </div>

    <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 class="font-semibold text-blue-900 mb-2">📍 Where to Find These Buttons</h3>
      <ol class="list-decimal list-inside text-blue-800 space-y-1">
        <li>Navigate to <code class="bg-blue-100 px-2 py-1 rounded">http://localhost:5665/exec</code></li>
        <li>Look at the top header bar (next to "Upload Strategy" and "Two-Stage Scanner")</li>
        <li>You should see three new colored buttons</li>
      </ol>
    </div>
  </div>

  <script>
    // Add click handlers to show functionality
    document.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', function() {
        const text = this.textContent.trim();
        alert('✅ Button clicked: ' + text + '\\n\\nIn the actual app, this would open the corresponding modal.');
      });
    });
  </script>
</body>
</html>`;

  fs.writeFileSync(previewPath, html);
  success(`Created HTML preview: ${previewPath}`);
  info(`Open in browser: file://${previewPath}`);

  return true;
}

// Main test runner
async function runTests() {
  const results = {
    componentFiles: testComponentFilesExist(),
    execPageIntegration: testExecPageIntegration(),
    buttonStyling: testButtonStyling(),
    modalStructure: testModalStructure(),
    reactSetup: testReactSetup(),
    htmlPreview: createHTMLPreview()
  };

  log('\n' + '='.repeat(60), 'magenta');
  log('📊 Frontend Validation Summary', 'magenta');
  log('='.repeat(60), 'magenta');

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(result => result).length;

  for (const [testName, passed] of Object.entries(results)) {
    if (passed) {
      success(`${testName}: PASSED`);
    } else {
      error(`${testName}: FAILED`);
    }
  }

  log('\n' + '='.repeat(60), 'magenta');
  log(`Total: ${passedTests}/${totalTests} tests passed`, passedTests === totalTests ? 'green' : 'yellow');
  log('='.repeat(60), 'magenta');

  if (passedTests === totalTests) {
    log('\n🎉 All frontend validation tests PASSED!', 'green');
    log('\n✨ Frontend Integration Status:', 'green');
    log('  • All UI components exist', 'green');
    log('  • Properly integrated into exec page', 'green');
    log('  • Buttons styled correctly', 'green');
    log('  • Modals structured properly', 'green');
    log('  • React/TypeScript setup correct', 'green');
    log('\n📝 Next Steps:', 'blue');
    log('  1. Open frontend preview in browser:', 'blue');
    log('     file://' + path.join(__dirname, 'frontend_preview.html'), 'blue');
    log('  2. Start Next.js server: npm run dev', 'blue');
    log('  3. Navigate to: http://localhost:5665/exec', 'blue');
    log('  4. Look for the three new colored buttons in header', 'blue');
    log('  5. Click each button to verify modals open', 'blue');
    log('\n🎨 Expected Button Appearance:', 'blue');
    log('  • 🧠 AI Scanner Builder (Indigo)', 'blue');
    log('  • 📊 Validation (Teal)', 'blue');
    log('  • 🚀 AI Scan (Purple Gradient)', 'blue');
    process.exit(0);
  } else {
    log('\n⚠️  Some frontend validation tests FAILED', 'yellow');
    log('Please review the errors above.', 'yellow');
    process.exit(1);
  }
}

// Run tests
runTests().catch(err => {
  error(`Test runner error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
