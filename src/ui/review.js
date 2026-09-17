import Phaser from 'phaser';
import { panel, label, PixelButton, meter, itemSlot, battleTimeline, ribbon, BattleButton } from './components.js';
import './review.css';

async function boot() {
// A separate review scene: mock values never modify the playable demo's save.
document.body.innerHTML = '<main id="ui-review" aria-label="Pixel UI review: battle, inventory and rewards"></main>';
const font = new FontFace('ScrollPixel', 'url(/assets/ui/font_medium_9px.ttf)');
await font.load();
document.fonts.add(font);
const model = { page: 0, target: 0, ability: 0, selected: 0, unlocked: 6, gold: 240, claimed: false, confirmed: false, pattern: 0, battleView: new URLSearchParams(location.search).get('view') === 'selection' ? 'selection' : 'opening' };
const targets = ['Moss slime', 'Cave bat', 'Bone sentinel'];
const icons = ['egg', 'gem_red', 'crystal', 'key_bronze', 'leaf', 'coin_gold'];
const items = ['Familiar egg', 'Ember gem', 'Frost crystal', 'Bronze key', 'Healing leaf', 'Gold coin'];
const abilities = ['Quick strike', 'Heavy strike', 'Guard'];
let currentScene;
let patternElapsed = 0, manualClock = false;
class UIReview extends Phaser.Scene {
  preload() {
    for (const key of ['wave', 'psychedelic', 'abstract', 'diagonal', 'frame', 'panel_gray', 'panel_blue', 'panel_yellow', 'panel_exterior', 'panel_interior', 'button', 'button_hover', 'button_pressed', 'button_disabled', ...icons]) this.load.image(key, `/assets/ui/${key}.png`);
    for (const key of ['slime', 'bat', 'skeleton', 'familiarFire', 'familiarIce', 'chest', 'floor', 'wall']) this.load.image(key, `/assets/${key}.png`);
    this.load.image('hero', '/assets/ui/hero-witch.png');
  }
  create() {
    currentScene = this;
    for (const key of ['familiarFire', 'familiarIce', 'slime', 'bat', 'skeleton']) {
      const texture = this.textures.get(key);
      const source = texture.getSourceImage();
      texture.add('portrait', 0, Math.floor((source.width - 24) / 2), Math.floor((source.height - 24) / 2), 24, 24);
    }
    this.input.keyboard.on('keydown-ONE', () => this.navigate(0));
    this.input.keyboard.on('keydown-TWO', () => this.navigate(1));
    this.input.keyboard.on('keydown-THREE', () => this.navigate(2));
    this.input.keyboard.on('keydown-P', () => { model.pattern = (model.pattern + 1) % 3; this.draw(); });
    this.input.keyboard.on('keydown-O', () => { model.battleView = 'opening'; this.navigate(0); });
    this.input.keyboard.on('keydown-F', () => this.scale.isFullscreen ? this.scale.stopFullscreen() : this.scale.startFullscreen());
    this.draw();
  }
  advancePattern(ms) {
    if (model.page !== 0 || !this.patternBackground) return;
    patternElapsed += Math.max(0, ms);
    this.patternOffset = Math.floor(patternElapsed / 100) % this.patternPeriod;
    // Move geometry by logical pixels, independent of the texture's 2x scale.
    this.patternBackground.y = this.patternOffset - this.patternPeriod;
  }
  update(_time, delta) { if (!manualClock) this.advancePattern(delta); }
  navigate(page) { model.page = page; this.draw(); }
  button(x, y, w, h, text, action, options) { return new (model.page === 0 ? BattleButton : PixelButton)(this, x, y, w, h, text, action, options); }
  draw() {
    // Disable outgoing hit areas immediately, before Phaser drains its removal queue.
    const disable = object => { object.disableInteractive?.(); object.list?.forEach(disable); };
    this.children.list.forEach(disable);
    this.children.removeAll(true);
    this.cameras.main.setBackgroundColor('#211f2c');
    if (model.page === 0) {
      const key = ['wave', 'psychedelic', 'abstract'][model.pattern];
      this.patternPeriod = this.textures.get(key).getSourceImage().height * 2;
      this.patternBackground = this.add.tileSprite(0, -this.patternPeriod, 360, 640 + this.patternPeriod, key).setOrigin(0).setTileScale(2).setTint(0x8b718c).setAlpha(.5);
      this.advancePattern(0);
    } else {
      for (let y = 0; y < 640; y += 16) for (let x = 0; x < 360; x += 16) this.add.image(x, y, 'floor').setOrigin(0).setAlpha(.18);
      panel(this, 12, 102, 336, 486, 'panel_exterior');
    }
    if (model.page !== 0) {
    label(this, 22, 22, 'THE SCROLL', '#f5d48b', 18);
    label(this, 336, 29, '02', '#c7b9ce').setOrigin(1, 0);
    ['BATTLE', 'INVENTORY', 'REWARDS'].forEach((s, i) => {
      this.button(18 + i * 110, 59, 104, 28, s, () => this.navigate(i), { plain: true });
      if (i === model.page) this.add.rectangle(34 + i * 110, 89, 72, 2, 0xe7bd70).setOrigin(0);
    });
    }
    if (model.page === 0) this.battle();
    if (model.page === 1) this.inventory();
    if (model.page === 2) this.rewards();
  }
  battle() {
    battleTimeline(this, 28, 30, 304, this.timelineUnits());
    if (model.battleView === 'opening') { this.openingBattle(); return; }
    this.add.image(180, 310, ['slime', 'bat', 'skeleton'][model.target], '__BASE').setScale(2);
    // Keep the target cue separate from the sprite silhouette.
    label(this, 180, 235, 'v', '#f5d48b', 18).setOrigin(.5, 0);
    this.button(28, 326, 48, 56, '<', () => { model.target = (model.target + 2) % 3; model.confirmed = false; this.draw(); }, { plain: true });
    this.button(284, 326, 48, 56, '>', () => { model.target = (model.target + 1) % 3; model.confirmed = false; this.draw(); }, { plain: true });
    label(this, 180, 370, targets[model.target].toUpperCase()).setOrigin(.5, 0);
    meter(this, 126, 386, 108, model.confirmed ? [18, 10, 30][model.ability] : 30, 30);
    label(this, 180, 398, `${model.confirmed ? [18, 10, 30][model.ability] : 30}/30`, '#e5d9d1').setOrigin(.5, 0);
    this.partyStrip(425, true);
    this.button(22, 476, 44, 40, '<', () => { model.ability = (model.ability + 2) % 3; model.confirmed = false; this.draw(); }, { plain: true });
    label(this, 180, 482, abilities[model.ability].toUpperCase(), '#f5d48b', 18).setOrigin(.5, 0);
    label(this, 180, 506, ['12 DMG / 0 MP', '20 DMG / 4 MP', 'REDUCE DAMAGE'][model.ability], '#b9cbd9').setOrigin(.5, 0);
    this.button(294, 476, 44, 40, '>', () => { model.ability = (model.ability + 1) % 3; model.confirmed = false; this.draw(); }, { plain: true });
    this.button(66, 537, 228, 42, model.confirmed ? 'CONFIRMED' : 'CONFIRM', () => { model.confirmed = true; this.draw(); }, { disabled: model.confirmed });
  }
  partyStrip(y, active = false) {
    ['hero', 'familiarFire', 'familiarIce'].forEach((key, i) => {
      const x = 24 + i * 106;
      if (active && i === 0) ribbon(this, x - 4, y - 6, 100, 46, 0x484454);
      this.add.image(x + 12, y + 10, key, i === 0 ? '__BASE' : 'portrait').setScale(i === 0 ? 2 : 1);
      label(this, x + 30, y, ['HERO', 'EMBER', 'FROST'][i], active && i === 0 ? '#f5d48b' : '#e5d9d1');
      label(this, x + 30, y + 14, ['38/48', '24/24', '28/28'][i], '#b9cbd9');
      meter(this, x, y + 30, 89, i === 0 ? 38 : 48, 48, 0x8ebcb0);
    });
  }
  timelineUnits() {
    const selection = model.battleView === 'selection';
    return ['hero', 'familiarFire', 'familiarIce', 'slime', 'bat', 'skeleton'].map((key, i) => ({
      key, side: i < 3 ? 'party' : 'enemy',
      position: (selection ? [model.confirmed ? 0 : 70, 24, 48, 34, 59, 88] : [12, 35, 58, 23, 47, 77])[i],
      active: selection && !model.confirmed && i === 0,
    }));
  }
  openingBattle() {
    const formation = [
      { key: 'slime', x: 104, y: 270 },
      { key: 'skeleton', x: 260, y: 270 },
      { key: 'bat', x: 180, y: 320 },
    ];
    // Native sprite area determines back-to-front order. Overlap is intentional;
    // never normalize creature sizes to fit individual cards.
    formation.sort((a, b) => {
      const sourceA = this.textures.get(a.key).getSourceImage();
      const sourceB = this.textures.get(b.key).getSourceImage();
      return sourceA.width * sourceA.height - sourceB.width * sourceB.height;
    });
    formation.forEach(({ key, x, y }) => this.add.image(x, y, key, '__BASE').setScale(2));
    // Draw status UI after every sprite so overlap cannot obscure health.
    ['SLIME', 'BAT', 'SENTINEL'].forEach((name, i) => {
      const x = [76, 180, 285][i];
      label(this, x, 385, name).setOrigin(.5, 0);
      meter(this, x - 30, 399, 60, 30, 30);
    });
    this.partyStrip(443);
    this.button(66, 514, 228, 44, 'FIGHT >', () => { model.battleView = 'selection'; model.confirmed = false; this.draw(); });
  }
  inventory() {
    label(this, 28, 119, `02 / YOUR PACK               ${model.gold} G`, '#f5d48b');
    for (let i = 0; i < 10; i++) itemSlot(this, 28 + (i % 3) * 105, 145 + Math.floor(i / 3) * 84, {
      icon: i < 6 ? icons[i] : null, selected: model.selected === i, locked: i >= model.unlocked, secure: i === 0,
      onClick: () => { model.selected = i; this.draw(); },
    });
    label(this, 139, 410, '6 STARTER SLOTS\n4 EXPANSION SLOTS\nGOLD RIM = SELECTED', '#c3b6c7');
    const locked = model.selected >= model.unlocked;
    label(this, 28, 489, locked ? 'PACK EXPANSION / 80 G' : items[model.selected] || 'EMPTY SLOT', '#f5d48b');
    label(this, 28, 506, model.selected === 0 ? 'Secured. Kept if the expedition fails.' : locked ? 'Unlock the next slot with earned gold.' : 'Unsecured. Lost if the expedition fails.', '#c3b6c7');
    this.button(28, 529, 304, 37, locked ? 'UNLOCK NEXT SLOT / 80 G' : 'SELECT A LOCKED SLOT TO EXPAND', () => {
      if (model.gold >= 80 && model.unlocked < 10) { model.gold -= 80; model.selected = model.unlocked++; this.draw(); }
    }, { disabled: !locked || model.gold < 80 });
  }
  rewards() {
    label(this, 28, 119, '03 / SPOILS OF THE TOWER', '#f5d48b');
    this.add.image(180, 183, 'chest').setScale(4);
    label(this, 180, 230, 'FLOOR TWO CLEARED', '#f5d48b', 18).setOrigin(.5, 0);
    label(this, 180, 255, 'A little further. A little richer.', '#c3b6c7').setOrigin(.5, 0);
    [ ['egg', 'RANDOM ITEM', 'A familiar egg', 'panel_gray'], ['crystal', 'ABILITY MODIFIER', 'Frost / +2 spell power', 'panel_blue'], ['coin_gold', 'GOLD', '+120 expedition gold', 'panel_yellow'] ].forEach(([icon, title, detail, skin], i) => {
      panel(this, 28, 286 + i * 68, 304, 58, skin);
      this.add.image(58, 314 + i * 68, icon).setScale(2);
      label(this, 88, 297 + i * 68, title, '#f5d48b');
      label(this, 88, 316 + i * 68, detail);
    });
    this.button(28, 504, 304, 39, model.claimed ? 'REWARDS COLLECTED' : 'COLLECT REWARDS', () => { if (model.claimed) return; model.claimed = true; model.gold += 120; this.draw(); }, { disabled: model.claimed });
    label(this, 28, 556, model.claimed ? 'Gold added to the inventory preview.' : 'Three reward types, one reusable card.', '#c3b6c7');
  }
}
const game = new Phaser.Game({ type: Phaser.WEBGL, parent: 'ui-review', width: 360, height: 640, pixelArt: true, roundPixels: true, render: { antialias: false, preserveDrawingBuffer: true }, scene: UIReview, scale: { mode: Phaser.Scale.NONE } });
function resize() {
  const fit = Math.min(innerWidth / 360, innerHeight / 640);
  const scale = fit >= 1 ? Math.floor(fit) : fit;
  game.canvas.style.width = `${360 * scale}px`;
  game.canvas.style.height = `${640 * scale}px`;
  game.scale?.updateBounds();
  game.scale?.refresh();
}
game.events.on('ready', resize);
addEventListener('resize', resize);
window.render_game_to_text = () => JSON.stringify({ mode: 'ui-review', coordinates: '360x640; origin top-left; x right, y down', ...model, patternOffset: currentScene?.patternOffset, patternPeriod: currentScene?.patternPeriod, patternElapsed, timeline: currentScene?.timelineUnits(), targetName: targets[model.target], abilityName: abilities[model.ability], ready: !!currentScene });
window.advanceTime = (ms) => { manualClock = true; currentScene?.advancePattern(ms); };

}
boot();
