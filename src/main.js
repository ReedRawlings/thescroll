import Phaser from "phaser";
import "./style.css";
import { ASSETS } from "./assets.js";
import { generateDungeon, pathfind, roomAt, seededRandom } from "./dungeon.js";
import {
  MOVEMENT,
  approach,
  enemyInContact,
  updateEnemies,
} from "./exploration.js";
import {
  ABILITIES,
  createParty,
  createEncounter,
  createBattle,
  stepBattle,
  chooseAbility,
  previewAction,
} from "./combat.js";

const W = 440,
  H = 820,
  TILE = 32,
  VIEW_TILES = 11,
  VIEW_RADIUS = 5,
  VIEW_SIZE = VIEW_TILES * TILE,
  MAP_X = (W - VIEW_SIZE) / 2,
  MAP_Y = 230;
const ITEM_SLOTS = 7; // Ten starting slots: three equipment plus seven items.
const usedSlots = (items) =>
  Object.values(items).reduce((sum, count) => sum + count, 0);
let displayScale = 1;
const SAVE = "scroll-demo-v1",
  META = "scroll-meta-v1";
const $ = (s) => document.querySelector(s);
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let meta = { gold: 0, levels: [1, 1], runs: 0, wins: 0 };
try {
  meta = { ...meta, ...JSON.parse(localStorage.getItem(META) || "{}") };
} catch {}
let state = {
  mode: "town",
  party: newParty(),
  floor: 1,
  seed: "",
  map: null,
  player: null,
  path: [],
  battle: null,
  runGold: 0,
  items: { potion: 2, tonic: 1, seed: 1 },
  journal: [],
  victories: 0,
};
let modal = null,
  scene,
  game,
  selectedAbility = 0,
  selectedTarget = 0,
  lastActor = null,
  lastUI = "",
  toastTime = 0,
  saveClock = 0,
  manualClock = false,
  fxQueue = [],
  resumeState = null;
