# Floor Generation

How a floor is assembled, and what gets placed in it.

Movement and encounters: [exploration.md](exploration.md) · Numbers: [tuning.md](../tuning.md)

> **Status:** structure decided, all weights and counts `OPEN`.

## Shape

A floor is a **contained set of rooms joined by corridors**, with stairs up. It is a self-contained space, not a route or an overworld — the tower stays a tower.

There is no branching route map above the floor level. The tower is floors 1 to 40 in order; the choices happen *inside* each floor, not between them.

## Scaling with depth

Floor size grows as the player climbs:

| Depth | Rooms | Rough traversal |
| --- | --- | --- |
| Floors 1–10 | 3–4 | ~45–60 s |
| Floors 11–25 | 5–7 | ~90 s |
| Floors 26–40 | 8–10 | ~2–3 min |

Two reasons for the ramp. Early floors stay a **fast victory lap** for an invested player, which is what makes "always start at floor 1" tolerable on the fiftieth climb. And the pacing cost lands deep, where the stakes justify the time.

## Generate from chunks, not tiles

**Recommended approach:** build a library of hand-authored room and corridor **prefabs** and have the generator stitch them together, rather than generating tile by tile.

Tile-level generation reliably produces mazes and dead space. Chunk assembly is how Spelunky and Enter the Gungeon get generated levels that feel designed, and it puts the level-design effort into pieces that can be individually tuned and rejected. A library of 20–40 chunks goes a long way.

Useful chunk archetypes: a junction, a chest alcove, a long corridor with cover, a wide open arena, a chokepoint, a dead-end reward room.

## Depth introduces mechanics, not just bigger numbers

Enemy stats already grow with depth because enemy level tracks the floor. The difficulty ramp on top of that comes from **new mechanics that invalidate what the player learned lower down**, rather than from steeper stat curves.

Confirmed additions, none yet specified:

| Mechanic | Effect |
| --- | --- |
| **Micro puzzles** | Small floor-level problems to solve to progress |
| **Traps** | Environmental damage or effects |
| **Faster enemies** | Cannot be outrun by default. Makes avoidance build-dependent rather than universal, and directly punishes heavy boots |
| **Impossible-to-pass encounters** | Cannot be avoided. Forces the fight rather than allowing a route around it |

Not every floor carries a mechanic, and they need not appear in strict depth order — variety matters more than a smooth ramp.

## Approach — to decide

**The generation approach itself is undecided.** Notes below so the groundwork is not lost.

Worth reading: Bob Nystrom's *Rooms and Mazes* (the classic room-and-corridor walkthrough), **Joris Dormans on cyclic dungeon generation** (the *Unexplored* generator — argues trees produce dead-end backtracking and cycles produce better play), Spelunky's generator (guaranteed critical path plus hand-authored templates), Brogue, and RogueBasin's algorithm catalogue. Wave Function Collapse is a poor fit — it solves tile texture, not room topology.

Two things specific to this game:

- **Room shape is encounter design, not decoration.** A chase cannot leave a room, so a cramped room makes its enemy a forced fight, a long room lets the player outpace one, and a room with cover makes a real chase. Prefabs should be named as encounter types, not scenery.
- **Connectivity decides whether avoidance is possible.** A dead-end room means fight or turn back; a pass-through room means you can run past. A floor built from dead-end spurs quietly disables the avoidance mechanic.

One architecture worth considering: **generate the room graph first (nodes, edges, roles, guaranteed path, at least one cycle), then fill each room with a prefab matching its role and exit count.** Since a scene is one room, these are cleanly separable — pacing tunes in the graph, feel tunes in the prefabs, and the graph is debuggable as text before anything renders.

## Generation constraints

The generator must guarantee:

- **Connectivity.** Every room reachable from the entrance.
- **Stairs placement.** Never in the entrance room; a minimum distance from it.
- **Room count** inside the depth band above.
- **Enemy count** on a depth curve, placed so a chase has space to play out inside a single room. See [exploration.md](exploration.md).
- **Content placement** per the table below.
- **Reject and reroll** any layout that fails validation. Cheaper and safer than trying to repair one.

Boss floors (10, 20, 30, 40) **bypass the generator** and are hand-authored.

## What gets placed

Content that was previously an abstract menu option now has a physical home, and most of it improves for it:

| Content | Placement | Decision it creates |
| --- | --- | --- |
| **Enemies** | In rooms, visible | Engage or slip past |
| **Treasure / relics** | Chests, often down a detour | Is the detour worth the rooms it costs |
| **Events** | Fixed points walked into | The same irreversible choice, now approached deliberately |
| **Items, gold** | Room floors and chests | Pick up or leave, against a small bag |
| **Escape seed** | A findable object | Go get your way out, or push on |
| **Stairs** | One per floor | When to stop exploring and climb |

The last row is the floor's core decision and it replaces the old three-option menu: **the stairs are always available, so every room you clear past them is a choice to take on risk for reward.**

## Open

- Chunk library contents and size.
- Enemy, chest and item counts per depth band.
- Relic and escape-seed spawn rates.
- Whether stairs are visible or revealed by exploring.
- Whether floors have any minimap, and how much it shows.
- Whether room layouts vary by tower depth in theme as well as count.
- How much a floor should be worth in XP and gold relative to its size.
- Whether any floor content is guaranteed within a window (e.g. one escape seed per 10 floors) to bound variance.
- Whether backtracking to a cleared room has any cost.
- Which mechanics appear at which depths, and how often a floor carries one.
- Whether "impossible to pass" means a forced fight or an undefeatable enemy to route around.
