// Pure, serializable simulation. Time advances exactly to the next gauge/timer boundary.
export const TIER_RATES = { Fast: 0.56, Normal: 0.3, Slow: 0.226 };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const ability = (id, name, tier, type, atk, mp, extra = {}) => ({
  id,
  name,
  tier,
  type,
  atk,
  mp,
  target: "enemy",
  ...extra,
});
export const ABILITIES = {
  strike: ability("strike", "Quick strike", "Fast", "Normal", 5, 0),
  cleave: ability("cleave", "Cleave", "Normal", "Normal", 18, 3),
  crush: ability("crush", "Crushing blow", "Slow", "Normal", 32, 5),
  ember: ability("ember", "Ember", "Normal", "Fire", 18, 3, {
    augment: { status: "burn", chance: 0.65 },
  }),
  inferno: ability("inferno", "Inferno", "Slow", "Fire", 32, 5),
  frost: ability("frost", "Frost shard", "Normal", "Ice", 18, 3, {
    augment: { status: "frost", chance: 0.8 },
  }),
  mend: ability("mend", "Mend", "Normal", "Normal", 0, 4, {
    target: "ally",
    heal: 28,
  }),
  bash: ability("bash", "Stunning bash", "Normal", "Normal", 18, 3, {
    augment: { status: "stun", chance: 0.5 },
  }),
  spark: ability("spark", "Spark", "Normal", "Lightning", 18, 3, {
    augment: { status: "shock", chance: 0.7 },
  }),
};
function unit(
  id,
  name,
  side,
  texture,
  type,
  hp,
  mp,
  atk,
  def,
  baseSpd,
  abilities,
  level = 1,
) {
  return {
    id,
    name,
    side,
    texture,
    type,
    hp,
    maxHp: hp,
    mp,
    maxMp: mp,
    atk,
    def,
    baseSpd,
    bonus: 0,
    level,
    abilities,
  };
}
export function createParty() {
  return [
    unit("hero", "Wayfarer", "party", "hero", "Normal", 96, 22, 15, 16, 48, [
      "strike",
      "cleave",
      "crush",
    ]),
    unit(
      "emberling",
      "Emberling",
      "party",
      "familiarFire",
      "Fire",
      72,
      26,
      13,
      10,
      57,
      ["strike", "ember", "inferno"],
    ),
    unit("rime", "Rime", "party", "familiarIce", "Ice", 78, 28, 11, 14, 42, [
      "strike",
      "frost",
      "mend",
    ]),
  ];
}
export function createEncounter(floor, boss = false) {
  floor = clamp(Math.trunc(floor) || 1, 1, 3);
  if (boss)
    return [
      Object.assign(
        unit(
          "warden",
          "Ash Warden",
          "enemy",
          "boss",
          "Fire",
          190,
          60,
          17,
          20,
          38,
          ["strike", "ember", "crush"],
          floor,
        ),
        { rotation: ["strike", "ember", "crush"], rotationIndex: 0 },
      ),
    ];
  return [
    Object.assign(
      unit(
        "slime",
        "Rime slime",
        "enemy",
        "slime",
        "Ice",
        32 + floor * 8,
        10,
        7 + floor * 2,
        8,
        28,
        ["strike", "frost"],
        floor,
      ),
      { weights: [4, 1] },
    ),
    Object.assign(
      unit(
        "prowler",
        floor === 1 ? "Cave bat" : "Bone sentry",
        "enemy",
        floor === 1 ? "bat" : "skeleton",
        "Normal",
        28 + floor * 9,
        10,
        6 + floor * 2,
        10,
        43,
        ["strike", "bash"],
        floor,
      ),
      { weights: [4, 1] },
    ),
  ];
}
export function effectiveSpeed(u, enemyAvgLevel) {
  const base = clamp(u.baseSpd, 1, 99);
  return (
    (30 + (70 * base) / (base + 50) + 0.25 * u.bonus) *
    (u.side === "party"
      ? clamp(1 + 0.03 * ((u.battleLevel ?? u.level) - enemyAvgLevel), 0.7, 1.3)
      : 1) *
    (u.statuses?.frost ? 0.8 : 1)
  );
}
export function damage(a, d, move) {
  const beats = { Fire: "Ice", Ice: "Lightning", Lightning: "Fire" };
  const type = move.type ?? a.type;
  const mod = beats[type] === d.type ? 1.25 : beats[d.type] === type ? 0.75 : 1;
  return Math.max(
    1,
    Math.round(
      (((a.atk + move.atk) * 100) /
        (100 + d.def * (d.statuses?.shock ? 0.8 : 1))) *
        clamp(1 + (a.level - d.level) * 0.02, 0.5, 1.5) *
        mod,
    ),
  );
}
const alive = (u) => u.hp > 0;
function random(b) {
  b.seed = (Math.imul(1664525, b.seed) + 1013904223) >>> 0;
  return b.seed / 4294967296;
}
function emit(b, event) {
  b.events.push({ time: b.time, ...event });
  if (b.events.length > 120) b.events.shift();
}
export function createBattle(party, enemies, seed = 1) {
  const b = {
    units: [...party, ...enemies],
    phase: "running",
    pendingActorId: null,
    events: [],
    time: 0,
    seed: seed >>> 0,
    enemyAvgLevel:
      enemies.reduce((s, u) => s + u.level, 0) / (enemies.length || 1),
  };
  for (const u of b.units) {
    Object.assign(u, {
      position: 0,
      state: alive(u) ? "WAIT" : "DEAD",
      queued: null,
      statuses: {},
      battleLevel: u.level,
      completedTurns: 0,
    });
    u.effectiveSpd = effectiveSpeed(u, b.enemyAvgLevel);
  }
  settle(b);
  return b;
}
function targets(b, u, a) {
  return b.units.filter(
    (t) =>
      alive(t) && (a.target === "ally" ? t.side === u.side : t.side !== u.side),
  );
}
function settle(b) {
  for (const u of b.units)
    if (!alive(u)) {
      u.hp = 0;
      u.state = "DEAD";
      u.queued = null;
      u.position = 0;
    }
  const party = b.units.filter((u) => u.side === "party");
  if (!party.some(alive)) b.phase = "lost";
  else if (!b.units.some((u) => u.side === "enemy" && alive(u)))
    b.phase = "won";
  else {
    const ready = b.units.find(
      (u) => alive(u) && u.side === "party" && u.state === "COM",
    );
    b.phase = ready ? "command" : "running";
    b.pendingActorId = ready?.id ?? null;
  }
  if (b.phase === "won" || b.phase === "lost") b.pendingActorId = null;
}
function queue(b, u, a, t) {
  u.mp -= a.mp;
  u.queued = { abilityId: a.id, targetId: t.id };
  u.state = "CHARGE";
  emit(b, {
    type: "charge",
    actorId: u.id,
    targetId: t.id,
    abilityId: a.id,
    text: `${u.name} readies ${a.name}`,
  });
}
export function chooseAbility(b, abilityId, targetId) {
  if (b.phase !== "command") return false;
  const u = b.units.find((u) => u.id === b.pendingActorId),
    a = ABILITIES[abilityId];
  if (!u || !alive(u) || !a || !u.abilities.includes(abilityId) || u.mp < a.mp)
    return false;
  const t = targets(b, u, a).find((t) => t.id === targetId);
  if (!t) return false;
  queue(b, u, a, t);
  settle(b);
  return true;
}
export function previewAction(b, abilityId, targetId) {
  const u = b.units.find((u) => u.id === b.pendingActorId),
    a = ABILITIES[abilityId],
    t = b.units.find((u) => u.id === targetId);
  if (!u || !a || !t) return { valid: false, damage: 0, healing: 0 };
  return {
    valid:
      alive(u) &&
      u.abilities.includes(abilityId) &&
      u.mp >= a.mp &&
      targets(b, u, a).includes(t),
    damage: a.heal ? 0 : damage(u, t, a),
    healing: a.heal
      ? Math.min(t.maxHp - t.hp, a.heal + Math.round(u.atk * 0.5))
      : 0,
    chargeSeconds: 30 / (u.effectiveSpd * TIER_RATES[a.tier]),
    mpCost: a.mp,
    statusChance: a.augment?.chance ?? 0,
  };
}
function enemyCommand(b, u) {
  const legal = u.abilities
    .map((id) => ABILITIES[id])
    .filter(
      (a) =>
        a &&
        a.mp <= u.mp &&
        targets(b, u, a).some((t) => !a.heal || t.hp < t.maxHp),
    );
  let a;
  if (u.rotation) {
    a = ABILITIES[u.rotation[u.rotationIndex++ % u.rotation.length]];
    if (!legal.includes(a)) a = legal[0];
  } else {
    let roll =
      random(b) *
      legal.reduce(
        (s, a) => s + (u.weights?.[u.abilities.indexOf(a.id)] ?? 1),
        0,
      );
    a = legal.find(
      (a) => (roll -= u.weights?.[u.abilities.indexOf(a.id)] ?? 1) < 0,
    );
  }
  a ??= ABILITIES.strike;
  const ts = targets(b, u, a).filter((t) => !a.heal || t.hp < t.maxHp);
  if (!ts.length) {
    u.state = "WAIT";
    u.position = 0;
    return;
  }
  queue(b, u, a, ts[Math.floor(random(b) * ts.length)]);
}
export function applyStatus(b, u, status, tier = "Normal") {
  if (!alive(u)) return;
  if (status === "stun")
    u.statuses.stun = { seconds: { Fast: 1, Normal: 1.5, Slow: 2 }[tier] };
  else
    u.statuses[status] = {
      turns: status === "burn" ? 2 : status === "frost" ? 1 : null,
    };
  u.effectiveSpd = effectiveSpeed(u, b.enemyAvgLevel);
  emit(b, {
    type: "status",
    targetId: u.id,
    status,
    text: `${u.name}: ${status}`,
  });
}
function resolve(b, u) {
  const a = ABILITIES[u.queued.abilityId];
  const ts = targets(b, u, a);
  const t = ts.find((t) => t.id === u.queued.targetId) ?? ts[0];
  for (const target of a.target === "all" ? ts : [t].filter(Boolean)) {
    const t = target;
    const amount = a.heal
      ? Math.min(t.maxHp - t.hp, a.heal + Math.round(u.atk * 0.5))
      : damage(u, t, a);
    t.hp += a.heal ? amount : -amount;
    if (!a.heal) delete t.statuses.shock;
    emit(b, {
      type: a.heal ? "heal" : "damage",
      actorId: u.id,
      targetId: t.id,
      amount,
      abilityId: a.id,
      text: `${u.name} → ${t.name}: ${a.heal ? "+" : "−"}${amount}`,
    });
    if (a.augment && alive(t) && random(b) < a.augment.chance)
      applyStatus(b, t, a.augment.status, a.tier);
  }
  u.completedTurns++;
  if (u.statuses.burn) {
    u.hp -= 4;
    delete u.statuses.shock;
    emit(b, {
      type: "burn",
      targetId: u.id,
      amount: 4,
      text: `${u.name} burns for 4`,
    });
  }
  for (const [key, status] of Object.entries(u.statuses))
    if (status.turns && --status.turns <= 0) delete u.statuses[key];
  u.effectiveSpd = effectiveSpeed(u, b.enemyAvgLevel);
  u.position = 0;
  u.state = "WAIT";
  u.queued = null;
  settle(b);
}
export function stepBattle(b, dt) {
  settle(b);
  let remaining = Number.isFinite(dt) ? Math.max(0, dt) : 0;
  while (b.phase === "running" && remaining > 1e-9) {
    const live = b.units.filter(alive);
    let slice = remaining;
    for (const u of live) {
      if (u.statuses.stun) slice = Math.min(slice, u.statuses.stun.seconds);
      else {
        const rate =
          u.effectiveSpd *
          (u.state === "CHARGE"
            ? TIER_RATES[ABILITIES[u.queued.abilityId].tier]
            : 0.8);
        slice = Math.min(
          slice,
          Math.max(0, ((u.state === "CHARGE" ? 100 : 70) - u.position) / rate),
        );
      }
    }
    for (const u of live) {
      if (u.statuses.stun) {
        u.statuses.stun.seconds -= slice;
        if (u.statuses.stun.seconds <= 1e-9) delete u.statuses.stun;
      } else
        u.position +=
          u.effectiveSpd *
          (u.state === "CHARGE"
            ? TIER_RATES[ABILITIES[u.queued.abilityId].tier]
            : 0.8) *
          slice;
    }
    b.time += slice;
    remaining -= slice;
    // Simultaneous boundaries: resolve ACT in roster order, then expose every COM.
    for (const u of live)
      if (alive(u) && u.state === "CHARGE" && u.position >= 100 - 1e-8) {
        resolve(b, u);
        if (b.phase === "won" || b.phase === "lost") return b;
      }
    for (const u of live)
      if (alive(u) && u.state === "WAIT" && u.position >= 70 - 1e-8) {
        u.position = 70;
        u.state = "COM";
        if (u.side === "enemy") enemyCommand(b, u);
      }
    settle(b);
  }
  return b;
}
