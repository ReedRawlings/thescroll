import Phaser from 'phaser';

// All coordinates are logical pixels. Corners stay at their native resolution.
export function panel(scene, x, y, width, height, skin = 'panel_gray') {
  const colors = { panel_exterior: 0x51495f, panel_interior: 0x332d40, panel_gray: 0x51495f, panel_blue: 0x454664, panel_yellow: 0x826442 };
  const isPanel = skin.startsWith('panel_');
  const object = scene.add.nineslice(x, y, isPanel ? 'frame' : skin, undefined, width, height, 3, 3, 3, 3).setOrigin(0);
  if (isPanel) object.setTint(colors[skin]);
  return object;
}
export function label(scene, x, y, text, color = '#f5e7c6', size = 9) {
  return scene.add.text(x, y, text, { fontFamily: 'ScrollPixel', fontSize: `${size}px`, color, lineSpacing: 5 }).setOrigin(0).setResolution(1);
}
export class PixelButton extends Phaser.GameObjects.Container {
  constructor(scene, x, y, width, height, text, onClick, { disabled = false } = {}) {
    super(scene, x, y);
    scene.add.existing(this);
    const bg = panel(scene, 0, 0, width, height, 'panel_gray');
    bg.setTint(disabled ? 0x655c6d : 0xc6bdc8);
    const caption = label(scene, width / 2, height / 2 - 1, text, disabled ? '#817b81' : '#382c40').setOrigin(.5);
    this.add([bg, caption]);
    this.setSize(width, height);
    if (disabled) return;
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => bg.setTint(0xf2d896));
    bg.on('pointerout', () => { bg.setTint(0xc6bdc8); caption.y = height / 2 - 1; });
    bg.on('pointerdown', () => { bg.setTint(0xa89aaa); caption.y = height / 2; });
    bg.on('pointerup', () => { bg.setTint(0xf2d896); caption.y = height / 2 - 1; onClick(); });
  }
}
export function meter(scene, x, y, width, value, max, color = 0xdd786b) {
  const bg = scene.add.rectangle(x, y, width, 6, 0x252332).setOrigin(0);
  const fill = scene.add.rectangle(x + 1, y + 1, Math.round((width - 2) * Math.max(0, Math.min(1, value / max))), 4, color).setOrigin(0);
  return { bg, fill };
}
export function itemSlot(scene, x, y, { icon, selected, locked, secure, onClick }) {
  const bg = panel(scene, x, y, 94, 76, selected ? 'panel_yellow' : locked ? 'panel_gray' : 'panel_blue');
  if (icon) scene.add.image(x + 47, y + 32, icon).setScale(2);
  label(scene, x + 9, y + 60, locked ? 'LOCKED' : secure ? 'SECURED' : 'PACK', locked ? '#b2a8b6' : '#ece1c6');
  if (locked) label(scene, x + 40, y + 24, '+', '#b2a8b6', 18);
  bg.setInteractive({ useHandCursor: true }).on('pointerup', onClick);
  return bg;
}

// Unlabelled shared IP gauge. Color boundary remains at COM (70).
export function battleTimeline(scene, x, y, width, units) {
  const left = x + 17, length = width - 34, railY = y + 38;
  scene.add.rectangle(left, railY, length * .7, 3, 0x81b4b0).setOrigin(0);
  scene.add.rectangle(left + Math.round(length * .7), railY, Math.round(length * .3), 3, 0xe9bf7b).setOrigin(0);
  for (const position of [70, 100]) {
    scene.add.rectangle(left + Math.round(length * position / 100), railY - 4, 2, 11, 0xf5e7c6).setOrigin(0);
  }
  for (const unit of units) {
    const px = left + Math.round(length * unit.position / 100);
    const py = y + (unit.side === 'party' ? 20 : 58);
    if (unit.active) scene.add.image(px, py, 'diagonal').setDisplaySize(30, 30).setTint(0xe9bf7b);
    scene.add.image(px, py, unit.key, unit.key === 'hero' ? '__BASE' : 'portrait').setScale(unit.key === 'hero' ? 2 : 1);
    scene.add.rectangle(px - 4, py + 14, 8, 2, unit.side === 'party' ? 0x81b4b0 : 0xe18c8c).setOrigin(0);
  }
}

export function ribbon(scene, x, y, width, height, color = 0x343044) {
  return scene.add.nineslice(x, y, 'diagonal', undefined, width, height, 7, 7, 7, 7).setOrigin(0).setTint(color);
}

export class BattleButton extends Phaser.GameObjects.Container {
  constructor(scene, x, y, width, height, text, onClick, { disabled = false, plain = false } = {}) {
    super(scene, x, y);
    scene.add.existing(this);
    const bg = plain ? scene.add.rectangle(0, 0, width, height, 0x191c29, 0).setOrigin(0) : ribbon(scene, 0, 0, width, height, disabled ? 0x494253 : 0xe3bd85);
    const caption = label(scene, width / 2, height / 2, text, plain ? '#e5d9d1' : '#242333').setOrigin(.5);
    this.add([bg, caption]);
    if (disabled) { caption.setColor('#a497a5'); return; }
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerover', () => caption.setColor(plain ? '#ffdc92' : '#514054'));
    bg.on('pointerout', () => { caption.setColor(plain ? '#e5d9d1' : '#242333'); caption.y = height / 2; });
    bg.on('pointerdown', () => caption.y = height / 2 + 1);
    bg.on('pointerup', () => { caption.y = height / 2; onClick(); });
  }
}
