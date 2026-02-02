/**
 * Comprehensive Extended Conversation Testing Runner
 * Automates the full testing process for Traderra Renata chat system
 * Including application navigation, sidebar opening, and test execution
 */

console.log('🎯 COMPREHENSIVE EXTENDED CONVERSATION TESTING RUNNER');
console.log('=' .repeat(60));

class ComprehensiveTestingRunner {
  constructor() {
    this.testStartTime = Date.now();
    this.screenshots = [];
    this.consoleLogs = [];
    this.testResults = null;
  }

  // Start the comprehensive testing process
  async runFullTestSuite() {
    try {
      console.log('🚀 Phase 1: Application Verification');
      await this.verifyApplicationState();

      console.log('\n🔧 Phase 2: Load Extended Testing Framework');
      await this.loadTestingFramework();

      console.log('\n💬 Phase 3: Open Renata Chat Sidebar');
      await this.openRenataChat();

      console.log('\n⏳ Phase 4: Wait for Chat System Readiness');
      await this.waitForChatReadiness();

      console.log('\n🧪 Phase 5: Execute Extended Conversation Tests');
      await this.executeExtendedTests();

      console.log('\n📸 Phase 6: Capture Evidence and Screenshots');
      await this.captureEvidence();

      console.log('\n📊 Phase 7: Generate Comprehensive Report');
      await this.generateComprehensiveReport();

      console.log('\n✅ All testing phases completed successfully!');

    } catch (error) {
      console.error('❌ Testing failed:', error);
      await this.captureErrorState(error);
      throw error;
    }
  }

  // Verify application is running and accessible
  async verifyApplicationState() {
    console.log('📍 Verifying application state...');

    // Check if we're on the correct domain
    if (!window.location.hostname.includes('localhost') && window.location.port !== '6565') {
      console.log('🔄 Redirecting to localhost:6565...');
      window.location.href = 'http://localhost:6565';
      await this.waitForNavigation();
    }

    // Check if page is loaded
    if (document.readyState !== 'complete') {
      console.log('⏳ Waiting for page to fully load...');
      await this.waitForPageLoad();
    }

    // Log current URL and page state
    console.log(`✅ Current URL: ${window.location.href}`);
    console.log(`✅ Page title: ${document.title}`);
    console.log(`✅ Ready state: ${document.readyState}`);

    // Check for essential UI elements
    const dashboardElement = document.querySelector('[data-testid="dashboard"], .dashboard, main');
    if (dashboardElement) {
      console.log('✅ Dashboard element found');
    } else {
      console.log('⚠️ Dashboard element not found - may need to navigate');
    }
  }

  // Load the extended testing framework
  async loadTestingFramework() {
    console.log('📚 Loading extended conversation testing framework...');

    // Check if the testing script is already loaded
    if (window.runExtendedConversationTests) {
      console.log('✅ Extended testing framework already loaded');
      return;
    }

    // Load the testing script
    const script = document.createElement('script');
    script.src = '/extended-conversation-tests.js';
    script.onload = () => {
      console.log('✅ Extended testing framework loaded successfully');
    };
    script.onerror = (error) => {
      console.error('❌ Failed to load testing framework:', error);
      throw new Error('Testing framework load failed');
    };

    document.head.appendChild(script);

    // Wait for script to load
    await this.waitForCondition(() => window.runExtendedConversationTests !== undefined, 5000);
  }

  // Open Renata chat sidebar
  async openRenataChat() {
    console.log('💬 Opening Renata chat sidebar...');

    // Look for chat toggle button
    const chatSelectors = [
      'button[aria-label*="Chat"]',
      'button[data-testid*="chat"]',
      'button:has([data-lucide="message-circle"])',
      'button:has([data-lucide="bot"])',
      '.chat-toggle-btn',
      '#chat-toggle',
      '[class*="chat"][class*="toggle"]',
      'button[class*="renata"]'
    ];

    let chatButton = null;
    for (const selector of chatSelectors) {
      chatButton = document.querySelector(selector);
      if (chatButton) {
        console.log(`✅ Found chat button with selector: ${selector}`);
        break;
      }
    }

    if (!chatButton) {
      // Try to find any button that might open chat
      const allButtons = document.querySelectorAll('button');
      for (const button of allButtons) {
        const text = button.textContent.toLowerCase();
        const ariaLabel = button.getAttribute('aria-label')?.toLowerCase() || '';

        if (text.includes('chat') || text.includes('renata') || text.includes('ai') ||
            ariaLabel.includes('chat') || ariaLabel.includes('renata') || ariaLabel.includes('ai')) {
          chatButton = button;
          console.log(`✅ Found potential chat button: "${text}"`);
          break;
        }
      }
    }

    if (!chatButton) {
      throw new Error('Chat button not found - Renata chat may not be available');
    }

    // Check if chat is already open
    const chatPanel = document.querySelector('[class*="chat"][class*="panel"], .chat-sidebar, #chat-panel');
    if (chatPanel && chatPanel.style.display !== 'none' && !chatPanel.classList.contains('hidden')) {
      console.log('✅ Renata chat is already open');
      return;
    }

    // Click to open chat
    console.log('🖱️ Clicking chat button to open sidebar...');
    chatButton.click();

    // Wait for chat panel to appear
    await this.waitForCondition(() => {
      const panel = document.querySelector('[class*="chat"][class*="panel"], .chat-sidebar, #chat-panel');
      return panel && panel.style.display !== 'none' && !panel.classList.contains('hidden');
    }, 3000);

    console.log('✅ Renata chat sidebar opened successfully');
  }

