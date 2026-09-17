# Roguelike level design — research and recommendations

Reviewed 2026-09-16. **Research proposal, not settled game rules or an implementation change.** Three independent research tasks covered generation, exploration choices, and encounter pacing. This brief consolidates their findings after source review and comparison with the current code.

**Recommendation:** generate a deliberate floor plan, fill it with authored room patterns, and distribute encounters and rewards according to the choices that plan should create. Start with a compact library of distinct plans and evaluate them in play before expanding the tower.

**Owner correction incorporated:** corridors are ordinary traversable connections, and pursuit crosses rooms and corridors. The earlier safe-corridor assumption has been removed from this brief.

Owning specs: [floor generation](floor-generation.md), [exploration](exploration.md), [run structure](run-structure.md). Accepted numeric tuning belongs in [tuning.md](../tuning.md); measurements below describe the current implementation, not new targets.

## What the current demo establishes

Inspection of [dungeon.js](../../src/dungeon.js) confirms seeded rectangular rooms, a fixed cycle of connections, fixed room roles, varying corridor bends, and occasional pillars. This provides reproducibility and readable boundaries. It does not yet provide a library of authored encounter patterns or varied floor topology.

A static sample of floor 1 with numeric seeds 0–99 produced:

| Measurement | Result |
| --- | --- |
| Distinct room connection graphs | 1 |
| Shortest entrance-to-stairs distance | 23–31 tiles; median 27 |
| Extra distance to visit the chest before stairs | 0–12 tiles; median 4 |

Distances use the existing four-direction `pathfind`, comparing the direct route with entrance → chest → stairs. They ignore moving enemies, combat, and deliberation. They establish geometric repetition and detour length, **not** encounter avoidability or floor completion time.

Existing [dungeon tests](../../tests/dungeon.test.js) check connectivity, placements, reproducibility, geometry variation, and reachable room interiors. The new [exploration checks](../../tests/exploration.test.js) cover pursuit across corridors, visibility, disengagement and contact. They do not establish that a human can avoid an encounter, recognize a worthwhile branch, or enjoy the floor.

## Evidence reviewed

These are firsthand developer accounts or source code. They support useful techniques; they do not prove which floor will be best for The Scroll.

