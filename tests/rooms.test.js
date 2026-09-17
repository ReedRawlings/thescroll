import { test } from "node:test";
import assert from "node:assert/strict";
import { makeExamples } from "../src/rooms/examples.js";
import { pathfind } from "../src/dungeon.js";

test("authored room exits, rewards and every floor tile remain reachable after furnishing", () => {
  for (const room of makeExamples()) {
    for (let y = 0; y < room.height; y++)
      for (let x = 0; x < room.width; x++) {
        if (!room.tiles[y][x] || (x === room.spawn.x && y === room.spawn.y))
          continue;
        assert.ok(
          pathfind(room, room.spawn, { x, y }).length,
          `${room.id}: unreachable ${x},${y}`,
        );
      }
    for (const p of [room.exit, ...room.enemies, ...room.chests])
      assert.equal(room.tiles[p.y][p.x], 1);
    for (const route of room.routes)
      for (let i = 1; i < route.length; i++)
        assert.ok(pathfind(room, route[i - 1], route[i]).length);
  }
});
test("solid prop footprints match blocked geometry including two-tile tables", () => {
  for (const room of makeExamples())
    for (const prop of room.props.filter((p) => p.solid)) {
      for (let x = prop.x; x < prop.x + prop.width; x++)
        assert.equal(room.tiles[prop.y][x], 0);
    }
  assert.equal(
    makeExamples()
      .find((r) => r.id === "hall")
      .props.find((p) => p.key === "table").width,
    2,
  );
});
