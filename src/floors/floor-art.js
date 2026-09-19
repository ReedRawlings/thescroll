import { seededRandom, pathfind } from "../dungeon.js";

// Quiet room fields, contiguous wear patches, and a shared paving route.
export function designFloorArt(map) {
  const random = seededRandom(`${map.seed}:floor-art`);
  const pick = (values) => values[Math.floor(random() * values.length)];
  map.floorFrames = map.terrain.map((row) => row.map((v) => (v ? 10 : null)));
  map.floorDesigns = [];
  for (const r of map.rooms) {
    const base = pick([1, 11, 20, 30]);
    const wear = pick([0, 12, 21, 22, 31, 33]);
    const inside = (x, y) =>
      x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
    const patches = Array.from({ length: 2 }, () => ({
      x: r.x + Math.floor(random() * r.w),
      y: r.y + Math.floor(random() * r.h),
    }));
    for (let y = r.y; y < r.y + r.h; y++)
      for (let x = r.x; x < r.x + r.w; x++)
        if (map.terrain[y][x])
          map.floorFrames[y][x] = patches.some(
            (p) =>
              Math.abs(x - p.x) + Math.abs(y - p.y) <= (r.w * r.h < 60 ? 0 : 1),
          )
            ? wear
            : base;

    // Select one corner treatment per room instead of scattering every motif.
    const corner = pick([2, 3, 13, 23]);
    const cx = random() < 0.5 ? r.x : r.x + r.w - 1;
    if (map.terrain[r.y + r.h - 1][cx])
      map.floorFrames[r.y + r.h - 1][cx] = corner;
    const roomDoors = map.doors.filter((d) => d.roomId === r.id);
    const routeStyle = ["direct", "offset", "unmarked"][r.id % 3];
    const open = [];
    for (let y = r.y; y < r.y + r.h; y++)
      for (let x = r.x; x < r.x + r.w; x++)
        if (map.tiles[y][x]) open.push({ x, y });
    const hub =
      routeStyle === "offset" ? pick(open) : (roomDoors[0] ?? pick(open));
    const local = map.tiles.map((row, y) =>
      row.map((v, x) => (inside(x, y) ? v : 0)),
    );
    const path = new Map();
    for (const door of routeStyle === "unmarked" ? [] : roomDoors) {
      for (const p of [hub, ...pathfind({ tiles: local }, hub, door)])
        path.set(`${p.x},${p.y}`, p);
    }
    const pathFrame = pick([10, 32]);
    for (const p of path.values()) map.floorFrames[p.y][p.x] = pathFrame;
    map.floorDesigns.push({
      roomId: r.id,
      routeStyle,
      base,
      wear,
      pathFrame,
      path: [...path.values()],
    });
  }
}