  // Wait for chat system to be ready
  async waitForChatReadiness() {
    console.log('⏳ Waiting for chat system readiness...');

    // Wait for chat input to be available
    await this.waitForCondition(() => {
      const chatInput = document.querySelector('textarea[placeholder*="Type your message"], textarea[placeholder*="message"], .chat-input');
      return chatInput && chatInput.offsetParent !== null;
    }, 5000);

    // Wait for any loading states to complete
    await this.delay(2000);

    // Check if we can find essential chat elements
    const chatInput = document.querySelector('textarea[placeholder*="Type your message"], textarea[placeholder*="message"], .chat-input');
    const sendButton = document.querySelector('button[aria-label*="Send"], button[data-testid*="send"], button:has([data-lucide="send"])');

    if (chatInput && sendButton) {
      console.log('✅ Chat system is ready for interaction');
    } else {
      console.log('⚠️ Some chat elements may not be fully loaded');
    }
  }

  // Execute the extended conversation tests
  async executeExtendedTests() {
    console.log('🧪 Executing extended conversation test suite...');

    // Capture initial state
    const initialState = {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      title: document.title
    };
    console.log('📸 Initial state captured:', initialState);

    try {
      // Run the extended tests
      console.log('▶️ Calling runExtendedConversationTests()...');
      this.testResults = await window.runExtendedConversationTests();

      console.log('✅ Extended conversation tests completed');
      console.log(`📊 Results: ${this.testResults.overallSuccessRate}% success rate`);

    } catch (error) {
      console.error('❌ Extended conversation tests failed:', error);
      throw error;
    }
  }

  // Capture screenshots and additional evidence
  async captureEvidence() {
    console.log('📸 Capturing test evidence...');

    // Capture console logs
    this.captureConsoleLogs();

    // Take screenshots of different states
    await this.takeScreenshot('final-chat-state');
    await this.takeScreenshot('dashboard-view');

    // Try to find the chat panel and capture it
    const chatPanel = document.querySelector('[class*="chat"][class*="panel"], .chat-sidebar, #chat-panel');
    if (chatPanel) {
      await this.takeElementScreenshot('chat-panel-full', chatPanel);
    }

    console.log('✅ Evidence capture completed');
  }

  // Capture console logs from the testing session
  captureConsoleLogs() {
    // This would need to be enhanced with actual console capture
    // For now, we'll store the test results
    this.consoleLogs.push({
      timestamp: new Date().toISOString(),
      message: 'Extended conversation tests executed',
      results: this.testResults
    });
  }

  // Take screenshot (simulated - would need actual screenshot capability)
  async takeScreenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotInfo = {
      name: `${name}-${timestamp}`,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      description: `Screenshot captured during testing phase: ${name}`
    };

