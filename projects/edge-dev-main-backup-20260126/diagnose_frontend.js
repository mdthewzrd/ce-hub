#!/usr/bin/env node

/**
 * Quick Frontend Diagnostic
 * Check what's causing the page to fail
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnosing Frontend Issues...\n');

// Check if component files exist and are valid
const components = [
  'src/components/generation/ScannerBuilder.tsx',
  'src/components/generation/GenerationResults.tsx',
  'src/components/validation/ValidationDashboard.tsx'
];

console.log('Checking component files...\n');

for (const component of components) {
  const componentPath = path.join(__dirname, component);

  if (fs.existsSync(componentPath)) {
    const content = fs.readFileSync(componentPath, 'utf-8');
    const size = content.length;

    console.log(`✅ ${component}`);
    console.log(`   Size: ${size} bytes`);
    console.log(`   Lines: ${content.split('\n').length}`);

    // Check for potential issues
    const issues = [];

    // Check for problematic imports
    const imports = content.match(/^import .+$/gm) || [];
    console.log(`   Imports: ${imports.length}`);

    // Check for client directive
    if (content.includes("'use client'")) {
      console.log(`   ✅ Has 'use client' directive`);
    } else {
      console.log(`   ⚠️  Missing 'use client' directive`);
      issues.push('Missing use client');
    }

    if (issues.length > 0) {
      console.log(`   Issues: ${issues.join(', ')}`);
    }
    console.log('');
  } else {
    console.log(`❌ ${component} - NOT FOUND\n`);
  }
}

// Check for missing dependencies
console.log('\nChecking package.json for dependencies...\n');

const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const dependencies = Object.keys(packageJson.dependencies || {});
  const devDependencies = Object.keys(packageJson.devDependencies || {});

  console.log(`Total dependencies: ${dependencies.length}`);
  console.log(`Total devDependencies: ${devDependencies.length}\n`);

  // Check for UI components dependencies
  const requiredDeps = ['lucide-react', 'react', 'react-dom', '@radix-ui/react-tabs'];
  const missingDeps = requiredDeps.filter(dep => !dependencies.includes(dep) && !devDependencies.includes(dep));

  if (missingDeps.length > 0) {
    console.log('⚠️  Potentially missing dependencies:');
    missingDeps.forEach(dep => console.log(`   - ${dep}`));
    console.log('');
  }
}

// Check scan page for import errors
console.log('Checking scan page imports...\n');

const scanPagePath = path.join(__dirname, 'src/app/scan/page.tsx');
if (fs.existsSync(scanPagePath)) {
  const content = fs.readFileSync(scanPagePath, 'utf-8');

  // Check if our imports are there
  const hasScannerBuilder = content.includes("from '@/components/generation/ScannerBuilder'");
  const hasValidationDashboard = content.includes("from '@/components/validation/ValidationDashboard'");

  console.log(`ScannerBuilder import: ${hasScannerBuilder ? '✅' : '❌'}`);
  console.log(`ValidationDashboard import: ${hasValidationDashboard ? '✅' : '❌'}`);

  if (hasScannerBuilder && hasValidationDashboard) {
    console.log('\n✅ Imports are correct in scan page');
    console.log('\n💡 The issue might be:');
    console.log('   1. Next.js needs to be restarted');
    console.log('   2. Component files have compilation errors');
    console.log('   3. Missing peer dependencies');
    console.log('\n🔧 Try this:');
    console.log('   1. Stop the Next.js server (Ctrl+C)');
    console.log('   2. Run: npm run dev');
    console.log('   3. Check terminal for errors');
    console.log('   4. Check browser console (F12) for errors');
  }
}

console.log('\n' + '='.repeat(60));
console.log('Next Steps:');
console.log('='.repeat(60));
console.log('1. Check browser console for specific error messages');
console.log('2. Check Next.js terminal output for build errors');
console.log('3. Look for red underlines in VS Code');
console.log('4. Try removing the imports temporarily to isolate issue');