try {
  resumeState = JSON.parse(localStorage.getItem(SAVE) || "null");
  if (resumeState?.mode === "town") resumeState = null;
} catch {}
function newParty() {
  const p = createParty();
  [1, 2].forEach((i) => {
    const lv = Math.min(3, meta.levels[i - 1] || 1);
    p[i].level = lv;
    p[i].atk += 2 * (lv - 1);
    p[i].maxHp = Math.min(99, p[i].maxHp + 4 * (lv - 1));
    p[i].hp = p[i].maxHp;
  });
  return p;
}
function save() {
  try {
    localStorage.setItem(META, JSON.stringify(meta));
    if (state.mode === "ending") localStorage.removeItem(SAVE);
    else if (state.mode === "town") {
      if (resumeState) localStorage.setItem(SAVE, JSON.stringify(resumeState));
      else localStorage.removeItem(SAVE);
    } else localStorage.setItem(SAVE, JSON.stringify(state));
  } catch {}
}
function journal(text) {
  state.journal.unshift(text);
  state.journal = state.journal.slice(0, 6);
  $("#journal").innerHTML = state.journal
    .map((t) => `<li>${esc(t)}</li>`)
    .join("");
}
function toast(text) {
  $("#toast").textContent = text;
  $("#toast").classList.add("visible");
  toastTime = 3;
}
function redraw() {
  lastUI = "";
  scene?.redraw();
  renderUI();
}
function openModal(type, data = {}) {
  modal = { type, ...data };
  state.path = [];
  renderModal();
  save();
}
function closeModal() {
  modal = null;
  $("#overlay").innerHTML = "";
  lastUI = "";
  renderUI();
  save();
}
function startRun() {
  meta.runs++;
  state = {
    mode: "explore",
    party: newParty(),
    floor: 1,
    seed: `${Math.floor(Math.random() * 89999) + 10000}`,
    map: null,
    player: null,
    path: [],
    battle: null,
    runGold: 0,
    items: { potion: 2, tonic: 1, seed: 1 },
    journal: [],
    victories: 0,
  };
  modal = null;
  $("#overlay").innerHTML = "";
  loadFloor(1);
  journal("The gate closes behind your party.");
  save();
}
function resumeRun() {
  state = resumeState;
  resumeState = null;
  state.path = [];
  if (state.battle) {
    state.party = state.battle.units.filter((u) => u.side === "party");
  }
  modal = null;
  $("#overlay").innerHTML = "";
  redraw();
  if (state.mode === "reward")
    openModal("reward", {
      amount: state.encounterBoss ? 65 : 12 + state.floor * 6,
      boss: state.encounterBoss,
      levelUp: state.victories % 2 === 0,
    });
  journal("The expedition resumes exactly where you left it.");
}
function loadFloor(floor) {
  state.floor = floor;
  state.stairsLatched = false;
  state.mode = "explore";
  state.map = generateDungeon(state.seed, floor);
  state.map.enemies.forEach((e) => {
    e.homeX = e.x;
    e.homeY = e.y;
    e.path = [];
    e.alert = false;
  });
  state.player = { ...state.map.spawn };
  state.path = [];
  state.battle = null;
  redraw();
  journal(
    `Floor ${floor}: ${["The Threshold", "The Echo Chambers", "The Last Watch"][floor - 1]}.`,
  );
  toast(
    floor === 1
      ? "Tap a floor tile to walk. Enemies can follow through rooms and corridors."
      : floor === 3
        ? "The Ash Warden guards the way out."
        : "A new floor. The tower rearranges itself.",
  );
  save();
}
function finishRun(won, cleared = false) {
  [1, 2].forEach(
    (i) =>
      (meta.levels[i - 1] = Math.max(meta.levels[i - 1], state.party[i].level)),
  );
  const earned = won ? state.runGold : 0;
  meta.gold += earned;
  if (cleared) meta.wins++;
  state.mode = "ending";
  state.path = [];
  state.battle = null;
  journal(
    cleared
      ? "The Warden falls. You carried the light out."
      : won
        ? "An escape seed unfolds a path home."
        : "Your party falls. The tower keeps the spoils.",
  );
  openModal("ending", { won, cleared, earned });
  save();
}
function returnTown() {
  state.mode = "town";
  state.party = newParty();
  state.map = null;
  state.battle = null;
  modal = null;
  $("#overlay").innerHTML = "";
  resumeState = null;
  redraw();
  save();
}
function enterBattle(encounter) {
  if (state.mode !== "explore") return;
  state.path = [];
  $("#toast").classList.remove("visible");
  $("#toast").textContent = "";
  toastTime = 0;
  state.mode = "combat";
  state.encounterId = encounter.id;
  state.encounterBoss = !!encounter.boss;
  const enemies = createEncounter(state.floor, !!encounter.boss);
  if (!encounter.boss) {
    enemies[0].texture = encounter.kind;
    enemies[0].name =
      encounter.kind === "bat"
        ? "Static bat"
        : encounter.kind === "skeleton"
          ? "Bone sentry"
          : "Rime slime";
    enemies[0].type =
      encounter.kind === "bat"
        ? "Lightning"
        : encounter.kind === "skeleton"
          ? "Normal"
          : "Ice";
  }
  state.battle = createBattle(
    state.party,
    enemies,
    Number(state.seed) + state.floor * 97 + state.victories,
  );
  selectedAbility = 0;
  selectedTarget = 0;
  lastActor = null;
  redraw();
  journal(
    encounter.boss
      ? "The Ash Warden steps onto the timeline."
      : "Contact. Choose your moment.",
  );
  save();
}
function battleWon() {
  state.mode = "reward";
  state.map.enemies = state.map.enemies.filter(
    (e) => e.id !== state.encounterId,
  );
  const amount = state.encounterBoss ? 65 : 12 + state.floor * 6;
  state.runGold += amount;
  state.victories++;
  state.party.forEach((u) => {
    u.statuses = {};
    if (u.hp > 0 && state.victories % 2 === 0 && u.level < 3) {
      u.level++;
      u.atk += 2;
      u.maxHp = Math.min(99, u.maxHp + 4);
      u.hp = Math.min(u.maxHp, u.hp + 4);
    }
  });
  [1, 2].forEach(
    (i) =>
      (meta.levels[i - 1] = Math.max(meta.levels[i - 1], state.party[i].level)),
  );
  journal(`Victory. ${amount} gold goes into the expedition bag.`);
  openModal("reward", {
    amount,
    boss: state.encounterBoss,
    levelUp: state.victories % 2 === 0,
  });
  save();
}
function continueAfterBattle() {
  const boss = modal?.boss;
  closeModal();
  if (boss) {
    finishRun(true, true);
    return;
  }
  state.mode = "explore";
  state.battle = null;
  // Other enemies remain where exploration paused when contact began.
  redraw();
  save();
}
function moveTo(x, y) {
  if (state.mode !== "explore" || modal) return;
  const end = { x: Math.round(x), y: Math.round(y) };
  const start = state.path[0] ?? {
    x: Math.round(state.player.x),
    y: Math.round(state.player.y),
  };
  if (state.map.tiles[end.y]?.[end.x] !== 1) {
    toast("Choose a clear floor tile.");
    return;
  }
  if (Math.hypot(end.x - state.player.x, end.y - state.player.y) < 0.65) {
    state.path = [];
    checkInteractions();
    return;
  }
  if (
    state.path.length &&
    state.path.at(-1).x === end.x &&
    state.path.at(-1).y === end.y
  )
    return;
  state.path = pathfind(state.map, start, end);
  if (
    state.path.length &&
    Math.hypot(start.x - state.player.x, start.y - state.player.y) > 0.001
  )
    state.path.unshift(start);
  if (state.path.length) {
    scene?.showDestination(end);
    save();
  }
}
function checkInteractions() {
  if (state.mode !== "explore" || modal) return;
  const p = state.player,
    m = state.map;
  for (const e of m.enemies) {
    if (enemyInContact(m, p, e)) {
      enterBattle(e);
      return;
    }
  }
  for (const c of m.chests) {
    if (
      c.opened &&
      c.potion &&
      usedSlots(state.items) < ITEM_SLOTS &&
      Math.hypot(p.x - c.x, p.y - c.y) < 0.85
    ) {
      state.items.potion++;
      c.potion = false;
      toast("Collected the healing draught left in the chest.");
      save();
    }
    if (!c.opened && Math.hypot(p.x - c.x, p.y - c.y) < 0.85) {
      c.opened = true;
      state.path = [];
      const gold = 10 + state.floor * 5;
      state.runGold += gold;
      const packed = usedSlots(state.items) < ITEM_SLOTS;
      if (packed) state.items.potion++;
      else c.potion = true;
      journal(
        `A chest: ${gold} gold. ${packed ? "Healing draught packed." : "Bag full; draught left in the chest."}`,
      );
      openModal("chest", { gold, packed });
      scene.redraw();
      return;
    }
  }
  const stairDistance = Math.hypot(p.x - m.stairs.x, p.y - m.stairs.y);
  if (stairDistance > 1) state.stairsLatched = false;
  if (stairDistance < 0.72 && !state.stairsLatched) {
    state.stairsLatched = true;
    state.path = [];
    if (state.floor === 3) {
      const boss = m.enemies.find((e) => e.boss);
      if (boss) {
        toast("The Warden holds this gate. Defeat it to clear the demo.");
        return;
      }
      finishRun(true, true);
    } else openModal("stairs");
  }
}
function simulation(dt) {
  if (toastTime > 0) {
    toastTime -= dt;
    if (toastTime <= 0) $("#toast").classList.remove("visible");
  }
  if (modal || document.hidden) return;
  if (state.mode === "explore") {
    approach(state.player, state.path, MOVEMENT.playerSpeed, dt);
    updateEnemies(state.map, state.player, dt);
    checkInteractions();
  } else if (state.mode === "combat") {
    const b = state.battle;
    const count = b.events.length;
    const before = b.events[b.events.length - 1];
    stepBattle(b, dt);
    const events = b.events.slice(b.events.indexOf(before) + 1);
    for (const e of events) {
      if (["damage", "heal", "burn"].includes(e.type)) scene?.combatEffect(e);
    }
    if (b.phase === "won") battleWon();
    else if (b.phase === "lost") finishRun(false);
  }
  saveClock += dt;
  if (saveClock > 1) {
    saveClock = 0;
    save();
  }
  renderUI();
}
function pending() {
  return state.battle?.units.find((u) => u.id === state.battle.pendingActorId);
}
function currentSelection() {
  const actor = pending();
  if (!actor) return {};
  if (lastActor !== actor.id) {
    lastActor = actor.id;
    selectedAbility = 0;
    selectedTarget = 0;
  }
  selectedAbility =
    (selectedAbility + actor.abilities.length) % actor.abilities.length;
  const ability = ABILITIES[actor.abilities[selectedAbility]];
  const targets = state.battle.units.filter(
    (u) =>
      u.hp > 0 &&
      (ability.target === "ally" ? u.side === "party" : u.side === "enemy"),
  );
  selectedTarget = (selectedTarget + targets.length) % targets.length;
  const target = targets[selectedTarget];
  return {
    actor,
    ability,
    targets,
    target,
    preview: previewAction(state.battle, ability.id, target?.id),
  };
}
function cycleAbility(n) {
  const p = pending();
  if (!p) return;
  selectedAbility =
    (selectedAbility + n + p.abilities.length) % p.abilities.length;
  selectedTarget = 0;
  lastUI = "";
  renderUI();
  scene.updateBattle();
}
function cycleTarget(n) {
  const s = currentSelection();
  if (!s.targets?.length || s.ability.target === "all") return;
  selectedTarget = (selectedTarget + n + s.targets.length) % s.targets.length;
  lastUI = "";
  renderUI();
  scene.updateBattle();
}
function confirmAbility() {
  const { ability, target } = currentSelection();
  if (ability && target && chooseAbility(state.battle, ability.id, target.id)) {
    lastActor = null;
    lastUI = "";
    renderUI();
    save();
  }
}
function partyHTML() {
  return `<div class="party-strip">${state.party.map((u) => `<div class="party-pill ${pending()?.id === u.id ? "active" : ""} ${u.hp <= 0 ? "dead" : ""}"><div class="pill-head"><span class="pill-name">${esc(u.name)}</span><span class="pill-level">LV ${u.level}</span></div><div class="bar"><i style="width:${Math.max(0, (u.hp / u.maxHp) * 100)}%"></i></div><div class="bar mp"><i style="width:${(u.mp / u.maxMp) * 100}%"></i></div><div class="pill-values"><span>${Math.max(0, u.hp)}/${u.maxHp} HP</span><span>${u.mp} MP</span></div></div>`).join("")}</div>`;
}
function renderUI() {
  let html = "";
  const town = state.mode === "town";
  const inBattle = state.mode === "combat";
  let key = [
    state.mode,
    state.floor,
    state.runGold,
    usedSlots(state.items),
    meta.gold,
    selectedAbility,
    selectedTarget,
    state.party.map((u) => `${u.hp},${u.mp},${u.level}`).join(";"),
    state.battle?.phase,
    state.battle?.pendingActorId,
    state.battle?.events.at(-1)?.text,
    resumeState ? "resume" : "",
  ].join("|");
  if (key === lastUI) return;
  lastUI = key;
  html = `<header class="topbar"><div><span class="eyebrow">${town ? "THE TOWN BELOW" : "THE SCROLL / EXPEDITION"}</span><h2>${town ? "Between climbs" : `Floor ${String(state.floor).padStart(2, "0")} <span style="font:12px sans-serif;color:#7c9788">/ 03</span>`}</h2></div><div class="currency"><span>◈ ${town ? meta.gold : state.runGold}</span><button class="icon-button" data-action="${town ? "help" : "pause"}" aria-label="${town ? "How to play" : "Pause game"}">${town ? "?" : "Ⅱ"}</button></div></header>`;
  if (town) {
    html += `<div class="town-heading"><span class="eyebrow">A POCKET-SIZED ROGUELIKE</span><h1>THE SCROLL</h1><p>Some things are worth bringing back.</p></div><section class="bottom-panel town-bottom"><h3>Your little expedition</h3><div class="companions"><span class="companion"><img class="portrait-icon" src="/assets/familiarFire.png" alt="">Emberling <b>LV ${state.party[1].level}</b></span><span class="companion"><img class="portrait-icon" src="/assets/familiarIce.png" alt="">Rime <b>LV ${state.party[2].level}</b></span></div><button class="button primary" id="start-btn" data-action="${resumeState ? "resume" : "start"}" style="width:100%;min-height:51px">${resumeState ? "Resume expedition →" : "Enter the tower →"}</button><div class="button-row"><button class="button small" data-action="help">How to play</button><button class="button small" data-action="supplies">Expedition kit</button><button class="button small" data-action="guide">Field guide ↗</button></div><div class="town-footer">THREE FLOORS · TWO COMPANIONS · ONE WAY UP</div></section>`;
  } else {
    html += partyHTML();
    if (state.mode === "explore") {
      html += `<div class="floor-caption"><span>${["THE THRESHOLD", "THE ECHO CHAMBERS", "THE LAST WATCH"][state.floor - 1]}</span><span>SEED ${esc(state.seed)}</span></div><section class="bottom-panel"><span class="eyebrow">${state.floor === 3 ? "FIND THE WARDEN" : "EXPLORE AT YOUR OWN PACE"}</span><h3>${state.floor === 3 ? "The last watch" : "A little further?"}</h3><p>Tap to walk. Touch an enemy to battle.<br>Find the stairs, or take a detour for treasure.</p><div class="button-row"><button class="button" data-action="inventory">Bag <span style="color:var(--mint)">${usedSlots(state.items)}/${ITEM_SLOTS} item slots</span></button><button class="button" data-action="extract">Use escape seed ↗</button></div></section>`;
    }
    if (inBattle) {
      const b = state.battle;
      html += `<div class="combat-banner"><span class="eyebrow">${b.phase === "command" ? "TIME IS PAUSED" : "THE TIMELINE IS MOVING"}</span><h3>${b.phase === "command" ? `${esc(pending()?.name)}’s turn` : "Every moment counts"}</h3></div><div class="battle-log" aria-live="polite">${esc(b.events.at(-1)?.text || "Fast acts sooner. Slow strikes harder.")}</div>`;
      if (b.phase === "command") {
        const s = currentSelection(),
          p = s.preview;
        html += `<section class="bottom-panel combat-panel"><div class="target-picker"><button data-action="target-prev" ${s.ability.target === "all" ? "disabled" : ""} aria-label="Previous target">‹</button><div class="target-info"><b>${s.ability.target === "all" ? "ALL ENEMIES" : `${s.ability.target === "ally" ? "ALLY" : "TARGET"} · ${esc(s.target?.name)}`}</b><span>${s.ability.target === "all" ? `${s.targets.length} enemies · hits every enemy` : `${s.target?.hp} / ${s.target?.maxHp} HP · ${s.target?.type} · swipe target to change`}</span></div><button data-action="target-next" ${s.ability.target === "all" ? "disabled" : ""} aria-label="Next target">›</button></div><div class="ability-picker"><button class="button arrow" data-action="ability-prev" aria-label="Previous ability">‹</button><div class="ability-card" id="ability-swipe"><b>${esc(s.ability.name)}</b><div class="ability-meta">${s.ability.tier.toUpperCase()} · ${s.ability.type.toUpperCase()} · ${s.ability.mp} MP</div></div><button class="button arrow" data-action="ability-next" aria-label="Next ability">›</button></div><div class="preview"><span>Preview <strong>${p.healing ? `+${p.healing} HP` : p.damage ? `${p.damage} damage` : "Full health"}</strong>${s.ability.augment ? ` · ${Math.round(p.statusChance * 100)}% ${s.ability.augment.status}` : ""}</span><span>${p.chargeSeconds?.toFixed(1)}s charge</span></div><button class="button primary" style="width:100%" data-action="confirm" ${p.valid ? "" : "disabled"}>${p.valid ? "Confirm action →" : "Not enough MP"}</button></section>`;
      } else
        html += `<section class="bottom-panel waiting-panel"><span class="eyebrow">ACTIONS ARE COMMITTED</span><span class="pulse">◆</span><h3>Watch the timeline</h3><p>Your next choice will pause the battle.<br>COM: choose · ACT: resolve</p></section>`;
    }
  }
  $("#hud").innerHTML = html;
  $("#side-title").textContent = town
    ? "The tower is waiting."
    : inBattle
      ? "Timing is everything."
      : state.floor === 3
        ? "The last watch."
        : "Curiosity has a cost.";
  $("#side-description").textContent = town
    ? "Choose your companions, then step through the gate."
    : inBattle
      ? "The entire timeline stops while you choose. Pick a target, preview the result, then commit."
      : "Enemies pursue through rooms and corridors. Gain distance to escape. The stairs are a choice, not a checklist.";
}
function renderModal() {
  if (!modal) {
    $("#overlay").innerHTML = "";
    return;
  }
  let c = "";
  const m = modal;
  const btn = (text, action, cls = "") =>
    `<button class="button ${cls}" data-action="${action}">${text}</button>`;
  if (m.type === "help") {
    c = `<span class="eyebrow">A SMALL GUIDE TO THE TOWER</span><h2>Swipe. Choose. Commit.</h2><ul class="help-list"><li><b>Explore:</b> tap any floor tile. Your party finds a path. Tap your character to stop.</li><li><b>Battle:</b> contact starts a fight. At COM, time freezes. Cycle an ability and target, then confirm. All three allies are yours to command.</li><li><b>Timing:</b> Fast charges quickly; Slow hits harder. Type cycle: Fire → Ice → Lightning → Fire.</li><li><b>Survive:</b> HP and MP carry between fights. Use your bag to recover, or spend an escape seed to bank your gold.</li><li><b>Climb:</b> find the stairs on each floor. Defeat the guardian on floor three to finish the demo.</li></ul>${btn("Ready to explore", "close", "primary")}<a class="text-link" href="/demo-guide.html" target="_blank">Read the complete field guide ↗</a>`;
  }
  if (m.type === "pause") {
    c = `<span class="eyebrow">TAKE A BREATH</span><h2>Expedition paused</h2><p>Nothing advances while this screen is open. Your current expedition is saved on this device.</p>${btn("Resume expedition", "close", "primary")}${btn("How to play", "help")}${btn("Return to title · keep expedition", "title")}<a class="text-link" href="/demo-guide.html" target="_blank">Demo decisions & mechanics ↗</a>`;
  }
  if (m.type === "stairs") {
    c = `<span class="eyebrow">THE WAY UP</span><h2>Leave this floor?</h2><p>The next floor holds stronger enemies. Any unopened chests and remaining encounters stay behind.</p><div class="item-card"><span class="item-symbol">↟</span><div><b>Floor ${state.floor + 1} · ${state.floor === 1 ? "The Echo Chambers" : "The Last Watch"}</b><p>Your HP and MP carry forward.</p></div></div>${btn("Climb the stairs →", "climb", "primary")}${btn("Keep exploring", "close")}`;
  }
  if (m.type === "extract") {
    c = `<span class="eyebrow">KNOW WHEN TO LEAVE</span><h2>Take the way home?</h2><p>Your escape seed ends this expedition safely. Bank ${state.runGold} gold and keep your Familiars’ levels.</p>${btn("Use seed & extract", "extract-confirm", "primary")}${btn("Keep climbing", "close")}`;
  }
  if (m.type === "chest") {
    c = `<span class="eyebrow">A DETOUR WELL TAKEN</span><h2>Something worth keeping</h2><div class="item-card"><span class="item-symbol">◈</span><div><b>${m.gold} gold</b><p>Bank it by extracting safely.</p></div></div><div class="item-card"><span class="item-symbol">✚</span><div><b>Healing draught</b><p>${m.packed ? "Packed in its own slot. Restore 40 HP to one living ally." : "Bag full. Left in this chest; return after freeing a slot."}</p></div></div>${btn("Pack it & keep moving", "close", "primary")}`;
  }
  if (m.type === "reward") {
    c = `<span class="eyebrow">ENCOUNTER CLEARED</span><h2>${m.boss ? "The Warden falls." : "A moment to breathe."}</h2><div class="item-card"><span class="item-symbol">◈</span><div><b>${m.amount} gold recovered</b><p>${state.runGold} total carried this expedition.</p></div></div><div class="item-card"><span class="item-symbol">✧</span><div><b>${m.levelUp ? "Your party grows stronger" : "Experience gained"}</b><p>${m.levelUp ? "Living allies gain a level, up to level 3." : "A level after every two victories, up to level 3."}</p></div></div><p>HP and MP carry into the next encounter. Your bag can help you recover.</p>${btn(m.boss ? "Carry the light home →" : "Return to the dungeon →", "continue", "primary")}`;
  }
  if (m.type === "ending") {
    c = `<div class="reward-seal"><span>${m.won ? "✦" : "◇"}</span></div><span class="eyebrow">${m.cleared ? "DEMO COMPLETE" : m.won ? "SAFE EXTRACTION" : "EXPEDITION ENDED"}</span><h2>${m.cleared ? "You found the way out." : m.won ? "Home, with something." : "The tower keeps its secrets."}</h2><p>${m.won ? `You brought back ${m.earned} gold from floor ${state.floor}. Your Familiars will remember this climb.` : "Carried gold and supplies are lost. Your Familiars keep their earned levels and return with you."}</p><div class="inventory-stats"><div>REACHED<b>${state.floor} / 3</b></div><div>VICTORIES<b>${state.victories}</b></div><div>BANKED GOLD<b>${meta.gold}</b></div></div>${btn("Return to town", "town", "primary")}<a class="text-link" href="/demo-guide.html" target="_blank">Behind the demo ↗</a>`;
  }
  if (m.type === "inventory" || m.type === "supplies") {
    const live = m.type === "inventory";
    const items = live ? state.items : { potion: 2, tonic: 1, seed: 1 };
    c = `<span class="eyebrow">${live ? "YOUR EXPEDITION BAG" : "PACKED FOR THE FIRST STEPS"}</span><h2>${live ? "Travel light." : "The expedition kit"}</h2><p>10 starting slots: 3 equipment + 7 items. Only currencies stack. ${usedSlots(items)}/${ITEM_SLOTS} item slots occupied. ${live ? "Use recovery items between battles." : "Each demo climb starts with these supplies."}</p>${[
      ["potion", "Healing draught", "Restore 40 HP to one living ally.", "✚"],
      ["tonic", "Ether tonic", "Restore 16 MP to one living ally.", "✧"],
      ["seed", "Escape seed", "Return safely with your carried gold.", "↗"],
    ]
      .flatMap(([id, name, desc, icon]) =>
        Array.from(
          { length: items[id] },
          () =>
            `<div class="item-card" data-item="${id}"><span class="item-symbol">${icon}</span><div><b>${name}</b><p>${desc}</p></div>${live ? btn("Use", "item-" + id, "small") : ""}</div>`,
        ),
      )
      .join(
        "",
      )}<div class="section-label">YOUR COMPANIONS</div><div class="party-detail">${state.party.map((u) => `${esc(u.name)} · ${u.hp}/${u.maxHp} HP · ${u.mp}/${u.maxMp} MP${u.hp <= 0 ? " · fallen" : ""}`).join("<br>")}</div>${btn("Back", "close", "primary")}`;
  }
  if (m.type === "item") {
    c = `<span class="eyebrow">${m.item === "potion" ? "HEALING DRAUGHT" : "ETHER TONIC"}</span><h2>Choose an ally</h2><p>${m.item === "potion" ? "Restore up to 40 HP." : "Restore up to 16 MP."} Fallen allies recover in town.</p>${state.party.map((u) => `<button class="button" data-action="use-item" data-id="${u.id}" ${u.hp <= 0 || (m.item === "potion" ? u.hp === u.maxHp : u.mp === u.maxMp) ? "disabled" : ""}>${esc(u.name)} · ${m.item === "potion" ? `${u.hp}/${u.maxHp} HP` : `${u.mp}/${u.maxMp} MP`}</button>`).join("")}${btn("Back to bag", "inventory")}`;
  }
  $("#overlay").innerHTML =
    `<div class="modal-scrim"><section class="modal ${m.type === "ending" ? "center" : ""}" role="dialog" aria-modal="true">${c}</section></div>`;
}

