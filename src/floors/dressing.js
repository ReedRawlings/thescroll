// Authored furnishings belong to a place; only flat wear/clutter is seeded.
// Coordinates are the top-left of the occupied footprint, in floor tiles.
export function footprint(p) {
  return Array.from({ length: (p.w ?? 1) * (p.h ?? 1) }, (_, i) => ({
    x: p.x + (i % (p.w ?? 1)),
    y: p.y + Math.floor(i / (p.w ?? 1)),
  }));
}

export function dressFloor(m) {
  m.rugs = [];
  const put = (key, points, solid = true, w = 1, h = 1) => {
    for (const [x, y] of points) {
      const p = { key, x, y, solid, w, h, authored: true };
      if (solid) {
        for (const c of footprint(p)) {
          if (!m.tiles[c.y]?.[c.x])
            throw Error(`${m.id}: ${key} overlaps wall at ${c.x},${c.y}`);
          if (
            [m.spawn, m.exit, ...m.chests, ...m.enemies].some(
              (q) => q.x === c.x && q.y === c.y,
            )
          )
            throw Error(`${m.id}: ${key} overlaps encounter at ${c.x},${c.y}`);
          m.tiles[c.y][c.x] = 0;
        }
      }
      m.props.push(p);
    }
  };
  const rug = (x, y, w, h, color) => m.rugs.push({ x, y, w, h, color });
  const wall = (key, points) => put(key, points, false);

  if (m.id === "cloister") {
    // Paired memorials, a disused refectory, and votive urns facing the water.
    put(
      "table",
      [
        [3, 19],
        [9, 24],
      ],
      true,
      2,
    );
    put("chair", [
      [3, 20],
      [10, 23],
    ]);
    put("vase", [
      [5, 16],
      [11, 16],
      [15, 10],
      [17, 10],
      [30, 10],
      [32, 10],
      [15, 25],
      [32, 25],
    ]);
    put("grave", [
      [8, 4],
      [8, 9],
      [3, 6],
    ]);
    put("coffin", [[9, 4]], true, 1, 2);
    put("crate", [
      [25, 28],
      [26, 28],
      [34, 28],
      [34, 30],
    ]);
    wall("banner-green", [
      [3, 17],
      [11, 14],
      [15, 4],
      [32, 4],
    ]);
    wall("torch", [
      [6, 2],
      [3, 23],
      [17, 16],
      [30, 16],
      [28, 30],
    ]);
    wall("broken-vase", [
      [6, 17],
      [11, 25],
      [16, 11],
      [31, 11],
    ]);
    rug(6, 19, 4, 5, 0x365a49);
    rug(25, 6, 4, 3, 0x365a49);
  } else if (m.id === "catacombs") {
    // Coffin recesses follow the curved chambers instead of lining every passage.
    put(
      "coffin",
      [
        [6, 31],
        [11, 31],
        [17, 7],
        [26, 17],
      ],
      true,
      1,
      2,
    );
    put("grave", [
      [9, 30],
      [19, 27],
      [22, 31],
      [11, 7],
      [14, 10],
      [29, 6],
    ]);
    put("vase-grey", [
      [5, 32],
      [22, 27],
      [28, 18],
      [13, 6],
      [4, 18],
      [14, 20],
    ]);
    put("rock2", [
      [20, 19],
      [23, 21],
      [17, 30],
      [17, 10],
      [7, 35],
    ]);
    wall("skulls", [
      [7, 31],
      [10, 33],
      [20, 27],
      [23, 31],
      [27, 19],
      [12, 8],
      [15, 10],
      [28, 7],
      [12, 20],
    ]);
    wall("chain", [
      [7, 28],
      [21, 25],
      [25, 13],
      [15, 3],
    ]);
    wall("torch", [
      [9, 29],
      [19, 26],
      [28, 16],
      [11, 5],
      [27, 3],
      [3, 18],
    ]);
  } else if (m.id === "archive") {
    // Reading tables sit across the grain of the two aisles; the crossing stays open.
    put("bookshelf2", [
      [3, 5],
      [3, 6],
      [12, 4],
      [12, 5],
      [4, 18],
      [5, 18],
      [6, 18],
      [28, 3],
      [29, 3],
      [30, 3],
      [34, 4],
      [34, 5],
      [27, 17],
      [28, 17],
      [29, 17],
    ]);
    put(
      "table",
      [
        [6, 7],
        [9, 20],
        [28, 19],
        [30, 7],
        [17, 19],
      ],
      true,
      2,
    );
    put("chair", [
      [6, 8],
      [10, 21],
      [28, 20],
      [30, 8],
      [17, 20],
    ]);
    put("vase", [
      [12, 9],
      [3, 23],
      [35, 22],
      [26, 9],
      [16, 32],
      [22, 32],
    ]);
    wall("painting", [
      [6, 2],
      [10, 2],
      [28, 2],
      [33, 2],
      [5, 17],
    ]);
    wall("painting2", [
      [28, 16],
      [32, 16],
      [19, 11],
    ]);
    wall("torch", [
      [4, 8],
      [12, 20],
      [27, 22],
      [35, 8],
      [16, 28],
      [22, 28],
    ]);
    wall("scroll", [
      [8, 6],
      [11, 20],
      [30, 19],
      [32, 6],
      [19, 19],
    ]);
    rug(5, 5, 6, 4, 0x67425e);
    rug(28, 5, 6, 4, 0x67425e);
    rug(17, 14, 5, 6, 0x67425e);
    rug(17, 28, 5, 4, 0x67425e);
  } else if (m.id === "cistern") {
    // Cargo hugs the banks; the middle island is an old pump/work station.
    put("crate", [
      [3, 24],
      [4, 24],
      [3, 25],
      [9, 31],
      [32, 28],
      [33, 28],
      [33, 29],
      [27, 4],
      [28, 4],
      [32, 10],
      [32, 11],
    ]);
    put("vase-grey", [
      [3, 28],
      [4, 31],
      [28, 23],
      [32, 18],
      [4, 10],
      [7, 15],
      [16, 17],
      [21, 21],
    ]);
    put("table", [[19, 21]], true, 2);
    put("chair", [[20, 22]]);
    wall("chain", [
      [3, 6],
      [8, 11],
      [27, 11],
      [33, 23],
      [15, 16],
      [22, 16],
    ]);
    wall("torch", [
      [4, 8],
      [8, 24],
      [28, 27],
      [31, 5],
      [21, 17],
      [14, 33],
      [22, 33],
    ]);
    wall("broken-vase", [
      [4, 29],
      [8, 30],
      [31, 27],
      [29, 5],
      [17, 17],
    ]);
    wall("scroll", [[21, 22]]);
  } else {
    // Barracks to the west, an armory to the east, and a ceremonial ascent.
    put(
      "table",
      [
        [3, 19],
        [7, 22],
        [30, 14],
        [30, 28],
      ],
      true,
      2,
    );
    put("chair", [
      [3, 20],
      [8, 21],
      [30, 15],
      [31, 29],
    ]);
    put("crate", [
      [2, 17],
      [2, 18],
      [9, 17],
      [35, 14],
      [35, 15],
      [29, 33],
      [30, 33],
      [8, 5],
    ]);
    put("vase", [
      [15, 4],
      [25, 4],
      [16, 31],
      [22, 31],
    ]);
    put("throne", [[24, 5]]);
    wall("banner-red", [
      [4, 15],
      [8, 15],
      [30, 12],
      [35, 12],
      [16, 29],
      [22, 29],
      [14, 1],
      [26, 1],
    ]);
    wall("shield", [
      [3, 16],
      [8, 16],
      [30, 13],
      [34, 13],
      [29, 27],
      [34, 27],
    ]);
    wall("sword", [
      [5, 19],
      [32, 14],
      [32, 28],
    ]);
    wall("torch", [
      [4, 5],
      [8, 9],
      [3, 22],
      [35, 19],
      [29, 30],
      [35, 33],
      [16, 20],
      [22, 20],
    ]);
    rug(18, 14, 3, 11, 0x803e40);
    rug(18, 4, 5, 4, 0x803e40);
    rug(18, 31, 3, 5, 0x803e40);
  }
}