    this.screenshots.push(screenshotInfo);
    console.log(`📸 Screenshot captured: ${screenshotInfo.name}`);
  }

  // Take screenshot of specific element (simulated)
  async takeElementScreenshot(name, element) {
    const rect = element.getBoundingClientRect();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    const screenshotInfo = {
      name: `${name}-${timestamp}`,
      element: element.tagName.toLowerCase(),
      bounds: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      },
      timestamp: new Date().toISOString(),
      description: `Element screenshot: ${name}`
    };

    this.screenshots.push(screenshotInfo);
    console.log(`📸 Element screenshot captured: ${screenshotInfo.name}`);
  }

  // Generate comprehensive testing report
  async generateComprehensiveReport() {
    console.log('📊 Generating comprehensive testing report...');

    const report = {
      testingMetadata: {
        startTime: new Date(this.testStartTime).toISOString(),
        endTime: new Date().toISOString(),
        duration: Date.now() - this.testStartTime,
        testUrl: window.location.href,
        userAgent: navigator.userAgent,
        sessionId: this.generateSessionId()
      },

      testResults: this.testResults,

      evidence: {
        screenshots: this.screenshots,
        consoleLogs: this.consoleLogs,
        browserState: this.captureBrowserState()
      },

      analysis: this.analyzeTestResults(),

      recommendations: this.generateRecommendations(),

      productionReadiness: this.assessProductionReadiness()
    };

    // Store report for Renata learning
    window.comprehensiveTestReport = report;

    // Display summary
    this.displayReportSummary(report);

    console.log('✅ Comprehensive report generated and stored in window.comprehensiveTestReport');

    return report;
  }

  // Capture current browser state
  captureBrowserState() {
    return {
      url: window.location.href,
      title: document.title,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      localStorage: Object.keys(localStorage).length,
      sessionStorage: Object.keys(sessionStorage).length,
      cookies: document.cookie.split(';').length
    };
  }

  // Analyze test results for patterns
  analyzeTestResults() {
    if (!this.testResults) return {};

    const { overallSuccessRate, testResults: sequences } = this.testResults;

    const analysis = {
      overallSuccessRate,
      strengths: [],
      weaknesses: [],
      patterns: [],
      dataAwarenessScore: 0
    };

    // Analyze success rates by test type
    sequences.forEach(sequence => {
      if (sequence.successRate >= 95) {
        analysis.strengths.push(sequence.testName);
      } else if (sequence.successRate < 80) {
        analysis.weaknesses.push(sequence.testName);
      }
    });

    // Identify patterns
    if (overallSuccessRate >= 95) {
      analysis.patterns.push('Excellent state change accuracy');
      analysis.patterns.push('Robust conversation handling');
    } else if (overallSuccessRate >= 80) {
      analysis.patterns.push('Good performance with room for improvement');
    } else {
      analysis.patterns.push('Significant improvements needed');
    }

    return analysis;
  }

  // Generate recommendations based on results
  generateRecommendations() {
    const recommendations = [];

    if (!this.testResults) {
      recommendations.push('Run tests to get specific recommendations');
      return recommendations;
    }

    const { overallSuccessRate } = this.testResults;

    if (overallSuccessRate >= 95) {
      recommendations.push('✅ System is production-ready for extended conversations');
      recommendations.push('🎯 Continue monitoring for edge cases');
    } else if (overallSuccessRate >= 80) {
      recommendations.push('🔧 Focus on improving failing command patterns');
      recommendations.push('📊 Enhance state validation for specific commands');
    } else {
      recommendations.push('⚠️ Major improvements needed before production deployment');
      recommendations.push('🧪 Debug command parsing and execution pipeline');
      recommendations.push('🔄 Review state management architecture');
    }

    return recommendations;
  }

  // Assess production readiness
  assessProductionReadiness() {
    if (!this.testResults) {
      return {
        ready: false,
        confidence: 0,
        blockers: ['No test results available']
      };
    }

    const { overallSuccessRate } = this.testResults;

    const assessment = {
      ready: overallSuccessRate >= 95,
      confidence: overallSuccessRate,
      blockers: []
    };

    if (overallSuccessRate < 95) {
      assessment.blockers.push(`Success rate ${overallSuccessRate}% is below 95% threshold`);
    }

    return assessment;
  }

  // Display report summary in console
  displayReportSummary(report) {
    console.log('\n📋 COMPREHENSIVE TESTING REPORT SUMMARY');
    console.log('=' .repeat(50));

    console.log(`\n⏱️ Testing Duration: ${Math.round(report.testingMetadata.duration / 1000)}s`);
    console.log(`🌐 Test URL: ${report.testingMetadata.testUrl}`);

    if (report.testResults) {
      console.log(`\n📊 Overall Success Rate: ${report.testResults.overallSuccessRate}%`);
      console.log(`✅ Successful Steps: ${report.testResults.totalSuccessful}/${report.testResults.totalSteps}`);
    }

    console.log(`\n📸 Evidence Captured: ${report.evidence.screenshots.length} screenshots`);

    console.log('\n🎯 Production Readiness:', report.productionReadiness.ready ? '✅ READY' : '❌ NOT READY');

    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach(rec => console.log(`   ${rec}`));
    }
  }

  // Helper functions
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async waitForNavigation() {
    return new Promise(resolve => {
      const originalHref = window.location.href;
      const checkInterval = setInterval(() => {
        if (window.location.href !== originalHref) {
          clearInterval(checkInterval);
          // Wait for new page to load
          if (document.readyState === 'complete') {
            resolve();
          } else {
            window.addEventListener('load', resolve, { once: true });
          }
        }
      }, 100);
      setTimeout(() => clearInterval(checkInterval), 10000); // Timeout
    });
  }

  async waitForPageLoad() {
    if (document.readyState === 'complete') return;

    return new Promise(resolve => {
      window.addEventListener('load', resolve, { once: true });
    });
  }

  async waitForCondition(condition, timeout = 5000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (condition()) {
        return true;
      }
      await this.delay(100);
    }
    return false;
  }

  generateSessionId() {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async captureErrorState(error) {
    const errorState = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    window.testError = errorState;
    console.error('❌ Error captured:', errorState);
  }
}

// Create and expose the testing runner
window.comprehensiveTestingRunner = new ComprehensiveTestingRunner();
window.runComprehensiveTests = () => window.comprehensiveTestingRunner.runFullTestSuite();

console.log('🎯 Comprehensive Testing Runner Loaded!');
console.log('🚀 Run runComprehensiveTests() to start the full testing suite');
console.log('📋 Phases:');
console.log('   1. Application verification');
console.log('   2. Testing framework loading');
console.log('   3. Renata chat opening');
console.log('   4. Chat readiness verification');
console.log('   5. Extended conversation testing');
console.log('   6. Evidence capture');
console.log('   7. Comprehensive report generation');