$("#game-shell").addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el || el.disabled) return;
  const a = el.dataset.action;
  if (a === "start") startRun();
  else if (a === "resume") resumeRun();
  else if (a === "close") closeModal();
  else if (a === "town") returnTown();
  else if (a === "title") {
    save();
    resumeState = JSON.parse(localStorage.getItem(SAVE) || "null");
    state = { ...state, mode: "town", party: newParty() };
    modal = null;
    $("#overlay").innerHTML = "";
    redraw();
  } else if (["help", "pause", "inventory", "supplies"].includes(a))
    openModal(a);
  else if (a === "guide") window.open("/demo-guide.html", "_blank", "noopener");
  else if (a === "ability-prev") cycleAbility(-1);
  else if (a === "ability-next") cycleAbility(1);
  else if (a === "target-prev") cycleTarget(-1);
  else if (a === "target-next") cycleTarget(1);
  else if (a === "confirm") confirmAbility();
  else if (a === "continue") continueAfterBattle();
  else if (a === "climb") {
    closeModal();
    loadFloor(state.floor + 1);
  } else if (a === "extract" || a === "item-seed") {
    if (state.items.seed > 0) openModal("extract");
    else toast("No escape seed left.");
  } else if (a === "extract-confirm") {
    state.items.seed--;
    finishRun(true);
  } else if (a === "item-potion" || a === "item-tonic")
    openModal("item", { item: a.slice(5) });
  else if (a === "use-item") {
    const u = state.party.find((u) => u.id === el.dataset.id),
      item = modal.item;
    if (u?.hp > 0 && state.items[item] > 0) {
      state.items[item]--;
      if (item === "potion") u.hp = Math.min(u.maxHp, u.hp + 40);
      else u.mp = Math.min(u.maxMp, u.mp + 16);
      toast(`${u.name} recovered ${item === "potion" ? "health" : "MP"}.`);
      openModal("inventory");
      lastUI = "";
      renderUI();
    }
  }
});
let swipe = null;
$("#hud").addEventListener("pointerdown", (e) => {
  if (e.target.closest("#ability-swipe"))
    swipe = { x: e.clientX, y: e.clientY };
});
$("#hud").addEventListener("pointerup", (e) => {
  if (swipe) {
    if (Math.abs(e.clientX - swipe.x) > 25)
      cycleAbility(e.clientX < swipe.x ? 1 : -1);
    swipe = null;
  }
});
window.addEventListener("keydown", (e) => {
  if (e.code === "KeyF") {
    e.preventDefault();
    if (!document.fullscreenElement)
      $("#stage")
        .requestFullscreen?.()
        .catch(() => {});
    else document.exitFullscreen?.();
  }
  if (e.code === "Escape" && state.mode !== "ending") {
    if (modal?.type === "reward") continueAfterBattle();
    else if (modal) closeModal();
    else if (state.mode !== "town") openModal("pause");
  }
  if (modal) return;
  if (state.mode === "combat" && state.battle.phase === "command") {
    if (e.code === "ArrowLeft") cycleAbility(-1);
    if (e.code === "ArrowRight") cycleAbility(1);
    if (e.code === "ArrowUp") cycleTarget(-1);
    if (e.code === "ArrowDown") cycleTarget(1);
    if (e.code === "Enter" || e.code === "Space") {
      e.preventDefault();
      confirmAbility();
    }
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    save();
    if (!modal && state.mode !== "town" && state.mode !== "ending")
      openModal("pause");
  }
});
window.addEventListener("pagehide", save);

