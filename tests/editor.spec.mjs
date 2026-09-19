import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
await mkdir("artifacts/editor", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:5174/?editor=1");
await page.waitForFunction(() => window.render_game_to_text);
const read = () =>
  page.evaluate(() => JSON.parse(window.render_game_to_text()));
async function tile(x, y) {
  const c = page.locator("canvas");
  await c.scrollIntoViewIfNeeded();
  const b = await c.boundingBox();
  await page.mouse.click(
    b.x + ((x + 0.5) * b.width) / 18,
    b.y + ((y + 0.5) * b.height) / 18,
  );
}
await page.locator('[data-example="Reading room"]').click();
assert.deepEqual((await read()).issues, []);
await page.locator("#name").fill("Test library");
await page.locator("#name").blur();
await page.locator("#usage").selectOption("template");
await page.locator("#save").click();
assert.equal((await read()).savedRooms, 1);
const id = (await read()).room.id;
await page.reload();
await page.waitForFunction(() => window.render_game_to_text);
assert.equal((await read()).room.id, id);
assert.equal((await read()).room.name, "Test library");
await page.locator("#walk").click();
await tile(8, 5);
await page.evaluate(() => window.advanceTime(3000));
assert.deepEqual((await read()).player, { x: 8, y: 5 });
await tile(5, 4);
await page.evaluate(() => window.advanceTime(1000));
assert.deepEqual((await read()).player, { x: 8, y: 5 });
await page.screenshot({ path: "artifacts/editor/walk.png", fullPage: true });
await page.locator("#walk").click();
await page.locator('[data-tool="floor"]').click();
await tile(3, 8);
assert.equal((await read()).room.terrain[8][3], 1);
await page.locator("#undo").click();
assert.equal((await read()).room.terrain[8][3], 0);
await page.locator('canvas').focus();
await page.keyboard.press('Meta+Shift+z');
assert.equal((await read()).room.terrain[8][3],1);
await page.keyboard.press('Meta+z');
assert.equal((await read()).room.terrain[8][3],0);
await page.keyboard.press('Control+y');
assert.equal((await read()).room.terrain[8][3],1);
await page.keyboard.press('Control+z');
assert.equal((await read()).room.terrain[8][3],0);
await page.locator('[data-tool="replace"]').click();
await page.locator('#search').fill('Book shelf 02');
await page.getByRole('button',{name:'Book shelf 02',exact:true}).click();
await tile(5,4);
assert.ok((await read()).room.props.some(p=>p.x===5&&p.y===4&&p.file==='Book shelf 02.png'));
await page.keyboard.press('Meta+z');
assert.ok((await read()).room.props.some(p=>p.x===5&&p.y===4&&p.file==='Book shelf 01.png'));
await page.keyboard.press('Meta+Shift+z');
assert.ok((await read()).room.props.some(p=>p.x===5&&p.y===4&&p.file==='Book shelf 02.png'));
await page.locator('[data-tool="enemy"]').click();
await tile(9, 10);
assert.ok(
  (await read()).room.markers.some(
    (p) => p.kind === "enemy" && p.x === 9 && p.y === 10,
  ),
);
await page.locator("#search").fill("Vase Yellow");
await page.getByRole("button", { name: "Vase Yellow", exact: true }).click();
await tile(10, 10);
assert.ok(
  (await read()).room.props.some(
    (p) => p.file === "Vase Yellow.png" && p.x === 10,
  ),
);
await page.locator('[data-tool="remove"]').click();
await tile(10, 10);
assert.ok(
  !(await read()).room.props.some(
    (p) => p.file === "Vase Yellow.png" && p.x === 10,
  ),
);
await page.locator('[data-tool="entrance"]').click();
await tile(8,3);
assert.ok((await read()).room.markers.some(p=>p.kind==='entrance'&&p.x===8&&p.y===3));
await page.locator('#walk').click();await tile(8,3);
await page.evaluate(()=>window.advanceTime(5000));
assert.deepEqual((await read()).player,{x:8,y:3});
await page.locator('#walk').click();
await page.locator('[data-tool="ledge"]').click();await tile(10,11);
await page.locator('[data-tool="void"]').click();await tile(10,11);
assert.equal((await read()).room.terrain[11][10],-1);
assert.ok((await read()).room.props.some(p=>p.file==='Raised wall middle.png'&&p.x===10&&p.y===11));
await tile(11,11);assert.equal((await read()).room.terrain[11][11],-1);
await page.keyboard.press('Meta+z');assert.equal((await read()).room.terrain[11][11],1);
await page.locator('#category').selectOption('Door / connector');
await page.locator('#search').fill('');
await page.getByRole('button',{name:'Door Closed',exact:true}).click();
await tile(10,3);
assert.ok((await read()).doorways.some(p=>p.x===11&&p.y===3));
await page.locator('#walk').click();await tile(11,3);
await page.evaluate(()=>window.advanceTime(5000));
assert.deepEqual((await read()).player,{x:11,y:3});
await page.locator('#walk').click();
await page.locator('#category').selectOption('Stairs');
await page.locator('#search').fill('small left');
await page.getByRole('button',{name:'Stairs small left',exact:true}).click();
await tile(12,10);
await page.locator('[data-tool="void"]').click();await tile(12,10);await tile(12,11);
assert.ok((await read()).room.props.some(p=>p.file==='Stairs small left.png'&&p.x===12&&p.y===10));
await page.reload();await page.waitForFunction(()=>window.render_game_to_text);
assert.ok((await read()).room.props.some(p=>p.file==='Stairs small left.png'&&p.x===12&&p.y===10));
assert.equal((await read()).room.terrain[10][12],-1);
await page.locator('#walk').click();await tile(12,10);
await page.evaluate(()=>window.advanceTime(5000));assert.deepEqual((await read()).player,{x:12,y:10});
await page.locator('#walk').click();
const download = page.waitForEvent("download");
await page.locator("#export").click();
const file = await download;
await file.saveAs("artifacts/editor/export.json");
await page.locator('[data-example="blank"]').click();
await page.locator("#file").setInputFiles("artifacts/editor/export.json");
await page.waitForFunction(
  () => JSON.parse(window.render_game_to_text()).room.name === "Test library",
);
await page
  .locator("#file")
  .setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from("{}"),
  });
await page.waitForFunction(() =>
  document.querySelector("#status").textContent.includes("not a supported"),
);
assert.equal((await read()).room.name, "Test library");
await page.locator("#search").fill("");
await page.screenshot({ path: "artifacts/editor/desktop.png", fullPage: true });
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: "artifacts/editor/mobile.png", fullPage: true });
assert.ok(
  await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
);
assert.deepEqual(errors, []);
console.log(
  "Editor passed: painting, undo, assets, markers, collision, walking, persistence, export/import, mobile.",
);
await browser.close();
