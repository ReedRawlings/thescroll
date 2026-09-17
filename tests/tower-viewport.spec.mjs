import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const read = () =>
  page.evaluate(() => JSON.parse(window.render_game_to_text()));
const advance = (ms) => page.evaluate((ms) => window.advanceTime(ms), ms);
const ready = async () => {
  await page.waitForFunction(() => window.__scrollReady);
  await advance(0);
};
const click = (a) => page.locator(`[data-action="${a}"]`).first().click();
async function tile(x, y) {
  const s = await read(),
    v = s.viewport,
    b = await page.locator("canvas").boundingBox();
  await page.mouse.click(
    b.x + ((v.x + v.worldOffset.x + (x + 0.5) * v.tileSize) * b.width) / 440,
    b.y + ((v.y + v.worldOffset.y + (y + 0.5) * v.tileSize) * b.height) / 820,
  );
}
function centered(s) {
  const v = s.viewport;
  assert.equal(v.tilesAcross, 11);
  assert.equal(v.radius, 5);
  assert.ok(Math.abs(v.worldOffset.x + (s.player.x - 5) * 32) < 1);
  assert.ok(Math.abs(v.worldOffset.y + (s.player.y - 5) * 32) < 1);
}
await mkdir("artifacts/tower-viewport", { recursive: true });
try {
  await page.goto("http://127.0.0.1:5173/?capture=1");
  await ready();
  await click("start");
  // Controlled open floor verifies edge centering and movement across the viewport.
  const fixture = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("scroll-demo-v1")),
  );
  fixture.map.tiles = Array.from({ length: 25 }, (_, y) =>
    Array.from({ length: 19 }, (_, x) =>
      x > 0 && x < 18 && y > 0 && y < 24 ? 1 : 0,
    ),
  );
  fixture.map.enemies = [];
  fixture.map.chests = [];
  fixture.player = { x: 2, y: 2 };
  fixture.path = [];
  await page.addInitScript((s) => {
    if (!sessionStorage.getItem("viewport-fixture")) {
      localStorage.setItem("scroll-demo-v1", JSON.stringify(s));
      sessionStorage.setItem("viewport-fixture", "1");
    }
  }, fixture);
  await page.reload();
  await ready();
  await click("resume");
  centered(await read());
  await page.screenshot({ path: "artifacts/tower-viewport/edge-desktop.png" });
  await tile(6, 2);
  await advance(1500);
  let s = await read();
  assert.equal(s.player.x, 6);
  centered(s);
  await tile(10, 6);
  await advance(3000);
  s = await read();
  assert.equal(s.player.x, 10);
  assert.equal(s.player.y, 6);
  centered(s);
  await page.setViewportSize({ width: 390, height: 844 });
  await advance(0);
  centered(await read());
  await tile(11, 6);
  await advance(500);
  s = await read();
  assert.equal(s.player.x, 11);
  centered(s);
  await page.screenshot({ path: "artifacts/tower-viewport/follow-mobile.png" });
  // Click below the camera, above the footer: must not enqueue movement.
  const box = await page.locator("canvas").boundingBox();
  await page.mouse.click(
    box.x + (220 * box.width) / 440,
    box.y + (610 * box.height) / 820,
  );
  assert.equal((await read()).path.length, 0);
  await click("pause");
  await click("title");
  await page.reload();
  await ready();
  await click("resume");
  centered(await read());
  assert.equal((await read()).player.x, 11);
  await page.goto("http://127.0.0.1:5173/?floors=1");
  await ready();
  await page.locator("#play").click();
  await advance(0);
  const f = await read();
  assert.ok(Math.abs(640 / f.camera.zoom / 16 - 11) < 1e-6);
  await page.screenshot({
    path: "artifacts/tower-viewport/floor-play-mobile.png",
  });
  assert.deepEqual(errors, []);
  console.log(
    "11x11 viewport, edge centering, following, mobile taps, bounds, resume, floor Play camera passed.",
  );
} finally {
  await browser.close();
}
