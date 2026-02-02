# Troubleshooting FAQ

## 🤖 AI Model Issues

### Q: The AI model dropdown doesn't open when I click it
**A:** This usually indicates a JavaScript or loading issue.

**Solutions:**
1. **Refresh the page** (Ctrl/Cmd + R)
2. **Check browser console** (F12) for errors
3. **Verify System Health**: Go to Settings → System Health and check if Archon service is connected
4. **Clear browser cache** and reload

**Prevention:** Keep your browser updated and check system health regularly.

---

### Q: I selected a model but it's still using the old one
**A:** The model switch may not have completed successfully.

**Solutions:**
1. **Look for notifications** - you should see a success message
2. **Check current model** - the dropdown should show the selected model
3. **Try again** - click the model selector and choose again
4. **Refresh page** if the issue persists

**How to verify:** The CPU icon in chat header shows current model name.

---

### Q: Some AI models are grayed out or not available
**A:** This means the API key for that provider isn't configured.

**Solutions:**
1. **Check availability** - Settings → AI Configuration shows which models are available
2. **Contact admin** - API keys need to be configured in environment variables
3. **Use available models** - stick to models marked as "available"

**Note:** Only administrators can configure API keys for security reasons.

---

### Q: AI responses are slow or timing out
**A:** This could be a network, service, or configuration issue.

**Solutions:**
1. **Check System Health** - verify Archon service has good response times
2. **Try different model** - some models are faster than others
3. **Reduce response length** - go to Settings → AI Configuration
4. **Check internet connection** - poor connection affects AI services

**Model speeds:** GPT-4 Turbo > Gemini Pro > Claude 3 Sonnet > GPT-4 > Claude 3 Opus

---

## 🌐 Browser Automation Issues

### Q: Playwright automation isn't working
**A:** Multiple potential causes - let's troubleshoot systematically.

**Solutions:**
1. **Check Service Status:**
   - Go to Settings → System Health
   - Verify Playwright service shows "Connected"
   - If red/disconnected, try refreshing that service

2. **Browser Configuration:**
   - Settings → Integrations → Browser Automation
   - Try switching between headless/headed mode
   - Change browser type (Chrome usually most reliable)

3. **Network Issues:**
   - Check firewall settings
   - Verify internet connectivity
   - Try increasing timeout from 30s to 60s

**Most common fix:** Switch from headless to headed mode or vice versa.

---

### Q: Browser opens but nothing happens
**A:** The browser launched but automation commands aren't working.

**Solutions:**
1. **Check timeout settings** - may need more time for slow sites
2. **Verify target website** - some sites block automation
3. **Try different browser** - switch from Chrome to Firefox
4. **Check for popups** - headed mode helps identify blocking dialogs

**Debugging tip:** Use headed mode to see what's actually happening.

---

### Q: Browser automation is very slow
**A:** Performance can be optimized in several ways.

**Solutions:**
1. **Enable headless mode** - much faster than headed
2. **Use Chrome browser** - generally fastest option
3. **Reduce timeout** - don't wait longer than necessary
4. **Disable screenshots** - if auto-screenshots are enabled
5. **Close other applications** - free up system resources

**Best performance setup:** Headless + Chrome + 30s timeout + No screenshots

---

### Q: Getting "browser not found" errors
**A:** Browser binaries aren't properly installed.

**Solutions:**
1. **Check MCP status** - may need to reinstall Playwright MCP
2. **Try different browser** - use one that's definitely installed
3. **Contact support** - may need system-level installation

**Note:** This is usually a setup issue requiring technical support.

---

## 📊 System Health Issues

### Q: All services show as disconnected
**A:** Network or system-wide issue.

**Solutions:**
1. **Check internet connection** - verify other websites work
2. **Refresh the page** - complete page reload
3. **Try manual refresh** - click "Refresh" button in health dashboard
4. **Check browser console** - F12 for JavaScript errors
5. **Restart browser** - close and reopen completely

**If nothing works:** Contact support with screenshots of health dashboard.

---

### Q: One service is red but others are green
**A:** Specific service issue.

**Solutions:**
1. **Click refresh** on that specific service
2. **Wait 1-2 minutes** - may be temporary
3. **Check service details** - click on the service card for more info
4. **Try related features** - see if the service actually works despite status

**Services and their impact:**
- **Archon**: AI chat and knowledge search
- **Playwright**: Browser automation
- **Vision**: Image analysis

---

### Q: Response times are very high (>5 seconds)
**A:** Performance issue - service is connected but slow.

**Solutions:**
1. **Check internet speed** - run a speed test
2. **Close other applications** - free up bandwidth
3. **Try later** - may be temporary server load
4. **Switch AI models** - some are faster than others

**Good response times:** <2 seconds normal, <5 seconds acceptable, >5 seconds concerning

---

## 🔔 Notification Issues

### Q: Not seeing any notifications
**A:** Notification system not working.

**Solutions:**
1. **Check browser permissions** - allow notifications for this site
2. **Refresh the page** - reinitialize notification system
3. **Check browser console** - F12 for JavaScript errors
4. **Try a different browser** - test if browser-specific

**To enable:** Browser settings → Site permissions → Notifications → Allow

---

### Q: Notifications appear but disappear too quickly
**A:** Normal behavior - notifications auto-dismiss after 5-8 seconds.

**Solutions:**
1. **Read quickly** - they'll be visible for several seconds
2. **Look for permanent indicators** - like status changes in UI
3. **Check notification history** - browser may keep a log

**Note:** Success notifications disappear faster than error notifications.

---

## ⚙️ Settings Issues

### Q: Settings don't save when I click "Save Changes"
**A:** Save operation failing.

**Solutions:**
1. **Check for unsaved changes indicator** - should disappear after saving
2. **Refresh page** - see if changes persisted
3. **Try changing one setting at a time** - identify which setting causes issues
4. **Check browser console** - F12 for save errors

**Verification:** Refresh page and see if your changes are still there.

---

### Q: Can't access certain settings sections
**A:** Permission or loading issue.

**Solutions:**
1. **Try different sections** - see if specific to one area
2. **Check user permissions** - some features may be admin-only
3. **Refresh page** - reload completely
4. **Clear browser cache** - old cached files may interfere

---

## 🚨 Emergency Troubleshooting

### When Nothing Works
1. **Complete browser restart** - close all tabs and reopen
2. **Clear all browser data** - cache, cookies, local storage
3. **Try incognito/private mode** - rules out extension conflicts
4. **Try different browser** - Chrome, Firefox, Safari, Edge
5. **Check other devices** - is it device-specific?

### Before Contacting Support
✅ **Tried multiple browsers**
✅ **Checked System Health dashboard**
✅ **Noted exact error messages**
✅ **Took screenshots of issues**
✅ **Checked browser console (F12)**

### Support Contact Information
- **Email**: support@traderra.com
- **Include**: Screenshots, error messages, browser version, operating system

---

## 💡 Pro Troubleshooting Tips

1. **System Health First** - always check before troubleshooting anything else
2. **Browser Console** - F12 reveals technical details about errors
3. **Incognito Mode** - quickly rules out extension/cache issues
4. **Different Browser** - confirms if issue is browser-specific
5. **Documentation** - this FAQ covers 90% of common issues

Remember: Most issues are temporary and resolve with a simple page refresh! 🔄