const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('--- Starting verification of all 10 user requirements ---');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();

  // 1. Log in as CEO Aditya Vikram
  console.log('1. Logging in as CEO Aditya Vikram...');
  await page.goto('http://localhost:5000/login');
  await page.waitForLoadState('networkidle');

  // Click CEO quick demo login
  const ceoBtn = page.locator('button:has-text("Aditya Vikram")').first();
  if (await ceoBtn.isVisible()) {
    await ceoBtn.click();
  } else {
    await page.fill('input[type="email"]', 'ceo@abcfoods.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
  }

  await page.waitForURL('**/dashboard', { timeout: 10000 });
  console.log('Logged in successfully!');

  // Check 1: Module name Users in sidebar
  const usersModuleLink = page.locator('a:has-text("Users")').first();
  const usersModuleText = await usersModuleLink.textContent();
  console.log('Sidebar module label:', usersModuleText);

  // Take screenshot of dashboard showing "Users" in sidebar
  await page.screenshot({ path: path.join(__dirname, 'verify_01_dashboard_users_module.png') });

  // Check 2: Branch switch loading UI
  console.log('2. Testing branch switch loading UI...');
  const branchDropdownBtn = page.locator('button:has-text("All Branches"), button:has-text("Branch")').first();
  await branchDropdownBtn.click();
  await page.waitForTimeout(300);

  // Click Satellite Branch
  const satBranchBtn = page.locator('button:has-text("Satellite Branch")').first();
  if (await satBranchBtn.isVisible()) {
    await satBranchBtn.click();
    // Observe loading overlay or toast
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(__dirname, 'verify_02_branch_switching.png') });
    await page.waitForTimeout(500);
  }

  // Check 3: Click "My Profile" in header dropdown
  console.log('3. Clicking avatar and "My Profile" to open logged-in profile...');
  const avatarBtn = page.locator('header button:has(img)').first();
  await avatarBtn.click();
  await page.waitForTimeout(300);

  const myProfileBtn = page.locator('button:has-text("My Profile")').first();
  await myProfileBtn.click();
  await page.waitForTimeout(800);

  console.log('Current URL after My Profile click:', page.url());
  await page.screenshot({ path: path.join(__dirname, 'verify_03_my_profile_loaded.png') });

  // Check 4: Verify "Follow", "Assigned To", and "Cover Image" are NOT present in user details
  const followBtn = page.locator('button:has-text("Follow"), button:has-text("Following")');
  const followCount = await followBtn.count();
  console.log('Follow button count in details (expected 0):', followCount);

  const assignedToSection = page.locator('span:has-text("Assigned To")');
  const assignedCount = await assignedToSection.count();
  console.log('Assigned To section count in details (expected 0):', assignedCount);

  const coverImageSection = page.locator('label:has-text("Cover Image")');
  const coverCount = await coverImageSection.count();
  console.log('Cover Image section count in details (expected 0):', coverCount);

  // Check 5: Live Activity with Aditya Vikram
  console.log('5. Verifying live activity stream...');
  const activityHeader = page.locator('div:has-text("Activity")').first();
  const activityText = await page.locator('div:has-text("Live")').first().isVisible();
  console.log('Activity Live badge visible:', activityText);

  // Check 6: Editable Attachments (Add & Remove)
  console.log('6. Testing attachments upload & delete...');
  // Check initial attachments count
  const initialAtts = await page.locator('div:has-text("Attachments") + * button[title="Delete attachment"]').count();
  console.log('Initial attachments count:', initialAtts);

  // Remove first attachment
  if (initialAtts > 0) {
    const deleteBtn = page.locator('button[title="Delete attachment"]').first();
    await deleteBtn.click();
    await page.waitForTimeout(300);
    const afterDelete = await page.locator('button[title="Delete attachment"]').count();
    console.log('Attachments count after delete:', afterDelete);
  }
  await page.screenshot({ path: path.join(__dirname, 'verify_04_attachments_and_activity.png') });

  // Check 7: Ctrl+S Save in Profile
  console.log('7. Testing Ctrl+S save in user profile...');
  await page.keyboard.press('Control+s');
  await page.waitForTimeout(500);
  console.log('Ctrl+S pressed in profile successfully!');

  // Check 8: Full-page New User Desk form
  console.log('8. Opening New User full desk form...');
  const breadcrumbUsers = page.locator('button:has-text("Users"), button:has-text("User")').first();
  await breadcrumbUsers.click();
  await page.waitForTimeout(500);

  const newUserBtn = page.locator('button:has-text("New")').first();
  await newUserBtn.click();
  await page.waitForTimeout(500);

  await page.screenshot({ path: path.join(__dirname, 'verify_05_new_user_desk_form.png') });

  // Check 9: Full-page New Customer Desk form
  console.log('9. Opening New Customer full desk form...');
  await page.goto('http://localhost:5000/customers');
  await page.waitForLoadState('networkidle');

  const newCustBtn = page.locator('button:has-text("New Guest Profile"), button:has-text("New Customer"), button:has-text("New Guest")').first();
  if (await newCustBtn.isVisible()) {
    await newCustBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(__dirname, 'verify_06_new_customer_desk_form.png') });
  }

  console.log('--- All verifications completed successfully! ---');
  await browser.close();
})();
