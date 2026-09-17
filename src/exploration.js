import { pathfind } from "./dungeon.js";

// Demo defaults; the owning design values are recorded in docs/tuning.md.
export const MOVEMENT = Object.freeze({
  playerSpeed: 3.3,
  chaseSpeed: 1.65,
  returnSpeed: 1.1,
  detectionRadius: 3.3,
  disengageRadius: 7,
  contactRadius: 0.63,
});

export function approach(pos, path, speed, dt) {
  let travel = speed * dt;
  while (path.length && travel > 0) {
    const next = path[0],
      dx = next.x - pos.x,
      dy = next.y - pos.y,
      dist = Math.hypot(dx, dy);
    if (dist <= travel + 0.0001) {
      pos.x = next.x;
      pos.y = next.y;
      path.shift();
      travel -= dist;
    } else {
      pos.x += (dx / dist) * travel;
      pos.y += (dy / dist) * travel;
      travel = 0;
    }
  }
}

// Traverse every grid cell touched by the sight ray, including corner edges.
// Actor coordinates are tile centers, so cell boundaries lie at n + 0.5.
export function hasLineOfSight(map, from, to) {
  let x = Math.floor(from.x + 0.5),
    y = Math.floor(from.y + 0.5);
  const endX = Math.floor(to.x + 0.5),
    endY = Math.floor(to.y + 0.5);
  const dx = to.x - from.x,
    dy = to.y - from.y;
  const sx = Math.sign(dx),
    sy = Math.sign(dy);
  const stepX = dx ? 1 / Math.abs(dx) : Infinity;
  const stepY = dy ? 1 / Math.abs(dy) : Infinity;
  let crossX = dx ? (x + sx * 0.5 - from.x) / dx : Infinity;
  let crossY = dy ? (y + sy * 0.5 - from.y) / dy : Infinity;
  const open = (tx, ty) => map.tiles[ty]?.[tx] === 1;
  if (!open(x, y) || !open(endX, endY)) return false;
  while (x !== endX || y !== endY) {
    if (Math.abs(crossX - crossY) < 1e-9) {
      if (!open(x + sx, y) || !open(x, y + sy)) return false;
      x += sx;
      y += sy;
      crossX += stepX;
      crossY += stepY;
    } else if (crossX < crossY) {
      x += sx;
      crossX += stepX;
    } else {
      y += sy;
      crossY += stepY;
    }
    if (!open(x, y)) return false;
  }
  return true;
}

export function enemyInContact(map, player, enemy) {
  return (
    Math.hypot(player.x - enemy.x, player.y - enemy.y) <
      MOVEMENT.contactRadius && hasLineOfSight(map, enemy, player)
  );
}

export function updateEnemies(map, player, dt) {
  for (const enemy of map.enemies) {
    if (enemy.boss) continue; // The demo Warden remains a stationary guardian.
    const distance = Math.hypot(player.x - enemy.x, player.y - enemy.y);
    if (
      distance < MOVEMENT.detectionRadius &&
      hasLineOfSight(map, enemy, player)
    )
      enemy.alert = true;
    else if (distance > MOVEMENT.disengageRadius) enemy.alert = false;

    const goal = enemy.alert
      ? { x: Math.round(player.x), y: Math.round(player.y) }
      : { x: enemy.homeX, y: enemy.homeY };
    // Finish the current tile step before turning, including when returning home.
    const start = enemy.path?.[0] ?? {
      x: Math.round(enemy.x),
      y: Math.round(enemy.y),
    };
    if (
      !enemy.path?.length ||
      enemy.goalX !== goal.x ||
      enemy.goalY !== goal.y
    ) {
      enemy.path = pathfind(map, start, goal);
      if (Math.hypot(enemy.x - start.x, enemy.y - start.y) > 0.001)
        enemy.path.unshift(start);
      enemy.goalX = goal.x;
      enemy.goalY = goal.y;
    }
    approach(
      enemy,
      enemy.path,
      enemy.alert ? MOVEMENT.chaseSpeed : MOVEMENT.returnSpeed,
      dt,
    );
  }
}
