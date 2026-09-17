# Playable BSP preview

Open `/?bsp=1&seed=stone-01`. Generate repeats the entered seed, New seed chooses another, and Reset restarts the same floor with a fresh party. Play follows the hero over an 11×11 tile view; Overview shows the whole floor. Contact opens the existing timeline battle system. The stairs complete the preview expedition.

## Implementation

- `src/floors/generated.js`: a 25×29 map with four rooms produced by recursive binary partitions, connected across each split with one extra graph edge. Room centers select a southern entrance and a distant stairs room. One treasure chest and three regular enemies keep the initial encounter budget close to the main demo.
- Furniture styles include reading areas, stores, memorials and paired urns. Candidate groups are rejected if they overlap other contents, doorway approaches, the reserved room center, or disconnect the room locally. At least 72% of each room remains walkable. Placement attempts are bounded.
- `terrain` describes the architecture; `tiles` describes movement after solid furniture is placed. Furniture has explicit one- or two-tile footprints. Floor artwork is selected from all 16 cells in atlas columns 0–3 and rows 0–3, using a separate seeded random stream.
- `src/tileset/render.js`: conventional wall cap/face assembly with the user-confirmed upper side connectors. The renderer uses source crops without rotating wall faces. This is not a dual-grid renderer.
- The existing floor gallery and model supply walking, pursuit, combat, supplies, loot and completion. The main tower generator and saves are unchanged. A caller-supplied map is now an optional argument to `startFloor`.

## Boundaries

This is a first playable generator, not a difficulty-balanced campaign. Four rectangular rooms keep the geometry inspectable. An extra graph connection may share parts of an existing physical corridor. Foreground wall caps project into the row above; actors remain visible above scenery to preserve movement legibility. The view has no fog of war or line-of-sight hiding.

The seed is reproduced by this version of the generator; changing its rules can change a previously used seed. Art assignments are project-defined interpretations of the purchased sheet, not author-supplied metadata.

## Validation

`npm test` covers 200 generated seeds, complete floor and per-room reachability, nonoverlapping contents, clear doorway approaches, reproducibility, the full floor-art set, and upper connector versus interior-face selection. Browser journeys in `tests/bsp.spec.mjs` use actual pointer controls and manual combat commands across three seeds, including mobile, supplies, loot, completion, resets and rerolls. The browser tap helper scrolls the canvas into view before converting tile positions to screen coordinates.

## Wall decoration revision

Horizontal wall faces toward internal voids are omitted; exterior bottom strips retain their front faces. Exposed north walls receive lights and room-appropriate hangings, with brick finishes in storage and memorial rooms. Door approaches remain undecorated. Wall decoration is cosmetic and controlled by Detail. Crates line back walls and coffins line side walls, while blocking furniture retains connectivity checks.
