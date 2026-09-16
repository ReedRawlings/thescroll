# Glossary

One definition per term. If a doc uses a term differently, the doc is wrong.

| Term | Definition |
| --- | --- |
| **ACT** | The action line at position 100 on the IP gauge. Reaching it executes the queued ability. |
| **Ability base ATK** | Damage value carried by an ability itself, **added** to the character's ATK. Per-ability; speed class sets its band relative to peers. See [combat-damage.md](design/combat-damage.md). |
| **Augment** | A modifier slotted into an ability that changes what it does — damage, speed class, targeting, or status chance. Distinct from levelling an ability. See [augments.md](design/augments.md). |
| **Charge** | The gauge phase between COM and ACT, after an ability is chosen and before it fires. Length varies by ability tier. |
| **Aggro** | An enemy noticing the player and giving chase. **Scene-scoped**, and a scene is one room, so enemies do not pursue out of their room. |
| **Chunk / prefab** | A hand-authored room or corridor piece the generator stitches into a floor. |
| **Climb** | One entry into the tower, from floor 1 until extraction or death. Cannot be saved; happens in one sitting. |
| **COM** | The command line at position 70 on the IP gauge. Reaching it prompts the player to choose an ability. |
| **Combat variant** | A tagged flavour of combat encounter (ambush, elite, horde, etc.). Not yet specified. |
| **Corridor** | A connection between rooms. Safe ground, since a chase cannot leave its room. |
| **Dive** | A planned evasive move that disables a pursuing monster. Not specified. |
| **Effective SPD** | The final speed value the gauge uses, after the core curve, gear bonus and level factor. See [combat-timing.md](design/combat-timing.md). |
| **Escape seed** | The consumable required to extract from the tower voluntarily. Occupies an inventory slot. |
| **Extraction** | Leaving the tower alive and keeping your loot. Requires an escape seed, or happens automatically on clearing floor 40. |
| **Familiar** | A party member creature. Hatched in town (permanent) or in the tower (climb-only). Keeps its level between entries. |
| **Floor** | One contained, procedurally generated set of rooms joined by corridors, with stairs up. 40 floors make a full tower. Floors grow with depth. |
| **IP gauge** | The live timeline every combatant advances along. Runs 0 to 100, with COM at 70 and ACT at 100. |
| **Level factor** | The party-only multiplier derived from the gap between character level and average enemy level. Clamped 0.70–1.30. Enemies always use 1.0. |
| **Room** | A discrete space within a floor, holding enemies and content. |
| **Scene** | A map tile, and the boundary a chase cannot cross. **One scene is one room.** |
| **Relic** | A party-wide boon found in a chest. **Climb-only** — lost on exit whether you win or die. See [relics.md](design/relics.md). |
| **Secure slot** | An inventory slot whose contents survive death. Purchased from the Leathersmith; not available by default. |
| **Session** | One sitting at the game. A ~20 minute session reaches roughly floor 7–10 of a climb. |
| **Suspend-resume** | The app restoring exactly where it was after being backgrounded or killed. Platform behaviour, not saving — dying still ends the climb. |
| **Tap-to-move** | The exploration input. Tap a destination, the character paths there. |
| **Speed class / tier** | Fast, Normal or Slow. Sets how quickly an ability moves from COM to ACT. |

## Terms deliberately not yet defined

These appear in discussion but have no spec. Do not use them as if settled.

- **Cancel** and **Counter** — the Grandia mechanic of interrupting an opponent during their charge phase. Deferred. See [combat-core.md](design/combat-core.md).
- **Fragment** — appears in the original reward-economy notes with no definition attached.
