/**
 * Test the admin bypass functionality by going directly to the bypass page
 */

const puppeteer = require('puppeteer');

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testDirectBypass() {
  console.log('🧪 Testing direct admin bypass...');

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

    // Step 1: Navigate directly to bypass page
    console.log('\n📍 Step 1: Navigating directly to bypass page...');
    await page.goto('http://localhost:6565/dev-admin-bypass');
    await sleep(5000);

    // Check if bypass page loads
    const bypassPageLoaded = await page.evaluate(() => {
      const title = document.title;
      const hasBypassText = document.body.textContent.includes('Admin Bypass') ||
                          document.body.textContent.includes('Development session');
      return title.includes('Traderra') || hasBypassText;
    });

    console.log(`Bypass page loaded: ${bypassPageLoaded ? '✅ Yes' : '❌ No'}`);

    if (!bypassPageLoaded) {
      console.log('❌ Bypass page failed to load');
      await browser.close();
      return;
    }

    // Step 2: Wait for session setup and redirect
    console.log('\n⏳ Step 2: Waiting for session setup and redirect...');

    for (let i = 0; i < 15; i++) {
      await sleep(1000);
      const currentUrl = page.url();
      console.log(`📍 Current URL (${i + 1}s): ${currentUrl}`);

      if (currentUrl.includes('/dashboard')) {
        console.log('✅ Redirected to dashboard!');
        break;
      }

      // Check if still on bypass page with status
      const status = await page.evaluate(() => {
        const text = document.body.textContent;
        if (text.includes('Redirecting to dashboard')) {
          return 'redirecting';
        } else if (text.includes('Setting up development session')) {
          return 'setting up';
        } else if (text.includes('Error')) {
          return 'error';
        }
        return 'unknown';
      });

      if (status === 'redirecting') {
        console.log('📤 Status: Redirecting to dashboard...');
      } else if (status === 'setting up') {
        console.log('⚙️ Status: Setting up development session...');
      } else if (status === 'error') {
        console.log('❌ Status: Error occurred');
        const errorText = await page.evaluate(() => {
          const errorElement = document.querySelector('text-red-400, .text-red-400');
          return errorElement ? errorElement.textContent : 'No error text found';
        });
        console.log('Error details:', errorText);
        break;
      }

      // Check localStorage
      if (i === 5) { // Check after 5 seconds
        const localStorageData = await page.evaluate(() => {
          const devSession = localStorage.getItem('clerk-dev-session');
          const activeUser = localStorage.getItem('clerk-active-user');
          const traderraPrefs = localStorage.getItem('traderra_chat_preferences');

          return {
            hasDevSession: !!devSession,
            hasActiveUser: !!activeUser,
            hasTraderraPrefs: !!traderraPrefs,
            devSession: devSession ? JSON.parse(devSession) : null,
            traderraPrefs: traderraPrefs ? JSON.parse(traderraPrefs) : null
          };
        });

        console.log('💾 LocalStorage State at 5s:');
        console.log(`  Development session: ${localStorageData.hasDevSession ? '✅ Yes' : '❌ No'}`);
        console.log(`  Active user: ${localStorageData.hasActiveUser ? '✅ Yes' : '❌ No'}`);
        console.log(`  Traderra preferences: ${localStorageData.hasTraderraPrefs ? '✅ Yes' : '❌ No'}`);

        if (localStorageData.devSession) {
          console.log(`  User email: ${localStorageData.devSession.user.primaryEmailAddress.emailAddress}`);
          console.log(`  User ID: ${localStorageData.devSession.user.id}`);
        }
      }
    }

    // Step 3: Check final state
    const finalUrl = page.url();
    console.log(`Final URL: ${finalUrl}`);
    const reachedDashboard = finalUrl.includes('/dashboard');
    console.log(`Reached dashboard: ${reachedDashboard ? '✅ Yes' : '❌ No'}`);

    if (reachedDashboard) {
      // Check if dashboard loads successfully
      const dashboardLoaded = await page.evaluate(() => {
        const hasDashboardContent = document.body.textContent.includes('dashboard') ||
                                    document.body.textContent.includes('Dashboard') ||
                                    document.querySelector('[class*="dashboard"]') !== null ||
                                    document.querySelector('[data-testid*="dashboard"]') !== null;
        return hasDashboardContent;
      });

      console.log(`Dashboard content loaded: ${dashboardLoaded ? '✅ Yes' : '❌ No'}`);

      // Check for Renata chat
      const hasRenataChat = await page.evaluate(() => {
        return document.querySelector('[class*="renata"]') !== null ||
               document.querySelector('[class*="chat"]') !== null ||
               document.body.textContent.includes('Renata');
      });

      console.log(`Renata chat available: ${hasRenataChat ? '✅ Yes' : '❌ No'}`);

      // Final localStorage check
      const finalLocalStorageData = await page.evaluate(() => {
        const devSession = localStorage.getItem('clerk-dev-session');
        const traderraPrefs = localStorage.getItem('traderra_chat_preferences');
        return {
          hasDevSession: !!devSession,
          hasTraderraPrefs: !!traderraPrefs,
          devSession: devSession ? JSON.parse(devSession) : null,
          traderraPrefs: traderraPrefs ? JSON.parse(traderraPrefs) : null
        };
      });

      console.log('💾 Final LocalStorage State:');
      console.log(`  Development session: ${finalLocalStorageData.hasDevSession ? '✅ Yes' : '❌ No'}`);
      console.log(`  Traderra preferences: ${finalLocalStorageData.hasTraderraPrefs ? '✅ Yes' : '❌ No'}`);
    }

    // Take final screenshot
    await page.screenshot({
      path: `/Users/michaeldurante/ai dev/ce-hub/projects/traderra/direct_bypass_test.png`,
      fullPage: false
    });

    console.log('\n📸 Screenshot saved: direct_bypass_test.png');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testDirectBypass().catch(console.error);