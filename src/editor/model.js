import { asset, ASSET_RULES, isDoor } from "./catalog.js";
import { footprint } from "../floors/dressing.js";
import { reachable } from "../floors/generated.js";
import { FLOOR_FRAMES, terrainSprites } from "../tileset/render.js";
export const SIZE = 18;
export function newRoom(name = "Untitled room") {
  return {
    version: 1,
    id: crypto.randomUUID(),
    name,
    purpose: "Ordinary room",
    usage: "reference",
    weight: 1,
    notes: "",
    terrain: Array.from({ length: SIZE }, (_, y) =>
      Array.from(
        { length: SIZE },
        (_, x) => +(x >= 4 && x <= 13 && y >= 4 && y <= 13),
      ),
    ),
    frames: Array.from({ length: SIZE }, () => Array(SIZE).fill(11)),
    props: [],
    markers: [],
  };
}
const directions = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
export function doorwayPosition(room, x, y) {
  if (
    room.terrain[y]?.[x] === 0 &&
    room.terrain[y + 1]?.[x] === 0 &&
    room.terrain[y + 2]?.[x] === 1
  )
    y++;
  if (
    x < 1 ||
    y < 1 ||
    x >= SIZE - 1 ||
    y >= SIZE - 1 ||
    room.terrain[y][x] === -1
  )
    return null;
  const onFloor = room.terrain[y][x] === 1;
  if (
    !directions.some(([dx, dy]) =>
      onFloor
        ? room.terrain[y + dy]?.[x + dx] === 0
        : room.terrain[y + dy]?.[x + dx] === 1,
    )
  )
    return null;
  return { x, y };
}
export function connections(room) {
  return [
    ...room.markers.filter((p) => p.kind === "entrance"),
    ...room.props
      .filter((p) => isDoor(p.file))
      .flatMap((p) =>
        footprint({ ...asset(p.file), ...p })
          .filter((q) => doorwayPosition(room, q.x, q.y))
          .map((q) => ({ ...q, kind: "entrance" })),
      ),
  ];
}
export function roomSprites(room) {
  const doors = connections(room);
  const faces = room.props.filter(
    (p) => ASSET_RULES[p.file].category === "Wall bottoms",
  );
  const sprites = terrainSprites(room.terrain, room.frames)
    .filter(
      (s) =>
        !faces.some(
          (p) =>
            s.x === p.x &&
            (s.y === p.y || (s.layer === "wall" && s.y === p.y - 1)),
        ),
    )
    .filter(
      (s) =>
        !doors.some(
          (d) =>
            s.x === d.x &&
            (s.y === d.y ||
              (s.layer === "wall" &&
                s.y === d.y - 1 &&
                (room.terrain[d.y + 1]?.[d.x] === 1 ||
                  room.terrain[d.y - 1]?.[d.x] === 1))),
        ),
    );
  return [
    ...sprites,
    ...doors.map((d) => ({
      ...d,
      frame: room.frames[d.y][d.x],
      layer: "floor",
    })),
  ];
}
export function collision(room) {
  const tiles = room.terrain.map((row) => row.map((v) => (v === 1 ? 1 : 0)));
  for (const p of connections(room))
    if (p.kind === "entrance" && doorwayPosition(room, p.x, p.y))
      tiles[p.y][p.x] = 1;
  for (const kind of ["acid", "bridge", "stairs"])
    for (const p of room.props.filter((p) => ASSET_RULES[p.file].kind === kind))
      for (const q of footprint({ ...asset(p.file), ...p }))
        if (tiles[q.y]) tiles[q.y][q.x] = kind === "acid" ? 0 : 1;
  for (const p of room.props)
    if (asset(p.file).solid)
      for (const q of footprint({ ...asset(p.file), ...p }))
        if (tiles[q.y]) tiles[q.y][q.x] = 0;
  return tiles;
}
export function validate(room) {
  const errors = [];
  const tiles = collision(room);
  const cells = tiles.flatMap((row, y) =>
    row.flatMap((v, x) => (v ? [{ x, y }] : [])),
  );
  if (!cells.length) return ["Paint some walkable floor."];
  if (reachable(tiles, cells[0]).size !== cells.length)
    errors.push("Some floor areas cannot be reached.");
  const entrances = connections(room);
  if (!entrances.length)
    errors.push("Mark at least one entrance on a floor edge.");
  for (const p of room.markers) {
    if (!tiles[p.y]?.[p.x]) errors.push(`${p.kind} needs an open floor tile.`);
    if (p.kind === "entrance" && !doorwayPosition(room, p.x, p.y))
      errors.push("Doorways must touch a floor edge or its wall.");
  }
  for (const p of entrances)
    if (
      ![
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].some(([dx, dy]) => tiles[p.y + dy]?.[p.x + dx])
    )
      errors.push("An entrance has no clear approach.");
  return [...new Set(errors)];
}
export function placeAsset(room, file, x, y, { restoring = false } = {}) {
  if (isDoor(file) && !restoring) {
    const anchor = doorwayPosition(room, x, y);
    if (!anchor) return false;
    x = anchor.x;
    y = anchor.y;
  }
  const a = asset(file),
    wall = ASSET_RULES[file].category === "Wall decoration";
  const cells = footprint({ ...a, x, y });
  const kind = ASSET_RULES[file].kind;
  if (cells.some((p) => p.x < 0 || p.y < 0 || p.x >= SIZE || p.y >= SIZE))
    return false;
  if (
    !restoring &&
    isDoor(file) &&
    cells.some((p) => !doorwayPosition(room, p.x, p.y))
  )
    return false;
  if (
    !restoring &&
    (wall
      ? room.terrain[y]?.[x] || !room.terrain[y + 1]?.[x]
      : !isDoor(file) &&
        !["bridge", "acid", "ledge", "stairs"].includes(kind) &&
        cells.some((p) => room.terrain[p.y]?.[p.x] !== 1))
  )
    return false;
  const overlaps = room.props.filter((p) =>
    footprint({ ...asset(p.file), ...p }).some(
      (q) =>
        cells.some((c) => c.x === q.x && c.y === q.y) &&
        !(kind === "bridge" && ASSET_RULES[p.file].kind === "acid") &&
        !(kind === "acid" && ASSET_RULES[p.file].kind === "bridge") &&
        !(kind === "carpet" && !ASSET_RULES[p.file].kind) &&
        !(!kind && ASSET_RULES[p.file].kind === "carpet"),
    ),
  );
  const support =
    !a.solid &&
    /tabletop/i.test(ASSET_RULES[file].category) &&
    overlaps.length === 1 &&
    /^(Table|Board)/.test(overlaps[0].file)
      ? overlaps[0]
      : null;
  if (overlaps.length && !support) return false;
  if (
    a.solid &&
    cells.some((p) => room.markers.some((q) => q.x === p.x && q.y === p.y))
  )
    return false;
  room.props.push({ file, x, y, ...(support ? { offsetY: -6 } : {}) });
  return true;
}
export function parseRoom(text) {
  const r = JSON.parse(text);
  // Migrate the original combined stair stamps into their two authored halves.
  const oldStairs = {
    "Stairs left.png": "low",
    "Stairs right.png": "broad",
    "Stairs tall left.png": "tall",
    "Stairs tall right.png": "steep",
  };
  if (Array.isArray(r.props))
    r.props = r.props.flatMap((p) =>
      oldStairs[p.file]
        ? [
            { ...p, file: `Stairs ${oldStairs[p.file]} left.png` },
            { ...p, file: `Stairs ${oldStairs[p.file]} right.png`, x: p.x + 2 },
          ]
        : [p],
    );

  if (
    r.version !== 1 ||
    typeof r.name !== "string" ||
    !["reference", "template"].includes(r.usage) ||
    !Number.isFinite(r.weight) ||
    r.weight < 1 ||
    r.weight > 100
  )
    throw Error("This is not a supported room file.");
  for (const field of ["terrain", "frames"])
    if (
      !Array.isArray(r[field]) ||
      r[field].length !== SIZE ||
      r[field].some(
        (row) =>
          !Array.isArray(row) ||
          row.length !== SIZE ||
          row.some((v) =>
            field === "terrain"
              ? ![-1, 0, 1].includes(v)
              : !FLOOR_FRAMES.includes(v),
          ),
      )
    )
      throw Error("Invalid room grid.");
  if (
    !Array.isArray(r.props) ||
    !Array.isArray(r.markers) ||
    r.props.length > SIZE * SIZE ||
    r.markers.length > SIZE * SIZE
  )
    throw Error("Invalid room contents.");
  const pos = (p) =>
    Number.isInteger(p.x) &&
    Number.isInteger(p.y) &&
    p.x >= 0 &&
    p.y >= 0 &&
    p.x < SIZE &&
    p.y < SIZE;
  if (
    r.props.some((p) => !pos(p) || !Object.hasOwn(ASSET_RULES, p.file)) ||
    r.markers.some(
      (p) =>
        !pos(p) ||
        !["entrance", "enemy", "treasure", "key", "trap", "spawn"].includes(
          p.kind,
        ),
    )
  )
    throw Error("Unknown asset or marker.");
  const clean = {
    ...newRoom(r.name),
    id: typeof r.id === "string" ? r.id : crypto.randomUUID(),
    purpose: String(r.purpose || "Ordinary room"),
    usage: r.usage,
    weight: r.weight,
    notes: String(r.notes || ""),
    terrain: r.terrain,
    frames: r.frames,
    props: [],
    markers: r.markers.map(({ kind, x, y }) => ({ kind, x, y })),
  };
  for (const p of r.props)
    if (!placeAsset(clean, p.file, p.x, p.y, { restoring: true }))
      throw Error("An asset overlaps or has invalid placement.");
  return clean;
}
export function exampleRoom(kind) {
  const r = newRoom(kind);
  r.purpose = kind;
  r.markers = [
    { kind: "entrance", x: 8, y: 13 },
    { kind: "spawn", x: 8, y: 12 },
  ];
  if (kind === "Reading room") {
    for (const x of [5, 6, 11, 12]) placeAsset(r, "Book shelf 01.png", x, 4);
    placeAsset(r, "Table Long.png", 6, 8);
    placeAsset(r, "Chair01.png", 6, 7);
    placeAsset(r, "Table Long.png", 10, 8);
    placeAsset(r, "Chair01.png", 10, 7);
  } else if (kind === "Treasure room") {
    r.markers.push(
      { kind: "treasure", x: 8, y: 5 },
      { kind: "key", x: 5, y: 10 },
      { kind: "trap", x: 8, y: 8 },
    );
    for (const x of [5, 11]) placeAsset(r, "Vase Yellow.png", x, 5);
  } else {
    r.markers.push(
      { kind: "enemy", x: 8, y: 6 },
      { kind: "entrance", x: 13, y: 8 },
    );
    for (const x of [5, 11]) placeAsset(r, "Coffin.png", x, 6);
  }
  return r;
}
