import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { generateDungeon, pathfind, roomAt } from "../src/dungeon.js";
import { hasLineOfSight } from "../src/exploration.js";

await mkdir("artifacts/pursuit", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (e) => {
  if (e.type() === "error") errors.push(e.text());
});
const read = () =>
  page.evaluate(() => JSON.parse(window.render_game_to_text()));
const advance = (ms) => page.evaluate((ms) => window.advanceTime(ms), ms);
const click = (action) => page.locator(`[data-action="${action}"]`).click();
const snap = (name) =>
  page.screenshot({ path: `artifacts/pursuit/${name}.png`, fullPage: true });
async function ready() {
  await page.waitForFunction(() => window.__scrollReady);
  await advance(0);
}
try {
  await page.goto("http://127.0.0.1:5173/?capture=1");
  await ready();
  await click("start");
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("scroll-demo-v1")),
  );
  // A generated-map save fixture isolates a real doorway/corridor transition.
  const map = generateDungeon("corridor-regression", 1);
  const source = map.rooms[1];
  const route = [
    { x: source.x + 2, y: source.y + 2 },
    ...pathfind(map, { x: source.x + 2, y: source.y + 2 }, map.spawn),
  ];
  const i = route.findIndex(
    (p, i) =>
      i > 0 &&
      roomAt(map, route[i - 1].x, route[i - 1].y)?.id === 1 &&
      !roomAt(map, p.x, p.y) &&
      route[i + 1] &&
      !roomAt(map, route[i + 1].x, route[i + 1].y) &&
      hasLineOfSight(map, route[i - 1], route[i + 1]),
  );
  assert.ok(i > 0, "fixture has a visible doorway into a corridor");
  const home = route[i - 1],
    player = route[i + 1];
  const enemy = {
    ...map.enemies[0],
    ...home,
    roomId: 1,
    homeX: home.x,
    homeY: home.y,
    path: [],
    alert: false,
  };
  const spectator = {
    ...map.enemies[1],
    homeX: map.enemies[1].x,
    homeY: map.enemies[1].y,
    path: [],
    alert: false,
  };
  // Keep an uninvolved enemy away from its home to detect post-battle teleporting.
  const neighbor = pathfind(map, spectator, map.spawn)[0];
  Object.assign(spectator, neighbor);
  map.enemies = [enemy, spectator];
  Object.assign(saved, {
    map,
    player,
    path: [],
    mode: "explore",
    battle: null,
    seed: "corridor-regression",
    floor: 1,
  });
  // Load after the previous page's pagehide save so that it cannot replace the fixture.
  await page.evaluate(
    (s) => sessionStorage.setItem("pursuit-fixture", JSON.stringify(s)),
    saved,
  );
  await page.addInitScript(() => {
    const fixture = sessionStorage.getItem("pursuit-fixture");
    if (fixture) {
      localStorage.setItem("scroll-demo-v1", fixture);
      sessionStorage.removeItem("pursuit-fixture");
    }
  });
  await page.reload();
  await ready();
  await click("resume");
  await advance(800);
  let s = await read();
  assert.equal(s.mode, "explore");
  let pursuing = s.map.enemies.find((e) => e.id === enemy.id);
  assert.equal(pursuing.alert, true);
  assert.equal(
    roomAt(map, Math.round(pursuing.x), Math.round(pursuing.y)),
    null,
    "enemy entered corridor",
  );
  await snap("corridor-chase");
  await click("pause");
  const paused = await read();
  await advance(2000);
  assert.deepEqual((await read()).map.enemies, paused.map.enemies);
  await click("title");
  await page.reload();
  await ready();
  await click("resume");
  assert.deepEqual(
    (await read()).map.enemies,
    paused.map.enemies,
    "pursuit survives reload",
  );
  const beforeBattle = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("scroll-demo-v1")),
  );
  await advance(300);
  s = await read();
  assert.equal(s.mode, "combat", "contact in corridor starts combat");
  const contactSave = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("scroll-demo-v1")),
  );
  const heldEnemy = contactSave.map.enemies.find((e) => e.id === spectator.id);
  assert.equal(
    roomAt(
      map,
      Math.round(contactSave.player.x),
      Math.round(contactSave.player.y),
    ),
    null,
  );
  await snap("corridor-contact");
  for (let n = 0; n < 900; n++) {
    s = await read();
    if (s.mode !== "combat") break;
    if (s.battle.phase === "command") await click("confirm");
    else await advance(300);
  }
  assert.equal((await read()).modal, "reward");
  await click("continue");
  const afterEnemy = (await read()).map.enemies.find(
    (e) => e.id === spectator.id,
  );
  assert.equal(afterEnemy.x, heldEnemy.x);
  assert.equal(afterEnemy.y, heldEnemy.y);
  assert.equal(afterEnemy.alert, heldEnemy.alert);
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      passed: true,
      doorway: home,
      corridor: player,
      preservedPursuit: beforeBattle.map.enemies[0].alert,
      errors,
    }),
  );
} finally {
  await browser.close();
}
