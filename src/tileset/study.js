import "./study.css";
const source = new Image();
source.src = `${import.meta.env.BASE_URL}assets/tileset-study.png`;
const known = {
  "0,0": "Broken stone floor",
  "1,0": "Plain worn floor",
  "2,0": "Ring-marked floor",
  "3,0": "Webbed floor",
  "0,1": "Square paving",
  "1,1": "Plain floor",
  "2,1": "Cracked floor",
  "3,1": "Webbed floor",
  "0,3": "Light plain floor",
  "2,3": "Square paving variation",
  "3,3": "Broken paving variation",
  "6,4": "Wall cap: left end",
  "7,4": "Wall cap: horizontal middle",
  "8,4": "Wall cap: right end",
  "6,5": "Wall face beneath left cap",
  "7,5": "Wall face beneath middle cap",
  "8,5": "Wall face beneath right cap",
  "3,8": "Isolated framed wall cap",
  "0,8": "Repeatable front wall face",
  "1,9": "Brick wall face",
  "1,10": "Lower brick wall face",
  "5,9": "Cap with left edge",
  "6,9": "Unbordered dark cap fill",
  "7,9": "Cap with right edge",
  "0,12": "Low wall: left end",
  "1,12": "Low wall: middle",
  "3,12": "Low wall: right end",
};
let mode = "assembled",
  shape = "room",
  grid = false,
  selected = [6, 4];
document.title = "The Scroll — Tileset bench";
document.body.innerHTML = `<main><header><a href="./">THE SCROLL</a><span>ART STUDY / 01</span></header><h1>What can these tiles build?</h1><p class="lede">Your MiniRogue artwork, tested on small layouts. Select a tile in the atlas to inspect its source coordinates.</p><section class="controls"><label>Layout <select id="shape"><option value="room">Room + doorway + corridor</option><option value="notch">Room with inward corner</option><option value="diagonal">Diagonal contact + isolated block</option></select></label><div><button id="assembled" aria-pressed="true">Wall pieces</button><button id="baseline" aria-pressed="false">Simple blocks</button><button id="grid" aria-pressed="false">Grid</button></div></section><div class="canvas-wrap"><canvas width="1080" height="650" aria-label="Tile assembly preview and selectable source atlas"></canvas></div><p id="selection" aria-live="polite"></p><section class="notes"><article><h2>Usable now</h2><p>Floor variations, horizontal wall caps, end pieces and front wall faces. The preview uses original, unrotated 16×16 crops.</p></article><article><h2>Needs a rule</h2><p>Amber dots mark corners, junctions or isolated walls using a provisional cap. These are the cases to resolve before adopting an automatic renderer.</p></article><article><h2>Recommendation</h2><p>Start with conventional layered walls. No complete dual-grid set has been verified. BSP and furniture generation can use the same map data.</p></article></section><footer>Art: Matheus Tanuri / Marth · <a href="https://matheustanuri.itch.io/minirogue-dungeon">MiniRogue Dungeon</a>. This is an isolated rendering study; the wall-piece assignments are our interpretation.</footer></main>`;
const canvas = document.querySelector("canvas"),
  ctx = canvas.getContext("2d");
const W = 20,
  H = 16,
  S = 26,
  OX = 28,
  OY = 70,
  AX = 670,
  AY = 70,
  AS = 36;
let tiles,
  provisional = [];
function makeMap() {
  const m = Array.from({ length: H }, () => Array(W).fill(0));
  const rect = (x, y, w, h, v = 1) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) m[j][i] = v;
  };
  if (shape === "room") {
    rect(2, 2, 10, 10);
    rect(12, 6, 6, 2);
    rect(15, 4, 3, 7);
  }
  if (shape === "notch") {
    rect(2, 2, 15, 11);
    rect(10, 2, 7, 5, 0);
    rect(7, 13, 2, 2);
  }
  if (shape === "diagonal") {
    rect(2, 2, 7, 7);
    rect(9, 9, 7, 5);
    rect(5, 5, 1, 1, 0);
  }
  return m;
}
const crop = (tx, ty, x, y, size = S) =>
  ctx.drawImage(source, tx * 16, ty * 16, 16, 16, x, y, size, size);
