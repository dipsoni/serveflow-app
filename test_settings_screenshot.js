const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 950 } });
  
  await page.goto('http://localhost:5000/login');
  await page.waitForLoadState('networkidle');

  await page.fill('input[type="email"]', 'ceo@abcfoods.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });

  // Open user profile directly
  await page.goto('http://localhost:5000/erp/users?id=usr-ceo-01');
  await page.waitForTimeout(600);

  // Click Settings tab
  const settingsTab = page.locator('button:has-text("Settings")').first();
  await settingsTab.click();
  await page.waitForTimeout(400);

  await page.screenshot({ path: path.join(__dirname, 'verify_07_user_settings_tab.png') });
  console.log('User settings tab screenshot captured successfully!');
  await browser.close();
})();
