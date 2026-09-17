# Five complete floor examples

Earlier full-floor experiment, 2026-09-16. Open `/?floors=1`. The user clarified that they want individual rooms; the current room preview is at `/?rooms=1`, documented in [room-studies.md](room-studies.md).

These are **five authored playable floor plans**, not five generated variants of the old square room and not a claim that the main tower generator has been replaced. Each selection starts a fresh review party and supplies, with an entrance, stairs, connected areas, enemies, optional loot, combat and a completion state. The examples can be reviewed in any order; Next Floor starts the next independent example.

## Plans and decisions

| Floor | Structural distinction | Route / reward choice |
| --- | --- | --- |
| Drowned cloister | Stepped entrance court, courtyard ring, burial spur and southern treasury | Short guarded ascent or a longer circulation route past supplies; optional treasury detour |
| Rootbound catacombs | Uneven oval chambers along a winding route, connected by a tight western bypass | More maneuvering room through the eastern chambers versus a cramped bypass; optional dead-end tombs |
| Divided archive | Parallel aisles connected by a cross-shaped catalogue hall and offset reading wings | Switch sides to redirect pursuit; supplies in reading wings and treasure in the guarded collection |
| Fractured cistern | Staggered banks, central island and several bridges over impassable water | Cross the island or take the outer bank; optional stores before the ascent |
| Last bastion | Diamond-shaped central hall inside a stepped outer circuit, side armories and final guardian | Direct approach or outer retreat loop; gather supplies before fighting the guardian |

The full-floor plans are authored in [layouts.js](../../src/floors/layouts.js). Surface detail uses a seeded placement pass. This pass changes visual clutter only; it cannot close a passage or move an objective. There are no unexplained locks or mandatory secrets. Water is impassable; bridges are walkable. The final floor's stairs require the guardian to be defeated.

## How the supplied references affected the design

The first image combines distinct room purposes with solid internal structures, coherent prop groups and large features such as pools. The second shows connected irregular spaces, an internal void, a loop and a small reward pocket. Those are useful structural ideas, not just color palettes.

The cloister carries the court-and-loop idea into an entire floor. The catacombs and bastion change the silhouette and connection pattern. The archive and cistern use different internal structures to change approach and pursuit. The reference artwork itself was not copied into the game; runtime art comes from the supplied MiniRogue pack and existing curated monster assets.

## Online examples and actual code inspected

- [ROT.js Digger source](https://github.com/ondras/rot.js/blob/master/src/map/digger.ts): separates rooms and corridors as features, checks candidate placement before carving, and bounds placement attempts. This informed keeping geometry and validation explicit. We did not import its generator or copy its implementation.
- [ROT.js Uniform source](https://github.com/ondras/rot.js/blob/master/src/map/uniform.ts): tracks connected and unconnected rooms and constructs straight, bent or dogleg connections between valid wall locations. This is a concrete code reference for corridor routing and connectivity. Our examples instead author their connection paths to preserve the intended route choices.
- [Nystrom's Rooms and Mazes](https://journal.stuffwithstuff.com/2014/12/21/rooms-and-mazes/): explains connecting regions, allowing loops and removing useless dead ends. We retain purposeful reward spurs and reconnecting routes rather than turning every branch into a dead end.
- [Dormans' Unexplored 2 generation account](https://www.ludomotion.com/blogs/level-generation/): supports separating gameplay relationships from final geometry and decoration. Here the authored floor plan establishes routes and content before decorative placement.

This is an original implementation of the review layouts using those architectural lessons. We did not obtain the attempted Hauberk source-file URL, so no implementation claim relies on it. See [the earlier research brief](level-design-research.md) for the broader evidence and limitations.

## Decoration and geometry

Large obstructions are authored into walkability. Shelves, upright gravestones, crates and rock pillars have collision footprints; floor clutter does not. Books, shards and bones are placed near edges, with the entrance and content cells reserved. Furnishings, sightlines and routes should be assessed together.

The furnishing pass in [dressing.js](../../src/floors/dressing.js) adds recognizable activities to the approved floor shapes:

- **Cloister:** memorial groups, a coffin recess, refectory tables, votive urns, green hangings and faded green rugs.
- **Catacombs:** clustered coffins, grave markers, urns, bones and rubble following the curved chambers.
- **Archive:** reading tables and chairs, grouped shelves, paintings, scrolls and plum rugs marking reading areas and the catalogue hall.
- **Cistern:** cargo stacks and storage jars against the banks, wall chains and an island work table; bridges remain clear.
- **Bastion:** barracks tables, armory shields, supply stacks, red standards and ceremonial runners leading toward the guardian.

Supplied MiniRogue sprites provide the furnishings. Rugs, subtle floor wear, grounding shadows and warm torch glows are rendered in Phaser. Tables block both horizontal tiles; coffins block both vertical tiles. Flat clutter and rugs are walkable. The Detail control hides cosmetic dressing while preserving visible obstacle footprints. Authored furniture is deterministic; seeded clutter cannot change navigation. Connectivity checks caught and corrected isolated edge pockets, and all route anchors remain walkable.

Detail switches between decorated rendering and visible structural footprints. It never changes collision. Routes and Places are optional review overlays. Overview pauses the expedition and shows the whole floor; Play uses a following camera so tiles remain usable on a phone. The close view uses the same floor and actor state as the overview.

## Playable scope

The examples reuse the game's pathfinding, wall-aware detection, floor-wide pursuit, party model and timeline combat. Contact starts a battle, commands require an explicit ability and target, and the timeline pauses at party COM. Other map enemies freeze during battle and retain their locations afterward. Gold and supplies can be collected, supplies can be used between fights, defeat permits a reset, and reaching eligible stairs completes the floor.

Review expeditions start with a fresh base party, four healing draughts and two ether tonics. Ordinary encounters use the demo's first-floor roster and elite encounters its second-floor roster; these are comparable review situations rather than a proposed tower difficulty curve. They use the existing recovery amounts and combat formulas. No review results are written into town or expedition storage.

These authored examples do not yet provide a random floor graph library, exploration fog, production save/resume, equipment-dependent movement, traps or environmental combat effects. Decorative themes are not new biome mechanics. Full-game integration and balance should follow review of these layouts.

## Verification

Model checks flood-fill the furnished layouts, validate content positions, verify distinct route geometry, preserve topology across decoration seeds, and simulate every floor through collecting all chests, fights, resource use and stairs completion.

Browser checks complete all five floors through actual pointer and command controls, including a chest detour per floor and the final guardian. They also check COM freezing, overlay controls, mobile camera/tap mapping, floor selection, reset, completion navigation and unchanged local storage. Screenshots are under `artifacts/floors`; the required game client captures are under `artifacts/floor-client`.

Passing these checks establishes playability, not optimal pacing. Review whether each fork is legible, whether pursuing enemies change its value, whether empty travel feels excessive, and whether the areas look and feel distinct with detail switched off.
