import { makeFloors } from "./layouts.js";
import { pathfind } from "../dungeon.js";
import {
  MOVEMENT,
  approach,
  updateEnemies,
  enemyInContact,
} from "../exploration.js";
import {
  createParty,
  createEncounter,
  createBattle,
  stepBattle,
  chooseAbility,
} from "../combat.js";
export function startFloor(index = 0, suppliedMap = null) {
  const map = suppliedMap ?? makeFloors()[index];
  const party = createParty();
  return {
    index,
    map,
    party,
    player: { ...map.spawn },
    path: [],
    mode: "explore",
    running: false,
    battle: null,
    encounter: null,
    gold: 0,
    potions: 4,
    tonics: 2,
    message: "Inspect the full floor. Play zooms in; tap a tile to walk.",
    wins: 0,
  };
}
export function movePlayer(s, end) {
  if (s.mode !== "explore" || !s.running || s.map.tiles[end.y]?.[end.x] !== 1)
    return false;
  if (Math.hypot(end.x - s.player.x, end.y - s.player.y) < 0.1) {
    s.path = [];
    return true;
  }
  const start = s.path[0] ?? {
    x: Math.round(s.player.x),
    y: Math.round(s.player.y),
  };
  s.path = pathfind(s.map, start, end);
  if (Math.hypot(start.x - s.player.x, start.y - s.player.y) > 0.001)
    s.path.unshift(start);
  return true;
}
export function useSupply(s, type, id) {
  if (s.mode !== "explore") return false;
  const u = s.party.find((u) => u.id === id);
  if (!u || u.hp <= 0) return false;
  if (type === "potion" && s.potions > 0 && u.hp < u.maxHp) {
    u.hp = Math.min(u.maxHp, u.hp + 40);
    s.potions--;
    s.message = `Healed ${u.name}.`;
    return true;
  }
  if (type === "tonic" && s.tonics > 0 && u.mp < u.maxMp) {
    u.mp = Math.min(u.maxMp, u.mp + 16);
    s.tonics--;
    s.message = `Restored ${u.name}'s MP.`;
    return true;
  }
  return false;
}
export function command(s, ability, target) {
  return !!s.battle && chooseAbility(s.battle, ability, target);
}
export function tickFloor(s, dt) {
  if (!s.running) return;
  if (s.mode === "combat") {
    stepBattle(s.battle, dt);
    if (s.battle.phase === "won") {
      const e = s.encounter;
      s.map.enemies = s.map.enemies.filter((x) => x.id !== e.id);
      s.gold += e.boss ? 65 : e.elite ? 30 : 18;
      s.wins++;
      s.party.forEach((u) => (u.statuses = {}));
      s.battle = null;
      s.encounter = null;
      s.mode = "explore";
      s.running = false;
      s.message =
        "Victory. Other enemies stay where they were. Use supplies or press Play to continue.";
    } else if (s.battle.phase === "lost") {
      s.mode = "defeat";
      s.running = false;
      s.message = "The party fell. Reset this floor to try another route.";
    }
    return;
  }
  if (s.mode !== "explore") return;
  approach(s.player, s.path, MOVEMENT.playerSpeed, dt);
  updateEnemies(s.map, s.player, dt);
  for (const e of s.map.enemies)
    if (enemyInContact(s.map, s.player, e)) {
      s.path = [];
      s.encounter = e;
      s.battle = createBattle(
        s.party,
        createEncounter(e.elite ? 2 : 1, !!e.boss),
        s.index * 100 + s.wins + 1,
      );
      s.mode = "combat";
      s.message =
        "Contact. Choose abilities and targets when a party member reaches COM.";
      return;
    }
  for (const c of s.map.chests)
    if (!c.opened && Math.hypot(c.x - s.player.x, c.y - s.player.y) < 0.7) {
      c.opened = true;
      if (c.type === "potion") s.potions++;
      else if (c.type === "tonic") s.tonics++;
      else s.gold += 35;
      s.message = `Found ${c.type === "gold" ? "35 gold" : c.type === "potion" ? "a healing draught" : "an ether tonic"}.`;
    }
  if (Math.hypot(s.map.exit.x - s.player.x, s.map.exit.y - s.player.y) < 0.7) {
    if (s.map.enemies.some((e) => e.boss)) {
      s.message =
        "The guardian holds these stairs. Defeat it to complete the floor.";
      s.path = [];
    } else {
      s.mode = "complete";
      s.running = false;
      s.message = `Floor complete · ${s.gold} gold · ${s.wins} encounters won · ${s.map.chests.filter((c) => c.opened).length}/${s.map.chests.length} chests.`;
    }
  }
}
