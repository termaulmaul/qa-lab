import fs from 'fs/promises';
import path from 'path';
import { chromium } from 'playwright';
const baseUrl = process.env.UI_BASE_URL || 'http://app:8000';
const outputRoot = process.env.PLAYWRIGHT_OUTPUT_DIR || '/tmp/playwright';
const scenarioDir = path.join(outputRoot, 'smoke');
async function run() {
  await fs.mkdir(path.join(scenarioDir, 'video'), { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: path.join(scenarioDir, 'video'),
      size: { width: 1280, height: 720 },
    },
  });
  const page = await context.newPage();
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  let videoPathPromise;
  try {
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(scenarioDir, 'ui-home.png'), fullPage: true });
    await page.fill('#username', process.env.LOGIN_USERNAME || 'qa_user');
    await page.fill('#password', process.env.LOGIN_PASSWORD || 'qa_pass');
    await page.click('#login-button');
    await page.waitForSelector('text=Login successful');
    await page.click('#refresh-market');
    await page.waitForSelector('#market-body tr');
    await page.click('#refresh-portfolio');
    await page.waitForSelector('#portfolio-list li');
    await page.click('#refresh-watchlist');
    await page.waitForSelector('#watchlist-list li');
    await page.selectOption('#symbol', process.env.SYMBOL || 'BBCA');
    await page.fill('#quantity', process.env.ORDER_QUANTITY || '1');
    await page.click('#place-order');
    await page.waitForSelector('text=Order created successfully');
    await page.waitForSelector('#order-result:not([hidden])');
    const stateText = await page.textContent('#order-status');
    if (stateText?.trim() !== 'FILLED') {
      throw new Error(`Expected FILLED order status, got ${stateText}`);
    }
    await page.click('#refresh-orders');
    await page.waitForSelector('#orders-body tr');
    await page.screenshot({ path: path.join(scenarioDir, 'ui-order-success.png'), fullPage: true });
    videoPathPromise = page.video()?.path();
  } finally {
    await context.tracing.stop({ path: path.join(scenarioDir, 'trace.zip') });
    await context.close();
    await browser.close();
    if (videoPathPromise) {
      const actualVideoPath = await videoPathPromise;
      await fs.copyFile(actualVideoPath, path.join(scenarioDir, 'ui-smoke.webm'));
    }
  }
}
run().catch((error) => {
  console.error(error);
  process.exit(1);
});
