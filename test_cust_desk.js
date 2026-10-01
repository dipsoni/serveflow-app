const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto('http://localhost:5000/login');
  await page.waitForLoadState('networkidle');

  await page.fill('input[type="email"]', 'ceo@abcfoods.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });

  await page.goto('http://localhost:5000/customers');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  const newBtn = page.locator('button:has-text("New Guest Profile")').first();
  await newBtn.click();
  await page.waitForTimeout(500);

  await page.screenshot({ path: 'verify_06_new_customer_desk_form.png' });
  console.log('Customer desk form screenshot captured successfully!');
  await browser.close();
})();
