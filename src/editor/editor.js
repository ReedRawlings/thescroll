import "./style.css";
import {
  newRoom,
  doorwayPosition,
  roomSprites,
  connections,
  exampleRoom,
  collision,
  validate,
  parseRoom,
  placeAsset,
  SIZE,
} from "./model.js";
import { ASSET_RULES, asset, layer } from "./catalog.js";
import { footprint } from "../floors/dressing.js";
import { terrainSprites, FLOOR_FRAMES } from "../tileset/render.js";
import { pathfind } from "../dungeon.js";
async function startEditor() {
  document.title = "The Scroll — Room workshop";
  const $ = (s) => document.querySelector(s),
    storage = "scroll-room-library-v1",
    draft = "scroll-room-draft-v1";
  let room = newRoom(),
    library = [],
    tool = "floor",
    selected = "Book shelf 01.png",
    frame = 11,
    history = [],
    future = [],
    walking = false,
    player = null,
    path = [],
    drag = false,
    last = "",
    dirty = false;
  try {
    library = JSON.parse(localStorage.getItem(storage) || "[]").map((r) => ({
      ...parseRoom(JSON.stringify(r)),
      id: r.id,
    }));
    const saved = localStorage.getItem(draft);
    if (saved) room = parseRoom(saved);
  } catch {
    /* Invalid storage cannot prevent opening the editor. */
  }
  document.body.innerHTML = `<main><header><a href="/?bsp=1">← Dungeon preview</a><span>THE SCROLL / ROOM WORKSHOP</span><button id="save">Save room</button><button id="export">Export file</button><button id="import">Import file</button><input id="file" type="file" accept=".json" hidden></header><section class="intro"><div><small>MAKE A PLACE WORTH FINDING</small><h1>Room workshop</h1></div><p>Paint a room, arrange its contents, then walk through it.<br>Walls follow your floor shape. Art keeps its original orientation.</p></section><div class="layout"><aside><label>Room name<input id="name" maxlength="80"></label><label>Purpose<input id="purpose" maxlength="80"></label><label>Use<select id="usage"><option value="reference">Design reference</option><option value="template">Occasional template</option></select></label><label>Appearance weight<input id="weight" type="number" min="1" max="100"></label><p class="hint">Lower weights mean rarer appearances when templates are integrated into generation. Saved rooms are not inserted automatically yet.</p><label>Design notes<textarea id="notes" rows="3" placeholder="What makes this arrangement work?"></textarea></label><h2>Start from</h2><div class="stack"><button data-example="blank">Empty room</button><button data-example="Reading room">Reading room</button><button data-example="Treasure room">Treasure room</button><button data-example="Encounter room">Encounter room</button></div><h2>Saved rooms</h2><div id="library" class="stack"></div></aside><section class="work"><div class="toolbar"><button data-tool="floor">Floor</button><button data-tool="erase">Erase terrain</button><button data-tool="void">Paint void</button><button data-tool="ledge">Wall bottom</button><button data-tool="asset">Place asset</button><button data-tool="remove">Remove item</button><button data-tool="replace">Replace asset</button><button id="undo" title="⌘/Ctrl Z">Undo</button><button id="redo" title="⌘/Ctrl Shift Z or Ctrl Y">Redo</button><button id="walk">Walk test</button></div><canvas width="576" height="576" tabindex="0" aria-label="Room canvas. Paint by dragging; in walk test click a destination or use arrow keys."></canvas><p id="status" role="status">Choose a tool and click or drag on the room.</p><div id="checks"></div><p class="hint">18 × 18 workspace · one tile of side margin and two above for walls.<br>Walk test checks movement and collision. Enemy, treasure, key and trap markers are design annotations.</p></section><aside><h2>Floor palette</h2><div id="floors"></div><h2>Markers</h2><div class="markers">${["entrance", "spawn", "enemy", "treasure", "key", "trap"].map((k) => `<button data-tool="${k}">${k === "entrance" ? "Doorway" : k}</button>`).join("")}</div><h2>Choose an asset</h2><div id="selected-asset"></div><p class="hint">Choose a picture below, then click a floor tile to place it. Use Replace asset to swap an existing item.</p><input id="search" placeholder="Find an asset…" aria-label="Find an asset"><select id="category" aria-label="Asset category"><option value="">All categories</option>${[...new Set(Object.values(ASSET_RULES).map((a) => a.category))].map((c) => `<option>${c}</option>`).join("")}</select><div id="assets"></div><p id="asset-note" class="hint"></p></aside></div></main>`;
  const canvas = $("canvas"),
    ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const images = {};
  const load = (src) =>
    new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(Error("Could not load " + src));
      im.src = src;
    });
  const atlas = await load("/assets/tileset-study.png");
  await Promise.all(
    Object.keys(ASSET_RULES).map(
      async (file) =>
        (images[file] = await load(
          ASSET_RULES[file].sheet
            ? "/assets/editor/" +
                encodeURIComponent(ASSET_RULES[file].sheet) +
                ".png"
            : "/assets/reviewed/" + encodeURIComponent(file),
        )),
    ),
  );
  for (const [file, a] of Object.entries(ASSET_RULES))
    if (a.rect) {
      const crop = document.createElement("canvas");
      crop.width = a.width;
      crop.height = a.height;
      crop
        .getContext("2d")
        .drawImage(images[file], ...a.rect, 0, 0, a.width, a.height);
      images[file] = await load(crop.toDataURL());
    }
  function message(s) {
    $("#status").textContent = s;
  }
  function checkpoint() {
    future = [];
    history.push(JSON.stringify(room));
    if (history.length > 60) history.shift();
  }
  function persist() {
    dirty = true;
    try {
      localStorage.setItem(draft, JSON.stringify(room));
    } catch {
      message("Browser storage is full. Export your room to keep it.");
    }
    draw();
  }
  function fields() {
    for (const k of ["name", "purpose", "usage", "weight", "notes"])
      $("#" + k).value = room[k];
  }
  function setRoom(next) {
    checkpoint();
    room = next;
    walking = false;
    player = null;
    path = [];
    $("#walk").textContent = "Walk test";
    fields();
    persist();
    message("Room loaded. Your previous layout is available with Undo.");
  }
  for (const k of ["name", "purpose", "usage", "weight", "notes"])
    $("#" + k).onchange = () => {
      checkpoint();
      room[k] =
        k === "weight"
          ? Math.max(1, Math.min(100, Number($("#" + k).value) || 1))
          : $("#" + k).value;
      persist();
    };
  function setTool(t) {
    if (walking) return;
    tool = t;
    document
      .querySelectorAll("[data-tool]")
      .forEach((b) => b.classList.toggle("active", b.dataset.tool === t));
  }
  document
    .querySelectorAll("[data-tool]")
    .forEach((b) => (b.onclick = () => setTool(b.dataset.tool)));
  document
    .querySelectorAll("[data-example]")
    .forEach(
      (b) =>
        (b.onclick = () =>
          setRoom(
            b.dataset.example === "blank"
              ? newRoom()
              : exampleRoom(b.dataset.example),
          )),
    );
  function savedList() {
    $("#library").replaceChildren();
    for (const r of library) {
      const b = document.createElement("button");
      b.textContent = r.name || "Untitled room";
      b.onclick = () => setRoom(structuredClone(r));
      $("#library").append(b);
    }
    if (!library.length) $("#library").textContent = "No saved rooms yet.";
  }
  $("#save").onclick = () => {
    if (room.usage === "template" && validate(room).length) {
      message(
        "Fix the room checks before saving as a template, or save as a reference.",
      );
      return;
    }
    try {
      const next = library
        .filter((r) => r.id !== room.id)
        .concat(structuredClone(room));
      localStorage.setItem(storage, JSON.stringify(next));
      library = next;
      dirty = false;
      savedList();
      message("Saved in this browser. Export a file for a portable backup.");
    } catch {
      message("Could not save in this browser. Export the room instead.");
    }
  };
  $("#export").onclick = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(room, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = (room.name || "room").replace(/[^a-z0-9_-]/gi, "-") + ".json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    message("Room file exported.");
  };
  $("#import").onclick = () => $("#file").click();
  $("#file").onchange = async (e) => {
    try {
      const f = e.target.files[0];
      if (f) {
        if (f.size > 1000000) throw Error("Room file is too large.");
        setRoom(parseRoom(await f.text()));
      }
    } catch (e) {
      message(e.message);
    }
    e.target.value = "";
  };
  function restore(from, to, label) {
    if (walking || drag) return;
    const current = JSON.stringify(room);
    while (from.length && from.at(-1) === current) from.pop();
    if (!from.length) return;
    to.push(current);
    room = JSON.parse(from.pop());
    fields();
    persist();
    message(label);
  }
  $("#undo").onclick = () => restore(history, future, "Undone.");
  $("#redo").onclick = () => restore(future, history, "Redone.");
  document.addEventListener("keydown", (e) => {
    if (e.target.closest('input, textarea, select, [contenteditable="true"]'))
      return;
    if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
    const key = e.key.toLowerCase();
    if (key === "z" || (key === "y" && e.ctrlKey)) {
      e.preventDefault();
      if (key === "y" || e.shiftKey) restore(future, history, "Redone.");
      else restore(history, future, "Undone.");
    }
  });
  for (const f of FLOOR_FRAMES) {
    const b = document.createElement("button");
    b.title = `Floor ${f % 10}, ${Math.floor(f / 10)}`;
    b.style.backgroundImage = "url(/assets/tileset-study.png)";
    b.style.backgroundPosition = `-${(f % 10) * 32}px -${Math.floor(f / 10) * 32}px`;
    b.onclick = () => {
      frame = f;
      setTool("floor");
      document
        .querySelectorAll("#floors button")
        .forEach((el) => el.classList.toggle("active", el === b));
    };
    $("#floors").append(b);
  }
  const voidButton = document.createElement("button");
  voidButton.textContent = "×";
  voidButton.title = "Paint void over existing floor";
  voidButton.setAttribute("aria-label", "Paint void over floor");
  voidButton.onclick = () => {
    setTool("void");
    message(
      "Drag over floor to cut a void. Assets and markers stay on their own layers.",
    );
  };
  $("#floors").append(voidButton);
  function assets() {
    const chosen = ASSET_RULES[selected];
    const preview = document.createElement("img");
    preview.src = images[selected].src;
    preview.alt = "";
    $("#selected-asset").replaceChildren(
      preview,
      document.createTextNode(chosen.file.replace(".png", "")),
    );
    $("#asset-note").textContent =
      chosen.category === "Door / connector"
        ? "Place on a wall to create an entrance / exit. Doorways are passable in walk test; locks and opening interactions are not simulated."
        : chosen.placement + " " + chosen.notes;

    const query = $("#search").value.toLowerCase(),
      category = $("#category").value;
    $("#assets").replaceChildren();
    for (const a of Object.values(ASSET_RULES)) {
      if (
        !a.file.toLowerCase().includes(query) ||
        (category && a.category !== category)
      )
        continue;
      const b = document.createElement("button");
      b.classList.toggle("active", selected === a.file);
      const img = document.createElement("img");
      img.src = images[a.file].src;
      img.alt = "";
      b.append(img, document.createTextNode(a.file.replace(".png", "")));
      b.onclick = () => {
        selected = a.file;
        setTool(tool === "replace" ? "replace" : "asset");
        message(
          `Selected ${a.file.replace(".png", "")}. Click the room to ${tool === "replace" ? "replace an item" : "place it"}.`,
        );
        assets();
      };
      $("#assets").append(b);
    }
  }
  $("#search").oninput = assets;
  $("#category").onchange = assets;
  const colors = {
    entrance: "#8ee2dc",
    spawn: "#fff",
    enemy: "#fa8195",
    treasure: "#f5cb66",
    key: "#ebaaee",
    trap: "#ef985b",
  };
  function draw() {
    ctx.fillStyle = "#0a1118";
    ctx.fillRect(0, 0, 576, 576);
    for (const p of roomSprites(room))
      ctx.drawImage(
        atlas,
        (p.frame % 10) * 16,
        Math.floor(p.frame / 10) * 16,
        16,
        16,
        p.x * 32,
        p.y * 32,
        32,
        32,
      );
    for (const p of [...room.props].sort(
      (a, b) => layer(a.file) - layer(b.file) || a.y - b.y,
    )) {
      const a = asset(p.file),
        im = images[p.file];
      ctx.drawImage(
        im,
        p.x * 32,
        (p.y + a.h) * 32 - im.height * 2 + (p.offsetY || 0) * 2,
        im.width * 2,
        im.height * 2,
      );
    }
    if (!walking) {
      ctx.strokeStyle = "#b5c5d015";
      for (let i = 0; i <= SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 32, 0);
        ctx.lineTo(i * 32, 576);
        ctx.moveTo(0, i * 32);
        ctx.lineTo(576, i * 32);
        ctx.stroke();
      }
    }
    for (const p of room.markers) {
      ctx.strokeStyle = colors[p.kind];
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x * 32 + 3, p.y * 32 + 3, 26, 26);
      ctx.fillStyle = colors[p.kind];
      ctx.font = "bold 13px monospace";
      ctx.fillText(
        p.kind === "entrance" ? "↔" : p.kind[0].toUpperCase(),
        p.x * 32 + 12,
        p.y * 32 + 21,
      );
    }
    if (player) {
      ctx.fillStyle = "#fff4c7";
      ctx.beginPath();
      ctx.arc(player.x * 32 + 16, player.y * 32 + 16, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#342828";
      ctx.stroke();
    }
    const errors = validate(room);
    $("#checks").textContent = errors.length
      ? "Room checks: " + errors.join(" ")
      : "✓ Connected floor and clear entrances.";
    $("#checks").classList.toggle("valid", !errors.length);
  }
  function paint(e) {
    const b = canvas.getBoundingClientRect(),
      x = Math.floor(((e.clientX - b.left) * SIZE) / b.width),
      y = Math.floor(((e.clientY - b.top) * SIZE) / b.height);
    if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
    if (walking) {
      path = pathfind({ tiles: collision(room) }, player, { x, y });
      if (!path.length) message("Choose a reachable floor tile.");
      return;
    }
    if (last === `${x},${y}`) return;
    last = `${x},${y}`;
    if (tool === "floor") {
      if (x < 1 || x >= SIZE - 1 || y < 2 || y >= SIZE - 1) {
        message("Leave room around the edges for walls.");
        return;
      }
      room.terrain[y][x] = 1;
      room.frames[y][x] = frame;
    } else if (tool === "ledge") {
      if (!placeAsset(room, "Raised wall middle.png", x, y)) {
        message(
          "Place wall bottoms along the platform edge, on floor or void.",
        );
        return;
      }
    } else if (tool === "erase" || tool === "void") {
      room.terrain[y][x] = tool === "void" ? -1 : 0;
    } else if (tool === "replace") {
      const target = [...room.props]
        .reverse()
        .find((p) =>
          footprint({ ...asset(p.file), ...p }).some(
            (q) => q.x === x && q.y === y,
          ),
        );
      if (!target) {
        message("Click an existing asset to replace it.");
        return;
      }
      const original = room.props;
      room.props = room.props.filter((p) => p !== target);
      if (!placeAsset(room, selected, target.x, target.y)) {
        room.props = original;
        message("The selected asset does not fit here. Original item kept.");
        return;
      }
    } else if (tool === "asset") {
      if (!placeAsset(room, selected, x, y)) {
        message(
          "Place doors on a wall with a clear approach; other assets need a clear footprint or wall face.",
        );
        return;
      }
    } else if (tool === "remove") {
      room.props = room.props.filter(
        (p) =>
          !footprint({ ...asset(p.file), ...p }).some(
            (q) => q.x === x && q.y === y,
          ),
      );
      room.markers = room.markers.filter((p) => p.x !== x || p.y !== y);
    } else if (tool === "entrance") {
      const door = doorwayPosition(room, x, y);
      if (!door) {
        message("Place a doorway on a wall beside the floor.");
        return;
      }
      const trial = structuredClone(room);
      trial.markers = trial.markers.filter(
        (p) => p.x !== door.x || p.y !== door.y,
      );
      trial.markers.push({ kind: "entrance", ...door });
      const tiles = collision(trial);
      if (
        !tiles[door.y][door.x] ||
        ![
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ].some(([dx, dy]) => tiles[door.y + dy]?.[door.x + dx])
      ) {
        message("Clear the doorway and its inside approach first.");
        return;
      }
      room = trial;
      room.props = room.props.filter(
        (p) =>
          !(
            ASSET_RULES[p.file].category === "Wall decoration" &&
            p.x === door.x &&
            p.y === door.y
          ),
      );
    } else {
      if (!collision(room)[y][x]) {
        message("Place markers on clear floor.");
        return;
      }
      room.markers = room.markers.filter(
        (p) =>
          (p.x !== x || p.y !== y) && (tool !== "spawn" || p.kind !== "spawn"),
      );
      room.markers.push({ kind: tool, x, y });
    }
    persist();
  }
  canvas.onpointerdown = (e) => {
    canvas.focus();
    last = "";
    if (!walking) checkpoint();
    drag = true;
    canvas.setPointerCapture(e.pointerId);
    paint(e);
  };
  canvas.onpointermove = (e) => {
    if (
      drag &&
      !walking &&
      ["floor", "erase", "void", "remove", "ledge"].includes(tool)
    )
      paint(e);
  };
  canvas.onpointerup = () => (drag = false);
  canvas.onpointercancel = () => (drag = false);
  $("#walk").onclick = () => {
    walking = !walking;
    path = [];
    if (walking) {
      const tiles = collision(room);
      player =
        room.markers.find((p) => p.kind === "spawn" && tiles[p.y][p.x]) ||
        room.markers.find((p) => p.kind === "entrance" && tiles[p.y][p.x]);
      if (!player) {
        outer: for (let y = 0; y < SIZE; y++)
          for (let x = 0; x < SIZE; x++)
            if (tiles[y][x]) {
              player = { x, y };
              break outer;
            }
      }
      if (!player) {
        walking = false;
        message("Paint floor before testing.");
        return;
      }
      player = { x: player.x, y: player.y };
      message(
        "Click to walk, or use arrow keys / WASD. Markers do not trigger encounters.",
      );
    } else {
      player = null;
      message("Editing resumed.");
    }
    $("#walk").textContent = walking ? "Back to editing" : "Walk test";
    canvas.focus();
    draw();
  };
  canvas.onkeydown = (e) => {
    if (!walking) return;
    const dir = {
      ArrowUp: [0, -1],
      w: [0, -1],
      ArrowDown: [0, 1],
      s: [0, 1],
      ArrowLeft: [-1, 0],
      a: [-1, 0],
      ArrowRight: [1, 0],
      d: [1, 0],
    }[e.key];
    if (dir) {
      e.preventDefault();
      path = [];
      const [dx, dy] = dir;
      if (collision(room)[player.y + dy]?.[player.x + dx]) {
        player = { x: player.x + dx, y: player.y + dy };
        draw();
      }
    }
  };
  function step() {
    if (walking && path.length) {
      player = path.shift();
      draw();
    }
  }
  setInterval(step, 120);
  window.advanceTime = async (ms) => {
    for (let i = 0; i < Math.floor(ms / 120); i++) step();
  };
  window.render_game_to_text = () =>
    JSON.stringify({
      mode: walking ? "walk-test" : "editor",
      coordinateSystem: "origin top left, x right, y down; tile units",
      room,
      player,
      path,
      tool,
      selectedAsset: selected,
      doorways: connections(room),
      issues: validate(room),
      savedRooms: library.length,
    });
  fields();
  savedList();
  assets();
  setTool("floor");
  draw();
}
startEditor().catch((error) => {
  const status = document.querySelector("#status");
  if (status) status.textContent = error.message;
  console.error(error);
});
