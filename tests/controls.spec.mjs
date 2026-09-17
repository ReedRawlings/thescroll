import { tapTowerTile } from "./tower-input.mjs";
import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
await fs.mkdir("artifacts/controls", { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
const snapshot = () =>
  p.evaluate(() => JSON.parse(window.render_game_to_text()));
await p.goto("http://127.0.0.1:5173");
await p.waitForFunction(() => window.__scrollReady);
assert.equal(
  await p.locator("#toast").evaluate((e) => getComputedStyle(e).display),
  "none",
);
await p.locator("#start-btn").click();
const s = await snapshot();
const tiles = s.map.tiles;
let target = { x: Math.round(s.player.x), y: Math.round(s.player.y) };
for (const [dx, dy] of [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
])
  if (tiles[target.y + dy]?.[target.x + dx] === 1) {
    target = { x: target.x + dx, y: target.y + dy };
    break;
  }
const canvas = p.locator("canvas");
const rect = await canvas.boundingBox();
await tapTowerTile(p, target.x, target.y);
await p.waitForTimeout(600);
assert(
  Math.hypot(
    (await snapshot()).player.x - s.player.x,
    (await snapshot()).player.y - s.player.y,
  ) > 0.5,
  "real-time movement progresses",
);
await p.keyboard.press("Escape");
const frozen = (await snapshot()).player;
await p.waitForTimeout(500);
assert.deepEqual((await snapshot()).player, frozen);
await p.keyboard.press("Escape");
assert.equal((await snapshot()).modal, null);
await p.keyboard.press("f");
await p.waitForTimeout(500);
assert(
  await p.evaluate(() => !!document.fullscreenElement),
  "fullscreen enters",
);
await p.screenshot({ path: "artifacts/controls/fullscreen.png" });
const fullState = await snapshot();
const fullTarget = {
  x: Math.round(fullState.player.x) - 1,
  y: Math.round(fullState.player.y),
};
const fullBox = await canvas.boundingBox();
await tapTowerTile(p, fullTarget.x, fullTarget.y);
await p.waitForTimeout(600);
assert(
  Math.hypot(
    (await snapshot()).player.x - fullTarget.x,
    (await snapshot()).player.y - fullTarget.y,
  ) < 0.2,
  "fullscreen pointer maps correctly",
);

await p.keyboard.press("f");
await p.waitForTimeout(250);
assert(
  !(await p.evaluate(() => document.fullscreenElement)),
  "fullscreen exits",
);
// A low-health save fixture isolates the wipe UI without relying on balance or repeated grinding.
const saved = await p.evaluate(() =>
  JSON.parse(localStorage.getItem("scroll-demo-v1")),
);
saved.party.forEach((u) => {
  u.hp = 1;
  u.baseSpd = 1;
  u.atk = 0;
});
const e = saved.map.enemies[0];
saved.player = { x: e.x, y: e.y };
saved.runGold = 25;
saved.path = [];
await p.addInitScript(
  (s) => localStorage.setItem("scroll-demo-v1", JSON.stringify(s)),
  saved,
);
await p.reload();
await p.waitForFunction(() => window.__scrollReady);
await p.evaluate(() => window.advanceTime(0));
await p.locator("#start-btn").click();
for (let i = 0; i < 100; i++) {
  await p.evaluate(() => window.advanceTime(1000));
  const now = await snapshot();
  if (now.mode === "ending") break;
  if (now.battle?.phase === "command") {
    await p.locator('[data-action="ability-next"]').click();
    await p.locator('[data-action="confirm"]').click();
  }
}
const end = await snapshot();
assert.equal(end.mode, "ending");
assert.equal(end.bankedGold, 0);
assert.equal(
  await p.evaluate(() => localStorage.getItem("scroll-demo-v1")),
  null,
);
assert.equal(end.party.filter((u) => u.hp > 0).length, 0);
await p.screenshot({ path: "artifacts/controls/wipe.png" });
assert.deepEqual(errors, []);
await fs.writeFile(
  "artifacts/controls/result.json",
  JSON.stringify(
    {
      passed: [
        "real-time movement",
        "pause and resume",
        "fullscreen toggle",
        "whole-party wipe UI and save deletion using low-health fixture",
        "no initial blank toast",
      ],
      errors,
    },
    null,
    2,
  ),
);
await b.close();
console.log("Controls and wipe checks passed");
