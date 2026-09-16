import { test } from "node:test";
import assert from "node:assert/strict";
import { generateDungeon, pathfind, roomAt } from "../src/dungeon.js";
test("seed determines complete floor and different seeds vary geometry", () => {
  assert.deepEqual(generateDungeon("ember", 2), generateDungeon("ember", 2));
  assert.notDeepEqual(generateDungeon("ember", 2), generateDungeon("frost", 2));
});
test("100 seeds across all demo floors preserve connected, roomy exploration", () => {
  for (let seed = 0; seed < 100; seed++)
    for (let floor = 1; floor <= 3; floor++) {
      const map = generateDungeon(seed, floor);
      assert.ok(map.rooms.length >= 3 && map.rooms.length <= 4);
      assert.notEqual(
        roomAt(map, map.spawn.x, map.spawn.y).id,
        roomAt(map, map.stairs.x, map.stairs.y).id,
      );
      assert.ok(pathfind(map, map.spawn, map.stairs).length >= 15);
      for (let y = 0; y < map.height; y++)
        for (let x = 0; x < map.width; x++)
          if (map.tiles[y][x] && (x !== map.spawn.x || y !== map.spawn.y)) {
            const route = pathfind(map, map.spawn, { x, y });
            assert.ok(route.length > 0);
            for (const step of route)
              assert.equal(map.tiles[step.y][step.x], 1);
          }
      const occupied = new Set([
        `${map.spawn.x},${map.spawn.y}`,
        `${map.stairs.x},${map.stairs.y}`,
      ]);
      for (const obj of [...map.enemies, ...map.chests]) {
        assert.equal(map.tiles[obj.y][obj.x], 1);
        assert.equal(roomAt(map, obj.x, obj.y).id, obj.roomId);
        assert.ok(!occupied.has(`${obj.x},${obj.y}`));
        occupied.add(`${obj.x},${obj.y}`);
      }
      assert.equal(
        map.enemies.filter((e) => e.boss).length,
        floor === 3 ? 1 : 0,
      );
    }
});
test("BFS routes stay walkable, orthogonal and exclude start; invalid routes fail", () => {
  const map = generateDungeon("route");
  let previous = map.spawn;
  const route = pathfind(map, map.spawn, map.stairs);
  for (const p of route) {
    assert.equal(Math.abs(p.x - previous.x) + Math.abs(p.y - previous.y), 1);
    assert.equal(map.tiles[p.y][p.x], 1);
    previous = p;
  }
  assert.deepEqual(previous, map.stairs);
  assert.deepEqual(pathfind(map, map.spawn, map.spawn), []);
  assert.deepEqual(pathfind(map, map.spawn, { x: 0, y: 0 }), []);
  assert.equal(roomAt(map, 0, 0), null);
});

test("different seeds produce distinct shapes, bends, and treasure placement", () => {
  const shapes = new Set(),
    sizes = new Set(),
    treasure = new Set();
  for (let seed = 0; seed < 30; seed++) {
    const map = generateDungeon(seed, 1);
    shapes.add(JSON.stringify(map.tiles));
    sizes.add(map.rooms.map((r) => `${r.w}x${r.h}`).join(","));
    treasure.add(`${map.chests[0].x},${map.chests[0].y}`);
    for (const pillar of map.pillars)
      assert.equal(map.tiles[pillar.y][pillar.x], 0);
    for (const r of map.rooms) assert.ok(r.w >= 5 && r.h >= 6);
  }
  assert.ok(shapes.size >= 25);
  assert.ok(sizes.size >= 20);
  assert.ok(treasure.size >= 8);
});
test("every monster can pursue any walkable tile in its room without leaving it", () => {
  for (let seed = 0; seed < 30; seed++)
    for (let floor = 1; floor <= 3; floor++) {
      const map = generateDungeon(seed, floor);
      for (const enemy of map.enemies) {
        const room = map.rooms.find((r) => r.id === enemy.roomId);
        for (let y = room.y; y < room.y + room.h; y++)
          for (let x = room.x; x < room.x + room.w; x++)
            if (map.tiles[y][x]) {
              const route = pathfind(map, enemy, { x, y });
              if (x !== enemy.x || y !== enemy.y) assert.ok(route.length > 0);
              for (const step of route) {
                assert.equal(map.tiles[step.y][step.x], 1);
                assert.equal(roomAt(map, step.x, step.y).id, enemy.roomId);
              }
            }
      }
    }
});
