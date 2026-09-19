// Source atlas is 10 columns wide. All sixteen user-confirmed floor variants.
export const FLOOR_FRAMES = Array.from(
  { length: 16 },
  (_, i) => Math.floor(i / 4) * 10 + (i % 4),
);
export function terrainSprites(terrain, floorFrames) {
  const h = terrain.length,
    w = terrain[0].length,
    out = [];
  const floor = (x, y) => terrain[y]?.[x] === 1;
  const wall = (x, y) =>
    x >= 0 &&
    y >= 0 &&
    x < w &&
    y < h &&
    terrain[y][x] !== -1 &&
    !floor(x, y) &&
    [-1, 0, 1].some((dy) => [-1, 0, 1].some((dx) => floor(x + dx, y + dy)));
  const horizontal = (x, y) =>
    wall(x, y) && (floor(x, y - 1) || floor(x, y + 1));
  const segment = (x, y) =>
    wall(x, y) &&
    (horizontal(x, y) || horizontal(x - 1, y) || horizontal(x + 1, y));
  const internalVoid = (x, y) =>
    !floor(x, y + 1) && terrain.slice(y + 1).some((row) => row.some(Boolean));
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (floor(x, y))
        out.push({ x, y, frame: floorFrames[y][x], layer: "floor" });
      else if (wall(x, y)) {
        if (
          segment(x, y) &&
          internalVoid(x, y) &&
          !floor(x - 1, y) &&
          !floor(x + 1, y)
        )
          continue;
        // Vertical connectors: left edge, fill, or right edge, with no face.
        const frame = floor(x + 1, y) ? 95 : floor(x - 1, y) ? 97 : 96;
        out.push({ x, y, frame, layer: "wall" });
      }
    }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!segment(x, y)) continue;
      const left = segment(x - 1, y),
        right = segment(x + 1, y),
        column = left && right ? 7 : left ? 8 : 6;
      const down =
        left !== right &&
        wall(x, y + 1) &&
        (floor(x - 1, y + 1) || floor(x + 1, y + 1));
      if (terrain[y - 1]?.[x] !== -1)
        out.push({ x, y: y - 1, frame: 40 + column, layer: "wall" });
      if (!down && internalVoid(x, y)) continue;
      out.push({
        x,
        y,
        frame: down ? (left ? 97 : 95) : 50 + column,
        layer: "wall",
      });
    }
  return out;
}
