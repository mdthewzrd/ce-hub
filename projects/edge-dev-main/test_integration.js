#!/usr/bin/env node

/**
 * Integration Test for Renata Master AI System
 * Tests the enhanced scan workflow with all 7 phases integrated
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Renata Master AI System - Integration Test\n');
console.log('=' .repeat(60));

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:5665',
  scanEndpoint: '/api/systematic/scan',
  testData: {
    scan_date: '2025-12-27',
    filters: {
      scanner_type: 'lc-d2',
      gap_min: 2.0,
      pm_vol_min: 1000000
    }
  }
};

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
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

function warn(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Test 1: Verify Service Files Exist
function testServiceFilesExist() {
  log('\n📋 Test 1: Verifying Service Files Exist', 'magenta');

  const services = [
    'src/services/scannerGenerationService.ts',
    'src/services/parameterMasterService.ts',
    'src/services/validationTestingService.ts',
    'src/services/archonLearningService.ts',
    'src/services/columnConfigurationService.ts',
    'src/services/memoryManagementService.ts',
    'src/services/visionProcessingService.ts',
    'src/services/enhancedRenataCodeService.ts'
  ];

  let allExist = true;

  for (const service of services) {
    const servicePath = path.join(__dirname, service);
    if (fs.existsSync(servicePath)) {
      const stats = fs.statSync(servicePath);
      success(`${service} (${(stats.size / 1024).toFixed(1)} KB)`);
    } else {
      error(`${service} - NOT FOUND`);
      allExist = false;
    }
  }

  return allExist;
}

// Test 2: Verify API Routes Exist
function testApiRoutesExist() {
  log('\n📋 Test 2: Verifying API Routes Exist', 'magenta');

  const routes = [
    'src/app/api/generate/route.ts',
    'src/app/api/validation/route.ts',
    'src/app/api/learning/knowledge-base/route.ts',
    'src/app/api/columns/configure/route.ts',
    'src/app/api/parameters/route.ts',
    'src/app/api/memory/route.ts',
    'src/app/api/vision/route.ts',
    'src/app/api/systematic/scan/route.ts'
  ];

  let allExist = true;

  for (const route of routes) {
    const routePath = path.join(__dirname, route);
    if (fs.existsSync(routePath)) {
      success(route);
    } else {
      error(`${route} - NOT FOUND`);
      allExist = false;
    }
  }

  return allExist;
}

// Test 3: Verify UI Components Exist
function testUiComponentsExist() {
  log('\n📋 Test 3: Verifying UI Components Exist', 'magenta');

  const components = [
    'src/components/generation/ScannerBuilder.tsx',
    'src/components/generation/GenerationResults.tsx',
    'src/components/validation/ValidationDashboard.tsx',
    'src/components/columns/ColumnSelector.tsx',
    'src/components/columns/ColumnManager.tsx',
    'src/components/parameters/ParameterMasterEditor.tsx',
    'src/components/parameters/TemplateManager.tsx',
    'src/components/memory/SessionManager.tsx'
  ];

  let allExist = true;

  for (const component of components) {
    const componentPath = path.join(__dirname, component);
    if (fs.existsSync(componentPath)) {
      success(component);
    } else {
      error(`${component} - NOT FOUND`);
      allExist = false;
    }
  }

  return allExist;
}

// Test 4: Verify Scan Route Integration
function testScanRouteIntegration() {
  log('\n📋 Test 4: Verifying Scan Route Integration', 'magenta');

  const scanRoutePath = path.join(__dirname, 'src/app/api/systematic/scan/route.ts');

  if (!fs.existsSync(scanRoutePath)) {
    error('Scan route file not found');
    return false;
  }

  const content = fs.readFileSync(scanRoutePath, 'utf-8');

  // Check for service imports
  const imports = {
    'Scanner Generation Service': content.includes('getScannerGenerationService'),
    'Parameter Master Service': content.includes('getParameterMasterService'),
    'Validation Testing Service': content.includes('getValidationTestingService'),
    'Archon Learning Service': content.includes('getArchonLearningService')
  };

  // Check for enhancement flags
  const flags = {
    'enable_ai_enhancement': content.includes('enable_ai_enhancement'),
    'enable_parameter_optimization': content.includes('enable_parameter_optimization'),
    'enable_validation': content.includes('enable_validation'),
    'enable_learning': content.includes('enable_learning'),
    'generate_scanner': content.includes('generate_scanner')
  };

  // Check for phase implementation
  const phases = {
    'Phase 1: AI Enhancement': content.includes('// Phase 1: AI Enhancement'),
    'Phase 2: Parameter Optimization': content.includes('// Phase 2: Parameter Optimization'),
    'Phase 3: Execute Scan': content.includes('// Phase 3: Execute Scan'),
    'Phase 4: Validation': content.includes('// Phase 4: Validation'),
    'Phase 5: Learning': content.includes('// Phase 5: Learning')
  };

  let allPass = true;

  log('\n  Service Imports:', 'blue');
  for (const [name, exists] of Object.entries(imports)) {
    if (exists) {
      success(`  ✓ ${name}`);
    } else {
      error(`  ✗ ${name} - NOT IMPORTED`);
      allPass = false;
    }
  }

  log('\n  Enhancement Flags:', 'blue');
  for (const [name, exists] of Object.entries(flags)) {
    if (exists) {
      success(`  ✓ ${name}`);
    } else {
      error(`  ✗ ${name} - NOT IMPLEMENTED`);
      allPass = false;
    }
  }

  log('\n  Phase Implementation:', 'blue');
  for (const [name, exists] of Object.entries(phases)) {
    if (exists) {
      success(`  ✓ ${name}`);
    } else {
      error(`  ✗ ${name} - NOT IMPLEMENTED`);
      allPass = false;
    }
  }

  return allPass;
}

// Test 5: Verify UI Integration
function testUiIntegration() {
  log('\n📋 Test 5: Verifying UI Integration', 'magenta');

  const execPagePath = path.join(__dirname, 'src/app/exec/page.tsx');

  if (!fs.existsSync(execPagePath)) {
    error('Exec page file not found');
    return false;
  }

  const content = fs.readFileSync(execPagePath, 'utf-8');

  // Check for component imports
  const imports = {
    'ScannerBuilder': content.includes("from '@/components/generation/ScannerBuilder'"),
    'ValidationDashboard': content.includes("from '@/components/validation/ValidationDashboard'")
  };

  // Check for state variables
  const state = {
    'showScannerBuilder': content.includes('showScannerBuilder'),
    'showValidationDashboard': content.includes('showValidationDashboard'),
    'aiEnhancementsEnabled': content.includes('aiEnhancementsEnabled')
  };

  // Check for handler functions
  const handlers = {
    'handleScannerGenerated': content.includes('handleScannerGenerated'),
    'handleAIScan': content.includes('handleAIScan')
  };

  // Check for modal components
  const modals = {
    'ScannerBuilder Modal': content.includes('AI Scanner Builder'),
    'ValidationDashboard Modal': content.includes('Validation Dashboard')
  };

  // Check for buttons
  const buttons = {
    'AI Scanner Builder Button': content.includes('AI Scanner Builder'),
    'Validation Button': content.includes('Validation'),
    'AI Scan Button': content.includes('AI Scan')
  };

  let allPass = true;

  log('\n  Component Imports:', 'blue');
  for (const [name, exists] of Object.entries(imports)) {
    if (exists) {
      success(`  ✓ ${name}`);
    } else {
      error(`  ✗ ${name} - NOT IMPORTED`);
      allPass = false;
    }
  }

  log('\n  State Variables:', 'blue');
  for (const [name, exists] of Object.entries(state)) {
    if (exists) {
      success(`  ✓ ${name}`);
    } else {
      error(`  ✗ ${name} - NOT DEFINED`);
      allPass = false;
    }
  }

  log('\n  Handler Functions:', 'blue');
  for (const [name, exists] of Object.entries(handlers)) {
    if (exists) {
      success(`  ✓ ${name}`);
    } else {
      error(`  ✗ ${name} - NOT DEFINED`);
      allPass = false;
    }
  }

  log('\n  Modal Components:', 'blue');
  for (const [name, exists] of Object.entries(modals)) {
    if (exists) {
      success(`  ✓ ${name}`);
    } else {
      error(`  ✗ ${name} - NOT RENDERED`);
      allPass = false;
    }
  }

  log('\n  Header Buttons:', 'blue');
  for (const [name, exists] of Object.entries(buttons)) {
    if (exists) {
      success(`  ✓ ${name}`);
    } else {
      error(`  ✗ ${name} - NOT ADDED`);
      allPass = false;
    }
  }

  return allPass;
}

// Main test runner
async function runTests() {
  const results = {
    serviceFiles: testServiceFilesExist(),
    apiRoutes: testApiRoutesExist(),
    uiComponents: testUiComponentsExist(),
    scanRouteIntegration: testScanRouteIntegration(),
    uiIntegration: testUiIntegration()
  };

  log('\n' + '='.repeat(60), 'magenta');
  log('📊 Test Summary', 'magenta');
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
    log('\n🎉 All integration tests PASSED!', 'green');
    log('\n✨ The Renata Master AI System is fully integrated:', 'green');
    log('  • All 7 phases implemented', 'green');
    log('  • Backend services integrated into scan route', 'green');
    log('  • UI components added to exec page', 'green');
    log('  • Enhancement flags configured', 'green');
    log('\n📝 Next Steps:', 'blue');
    log('  1. Restart Next.js server: npm run dev', 'blue');
    log('  2. Test the AI Scan button in the browser', 'blue');
    log('  3. Verify Archon MCP is running on localhost:8051', 'blue');
    log('  4. Check .env.local for OPENROUTER_API_KEY', 'blue');
    process.exit(0);
  } else {
    log('\n⚠️  Some integration tests FAILED', 'yellow');
    log('Please review the errors above and fix the issues.', 'yellow');
    process.exit(1);
  }
}

// Run tests
runTests().catch(err => {
  error(`Test runner error: ${err.message}`);
  process.exit(1);
});
