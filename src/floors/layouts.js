import { pathfind, seededRandom } from "../dungeon.js";
import { dressFloor, footprint } from "./dressing.js";

// Original authored floor plans. See docs/design/floor-examples.md for source references.
const make = (
  id,
  name,
  subtitle,
  width,
  height,
  palette,
  description,
  decision,
) => ({
  id,
  name,
  subtitle,
  width,
  height,
  palette,
  description,
  decision,
  tiles: Array.from({ length: height }, () => Array(width).fill(0)),
  water: [],
  regions: [],
  props: [],
  enemies: [],
  chests: [],
  routes: [],
});
const rect = (m, x, y, w, h, value = 1) => {
  for (let yy = y; yy < y + h; yy++)
    for (let xx = x; xx < x + w; xx++) m.tiles[yy][xx] = value;
};
function ellipse(m, cx, cy, rx, ry) {
  for (let y = cy - ry; y <= cy + ry; y++)
    for (let x = cx - rx; x <= cx + rx; x++)
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) m.tiles[y][x] = 1;
}
function hall(m, points, width = 1) {
  for (let i = 1; i < points.length; i++) {
    let [x, y] = points[i - 1];
    const [tx, ty] = points[i];
    while (x !== tx || y !== ty) {
      rect(m, x, y, width, width);
      if (x !== tx) x += Math.sign(tx - x);
      else y += Math.sign(ty - y);
    }
    rect(m, x, y, width, width);
  }
}
const region = (m, name, x, y) => m.regions.push({ name, x, y });
const prop = (m, key, x, y, solid = false) => {
  m.props.push({ key, x, y, solid });
  if (solid) m.tiles[y][x] = 0;
};
const enemy = (m, x, y, kind = "skeleton", elite = false) =>
  m.enemies.push({
    id: `${m.id}-${m.enemies.length}`,
    x,
    y,
    homeX: x,
    homeY: y,
    kind,
    elite,
    alert: false,
    path: [],
  });
const chest = (m, x, y, type = "gold") =>
  m.chests.push({
    id: `${m.id}-chest-${m.chests.length}`,
    x,
    y,
    type,
    opened: false,
  });
