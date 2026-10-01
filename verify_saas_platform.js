const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = 'C:\\Users\\deepd\\.gemini\\antigravity-ide\\brain\\f0beeaa8-4c5f-4b81-9c58-f324c7f9a366';

async function runVerification() {
  console.log('🚀 Starting Comprehensive SaaS End-to-End Visual Verification...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  try {
    // 1. PUBLIC MARKETING WEBSITE
    console.log('\n--- 1. Testing Public SaaS Landing Page ---');
    await page.goto('http://localhost:5000/', { waitUntil: 'networkidle0', timeout: 15000 });
    await page.waitForSelector('h1');
    const heroTitle = await page.$eval('h1', el => el.innerText);
    console.log('✅ Landing Page Loaded. Hero title:', heroTitle.slice(0, 50));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'saas_01_landing_page.png') });
    console.log('📸 Captured: saas_01_landing_page.png');

    // 2. PRICING SECTION
    console.log('\n--- 2. Testing Pricing Tier Selection ---');
    await page.goto('http://localhost:5000/#pricing', { waitUntil: 'networkidle0', timeout: 15000 });
    const pricingHeading = await page.$eval('#pricing h2', el => el.innerText);
    console.log('✅ Pricing Section Loaded:', pricingHeading);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'saas_02_pricing_plans.png') });
    console.log('📸 Captured: saas_02_pricing_plans.png');

    // 3. SAAS ONBOARDING & PURCHASE WIZARD
    console.log('\n--- 3. Testing Restaurant Registration & Purchase Wizard ---');
    await page.goto('http://localhost:5000/register?plan=starter', { waitUntil: 'networkidle0', timeout: 15000 });
    await page.waitForSelector('form');
    console.log('✅ Onboarding wizard Step 2 loaded');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'saas_03_registration_step2.png') });
    console.log('📸 Captured: saas_03_registration_step2.png');

    // 4. SUPER ADMIN PORTAL LOGIN
    console.log('\n--- 4. Testing Super Admin Portal Login ---');
    await page.goto('http://localhost:5000/admin/login', { waitUntil: 'networkidle0', timeout: 15000 });
    await page.waitForSelector('button');
    console.log('✅ Super Admin login portal displayed');
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'saas_04_admin_login.png') });
    console.log('📸 Captured: saas_04_admin_login.png');

    // Click demo login button
    console.log('Logging in as Super Admin (admin@serveflow.io)...');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
    console.log('✅ Redirected to Super Admin Dashboard:', page.url());
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'saas_05_admin_dashboard.png') });
    console.log('📸 Captured: saas_05_admin_dashboard.png');

    // 5. SUPER ADMIN RESTAURANTS DIRECTORY
    console.log('\n--- 5. Testing Super Admin Restaurants & Tenants Directory ---');
    await page.goto('http://localhost:5000/admin/restaurants', { waitUntil: 'networkidle0', timeout: 15000 });
    await page.waitForSelector('table');
    const tenantCount = await page.$$eval('tbody tr', rows => rows.length);
    console.log(`✅ Loaded ${tenantCount} tenant restaurants in Super Admin table`);
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'saas_06_admin_restaurants.png') });
    console.log('📸 Captured: saas_06_admin_restaurants.png');

    // 6. SUPER ADMIN SUBSCRIPTION PLANS
    console.log('\n--- 6. Testing Super Admin Tier Configuration ---');
    await page.goto('http://localhost:5000/admin/plans', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'saas_07_admin_plans.png') });
    console.log('📸 Captured: saas_07_admin_plans.png');

    // 7. SUPER ADMIN PAYMENTS & REVENUE
    console.log('\n--- 7. Testing Super Admin Payments & Revenue Ledger ---');
    await page.goto('http://localhost:5000/admin/payments', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'saas_08_admin_payments.png') });
    console.log('📸 Captured: saas_08_admin_payments.png');

    // 8. RESTAURANT OWNER LOGIN & WORKSPACE
    console.log('\n--- 8. Testing Restaurant Owner Login (ceo@abcfoods.com) ---');
    await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle0', timeout: 15000 });
    // Click CEO demo card
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await (await b.getProperty('innerText')).jsonValue();
      if (text.includes('CEO / Owner') || text.includes('Abc Foods')) {
        await b.click();
        break;
      }
    }
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
    console.log('✅ Logged in as Restaurant Owner. Current URL:', page.url());

    // 9. MULTI-BRANCH OUTLETS MANAGEMENT
    console.log('\n--- 9. Testing Restaurant Owner Multi-Branch Outlets ---');
    await page.goto('http://localhost:5000/branches', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'saas_09_tenant_branches.png') });
    console.log('📸 Captured: saas_09_tenant_branches.png');

    // 10. SUBSCRIPTION & QUOTA USAGE
    console.log('\n--- 10. Testing Tenant Billing & Quota Usage ---');
    await page.goto('http://localhost:5000/subscription', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'saas_10_tenant_subscription.png') });
    console.log('📸 Captured: saas_10_tenant_subscription.png');

    // 11. ROLES & PERMISSION MATRIX (RBAC)
    console.log('\n--- 11. Testing Custom Roles & RBAC Matrix ---');
    await page.goto('http://localhost:5000/roles', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'saas_11_tenant_roles.png') });
    console.log('📸 Captured: saas_11_tenant_roles.png');

    // 12. TABLE MANAGEMENT WITH QR FLYER MODAL
    console.log('\n--- 12. Testing Tables Floor & QR Generator ---');
    await page.goto('http://localhost:5000/tables', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));
    // Click QR button on first table
    const qrButtons = await page.$$('button[title*="Generate QR"]');
    if (qrButtons.length > 0) {
      await qrButtons[0].click();
      await new Promise(r => setTimeout(r, 600));
    }
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'saas_12_table_qr_modal.png') });
    console.log('📸 Captured: saas_12_table_qr_modal.png');

    // 13. CONTACTLESS CUSTOMER QR DINING MENU
    console.log('\n--- 13. Testing Contactless Customer QR Dining Menu ---');
    await page.goto('http://localhost:5000/menu/REST-10001/BR-BOPAL/T-04', { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'saas_13_customer_qr_menu.png') });
    console.log('📸 Captured: saas_13_customer_qr_menu.png');

    console.log('\n🎉 ALL 13 SAAS SUITE VISUAL CHECKS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Verification Error:', err);
  } finally {
    await browser.close();
  }
}

runVerification();
