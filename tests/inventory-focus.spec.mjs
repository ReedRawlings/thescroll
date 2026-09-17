import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const read = () =>
  page.evaluate(() => JSON.parse(window.render_game_to_text()));
const click = (a) => page.locator(`[data-action="${a}"]`).first().click();
const ready = async () => {
  await page.waitForFunction(() => window.__scrollReady);
  await page.evaluate(() => window.advanceTime(0));
};
await mkdir("artifacts/inventory-focus", { recursive: true });
try {
  await page.goto("http://127.0.0.1:5173/?capture=1");
  await ready();
  await click("start");
  await click("inventory");
  assert.equal((await read()).inventory.totalSlots, 10);
  assert.equal(await page.locator('[data-item="potion"]').count(), 2);
  await page.screenshot({ path: "artifacts/inventory-focus/bag.png" });
  await click("close");
  const exploration = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("scroll-demo-v1")),
  );
  await page.evaluate(async () => {
    const { createBattle, createEncounter } = await import("/src/combat.js");
    const s = JSON.parse(localStorage.getItem("scroll-demo-v1"));
    s.mode = "combat";
    s.battle = createBattle(s.party, createEncounter(2), 123);
    s.battle.phase = "command";
    s.battle.pendingActorId = s.party[0].id;
    sessionStorage.setItem("focus-fixture", JSON.stringify(s));
  });
  await page.addInitScript(() => {
    const fixture = sessionStorage.getItem("focus-fixture");
    if (fixture) {
      localStorage.setItem("scroll-demo-v1", fixture);
      sessionStorage.removeItem("focus-fixture");
    }
  });
  await page.reload();
  await ready();
  await click("resume");
  let s = await read();
  assert.equal(s.battle.visibleEnemyIds.length, 1);
  const first = s.battle.visibleEnemyIds[0];
  await click("target-next");
  s = await read();
  assert.notEqual(s.battle.visibleEnemyIds[0], first);
  for (const v of s.battle.enemyRendering)
    assert.equal(v.pixelScale, Math.round(v.pixelScale));
  await page.screenshot({ path: "artifacts/inventory-focus/focus-mobile.png" });
  await page.evaluate(async () => {
    const url = performance
      .getEntriesByType("resource")
      .map((e) => e.name)
      .find((u) => u.includes("/src/combat.js"));
    const { ABILITIES } = await import(url);
    ABILITIES.strike.target = "all";
  });
  await click("ability-next");
  await click("ability-prev");
  s = await read();
  assert.equal(s.battle.visibleEnemyIds.length, 2);
  await page.screenshot({ path: "artifacts/inventory-focus/all-mobile.png" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => window.advanceTime(1));
  s = await read();
  for (const v of s.battle.enemyRendering)
    assert.equal(v.pixelScale, Math.round(v.pixelScale));
  await page.screenshot({ path: "artifacts/inventory-focus/all-desktop.png" });
  const chest = exploration.map.chests[0];
  exploration.items = { potion: 5, tonic: 1, seed: 1 };
  exploration.player = { x: chest.x, y: chest.y };
  exploration.map.enemies = [];
  exploration.party[0].hp -= 20;
  await page.evaluate(
    (s) => sessionStorage.setItem("focus-fixture", JSON.stringify(s)),
    exploration,
  );
  await page.reload();
  await ready();
  await click("resume");
  await page.evaluate(() => window.advanceTime(20));
  s = await read();
  assert.equal(s.inventory.usedItemSlots, 7);
  assert.equal(s.gold, 15);
  assert.equal(s.map.chests[0].potion, true);
  await click("close");
  await click("inventory");
  await click("item-potion");
  await click("use-item");
  assert.equal((await read()).inventory.usedItemSlots, 6);
  await click("close");
  await page.evaluate(() => window.advanceTime(20));
  s = await read();
  assert.equal(s.inventory.usedItemSlots, 7);
  assert.equal(s.map.chests[0].potion, false);
  assert.equal(s.gold, 15);
  assert.deepEqual(errors, []);
  console.log(
    "Inventory slots, focused target cycling, ALL display, integer scaling on mobile/desktop passed.",
  );
} finally {
  await browser.close();
}
