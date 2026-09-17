import { seededRandom, pathfind } from "../dungeon.js";
import { footprint } from "./dressing.js";
import { FLOOR_FRAMES } from "../tileset/render.js";
const dirs = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
const key = (p) => `${p.x},${p.y}`;
const center = (r) => ({
  x: r.x + Math.floor(r.w / 2),
  y: r.y + Math.floor(r.h / 2),
});
export function reachable(tiles, start) {
  const visited = new Set(),
    queue = [start];
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    if (!tiles[p.y]?.[p.x] || visited.has(key(p))) continue;
    visited.add(key(p));
    for (const [dx, dy] of dirs) queue.push({ x: p.x + dx, y: p.y + dy });
  }
  return visited;
}
export function generateBspFloor(seed = "stone-01") {
  const random = seededRandom(`${seed}:layout`),
    roll = (n) => Math.floor(random() * n);
  const width = 25,
    height = 29,
    rooms = [],
    edges = [],
    corridors = new Set();
  const terrain = Array.from({ length: height }, () => Array(width).fill(0));
  const carve = (x, y) => {
    if (x > 0 && y > 0 && x < width - 1 && y < height - 1) terrain[y][x] = 1;
  };
  function connect(a, b) {
    const p = { ...center(a) },
      q = center(b),
      horizontalFirst = !!roll(2);
    function walk(axis) {
      const brush = () => {
        for (let dy = 0; dy < 2; dy++)
          for (let dx = 0; dx < 2; dx++) {
            carve(p.x + dx, p.y + dy);
            corridors.add(key({ x: p.x + dx, y: p.y + dy }));
          }
      };
      while (p[axis] !== q[axis]) {
        brush();
        p[axis] += Math.sign(q[axis] - p[axis]);
      }
      brush();
    }
    walk(horizontalFirst ? "x" : "y");
    walk(horizontalFirst ? "y" : "x");
    edges.push([a.id, b.id]);
  }
  function partition(x, y, w, h, depth) {
    const canX = w >= 20,
      canY = h >= 22;
    if (depth < 2 && (canX || canY)) {
      const vertical =
        canX && (!canY || w / h > 1.15 || (w / h > 0.8 && roll(2)));
      let a, b;
      if (vertical) {
        const cut = 10 + roll(w - 19);
        a = partition(x, y, cut, h, depth + 1);
        b = partition(x + cut, y, w - cut, h, depth + 1);
      } else {
        const cut = 11 + roll(h - 21);
        a = partition(x, y, w, cut, depth + 1);
        b = partition(x, y + cut, w, h - cut, depth + 1);
      }
      let pair = [a[0], b[0]],
        best = Infinity;
      for (const aa of a)
        for (const bb of b) {
          const p = center(aa),
            q = center(bb),
            d = Math.abs(p.x - q.x) + Math.abs(p.y - q.y);
          if (d < best) {
            best = d;
            pair = [aa, bb];
          }
        }
      connect(...pair);
      return [...a, ...b];
    }
    const rw = w - 2 - roll(Math.min(3, w - 7)),
      rh = h - 2 - roll(Math.min(3, h - 8));
    const r = {
      id: rooms.length,
      x: x + 1 + roll(w - rw - 1),
      y: y + 1 + roll(h - rh - 1),
      w: rw,
      h: rh,
      role: "encounter",
    };
    rooms.push(r);
    for (let yy = r.y; yy < r.y + rh; yy++)
      for (let xx = r.x; xx < r.x + rw; xx++) carve(xx, yy);
    return [r];
  }
  partition(1, 2, width - 2, height - 3, 0);
  // Add a single extra connection to the spanning tree, creating a return route.
  const choices = [];
  for (let a = 0; a < rooms.length; a++)
    for (let b = a + 1; b < rooms.length; b++)
      if (!edges.some((e) => e.includes(a) && e.includes(b)))
        choices.push([a, b]);
  if (choices.length) {
    const [a, b] = choices[roll(choices.length)];
    connect(rooms[a], rooms[b]);
  }
  const entrance = rooms.reduce((a, b) => (center(b).y > center(a).y ? b : a)),
    spawn = center(entrance);
  const exitRoom = rooms
    .filter((r) => r !== entrance)
    .sort(
      (a, b) =>
        pathfind({ tiles: terrain }, spawn, center(b)).length -
        pathfind({ tiles: terrain }, spawn, center(a)).length,
    )[0];
  entrance.role = "entrance";
  exitRoom.role = "stairs";
  const treasureRoom = rooms.find((r) => r !== entrance && r !== exitRoom);
  treasureRoom.role = "treasure";
  const exit = center(exitRoom),
    tiles = terrain.map((row) => [...row]);
  const m = {
    id: "bsp",
    seed,
    name: "The shifting archive",
    subtitle: "A different floor from every seed",
    width,
    height,
    palette: "ink",
    terrain,
    tiles,
    rooms,
    edges,
    spawn,
    exit,
    stairs: exit,
    water: [],
    rugs: [],
    props: [],
    enemies: [],
    chests: [],
    regions: [],
    routes: [],
    generated: true,
    description:
      "Four rooms grown from recursive partitions, connected by corridors and an extra return route. Furnishings are placed around clear entrances.",
    decision:
      "Explore for supplies and treasure, or head for the stairs. Walls and furniture interrupt sightlines; enemies can pursue through corridors.",
  };
  const reserved = new Set([key(spawn), key(exit)]),
    doors = [];
  for (const r of rooms) {
    for (let y = r.y; y < r.y + r.h; y++)
      for (let x = r.x; x < r.x + r.w; x++) {
        if (
          !dirs.some(
            ([dx, dy]) =>
              (x + dx < r.x ||
                x + dx >= r.x + r.w ||
                y + dy < r.y ||
                y + dy >= r.y + r.h) &&
              terrain[y + dy]?.[x + dx],
          )
        )
          continue;
        doors.push({ x, y, roomId: r.id });
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++)
            reserved.add(key({ x: x + dx, y: y + dy }));
      }
    // Reserve center for labels / objectives, not a full cross through every room.
    reserved.add(key(center(r)));
  }
  m.doors = doors;
  const furnish = seededRandom(`${seed}:furniture`),
    pick = (n) => Math.floor(furnish() * n),
    occupied = new Set();
  const styles = ["archive", "store", "memorial", "pillars"];
  function tryGroup(r, group) {
    const cells = group.flatMap(footprint),
      seen = new Set();
    for (const p of cells) {
      if (
        p.x < r.x ||
        p.x >= r.x + r.w ||
        p.y < r.y ||
        p.y >= r.y + r.h - 1 ||
        !tiles[p.y]?.[p.x] ||
        reserved.has(key(p)) ||
        occupied.has(key(p)) ||
        seen.has(key(p))
      )
        return false;
      seen.add(key(p));
    }
    for (const p of cells) tiles[p.y][p.x] = 0;
    const local = tiles.map((row, y) =>
      row.map((v, x) =>
        x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h ? v : 0,
      ),
    );
    const count = local.flat().filter(Boolean).length;
    if (
      count < r.w * r.h * 0.72 ||
      reachable(local, center(r)).size !== count
    ) {
      for (const p of cells) tiles[p.y][p.x] = 1;
      return false;
    }
    for (const p of cells) occupied.add(key(p));
    m.props.push(
      ...group.map((p) => ({
        ...p,
        solid: true,
        authored: true,
        roomId: r.id,
      })),
    );
    return true;
  }
  for (const r of rooms) {
    r.style = styles[pick(styles.length)];
    m.regions.push({
      ...center(r),
      name:
        r.role === "entrance"
          ? "Arrival"
          : r.role === "stairs"
            ? "Ascent"
            : r.role === "treasure"
              ? "Treasury"
              : r.style === "archive"
                ? "Reading room"
                : r.style === "store"
                  ? "Storeroom"
                  : r.style === "memorial"
                    ? "Memorial"
                    : "Urn chamber",
    });
    let placed = 0;
    for (
      let attempt = 0;
      attempt < 35 && placed < (r.role === "entrance" ? 1 : 3);
      attempt++
    ) {
      const x = r.x + pick(r.w),
        y = r.y + pick(r.h);
      let group;
      if (r.style === "archive")
        group =
          attempt % 2
            ? [{ key: "bookshelf", x, y: r.y, w: 1, h: 1 }]
            : [
                { key: "table", x, y, w: 2, h: 1 },
                { key: "chair", x, y: y + 1, w: 1, h: 1 },
              ];
      else if (r.style === "store")
        group = [
          { key: "crate", x, y: r.y, w: 1, h: 1 },
          { key: "crate", x: x + 1, y: r.y, w: 1, h: 1 },
        ];
      else if (r.style === "memorial")
        group = [
          { key: "coffin", x: pick(2) ? r.x : r.x + r.w - 1, y, w: 1, h: 2 },
        ];
      else
        group = [
          { key: "vase-grey", x, y, w: 1, h: 1 },
          { key: "vase-grey", x: x + 2, y, w: 1, h: 1 },
        ];
      if (tryGroup(r, group)) placed++;
    }
  }
  function choose(r, avoidSpawn = false) {
    const candidates = [];
    for (let y = r.y + 1; y < r.y + r.h - 1; y++)
      for (let x = r.x + 1; x < r.x + r.w - 1; x++)
        if (
          tiles[y][x] &&
          !reserved.has(key({ x, y })) &&
          !occupied.has(key({ x, y })) &&
          (!avoidSpawn || Math.hypot(x - spawn.x, y - spawn.y) >= 6)
        )
          candidates.push({ x, y });
    if (!candidates.length) throw Error("No content position");
    const p = candidates[pick(candidates.length)];
    occupied.add(key(p));
    return p;
  }
  m.chests.push({
    id: "bsp-chest",
    ...choose(treasureRoom),
    type: "potion",
    opened: false,
  });
  for (const r of rooms.filter((r) => r !== entrance)) {
    const p = choose(r, true);
    m.enemies.push({
      id: `bsp-enemy-${r.id}`,
      ...p,
      homeX: p.x,
      homeY: p.y,
      kind: ["slime", "bat", "skeleton"][m.enemies.length % 3],
      roomId: r.id,
      alert: false,
      path: [],
    });
  }
  // Mount decorations on exposed north faces, away from doorways.
  m.wallDecor = [];
  m.wallFinishes = [];
  for (const r of rooms) {
    const faceY = r.y - 1;
    for (let x = r.x + 1; x < r.x + r.w - 1; x++) {
      if (
        terrain[faceY][x] ||
        !terrain[faceY + 1][x] ||
        doors.some(
          (d) => d.roomId === r.id && Math.abs(d.x - x) <= 1 && d.y <= r.y + 1,
        )
      )
        continue;
      if (r.style === "memorial" || r.style === "store")
        m.wallFinishes.push({ x, y: faceY, frame: 91 });
      if ((x - r.x) % 3 !== 1) continue;
      const decorKey =
        (x - r.x) % 6 === 1
          ? "torch"
          : r.style === "archive"
            ? "painting"
            : r.style === "memorial"
              ? "banner-green"
              : r.style === "store"
                ? "chain"
                : "banner-red";
      m.wallDecor.push({ key: decorKey, x, y: faceY });
    }
  }
  // Decorative clutter has its own placement, never changes collision.
  for (const r of rooms) {
    for (let i = 0; i < 2; i++) {
      const p = choose(r);
      m.props.push({
        key: r.style === "archive" ? "books" : "broken-vase",
        ...p,
        solid: false,
      });
    }
  }
  const art = seededRandom(`${seed}:floor-art`);
  m.floorFrames = terrain.map((row) =>
    row.map((v) => (v ? FLOOR_FRAMES[Math.floor(art() * 16)] : null)),
  );
  m.routes = [
    [spawn, exit],
    [spawn, m.chests[0], exit],
  ];
  const reached = reachable(tiles, spawn);
  if (
    reached.size !== tiles.flat().filter(Boolean).length ||
    ![exit, ...m.chests, ...m.enemies].every((p) => reached.has(key(p)))
  )
    throw Error("Invalid generated connectivity");
  return m;
}
