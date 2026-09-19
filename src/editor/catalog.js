import {
  ASSET_RULES as reviewed,
  asset as reviewedAsset,
} from "../floors/asset-rules.js";
export const ASSET_RULES = { ...reviewed };
function add(file, sheet, rect, category, kind, h) {
  const [x, y, width, height] = rect;
  ASSET_RULES[file] = {
    file,
    category,
    kind,
    sheet,
    rect,
    width,
    height,
    footHeight: h ?? height / 16,
    blocks: ["pillar", "ledge"].includes(kind) ? "Yes" : "No",
    placement:
      kind === "bridge"
        ? "Place across void or acid to create a walkable crossing."
        : kind === "acid"
          ? "Blocks walking; a bridge can cross it."
          : kind === "carpet"
            ? "Place on floor, underneath furniture."
            : kind === "ledge"
              ? "Place along a platform front below stairs. Blocks walking across the drop."
              : kind === "stairs"
                ? "Walkable stair artwork; does not change levels in the editor."
                : "Solid base; keep space around it.",
    notes: "Original orientation. No rotation or flipping.",
  };
}
add(
  "Bridge horizontal.png",
  "Wood bridge",
  [0, 0, 32, 16],
  "Bridges",
  "bridge",
);
add("Bridge vertical.png", "Wood bridge", [64, 0, 16, 48], "Bridges", "bridge");
add(
  "Bridge vertical short.png",
  "Wood bridge",
  [128, 0, 16, 32],
  "Bridges",
  "bridge",
);
add("Bridge curved.png", "Wood bridge", [0, 16, 48, 32], "Bridges", "bridge");
add("Acid pool square.png", "Acid", [0, 0, 64, 48], "Acid pools", "acid");
add("Acid pool rounded.png", "Acid", [80, 0, 64, 48], "Acid pools", "acid");
for (let i = 0; i < 4; i++)
  add(
    `Pillar ${i + 1}.png`,
    "Pillars",
    [i * 16, 48 - i * 16, 16, 16 + i * 16],
    "Pillars",
    "pillar",
    1,
  );
add(
  "Carpet vertical plain.png",
  "Carpets",
  [0, 0, 16, 48],
  "Carpets",
  "carpet",
);
add(
  "Carpet vertical ornate.png",
  "Carpets",
  [16, 0, 16, 48],
  "Carpets",
  "carpet",
);
add(
  "Carpet horizontal plain.png",
  "Carpets",
  [32, 0, 48, 16],
  "Carpets",
  "carpet",
);
add(
  "Carpet horizontal ornate.png",
  "Carpets",
  [32, 16, 48, 16],
  "Carpets",
  "carpet",
);
add("Carpet oval.png", "Carpets", [32, 32, 48, 32], "Carpets", "carpet");
// Keep both drawn halves separate; no rotation or mirroring.
for (const [label, x, y, h] of [
  ["low", 48, 0, 64],
  ["broad", 128, 0, 64],
  ["tall", 80, 64, 80],
  ["steep", 160, 64, 80],
]) {
  add(`Stairs ${label} left.png`, "Stairs", [x, y, 32, h], "Stairs", "stairs");
  add(
    `Stairs ${label} right.png`,
    "Stairs",
    [x + 32, y, 32, h],
    "Stairs",
    "stairs",
  );
}
for (const [label, x] of [
  ["left", 96],
  ["middle", 112],
  ["right", 128],
])
  add(
    `Raised wall ${label}.png`,
    "Elevation",
    [x, 80, 16, 16],
    "Wall bottoms",
    "ledge",
  );
// Additional native stair sizes and the rounded ends supplied in the wall atlas.
for (const [label, y, w, h] of [
  ["small", 0, 16, 32],
  ["small alternate", 32, 16, 32],
  ["shallow", 64, 32, 32],
  ["shallow alternate", 96, 32, 32],
]) {
  add(`Stairs ${label} left.png`, "Stairs", [0, y, w, h], "Stairs", "stairs");
  add(`Stairs ${label} right.png`, "Stairs", [w, y, w, h], "Stairs", "stairs");
}
add(
  "Stairs straight narrow.png",
  "Elevation",
  [144, 0, 16, 16],
  "Stairs",
  "stairs",
);
add(
  "Stairs straight wide.png",
  "Elevation",
  [80, 0, 48, 16],
  "Stairs",
  "stairs",
);
add(
  "Stairs straight wide alternate.png",
  "Elevation",
  [80, 32, 48, 16],
  "Stairs",
  "stairs",
);
for (const [label, y] of [
  ["upper", 64],
  ["lower", 96],
])
  for (const [end, x] of [
    ["left", 96],
    ["middle", 112],
    ["right", 128],
  ])
    add(
      `Rounded wall ${label} ${end}.png`,
      "Elevation",
      [x, y, 16, 32],
      "Rounded walls",
      "ledge",
    );
for (const [end, x] of [
  ["left", 96],
  ["middle", 112],
  ["right", 128],
])
  add(
    `Rounded wall bottom ${end}.png`,
    "Elevation",
    [x, 112, 16, 16],
    "Wall bottoms",
    "ledge",
  );
export const isDoor = (file) =>
  ASSET_RULES[file]?.category === "Door / connector";
export function asset(file) {
  const a = ASSET_RULES[file];
  return a?.kind
    ? {
        file,
        w: a.width / 16,
        h: a.footHeight,
        solid: ["pillar", "ledge"].includes(a.kind),
        rotation: 0,
      }
    : { ...reviewedAsset(file), ...(isDoor(file) ? { solid: false } : {}) };
}
export const layer = (file) =>
  ({ acid: 0, carpet: 1, bridge: 2, stairs: 2 })[ASSET_RULES[file].kind] ?? 3;
