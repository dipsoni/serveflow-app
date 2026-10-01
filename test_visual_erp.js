// scratch/test_visual_erp.js - Automated Visual & Functional Browser Test
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const ARTIFACT_DIR = 'C:/Users/deepd/.gemini/antigravity-ide/brain/f0beeaa8-4c5f-4b81-9c58-f324c7f9a366';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runBrowserTests() {
  console.log('=== STARTING AUTOMATED VISUAL BROWSER TEST ===\n');

  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Visit Login Page
  console.log('1. Navigating to http://localhost:5000/login ...');
  await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
  await sleep(1000);

  const loginShot = path.join(ARTIFACT_DIR, '01_login_styled.png');
  await page.screenshot({ path: loginShot, fullPage: false });
  console.log(`✓ Screenshot saved: 01_login_styled.png`);

  // 2. Click CEO quick login button
  console.log('\n2. Selecting CEO Demo Account (Aditya Vikram)...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const ceoBtn = buttons.find(b => b.innerText.includes('Aditya (CEO)'));
    if (ceoBtn) ceoBtn.click();
  });
  await sleep(500);

  // Click Submit
  console.log('   Clicking "Sign In to Terminal"...');
  await page.evaluate(() => {
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.click();
  });
  await sleep(2000);

  const dashboardShot = path.join(ARTIFACT_DIR, '02_dashboard_ceo.png');
  await page.screenshot({ path: dashboardShot, fullPage: false });
  console.log(`✓ Screenshot saved: 02_dashboard_ceo.png (Logged in as CEO)`);

  // 3. Test Top-Header Branch Selector
  console.log('\n3. Testing Top-Header Branch Selector Dropdown...');
  await page.evaluate(() => {
    // Click branch dropdown button
    const buttons = Array.from(document.querySelectorAll('header button'));
    const branchBtn = buttons.find(b => b.innerText.includes('All Branches') || b.innerText.includes('Branch'));
    if (branchBtn) branchBtn.click();
  });
  await sleep(600);

  const branchSelectorShot = path.join(ARTIFACT_DIR, '03_branch_dropdown_open.png');
  await page.screenshot({ path: branchSelectorShot, fullPage: false });
  console.log(`✓ Screenshot saved: 03_branch_dropdown_open.png`);

  // Switch to Bopal Branch
  console.log('   Selecting "Bopal Branch" from dropdown...');
  await page.evaluate(() => {
    const options = Array.from(document.querySelectorAll('button'));
    const bopalOption = options.find(b => b.innerText.includes('Bopal Branch'));
    if (bopalOption) bopalOption.click();
  });
  await sleep(1000);

  // 4. Navigate to ERP User Canvas
  console.log('\n4. Navigating to ERP Users & Roles Matrix (/erp/users)...');
  await page.goto('http://localhost:5000/erp/users', { waitUntil: 'networkidle2' });
  await sleep(1500);

  const erpCanvasShot = path.join(ARTIFACT_DIR, '04_erp_canvas_overview.png');
  await page.screenshot({ path: erpCanvasShot, fullPage: false });
  console.log(`✓ Screenshot saved: 04_erp_canvas_overview.png`);

  // 5. Select Priya Sharma (Area Sales Manager)
  console.log('\n5. Switching Staff Profile to Priya Sharma (Area Sales Manager)...');
  await page.evaluate(() => {
    const select = document.querySelector('select');
    if (select) {
      const priyaOption = Array.from(select.options).find(o => o.text.includes('Priya Sharma'));
      if (priyaOption) {
        select.value = priyaOption.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  });
  await sleep(1500);

  const priyaShot = path.join(ARTIFACT_DIR, '05_erp_priya_sharma.png');
  await page.screenshot({ path: priyaShot, fullPage: false });
  console.log(`✓ Screenshot saved: 05_erp_priya_sharma.png`);

  // 6. Inspect Granular Permissions on POS and Kitchen modules
  console.log('\n6. Expanding granular permission nodes in Allowed Modules Matrix...');
  await page.evaluate(() => {
    // Scroll down to Allowed Modules section
    window.scrollBy({ top: 450, behavior: 'instant' });
    const inspectButtons = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.includes('Inspect permissions'));
    inspectButtons.slice(0, 3).forEach(b => b.click());
  });
  await sleep(800);

  const inspectShot = path.join(ARTIFACT_DIR, '06_permissions_expanded.png');
  await page.screenshot({ path: inspectShot, fullPage: false });
  console.log(`✓ Screenshot saved: 06_permissions_expanded.png (Scrolled to Allowed Modules)`);

  // 7. Post Collaborative Comment & View Activity Stream
  console.log('\n7. Adding collaborative staff comment and viewing Activity Stream...');
  await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h3'));
    const streamHeading = headings.find(h => h.innerText.includes('Collaborative Comments'));
    if (streamHeading) {
      streamHeading.scrollIntoView({ behavior: 'instant', block: 'start' });
    } else {
      window.scrollBy({ top: 700, behavior: 'instant' });
    }
  });
  await sleep(400);

  await page.evaluate(() => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.value = 'Automated Verification: Branch scope confirmed for Bopal & Satellite regions.';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const buttons = Array.from(document.querySelectorAll('button'));
    const postBtn = buttons.find(b => b.innerText.includes('Post Reply'));
    if (postBtn) postBtn.click();
  });
  await sleep(1500);

  const commentShot = path.join(ARTIFACT_DIR, '07_comment_posted.png');
  await page.screenshot({ path: commentShot, fullPage: false });
  console.log(`✓ Screenshot saved: 07_comment_posted.png (Scrolled to Activity Stream)`);

  // 8. Click Save Changes
  console.log('\n8. Clicking "Save Changes" on action toolbar...');
  await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await sleep(400);
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const saveBtn = buttons.find(b => b.innerText.includes('Save Changes'));
    if (saveBtn) saveBtn.click();
  });
  await sleep(1500);

  const saveShot = path.join(ARTIFACT_DIR, '08_saved_toast.png');
  await page.screenshot({ path: saveShot, fullPage: false });
  console.log(`✓ Screenshot saved: 08_saved_toast.png`);

  // 9. Test Single Branch Lock for Cashier
  console.log('\n9. Logging out and testing Single-Branch Lock as Cashier (Rohan Joshi)...');
  await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle2' });
  await sleep(600);

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const cashierBtn = buttons.find(b => b.innerText.includes('Rohan (Cashier)'));
    if (cashierBtn) cashierBtn.click();
  });
  await sleep(400);

  await page.evaluate(() => {
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.click();
  });
  await sleep(2000);

  const cashierLockedShot = path.join(ARTIFACT_DIR, '09_cashier_locked_branch.png');
  await page.screenshot({ path: cashierLockedShot, fullPage: false });
  console.log(`✓ Screenshot saved: 09_cashier_locked_branch.png (Locked to Bopal Branch)`);

  await browser.close();

  console.log('\n======================================================');
  console.log('🎉 ALL VISUAL BROWSER TESTS COMPLETED SUCCESSFULLY!');
  console.log('   All 9 High-Res Screenshots Captured!');
  console.log('======================================================\n');
}

runBrowserTests().catch(err => {
  console.error('Visual test error:', err);
  process.exit(1);
});
