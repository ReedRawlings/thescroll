import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
await mkdir("artifacts/rooms", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (e) => {
  if (e.type() === "error") errors.push(e.text());
});
const read = () =>
  page.evaluate(() => JSON.parse(window.render_game_to_text()));
const advance = (ms) => page.evaluate((ms) => window.advanceTime(ms), ms);
async function tile(x, y) {
  const b = await page.locator("canvas").boundingBox();
  await page.mouse.click(
    b.x + ((x + 0.5) * b.width) / 17,
    b.y + ((y + 0.5) * b.height) / 17,
  );
}
try {
  await page.goto("http://127.0.0.1:5174/?rooms=1&capture=1");
  await page.waitForFunction(() => window.__scrollReady);
  await advance(0);
  const saves = await page.evaluate(() => JSON.stringify(localStorage));
  for (let i = 0; i < 5; i++) {
    await page.locator(`[data-room="${i}"]`).click();
    const before = await read();
    assert.equal(before.mode, "room-review");
    await page
      .locator("canvas")
      .screenshot({ path: `artifacts/rooms/${before.room}-map.png` });
    await page.screenshot({
      path: `artifacts/rooms/${before.room}.png`,
      fullPage: true,
    });
    await page.locator("#decor").click();
    assert.equal((await read()).decorated, false);
    assert.deepEqual(
      (await read()).tiles,
      before.tiles,
      "decoration toggle never changes collision",
    );
    await page.locator("#routes").click();
    assert.equal((await read()).routes, true);
    if (i === 0)
      await page.screenshot({
        path: "artifacts/rooms/layout-routes.png",
        fullPage: true,
      });
    await page.locator("#decor").click();
    await page.locator("#routes").click();
  }
  await page.locator("#try").click();
  await tile(8, 4);
  await advance(4000);
  assert.ok(
    Math.abs((await read()).player.y - 4) < 0.1,
    "tap input reaches shrine interior",
  );
  await page.locator("#try").click();
  const frozen = (await read()).player;
  await advance(2000);
  assert.deepEqual((await read()).player, frozen);
  await page.locator('[data-room="3"]').click();
  await page.locator("#try").click();
  await tile(15, 8);
  await advance(3000);
  assert.match((await read()).message, /Contact/);
  assert.equal((await read()).running, false);
  await page.locator("#reset").click();
  assert.deepEqual((await read()).player, { x: 1, y: 8 });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-room="1"]').click();
  await page.screenshot({ path: "artifacts/rooms/mobile.png", fullPage: true });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "no mobile overflow",
  );
  await page.locator("#try").click();
  await tile(5, 11);
  await advance(1300);
  assert.ok(
    (await read()).player.x > 4.8,
    "mobile tap coordinates match canvas",
  );
  assert.equal(
    await page.evaluate(() => JSON.stringify(localStorage)),
    saves,
    "review leaves expedition saves unchanged",
  );
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ passed: true, rooms: 5, errors }));
} finally {
  await browser.close();
}
