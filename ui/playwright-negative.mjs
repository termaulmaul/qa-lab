import fs from 'fs/promises';
import path from 'path';
import { chromium } from 'playwright';
const baseUrl = process.env.UI_BASE_URL || 'http://app:8000';
const outputRoot = process.env.PLAYWRIGHT_OUTPUT_DIR || '/tmp/playwright';
const scenarioDir = path.join(outputRoot, 'negative');
async function expectText(page, selector, expectedText) {
  await page.waitForFunction(
    ({ targetSelector, expected }) => {
      const node = document.querySelector(targetSelector);
      return Boolean(node && node.textContent && node.textContent.includes(expected));
    },
    { targetSelector: selector, expected: expectedText },
    { timeout: 8000 }
  );
  const text = await page.textContent(selector);
  if (!text || !text.includes(expectedText)) {
    throw new Error(`Expected "${expectedText}" in ${selector}, got "${text}"`);
  }
}
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
    await page.screenshot({ path: path.join(scenarioDir, 'ui-negative-home.png'), fullPage: true });
    await page.click('#refresh-watchlist');
    await expectText(page, '#watchlist-message', 'Login first to view watchlist');
    await page.click('#refresh-orders');
    await expectText(page, '#orders-message', 'Login first to view order history');
    await page.fill('#order-lookup-id', 'TRX-NOT-LOGIN');
    await page.click('#lookup-order-button');
    await expectText(page, '#orders-message', 'Login first to lookup order');
    await page.fill('#username', process.env.LOGIN_USERNAME || 'qa_user');
    await page.fill('#password', process.env.LOGIN_PASSWORD || 'qa_pass');
    await page.click('#login-button');
    await page.waitForSelector('text=Login successful');
    await page.click('#refresh-watchlist');
    await page.waitForSelector('#watchlist-list li');
    await fs.writeFile(path.join(scenarioDir, 'watchlist-negative-ok.txt'), 'ok\n', 'utf8');
    await page.click('#refresh-orders');
    await expectText(page, '#orders-message', 'Loaded 0 orders');
    await page.fill('#order-lookup-id', 'TRX-UNKNOWN-ORDER');
    await page.click('#lookup-order-button');
    await expectText(page, '#orders-message', 'Order not found');
    await fs.writeFile(path.join(scenarioDir, 'orders-negative-ok.txt'), 'ok\n', 'utf8');
    await page.fill('#quantity', process.env.NEGATIVE_ORDER_QUANTITY || '9999999');
    await page.click('#place-order');
    await expectText(page, '#order-message', 'Insufficient buying power');
    await page.screenshot({ path: path.join(scenarioDir, 'ui-negative-result.png'), fullPage: true });
    videoPathPromise = page.video()?.path();
  } finally {
    await context.tracing.stop({ path: path.join(scenarioDir, 'trace.zip') });
    await context.close();
    await browser.close();
    if (videoPathPromise) {
      const actualVideoPath = await videoPathPromise;
      await fs.copyFile(actualVideoPath, path.join(scenarioDir, 'ui-negative.webm'));
    }
  }
}
run().catch((error) => {
  console.error(error);
  process.exit(1);
});
