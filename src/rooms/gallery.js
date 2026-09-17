import Phaser from "phaser";
import { makeExamples } from "./examples.js";
import { pathfind } from "../dungeon.js";
import {
  MOVEMENT,
  approach,
  updateEnemies,
  enemyInContact,
} from "../exploration.js";
import "./gallery.css";

document.title = "The Scroll — Room studies";
document.body.innerHTML = `<main class="gallery">
<header class="masthead"><a class="wordmark" href="/">THE SCROLL</a><span>ROOM STUDIES / 01—05</span><a href="/">Back to game ↗</a></header>
<section class="intro"><div><span class="eyebrow">A dungeon with a sense of place</span><h1>Every room has a reason.</h1></div><p>Five individual furnished rooms. Choose a shape, inspect its decoration, then try walking through.</p></section>
<section class="workspace"><nav><div class="room-list" aria-label="Example rooms"></div><p class="nav-note">Authored examples using the supplied MiniRogue art.<br><br>Each preview ends at its doorways. These are room pieces for a future dungeon.</p></nav>
<div><div class="viewport"><div class="view-head"><strong id="room-label"></strong><span>SINGLE ROOM</span></div><div id="room-canvas"></div><div class="toolbar"><button id="decor" aria-pressed="true">Decoration</button><button id="routes" aria-pressed="false">Routes</button><button id="reset">Reset</button><button id="try" class="try" aria-pressed="false">Try room ▶</button></div></div><p class="status" id="status" role="status"></p><div class="legend"><span><i class="dot"></i>Onward route</span><span><i class="dot blue"></i>Alternate / optional route</span></div></div>
<aside class="notes" id="notes"></aside></section>
<section class="decoration-guide"><span class="eyebrow">The decoration pass</span><h2>Purpose → structure → story → restraint.</h2><div class="principles"><article><h3>01 / Give it a job</h3><p>An archive has shelves, a guard post has tables, a shrine has an ordered approach. Choose a small, related set of objects.</p></article><article><h3>02 / Decide what is solid</h3><p>Shelves, tables and large stones change paths and sightlines. Place them with the layout, before cosmetic detail.</p></article><article><h3>03 / Cluster the traces</h3><p>Books beside shelves. Gold beside treasure. Broken pottery at the edges. Leave the walking lanes visually quiet.</p></article><article><h3>04 / Protect the read</h3><p>Doors, enemies and rewards come first. Repeat visual cues consistently. Inspect at phone size with the decoration switched off.</p></article></div></section>
<p class="footer">Review prototypes · Try mode uses the game's movement and pursuit rules. Contact pauses the study instead of opening battle. Door markers show where another room could connect. No expedition saves are changed.</p></main>`;

const $ = (s) => document.querySelector(s);
let examples = makeExamples(),
  index = 0,
  map = examples[0],
  player = { ...map.spawn },
  path = [],
  decorated = true,
  routes = false,
  running = false,
  manual = false,
  scene;
let message = "Inspect the room, or choose Try room and tap a clear tile.";
const setStatus = (s) => {
  $("#status").textContent = s;
};
function sync() {
  $("#room-label").textContent = map.theme;
  $("#notes").innerHTML =
    `<div class="summary"><span class="eyebrow">Study ${String(index + 1).padStart(2, "0")}</span><h2>${map.name}</h2><p>${map.pitch}</p></div><div><h3>The decision</h3><p>${map.choice}</p></div><div><h3>Decoration intent</h3><p>${map.decoration}</p></div><span class="tag">${map.enemies.length ? "One chamber · open doorways" : "One quiet chamber"}</span>`;
  document.querySelectorAll(".room-button").forEach((b, i) => {
    b.classList.toggle("active", i === index);
    b.setAttribute("aria-current", i === index ? "true" : "false");
  });
  $("#decor").setAttribute("aria-pressed", decorated);
  $("#routes").setAttribute("aria-pressed", routes);
  $("#try").setAttribute("aria-pressed", running);
  $("#try").textContent = running ? "Pause ▮▮" : "Try room ▶";
  setStatus(message);
}
function select(i) {
  index = i;
  map = makeExamples()[i];
  player = { ...map.spawn };
  path = [];
  running = false;
  message = "Inspect the room, or choose Try room and tap a clear tile.";
  sync();
  scene?.draw();
}
$(".room-list").innerHTML = examples
  .map(
    (r, i) =>
      `<button class="room-button" data-room="${i}"><span class="number">0${i + 1}</span><span>${r.name}<small>${r.theme.split(" / ")[0]}</small></span></button>`,
  )
  .join("");
