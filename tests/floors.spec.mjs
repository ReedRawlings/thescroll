import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { pathfind } from "../src/dungeon.js";
await mkdir("artifacts/floors", { recursive: true });
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
const click = (id) => page.locator("#" + id).click();
async function tile(p) {
  const state = await read(),
    c = state.camera,
    b = await page.locator("canvas").boundingBox();
  const x = ((p.x + 0.5) * 16 - c.scrollX - 320) * c.zoom + 320,
    y = ((p.y + 0.5) * 16 - c.scrollY - 320) * c.zoom + 320;
  assert.ok(x >= 0 && x <= 640 && y >= 0 && y <= 640, "target inside camera");
  await page.mouse.click(b.x + (x * b.width) / 640, b.y + (y * b.height) / 640);
}
async function heal() {
  const state = await read();
  if (state.mode !== "explore") return;
  for (const u of state.party) {
    let now = await read();
    while (
      u.hp > 0 &&
      now.party.find((p) => p.id === u.id).hp < u.maxHp - 25 &&
      now.potions
    ) {
      await page.locator("#supply-target").selectOption(u.id);
      await page.locator('[data-supply="potion"]').click();
      now = await read();
    }
  }
}
let pauseChecked = false;
async function fight() {
  for (let n = 0; n < 1600; n++) {
    let state = await read();
    if (state.mode !== "combat") {
      assert.notEqual(state.mode, "defeat");
      await heal();
      return;
    }
    if (state.battle.phase === "command") {
      if (!pauseChecked) {
        const frozen = state.battle;
        await advance(3000);
        assert.deepEqual((await read()).battle, frozen);
        await page.screenshot({
          path: "artifacts/floors/combat.png",
          fullPage: true,
        });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.screenshot({ path: "artifacts/floors/mobile-combat.png", fullPage: true });
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await page.setViewportSize({ width: 1440, height: 1100 });
        pauseChecked = true;
      }
      const actor = state.battle.units.find(
          (u) => u.id === state.battle.pendingActorId,
        ),
        hurt = state.party
          .filter((u) => u.hp > 0 && u.hp < u.maxHp - 25)
          .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      if (actor.abilities.includes("mend") && actor.mp >= 4 && hurt) {
        await page.locator('[data-ability="mend"]').click();
        await page.locator("#target").selectOption(hurt.id);
      } else await page.locator('[data-ability="strike"]').click();
      await click("confirm");
    } else await advance(350);
  }
  throw Error("Fight budget exceeded");
}
async function walk(target) {
  for (let n = 0; n < 900; n++) {
    let state = await read();
    if (state.mode === "combat") {
      await fight();
      continue;
    }
    if (state.mode === "complete") return;
    assert.equal(state.mode, "explore");
    if (!state.running) {
      await click("play");
      state = await read();
    }
    if (Math.hypot(state.player.x - target.x, state.player.y - target.y) < 0.2)
      return;
    const route = pathfind(
      state.map,
      { x: Math.round(state.player.x), y: Math.round(state.player.y) },
      target,
    );
    if (!state.path.length)
      await tile(route[Math.min(3, route.length - 1)] ?? target);
    await advance(300);
  }
  throw Error("Walk budget exceeded");
}
try {
  await page.goto("http://127.0.0.1:5174/?floors=1&capture=1");
  await page.waitForFunction(() => window.__scrollReady);
  await advance(0);
  const saved = await page.evaluate(() => JSON.stringify(localStorage));
  for (let i = 0; i < 5; i++) {
    await page.locator(`[data-floor="${i}"]`).click();
    let state = await read();
    await page.screenshot({
      path: `artifacts/floors/${state.floor}.png`,
      fullPage: true,
    });
    await page
      .locator("canvas")
      .screenshot({ path: `artifacts/floors/${state.floor}-map.png` });
    const geometry = state.map.tiles;
    await click("decor");
    assert.deepEqual((await read()).map.tiles, geometry);
    await click("routes");
    await click("labels");
    if (i === 0)
      await page.screenshot({
        path: "artifacts/floors/structure.png",
        fullPage: true,
      });
    await click("decor");
    await click("routes");
    await click("labels");
    if (i === 3) {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({
        path: "artifacts/floors/mobile-overview.png",
        fullPage: true,
      });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
    }
    await click("play");
    await advance(0);
    state = await read();
    await walk(state.map.chests[0]);
    const boss = (await read()).map.enemies.find((e) => e.boss);
    if (boss) {
      await walk(boss);
      if ((await read()).mode === "combat") await fight();
    }
    if (i === 3)
      await page.screenshot({
        path: "artifacts/floors/mobile-play.png",
        fullPage: true,
      });
    await walk((await read()).map.exit);
    await advance(100);
    assert.equal((await read()).mode, "complete");
    console.log(
      JSON.stringify({
        floor: state.floor,
        complete: true,
        gold: (await read()).gold,
      }),
    );
    await page.setViewportSize({ width: 1440, height: 1100 });
  }
  assert.ok(pauseChecked);
  assert.deepEqual(errors, []);
  assert.equal(await page.evaluate(() => JSON.stringify(localStorage)), saved);
  await click("next");
  assert.equal((await read()).floor, "cloister");
  await click("reset");
  assert.equal((await read()).mode, "explore");
  console.log(JSON.stringify({ passed: true, floors: 5, errors }));
} catch (e) {
  await page.screenshot({
    path: "artifacts/floors/failure.png",
    fullPage: true,
  });
  console.log(JSON.stringify(await read()));
  throw e;
} finally {
  await browser.close();
}
