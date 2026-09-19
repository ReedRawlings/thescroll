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

## Reviewed asset rules

The user's six-column CSV is preserved verbatim at `docs/design/asset-placement.csv`. `src/floors/asset-rules.js` records its filenames, categories, placement text, blocking behavior, pairings and notes alongside measured sprite dimensions. Future CSV changes need an explicit rule/catalog update; prose is not interpreted dynamically.

Generated floors use the original individual PNGs from the reviewed folder. No rotations or flips are applied. Collision footprints distinguish tall artwork from ground depth (for example shelves, lamps and thrones have one-row bases). Each floor now includes a reading room, supply storage, a burial room and an audience chamber in a shuffled assignment. Furniture groups provide shelves, tables with correctly oriented chairs, display boards, paired memorial objects, and a throne approach. Small tabletop items retain a reference to their supporting object; floor debris retains a nearby related object. Paintings are limited to one per room and banners share a room color.

Chests follow the reviewed solid-object rule. Tapping a chest routes to a reachable adjacent tile. Adjacent approach opens it once, awards its contents, and advances the supplied six-frame opening strip. The chest remains solid after opening. Paths and treasure-route overlays target its walkable approach rather than its blocked cell.

Standing lamps have solid bases. Acid puddles, buttons, keys and closed doors remain out of the current generator because their prerequisite terrain or interaction mechanics are absent. Tabletop bottles, books and scrolls are decorative; no new pickup or hazard mechanics are inferred from uncertain CSV notes.

### Coherent flooring and furnishing density
Each room now chooses a quiet dominant floor, two small contiguous wear patches, and one corner motif. A shared paving material connects all door cells through the room center using walkable paths after furniture placement. Corridors use consistent paving. All sixteen source floor options remain available across seeds, with at most four materials in an individual room.

Furniture recipes have independent retry budgets, so an unavailable throne or shelf arrangement no longer prevents other furnishings. Additional themed groups target roughly 18% of room area, preferring edges with interior fallbacks; connectivity checks and the 72% minimum open-area constraint still apply. The density target is best effort, with doorway clearances taking precedence.

### Optional subdivision
After the first two BSP levels, eligible larger partitions have a 65% chance of one further split, capped at two extra splits per floor. A partition must span at least 14 cells on the split axis; its children retain at least 5×5 interior space. Floors therefore contain four to six rooms in the same footprint. Themes cycle for extra rooms; enemy count remains three. Treasure is placed before furnishings in the largest eligible room, preserving its approach. Smaller rooms use reduced floor weathering.

### Main-game generation testing
Open `/?generated=1`, or choose Try a generated run from the main town screen. Enter a seed or leave it blank for a random floor. The main game now renders the reviewed BSP terrain, wall finishes, decor, and solid furniture, using its normal party, pursuit, combat, inventory, chest rewards, extraction and completion systems. Stairs complete this one-floor test expedition. Pause → Restart this seed starts a fresh party on the same layout.

Generated testing uses separate `scroll-generated-save-v1` and `scroll-generated-meta-v1` storage keys. Normal expedition saves and progression are unaffected. Generated encounters retain the existing floor-one battle composition; trap/lock mechanics and authored-room insertion are not included yet. Tests exercise full four- and six-room expeditions, mobile, restart/resume, treasure and stairs; the standard three-floor integration also passes.

### Irregular geometry and route variety
Rooms now receive clipped corners, asymmetric recesses or an L-shaped cutout after corridor carving. Corridor cells and the room center are protected; disconnected cuts revert safely. Furnishing density uses actual floor area. Rooms alternate direct entrance paving, offset paths and unmarked flooring. Every non-start room receives an encounter, with an additional encounter in rooms of at least 80 floor cells. Seed 14001 has six irregular rooms and five encounters.

### Default expedition
The standard three-floor expedition now uses BSP layouts and reviewed artwork. Floor one uses the run seed directly; floors two and three derive distinct floor seeds. The final stair-room encounter becomes the Warden. Existing saves keep their stored current-floor map; subsequent floors use BSP generation. The separate one-floor testing route remains available.
