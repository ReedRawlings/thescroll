import { tapTowerTile } from "./tower-input.mjs";
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
await mkdir("artifacts/integration", { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(process.env.GAME_BASE_URL || "http://127.0.0.1:5173");
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForFunction(() => window.__scrollReady);
await page.evaluate(() => window.advanceTime(0));
const read = () =>
  page.evaluate(() => JSON.parse(window.render_game_to_text()));
const advance = (ms) => page.evaluate((ms) => window.advanceTime(ms), ms);
const click = (action) => page.locator(`[data-action="${action}"]`).click();
const snap = (name) =>
  page.screenshot({
    path: `artifacts/integration/${name}.png`,
    fullPage: true,
  });
assert.equal((await read()).engine.version, "4.2.1");
assert.equal((await read()).engine.renderer, "WebGL");
await snap("town");
await click("start");
await snap("explore");
const canvas = page.locator("canvas");
async function tile(x, y) {
  await tapTowerTile(page, x, y);
}
let testedPause = false,
  battles = 0;
async function fight() {
  for (let count = 0; count < 1000; count++) {
    const s = await read();
    if (s.mode !== "combat") return s;
    if (s.battle.phase === "command") {
      if (!testedPause) {
        await snap("combat");
        const before = s.battle;
        await advance(5000);
        const after = (await read()).battle;
        assert.equal(after.time, before.time);
        assert.deepEqual(after.units, before.units);
        await click("target-next");
        await click("ability-next");
        await click("ability-prev");
        testedPause = true;
      }
      // Free basic attack lets the expedition conserve MP for boss healing.
      let selection = (await read()).battle.selection;
      if (selection.actor.id === "rime") {
        const injured = s.party
          .filter((u) => u.hp > 0 && u.hp < u.maxHp - 25)
          .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
        if (injured && selection.actor.mp >= 4) {
          while (selection.ability.id !== "mend") {
            await click("ability-next");
            selection = (await read()).battle.selection;
          }
          for (let n = 0; n < 3 && selection.target.id !== injured.id; n++) {
            await click("target-next");
            selection = (await read()).battle.selection;
          }
        }
      }
      await click("confirm");
    } else await advance(300);
  }
  throw Error("Battle exceeded step budget");
}
async function handle() {
  let s = await read();
  if (s.mode === "combat") {
    s = await fight();
    battles++;
  }
  if (s.modal === "reward") {
    await click("continue");
    s = await read();
  }
  if (s.modal === "chest") {
    await click("close");
    s = await read();
  }
  return s;
}
async function walkTo(x, y) {
  for (let n = 0; n < 220; n++) {
    assert.deepEqual(errors, [], "Browser runtime errors");
    let s = await handle();
    if (s.mode === "ending") return s;
    if (s.modal === "stairs") return s;
    if (s.mode !== "explore")
      throw Error(`Unexpected mode ${s.mode} ${s.modal}`);
    if (Math.hypot(s.player.x - x, s.player.y - y) < 0.65) return s;
    if (!s.path.length) await tile(x, y);
    await advance(200); // Repath only after an interruption; let committed movement finish.
  }
  throw Error(`Could not reach ${x},${y}`);
}
async function recover() {
  const s = await read();
  if (s.mode !== "explore") return;
  for (let n = 0; n < 10; n++) {
    const now = await read();
    const hurt = now.party.find((u) => u.hp > 0 && u.hp < u.maxHp - 20);
    if (!hurt || !now.items.potion) break;
    await click("inventory");
    await page.locator('[data-action="item-potion"]').first().click();
    await page
      .locator(`[data-action="use-item"][data-id="${hurt.id}"]`)
      .click();
    await click("close");
  }
}
try {
  for (let floor = 1; floor <= 3; floor++) {
    let s = await read();
    assert.equal(s.floor, floor);
    // Visit every visible encounter to exercise movement, combat, reward and recovery.
    for (let n = 0; n < 12; n++) {
      s = await read();
      if (s.mode === "ending") break;
      const enemy = s.map.enemies.find((e) => !e.boss);
      if (!enemy) break;
      await walkTo(Math.round(enemy.x), Math.round(enemy.y));
      await handle();
      await recover();
    }
    s = await read();
    if (s.mode === "ending") break;
    for (const chest of s.map.chests.filter((c) => !c.opened)) {
      await walkTo(chest.approach?.x ?? chest.x, chest.approach?.y ?? chest.y);
      await handle();
      await recover();
    }
    s = await read();
    if (floor === 3) {
      const boss = s.map.enemies.find((e) => e.boss);
      if (boss) {
        await walkTo(Math.round(boss.x), Math.round(boss.y));
        await handle();
      }
    } else {
      await walkTo(s.map.stairs.x, s.map.stairs.y);
      s = await read();
      assert.equal(s.modal, "stairs");
      await click("climb");
    }
  }
  const final = await read();
  assert.ok(testedPause);
  assert.equal(final.mode, "ending");
  assert.equal(final.modal, "ending");
  assert.ok(
    await page.getByRole("heading", { name: "You found the way out." }).count(),
  );
  assert.deepEqual(errors, []);
  await snap("complete");
  console.log(
    JSON.stringify({ passed: true, battles, final, errors }, null, 2),
  );
} catch (e) {
  await snap("failure");
  console.error(
    JSON.stringify({ error: e.message, state: await read(), errors }, null, 2),
  );
  throw e;
} finally {
  await browser.close();
}
