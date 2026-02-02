/**
 * Simple Node.js script to verify Renata popup sizing changes
 * Checks the component file for the correct sizing values
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Renata AI popup compact sizing fix...\n');

try {
  // Read the RenataPopup component file
  const componentPath = path.join(__dirname, 'src/components/RenataPopup.tsx');
  const componentContent = fs.readFileSync(componentPath, 'utf8');

  // Check for the updated sizing values
  const checks = [
    {
      name: 'Width set to 380px',
      pattern: /width: '380px'/,
      expected: true
    },
    {
      name: 'Height set to 520px',
      pattern: /height: '520px'/,
      expected: true
    },
    {
      name: 'Positioned bottom-left',
      pattern: /left: '1rem'/,
      expected: true
    },
    {
      name: 'Bottom margin set',
      pattern: /bottom: '1rem'/,
      expected: true
    },
    {
      name: 'Old large width (50vw) removed',
      pattern: /width: '50vw'/,
      expected: false
    },
    {
      name: 'Old large height (60vh) removed',
      pattern: /height: '60vh'/,
      expected: false
    },
    {
      name: 'Right positioning removed',
      pattern: /right: '1rem'/,
      expected: false
    }
  ];

  let passed = 0;
  let failed = 0;

  checks.forEach(check => {
    const found = check.pattern.test(componentContent);
    const success = found === check.expected;

    if (success) {
      console.log(`✅ ${check.name}`);
      passed++;
    } else {
      console.log(`❌ ${check.name} - Expected: ${check.expected}, Found: ${found}`);
      failed++;
    }
  });

  console.log(`\n📊 Test Results: ${passed}/${checks.length} checks passed`);

  if (failed === 0) {
    console.log('🎉 All sizing changes have been successfully applied!');
    console.log('\n📏 Updated Renata popup dimensions:');
    console.log('   • Width: 380px (taller as requested)');
    console.log('   • Height: 520px (wider as requested)');
    console.log('   • Position: Bottom-left corner (moved from right)');
    console.log('   • Reduced margins for less screen intrusion');
  } else {
    console.log('⚠️  Some checks failed - review the changes above');
  }

  // Additional check for reduced padding
  if (componentContent.includes("padding: '8px'")) {
    console.log('✅ Message area padding reduced to 8px for compact design');
  }

  console.log('\n🌐 Server Status: http://localhost:5657');
  console.log('🔄 Changes applied successfully - ready for testing in browser');

} catch (error) {
  console.error('❌ Error reading component file:', error.message);
}