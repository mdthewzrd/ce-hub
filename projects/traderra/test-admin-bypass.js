/**
 * Test the admin bypass functionality
 */

const puppeteer = require('puppeteer');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAdminBypass() {
  console.log('🧪 Testing admin bypass functionality...');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Enable console logging
    page.on('console', msg => {
      console.log('🌐 Browser Console:', msg.text());
    });

    page.on('pageerror', error => {
      console.error('🚨 Browser Error:', error.message);
    });

    // Step 1: Navigate to admin page
    console.log('\n📍 Step 1: Navigating to admin page...');
    await page.goto('http://localhost:6565/admin');
    await sleep(3000);

    // Check if admin page loads
    const adminPageLoaded = await page.evaluate(() => {
      const title = document.title;
      const hasAdminText = document.body.textContent.includes('Admin Access') ||
                          document.body.textContent.includes('Traderra Admin');
      return title.includes('Admin') || hasAdminText;
    });

    console.log(`Admin page loaded: ${adminPageLoaded ? '✅ Yes' : '❌ No'}`);

    if (!adminPageLoaded) {
      console.log('❌ Admin page failed to load');
      await browser.close();
      return;
    }

    // Step 2: Click admin access button
    console.log('\n🔑 Step 2: Clicking admin access button...');

    // Wait for button to be available and click it
    await page.waitForSelector('#admin-access-button', { timeout: 5000 });

    // Check if button is enabled
    const buttonEnabled = await page.evaluate(() => {
      const button = document.getElementById('admin-access-button');
      return button && !button.disabled;
    });

    if (!buttonEnabled) {
      console.log('❌ Admin access button is disabled');
    } else {
      // Try both direct click and JavaScript evaluation
      await page.click('#admin-access-button');
      console.log('✅ Admin access button clicked via Puppeteer');

      // Also try JavaScript click as fallback
      await page.evaluate(() => {
        const button = document.getElementById('admin-access-button');
        if (button && button.onclick) {
          button.onclick();
        }
      });
      console.log('✅ Admin access button clicked via JavaScript');
    }

    // Wait for redirect to dev-admin-bypass
    console.log('⏳ Waiting for redirect...');
    for (let i = 0; i < 10; i++) {
      await sleep(1000);
      const currentUrl = page.url();
      console.log(`📍 Current URL (${i + 1}s): ${currentUrl}`);

      if (currentUrl.includes('/dev-admin-bypass')) {
        console.log('✅ Redirected to bypass page!');
        break;
      }

      if (currentUrl.includes('/dashboard')) {
        console.log('✅ Redirected to dashboard directly!');
        break;
      }
    }

    // Final URL check
    const finalUrl = page.url();
    const redirectedToBypass = finalUrl.includes('/dev-admin-bypass');
    const redirectedToDashboard = finalUrl.includes('/dashboard');
    console.log(`Final URL: ${finalUrl}`);
    console.log(`Redirected to bypass page: ${redirectedToBypass ? '✅ Yes' : '❌ No'}`);
    console.log(`Redirected to dashboard: ${redirectedToDashboard ? '✅ Yes' : '❌ No'}`);

    if (redirectedToBypass) {
      // Wait for bypass to complete
      await sleep(3000);

      // Check if bypass page shows session creation
      const bypassStatus = await page.evaluate(() => {
        const text = document.body.textContent;
        return text.includes('Development session') ||
               text.includes('mikedurante13@gmail.com');
      });

      console.log(`Development session created: ${bypassStatus ? '✅ Yes' : '❌ No'}`);

      // Check localStorage for session
      const localStorageData = await page.evaluate(() => {
        const devSession = localStorage.getItem('clerk-dev-session');
        const activeUser = localStorage.getItem('clerk-active-user');

        return {
          hasDevSession: !!devSession,
          hasActiveUser: !!activeUser,
          devSession: devSession ? JSON.parse(devSession) : null
        };
      });

      console.log('💾 LocalStorage State:');
      console.log(`  Development session: ${localStorageData.hasDevSession ? '✅ Yes' : '❌ No'}`);
      console.log(`  Active user: ${localStorageData.hasActiveUser ? '✅ Yes' : '❌ No'}`);

      if (localStorageData.devSession) {
        console.log(`  User email: ${localStorageData.devSession.user.primaryEmailAddress.emailAddress}`);
        console.log(`  User ID: ${localStorageData.devSession.user.id}`);
      }

      // Step 3: Wait for redirect to dashboard
      console.log('\n🏠 Step 3: Waiting for redirect to dashboard...');
      await sleep(3000);

      const finalUrl = page.url();
      console.log(`Final URL: ${finalUrl}`);
      const reachedDashboard = finalUrl.includes('/dashboard');
      console.log(`Reached dashboard: ${reachedDashboard ? '✅ Yes' : '❌ No'}`);

      if (reachedDashboard) {
        // Check if dashboard loads successfully
        const dashboardLoaded = await page.evaluate(() => {
          const hasDashboardContent = document.body.textContent.includes('dashboard') ||
                                      document.body.textContent.includes('Dashboard') ||
                                      document.querySelector('[class*="dashboard"]') !== null;
          return hasDashboardContent;
        });

        console.log(`Dashboard content loaded: ${dashboardLoaded ? '✅ Yes' : '❌ No'}`);

        // Check if context has dev user
        const hasDevUser = await page.evaluate(() => {
          return window.devUser ||
                 localStorage.getItem('clerk-dev-session') !== null;
        });

        console.log(`Dev user available in context: ${hasDevUser ? '✅ Yes' : '❌ No'}`);
      }
    }

    // Take final screenshot
    await page.screenshot({
      path: `/Users/michaeldurante/ai dev/ce-hub/projects/traderra/admin_bypass_test.png`,
      fullPage: false
    });

    console.log('\n📸 Screenshot saved: admin_bypass_test.png');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testAdminBypass().catch(console.error);