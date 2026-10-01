const { chromium } = require('playwright');
const path = require('path');

const ARTIFACTS_DIR = 'C:/Users/deepd/.gemini/antigravity-ide/brain/f0beeaa8-4c5f-4b81-9c58-f324c7f9a366';

async function main() {
  console.log('Launching Edge for visual verification of 4 features...');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // 1. Log in as CEO
  console.log('Navigating to login...');
  await page.goto('http://localhost:5000/login');
  await page.waitForTimeout(1000);

  await page.fill('input[type="email"]', 'ceo@abcfoods.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // 2. Dashboard - Open CSV Import Modal
  console.log('Capturing Dashboard and opening CSV Import Modal...');
  const importBtn = page.locator('button:has-text("Import Data")');
  if (await importBtn.count() > 0) {
    await importBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'feature_01_bulk_csv_import_modal.png'),
      fullPage: false
    });
    console.log('Captured feature_01_bulk_csv_import_modal.png');
    // Close modal
    const closeBtn = page.locator('button:has-text("Cancel")');
    if (await closeBtn.count() > 0) await closeBtn.click();
    await page.waitForTimeout(500);
  }

  // 3. POS Billing - Add item to cart, trigger Manager PIN approval for discount > 10%
  console.log('Navigating to POS billing...');
  await page.goto('http://localhost:5000/pos');
  await page.waitForTimeout(2000);

  // Wait for dish cards to render and click the first dish title
  console.log('Clicking dish card...');
  await page.waitForSelector('h4', { timeout: 10000 });
  await page.locator('h4').first().click();
  await page.waitForTimeout(800);

  // If customization modal opened, confirm adding to order
  const addToOrderBtn = page.locator('button:has-text("Add to Order")');
  if (await addToOrderBtn.count() > 0) {
    console.log('Confirming Add to Order modal...');
    await addToOrderBtn.click();
    await page.waitForTimeout(800);
  }

  // Click Discount button to open discount modal
  const discountBtn = page.locator('button:has-text("Discount")').first();
  if (await discountBtn.count() > 0) {
    await discountBtn.click();
    await page.waitForTimeout(500);

    // Click 15% discount button
    const disc15Btn = page.locator('button:has-text("15%")');
    if (await disc15Btn.count() > 0) {
      await disc15Btn.click();
      await page.waitForTimeout(300);
    }

    // Click Apply Discount - this triggers Manager PIN Modal!
    await page.click('button:has-text("Apply Discount")');
    await page.waitForTimeout(700);

    // Capture Manager PIN Approval Modal
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, 'feature_02_manager_pin_approval_modal.png'),
      fullPage: false
    });
    console.log('Captured feature_02_manager_pin_approval_modal.png');

    // Type PIN 1234 on tactile keypad
    for (const digit of ['1', '2', '3', '4']) {
      await page.locator(`.btn-tactile:text-is("${digit}")`).click();
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(1000);
  }

  // 4. Settle / Charge order to see 80mm Thermal Receipt Modal
  console.log('Opening Charge & settling to verify 80mm Thermal Receipt...');
  const chargeBtn = page.locator('button:has-text("Charge")');
  if (await chargeBtn.count() > 0) {
    await chargeBtn.click();
    await page.waitForTimeout(800);

    // Complete order
    const completeBtn = page.locator('button:has-text("Complete Order")');
    if (await completeBtn.count() > 0) {
      await completeBtn.click();
      await page.waitForTimeout(1200);

      // Now 80mm Thermal Receipt Modal is open!
      await page.screenshot({
        path: path.join(ARTIFACTS_DIR, 'feature_03_80mm_thermal_receipt_customer_bill.png'),
        fullPage: false
      });
      console.log('Captured feature_03_80mm_thermal_receipt_customer_bill.png');

      // Switch to Kitchen KOT Slip inside Thermal Receipt Modal
      const kotSlipTab = page.locator('button:has-text("Kitchen KOT")');
      if (await kotSlipTab.count() > 0) {
        await kotSlipTab.click();
        await page.waitForTimeout(600);

        await page.screenshot({
          path: path.join(ARTIFACTS_DIR, 'feature_04_80mm_thermal_kot_slip.png'),
          fullPage: false
        });
        console.log('Captured feature_04_80mm_thermal_kot_slip.png');
      }

      // Close modal
      const closeReceiptBtn = page.locator('button:has-text("Close")').first();
      if (await closeReceiptBtn.count() > 0) {
        await closeReceiptBtn.click();
        await page.waitForTimeout(500);
      }
    }
  }

  // 5. Kitchen KOT Live Display
  console.log('Navigating to Kitchen KOT display...');
  await page.goto('http://localhost:5000/kot');
  await page.waitForTimeout(1500);

  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'feature_05_kitchen_kot_live_tickets.png'),
    fullPage: false
  });
  console.log('Captured feature_05_kitchen_kot_live_tickets.png');

  await browser.close();
  console.log('Visual verification complete!');
}

main().catch(console.error);
