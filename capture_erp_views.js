const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/deepd/.gemini/antigravity-ide/brain/f0beeaa8-4c5f-4b81-9c58-f324c7f9a366';

async function run() {
  console.log('Starting Playwright automated capture via system Edge browser...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 1. Login Page
  console.log('1. Navigating to Login Page...');
  await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'frappe_01_login.png'), fullPage: false });
  console.log('✓ Captured Login view');

  // Fill credentials as CEO
  console.log('2. Logging in as CEO (ceo@abcfoods.com)...');
  await page.fill('input[type="email"]', 'ceo@abcfoods.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForTimeout(1000);

  // 2. Home Workspace (Screenshot 1 matching)
  console.log('3. Capturing Home Workspace (Screenshot 1 matching)...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'frappe_02_home_workspace.png'), fullPage: false });
  console.log('✓ Captured Home Workspace view');

  // 3. Command Bar (Screenshot 3 matching)
  console.log('4. Triggering Command Search bar (Screenshot 3 matching)...');
  const searchInput = await page.$('input[placeholder*="Search or type a command"]');
  if (searchInput) {
    await searchInput.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'frappe_03_command_search.png'), fullPage: false });
    console.log('✓ Captured Command Search popup view');
  }

  // 4. User Profile & Details Desk (Screenshot 2 matching)
  console.log('5. Navigating to User Desk (Screenshot 2 matching)...');
  await page.goto('http://localhost:5000/erp/users', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'frappe_04_user_details_desk.png'), fullPage: false });
  console.log('✓ Captured User Details desk view');

  // 5. Roles & Permissions Tab and Document Matrix Modal (Screenshot 4 matching)
  console.log('6. Switching to Roles & Permissions tab...');
  const rolesTabBtn = page.locator('button:has-text("Roles & Permissions")');
  await rolesTabBtn.click();
  await page.waitForTimeout(800);

  // In the roles list, click on a role or inspect button
  console.log('7. Clicking role to open Document Permissions Modal (Screenshot 4 matching)...');
  const inspectBtn = page.locator('button[title*="Inspect"]').first();
  await inspectBtn.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'frappe_05_document_permissions_modal.png'), fullPage: false });
  console.log('✓ Captured Document-Level Permissions Matrix modal view');

  // Close the modal
  const closeBtn = page.locator('button:has-text("✕")').or(page.locator('button:has-text("Close")')).first();
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
    await page.waitForTimeout(400);
  }

  // 6. Log out and log in as Raj Gupta (Cashier) to demonstrate restricted module view
  console.log('8. Logging in as Raj Gupta to capture per-employee module isolation...');
  await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());
  await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'raj.gupta@abcfoods.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'frappe_06_raj_gupta_isolated_modules.png'), fullPage: false });
  console.log('✓ Captured Raj Gupta isolated module workspace');

  await browser.close();
  console.log('\n======================================================');
  console.log(' ALL 6 VIEWS SUCCESSFULLY CAPTURED & SAVED');
  console.log('======================================================');
}

run().catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});
