import { test } from "node:test";
import assert from "node:assert/strict";
import { generateExpeditionFloor } from "../src/floors/expedition.js";
import { reachable } from "../src/floors/generated.js";
test("main expeditions use distinct BSP floors and a reachable final guardian", () => {
  for (let seed = 0; seed < 100; seed++) {
    const floors = [1, 2, 3].map((f) =>
      generateExpeditionFloor(String(seed), f),
    );
    assert.equal(new Set(floors.map((m) => JSON.stringify(m.terrain))).size, 3);
    floors.forEach((m, i) => {
      assert.equal(m.generated, true);
      assert.equal(m.floor, i + 1);
      assert.equal(m.enemies.filter((e) => e.boss).length, i === 2 ? 1 : 0);
      const reached = reachable(m.tiles, m.spawn);
      for (const e of m.enemies) assert.ok(reached.has(`${e.x},${e.y}`));
    });
    const boss = floors[2].enemies.find((e) => e.boss);
    assert.equal(floors[2].rooms[boss.roomId].role, "stairs");
  }
});
