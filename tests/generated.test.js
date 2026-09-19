import { test } from "node:test";
import assert from "node:assert/strict";
import { generateBspFloor, reachable } from "../src/floors/generated.js";
import { footprint } from "../src/floors/dressing.js";
import { FLOOR_FRAMES, terrainSprites } from "../src/tileset/render.js";

test("BSP seeds preserve connected floors, clear doors, nonoverlapping content and room-local paths", () => {
  const roomCounts = new Set(),
    geometry = new Set(),
    frames = new Set(),
    styles = new Set();
  for (let seed = 0; seed < 200; seed++) {
    const m = generateBspFloor(String(seed));
    geometry.add(JSON.stringify(m.terrain));
    roomCounts.add(m.rooms.length);
    assert.ok(m.rooms.length >= 4 && m.rooms.length <= 6);
    for (const r of m.rooms) assert.ok(r.w >= 5 && r.h >= 5);
    assert.ok(m.enemies.length >= m.rooms.length - 1);
    assert.equal(m.chests.length, 1);
    assert.equal(
      reachable(m.tiles, m.spawn).size,
      m.tiles.flat().filter(Boolean).length,
    );
    const occupied = new Set();
    for (const p of [
      m.spawn,
      m.exit,
      ...m.enemies,
      ...m.chests.map((c) => c.approach),
    ]) {
      assert.equal(m.tiles[p.y][p.x], 1);
      assert.ok(!occupied.has(`${p.x},${p.y}`));
      occupied.add(`${p.x},${p.y}`);
    }
    for (const p of [
      ...m.props.filter((p) => p.solid).flatMap(footprint),
      ...m.chests,
    ]) {
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
  assert.deepEqual([...roomCounts].sort(), [4, 5, 6]);
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

test("internal void boundaries omit faces but retain caps and outer bottom faces", () => {
  const terrain = Array.from({ length: 14 }, (_, y) =>
    Array.from({ length: 10 }, (_, x) =>
      x >= 2 && x <= 7 && ((y >= 2 && y <= 4) || (y >= 9 && y <= 11)) ? 1 : 0,
    ),
  );
  const sprites = terrainSprites(
    terrain,
    terrain.map((row) => row.map(() => 11)),
  );
  const at = (x, y) => sprites.filter((s) => s.x === x && s.y === y);
  assert.ok(at(4, 4).some((s) => s.frame === 47));
  assert.equal(at(4, 5).length, 0);
  assert.ok(at(4, 8).some((s) => s.frame === 57));
  assert.ok(at(4, 12).some((s) => s.frame === 57));
});

test("reviewed asset groups preserve orientation and valid supports", async () => {
  const { ASSET_RULES } = await import("../src/floors/asset-rules.js");
  assert.equal(Object.keys(ASSET_RULES).length, 69);
  for (let seed = 0; seed < 80; seed++) {
    const m = generateBspFloor(`review-${seed}`);
    for (const p of [...m.props, ...m.wallDecor]) {
      assert.ok(ASSET_RULES[p.file]);
      assert.equal(p.rotation, 0);
      assert.equal(p.solid, ASSET_RULES[p.file].blocks.startsWith("Yes"));
      assert.ok(!/Botton|Key.png|Acid puddle|Door/.test(p.file));
      if (p.support)
        assert.ok(
          m.props.some(
            (q) =>
              q.solid &&
              q.file === p.support.file &&
              q.x === p.support.x &&
              q.y === p.support.y,
          ),
        );
      if (p.near)
        assert.ok(
          m.props.some(
            (q) =>
              q.solid &&
              q.file === p.near.file &&
              q.x === p.near.x &&
              q.y === p.near.y,
          ),
        );
    }
    for (const r of m.rooms) {
      assert.ok(
        m.wallDecor.filter(
          (p) => p.roomId === r.id && p.file.startsWith("Paiting"),
        ).length <= 1,
      );
      const colors = new Set(
        m.wallDecor
          .filter((p) => p.roomId === r.id && p.file.startsWith("Flag"))
          .map((p) => p.file.split(" ")[1]),
      );
      assert.ok(colors.size <= 1);
    }
    for (const p of m.wallDecor) {
      assert.equal(m.terrain[p.y][p.x], 0);
      assert.equal(m.terrain[p.y + 1][p.x], 1);
    }
  }
});
test("solid chest is approached by tapping and rewards once while opening", async () => {
  const { startFloor, movePlayer, tickFloor } =
    await import("../src/floors/model.js");
  const m = generateBspFloor("chest-review");
  m.enemies = [];
  const s = startFloor(0, m),
    c = m.chests[0];
  s.running = true;
  assert.equal(m.tiles[c.y][c.x], 0);
  assert.equal(movePlayer(s, c), true);
  assert.ok(!s.path.some((p) => p.x === c.x && p.y === c.y));
  for (let i = 0; i < 3000 && !c.opened; i++) tickFloor(s, 0.05);
  assert.equal(c.opened, true);
  assert.equal(s.potions, 5);
  for (let i = 0; i < 30; i++) tickFloor(s, 0.05);
  assert.equal(c.openProgress, 0.6);
  assert.equal(s.potions, 5);
  assert.equal(m.tiles[c.y][c.x], 0);
});

test("room flooring has a dominant field and connected walkable doorway paving", () => {
  for (let seed = 0; seed < 100; seed++) {
    const m = generateBspFloor(`floor-design-${seed}`);
    for (const design of m.floorDesigns) {
      const r = m.rooms[design.roomId];
      const counts = new Map();
      for (let y = r.y; y < r.y + r.h; y++)
        for (let x = r.x; x < r.x + r.w; x++) {
          const f = m.floorFrames[y][x];
          counts.set(f, (counts.get(f) || 0) + 1);
        }
      assert.ok(counts.size <= 5, "limited materials per room");
      assert.ok(counts.get(design.base) >= r.area * 0.2);
      const paving = m.tiles.map((row) => row.map(() => 0));
      for (const p of design.path) {
        assert.equal(m.tiles[p.y][p.x], 1);
        assert.equal(m.floorFrames[p.y][p.x], design.pathFrame);
        paving[p.y][p.x] = 1;
      }
      assert.equal(
        design.path.length ? reachable(paving, design.path[0]).size : 0,
        design.path.length,
      );
      for (const d of m.doors.filter(
        (d) => d.roomId === r.id && design.routeStyle !== "unmarked",
      ))
        assert.equal(paving[d.y][d.x], 1);
    }
  }
});

test("14001 keeps irregular room footprints, varied routes and more encounters", () => {
  const m = generateBspFloor("14001");
  assert.ok(m.rooms.filter((r) => r.area < r.w * r.h).length >= 4);
  assert.equal(new Set(m.floorDesigns.map((d) => d.routeStyle)).size, 3);
  assert.ok(m.enemies.length >= 5);
  assert.equal(new Set(m.enemies.map((e) => e.id)).size, m.enemies.length);
  for (let y = 0; y < m.height; y++)
    for (let x = 0; x < m.width; x++)
      if (!m.terrain[y][x]) assert.equal(m.floorFrames[y][x], null);
});
