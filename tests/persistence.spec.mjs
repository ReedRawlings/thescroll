import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
await mkdir("artifacts/persistence", { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const read = () =>
  page.evaluate(() => JSON.parse(window.render_game_to_text()));
const advance = (ms) => page.evaluate((ms) => window.advanceTime(ms), ms);
const click = (a) => page.locator(`[data-action="${a}"]`).click();
const snap = (n) =>
  page.screenshot({ path: `artifacts/persistence/${n}.png`, fullPage: true });
async function ready() {
  await page.waitForFunction(() => window.__scrollReady);
  await advance(0);
}
async function tile(x, y) {
  const b = await page.locator("canvas").boundingBox();
  await page.mouse.click(
    b.x + ((58.5 + (x + 0.5) * 17) * b.width) / 440,
    b.y + ((198 + (y + 0.5) * 17) * b.height) / 820,
  );
}
async function walk(x, y, stopOnCombat = false) {
  for (let i = 0; i < 300; i++) {
    let s = await read();
    if (s.mode === "combat") {
      if (stopOnCombat) return s;
      await fight();
      continue;
    }
    if (s.modal === "reward") {
      await click("continue");
      continue;
    }
    if (s.modal === "chest") {
      await click("close");
      continue;
    }
    if (s.modal === "stairs") return s;
    assert.equal(s.mode, "explore");
    if (Math.hypot(s.player.x - x, s.player.y - y) < 0.15) return s;
    if (!s.path.length) await tile(x, y);
    await advance(200);
  }
  throw Error("Walk step budget exceeded");
}
async function fight() {
  for (let i = 0; i < 900; i++) {
    const s = await read();
    if (s.mode !== "combat") return s;
    if (s.battle.phase === "command") await click("confirm");
    else await advance(300);
  }
  throw Error("Battle step budget exceeded");
}
try {
  await page.goto("http://127.0.0.1:5173");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await ready();
  await click("start");
  let s = await read();
  const p = s.player;
  const adjacent = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]
    .map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy }))
    .find((p) => s.map.tiles[p.y]?.[p.x] === 1);
  await tile(adjacent.x, adjacent.y);
  await advance(400);
  await click("pause");
  const saved = await read();
  await snap("paused-mobile");
  await click("title");
  await page.reload();
  await ready();
  await click("resume");
  s = await read();
  assert.equal(s.seed, saved.seed);
  assert.equal(s.floor, saved.floor);
  assert.deepEqual(s.player, saved.player);
  assert.deepEqual(s.party, saved.party);
  assert.equal(s.mode, "explore");
  const size = await page.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
    canvas: document.querySelector("canvas").getBoundingClientRect().toJSON(),
  }));
  assert.ok(size.scroll <= size.width);
  assert.ok(
    size.canvas.x >= 0 &&
      size.canvas.right <= size.width &&
      size.canvas.y >= 0 &&
      size.canvas.bottom <= 844,
  );
  await snap("resumed-mobile");
  s = await read();
  const target = s.map.enemies[0];
  await walk(target.x, target.y, true);
  for (let i = 0; i < 100 && (await read()).battle?.phase !== "command"; i++)
    await advance(200);
  const frozen = await read();
  assert.equal(frozen.battle.phase, "command");
  await page.reload();
  await ready();
  await click("resume");
  s = await read();
  assert.equal(s.battle.phase, "command");
  assert.deepEqual(s.battle.units, frozen.battle.units);
  const time = s.battle.time;
  await advance(5000);
  s = await read();
  assert.equal(s.battle.time, time);
  assert.deepEqual(s.battle.units, frozen.battle.units);
  await snap("command-reloaded");
  const initialAbility = (await read()).battle.selection.ability.id;
  const abilityBox = await page.locator("#ability-swipe").boundingBox();
  await page.mouse.move(
    abilityBox.x + abilityBox.width - 25,
    abilityBox.y + 20,
  );
  await page.mouse.down();
  await page.mouse.move(abilityBox.x + 25, abilityBox.y + 20, { steps: 5 });
  await page.mouse.up();
  assert.notEqual(
    (await read()).battle.selection.ability.id,
    initialAbility,
    "ability swipe changes selection",
  );
  await click("ability-prev");
  assert.equal((await read()).battle.selection.ability.id, initialAbility);
  const oldTarget = (await read()).battle.selection.target.id;
  const canvasBox = await page.locator("canvas").boundingBox();
  await page.mouse.move(
    canvasBox.x + (250 * canvasBox.width) / 440,
    canvasBox.y + (380 * canvasBox.height) / 820,
  );
  await page.mouse.down();
  await page.mouse.move(
    canvasBox.x + (150 * canvasBox.width) / 440,
    canvasBox.y + (380 * canvasBox.height) / 820,
    { steps: 5 },
  );
  await page.mouse.up();
  assert.notEqual(
    (await read()).battle.selection.target.id,
    oldTarget,
    "target swipe changes selection",
  );
  await click("target-prev");
  await fight();
  s = await read();
  assert.equal(s.modal, "reward");
  await page.reload();
  await ready();
  await click("resume");
  assert.equal(
    (await read()).modal,
    "reward",
    "reward reload reconstructs Continue dialog",
  );
  await click("continue");
  s = await read();
  assert.ok(s.gold > 0);
  const stairs = s.map.stairs;
  await walk(stairs.x, stairs.y);
  assert.equal((await read()).modal, "stairs");
  await click("close");
  await advance(800);
  assert.equal(
    (await read()).modal,
    null,
    "Keep exploring must not immediately reopen stairs",
  );
  await snap("stairs-dismissed");
  // A visible enemy can legitimately catch the stationary player once the modal closes.
  if ((await read()).mode === "combat") {
    await fight();
    await click("continue");
  }
  s = await read();
  const gold = s.gold;
  await click("extract");
  await click("extract-confirm");
  s = await read();
  assert.equal(s.mode, "ending");
  assert.equal(s.bankedGold, gold);
  await snap("extracted");
  await click("town");
  await page.reload();
  await ready();
  s = await read();
  assert.equal(s.mode, "town");
  assert.equal(s.bankedGold, gold);
  await snap("banked-town");
  assert.deepEqual(errors, []);
  const result = {
    passed: true,
    seed: saved.seed,
    bankedGold: gold,
    checks: [
      "movement/title/reload/resume",
      "command reload and freeze",
      "ability and target swipes",
      "reward reload and continue",
      "stairs dismiss latch",
      "extraction bank persistence",
      "390x844 viewport",
    ],
    errors,
  };
  await writeFile(
    "artifacts/persistence/result.json",
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result));
} catch (error) {
  await snap("failure");
  console.error(
    JSON.stringify({ error: error.message, state: await read(), errors }),
  );
  throw error;
} finally {
  await browser.close();
}
