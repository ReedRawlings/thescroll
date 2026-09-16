# The Scroll — Phaser demo

A three-floor, portrait browser demo built with Phaser 3. It uses the supplied MiniRogue dungeon art and RpgMix monsters, with seeded room generation and a Grandia-inspired combat timeline.

## Run

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. The demo is designed for a phone-sized portrait viewport and also works with a mouse on desktop.

```sh
npm test       # deterministic combat and dungeon model checks
npm run build # production bundle in dist/
npm run preview
```

The in-game **Field guide** opens `public/demo-guide.html`, a standalone HTML document explaining the controls, implementation defaults, source rules, assets, and limits of this demo.

## Play

- Tap a clear dungeon tile to walk; tap your character to stop.
- Touch an enemy to enter combat. Corridors are safe from pursuit.
- When any ally reaches COM, the entire simulation pauses. Cycle abilities and targets, then confirm.
- Fast, Normal and Slow abilities use the timing spec's charge rates. Damage previews use the specified additive ability ATK formula.
- Use recovery items between fights. HP and MP carry across encounters.
- Use an escape seed to extract, or defeat the third-floor Warden to complete the demo.
- **F** toggles fullscreen; **Esc** pauses/resumes. In combat, arrows cycle abilities/targets and Enter or Space confirms.

Your expedition and banked progress are stored in this browser's local storage. Backgrounding pauses the game; reloading offers Resume expedition. Browser data clearing also clears this local progress.

## Project layout

- `src/main.js` — Phaser scene, exploration controller, UI, and persistence
- `src/combat.js` — pure deterministic combat simulation
- `src/dungeon.js` — seeded generation and pathfinding
- `src/assets.js`, `public/assets/` — curated assets from the supplied packs
- `public/demo-guide.html` — demo documentation and implementation decisions
- `docs/` — original design documentation
- `tests/` — model tests and browser scenario scripts
- `artifacts/` — local QA screenshots and scenario reports

The demo intentionally stops at three floors. Full town shops, 40-floor balancing, ability progression, augments management, relics, and a complete bestiary remain outside this slice. See the field guide for the exact scope.

## Browser verification

With the local server running:

```sh
node tests/integration.spec.mjs
node tests/persistence.spec.mjs
node tests/controls.spec.mjs
node tests/screens.mjs
```

These use Playwright's installed Chromium. If it is not installed on your machine, run `npx playwright install chromium` once.

The game exposes `render_game_to_text()` for readable state and `advanceTime(ms)` for deterministic QA stepping. Calling the latter switches that page session to manual simulation time; reload to return to ordinary real-time play.
