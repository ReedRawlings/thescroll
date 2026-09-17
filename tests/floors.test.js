import { test } from "node:test";
import assert from "node:assert/strict";
import { makeFloors, floorMetrics } from "../src/floors/layouts.js";
import { pathfind } from "../src/dungeon.js";
import { footprint } from "../src/floors/dressing.js";
import {
  startFloor,
  movePlayer,
  tickFloor,
  useSupply,
  command,
} from "../src/floors/model.js";

test("five complete floor plans have distinct geometry, reachable areas and meaningful routes", () => {
  const floors = makeFloors();
  assert.equal(floors.length, 5);
  assert.equal(new Set(floors.map((m) => JSON.stringify(m.tiles))).size, 5);
  for (const m of floors) {
    assert.ok(floorMetrics(m).entranceToStairs > 30, m.id);
    const reached = new Set(),
      queue = [m.spawn];
    while (queue.length) {
      const p = queue.pop(),
        key = `${p.x},${p.y}`;
      if (reached.has(key)) continue;
      reached.add(key);
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ])
        if (m.tiles[p.y + dy]?.[p.x + dx])
          queue.push({ x: p.x + dx, y: p.y + dy });
    }
    assert.equal(reached.size, m.tiles.flat().filter(Boolean).length, m.id);
    for (const p of [m.spawn, m.exit, ...m.enemies, ...m.chests])
      assert.equal(m.tiles[p.y]?.[p.x], 1, `${m.id}: content on wall`);
    assert.ok(
      floorMetrics(m).lootDetours.some((d) => d > 0),
      m.id,
    );
    const routes = m.routes.map((points) =>
      points.slice(1).flatMap((p, i) => pathfind(m, points[i], p)),
    );
    assert.notDeepEqual(routes[0], routes[1], m.id);
    for (const route of routes) assert.ok(route.length > 0);
    assert.deepEqual(
      makeFloors("other")[floors.indexOf(m)].tiles,
      m.tiles,
      "surface-detail variation preserves topology",
    );
  }
});
test("floor furnishings have complete collision footprints and leave route anchors clear", () => {
  for (const m of makeFloors()) {
    const occupied = new Set();
    for (const p of m.props.filter((p) => p.solid)) {
      for (const c of footprint(p)) {
        const key = `${c.x},${c.y}`;
        assert.equal(m.tiles[c.y]?.[c.x], 0, `${m.id}: unblocked furniture`);
        assert.ok(!occupied.has(key), `${m.id}: overlapping furniture`);
        occupied.add(key);
      }
    }
    for (const p of m.routes.flat())
      assert.equal(m.tiles[p.y]?.[p.x], 1, `${m.id}: blocked route anchor`);
    for (const r of m.rugs)
      for (const c of footprint(r))
        assert.ok(
          m.tiles[c.y]?.[c.x] || occupied.has(`${c.x},${c.y}`),
          `${m.id}: rug outside floor`,
        );
  }
});
function heal(s) {
  for (const u of s.party)
    while (u.hp > 0 && u.hp < u.maxHp - 25 && s.potions)
      useSupply(s, "potion", u.id);
}
function fight(s) {
  for (let n = 0; n < 50000 && s.mode === "combat"; n++) {
    const b = s.battle,
      actor = b.units.find((u) => u.id === b.pendingActorId);
    if (b.phase === "command") {
      const hurt = s.party
        .filter((u) => u.hp > 0 && u.hp < u.maxHp - 25)
        .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      if (actor.abilities.includes("mend") && actor.mp >= 4 && hurt)
        command(s, "mend", hurt.id);
      else
        command(
          s,
          "strike",
          b.units.find((u) => u.side === "enemy" && u.hp > 0).id,
        );
    } else tickFloor(s, 0.1);
  }
  assert.notEqual(s.mode, "combat");
  assert.notEqual(s.mode, "defeat");
  heal(s);
  s.running = true;
}
function walk(s, p) {
  for (let n = 0; n < 20000; n++) {
    if (s.mode === "combat") {
      fight(s);
      continue;
    }
    if (s.mode === "complete") return;
    assert.equal(s.mode, "explore");
    s.running = true;
    if (Math.hypot(s.player.x - p.x, s.player.y - p.y) < 0.2) return;
    if (!s.path.length) movePlayer(s, p);
    tickFloor(s, 0.05);
  }
  throw Error(
    "Walk exceeded limit: " +
      JSON.stringify({
        floor: s.map.id,
        p,
        player: s.player,
        path: s.path,
        mode: s.mode,
      }),
  );
}
test("every floor supports loot, combat, resource use and reaching the stairs", () => {
  for (let i = 0; i < 5; i++) {
    const s = startFloor(i);
    s.running = true;
    for (const chest of s.map.chests) {
      walk(s, chest);
      if (s.mode === "combat") fight(s);
    }
    for (let n = 0; n < 20 && s.map.enemies.length; n++) {
      const e = s.map.enemies[0];
      walk(s, { x: Math.round(e.x), y: Math.round(e.y) });
      if (s.mode === "combat") fight(s);
    }
    walk(s, s.map.exit);
    tickFloor(s, 0.05);
    assert.equal(s.mode, "complete", s.map.id);
    assert.ok(s.wins > 0);
    assert.equal(s.map.chests.filter((c) => c.opened).length, 3);
  }
});
