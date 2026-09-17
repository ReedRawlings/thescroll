import Phaser from "phaser";
import { makeFloors, floorMetrics } from "./layouts.js";
import { footprint } from "./dressing.js";
import {
  startFloor,
  movePlayer,
  useSupply,
  command,
  tickFloor,
} from "./model.js";
import { pathfind } from "../dungeon.js";
import { ABILITIES, previewAction } from "../combat.js";
import "../rooms/gallery.css";
import "./gallery.css";
const all = makeFloors();
let s = startFloor(),
  scene,
  manual = false,
  decorated = true,
  routes = false,
  labels = false,
  overview = true,
  ability = "strike",
  target = "",
  lastActor = null,
  lastUI = "";
const $ = (q) => document.querySelector(q);
document.title = "The Scroll — Five floor expeditions";
document.body.innerHTML = `<main class="gallery floors"><header class="masthead"><a class="wordmark" href="/">THE SCROLL</a><span>FIVE FLOOR EXPEDITIONS</span><a href="/?rooms=1">Room examples ↗</a></header><section class="intro"><div><span class="eyebrow">Connected places. Different journeys.</span><h1>Five ways through the tower.</h1></div><p>Whole floors, from entrance to stairs. Each has its own silhouette, connected areas, pursuit routes and optional discoveries.</p></section><section class="workspace"><nav><div class="room-list"></div><p class="nav-note">Select any floor.<br>Play to explore at close range.<br>Overview to inspect the whole plan.<br><br>Tap to move. Contact opens timeline combat. Stairs complete the expedition.</p></nav><div><div class="viewport"><div class="view-head"><strong id="floor-label"></strong><span id="dimensions"></span></div><div class="floor-stage"><div id="floor-canvas"></div><div id="battle" hidden></div></div><div class="toolbar"><button id="overview" aria-pressed="true">Overview</button><button id="decor" aria-pressed="true">Detail</button><button id="routes" aria-pressed="false">Routes</button><button id="labels" aria-pressed="false">Places</button><button id="reset">Reset</button><button id="play" class="try">Play ▶</button></div></div><div id="party"></div><div id="supplies"><select id="supply-target" aria-label="Supply recipient"></select><button data-supply="potion"></button><button data-supply="tonic"></button></div><p id="status" class="status" role="status"></p><div class="legend"><span><i class="dot"></i>Direct approach</span><span><i class="dot blue"></i>Alternate route</span><span>◇ Chest · ↑ Stairs</span></div><button id="next" hidden>Next floor →</button></div><aside class="notes" id="notes"></aside></section><section class="decoration-guide"><span class="eyebrow">What changed</span><h2>The layout carries the identity.</h2><div class="principles"><article><h3>Different silhouettes</h3><p>A courtyard ring, organic caves, linked archive wings, bridged islands and a stepped fortress.</p></article><article><h3>Connected spaces</h3><p>Choose a route across an entire floor. Optional wings carry rewards; loops reconnect and allow retreat.</p></article><article><h3>Functional decoration</h3><p>Solid furniture belongs to the layout. Surface details cluster near walls and activity, keeping paths clear.</p></article><article><h3>Playable review</h3><p>Shared movement and combat, manual ability and target choices, supplies and an actual floor exit.</p></article></div></section><p class="footer">Five authored floor examples, with seeded surface details. Each selection starts a fresh review expedition; no town saves are changed. The main tower generator is separate. Research and code references are recorded in docs/design/floor-examples.md.</p></main>`;
$(".room-list").innerHTML = all
  .map(
    (m, i) =>
      `<button class="room-button" data-floor="${i}"><span class="number">0${i + 1}</span><span>${m.name}<small>${m.subtitle}</small></span></button>`,
  )
  .join("");
