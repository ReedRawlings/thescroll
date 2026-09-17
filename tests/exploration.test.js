import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hasLineOfSight,
  updateEnemies,
  enemyInContact,
} from "../src/exploration.js";

const fixture = () => ({
  tiles: [
    "00000000000000000",
    "01110001110000000",
    "01111111111111110",
    "01110001110000000",
    "00000000000000000",
  ].map((row) => [...row].map(Number)),
  rooms: [
    { id: 0, x: 1, y: 1, w: 3, h: 3 },
    { id: 1, x: 7, y: 1, w: 3, h: 3 },
  ],
  enemies: [
    {
      id: "slime",
      x: 3,
      y: 2,
      roomId: 0,
      homeX: 3,
      homeY: 2,
      path: [],
      alert: false,
    },
  ],
});

test("sight crosses doorways but not walls or blocked diagonal corners", () => {
  const m = fixture();
  assert.ok(hasLineOfSight(m, { x: 3, y: 2 }, { x: 6, y: 2 }));
  assert.ok(!hasLineOfSight(m, { x: 3, y: 1 }, { x: 7, y: 1 }));
  assert.ok(!hasLineOfSight(m, { x: 3, y: 1 }, { x: 4, y: 2 }));
  const e = m.enemies[0];
  e.y = 1;
  updateEnemies(m, { x: 5, y: 2 }, 0.1);
  assert.equal(
    e.alert,
    false,
    "a nearby player behind a wall does not alert the enemy",
  );
});

test("enemy detects in corridor and pursues through another room without a room leash", () => {
  const m = fixture(),
    e = m.enemies[0];
  updateEnemies(m, { x: 5, y: 2 }, 0.8);
  assert.equal(e.alert, true);
  assert.ok(e.x > 4 && e.x < 7, "enemy entered corridor");
  updateEnemies(m, { x: 8, y: 2 }, 2);
  assert.ok(e.x >= 7, "enemy entered the next room");
  assert.ok(enemyInContact(m, { x: 8, y: 2 }, e));
  assert.equal(
    e.roomId,
    0,
    "spawn room is metadata, not current room or leash",
  );
});

test("corridor contact triggers encounter independent of spawn room", () => {
  const m = fixture(),
    e = m.enemies[0];
  e.x = 5;
  assert.ok(enemyInContact(m, { x: 5.4, y: 2 }, e));
  assert.ok(!enemyInContact(m, { x: 6, y: 2 }, e));
});

test("gaining distance breaks pursuit and enemy walks home across corridor", () => {
  const m = fixture(),
    e = m.enemies[0];
  e.x = 7;
  e.alert = true;
  updateEnemies(m, { x: 15, y: 2 }, 0.5);
  assert.equal(e.alert, false);
  assert.ok(e.x < 7 && e.x > 3, "returns by walking instead of teleporting");
  updateEnemies(m, { x: 15, y: 2 }, 4);
  assert.deepEqual({ x: e.x, y: e.y }, { x: 3, y: 2 });
  updateEnemies(m, { x: 5, y: 2 }, 0.1);
  assert.equal(e.alert, true, "can detect the player again after returning");
});

test("suspended mid-step pursuit resumes deterministically and routes around walls", () => {
  const m = fixture(),
    e = m.enemies[0];
  e.alert = true;
  const player = { x: 8, y: 1 };
  updateEnemies(m, player, 0.3);
  const restored = JSON.parse(JSON.stringify(m));
  for (let i = 0; i < 210; i++) {
    updateEnemies(m, player, 1 / 60);
    updateEnemies(restored, player, 1 / 60);
    assert.equal(m.tiles[Math.round(e.y)][Math.round(e.x)], 1);
  }
  assert.deepEqual(m, restored);
  assert.ok(enemyInContact(m, player, e));
});
