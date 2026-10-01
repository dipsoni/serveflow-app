const { chromium } = require('playwright');
const path = require('path');

const ARTIFACTS_DIR = 'C:/Users/deepd/.gemini/antigravity-ide/brain/f0beeaa8-4c5f-4b81-9c58-f324c7f9a366';

async function main() {
  console.log('Launching Edge for visual verification of Dashboard improvements...');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });

  // 1. Desktop 1440x900
  const contextDesktop = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await contextDesktop.newPage();

  console.log('Navigating to login...');
  await page.goto('http://localhost:5000/login');
  await page.waitForTimeout(1000);

  await page.fill('input[type="email"]', 'ceo@abcfoods.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);

  console.log('Capturing Desktop Dashboard (1440x900)...');
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, 'dashboard_01_desktop_kpi_widgets.png'),
    fullPage: false
  });

  // 2. Tablet Landscape 1024x768
  const contextLandscape = await browser.newContext({
    viewport: { width: 1024, height: 768 }
  });
  const pageLandscape = await contextLandscape.newPage();
  await pageLandscape.goto('http://localhost:5000/login');
  await pageLandscape.waitForTimeout(600);
  await pageLandscape.fill('input[type="email"]', 'ceo@abcfoods.com');
  await pageLandscape.fill('input[type="password"]', 'password123');
  await pageLandscape.click('button[type="submit"]');
  await pageLandscape.waitForTimeout(2000);

  console.log('Capturing Tablet Landscape Dashboard (1024x768)...');
  await pageLandscape.screenshot({
    path: path.join(ARTIFACTS_DIR, 'dashboard_02_tablet_landscape_1024.png'),
    fullPage: false
  });

  // 3. Tablet Portrait 768x1024
  const contextPortrait = await browser.newContext({
    viewport: { width: 768, height: 1024 }
  });
  const pagePortrait = await contextPortrait.newPage();
  await pagePortrait.goto('http://localhost:5000/login');
  await pagePortrait.waitForTimeout(600);
  await pagePortrait.fill('input[type="email"]', 'ceo@abcfoods.com');
  await pagePortrait.fill('input[type="password"]', 'password123');
  await pagePortrait.click('button[type="submit"]');
  await pagePortrait.waitForTimeout(2000);

  const scrollWidth = await pagePortrait.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await pagePortrait.evaluate(() => document.documentElement.clientWidth);
  console.log(`Portrait viewport check: scrollWidth=${scrollWidth}, clientWidth=${clientWidth}, hasOverflow=${scrollWidth > clientWidth}`);

  console.log('Capturing Tablet Portrait Dashboard (768x1024)...');
  await pagePortrait.screenshot({
    path: path.join(ARTIFACTS_DIR, 'dashboard_03_tablet_portrait_768.png'),
    fullPage: false
  });

  await browser.close();
  console.log('Verification captures completed successfully!');
}

main().catch(err => {
  console.error('Error running capture script:', err);
  process.exit(1);
});
