import test from "node:test";
import assert from "node:assert/strict";
import {
  ABILITIES,
  createParty,
  createEncounter,
  createBattle,
  effectiveSpeed,
  damage,
  stepBattle,
  chooseAbility,
  applyStatus,
} from "../src/combat.js";
const fixture = () => createBattle(createParty(), createEncounter(1), 9);
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);
test("speed curve, clamping, party-only level factor, additive damage and type", () => {
  const u = { ...createParty()[0], baseSpd: 50, bonus: 0, level: 20 };
  close(effectiveSpeed(u, 20), 65);
  close(effectiveSpeed(u, 40), 45.5);
  close(effectiveSpeed({ ...u, side: "enemy" }, 40), 65);
  assert.equal(
    damage(
      { ...u, atk: 50 },
      { def: 20, level: 20, type: "Normal" },
      { atk: 15, type: "Normal" },
    ),
    54,
  );
  assert.equal(
    damage(
      { ...u, atk: 50 },
      { def: 20, level: 20, type: "Ice" },
      { atk: 15, type: "Fire" },
    ),
    68,
  );
});
test("all party COM commands freeze gauges and stun timers; simultaneous COM queues", () => {
  const b = fixture();
  for (const u of b.units) u.effectiveSpd = 50;
  stepBattle(b, 1.75);
  assert.equal(b.phase, "command");
  assert.equal(b.pendingActorId, "hero");
  applyStatus(b, b.units[3], "stun");
  const before = JSON.stringify(b);
  stepBattle(b, 10);
  assert.equal(JSON.stringify(b), before);
  assert.equal(chooseAbility(b, "strike", "slime"), true);
  assert.equal(b.pendingActorId, "emberling");
  chooseAbility(b, "strike", "slime");
  assert.equal(b.pendingActorId, "rime");
  chooseAbility(b, "strike", "slime");
  assert.equal(b.phase, "running");
  close(b.units[0].position, 70);
  stepBattle(b, 0.1);
  close(b.units[0].position, 72.8);
});
test("Frost preserves position, expires on own ACT; burn ticks twice; stun consumes simulation seconds", () => {
  const b = fixture(),
    u = b.units[0];
  u.position = 35;
  const speed = u.effectiveSpd;
  applyStatus(b, u, "frost");
  close(u.position, 35);
  close(u.effectiveSpd, speed * 0.8);
  applyStatus(b, u, "stun", "Fast");
  stepBattle(b, 0.4);
  close(u.position, 35);
  close(u.statuses.stun.seconds, 0.6);
  delete u.statuses.stun;
  applyStatus(b, u, "burn");
  for (const other of b.units.slice(1)) {
    other.position = 0;
    other.effectiveSpd = 1;
  }
  const hp = u.hp;
  for (let n = 0; n < 2; n++) {
    u.state = "CHARGE";
    u.queued = { abilityId: "strike", targetId: "slime" };
    u.position = 99;
    stepBattle(b, 0.2);
  }
  assert.equal(u.hp, hp - 8);
  assert.equal(u.statuses.burn, undefined);
  assert.equal(u.statuses.frost, undefined);
  close(u.effectiveSpd, speed);
});
test("dead target retargets; dead charged actor cannot act; victory and full-party defeat", () => {
  const b = fixture(),
    u = b.units[0];
  b.units[3].hp = 0;
  u.state = "CHARGE";
  u.position = 99;
  u.queued = { abilityId: "strike", targetId: "slime" };
  const target = b.units[4],
    hp = target.hp;
  stepBattle(b, 0.1);
  assert.ok(target.hp < hp);
  assert.equal(b.units[3].state, "DEAD");
  target.hp = 0;
  stepBattle(b, 0.1);
  assert.equal(b.phase, "won");
  const loss = fixture();
  loss.units[0].hp = 0;
  stepBattle(loss, 0.1);
  assert.equal(loss.phase, "running");
  for (const member of loss.units.filter((u) => u.side === "party"))
    member.hp = 0;
  stepBattle(loss, 0.1);
  assert.equal(loss.phase, "lost");
  const dead = fixture();
  const familiar = dead.units[1];
  familiar.state = "CHARGE";
  familiar.position = 99;
  familiar.queued = { abilityId: "inferno", targetId: "slime" };
  familiar.hp = 0;
  stepBattle(dead, 0.1);
  assert.equal(familiar.queued, null);
  assert.equal(dead.events.length, 0);
});
test("MP validation, reference identity, deterministic replays and battle-start speed level", () => {
  const p = createParty(),
    b = createBattle(p, createEncounter(1));
  assert.equal(b.units[0], p[0]);
  b.units[0].position = 70;
  b.units[0].state = "COM";
  stepBattle(b, 0);
  b.units[0].mp = 0;
  assert.equal(chooseAbility(b, "crush", "slime"), false);
  assert.equal(chooseAbility(b, "strike", "slime"), true);
  const initial = b.units[0].effectiveSpd;
  b.units[0].level = 99;
  applyStatus(b, b.units[0], "frost");
  close(b.units[0].effectiveSpd, initial * 0.8);
  const replay = () => {
    const x = fixture();
    for (let i = 0; i < 1000 && !["won", "lost"].includes(x.phase); i++) {
      if (x.phase === "command") {
        const target = x.units.find((u) => u.side === "enemy" && u.hp > 0);
        chooseAbility(x, "strike", target.id);
      } else stepBattle(x, 0.1);
    }
    return x;
  };
  assert.deepEqual(replay(), replay());
  assert.equal(replay().phase, "won");
  assert.equal(ABILITIES.strike.mp, 0);
});