class ScrollScene extends Phaser.Scene {
  constructor() {
    super("Scroll");
  }
  preload() {
    for (const a of ASSETS) {
      if (a.frameWidth)
        this.load.spritesheet(a.key, a.url, {
          frameWidth: a.frameWidth,
          frameHeight: a.frameHeight,
        });
      else this.load.image(a.key, a.url);
    }
  }
  create() {
    scene = this;
    this.art = this.add.container(0, 0);
    this.effects = this.add.container(0, 0);
    this.unitViews = {};
    this.mapEnemies = {};
    this.anims.create({
      key: "hero-idle",
      frames: this.anims.generateFrameNumbers("hero", { start: 0, end: 11 }),
      frameRate: 7,
      repeat: -1,
    });
    this.anims.create({
      key: "torch-idle",
      frames: this.anims.generateFrameNumbers("torch", { start: 0, end: 5 }),
      frameRate: 8,
      repeat: -1,
    });
    this.input.on("pointerdown", (p) => {
      this.press = { x: p.x / displayScale, y: p.y / displayScale };
    });
    this.input.on("pointerup", (pointer) => {
      const p = { x: pointer.x / displayScale, y: pointer.y / displayScale };
      if (modal) return;
      if (
        state.mode === "explore" &&
        p.x >= MAP_X &&
        p.x < MAP_X + VIEW_SIZE &&
        p.y >= MAP_Y &&
        p.y < MAP_Y + VIEW_SIZE
      ) {
        moveTo(
          (p.x - MAP_X - this.mapView.x) / TILE - 0.5,
          (p.y - MAP_Y - this.mapView.y) / TILE - 0.5,
        );
      } else if (
        state.mode === "combat" &&
        state.battle.phase === "command" &&
        p.y > 250 &&
        p.y < 485
      ) {
        if (this.press && Math.abs(p.x - this.press.x) > 25)
          cycleTarget(p.x < this.press.x ? 1 : -1);
        else {
          const candidates = Object.entries(this.unitViews).filter(
            ([id, v]) =>
              v.image.visible &&
              state.battle.units.find((u) => u.id === id)?.side === "enemy",
          );
          const hit = candidates.find(
            ([id, v]) => Math.abs(p.x - v.x) < 65 && Math.abs(p.y - v.y) < 80,
          );
          const sel = currentSelection();
          if (hit && sel.targets.some((u) => u.id === hit[0])) {
            selectedTarget = sel.targets.findIndex((u) => u.id === hit[0]);
            lastUI = "";
            renderUI();
            this.updateBattle();
          }
        }
      }
    });
    this.redraw();
    renderUI();
    resize();
    window.__scrollReady = true;
  }
  put(obj) {
    this.art.add(obj);
    return obj;
  }
  image(x, y, key, width, height = width) {
    const o = this.put(this.addExistingImage(x, y, key));
    if (
      ["slime", "bat", "skeleton", "boss"].includes(key.replace("map-", ""))
    ) {
      // Uniform whole source pixels in the screen-sized render target.
      o.setScale(
        Math.max(
          1,
          Math.floor(
            Math.min(width / o.width, height / o.height) * displayScale,
          ),
        ) / displayScale,
      );
    } else o.setDisplaySize(width, height);
    return o;
  }
  addExistingImage(x, y, key) {
    return this.make.image({ x, y, key, add: true });
  }
  text(x, y, str, size = 12, color = "#bdd0b8") {
    return this.put(
      this.make.text({
        x,
        y,
        text: str,
        style: { fontFamily: "Georgia", fontSize: `${size}px`, color },
        add: true,
      }),
    ).setOrigin(0.5);
  }
  rect(x, y, w, h, color, alpha = 1) {
    return this.put(
      this.make
        .graphics({ add: true })
        .fillStyle(color, alpha)
        .fillRect(x, y, w, h),
    );
  }
  redraw() {
    if (!this.art) return;
    for (const effect of this.effects.list) this.tweens.killTweensOf(effect);
    this.effects.removeAll(true);
    if (this.mapCamera) this.cameras.remove(this.mapCamera);
    this.mapCamera = null;
    this.mapView?.destroy(true);
    this.mapView = null;
    this.art.removeAll(true);
    this.unitViews = {};
    this.mapEnemies = {};
    this.heroView = null;
    this.timeline = null;
    this.destination = null;
    this.rect(0, 0, W, H, 0x152329);
    if (state.mode === "town") this.drawTown();
    else if (["combat", "reward"].includes(state.mode)) this.drawBattle();
    else if (state.map) this.drawMap();
  }
  drawTown() {
    this.rect(0, 87, W, 480, 0x14262a);
    const g = this.put(this.addExistingGraphics());
    g.fillStyle(0x9db58a, 0.045);
    for (let i = 0; i < 5; i++) g.fillCircle(220, 376, 65 + i * 35);
    g.lineStyle(1, 0x9db58a, 0.12);
    g.strokeCircle(220, 381, 145);
    g.strokeCircle(220, 381, 150);
    for (let y = 0; y < 11; y++)
      for (let x = 0; x < 11; x++) {
        if ((x < 2 || x > 8) && y < 6) continue;
        const px = 220 + (x - 5) * 22,
          py = 315 + y * 19;
        this.image(
          px,
          py,
          y < 6 && (x === 2 || x === 8 || y === 0) ? "wall" : "floor",
          22,
          22,
        ).setAlpha(y > 8 ? 0.45 : 1);
      }
    this.rect(170, 321, 100, 144, 0x0b151c);
    for (let i = 0; i < 5; i++)
      this.rect(
        179 - i * 4,
        447 + i * 12,
        82 + i * 8,
        11,
        0x44574b,
        1 - i * 0.08,
      );
    this.rect(194, 336, 53, 102, 0x789d71, 0.13);
    this.text(220, 376, "↟", 52, "#d1b671");
    for (const x of [147, 293]) {
      this.image(x, 427, "wall", 26, 42);
      const t = this.put(
        this.make.sprite({ x, y: 393, key: "torch", add: true }),
      ).setScale(2);
      t.play("torch-idle");
      g.fillStyle(0xe8bb69, 0.08).fillCircle(x, 388, 32);
    }
    this.put(this.make.sprite({ x: 218, y: 494, key: "hero", add: true }))
      .setScale(2.7)
      .play("hero-idle");
    this.image(164, 507, "familiarFire", 32, 35);
    this.image(274, 507, "familiarIce", 32, 35);
    this.text(220, 546, "THE GATE IS OPEN", 9, "#90aa93");
  }
  addExistingGraphics() {
    return this.make.graphics({ add: true });
  }
  drawMap() {
    const m = state.map;
    this.rect(MAP_X - 10, MAP_Y - 9, VIEW_SIZE + 20, VIEW_SIZE + 18, 0x0d191e);
    const border = this.put(this.addExistingGraphics());
    border.lineStyle(1, 0x829c69, 0.3);
    border.strokeRoundedRect(
      MAP_X - 11,
      MAP_Y - 10,
      VIEW_SIZE + 22,
      VIEW_SIZE + 20,
      9,
    );
    const firstMapChild = this.art.length;
    for (let y = 0; y < m.height; y++)
      for (let x = 0; x < m.width; x++) {
        const walk = m.tiles[y][x] === 1;
        const adjacent =
          walk ||
          [
            [0, 1],
            [1, 0],
            [-1, 0],
            [0, -1],
          ].some(([dx, dy]) => m.tiles[y + dy]?.[x + dx] === 1);
        if (adjacent)
          this.image(
            MAP_X + (x + 0.5) * TILE,
            MAP_Y + (y + 0.5) * TILE,
            walk ? "floor" : "wall",
            TILE,
            TILE,
          ).setAlpha(walk ? (roomAt(m, x, y) ? 0.94 : 0.72) : 0.4);
      }
    for (const r of m.rooms) {
      const tx = MAP_X + (r.x + 0.5) * TILE,
        ty = MAP_Y + (r.y + 0.5) * TILE;
      const torch = this.put(
        this.make.sprite({ x: tx, y: ty, key: "torch", add: true }),
      ).setScale(0.85);
      torch.play("torch-idle");
    }
    this.image(
      MAP_X + (m.stairs.x + 0.5) * TILE,
      MAP_Y + (m.stairs.y + 0.5) * TILE,
      "stairs",
      26,
      17,
    );
    this.text(
      MAP_X + (m.stairs.x + 0.5) * TILE,
      MAP_Y + (m.stairs.y - 0.4) * TILE,
      "UP",
      8,
      "#f3d99a",
    );
    for (const c of m.chests)
      this.image(
        MAP_X + (c.x + 0.5) * TILE,
        MAP_Y + (c.y + 0.5) * TILE,
        "chest",
        19,
        17,
      ).setAlpha(c.opened ? 0.35 : 1);
    this.destination = this.put(this.addExistingGraphics());
    for (const e of m.enemies) {
      const shadow = this.put(
        this.add.ellipse(0, 0, e.boss ? 24 : 17, 7, 0x050c10, 0.6),
      );
      const image = this.image(
        0,
        0,
        "map-" + e.kind,
        e.boss ? 28 : 20,
        e.boss ? 31 : 22,
      );
      this.mapEnemies[e.id] = { image, shadow };
    }
    this.heroShadow = this.put(this.add.ellipse(0, 0, 17, 7, 0x071314, 0.6));
    this.heroView = this.put(
      this.make.sprite({ x: 0, y: 0, key: "hero", add: true }),
    )
      .setScale(1.2)
      .play("hero-idle");
    const mapObjects = this.art.list.slice(firstMapChild);
    this.art.remove(mapObjects);
    this.mapView = this.add.container(0, 0, mapObjects);
    this.cameras.main.ignore(this.mapView);
    this.mapCamera = this.cameras.add(
      Math.round(MAP_X * displayScale),
      Math.round(MAP_Y * displayScale),
      Math.round(VIEW_SIZE * displayScale),
      Math.round(VIEW_SIZE * displayScale),
    );
    this.mapCamera
      .setOrigin(0, 0)
      .setZoom(displayScale)
      .setScroll(MAP_X, MAP_Y);
    this.mapCamera.roundPixels = true;
    this.mapCamera.ignore([this.art, this.effects]);
    this.updateMap();
  }
  showDestination(p) {
    if (!this.destination) return;
    this.destination
      .clear()
      .lineStyle(1, 0xf1d095, 0.8)
      .strokeCircle(MAP_X + (p.x + 0.5) * TILE, MAP_Y + (p.y + 0.5) * TILE, 7);
  }
  updateMap() {
    if (!this.heroView || !state.player) return;
    // Move the world underneath a fixed square viewport; never reveal more at an edge.
    this.mapView.setPosition(
      Math.round((VIEW_RADIUS - state.player.x) * TILE * displayScale) /
        displayScale,
      Math.round((VIEW_RADIUS - state.player.y) * TILE * displayScale) /
        displayScale,
    );
    const x = MAP_X + (state.player.x + 0.5) * TILE,
      y = MAP_Y + (state.player.y + 0.5) * TILE;
    this.heroView.setPosition(x, y - 3);
    this.heroShadow.setPosition(x, y + 6);
    if (!state.path.length) this.destination?.clear();
    for (const e of state.map.enemies) {
      const v = this.mapEnemies[e.id];
      if (v) {
        v.image
          .setPosition(
            MAP_X + (e.x + 0.5) * TILE,
            MAP_Y + (e.y + 0.5) * TILE - 3,
          )
          .setTint(e.alert ? 0xffc2a0 : 0xffffff);
        v.shadow.setPosition(v.image.x, v.image.y + 10);
      }
    }
  }
  drawBattle() {
    if (!state.battle) return;
    this.rect(0, 150, W, 438, 0x13262a);
    const g = this.put(this.addExistingGraphics());
    g.fillStyle(0x6d9072, 0.06);
    g.fillCircle(220, 373, 175);
    g.fillStyle(0x8aac79, 0.06);
    g.fillEllipse(220, 433, 380, 80);
    for (let x = 0; x < 16; x++) {
      this.image(10 + x * 28, 290, "wall", 28, 32).setTint(0x637a68);
      for (let y = 0; y < 5; y++)
        this.image(10 + x * 28, 315 + y * 28, "floor", 28, 28).setAlpha(0.17);
    }
    for (const x of [32, 408]) {
      const t = this.put(
        this.make.sprite({ x, y: 300, key: "torch", add: true }),
      ).setScale(2);
      t.play("torch-idle");
      g.fillStyle(0xe9b971, 0.06).fillCircle(x, 300, 38);
    }
    this.timeline = this.put(this.addExistingGraphics());
    this.text(25, 171, "IP", 10, "#839b8b");
    this.text(293, 159, "COM", 8, "#e6bc73");
    this.text(406, 159, "ACT", 8, "#e6bc73");
    const enemies = state.battle.units.filter((u) => u.side === "enemy");
    enemies.forEach((u, i) => {
      const x = enemies.length === 1 ? 220 : 143 + i * 155,
        y = u.texture === "boss" ? 385 : 396;
      const shadow = this.put(
        this.add.ellipse(x, y + 36, 90, 20, 0x071218, 0.5),
      );
      const image = this.image(
        x,
        y,
        u.texture,
        u.texture === "boss" ? 130 : 83,
        u.texture === "boss" ? 139 : 85,
      );
      const label = this.text(x, 449, u.name, 12, "#e5e1ca");
      const intent = this.text(x, 432, "", 9, "#e6bc73");
      const hp = this.text(x, 473, `${u.hp}/${u.maxHp}`, 9, "#94b698");
      this.unitViews[u.id] = { x, y, image, label, hp, intent, shadow };
    });
    state.party.forEach((u, i) => {
      const x = 120 + i * 100,
        y = 559;
      const image =
        u.texture === "hero"
          ? this.put(this.make.sprite({ x, y, key: "hero", add: true }))
              .setScale(2)
              .play("hero-idle")
          : this.image(x, y, u.texture, 34, 37);
      this.unitViews[u.id] = { x, y, image };
    });
    this.updateBattle();
  }
  updateBattle() {
    const b = state.battle;
    if (!b || !this.timeline) return;
    const g = this.timeline;
    g.clear();
    g.fillStyle(0x33483e, 1).fillRoundedRect(46, 181, 356, 5, 2);
    g.fillStyle(0xc2a165, 0.55).fillRoundedRect(295, 181, 107, 5, 2);
    g.lineStyle(1, 0xe6bc73, 0.6);
    g.lineBetween(295, 172, 295, 195);
    g.lineBetween(402, 172, 402, 195);
    const selection = b.phase === "command" ? currentSelection() : {};
    const enemies = b.units.filter((u) => u.side === "enemy" && u.hp > 0);
    const active = b.units
      .filter((u) => u.queued)
      .sort((a, c) => c.position - a.position)[0];
    const ability = selection.ability ?? ABILITIES[active?.queued?.abilityId];
    const showAll = ability?.target === "all";
    const focus =
      (selection.target?.side === "enemy" ? selection.target : null) ??
      enemies.find((u) => u.id === active?.queued?.targetId) ??
      enemies.find((u) => u.id === active?.id) ??
      enemies[0];
    this.visibleEnemyIds = (showAll ? enemies : [focus].filter(Boolean)).map(
      (u) => u.id,
    );
    enemies.forEach((u, i) => {
      const v = this.unitViews[u.id];
      v.x = showAll ? (W * (i + 1)) / (enemies.length + 1) : W / 2;
      v.image.setPosition(v.x, v.y);
      for (const part of [v.label, v.hp, v.intent, v.shadow]) part.setX(v.x);
    });
    for (const u of b.units) {
      const v = this.unitViews[u.id];
      if (v) {
        if (u.side === "enemy") {
          for (const part of [v.image, v.label, v.hp, v.intent, v.shadow])
            part.setVisible(this.visibleEnemyIds.includes(u.id));
        }
        v.image.setAlpha(u.hp > 0 ? 1 : 0.18);
        v.intent?.setText(
          u.hp > 0 && u.queued ? ABILITIES[u.queued.abilityId].name + "…" : "",
        );
        v.hp?.setText(
          `${Math.max(0, u.hp)}/${u.maxHp} HP${u.statuses && Object.keys(u.statuses).length ? " · " + Object.keys(u.statuses).join(", ") : ""}`,
        );
        v.image.setTint(
          selection.target?.id === u.id || (showAll && u.side === "enemy")
            ? 0xffe1aa
            : 0xffffff,
        );
      }
      if (u.hp <= 0) continue;
      const x = 46 + (u.position / 100) * 356,
        y = u.side === "party" ? 177 : 190;
      g.fillStyle(
        u.side === "party"
          ? u.id === "hero"
            ? 0xe6bc73
            : u.id === "emberling"
              ? 0xe99676
              : 0x87cbd0
          : 0xcc7270,
        1,
      );
      g.fillCircle(x, y, 5);
      g.lineStyle(1, 0x112128, 1).strokeCircle(x, y, 5);
      if (
        (selection.target?.id === u.id || (showAll && u.side === "enemy")) &&
        v
      ) {
        g.lineStyle(1.5, 0xe6bc73, 0.8).strokeEllipse(
          v.x,
          v.y + 43,
          u.side === "party" ? 50 : 108,
          15,
        );
      }
    }
  }
  combatEffect(e) {
    const v = this.unitViews[e.targetId];
    if (!v || !v.image.visible) return;
    const txt = this.make
      .text({
        x: v.x,
        y: v.y - 35,
        text: `${e.type === "heal" ? "+" : "−"}${e.amount}`,
        style: {
          fontFamily: "Georgia",
          fontSize: "26px",
          color: e.type === "heal" ? "#a1ebbd" : "#ffe0a7",
          stroke: "#17252a",
          strokeThickness: 4,
        },
        add: true,
      })
      .setOrigin(0.5);
    this.effects.add(txt);
    const spark = this.make.graphics({ add: true });
    this.effects.add(spark);
    spark.lineStyle(3, e.type === "heal" ? 0x9debb6 : 0xf3d293, 1);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      spark.lineBetween(
        v.x + Math.cos(a) * 18,
        v.y + Math.sin(a) * 18,
        v.x + Math.cos(a) * 38,
        v.y + Math.sin(a) * 38,
      );
    }
    this.tweens.add({
      targets: txt,
      y: txt.y - 30,
      alpha: 0,
      duration: 900,
      onComplete: () => txt.destroy(),
    });
    this.tweens.add({
      targets: spark,
      alpha: 0,
      duration: 350,
      onComplete: () => spark.destroy(),
    });
  }
  update(time, delta) {
    if (!manualClock) simulation(Math.min(delta / 1000, 0.05));
    if (state.mode === "explore") this.updateMap();
    if (state.mode === "combat") this.updateBattle();
  }
}
// Scene helpers intentionally avoid physics: all movement uses the validated floor grid.
game = new Phaser.Game({
  type: Phaser.WEBGL,
  // Direct canvas exports need a retained WebGL buffer; normal play avoids its cost.
  preserveDrawingBuffer: new URLSearchParams(location.search).has("capture"),
  parent: "phaser",
  width: W,
  height: H,
  backgroundColor: "#152329",
  pixelArt: true,
  antialias: false,
  roundPixels: true,
  scene: ScrollScene,
  scale: { mode: Phaser.Scale.NONE },
  banner: false,
  audio: { noAudio: true },
});
function resize() {
  const availableWidth = document.fullscreenElement
    ? innerWidth
    : innerWidth <= 700
      ? innerWidth - 16
      : innerWidth <= 980
        ? innerWidth - 275
        : innerWidth - 550;
  const scale = Math.min(
    document.fullscreenElement ? 2 : 1,
    (innerHeight - 24) / H,
    availableWidth / W,
  );
  $("#stage").style.width = `${W * scale}px`;
  $("#stage").style.height = `${H * scale}px`;
  $("#game-shell").style.transform = `scale(${scale})`;
  displayScale = scale;
  if (scene?.cameras?.main) {
    game.scale.resize(Math.round(W * scale), Math.round(H * scale));
    game.canvas.style.width = `${game.scale.width / scale}px`;
    game.canvas.style.height = `${game.scale.height / scale}px`;
    scene.cameras.main.setOrigin(0, 0).setZoom(scale);
    scene.redraw();
    game.scale.refresh();
  }
}
window.addEventListener("resize", resize);
document.addEventListener("fullscreenchange", () => {
  resize();
  requestAnimationFrame(() => game.scale.refresh());
});
resize();
window.advanceTime = async (ms) => {
  manualClock = true;
  for (let remaining = ms; remaining > 0; remaining -= 1000 / 60) {
    simulation(Math.min(remaining, 1000 / 60) / 1000);
    scene?.updateMap();
    scene?.updateBattle();
  }
  await new Promise(requestAnimationFrame);
};
window.render_game_to_text = () =>
  JSON.stringify({
    engine: {
      version: Phaser.VERSION,
      renderer: game.renderer?.type === Phaser.WEBGL ? "WebGL" : "Canvas",
    },
    mode: state.mode,
    modal: modal?.type ?? null,
    coordinateSystem:
      "World tile grid: (0,0) top left; x right, y down. Camera shows 11x11 tiles centered on player. Screen tile center = viewport origin + worldOffset + (tile + 0.5) * tileSize, in logical canvas coordinates.",
    viewport:
      state.mode === "explore"
        ? {
            x: MAP_X,
            y: MAP_Y,
            width: VIEW_SIZE,
            height: VIEW_SIZE,
            tileSize: TILE,
            radius: VIEW_RADIUS,
            tilesAcross: VIEW_TILES,
            worldOffset: {
              x: scene?.mapView?.x ?? 0,
              y: scene?.mapView?.y ?? 0,
            },
          }
        : null,
    floor: state.floor,
    seed: state.seed,
    party: state.party.map((u) => ({
      id: u.id,
      name: u.name,
      hp: u.hp,
      maxHp: u.maxHp,
      mp: u.mp,
      level: u.level,
      statuses: u.statuses,
    })),
    gold: state.runGold,
    bankedGold: meta.gold,
    items: state.items,
    inventory: {
      totalSlots: 10,
      equipmentSlots: 3,
      itemSlots: ITEM_SLOTS,
      usedItemSlots: usedSlots(state.items),
    },
    player: state.player,
    path: state.path,
    map:
      state.mode === "explore"
        ? {
            tiles: state.map.tiles,
            stairs: state.map.stairs,
            chests: state.map.chests,
            enemies: state.map.enemies.map(
              ({ id, x, y, roomId, boss, alert }) => ({
                id,
                x,
                y,
                roomId,
                boss,
                alert,
              }),
            ),
          }
        : undefined,
    battle: state.battle
      ? {
          visibleEnemyIds: scene?.visibleEnemyIds ?? [],
          enemyRendering: Object.entries(scene?.unitViews ?? {})
            .filter(([id]) =>
              state.battle.units.some((u) => u.id === id && u.side === "enemy"),
            )
            .map(([id, v]) => ({
              id,
              visible: v.image.visible,
              pixelScale: v.image.scaleX * displayScale,
              width: v.image.width,
              height: v.image.height,
            })),
          phase: state.battle.phase,
          time: state.battle.time,
          pendingActorId: state.battle.pendingActorId,
          units: state.battle.units.map((u) => ({
            id: u.id,
            side: u.side,
            hp: u.hp,
            mp: u.mp,
            position: u.position,
            state: u.state,
            queued: u.queued,
            statuses: u.statuses,
          })),
          selection:
            state.battle.phase === "command" ? currentSelection() : null,
          events: state.battle.events.slice(-4),
        }
      : null,
  });
