// Five individual chamber prefabs. Door stubs end at the review boundary.
const room = (id, name, theme, pitch, choice, decoration) => ({
  id,
  name,
  theme,
  pitch,
  choice,
  decoration,
  width: 17,
  height: 17,
  tiles: Array.from({ length: 17 }, () => Array(17).fill(0)),
  props: [],
  enemies: [],
  routes: [],
  rugs: [],
  chests: [],
  spawn: { x: 8, y: 15 },
  exit: { x: 8, y: 1 },
});
function rect(r, x, y, w, h) {
  for (let yy = y; yy < y + h; yy++)
    for (let xx = x; xx < x + w; xx++) r.tiles[yy][xx] = 1;
}
function prop(r, key, x, y, solid = false) {
  const width = key === "table" ? 2 : 1;
  r.props.push({ key, x, y, solid, width });
  if (solid)
    for (let xx = x; xx < x + width; xx++) {
      if (!r.tiles[y][xx]) throw Error(`${r.id}: furniture outside chamber`);
      r.tiles[y][xx] = 0;
    }
}
function group(r, key, cells, solid = false) {
  for (const [x, y] of cells) prop(r, key, x, y, solid);
}
function enemy(r, x, y, kind = "skeleton") {
  r.enemies.push({
    id: `${r.id}-enemy`,
    x,
    y,
    homeX: x,
    homeY: y,
    kind,
    path: [],
    alert: false,
  });
}
const chest = (r, x, y) => r.chests.push({ x, y, opened: false });
const rug = (r, x, y, w, h, color) => r.rugs.push({ x, y, w, h, color });

