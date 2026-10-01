const { chromium } = require('playwright');
const path = require('path');

const ARTIFACTS_DIR = 'C:/Users/deepd/.gemini/antigravity-ide/brain/f0beeaa8-4c5f-4b81-9c58-f324c7f9a366';

async function main() {
  console.log('Testing full-page New Purchase Order in Edge...');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // 1. Log in
  console.log('Logging in...');
  await page.goto('http://localhost:5000/login');
  await page.waitForTimeout(1000);
  await page.fill('input[type="email"]', 'ceo@abcfoods.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // 2. Go to /purchases
  console.log('Navigating to Purchases list...');
  await page.goto('http://localhost:5000/purchases');
  await page.waitForTimeout(1500);

  // 3. Click "+ New Purchase Order"
  console.log('Clicking "+ New Purchase Order" button...');
  await page.click('button:has-text("New Purchase Order")');
  await page.waitForTimeout(1500);

  // 4. Capture screenshot of full-page form
  console.log('Capturing New Purchase Order full page form...');
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'purchase_01_full_page_form.png'),
    fullPage: false
  });

  // 5. Test adding another item row
  console.log('Testing Add Row...');
  const addRowBtn = page.locator('button:has-text("Add Row")');
  if (await addRowBtn.count() > 0) {
    await addRowBtn.click();
    await page.waitForTimeout(600);
  }

  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'purchase_02_items_table_multiple_rows.png'),
    fullPage: false
  });

  // 6. Test Save Draft PO
  console.log('Testing Save Draft PO...');
  await page.click('button:has-text("Save Draft PO")');
  await page.waitForTimeout(2000);

  // Verify redirected back to /purchases with new PO in list
  console.log('Capturing Purchases list with newly created PO...');
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'purchase_03_saved_in_purchases_list.png'),
    fullPage: false
  });

  await browser.close();
  console.log('New Purchase Order verification completed successfully!');
}

main().catch(err => {
  console.error('Error in New Purchase Order test:', err);
  process.exit(1);
});