function label(t, x, y, color = "#cbd4d0", size = 13) {
  ctx.fillStyle = color;
  ctx.font = `${size}px system-ui`;
  ctx.fillText(t, x, y);
}
function draw() {
  tiles = makeMap();
  provisional = [];
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "#121a20";
  ctx.fillRect(0, 0, 1080, 650);
  label("ASSEMBLY TEST", OX, 32, "#c7d998", 14);
  label("ORIGINAL SHEET · 16 × 16 CROPS", AX, 32, "#c7d998", 14);
  const floor = (x, y) => tiles[y]?.[x] === 1;
  const wall = (x, y) =>
    x >= 0 &&
    x < W &&
    y >= 0 &&
    y < H &&
    !floor(x, y) &&
    [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ].some(([dx, dy]) => floor(x + dx, y + dy));
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const px = OX + x * S,
        py = OY + y * S;
      if (floor(x, y)) {
        const variant =
          (Math.imul(x + 1, 73856093) ^ Math.imul(y + 1, 19349663)) >>> 0;
        crop(variant % 4, Math.floor(variant / 4) % 4, px, py);
      } else if (wall(x, y)) {
        let c = [3, 8];
        const l = wall(x - 1, y),
          r = wall(x + 1, y),
          u = wall(x, y - 1),
          d = wall(x, y + 1);
        if (mode === "baseline") c = [1, 9];
        else if (!u && !d && (l || r))
          c = l && r ? [7, 4] : l ? [8, 4] : [6, 4];
        else if (!l && !r && (u || d)) c = floor(x + 1, y) ? [5, 9] : [7, 9];
        else provisional.push({ x, y });
        crop(...c, px, py);
      }
      if (grid) {
        ctx.strokeStyle = "#d9e5e51f";
        ctx.strokeRect(px, py, S, S);
      }
    }
  // Wall footprints stay on their boundary cells. Elevation projects upward:
  // the face occupies the boundary row and its cap is one row above it.
  // Draw after terrain so later floor cells cannot erase the wall faces.
  if (mode === "assembled") {
    const horizontal = (x, y) =>
      wall(x, y) && (floor(x, y - 1) || floor(x, y + 1));
    const segment = (x, y) =>
      wall(x, y) &&
      (horizontal(x, y) || horizontal(x - 1, y) || horizontal(x + 1, y));
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (!segment(x, y)) continue;
        const left = segment(x - 1, y),
          right = segment(x + 1, y);
        const column = left && right ? 7 : left ? 8 : 6;
        crop(column, 4, OX + x * S, OY + (y - 1) * S);
        // A top endpoint that continues down a side wall is a connector,
        // not a front-facing wall. Keep faces on the interior span.
        const connectsDown =
          left !== right &&
          wall(x, y + 1) &&
          (floor(x - 1, y + 1) || floor(x + 1, y + 1));
        if (connectsDown) {
          crop(left ? 7 : 5, 9, OX + x * S, OY + y * S);
          provisional = provisional.filter((p) => p.x !== x || p.y !== y);
        } else crop(column, 5, OX + x * S, OY + y * S);
      }
  }
  if (mode === "assembled")
    for (const p of provisional) {
      ctx.fillStyle = "#f2bd69";
      ctx.beginPath();
      ctx.arc(OX + p.x * S + S - 5, OY + p.y * S + 5, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  label("Horizontal walls: caps above faces, using the strip below.", OX, 514);
  label("Original horizontal wall assembly", OX, 550, "#c7d998");
  for (let i = 0; i < 7; i++) {
    const tx = i === 0 ? 6 : i === 6 ? 8 : 7;
    crop(tx, 4, OX + i * 26, 566, 26);
    crop(tx, 5, OX + i * 26, 592, 26);
  }
  label("Caps above", 240, 585);
  label("Faces below", 240, 612);
  for (let y = 0; y < 13; y++)
    for (let x = 0; x < 10; x++) {
      ctx.fillStyle = (x + y) % 2 ? "#30343f" : "#262a35";
      ctx.fillRect(AX + x * AS, AY + y * AS, AS, AS);
      crop(x, y, AX + x * AS, AY + y * AS, AS);
      ctx.strokeStyle = "#a4b0bf33";
      ctx.strokeRect(AX + x * AS, AY + y * AS, AS, AS);
    }
  for (let x = 0; x < 10; x++)
    label(String(x), AX + x * AS + 12, AY - 10, "#a5b2bc", 11);
  for (let y = 0; y < 13; y++)
    label(String(y), AX - 23, AY + y * AS + 22, "#a5b2bc", 11);
  ctx.strokeStyle = "#f2bd69";
  ctx.lineWidth = 2;
  ctx.strokeRect(AX + selected[0] * AS, AY + selected[1] * AS, AS, AS);
  ctx.lineWidth = 1;
  crop(...selected, AX, 565, 64);
  label(`Column ${selected[0]}, row ${selected[1]}`, AX + 82, 586);
  label(
    known[selected.join(",")] ?? "Unclassified artwork / empty cell",
    AX + 82,
    610,
    "#a5b2bc",
    12,
  );
  document.querySelector("#selection").textContent =
    `Selected: ${known[selected.join(",")] ?? "Unclassified artwork / empty cell"} · source x=${selected[0] * 16}, y=${selected[1] * 16}, width=16, height=16. Coordinates start at the top left.`;
}
canvas.addEventListener("click", (e) => {
  const b = canvas.getBoundingClientRect(),
    x = ((e.clientX - b.left) * 1080) / b.width,
    y = ((e.clientY - b.top) * 650) / b.height;
  const tx = Math.floor((x - AX) / AS),
    ty = Math.floor((y - AY) / AS);
  if (tx >= 0 && tx < 10 && ty >= 0 && ty < 13) {
    selected = [tx, ty];
    draw();
  }
});
for (const id of ["assembled", "baseline"])
  document.getElementById(id).onclick = () => {
    mode = id;
    for (const b of ["assembled", "baseline"])
      document
        .getElementById(b)
        .setAttribute("aria-pressed", String(b === mode));
    draw();
  };
document.getElementById("shape").onchange = (e) => {
  shape = e.target.value;
  draw();
};
document.getElementById("grid").onclick = (e) => {
  grid = !grid;
  e.target.setAttribute("aria-pressed", String(grid));
  draw();
};
window.render_game_to_text = () =>
  JSON.stringify({
    mode,
    shape,
    grid,
    selected,
    selectedLabel: known[selected.join(",")] ?? "Unclassified",
    provisional,
    coordinates:
      "Map and atlas origins top-left; x right, y down. Atlas uses 16px source cells.",
    tiles,
  });
window.advanceTime = () => draw();
source
  .decode()
  .then(draw)
  .catch(() => {
    document.querySelector("#selection").textContent =
      "Could not load the source tilesheet. Reload to try again.";
  });