export function makeExamples() {
  const archive = room(
    "archive",
    "The bent archive",
    "Archive / L-shaped chamber",
    "One L-shaped reading room, with a wide southern reading bay and a narrower shelf-lined arm.",
    "Pass beside the shelving or use the open reading bay. Both approaches stay inside this single room.",
    "Shelves line the long wall. A reading table, chair, rug and scattered scrolls give the wider end a purpose. Blue hangings frame the north door.",
  );
  rect(archive, 2, 3, 8, 11);
  rect(archive, 9, 7, 6, 7);
  rect(archive, 8, 0, 1, 3);
  rect(archive, 8, 14, 1, 3);
  group(
    archive,
    "bookshelf",
    [
      [2, 4],
      [2, 5],
      [2, 6],
      [2, 7],
      [2, 8],
      [6, 7],
      [6, 8],
      [6, 9],
    ],
    true,
  );
  group(archive, "table", [[11, 9]], true);
  group(archive, "chair", [[12, 10]], true);
  group(
    archive,
    "vase",
    [
      [3, 12],
      [14, 12],
    ],
    true,
  );
  group(archive, "books", [
    [3, 5],
    [5, 8],
    [13, 10],
    [11, 12],
  ]);
  group(archive, "scroll", [[13, 9]]);
  group(archive, "painting", [
    [4, 2],
    [12, 6],
  ]);
  group(archive, "banner", [
    [7, 2],
    [9, 2],
  ]);
  group(archive, "torch", [
    [3, 3],
    [10, 7],
  ]);
  rug(archive, 10, 8, 4, 5, 0x67425e);
  enemy(archive, 4, 9);
  chest(archive, 13, 8);
  archive.routes = [
    [archive.spawn, { x: 4, y: 11 }, { x: 4, y: 4 }, archive.exit],
    [archive.spawn, { x: 9, y: 11 }, { x: 8, y: 5 }, archive.exit],
  ];

  const treasury = room(
    "treasury",
    "The stepped treasury",
    "Treasury / broad treasure recess",
    "A single stepped chamber opens into a broad treasure recess. The recess has no separating corridor or doorway.",
    "Cross between the west and east doors, or turn toward the chest at the back of the same room.",
    "Red hangings, a short rug and paired urns focus attention on the chest. Crates and loose gold collect at the edges, leaving the cross-room route open.",
  );
  rect(treasury, 2, 7, 13, 7);
  rect(treasury, 6, 3, 7, 4);
  rect(treasury, 0, 11, 17, 1);
  treasury.spawn = { x: 1, y: 11 };
  treasury.exit = { x: 15, y: 11 };
  group(
    treasury,
    "crate",
    [
      [2, 12],
      [2, 13],
      [3, 13],
      [14, 7],
      [14, 8],
    ],
    true,
  );
  group(
    treasury,
    "vase",
    [
      [6, 4],
      [12, 4],
    ],
    true,
  );
  group(treasury, "banner-red", [
    [7, 2],
    [11, 2],
  ]);
  group(treasury, "gold", [
    [8, 4],
    [10, 4],
    [10, 5],
  ]);
  group(treasury, "broken-vase", [
    [4, 13],
    [13, 8],
  ]);
  group(treasury, "torch", [
    [6, 3],
    [12, 3],
    [3, 7],
  ]);
  rug(treasury, 8, 5, 3, 4, 0x803e40);
  enemy(treasury, 9, 7);
  chest(treasury, 9, 4);
  treasury.routes = [
    [treasury.spawn, treasury.exit],
    [treasury.spawn, { x: 9, y: 11 }, { x: 9, y: 4 }],
  ];

  const crossing = room(
    "crossing",
    "The octagonal crossing",
    "Junction / chamfered chamber",
    "A compact octagonal room has four door sockets and a broken central pillar.",
    "Round either side of the pillar to change direction. The other door sockets show where adjoining rooms could connect.",
    "A small rubble core, corner urns and paired torches define the room. Broken pottery stays near the perimeter so the four exits remain legible.",
  );
  rect(crossing, 6, 3, 5, 11);
  rect(crossing, 4, 4, 9, 9);
  rect(crossing, 3, 5, 11, 7);
  rect(crossing, 8, 0, 1, 17);
  rect(crossing, 0, 8, 17, 1);
  group(
    crossing,
    "rock",
    [
      [7, 7],
      [8, 7],
      [7, 8],
      [8, 8],
    ],
    true,
  );
  group(
    crossing,
    "vase-grey",
    [
      [4, 5],
      [12, 5],
      [4, 11],
      [12, 11],
    ],
    true,
  );
  group(crossing, "broken-vase", [
    [5, 5],
    [11, 12],
    [5, 11],
  ]);
  group(crossing, "skulls", [[9, 8]]);
  group(crossing, "chain", [
    [3, 7],
    [13, 7],
  ]);
  group(crossing, "torch", [
    [6, 3],
    [10, 3],
    [6, 13],
    [10, 13],
  ]);
  enemy(crossing, 11, 8, "bat");
  crossing.routes = [
    [crossing.spawn, { x: 5, y: 10 }, { x: 5, y: 6 }, crossing.exit],
    [crossing.spawn, { x: 11, y: 10 }, { x: 11, y: 6 }, crossing.exit],
  ];

  const hall = room(
    "hall",
    "The abandoned mess",
    "Guard hall / long dining room",
    "A long, shallow dining chamber connects two doors on opposite ends.",
    "The open middle offers a direct crossing. Tables create short detours and cover within the room.",
    "Paired dining tables and chairs establish the room's use. Shields and red standards mark the guard post; crates sit at the far end.",
  );
  rect(hall, 2, 5, 13, 7);
  rect(hall, 0, 8, 17, 1);
  hall.spawn = { x: 1, y: 8 };
  hall.exit = { x: 15, y: 8 };
  group(
    hall,
    "table",
    [
      [5, 6],
      [10, 6],
      [5, 10],
      [10, 10],
    ],
    true,
  );
  group(
    hall,
    "chair",
    [
      [5, 5],
      [10, 5],
      [6, 11],
      [11, 11],
    ],
    true,
  );
  group(
    hall,
    "crate",
    [
      [2, 10],
      [14, 10],
    ],
    true,
  );
  group(hall, "banner-red", [
    [4, 4],
    [12, 4],
  ]);
  group(hall, "shield", [
    [6, 4],
    [10, 4],
  ]);
  group(hall, "sword", [[12, 6]]);
  group(hall, "books", [[3, 10]]);
  group(hall, "torch", [
    [2, 5],
    [14, 5],
  ]);
  rug(hall, 4, 7, 9, 2, 0x694344);
  enemy(hall, 8, 8);
  hall.routes = [
    [hall.spawn, hall.exit],
    [hall.spawn, { x: 3, y: 9 }, { x: 13, y: 9 }, hall.exit],
  ];

  const shrine = room(
    "shrine",
    "The candle shrine",
    "Shrine / rounded apse",
    "A narrow memorial chamber broadens into a rounded apse at its northern end.",
    "Follow the central runner through the room or stop beside the memorials. Both doors are ordinary room connections.",
    "Paired grave markers, urns and warm candles create an ordered interior. Green cloth runs along the center; loose pottery gathers beside the walls.",
  );
  rect(shrine, 7, 2, 3, 12);
  rect(shrine, 5, 3, 7, 11);
  rect(shrine, 4, 4, 9, 3);
  rect(shrine, 8, 0, 1, 3);
  rect(shrine, 8, 14, 1, 3);
  group(
    shrine,
    "grave",
    [
      [5, 6],
      [11, 6],
      [5, 9],
      [11, 9],
      [5, 12],
      [11, 12],
    ],
    true,
  );
  group(
    shrine,
    "vase",
    [
      [5, 4],
      [11, 4],
    ],
    true,
  );
  group(shrine, "banner-green", [
    [6, 2],
    [10, 2],
  ]);
  group(shrine, "broken-vase", [
    [6, 12],
    [10, 10],
  ]);
  group(shrine, "torch", [
    [7, 3],
    [9, 3],
    [6, 8],
    [10, 8],
  ]);
  rug(shrine, 7, 5, 3, 8, 0x365a49);
  shrine.routes = [[shrine.spawn, shrine.exit]];
  return [archive, treasury, crossing, hall, shrine];
}