function choose(i) {
  s = startFloor(i);
  overview = true;
  ability = "strike";
  target = "";
  lastActor = null;
  lastUI = "";
  scene?.draw();
  sync();
}
document
  .querySelectorAll("[data-floor]")
  .forEach((b) => (b.onclick = () => choose(+b.dataset.floor)));
$("#reset").onclick = () => choose(s.index);
$("#next").onclick = () => choose((s.index + 1) % all.length);
$("#overview").onclick = () => {
  overview = !overview;
  if (overview) s.running = false;
  scene.camera();
  sync();
};
for (const [id, set] of [
  ["decor", () => (decorated = !decorated)],
  ["routes", () => (routes = !routes)],
  ["labels", () => (labels = !labels)],
])
  $("#" + id).onclick = () => {
    set();
    scene.draw();
    sync();
  };
$("#play").onclick = () => {
  if (s.mode === "complete" || s.mode === "defeat") return;
  s.running = !s.running;
  if (s.running) overview = false;
  scene.camera();
  sync();
};
document.querySelectorAll("[data-supply]").forEach(
  (b) =>
    (b.onclick = () => {
      useSupply(s, b.dataset.supply, $("#supply-target").value);
      sync();
    }),
);
function sync() {
  const m = s.map,
    metrics = floorMetrics(m);
  $("#floor-label").textContent = m.name;
  $("#dimensions").textContent =
    `${m.width} × ${m.height} / ${overview ? "OVERVIEW" : "EXPLORING"}`;
  document.querySelectorAll("[data-floor]").forEach((b, i) => {
    b.classList.toggle("active", i === s.index);
    b.setAttribute("aria-current", i === s.index ? "true" : "false");
  });
  $("#notes").innerHTML =
    `<div class="summary"><span class="eyebrow">Expedition 0${s.index + 1}</span><h2>${m.subtitle}</h2><p>${m.description}</p></div><div><h3>The route decision</h3><p>${m.decision}</p></div><div><h3>Places to find</h3><p>${m.regions.map((r) => r.name).join(" · ")}</p><h3>Floor profile</h3><p>${metrics.floorTiles} walkable tiles<br>${metrics.entranceToStairs} steps by the shortest route<br>${m.chests.length} chests · ${m.enemies.length} enemies remaining</p></div>`;
  for (const [id, value] of [
    ["decor", decorated],
    ["routes", routes],
    ["labels", labels],
    ["overview", overview],
  ])
    $("#" + id).setAttribute("aria-pressed", value);
  $("#play").textContent = s.running ? "Pause ▮▮" : "Play ▶";
  $("#play").disabled = ["complete", "defeat"].includes(s.mode);
  $("#status").textContent = s.message;
  $("#next").hidden = s.mode !== "complete";
  renderParty();
  if (!$("#supply-target").options.length)
    $("#supply-target").innerHTML = s.party
      .map((u) => `<option value="${u.id}">${u.name}</option>`)
      .join("");
  document.querySelector('[data-supply="potion"]').textContent =
    `Heal (${s.potions})`;
  document.querySelector('[data-supply="tonic"]').textContent =
    `Ether (${s.tonics})`;
  document
    .querySelectorAll("[data-supply]")
    .forEach((b) => (b.disabled = s.mode !== "explore"));
  battleUI();
}
function renderParty() {
  $("#party").innerHTML = s.party
    .map(
      (u) =>
        `<div><strong>${u.name}</strong><span>${u.hp}/${u.maxHp} HP · ${u.mp} MP</span><meter min="0" max="${u.maxHp}" value="${u.hp}"></meter></div>`,
    )
    .join("");
}
function battleUI() {
  const box = $("#battle");
  box.hidden = s.mode !== "combat";
  if (box.hidden) {
    lastUI = "";
    return;
  }
  const b = s.battle,
    actor = b.units.find((u) => u.id === b.pendingActorId);
  if (actor?.id !== lastActor) {
    lastActor = actor?.id;
    ability = actor?.abilities[0] ?? "strike";
    target = "";
  }
  const move = ABILITIES[ability];
  const candidates = b.units.filter(
    (u) => u.hp > 0 && u.side === (move.target === "ally" ? "party" : "enemy"),
  );
  if (!candidates.some((u) => u.id === target)) target = candidates[0]?.id;
  const signature = JSON.stringify([
    b.phase,
    b.units.map((u) => [u.hp, u.mp, Math.floor(u.position)]),
    ability,
    target,
    s.running,
  ]);
  if (signature === lastUI) return;
  lastUI = signature;
  renderParty();
  const preview = actor ? previewAction(b, ability, target) : null;
  box.innerHTML = `<div class="combat-head"><span class="eyebrow">${s.encounter.boss ? "Guardian" : "Encounter"} / ${b.phase === "command" ? "Timeline paused" : "Timeline advancing"}</span><h2>${actor ? actor.name + " — choose an action" : "Actions in motion"}</h2></div><div class="combat-units">${b.units
    .filter((u) => u.side === "enemy")
    .map(
      (u) =>
        `<div class="combat-unit ${u.id === target ? "selected" : ""}"><img src="/assets/${u.texture}.png" alt="${u.name}"><strong>${u.name}</strong><span>${u.hp}/${u.maxHp} HP</span></div>`,
    )
    .join(
      "",
    )}</div><div class="timeline">${b.units.map((u) => `<div><span>${u.name}</span><i style="--progress:${u.position}%;--lane:${u.side === "party" ? "#8fbfc2" : "#d49a7b"}"></i></div>`).join("")}</div><div class="commands">${actor ? `<div class="ability-row">${actor.abilities.map((id) => `<button data-ability="${id}" class="${id === ability ? "active" : ""}" ${actor.mp < ABILITIES[id].mp ? "disabled" : ""}>${ABILITIES[id].name}<small>${ABILITIES[id].tier} · ${ABILITIES[id].mp} MP</small></button>`).join("")}</div><label>Target <select id="target">${candidates.map((u) => `<option value="${u.id}" ${u.id === target ? "selected" : ""}>${u.name}</option>`).join("")}</select></label><button id="confirm" ${!s.running ? "disabled" : ""}>Confirm · ${move.heal ? preview.healing + " healing" : preview.damage + " damage"}</button>` : "<p>Waiting for a party member to reach COM…</p>"}</div>`;
  box.querySelectorAll("[data-ability]").forEach(
    (button) =>
      (button.onclick = () => {
        ability = button.dataset.ability;
        target = "";
        battleUI();
      }),
  );
  if ($("#target"))
    $("#target").onchange = (e) => {
      target = e.target.value;
      battleUI();
    };
  if ($("#confirm"))
    $("#confirm").onclick = () => {
      command(s, ability, target);
      sync();
    };
}
const colors = {
  moss: { floor: 0xadbfb0, wall: 0x97b49e, water: 0x123d3a },
  earth: { floor: 0xcab494, wall: 0xb19b83, water: 0x342e2b },
  ink: { floor: 0xb4b7d9, wall: 0xaaa2c4, water: 0x202235 },
  tide: { floor: 0x9cbccf, wall: 0x7eafc5, water: 0x103b53 },
  ember: { floor: 0xd1ae92, wall: 0xc6a783, water: 0x352624 },
};
class FloorScene extends Phaser.Scene {
  preload() {
    this.load.spritesheet("bridge", "/assets/rooms/bridge.png", {
      frameWidth: 16,
      frameHeight: 16,
    });
    for (const key of ["floor", "wall", "stairs", "chest"])
      this.load.image(key, `/assets/${key}.png`);
    for (const key of ["hero", "torch"])
      this.load.spritesheet(key, `/assets/${key}.png`, {
        frameWidth: 16,
        frameHeight: 18,
      });
    for (const kind of ["slime", "bat", "skeleton", "boss"])
      this.load.spritesheet("map-" + kind, `/assets/map-${kind}.png`, {
        frameWidth: 16,
        frameHeight: 16,
      });
    for (const key of [
      "bookshelf",
      "books",
      "crate",
      "vase",
      "broken-vase",
      "skulls",
      "rock",
      "banner",
      "banner-red",
      "grave",
      "chain",
      "gold",
      "table",
      "chair",
      "bookshelf2",
      "coffin",
      "throne",
      "painting",
      "painting2",
      "shield",
      "sword",
      "scroll",
      "banner-green",
      "vase-grey",
      "rock2",
      "books2",
    ])
      this.load.image(key, `/assets/rooms/${key}.png`);
  }
  create() {
    scene = this;
    this.cameras.main.setBackgroundColor("#0b1016");
    this.draw();
    sync();
    this.input.on("pointerdown", (p) => {
      if (s.mode !== "explore") return;
      const w = this.cameras.main.getWorldPoint(p.x, p.y);
      movePlayer(s, { x: Math.floor(w.x / 16), y: Math.floor(w.y / 16) });
    });
    this.input.keyboard.on("keydown-F", () =>
      this.scale.isFullscreen
        ? this.scale.stopFullscreen()
        : this.scale.startFullscreen(),
    );
    window.__scrollReady = true;
  }
  camera() {
    const c = this.cameras.main,
      m = s.map;
    if (overview) c.setBounds(-16, -16, m.width * 16 + 32, m.height * 16 + 32);
    else c.removeBounds();
    c.setZoom(
      overview
        ? Math.min(640 / (m.width * 16 + 32), 640 / (m.height * 16 + 32))
        : Math.min(c.width, c.height) / (11 * 16),
    );
    c.centerOn(
      overview ? m.width * 8 : (s.player.x + 0.5) * 16,
      overview ? m.height * 8 : (s.player.y + 0.5) * 16,
    );
  }
  draw() {
    this.children.removeAll(true);
    const m = s.map,
      palette = colors[m.palette],
      g = this.add.graphics();
    for (const p of m.water) {
      if (m.tiles[p.y][p.x]) continue;
      g.fillStyle(palette.water, 1).fillRect(p.x * 16, p.y * 16, 16, 16);
      if ((p.x + p.y) % 3 === 0)
        g.lineStyle(1, 0x6ca3a2, 0.2).lineBetween(
          p.x * 16 + 3,
          p.y * 16 + 10,
          p.x * 16 + 11,
          p.y * 16 + 10,
        );
    }
    const solids = new Set(
      m.props
        .filter((p) => p.solid)
        .flatMap(footprint)
        .map((p) => `${p.x},${p.y}`),
    );
    for (let y = 0; y < m.height; y++)
      for (let x = 0; x < m.width; x++) {
        const floor = !!m.tiles[y][x] || solids.has(`${x},${y}`);
        const border =
          !floor &&
          [
            [0, 1],
            [1, 0],
            [-1, 0],
            [0, -1],
          ].some(([dx, dy]) => m.tiles[y + dy]?.[x + dx]);
        if (!floor && !border) continue;
        this.add
          .image(x * 16 + 8, y * 16 + 8, floor ? "floor" : "wall")
          .setTint(floor ? palette.floor : palette.wall)
          .setAlpha(floor ? 1 : 0.8);
        if (border) {
          g.lineStyle(2, palette.wall, 0.5);
          if (m.tiles[y + 1]?.[x])
            g.lineBetween(x * 16, y * 16 + 14, x * 16 + 16, y * 16 + 14);
        }
      }
    for (const p of m.bridges ?? [])
      this.add
        .image(p.x * 16 + 8, p.y * 16 + 8, "bridge", 1)
        .setRotation(p.vertical ? Math.PI / 2 : 0)
        .setDepth(1);
    if (decorated) {
      const surfaces = this.add.graphics().setDepth(0.5);
      for (const r of m.rugs) {
        // Woven floor coverings are walkable, including beneath furnishings.
        const x = r.x * 16 + 2,
          y = r.y * 16 + 2,
          w = r.w * 16 - 4,
          h = r.h * 16 - 4;
        surfaces.fillStyle(r.color, 0.88).fillRect(x, y, w, h);
        surfaces
          .lineStyle(1, 0xc9a679, 0.7)
          .strokeRect(x + 3, y + 3, w - 6, h - 6);
        surfaces
          .lineStyle(1, 0x1c2430, 0.5)
          .strokeRect(x + 5, y + 5, w - 10, h - 10);
        for (let xx = x + 4; xx < x + w - 3; xx += 4) {
          surfaces.lineStyle(1, 0xbeb39b, 0.5).lineBetween(xx, y - 2, xx, y);
          surfaces.lineBetween(xx, y + h, xx, y + h + 2);
        }
      }
      const wear =
        m.id === "cloister"
          ? 0x638963
          : m.id === "cistern"
            ? 0x568080
            : 0xa39688;
      for (let y = 1; y < m.height - 1; y++)
        for (let x = 1; x < m.width - 1; x++) {
          if (!m.tiles[y][x] || (x * 13 + y * 7) % 5 !== 0) continue;
          const edge =
            !m.tiles[y - 1][x] ||
            !m.tiles[y + 1][x] ||
            !m.tiles[y][x - 1] ||
            !m.tiles[y][x + 1];
          if (!edge) continue;
          surfaces
            .fillStyle(wear, 0.32)
            .fillRect(x * 16 + 2, y * 16 + 11, 5, 2);
          surfaces.fillRect(x * 16 + 7, y * 16 + 8, 3, 2);
        }
      for (const p of m.props) {
        const w = p.w ?? 1,
          h = p.h ?? 1;
        if (p.solid)
          this.add
            .ellipse(
              (p.x + w / 2) * 16,
              (p.y + h) * 16 - 2,
              w * 14,
              5,
              0x080d18,
              0.38,
            )
            .setDepth(1.8);
        if (p.key === "torch") {
          const light = this.add.graphics().setDepth(1.7);
          for (const [radius, alpha] of [
            [23, 0.045],
            [15, 0.06],
            [8, 0.08],
          ])
            light
              .fillStyle(0xffbf65, alpha)
              .fillCircle(p.x * 16 + 8, p.y * 16 + 5, radius);
        }
        this.add
          .image((p.x + w / 2) * 16, (p.y + h) * 16, p.key, 0)
          .setOrigin(0.5, 1)
          .setAlpha(p.solid || p.authored ? 1 : 0.75)
          .setDepth(p.y * 0.01 + 2);
      }
    }
    // Structural furniture remains visible even with cosmetic detail disabled.
    if (!decorated)
      for (const p of m.props.filter((p) => p.solid))
        this.add
          .rectangle(
            (p.x + (p.w ?? 1) / 2) * 16,
            (p.y + (p.h ?? 1) / 2) * 16,
            (p.w ?? 1) * 16 - 2,
            (p.h ?? 1) * 16 - 2,
            0x566272,
          )
          .setStrokeStyle(1, 0x9bafae);
    for (const c of m.chests)
      this.add
        .image(c.x * 16 + 8, c.y * 16 + 8, "chest")
        .setAlpha(c.opened ? 0.35 : 1)
        .setDepth(5);
    this.add
      .image(m.exit.x * 16 + 8, m.exit.y * 16 + 8, "stairs")
      .setScale(0.5)
      .setDepth(5);
    this.add
      .text(m.exit.x * 16 + 8, m.exit.y * 16 - 5, "UP", {
        fontSize: "9px",
        fontFamily: "monospace",
        color: "#ffe1a1",
        backgroundColor: "#101b23",
      })
      .setOrigin(0.5)
      .setDepth(8);
    this.add
      .rectangle(m.spawn.x * 16 + 8, m.spawn.y * 16 + 8, 15, 15)
      .setStrokeStyle(1, 0x91c4c3)
      .setDepth(5);
    if (routes) {
      const lines = this.add.graphics().setDepth(7);
      m.routes.forEach((points, i) => {
        lines.lineStyle(2, i ? 0x88c6d2 : 0xe9c77b, 0.85);
        for (let j = 1; j < points.length; j++)
          lines.strokePoints(
            [points[j - 1], ...pathfind(m, points[j - 1], points[j])].map(
              (p) => ({ x: p.x * 16 + 8, y: p.y * 16 + 8 }),
            ),
            false,
          );
      });
    }
    if (labels)
      for (const r of m.regions)
        this.add
          .text(r.x * 16 + 8, r.y * 16 + 8, r.name, {
            fontFamily: "monospace",
            fontSize: "10px",
            color: "#ffe7b3",
            backgroundColor: "#131c27",
            padding: { x: 3, y: 3 },
          })
          .setOrigin(0.5)
          .setDepth(10);
    this.actors = m.enemies.map((e) => ({
      e,
      view: this.add.image(0, 0, "map-" + e.kind, 0).setDepth(11),
    }));
    this.hero = this.add.image(0, 0, "hero", 0).setDepth(12);
    this.updateActors();
    this.camera();
  }
  updateActors() {
    if (!this.hero) return;
    this.hero.setPosition(s.player.x * 16 + 8, s.player.y * 16 + 6);
    for (const { e, view } of this.actors)
      view
        .setPosition(e.x * 16 + 8, e.y * 16 + 8)
        .setTint(e.alert ? 0xffb18c : 0xffffff);
    if (!overview) this.camera();
  }
  update(_, delta) {
    if (!manual) advance(Math.min(delta / 1000, 0.05));
  }
}
function advance(dt) {
  if (document.hidden) return;
  const before = [
    s.mode,
    s.map.enemies.length,
    s.map.chests.filter((c) => c.opened).length,
  ].join();
  tickFloor(s, dt);
  const after = [
    s.mode,
    s.map.enemies.length,
    s.map.chests.filter((c) => c.opened).length,
  ].join();
  if (before !== after) scene?.draw();
  scene?.updateActors();
  if (s.mode === "combat") battleUI();
  if (before !== after || s.message !== $("#status").textContent) sync();
}
new Phaser.Game({
  type: Phaser.WEBGL,
  parent: "floor-canvas",
  width: 640,
  height: 640,
  pixelArt: true,
  roundPixels: true,
  banner: false,
  audio: { noAudio: true },
  preserveDrawingBuffer: new URLSearchParams(location.search).has("capture"),
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: FloorScene,
});
window.advanceTime = async (ms) => {
  manual = true;
  for (let t = 0; t < ms; t += 1000 / 60)
    advance(Math.min(ms - t, 1000 / 60) / 1000);
  await new Promise(requestAnimationFrame);
};
window.render_game_to_text = () =>
  JSON.stringify({
    mode: s.mode,
    index: s.index,
    floor: s.map.id,
    overview,
    decorated,
    routes,
    labels,
    running: s.running,
    coordinateSystem:
      "Tile grid, x right y down; tile16 world pixels; camera viewport640.",
    camera: scene
      ? {
          scrollX: scene.cameras.main.scrollX,
          scrollY: scene.cameras.main.scrollY,
          zoom: scene.cameras.main.zoom,
        }
      : null,
    player: s.player,
    path: s.path,
    map: {
      tiles: s.map.tiles,
      exit: s.map.exit,
      chests: s.map.chests,
      enemies: s.map.enemies,
    },
    party: s.party,
    gold: s.gold,
    potions: s.potions,
    tonics: s.tonics,
    battle: s.battle,
    message: s.message,
  });
