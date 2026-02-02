/**
 * QUICK VISUAL TEST
 *
 * A simplified version to quickly test the visual validation system
 * and make sure it can connect to the frontend and take screenshots.
 */

const { VisualFrontendValidator } = require('./visual_frontend_validation');

async function runQuickTest() {
  console.log('🚀 QUICK VISUAL TEST - Testing System Setup');

  const validator = new VisualFrontendValidator();

  try {
    // Initialize browser
    await validator.initialize();

    // Navigate to app
    await validator.navigateToApp();

    // Test one simple command
    console.log('\n🧪 Testing single command: "Go to dashboard"');
    await validator.sendRenataCommand(
      "Go to dashboard",
      [{ type: 'navigation', page: 'dashboard' }],
      'quick_test_dashboard'
    );

    // Generate report
    const report = await validator.generateReport();

    console.log('\n✅ Quick test completed!');
    console.log(`📁 Check ./screenshots/ folder for results`);
    console.log(`📋 Open ./screenshots/validation_report.html to see visual results`);

    return report;

  } catch (error) {
    console.error('💥 Quick test failed:', error.message);
    throw error;
  } finally {
    await validator.cleanup();
  }
}

runQuickTest()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));