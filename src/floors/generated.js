import { seededRandom, pathfind } from "../dungeon.js";
import { asset } from "./asset-rules.js";
import { footprint } from "./dressing.js";
import { designFloorArt } from "./floor-art.js";
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
  const subdivision = seededRandom(`${seed}:subdivision`);
  let extraSplits = 0;
  function partition(x, y, w, h, depth) {
    const extra =
      depth === 2 &&
      extraSplits < 2 &&
      (w >= 14 || h >= 14) &&
      subdivision() < 0.65;
    const minX = extra ? 7 : 10,
      minY = extra ? 7 : 11;
    const canX = w >= minX * 2,
      canY = h >= minY * 2;
    if ((depth < 2 || extra) && (canX || canY)) {
      if (extra) extraSplits++;
      const vertical =
        canX && (!canY || w / h > 1.15 || (w / h > 0.8 && roll(2)));
      let a, b;
      if (vertical) {
        const cut = minX + roll(w - 2 * minX + 1);
        a = partition(x, y, cut, h, depth + 1);
        b = partition(x + cut, y, w - cut, h, depth + 1);
      } else {
        const cut = minY + roll(h - 2 * minY + 1);
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
    const rw = w - 2 - roll(Math.max(1, Math.min(3, w - 7))),
      rh = h - 2 - roll(Math.max(1, Math.min(3, h - 8)));
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
  const choices = [];
  for (let a = 0; a < rooms.length; a++)
    for (let b = a + 1; b < rooms.length; b++)
      if (!edges.some((e) => e.includes(a) && e.includes(b)))
        choices.push([a, b]);
  if (choices.length) {
    const [a, b] = choices[roll(choices.length)];
    connect(rooms[a], rooms[b]);
  }
  const shapeRandom = seededRandom(`${seed}:shapes`);
  for (const r of rooms) {
    const variant = Math.floor(shapeRandom() * 3),
      corner = Math.floor(shapeRandom() * 4);
    r.shape = ["clipped", "recessed", "L-shaped"][variant];
    const contour = seededRandom(`${seed}:contour:${r.id}`);
    const deep = contour() < 0.65 && r.w >= 7 && r.h >= 7;
    const cutWidth = Math.min(
      r.w - 3,
      Math.max(
        2,
        Math.floor(
          r.w * (deep ? 0.45 + contour() * 0.2 : variant === 1 ? 0.33 : 0.45),
        ),
      ),
    );
    const cutHeight = Math.min(
      r.h - 3,
      Math.max(
        2,
        Math.floor(
          r.h * (deep ? 0.5 + contour() * 0.2 : variant === 1 ? 0.33 : 0.55),
        ),
      ),
    );
    const secondRecess = deep && r.w * r.h >= 90 && contour() < 0.4;
    r.recessDepth = deep ? "deep" : "shallow";
    const removed = [];
    for (let y = r.y; y < r.y + r.h; y++)
      for (let x = r.x; x < r.x + r.w; x++) {
        const lx = x - r.x,
          ly = y - r.y,
          rx = r.w - 1 - lx,
          by = r.h - 1 - ly;
        const cx = corner % 2 ? rx : lx,
          cy = corner < 2 ? ly : by;
        const cut =
          variant === 0
            ? Math.min(lx, rx) + Math.min(ly, by) <
              Math.max(1, Math.floor(Math.min(r.w, r.h) * (deep ? 0.44 : 0.33)))
            : (cx < cutWidth && cy < cutHeight) ||
              (secondRecess &&
                r.w - 1 - cx < 2 &&
                r.h - 1 - cy < Math.floor(r.h * 0.3));
        if (
          cut &&
          !corridors.has(key({ x, y })) &&
          key({ x, y }) !== key(center(r))
        ) {
          removed.push({ x, y });
          terrain[y][x] = 0;
        }
      }
    const local = terrain.map((row, y) =>
      row.map((v, x) =>
        x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h ? v : 0,
      ),
    );
    if (
      reachable(local, center(r)).size !== local.flat().filter(Boolean).length
    ) {
      for (const p of removed) terrain[p.y][p.x] = 1;
      r.shape = "rectangular";
    }
    r.area = terrain
      .slice(r.y, r.y + r.h)
      .reduce(
        (n, row) => n + row.slice(r.x, r.x + r.w).filter(Boolean).length,
        0,
      );
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
  const treasureRoom = rooms
    .filter((r) => r !== entrance && r !== exitRoom)
    .sort((a, b) => b.w * b.h - a.w * a.h)[0];
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
    description: `${rooms.length} rooms grown from recursive partitions, connected by corridors and an extra return route. Larger spaces sometimes divide into smaller chambers.`,
    decision:
      "Explore for supplies and treasure, or head for the stairs. Walls and furniture interrupt sightlines; enemies can pursue through corridors.",
  };
  const reserved = new Set([key(spawn), key(exit)]),
    doors = [];
  for (const r of rooms) {
    for (let y = r.y; y < r.y + r.h; y++)
      for (let x = r.x; x < r.x + r.w; x++) {
        if (!terrain[y][x]) continue;
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
    if (count < r.area * 0.72 || reachable(local, center(r)).size !== count) {
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
  const object = (file, x, y) => ({ ...asset(file), x, y });
  const groupAt = (r, group) => tryGroup(r, group);
  // A chest is solid; validate it like furniture and reserve an adjacent approach.
  let chest;
  const candidates = [];
  for (let y = treasureRoom.y; y < treasureRoom.y + treasureRoom.h - 1; y++)
    for (let x = treasureRoom.x; x < treasureRoom.x + treasureRoom.w; x++)
      candidates.push({ x, y });
  candidates.sort(
    (a, b) =>
      Math.min(
        a.x - treasureRoom.x,
        treasureRoom.x + treasureRoom.w - 1 - a.x,
        a.y - treasureRoom.y,
      ) -
      Math.min(
        b.x - treasureRoom.x,
        treasureRoom.x + treasureRoom.w - 1 - b.x,
        b.y - treasureRoom.y,
      ),
  );
  for (const p of candidates) {
    if (!tryGroup(treasureRoom, [object("Chest.png", p.x, p.y)])) continue;
    m.props.pop();
    const approach = dirs
      .map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy }))
      .find((q) => tiles[q.y]?.[q.x] && !occupied.has(key(q)));
    if (!approach) throw Error("Chest approach missing");
    reserved.add(key(approach));
    chest = {
      id: "bsp-chest",
      ...p,
      solid: true,
      approach,
      type: "potion",
      opened: false,
      openProgress: 0,
    };
    break;
  }
  if (!chest) throw Error("No valid chest position");
  m.chests.push(chest);
  // Place purposeful groups, each with an approach aisle, at native orientation.
  const styleOrder = [...styles]; // Shuffle once so a floor has distinct rooms.
  for (let i = styleOrder.length - 1; i > 0; i--) {
    const j = pick(i + 1);
    [styleOrder[i], styleOrder[j]] = [styleOrder[j], styleOrder[i]];
  }
  for (const r of rooms) {
    r.style = styleOrder[r.id % styleOrder.length];
    r.purpose = {
      archive: "Reading room",
      store: "Store and supplies",
      memorial: "Burial chamber",
      pillars: "Audience chamber",
    }[r.style];
    m.regions.push({
      ...center(r),
      name:
        r.role === "entrance"
          ? `Arrival · ${r.purpose}`
          : r.role === "stairs"
            ? `Ascent · ${r.purpose}`
            : r.role === "treasure"
              ? `Treasury · ${r.purpose}`
              : r.purpose,
    });
    const north = r.y,
      middle = r.x + Math.floor(r.w / 2);
    for (let placed = 0; placed < 3; placed++) {
      for (let attempt = 0; attempt < 32; attempt++) {
        const x = r.x + 1 + pick(r.w - 2),
          y = r.y + 1 + pick(Math.max(1, r.h - 4));
        let group;
        if (r.style === "archive") {
          if (placed === 0)
            group = [
              object("Book shelf 01.png", x, north),
              object("Book shelf 02.png", x + 1, north),
            ];
          else if (placed === 1)
            group = [
              object("Table Long.png", x, y),
              object("Chair01.png", x, y - 1),
              object("Chair02.png", x + 2, y),
            ];
          else group = [object("Board Medium.png", x, north)];
        } else if (r.style === "store") {
          if (placed < 2)
            group = [
              object("Crate 01.png", x, north),
              object("Crate 02.png", x + 1, north),
            ];
          else group = [object("Board Medium.png", x, y)];
        } else if (r.style === "memorial") {
          const side = attempt % 2 ? r.x : r.x + r.w - 1;
          group =
            placed < 2
              ? [
                  object("Coffin.png", side, y),
                  object("Tombstone 01.png", side, y - 1),
                ]
              : [
                  object("Vase Grey.png", x, north),
                  object("Vase Grey.png", x + 2, north),
                ];
        } else {
          if (placed === 0)
            group = [
              object("Throne.png", middle, north),
              object("Vase Yellow.png", middle - 2, north),
              object("Vase Yellow.png", middle + 2, north),
            ];
          else if (placed === 1)
            group = [
              object("Table Long.png", x, y),
              object("Chair01.png", x, y - 1),
            ];
          else group = [object("Board Small.png", x, north)];
        }
        if (groupAt(r, group)) break;
      }
    }
    // Scale furnishing to area; failed hero arrangements cannot starve the room.
    const target = Math.floor(r.area * 0.18);
    const filled = () =>
      m.props
        .filter((p) => p.roomId === r.id && p.solid)
        .reduce((n, p) => n + footprint(p).length, 0);
    for (let attempt = 0; attempt < 100 && filled() < target; attempt++) {
      const left = attempt % 2 === 0;
      const x =
        attempt < 60 ? (left ? r.x : r.x + r.w - 2) : r.x + pick(r.w - 1);
      const y = r.y + 1 + pick(Math.max(1, r.h - 4));
      const group =
        r.style === "archive"
          ? [
              object("Book shelf 01.png", x, y),
              object("Book shelf 02.png", x + 1, y),
            ]
          : r.style === "store"
            ? [object("Crate 01.png", x, y), object("Crate 02.png", x + 1, y)]
            : r.style === "memorial"
              ? [
                  object("Coffin.png", x, y),
                  object("Tombstone 01.png", x, y - 1),
                ]
              : [
                  object("Board Small.png", x, y),
                  object("Vase Yellow.png", x + 1, y),
                ];
      groupAt(r, group);
    }
    // Standing fixtures have solid one-tile bases, not wall-mounted torches.
    for (const x of [r.x, r.x + r.w - 1])
      groupAt(r, [object("Lamp.png", x, north + 1)]);
  }
  // Place small details on their supporting furniture, not arbitrary ground.
  for (const p of [...m.props]) {
    let file;
    if (p.file === "Table Long.png")
      file = rooms[p.roomId].style === "archive" ? "Book Red.png" : "Apple.png";
    else if (p.file?.startsWith("Board"))
      file = rooms[p.roomId].style === "store" ? "Potion HP.png" : "Scroll.png";
    if (file)
      m.props.push({
        ...object(file, p.x, p.y),
        solid: false,
        roomId: p.roomId,
        support: { x: p.x, y: p.y, file: p.file },
        offsetY: -6,
        authored: true,
      });
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
  for (const r of [
    ...rooms.filter((r) => r !== entrance),
    ...rooms.filter((r) => r !== entrance && r.area >= 80),
  ]) {
    const p = choose(r, true);
    m.enemies.push({
      id: `bsp-enemy-${r.id}-${m.enemies.length}`,
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
      const file =
        r.style === "archive"
          ? "Paiting 1.png"
          : r.style === "memorial"
            ? "Wall Chain 01.png"
            : r.style === "store"
              ? "Wall Chain 02.png"
              : "Flag Red.png";
      if (r.style === "archive" && m.wallDecor.some((p) => p.roomId === r.id))
        continue;
      // Avoid hanging artwork directly behind tall floor furnishings.
      if (
        m.props.some((p) => p.solid && p.y === r.y && x >= p.x && x < p.x + p.w)
      )
        continue;
      m.wallDecor.push({ ...object(file, x, faceY), roomId: r.id });
    }
  }
  // Sparse floor details only beside an appropriate existing object.
  for (const r of rooms) {
    const supports = m.props.filter(
      (p) =>
        p.roomId === r.id && p.solid && /Book shelf|Coffin|Vase/.test(p.file),
    );
    for (const p of supports.slice(0, 2)) {
      const q = dirs
        .map(([dx, dy]) => ({ x: p.x + dx, y: p.y + dy }))
        .find(
          (q) =>
            tiles[q.y]?.[q.x] &&
            !reserved.has(key(q)) &&
            !occupied.has(key(q)) &&
            q.x >= r.x &&
            q.x < r.x + r.w &&
            q.y >= r.y &&
            q.y < r.y + r.h,
        );
      if (!q) continue;
      const file = p.file.startsWith("Book shelf")
        ? "Pile of Books 01.png"
        : p.file === "Coffin.png"
          ? "Skulls.png"
          : "Vase Grey Broken.png";
      m.props.push({
        ...object(file, q.x, q.y),
        solid: false,
        roomId: r.id,
        near: { x: p.x, y: p.y, file: p.file },
      });
      occupied.add(key(q));
    }
  }
  designFloorArt(m);
  m.routes = [
    [spawn, exit],
    [spawn, m.chests[0].approach, exit],
  ];
  const reached = reachable(tiles, spawn);
  if (
    reached.size !== tiles.flat().filter(Boolean).length ||
    ![exit, ...m.chests.map((c) => c.approach), ...m.enemies].every((p) =>
      reached.has(key(p)),
    )
  )
    throw Error("Invalid generated connectivity");
  return m;
}