document
  .querySelectorAll("[data-room]")
  .forEach((b) => (b.onclick = () => select(Number(b.dataset.room))));
$("#decor").onclick = () => {
  decorated = !decorated;
  sync();
  scene.draw();
};
$("#routes").onclick = () => {
  routes = !routes;
  sync();
  scene.draw();
};
$("#reset").onclick = () => select(index);
$("#try").onclick = () => {
  running = !running;
  message = running
    ? "Tap a clear tile to walk. Enemies can follow through every connection."
    : "Paused. Inspect the room or continue walking.";
  sync();
};
const point = (p) => ({ x: (p.x + 0.5) * 32, y: (p.y + 0.5) * 32 });
function tick(dt) {
  if (!running || document.hidden) return;
  approach(player, path, MOVEMENT.playerSpeed, dt);
  updateEnemies(map, player, dt);
  for (const e of map.enemies)
    if (enemyInContact(map, player, e)) {
      running = false;
      message =
        "Contact — this would start a battle. Reset to try a different approach.";
      sync();
    }
  for (const c of map.chests)
    if (!c.opened && Math.hypot(c.x - player.x, c.y - player.y) < 0.7) {
      c.opened = true;
      message =
        "Treasure reached. Can you return to the passage without being caught?";
      sync();
      scene.draw();
    }
  if (Math.hypot(map.exit.x - player.x, map.exit.y - player.y) < 0.2) {
    message =
      "Onward connection reached. Pursuit can continue into the next room.";
    setStatus(message);
  }
  scene.updateActors();
}
class RoomGallery extends Phaser.Scene {
  preload() {
    for (const key of ["floor", "wall", "stairs", "chest"])
      this.load.image(key, `/assets/${key}.png`);
    this.load.spritesheet("hero", "/assets/hero.png", {
      frameWidth: 16,
      frameHeight: 18,
    });
    this.load.spritesheet("torch", "/assets/torch.png", {
      frameWidth: 16,
      frameHeight: 18,
    });
    for (const key of ["map-skeleton", "map-bat"])
      this.load.spritesheet(key, `/assets/${key}.png`, {
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
      "table",
      "chair",
      "banner",
      "banner-red",
      "grave",
      "chain",
      "gold",
      "scroll",
      "painting",
      "vase-grey",
      "shield",
      "sword",
      "banner-green",
    ])
      this.load.image(key, `/assets/rooms/${key}.png`);
  }
  create() {
    scene = this;
    this.cameras.main.setBackgroundColor("#0d1117");
    this.draw();
    sync();
    this.input.on("pointerdown", (p) => {
      if (!running) return;
      const end = { x: Math.floor(p.x / 32), y: Math.floor(p.y / 32) };
      if (map.tiles[end.y]?.[end.x] !== 1) {
        setStatus("That object is solid. Choose a clear floor tile.");
        return;
      }
      const start = path[0] ?? {
        x: Math.round(player.x),
        y: Math.round(player.y),
      };
      path = pathfind(map, start, end);
      if (Math.hypot(start.x - player.x, start.y - player.y) > 0.001)
        path.unshift(start);
    });
    this.input.keyboard.on("keydown-F", () =>
      this.scale.isFullscreen
        ? this.scale.stopFullscreen()
        : this.scale.startFullscreen(),
    );
    window.__scrollReady = true;
  }
  draw() {
    this.children.removeAll(true);
    const solids = new Set(
      map.props
        .filter((p) => p.solid)
        .flatMap((p) =>
          Array.from({ length: p.width }, (_, i) => `${p.x + i},${p.y}`),
        ),
    );
    for (let y = 0; y < 17; y++)
      for (let x = 0; x < 17; x++) {
        const floor = map.tiles[y][x] === 1 || solids.has(`${x},${y}`);
        const adjacent =
          floor ||
          [
            [0, 1],
            [1, 0],
            [0, -1],
            [-1, 0],
          ].some(
            ([dx, dy]) =>
              map.tiles[y + dy]?.[x + dx] === 1 ||
              solids.has(`${x + dx},${y + dy}`),
          );
        if (!adjacent) continue;
        const image = this.add
          .image(x * 32 + 16, y * 32 + 16, floor ? "floor" : "wall")
          .setScale(2);
        image.setTint(
          floor ? ((x * 17 + y * 7) % 9 === 0 ? 0xd9d3c9 : 0xffffff) : 0x747e91,
        );
        if (!floor)
          this.add.rectangle(x * 32 + 16, y * 32 + 30, 32, 4, 0x0a0d16, 0.65);
        if (!decorated && solids.has(`${x},${y}`))
          this.add
            .rectangle(x * 32 + 16, y * 32 + 16, 28, 28, 0x363e4b)
            .setStrokeStyle(1, 0x82929b);
      }
    if (decorated) {
      const rugs = this.add.graphics().setDepth(1);
      for (const r of map.rugs) {
        const x = r.x * 32 + 4,
          y = r.y * 32 + 4,
          w = r.w * 32 - 8,
          h = r.h * 32 - 8;
        rugs.fillStyle(r.color, 0.9).fillRect(x, y, w, h);
        rugs
          .lineStyle(2, 0xc9a679, 0.7)
          .strokeRect(x + 5, y + 5, w - 10, h - 10);
        rugs
          .lineStyle(2, 0x222534, 0.5)
          .strokeRect(x + 9, y + 9, w - 18, h - 18);
      }
      for (const p of map.props) {
        const pos = point(p);
        if (p.key === "torch") {
          this.add.circle(pos.x, pos.y, 35, 0xeeb660, 0.08).setDepth(2);
          this.add.circle(pos.x, pos.y, 22, 0xeeb660, 0.08).setDepth(2);
        }
        this.add
          .image(pos.x + (p.width - 1) * 16, pos.y + 16, p.key, 0)
          .setOrigin(0.5, 1)
          .setScale(2)
          .setDepth(p.y * 2 + 2);
      }
    }
    if (routes) {
      const g = this.add.graphics().setDepth(90);
      map.routes.forEach((waypoints, i) => {
        g.lineStyle(3, i ? 0x8abfc6 : 0xe9c678, 0.8);
        let from = waypoints[0];
        for (const to of waypoints.slice(1)) {
          const points = [from, ...pathfind(map, from, to)].map(point);
          g.strokePoints(points, false);
          from = to;
        }
      });
    }
    for (const c of map.chests) {
      const p = point(c);
      this.add
        .image(p.x, p.y, "chest")
        .setScale(2)
        .setAlpha(c.opened ? 0.4 : 1)
        .setDepth(c.y * 2 + 3);
    }
    const exit = point(map.exit);
    this.add
      .rectangle(exit.x, exit.y, 26, 26, 0xe4c079, 0.12)
      .setStrokeStyle(1, 0xe4c079)
      .setDepth(95);
    this.add
      .text(exit.x, exit.y, "↑", {
        fontFamily: "monospace",
        fontSize: "24px",
        color: "#f5dba0",
      })
      .setOrigin(0.5)
      .setDepth(96)
      .setRotation(map.exit.x === 15 ? Math.PI / 2 : 0);
    this.actors = map.enemies.map((e) => ({
      e,
      image: this.add.image(0, 0, `map-${e.kind}`, 0).setScale(2).setDepth(100),
    }));
    this.hero = this.add.image(0, 0, "hero", 0).setScale(2).setDepth(101);
    this.updateActors();
  }
  updateActors() {
    if (!this.hero) return;
    const p = point(player);
    this.hero.setPosition(p.x, p.y - 2);
    for (const { e, image } of this.actors) {
      const p = point(e);
      image.setPosition(p.x, p.y).setTint(e.alert ? 0xffbd8b : 0xffffff);
    }
  }
  update(_, delta) {
    if (!manual) tick(Math.min(delta / 1000, 0.05));
  }
}
new Phaser.Game({
  type: Phaser.WEBGL,
  parent: "room-canvas",
  width: 544,
  height: 544,
  pixelArt: true,
  roundPixels: true,
  banner: false,
  audio: { noAudio: true },
  preserveDrawingBuffer: new URLSearchParams(location.search).has("capture"),
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: RoomGallery,
});
window.advanceTime = async (ms) => {
  manual = true;
  for (let t = 0; t < ms; t += 1000 / 60)
    tick(Math.min(1000 / 60, ms - t) / 1000);
  await new Promise(requestAnimationFrame);
};
window.render_game_to_text = () =>
  JSON.stringify({
    mode: "room-review",
    room: map.id,
    decorated,
    routes,
    running,
    coordinateSystem:
      "17x17 grid; x right, y down. Canvas 544 square; tile 32.",
    player,
    path,
    enemies: map.enemies,
    chests: map.chests,
    exit: map.exit,
    tiles: map.tiles,
    message,
  });
