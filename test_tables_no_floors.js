const { chromium } = require('playwright');
const path = require('path');

const ARTIFACTS_DIR = 'C:/Users/deepd/.gemini/antigravity-ide/brain/f0beeaa8-4c5f-4b81-9c58-f324c7f9a366';

async function main() {
  console.log('Testing Tables page without floor dependency...');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // 1. Log in
  await page.goto('http://localhost:5000/login');
  await page.waitForTimeout(1000);
  await page.fill('input[type="email"]', 'ceo@abcfoods.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // 2. Navigate to Tables page
  console.log('Navigating to Tables page...');
  await page.goto('http://localhost:5000/tables');
  await page.waitForTimeout(1500);

  // Capture clean tables view
  console.log('Capturing tables view without floors...');
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'tables_01_no_floors.png'),
    fullPage: false
  });

  // 3. Open Add Table modal
  console.log('Opening Add Table modal...');
  await page.click('button:has-text("Add Table")');
  await page.waitForTimeout(600);

  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'tables_02_add_table_modal_no_floor.png'),
    fullPage: false
  });

  await browser.close();
  console.log('Tables verification completed successfully!');
}

main().catch(err => {
  console.error('Error running tables test:', err);
  process.exit(1);
});
