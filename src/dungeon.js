/** Small, deterministic room-prefab assembler. Zero tiles are walls. */
export function seededRandom(seed) {
  let value = 2166136261;
  for (const c of String(seed))
    value = Math.imul(value ^ c.charCodeAt(0), 16777619);
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function roomAt(map, x, y) {
  return (
    map.rooms.find(
      (r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h,
    ) ?? null
  );
}
export function pathfind(map, start, end) {
  const walkable = (p) =>
    Number.isInteger(p.x) &&
    Number.isInteger(p.y) &&
    map.tiles[p.y]?.[p.x] === 1;
  if (!walkable(start) || !walkable(end)) return [];
  const key = (p) => `${p.x},${p.y}`;
  const queue = [{ x: start.x, y: start.y }],
    parents = new Map([[key(start), null]]);
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    if (p.x === end.x && p.y === end.y) {
      const result = [];
      let step = p;
      while (parents.get(key(step))) {
        result.push(step);
        step = parents.get(key(step));
      }
      return result.reverse();
    }
    for (const [dx, dy] of [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
    ]) {
      const n = { x: p.x + dx, y: p.y + dy };
      if (walkable(n) && !parents.has(key(n))) {
        parents.set(key(n), p);
        queue.push(n);
      }
    }
  }
  return [];
}
export function generateDungeon(seed = "the-scroll", floor = 1) {
  const random = seededRandom(`${seed}:${floor}`),
    roll = (n) => Math.floor(random() * n);
  const width = 19,
    height = 25;
  // Four separated slots retain readable room boundaries; prefabs vary within each slot.
  const rooms = [
    [1, 15],
    [11, 15],
    [1, 2],
    [11, 2],
  ].map(([sx, sy], id) => {
    const w = 5 + roll(3),
      h = 6 + roll(3);
    return {
      id,
      x: sx + roll(8 - w),
      y: sy + roll(10 - h),
      w,
      h,
      role: [
        "entrance",
        "treasure",
        "encounter",
        floor === 3 ? "boss" : "stairs",
      ][id],
    };
  });
  const tiles = Array.from({ length: height }, () => Array(width).fill(0));
  for (const r of rooms)
    for (let y = r.y; y < r.y + r.h; y++)
      for (let x = r.x; x < r.x + r.w; x++) tiles[y][x] = 1;
  const center = (r) => ({
    x: r.x + Math.floor(r.w / 2),
    y: r.y + Math.floor(r.h / 2),
  });
  const edges = [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 3],
  ];
  const corridorTiles = new Set();
  const carve = (from, to) => {
    const p = { ...from };
    while (p.x !== to.x || p.y !== to.y) {
      tiles[p.y][p.x] = 1;
      corridorTiles.add(`${p.x},${p.y}`);
      if (p.x !== to.x) p.x += Math.sign(to.x - p.x);
      else p.y += Math.sign(to.y - p.y);
    }
    tiles[p.y][p.x] = 1;
    corridorTiles.add(`${p.x},${p.y}`);
  };
  for (const [a, b] of edges) {
    const p = center(rooms[a]),
      q = center(rooms[b]);
    // Bends stay in the inter-room gaps so rooms and corridors remain distinct.
    const points =
      (a === 0 && b === 1) || (a === 2 && b === 3)
        ? [p, { x: 9 + roll(2), y: p.y }, { x: 9, y: q.y }, q]
        : [p, { x: p.x, y: 12 + roll(2) }, { x: q.x, y: 12 + roll(2) }, q];
    for (let i = 1; i < points.length; i++) carve(points[i - 1], points[i]);
  }
  const spawn = center(rooms[0]),
    stairRoom = rooms[3];
  const stairs = { x: stairRoom.x + stairRoom.w - 2, y: stairRoom.y + 1 };
  const occupied = new Set([
    `${spawn.x},${spawn.y}`,
    `${stairs.x},${stairs.y}`,
  ]);
  const choose = (r) => {
    const candidates = [];
    for (let y = r.y + 1; y < r.y + r.h - 1; y++)
      for (let x = r.x + 1; x < r.x + r.w - 1; x++)
        if (!occupied.has(`${x},${y}`) && !corridorTiles.has(`${x},${y}`))
          candidates.push({ x, y });
    const p = candidates[roll(candidates.length)];
    occupied.add(`${p.x},${p.y}`);
    return p;
  };
  const chests = [{ id: `chest-${floor}`, ...choose(rooms[1]), roomId: 1 }];
  const enemies = rooms
    .slice(1)
    .map((r, i) => ({
      id: `enemy-${floor}-${i}`,
      ...choose(r),
      roomId: r.id,
      kind: ["slime", "bat", "skeleton"][(i + floor - 1) % 3],
    }));
  if (floor === 3) {
    const boss = { x: stairs.x, y: stairs.y + 2 };
    // The boss owns its tile; move a regular monster if its random placement overlaps.
    const overlap = enemies.find((e) => e.x === boss.x && e.y === boss.y);
    occupied.add(`${boss.x},${boss.y}`);
    if (overlap) Object.assign(overlap, choose(stairRoom));
    enemies.push({
      id: "warden",
      ...boss,
      roomId: 3,
      kind: "boss",
      boss: true,
    });
  }
  // Isolated support pillars add room silhouettes without narrowing doorways.
  // Never put them on connector axes or content, or adjacent to another pillar.
  const pillars = [];
  for (const r of rooms.slice(1))
    if (r.w >= 6 && roll(2)) {
      const p = choose(r);
      tiles[p.y][p.x] = 0;
      pillars.push(p);
    }
  return {
    seed,
    floor,
    width,
    height,
    tiles,
    rooms,
    spawn,
    stairs,
    enemies,
    chests,
    edges,
    pillars,
    bossFloor: floor === 3,
  };
}