const pool = (m, x, y, w, h) => {
  for (let yy = y; yy < y + h; yy++)
    for (let xx = x; xx < x + w; xx++) m.water.push({ x: xx, y: yy });
};
function decorate(m, seed) {
  dressFloor(m);
  const random = seededRandom(`${m.id}:${seed}`),
    occupied = new Set(
      [
        m.spawn,
        m.exit,
        ...m.enemies,
        ...m.chests,
        ...m.props.flatMap(footprint),
      ].map((p) => `${p.x},${p.y}`),
    );
  const keys =
    m.id === "catacombs"
      ? ["skulls", "broken-vase"]
      : m.id === "archive"
        ? ["books", "broken-vase"]
        : m.id === "bastion"
          ? ["skulls", "broken-vase"]
          : ["broken-vase", "books"];
  // Edge clustering: no random blocking furniture; walkability is authored separately.
  for (let y = 2; y < m.height - 2; y++)
    for (let x = 2; x < m.width - 2; x++) {
      if (
        !m.tiles[y][x] ||
        occupied.has(`${x},${y}`) ||
        Math.hypot(x - m.spawn.x, y - m.spawn.y) < 3
      )
        continue;
      const walls = [
        [0, 1],
        [1, 0],
        [-1, 0],
        [0, -1],
      ].filter(([dx, dy]) => !m.tiles[y + dy][x + dx]).length;
      if (walls === 1 && random() < 0.12) {
        const key = keys[Math.floor(random() * keys.length)];
        m.props.push({ key, x, y, solid: false });
        occupied.add(`${x},${y}`);
      }
    }
  m.stairs = m.exit;
  return m;
}
export function makeFloors(seed = "review") {
  const a = make(
    "cloister",
    "The drowned cloister",
    "A loop around a sunken court",
    39,
    33,
    "moss",
    "An irregular entrance court connects to a long cloister ring. A sunken central courtyard separates the two routes; a burial wing and treasury sit off the loop.",
    "Head north for a short guarded ascent, or circle the courtyard toward supplies. The southern vault is an optional commitment with a narrow return.",
  );
  rect(a, 2, 18, 11, 8);
  rect(a, 5, 15, 8, 4);
  rect(a, 4, 25, 7, 5); // stepped arrival
  rect(a, 14, 5, 20, 22);
  rect(a, 19, 10, 10, 12, 0);
  pool(a, 19, 10, 10, 12); // broad courtyard ring
  hall(
    a,
    [
      [11, 21],
      [16, 21],
    ],
    2,
  );
  rect(a, 24, 2, 7, 4);
  rect(a, 32, 15, 5, 8);
  hall(
    a,
    [
      [16, 7],
      [9, 7],
      [9, 11],
    ],
    2,
  );
  rect(a, 3, 3, 8, 8); // burial spur
  hall(
    a,
    [
      [29, 25],
      [29, 29],
    ],
    2,
  );
  rect(a, 25, 28, 10, 3);
  a.spawn = { x: 6, y: 28 };
  a.exit = { x: 27, y: 3 };
  region(a, "Arrival court", 7, 21);
  region(a, "Sunken court", 24, 16);
  region(a, "Burial wing", 6, 6);
  region(a, "Treasury", 30, 29);
  for (const [x, y] of [
    [4, 4],
    [6, 4],
    [4, 8],
    [6, 8],
  ])
    prop(a, "grave", x, y, true);
  prop(a, "torch", 25, 2);
  prop(a, "torch", 29, 2);
  prop(a, "banner", 33, 16);
  enemy(a, 16, 14);
  enemy(a, 31, 18, "bat");
  enemy(a, 29, 28, "skeleton", true);
  enemy(a, 8, 7, "slime");
  chest(a, 5, 6, "tonic");
  chest(a, 35, 20, "potion");
  chest(a, 32, 29);
  a.routes = [
    [a.spawn, { x: 16, y: 21 }, { x: 16, y: 7 }, a.exit],
    [a.spawn, { x: 16, y: 24 }, { x: 31, y: 24 }, { x: 31, y: 7 }, a.exit],
  ];

  const b = make(
    "catacombs",
    "The rootbound catacombs",
    "An organic chain with a bypass",
    33,
    39,
    "earth",
    "Uneven burial chambers grow from a winding passage. A tight western bypass reconnects near the upper cavern, while two small tombs terminate in treasure.",
    "The eastern chambers offer room to dodge but more encounters. The western tunnel is shorter and cramped. Leave the side tombs alone or spend resources exploring them.",
  );
  for (const [x, y, rx, ry] of [
    [8, 32, 5, 4],
    [20, 29, 6, 4],
    [24, 18, 6, 5],
    [15, 8, 6, 5],
    [5, 18, 3, 4],
    [28, 6, 3, 3],
    [13, 20, 3, 3],
  ])
    ellipse(b, x, y, rx, ry);
  hall(
    b,
    [
      [8, 32],
      [19, 32],
      [20, 29],
    ],
    2,
  );
  hall(
    b,
    [
      [23, 28],
      [25, 28],
      [25, 19],
    ],
    2,
  );
  hall(
    b,
    [
      [23, 16],
      [23, 9],
      [15, 9],
    ],
    2,
  );
  hall(b, [
    [7, 30],
    [5, 30],
    [5, 18],
    [5, 8],
    [12, 8],
  ]);
  hall(b, [
    [24, 8],
    [28, 8],
    [28, 6],
  ]);
  hall(b, [
    [22, 20],
    [13, 20],
  ]);
  b.spawn = { x: 7, y: 34 };
  b.exit = { x: 15, y: 5 };
  region(b, "Root hollow", 8, 32);
  region(b, "Ossuary", 23, 18);
  region(b, "Old tomb", 13, 20);
  region(b, "Upper cavern", 15, 8);
  for (const [x, y] of [
    [21, 17],
    [22, 17],
    [26, 20],
    [18, 28],
    [19, 28],
  ])
    prop(b, "rock", x, y, true);
  prop(b, "torch", 14, 4);
  prop(b, "torch", 16, 4);
  enemy(b, 18, 30, "slime");
  enemy(b, 25, 15, "bat");
  enemy(b, 5, 16);
  enemy(b, 27, 7, "skeleton", true);
  chest(b, 13, 20, "potion");
  chest(b, 29, 5);
  chest(b, 6, 18, "tonic");
  b.routes = [
    [b.spawn, { x: 5, y: 28 }, { x: 5, y: 8 }, b.exit],
    [b.spawn, { x: 20, y: 30 }, { x: 25, y: 18 }, { x: 23, y: 9 }, b.exit],
  ];

  const c = make(
    "archive",
    "The divided archive",
    "Two spines and interlocking wings",
    39,
    35,
    "ink",
    "Two long aisles stitch together reading rooms, a cross-shaped catalogue hall and a secluded collection. Offset doorways break long sightlines.",
    "Switch between the aisles to avoid a pursuer. The western reading wing offers supplies; the rare collection is reached through its guarded entrance at the east.",
  );
  rect(c, 15, 27, 9, 6);
  hall(
    c,
    [
      [17, 29],
      [7, 29],
      [7, 6],
      [20, 6],
    ],
    2,
  );
  hall(
    c,
    [
      [21, 29],
      [31, 29],
      [31, 6],
      [20, 6],
    ],
    2,
  );
  rect(c, 3, 18, 11, 7);
  rect(c, 3, 3, 11, 7);
  rect(c, 26, 17, 10, 7);
  rect(c, 26, 3, 10, 7);
  rect(c, 15, 12, 9, 9);
  rect(c, 12, 15, 15, 3);
  hall(
    c,
    [
      [8, 16],
      [16, 16],
    ],
    2,
  );
  hall(
    c,
    [
      [23, 16],
      [31, 16],
    ],
    2,
  );
  rect(c, 17, 2, 6, 6);
  rect(c, 16, 13, 7, 1, 0); // cross-hall inset
  c.spawn = { x: 19, y: 31 };
  c.exit = { x: 20, y: 3 };
  for (const [x, y] of [
    [4, 19],
    [5, 19],
    [6, 19],
    [10, 22],
    [11, 22],
    [12, 22],
    [4, 4],
    [5, 4],
    [6, 4],
    [29, 4],
    [30, 4],
    [31, 4],
    [34, 19],
    [34, 20],
  ])
    prop(c, "bookshelf", x, y, true);
  for (const [x, y] of [
    [17, 15],
    [21, 18],
    [28, 7],
    [11, 7],
  ])
    prop(c, "books", x, y);
  prop(c, "banner", 18, 2);
  prop(c, "banner", 22, 2);
  region(c, "Entry stacks", 19, 29);
  region(c, "Reading wing", 8, 21);
  region(c, "Catalogue hall", 19, 16);
  region(c, "Rare collection", 31, 6);
  enemy(c, 8, 17);
  enemy(c, 20, 16, "slime");
  enemy(c, 31, 19, "bat");
  enemy(c, 32, 6, "skeleton", true);
  chest(c, 5, 22, "tonic");
  chest(c, 28, 21, "potion");
  chest(c, 34, 7);
  c.routes = [
    [c.spawn, { x: 7, y: 29 }, { x: 7, y: 6 }, c.exit],
    [c.spawn, { x: 31, y: 29 }, { x: 31, y: 6 }, c.exit],
  ];

  const d = make(
    "cistern",
    "The fractured cistern",
    "Islands, bridges and flanking banks",
    37,
    39,
    "tide",
    "A flooded basin divides the floor into staggered banks and islands. Several bridges make the crossing a route decision instead of a single corridor.",
    "The center island offers a short crossing under pressure. The western bank leads to supplies and a longer northern bridge. The lower store is a treasure detour.",
  );
  pool(d, 7, 6, 23, 27);
  rect(d, 13, 32, 10, 5);
  rect(d, 3, 23, 8, 10);
  rect(d, 3, 5, 6, 14);
  rect(d, 27, 17, 7, 15);
  rect(d, 26, 4, 8, 9);
  rect(d, 15, 16, 8, 7);
  rect(d, 14, 3, 9, 6);
  hall(
    d,
    [
      [18, 34],
      [7, 34],
      [7, 25],
    ],
    2,
  );
  hall(
    d,
    [
      [18, 34],
      [30, 34],
      [30, 26],
    ],
    2,
  );
  hall(
    d,
    [
      [6, 26],
      [6, 11],
    ],
    2,
  );
  hall(
    d,
    [
      [7, 19],
      [18, 19],
      [30, 19],
    ],
    2,
  );
  hall(
    d,
    [
      [6, 8],
      [18, 8],
      [29, 8],
    ],
    2,
  );
  hall(
    d,
    [
      [30, 22],
      [30, 9],
    ],
    2,
  );
  hall(
    d,
    [
      [18, 19],
      [18, 7],
    ],
    1,
  );
  d.bridges = [];
  for (const y of [19, 20])
    for (const [from, to] of [
      [9, 14],
      [23, 26],
    ])
      for (let x = from; x <= to; x++)
        d.bridges.push({ x, y, vertical: false });
  for (const y of [8, 9])
    for (const [from, to] of [
      [9, 13],
      [23, 25],
    ])
      for (let x = from; x <= to; x++)
        d.bridges.push({ x, y, vertical: false });
  for (let y = 9; y <= 15; y++) d.bridges.push({ x: 18, y, vertical: true });
  d.spawn = { x: 18, y: 35 };
  d.exit = { x: 18, y: 4 };
  region(d, "Flood basin", 18, 12);
  region(d, "Center island", 19, 20);
  region(d, "West pump", 5, 10);
  region(d, "Stores", 30, 28);
  for (const [x, y] of [
    [4, 25],
    [4, 26],
    [32, 26],
    [32, 27],
  ])
    prop(d, "crate", x, y, true);
  prop(d, "torch", 16, 3);
  prop(d, "torch", 21, 3);
  prop(d, "chain", 27, 6);
  prop(d, "chain", 32, 6);
  enemy(d, 18, 18, "slime");
  enemy(d, 29, 20);
  enemy(d, 6, 12, "bat");
  enemy(d, 30, 29, "skeleton", true);
  chest(d, 5, 7, "tonic");
  chest(d, 8, 29, "potion");
  chest(d, 31, 30);
  d.routes = [
    [d.spawn, { x: 30, y: 34 }, { x: 30, y: 19 }, { x: 18, y: 19 }, d.exit],
    [d.spawn, { x: 7, y: 34 }, { x: 6, y: 8 }, { x: 18, y: 8 }, d.exit],
  ];

  const e = make(
    "bastion",
    "The last bastion",
    "A central keep with an outer escape loop",
    39,
    39,
    "ember",
    "A stepped fortress surrounds a diamond-shaped muster hall. A broad outer passage connects the side chambers; the ascent ends beyond a final guardian.",
    "Approach through the muster hall or skirt it using the outer circuit. Optional armories can replenish supplies before the final fight.",
  );
  rect(e, 15, 30, 9, 7); // gate
  for (let y = 12; y <= 26; y++) {
    const radius = 8 - Math.abs(19 - y);
    rect(e, 19 - radius, y, radius * 2 + 1, 1);
  }
  hall(
    e,
    [
      [19, 32],
      [19, 25],
    ],
    3,
  );
  hall(
    e,
    [
      [19, 13],
      [19, 5],
    ],
    3,
  );
  rect(e, 14, 2, 13, 7);
  hall(
    e,
    [
      [19, 32],
      [5, 32],
      [5, 7],
      [18, 7],
    ],
    2,
  );
  hall(
    e,
    [
      [20, 32],
      [33, 32],
      [33, 7],
      [25, 7],
    ],
    2,
  );
  rect(e, 2, 16, 8, 8);
  rect(e, 29, 13, 8, 8);
  hall(
    e,
    [
      [7, 20],
      [13, 20],
    ],
    2,
  );
  hall(
    e,
    [
      [26, 18],
      [33, 18],
    ],
    2,
  );
  rect(e, 3, 4, 7, 7);
  rect(e, 28, 27, 9, 8);
  e.spawn = { x: 19, y: 35 };
  e.exit = { x: 20, y: 3 };
  for (const [x, y] of [
    [17, 18],
    [21, 18],
    [17, 22],
    [21, 22],
  ])
    prop(e, "rock", x, y, true);
  for (const [x, y] of [
    [3, 17],
    [3, 18],
    [7, 6],
    [35, 29],
    [35, 30],
  ])
    prop(e, "crate", x, y, true);
  prop(e, "banner-red", 15, 2);
  prop(e, "banner-red", 25, 2);
  prop(e, "torch", 17, 4);
  prop(e, "torch", 23, 4);
  region(e, "Muster hall", 19, 20);
  region(e, "West armory", 5, 19);
  region(e, "East watch", 33, 16);
  region(e, "Guardian", 20, 6);
  enemy(e, 19, 25);
  enemy(e, 5, 14, "bat");
  enemy(e, 33, 22, "slime");
  enemy(e, 20, 6, "boss", true);
  e.enemies.at(-1).boss = true;
  chest(e, 5, 7, "tonic");
  chest(e, 4, 21, "potion");
  chest(e, 34, 32);
  e.routes = [
    [e.spawn, { x: 19, y: 20 }, e.exit],
    [e.spawn, { x: 5, y: 32 }, { x: 5, y: 7 }, { x: 19, y: 7 }, e.exit],
  ];
  return [a, b, c, d, e].map((m) => decorate(m, seed));
}
export function floorMetrics(m) {
  const direct = pathfind(m, m.spawn, m.exit).length;
  const floorTiles = m.tiles.flat().filter(Boolean).length;
  return {
    floorTiles,
    entranceToStairs: direct,
    regions: m.regions.length,
    enemies: m.enemies.length,
    rewards: m.chests.length,
    lootDetours: m.chests.map(
      (c) =>
        pathfind(m, m.spawn, c).length + pathfind(m, c, m.exit).length - direct,
    ),
  };
}
