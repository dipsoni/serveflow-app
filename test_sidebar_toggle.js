const { chromium } = require('playwright');
const path = require('path');

const ARTIFACTS_DIR = 'C:/Users/deepd/.gemini/antigravity-ide/brain/f0beeaa8-4c5f-4b81-9c58-f324c7f9a366';

async function main() {
  console.log('Testing sidebar modules hide / unhide toggle in Edge...');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // 1. Log in
  console.log('Navigating to login...');
  await page.goto('http://localhost:5000/login');
  await page.waitForTimeout(1000);

  await page.fill('input[type="email"]', 'ceo@abcfoods.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // 2. Navigate to Support page (as in user screenshot)
  console.log('Navigating to Support page...');
  await page.goto('http://localhost:5000/support');
  await page.waitForTimeout(1500);

  // Screenshot 1: Expanded (modules unhidden)
  console.log('Capturing modules expanded (default)...');
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'sidebar_01_modules_unhidden.png'),
    fullPage: false
  });

  // 3. Click the hamburger button marked in red
  console.log('Clicking hamburger button to hide modules...');
  const toggleBtn = page.locator('#sidebar-toggle-modules-btn');
  await toggleBtn.click();
  await page.waitForTimeout(600);

  // Screenshot 2: Collapsed (modules hidden)
  console.log('Capturing modules hidden (collapsed)...');
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'sidebar_02_modules_hidden.png'),
    fullPage: false
  });

  // 4. Click the hamburger button again to unhide modules
  console.log('Clicking hamburger button again to unhide modules...');
  await toggleBtn.click();
  await page.waitForTimeout(600);

  // Screenshot 3: Expanded again (modules unhidden)
  console.log('Capturing modules unhidden again...');
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'sidebar_03_modules_unhidden_again.png'),
    fullPage: false
  });

  await browser.close();
  console.log('Sidebar toggle test completed successfully!');
}

main().catch(err => {
  console.error('Error running sidebar toggle test:', err);
  process.exit(1);
});