| Source | Supported finding | Application and limit |
| --- | --- | --- |
| [Rogue, preserved `rooms.c`](https://github.com/Davidslv/rogue/blob/master/rooms.c), attributed to Toy, Arnold and Wichman | Uses spatial sectors with varied room placement and dimensions, including omitted rooms. | A constrained scaffold can still vary. This repository is evidence for that implementation, not every historical release. Copying its sector count would not establish suitable phone-scale rooms. |
| [Bob Nystrom: Rooms and Mazes](https://journal.stuffwithstuff.com/2014/12/21/rooms-and-mazes/) | Connects rooms and maze regions, permits extra connectors, and removes dead-end passages. Notes excessively winding corridors as a limitation. | Borrow connectivity checks and selective loops. Pursuit and retreat through passages now apply; combat positioning still occurs on a separate screen. |
| [Joris Dormans: Level Generation in Unexplored 2](https://www.ludomotion.com/blogs/level-generation/) | Refines coarse geometry, reasons about gameplay using graphs, then generates detailed geometry and features. | Separate gameplay structure from tiles. This article is about the multistage process; it is not a full specification of the original cyclic generator. |
| [Sébastien Benard: Dead Cells' hybrid level design](https://www.gamedeveloper.com/design/building-the-level-design-of-a-procedurally-generated-metroidvania-a-hybrid-approach-) | Combines authored rooms, per-biome graphs, compatibility rules and weighted monster placement. Describes peaks and breaks in pacing. | Use room roles and encounter budgets. Its platform dimensions and monster-per-tile calculation do not transfer to separate JRPG battles. |
| [Josh Ge/Kyzrati: Map Prefabs, in Depth](https://www.gridsagegames.com/blog/2017/01/map-prefabs-in-depth/) | Shows authored content integrated into procedural maps with placement constraints. | Author small situations with legal exits and content locations, then vary their arrangement. This still requires content work and testing. |
| [Cogmind: Map Composition](https://www.gridsagegames.com/blog/2015/05/map-composition/) | Separates atmospheric encounters, free rewards, risk/reward and danger. | Quiet discoveries and free rewards can provide pacing. Every room need not be a battle or a costly decision. |
| [Cogmind: Level Design and Shaping an Experience](https://www.gridsagegames.com/blog/2019/02/level-design-shaping-cogmind-experience/) | Designs optional content around consequences for the run and signals an optional destination so players need not search fruitlessly. | Make opportunity and danger legible; judge rewards against current resources. Its extensive branch consequences exceed our immediate scope. |
| [Cogmind: Dungeon Metrics](https://www.gridsagegames.com/blog/2014/07/dungeon-metrics/) and [Procedural Layouts](https://www.gridsagegames.com/blog/2019/03/roguelike-level-design-addendum-procedural-layouts/) | Describe map validation, diagnostic views, reproducible seeds, and evaluation from the player's perspective. | Inspect distributions and actual traversal. The author's later comment clarifies that seclusion was not directly used for item distribution; do not present that proposed technique as a proven reward rule. |
| [Derek Yu: EXPLORER.GMK](https://www.gamedeveloper.com/design/explorer-gmk-an-excerpt-from-the-spelunky-book) | Explains how destructible terrain supports Spelunky's otherwise inaccessible spaces. | Generation must fit traversal abilities. The Scroll cannot inherit sealed-off rewards without also implementing a way to reach them. |
| [Dungeon Crawl Stone Soup developer manual, Philosophy](https://raw.githubusercontent.com/crawl/crawl/master/crawl-ref/docs/crawl_manual.rst) | Emphasizes meaningful decisions and avoiding repetitive low-risk behavior; authored vaults support choices between safety and greed. | Review whether optional exploration creates decisions or routine cleanup. This is a design philosophy, not a quantitative balance prescription. |

Evidence is strongest on practical generation architecture and developer experience. No comparative study here establishes ideal encounter counts, room dimensions, or pacing for our paused timeline combat. Brogue-specific claims were excluded because the attempted primary interview could not be retrieved reliably.

## Review: what transfers to this game

### Route choice must change something the party cares about

Rooms and corridors now form a continuous pursuit space. A loop can offer an escape route, a junction can create a route choice under pressure, and a narrow corridor can make a pursuing enemy harder to pass. Travel still consumes no resource automatically: an empty, unthreatened detour mainly costs the player's time. An unguarded chest detour is often an obvious pickup, subject to carrying capacity; it can be a pleasant reward without being a difficult decision.

The proposed meaningful fork compares different **encounter exposure, expected resource spending, reward usefulness, or information**. A wounded party might prefer easier opposition and supplies; a healthy party might seek stronger opponents for growth and treasure. These are hypotheses to test, not guaranteed player responses.

Avoid calling a branch safe merely because BFS finds a path around an enemy. Actual aggro, movement speeds, doorway geometry and tapping accuracy determine whether bypassing it is practical.

### Design exploration rooms for approach and escape

Combat happens on a separate screen. An exploration pillar can alter chase routing; it currently provides no combat cover or area-attack positioning. Room patterns should therefore describe entry visibility, paths past enemies, access to loot, and routes that create distance from pursuers. Reaching a corridor is not itself an escape.

Proposed starter patterns: a clear arrival chamber, a pass-through room with a visible bypass, a divided room with alternate exits, an optional guarded alcove, a quiet landmark, and a recognizable stair chamber. Each needs compatible doorway locations, walkable paths, enemy/reward slots and permitted rotations. Test floor-wide pathfinding after placing every pattern. If shapes become irregular, update the current rectangular `roomAt` representation for accurate room labels and rendering; it no longer constrains pursuit.

### Control the rhythm of encounters

Assign a floor's ordinary and optional encounters before scattering enemies. Budget whole battles using expected party resource cost and enemy combinations; do not derive battle count directly from floor area. Start with seeded placement so difficult outcomes can be reproduced and tuned.

Quiet spaces should provide an observable purpose: recognize a landmark, inspect a reward, choose a direction, or prepare supplies. A long empty hallway is not automatically good recovery. Likewise, time spent choosing commands in a paused battle is still combat deliberation.

### Give families recognizable behavior

Use a floor family's graph, room proportions, encounter mix and reward arrangement to establish its identity, with the supplied dungeon art supporting it. Cosmetic recoloring alone will not solve repeated decisions. Preserve early-floor brevity; adding rooms is useful only when they support additional choices worth the traversal.

## Proposed first floor plans

These are original adaptations for The Scroll, not layouts copied from the sources. They should fit the current depth-band limits; the point is to vary relationships before increasing map size.

| Plan | Intended decision | What could make it fail |
| --- | --- | --- |
| Split and rejoin | Choose a tougher encounter with valuable treasure or easier opposition with a useful supply, then converge near the stairs. | One branch offers both better rewards and lower cost, or the difference cannot be seen before committing. |
| Main path with an optional alcove | Climb with remaining resources or take a clearly signaled guardian/reward detour. | The reward is always compulsory for progression, or the detour is tedious retracing. |
| Loop with an onward choice | Reach the stairs with an unexplored reward route still available; decide whether to continue exploring, with a short return connection. | The route adds no new opportunity, or requires clearing everything before climbing. |

Not every graph needs a cycle. A short, purposeful dead end is acceptable. A promised loop must offer a useful alternative or return path; extra connections alone are not the design goal.

## Priorities and acceptance evidence

**First: make an inspectable floor-plan layer.** Represent room roles, connections and compatible room patterns separately from tiles. Keep the generator deterministic. Produce a debug view showing the chosen plan, roles, doorways, encounters, rewards and seed. A small curated plan library is sufficient; a general grammar engine would add complexity before we know what plays well.

**Next: validate the resulting floor.** Hard failures should include unreachable content, accidental blocked doors, overlapping objects, missing promised connections, and immediate unavoidable arrival contact. Validate after furnishing. Use bounded generation attempts and a known-valid fallback, rather than an unlimited reroll loop. Numeric limits and budgets should be recorded in the tuning owner when chosen.

**Then: compare play, including awkward seeds.** Collect the following without treating them as a single score to maximize:

| Measure | What it helps diagnose |
| --- | --- |
| Route structure and role repetition across seeds | Cosmetic variation hiding the same decisions |
| Walking, combat and command-selection time separately | Whether slow floors come from navigation, battle length or deliberation |
| Entrance-to-stairs travel and extra reward travel | Excessive detours or stairs that bypass almost the whole floor |
| Long stretches without a discovery or choice | Empty travel that may need shortening |
| Branch choice alongside HP, MP and supplies | Whether different party states make different routes attractive |
| Accidental contacts and attempted escapes | Whether promised avoidance works with actual movement and touch controls |
| Resources at stairs, extraction and death locations | Whether optional content and attrition support the climb |

Review the same recorded seeds with both a fresh and an invested party, including direct-to-stairs and exploration-oriented play. Inspect the phone view as well as map overviews. Ask players to explain their route choice and identify confusion or boredom. Automated completion establishes correctness; it does not establish engaging decisions.

Choose thresholds after observing this baseline and the proposed plans. Retain outliers for review rather than silently filtering away all unusual floors. Expand room and floor libraries only once the plans produce understandable choices in play.

## Suggestions deferred or rejected in this review

- **Copying a complete maze algorithm:** connectivity techniques transfer, but long mazes can still add tedious navigation. Judge them by pursuit, sightlines and useful decisions, not visual complexity alone.
- **Making every chest expensive:** free rewards and quiet discoveries have a pacing role. Reserve explicit risk/reward framing for cases with a real cost.
- **A dynamic difficulty director now:** static seeded budgets are easier to assess and preserve the consequences of spending resources.
- **Secret-dependent progression, lock/key chains and one-way traps now:** they need new interaction rules and state-aware solvability checks. Keep essential stairs reachable under the existing rules.
- **Platformer traversal or destructible walls by implication:** neither follows from citing Spelunky, Dead Cells or Cogmind. Those would be separate feature decisions. Floor-wide pursuit is now explicitly requested by the owner.
- **Room count as the main quality target:** more rooms can simply multiply the same decisions and extend the climb.

The existing floor document calls chunk assembly recommended and later says the approach is undecided, while the decision log already selects authored chunks. Treat that decision as authoritative; the precise graph/assembly algorithm remains to be designed. Its blanket claim that tile-level generation reliably creates dead space is too broad: Nystrom demonstrates explicit controls for that problem. The recommendation here rests on fit with our game and authoring needs, not on other techniques being inherently bad.
