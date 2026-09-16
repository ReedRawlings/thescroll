import { chromium } from "playwright";
import fs from "node:fs/promises";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});
await page.goto("http://127.0.0.1:5173");
await page.waitForFunction(() => window.__scrollReady);
await page.evaluate(() => window.advanceTime(0));
await page.screenshot({ path: "artifacts/town-full.png", fullPage: true });
await page.locator("#start-btn").click();
await page.screenshot({ path: "artifacts/explore-full.png", fullPage: true });
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: "artifacts/explore-mobile.png", fullPage: true });
await browser.close();
