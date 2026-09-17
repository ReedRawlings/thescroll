# Room studies and decoration

Review prototypes, 2026-09-16. Open the local demo with `?rooms=1` to review five individual furnished chambers. These are authored experiments informed by [the research brief](level-design-research.md), not yet a replacement for the tower generator.

The user clarified that the requested deliverable is rooms. Each example is one chamber, with short door sockets at the preview boundary. The earlier [complete floor experiments](floor-examples.md) are retained separately at `?floors=1`; they do not replace this room review.

## Examples

| Study | Layout purpose | Decoration language |
| --- | --- | --- |
| The bent archive | One L-shaped room with shelving in its narrow arm and a wider reading bay | Shelves, reading table and chair, plum rug, paintings, books and blue hangings |
| The stepped treasury | One stepped chamber with a broad open recess and west/east doors | Red rug and banners, urns, gold and peripheral storage crates |
| The octagonal crossing | Compact chamfered chamber with four door sockets and a central pillar | Ruined stone, corner urns, pottery and paired torches |
| The abandoned mess | Long, shallow dining hall with short detours around furniture | Tables and chairs, shields, red standards, crates and a central runner |
| The candle shrine | Narrow memorial room broadening into a rounded apse | Paired grave markers, urns, green cloth and warm torches |

The gallery offers decoration visibility, route overlays, reset, and a walking trial using the current pursuit implementation. Contact pauses the study rather than loading combat. Arrows indicate connection locations; they do not load another room. Treasure can be reached in the trial but carries no expedition reward. It does not read or change expedition saves.

## How to decorate a room

**Start with a purpose and a history.** Pick a room function, such as storage or worship, and a condition, such as maintained, abandoned or damaged. This narrows the asset palette and gives placement a reason. Avoid scattering unrelated props simply to fill space.

**Place structural objects with the layout.** Tables, bookcases, crates and large stones have explicit collision footprints. They affect movement and initial detection sightlines. Their sprites must fit those footprints: the supplied long table spans adjacent tiles. Door sockets, arrival positions, important approaches and promised bypasses must survive furnishing.

**Add clustered surface detail.** Put books near shelves, broken pottery near the wall, and gold near valuable content. Flat debris can remain walkable, but it should look different from upright solid furniture. These are authored placement relationships that a later generator can vary within valid regions.

**Use landmarks consistently.** Paired torches, a particular banner family and an ordered approach can make stairs or a special branch recognizable. They should communicate a repeatable meaning rather than promising rewards that randomly disappear. Color supplements shape and placement; it should not carry the entire cue.

**Preserve visual quiet.** Actors, rewards and doorway openings should remain the first things the player notices. Leave clear lanes, reduce ornamental contrast near threats, and check both the decorated and structural view at actual phone size. A quiet room has less local content, not immunity from incoming pursuit.

## Turning studies into reusable prefabs

Store role, door sockets, walkability, solid prop footprints, enemy/reward slots, decoration anchor groups and allowed transforms together. Example anchor groups include wall banners, shelf-adjacent clutter and an exit focal point. Roll a coherent furnishing set per room, then small variations within it.

Validate connectivity and objective access after placing solid props. Cosmetic placement must not change walkability. Check pursuit with the real movement model and compare routes in play; a line drawn over a map is only a route suggestion, not proof that it can evade an enemy. Author alternate variants only after the original situation is readable and worth revisiting.

## Assets and verification

Props are unchanged copies from the supplied `Assets/MiniRogue Dungeon Premium/1 - Decor/Decor/16x16` pack, with existing curated floor, wall, torch, character and monster images. The review code is in [examples.js](../../src/rooms/examples.js) and [gallery.js](../../src/rooms/gallery.js).

Model checks cover furnished-map connectivity, route endpoints, rewards and solid footprints. Browser checks cover every room, decoration/route toggles, walking, contact, reset, pause, mobile pointer mapping, no page overflow and unchanged local storage. Screenshots are kept locally under `artifacts/rooms`.