test("long frames stop exactly at first party COM without advancing queued actors", () => {
  const b = fixture();
  const t = 70 / (b.units[1].effectiveSpd * 0.8);
  stepBattle(b, 60);
  assert.equal(b.phase, "command");
  assert.equal(b.pendingActorId, "emberling");
  close(b.time, t);
  close(b.units[1].position, 70);
  assert.equal(b.events.filter((e) => e.type === "damage").length, 0);
});
test("JSON suspend at COM and mid-charge resumes with identical gauges, choices and RNG", () => {
  const original = fixture();
  stepBattle(original, 10);
  const restored = JSON.parse(JSON.stringify(original));
  stepBattle(restored, 100);
  assert.deepEqual(restored, original);
  for (const b of [original, restored]) chooseAbility(b, "ember", "slime");
  stepBattle(original, 0.1);
  stepBattle(restored, 0.1);
  assert.deepEqual(restored, original);
  const charged = JSON.parse(JSON.stringify(original));
  for (let n = 0; n < 500; n++) {
    for (const b of [original, charged]) {
      if (b.phase === "command")
        chooseAbility(
          b,
          "strike",
          b.units.find((u) => u.side === "enemy" && u.hp > 0).id,
        );
      else stepBattle(b, 0.05);
    }
    assert.deepEqual(charged, original);
    if (["won", "lost"].includes(original.phase)) break;
  }
  assert.equal(original.phase, "won");
});

test("ALL attacks hit every living enemy for a single MP cost", () => {
  ABILITIES.testAll = { ...ABILITIES.cleave, id: "testAll", target: "all" };
  try {
    const b = createBattle(createParty(), createEncounter(2), 9);
    const hero = b.units.find((u) => u.id === "hero");
    hero.abilities.push("testAll");
    b.phase = "command";
    b.pendingActorId = hero.id;
    hero.position = 70;
    const mp = hero.mp;
    assert.equal(
      chooseAbility(b, "testAll", b.units.find((u) => u.side === "enemy").id),
      true,
    );
    for (
      let i = 0;
      i < 1000 &&
      !b.events.some((e) => e.abilityId === "testAll" && e.type === "damage");
      i++
    ) {
      if (b.phase === "command") {
        const actor = b.units.find((u) => u.id === b.pendingActorId);
        chooseAbility(
          b,
          actor.abilities[0],
          b.units.find((u) => u.side === "enemy" && u.hp > 0).id,
        );
      } else stepBattle(b, 0.05);
    }
    assert.equal(
      b.events.filter((e) => e.abilityId === "testAll" && e.type === "damage")
        .length,
      2,
    );
    assert.equal(hero.mp, mp - ABILITIES.testAll.mp);
  } finally {
    delete ABILITIES.testAll;
  }
});
