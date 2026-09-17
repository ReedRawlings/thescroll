import { test } from "node:test";
import assert from "node:assert/strict";
import { generateBspFloor, reachable } from "../src/floors/generated.js";
import { footprint } from "../src/floors/dressing.js";
import { FLOOR_FRAMES, terrainSprites } from "../src/tileset/render.js";

test("BSP seeds preserve connected floors, clear doors, nonoverlapping content and room-local paths", () => {
  const geometry = new Set(),
    frames = new Set(),
    styles = new Set();
  for (let seed = 0; seed < 200; seed++) {
    const m = generateBspFloor(String(seed));
    geometry.add(JSON.stringify(m.terrain));
    assert.equal(m.rooms.length, 4);
    assert.equal(m.enemies.length, 3);
    assert.equal(m.chests.length, 1);
    assert.equal(
      reachable(m.tiles, m.spawn).size,
      m.tiles.flat().filter(Boolean).length,
    );
    const occupied = new Set();
    for (const p of [m.spawn, m.exit, ...m.enemies, ...m.chests]) {
      assert.equal(m.tiles[p.y][p.x], 1);
      assert.ok(!occupied.has(`${p.x},${p.y}`));
      occupied.add(`${p.x},${p.y}`);
    }
    for (const p of m.props.filter((p) => p.solid).flatMap(footprint)) {
      assert.equal(m.tiles[p.y][p.x], 0);
      assert.equal(m.terrain[p.y][p.x], 1);
      assert.ok(!occupied.has(`${p.x},${p.y}`));
      occupied.add(`${p.x},${p.y}`);
    }
    for (const d of m.doors)
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          if (m.terrain[d.y + dy]?.[d.x + dx])
            assert.equal(m.tiles[d.y + dy][d.x + dx], 1);
    for (const r of m.rooms) {
      styles.add(r.style);
      const local = m.tiles.map((row, y) =>
        row.map((v, x) =>
          x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h ? v : 0,
        ),
      );
      assert.equal(
        reachable(local, {
          x: r.x + Math.floor(r.w / 2),
          y: r.y + Math.floor(r.h / 2),
        }).size,
        local.flat().filter(Boolean).length,
      );
    }
    m.floorFrames
      .flat()
      .filter((v) => v !== null)
      .forEach((f) => frames.add(f));
  }
  assert.ok(geometry.size > 180);
  assert.equal(styles.size, 4);
  assert.deepEqual(
    [...frames].sort((a, b) => a - b),
    FLOOR_FRAMES,
  );
  assert.deepEqual(generateBspFloor("same"), generateBspFloor("same"));
});
test("wall renderer keeps top corner connectors and faces across middle span", () => {
  const terrain = Array.from({ length: 8 }, (_, y) =>
    Array.from({ length: 8 }, (_, x) =>
      x >= 2 && x <= 5 && y >= 2 && y <= 5 ? 1 : 0,
    ),
  );
  const sprites = terrainSprites(
    terrain,
    terrain.map((row) => row.map(() => 11)),
  );
  const at = (x, y) =>
    sprites.filter((s) => s.x === x && s.y === y).at(-1).frame;
  assert.equal(at(1, 1), 95);
  assert.equal(at(6, 1), 97);
  assert.equal(at(3, 1), 57);
  assert.equal(at(1, 0), 46);
  assert.equal(at(6, 0), 48);
  assert.equal(at(3, 6), 57);
  assert.ok(
    sprites.every(
      (s) => Number.isInteger(s.frame) && s.frame >= 0 && s.frame < 130,
    ),
  );
});

test('internal void boundaries omit faces but retain caps and outer bottom faces', () => {
  const terrain=Array.from({length:14},(_,y)=>Array.from({length:10},(_,x)=>x>=2&&x<=7&&((y>=2&&y<=4)||(y>=9&&y<=11))?1:0));
  const sprites=terrainSprites(terrain,terrain.map(row=>row.map(()=>11)));
  const at=(x,y)=>sprites.filter(s=>s.x===x&&s.y===y);
  assert.ok(at(4,4).some(s=>s.frame===47));
  assert.equal(at(4,5).length,0);
  assert.ok(at(4,8).some(s=>s.frame===57));
  assert.ok(at(4,12).some(s=>s.frame===57));
});
