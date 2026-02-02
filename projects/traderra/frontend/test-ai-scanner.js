#!/usr/bin/env node

/**
 * AI Trading Scanner Test Script
 * Validates the complete AGUI implementation
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('🤖 AI Trading Scanner Implementation Test');
console.log('=' .repeat(50));

// Test configuration
const tests = {
  fileStructure: [
    'src/app/scanner/page.tsx',
    'src/components/ai/AGUITradingDashboard.tsx',
    'src/components/ai/AIEnhancedScanFilters.tsx',
    'src/components/ai/AIEnhancedChart.tsx',
    'src/components/ai/AICommentaryPanel.tsx',
    'src/services/fastApiScanService.ts',
    'src/services/aiWebSocketService.ts',
    'src/scripts/validate-agui-integration.ts',
    'AI_TRADING_SCANNER_README.md'
  ],
  dependencies: [
    '@copilotkit/react-core',
    '@copilotkit/react-ui',
    '@copilotkit/react-textarea',
    '@copilotkit/runtime'
  ],
  cssClasses: [
    'studio-gold',
    'studio-card',
    'studio-metric-card',
    'studio-input',
    'studio-table',
    'ai-pulse'
  ]
};

let passedTests = 0;
let totalTests = 0;

function runTest(name, testFn) {
  totalTests++;
  try {
    const result = testFn();
    if (result) {
      console.log(`✅ ${name}`);
      passedTests++;
    } else {
      console.log(`❌ ${name}`);
    }
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
  }
}

// Test 1: File Structure
runTest('File Structure', () => {
  const missing = [];
  tests.fileStructure.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) {
      missing.push(file);
    }
  });

  if (missing.length > 0) {
    console.log(`   Missing files: ${missing.join(', ')}`);
    return false;
  }
  return true;
});

// Test 2: Package.json Dependencies
runTest('CopilotKit Dependencies', () => {
  const packagePath = path.join(__dirname, 'package.json');
  if (!fs.existsSync(packagePath)) {
    console.log('   package.json not found');
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

  const missing = [];
  tests.dependencies.forEach(dep => {
    if (!dependencies[dep]) {
      missing.push(dep);
    }
  });

  if (missing.length > 0) {
    console.log(`   Missing dependencies: ${missing.join(', ')}`);
    return false;
  }
  return true;
});

// Test 3: CSS Classes
runTest('Traderra CSS Classes', () => {
  const cssPath = path.join(__dirname, 'src/styles/globals.css');
  if (!fs.existsSync(cssPath)) {
    console.log('   globals.css not found');
    return false;
  }

  const cssContent = fs.readFileSync(cssPath, 'utf8');

  const missing = [];
  tests.cssClasses.forEach(className => {
    if (!cssContent.includes(className)) {
      missing.push(className);
    }
  });

  if (missing.length > 0) {
    console.log(`   Missing CSS classes: ${missing.join(', ')}`);
    return false;
  }
  return true;
});

// Test 4: Component Exports
runTest('AI Component Exports', () => {
  const components = [
    'src/components/ai/AGUITradingDashboard.tsx',
    'src/components/ai/AIEnhancedScanFilters.tsx',
    'src/components/ai/AIEnhancedChart.tsx',
    'src/components/ai/AICommentaryPanel.tsx'
  ];

  let allValid = true;
  components.forEach(componentPath => {
    const fullPath = path.join(__dirname, componentPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (!content.includes('export') || !content.includes('useCopilotAction') && !content.includes('useCopilotReadable')) {
        console.log(`   ${componentPath}: Missing proper exports or CopilotKit hooks`);
        allValid = false;
      }
    }
  });

  return allValid;
});

// Test 5: Service Integrations
runTest('Service Integrations', () => {
  const services = [
    'src/services/fastApiScanService.ts',
    'src/services/aiWebSocketService.ts'
  ];

  let allValid = true;
  services.forEach(servicePath => {
    const fullPath = path.join(__dirname, servicePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (!content.includes('export') || !content.includes('class') && !content.includes('function')) {
        console.log(`   ${servicePath}: Missing proper exports`);
        allValid = false;
      }
    }
  });

  return allValid;
});

// Test 6: TypeScript Configuration
runTest('TypeScript Types', () => {
  const tsFiles = [
    'src/services/fastApiScanService.ts',
    'src/services/aiWebSocketService.ts'
  ];

  let allValid = true;
  tsFiles.forEach(filePath => {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (!content.includes('interface') && !content.includes('type')) {
        console.log(`   ${filePath}: Missing TypeScript interfaces/types`);
        allValid = false;
      }
    }
  });

  return allValid;
});

// Test 7: FastAPI Integration Check
runTest('FastAPI Integration Setup', () => {
  const scannerPage = path.join(__dirname, 'src/app/scanner/page.tsx');
  if (!fs.existsSync(scannerPage)) {
    console.log('   Scanner page not found');
    return false;
  }

  const content = fs.readFileSync(scannerPage, 'utf8');
  return content.includes('fastApiScanService') && content.includes('WebSocket');
});

// Summary
console.log('\n📊 Test Summary:');
console.log('=' .repeat(30));
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${totalTests - passedTests}`);
console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log('\n🎉 All tests passed! AI Trading Scanner is ready for deployment.');
  console.log('\n🚀 Next Steps:');
  console.log('1. Start the FastAPI backend: cd backend && python -m uvicorn main:app --reload --port 8000');
  console.log('2. Start the frontend: npm run dev');
  console.log('3. Navigate to http://localhost:3000/scanner');
  console.log('4. Test AI features with natural language queries');
} else {
  console.log('\n⚠️  Some tests failed. Please review the issues above before deployment.');
}

console.log('\n📋 Manual Testing Checklist:');
console.log('- [ ] FastAPI backend responds on port 8000');
console.log('- [ ] Scanner page loads without errors');
console.log('- [ ] Natural language queries work');
console.log('- [ ] Real-time AI commentary functions');
console.log('- [ ] Chart pattern recognition activates');
console.log('- [ ] WebSocket connections establish');
console.log('- [ ] Traderra branding displays correctly');

process.exit(passedTests === totalTests ? 0 : 1);