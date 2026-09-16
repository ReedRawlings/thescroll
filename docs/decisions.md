# Decision Log

What was decided, and why. Newest first.

A decision here is **settled**. If a design doc contradicts this log, the doc is wrong. If a decision is reversed, add a new entry rather than editing the old one.

---

## 2026-09-15 — First implementation: party, targeting, command pause, references

Confirmed by the owner:

- Party is the player plus two Familiars. Capacity is recorded in `tuning.md`.
- Skip auto-targeting for now; retain manual target selection.
- Pause the timeline while the player chooses abilities. Command-selection behaviour is owned by `design/combat-core.md`.
- Use the supplied `ExampleUI/` screenshots and `Assets/` packs, including MiniRogue Dungeon Premium for dungeon construction.
- Research Dragon Quest-inspired enemy AI. The recommendation in `design/enemy-ai.md` is a proposal, not an approved final rule.


## 2026-09-15 — Familiar level cap, and what is actually fixed

**Familiars cap at level 40.** Provisional. Enemy level tracks the floor and the tower ends at 40, so a maxed Familiar is at parity with summit enemies and overpowered below — investment buys a fast early tower and a fair fight at the top, not a trivial one.

**This is explicitly not set in stone.** It is the kind of number only playtesting settles, and the same goes for most values in `tuning.md`, which now says so at the top.

### Two corrections to earlier framing

**The player is not "capped" at level 34.** The XP curve *produces* ~34 by floor 40 for a player who fights a typical amount. Encounters are avoidable in both directions, so a player who fights more arrives higher. It is a curve, not a ceiling.

**Level does not bound player power.** Base stats cap at 99 but gear stacks uncapped above it, so Blacksmith investment keeps raising ATK, DEF and SPD whatever the character's level. A level-34 player at floor 40 pays a 0.88 damage multiplier — with gear that is a tax, not a disqualification. Earlier notes treating Familiars as the party's only meaningful summit power were wrong; the player's gear is permanent progression too, and it is the whole point of the Blacksmith pillar.

---

## 2026-09-15 — Difficulty: bands, scenes and mechanics

| Decision | Rationale |
| --- | --- |
| **Enemy levels sit in a band of floor ± 2 from floor 6 onward.** Floors 1–5 stay exact. | Fights on the same floor vary in difficulty, so a floor is not a flat challenge. The exact opening keeps floors 1–5 predictable while the player is weakest and relevelling from scratch. Narrows the earlier ± 3 band. |
| **Aggro is scene-scoped, and a scene is one room.** Enemies do not pursue out of the room they occupy. | The scene boundary is what actually governs pursuit, so the rule is written in those terms — if a scene ever holds more than one room, the chase widens with it. In practice: rooms dangerous, corridors safe. |
| **Depth adds mechanics, not just bigger numbers.** Confirmed: micro puzzles, traps, faster enemies, impossible-to-pass encounters. | Enemy stats already grow because enemy level tracks the floor. The ramp on top comes from invalidating what the player learned lower down, so floor 30 feels different from floor 10 rather than merely slower. |

### On skipping

Recorded because it was raised and dismissed: **skipping encounters needs no special counter.** The level system already handles it. A level 20 party against level 40 monsters deals 0.60× damage, takes 1.40×, and has its speed factor clamped at 0.70 — roughly 30% of parity combat power. Ducking fights is a rope the player can hang themselves with, not a dominant strategy requiring a gate.

### Still open

The permanent-progression half of the difficulty question is untouched: **whether a maxed-out veteran should reach floor 40 reliably or whether the summit stays a knife-edge.** The sharpest lever on it is the Familiar level cap — since enemy level tracks the floor and the tower ends at 40, capping Familiars near 40 makes them exactly level-appropriate at the summit and overpowered below it. Note also that the level mods clamp at ±25 levels for damage and ±10 for speed, so the veteran advantage is already bounded.

---

## 2026-09-15 — Abilities carry their own base ATK

**Decision:** each ability has its own base ATK value, and the character's ATK is **added** to it. Base ATK is per-ability — speed class sets where an ability sits relative to its peers, not an absolute number, and values rise across progression as later abilities get bigger.

```
EffectiveATK = AbilityATK + CharacterATK
BaseDamage   = EffectiveATK × 100 / (100 + DEF)
```

**Why:** it reverses the earlier "abilities carry no damage coefficient" position, which had left the speed tiers with nothing to differentiate them. Under that model a Fast and a Slow ability dealt identical damage while the Slow one took 1.56× as long, so a Slow ability was strictly worse in every case and no player would ever have selected one. §4.3 stated the requirement; nothing satisfied it.

Additive rather than multiplicative keeps the numbers readable and makes tier choice vivid early, when character ATK is low.

### The authoring constraint it creates

Because character ATK is added to both sides of a tier comparison, it dilutes the gap between them. §4.3 therefore resolves to a relationship rather than a fixed pair of values:

```
SlowBase   >  1.56 × FastBase + 0.56 × CharacterATK
NormalBase >  1.33 × FastBase + 0.33 × CharacterATK
```

evaluated at the character ATK expected when those abilities are available.

The practical consequence: **the spread between tiers has to widen across progression.** Two abilities that differentiate fine on a gap of 25 early on will not at character ATK 80. This is the check to run when authoring any new ability.

### General rule reaffirmed

**§4.3 must hold at the worst-case comparison, not on average.** Overlapping ranges and converging curves both produce dead options — the earlier per-tier multiplier ranges failed the first way, additive base ATK risks the second.

---

## 2026-09-15 — Backgrounding, and equipment tradeoffs

| Decision | Rationale |
| --- | --- |
| **Backgrounding restores the climb. It is platform behaviour, not saving.** | Previously raised as an open question in error. The thing being refused is a save file the player can *reload after death*; restoring a suspended app does not do that. One live climb state, same climb, dying still ends it. |
| **Equipment can carry tradeoffs** — a bonus to a secondary stat paid for with a penalty to its own primary. | Turns each slot from a single-axis upgrade into a build decision, and gives the Blacksmith something to sell besides bigger numbers. |
| **Movement speed is a property of the boots item, not of the SPD stat.** | Keeps Frost from slowing the player on the floor and stops level-ups from changing walking speed. |

### Why boots carry the most weight

Boots govern both timeline cadence and walking speed, so a tradeoff there reaches both halves of the game:

- **Heavy boots** (+HP, −SPD) cannot outrun pursuers, so the player **fights more** — more XP, closer to the level curve, shallower per session.
- **Light boots** (+SPD, −HP) skip most of the tower — **deeper, faster, weaker**, further below the curve exactly where the deficit bites hardest.

Tank-and-grind versus sprint-and-skip. This connects equipment directly to the XP tension created by avoidable encounters rather than leaving the two systems adjacent. Both routes to the summit should stay viable.

---

## 2026-09-15 — PIVOT: explorable floors

**This is a structural pivot, not a tweak.** The tower changes from a sequence of abstract choice nodes to procedurally generated floors the player physically walks through.

The reference is Pokémon and traditional JRPGs, not Mystery Dungeon: free real-time movement on a floor, visible enemies that chase on sight, a cut to a separate battle screen on contact, and a cut back. **The combat spec is untouched by this** — the IP gauge exists only inside battle, so the two time models never run at once and never conflict.

| Decision | Rationale |
| --- | --- |
| **Floors are explorable rooms joined by corridors**, procedurally generated. | The old node system gave the tower no sense of place. Rooms give every loot and risk decision a physical home. |
| **Contained tower, not routes.** No branching map above floor level; choices happen *inside* a floor. | Keeps the tower a tower. Floors 1–40 in order, as before. |
| **Floor size scales with depth** — 3–4 rooms early, 8–10 near the summit. | Keeps early floors a fast victory lap, which is what makes "always start at floor 1" bearable on the fiftieth climb, and puts the pacing cost where the stakes justify it. |
| **Visible, avoidable enemies.** No random encounters. | When death costs the climb, an unavoidable ambush reads as the game taking something from you. *(Aggro scope revised 2026-09-15 — see below.)* |
| **Tap-to-move**, not a virtual d-pad. | Preserves the one-thumb pillar. Same "tap to commit" grammar as the rest of the game. |
| **Boots govern map movement speed as well as SPD.** | Unifies the stat, makes planned running boots a natural upgrade rather than a bolt-on, and gives the Blacksmith a product felt outside battle. |
| **No saving inside the tower.** A climb is one sitting. | Owner's call. Preserves permadeath, secure slots and the weight of the extraction decision. |
| **Generate from hand-authored chunks, not tiles.** | Tile-level generation reliably produces mazes and dead space. Chunk assembly is how Spelunky and Enter the Gungeon get levels that feel designed. |
| **Placeholder/freemium art for the prototype.** | A tile overworld is a second art pipeline and the longest pole. It should not gate the code. |

### Consequences accepted

- **A full clear is now ~1h45m, not ~20–25 minutes.** The old pillar "difficulty is the only limiter, a full clear fits a session" is replaced by "a climb is an unbroken commitment." A ~20 minute session now reaches floor 7–10.
- **The pitch line changed.** `vision.md` previously sold the game as *"decisions rather than map navigation"* and *"instead of navigating a dungeon map."* Both were rewritten; there is a map now. The one-thumb promise survives via tap-to-move.
- **The player now controls their own XP curve.** Skippable encounters make the curve in `party.md` an expectation, not a guarantee. Ducking fights becomes a real strategy — deeper, faster, weaker — which compounds against the deliberate player-level lag. Kept as a tension rather than balanced away.
- `node-system.md` was deleted. Its content thinking survives in `floor-generation.md`; only the delivery mechanism changed.
- The Oracle's information branch gets a better surface than it had: revealing a *map* is more legible and more valuable than rerolling an abstract choice.

### Raised and unresolved

**A climb cannot be saved, and a deep one is long, so an OS event can destroy it through no decision the player made** — a call, a battery kill, or the OS reclaiming a backgrounded app at floor 32. A *save file* (reload after death) is refused and should stay refused. A *suspend-resume* — one slot, erased on resume, no reload after death — preserves permadeath completely and is closer to "the app did not quit" than to saving. Tracked in `open-questions.md`.

### Planned, not specified

**Running boots** (movement speed, fits the Boots slot) and **dive** (an evasive move that disables a pursuing monster). Both confirmed as wanted, both later.

---

## 2026-09-11 — Documentation restructure

Split four overlapping files into a single-source-of-truth tree.

**Why:** `OpenQuestions andCalculations.md` contained verbatim copies of both `ScrollOverview.md` and `stats.md`, plus a finished technical spec, plus genuinely open questions — four document types with different lifecycles in one file. Nothing had drifted yet, but any edit would have silently forked.

**Rules adopted:**
1. A fact lives in exactly one file; everything else links to it.
2. Every number lives in `tuning.md`. Design docs describe rules and link for values.
3. Nothing is both spec and open question. Decided material is spec; undecided material is a stated question.

Original files left in place untouched pending review.

---

## 2026-09-11 — Structure

| Decision | Rationale |
| --- | --- |
| **Azure Dreams model, not run-based.** ~20 min is a *session* target, not a climb target. | The original note "average run length: 20 minutes" read as a climb target, which forced ~30 s per floor and made fights near-trivial. As a session target the constraint dissolves. |
| **Always start at floor 1.** No checkpoints or shortcuts. | Pure Azure Dreams. Repetition is addressed by making early floors *fast* for invested players, not by skipping them. |
| **Player relevels from 1 each entry; Familiars keep levels.** | The defining Azure Dreams structure. Creates the early/late handoff and makes the Hatchery the late-game pillar. |
| **One floor = one encounter node.** 40 floors. | There is no map, so a floor has no interior. Matches the numbers already in the notes. |
| **Floor 40 is a final boss; clearing it auto-extracts with all loot.** | Gives the tower a summit and a win condition beyond "escape alive." |
| **Post-combat choice presents 3 options**, rolled from pools of combat variants, events and treasure. | Two options would mostly be combat-vs-combat given low event and treasure rates, flattening the decision. |
| **The 8-events / 32-combats split is an expected average, not authored structure.** | Node composition is generative. Any system assuming a guaranteed event count is built on a wrong premise. |
| **Difficulty is the only limiter on depth.** A full clear is ~20–25 min at intended pacing. | The tower is clearable in a session; the player still will not clear it for a long time. No time pressure anywhere. |

---

## 2026-09-11 — Combat

| Decision | Rationale |
| --- | --- |
| **ATK replaces STR everywhere.** | STR was never a stat in the game; it appeared only in the damage formula. |
| `Damage = (ATK × 100 / (100 + DEF)) × LevelMod × TypeMod` | The type multiplier had no defined position in the formula. Now ordered explicitly. |
| ~~**Abilities carry no damage coefficient.** Damage comes from ATK.~~ **Reversed 2026-09-15** — see the base-ATK entry above. | Owner's call at the time. It left the speed tiers with nothing to differentiate them. |
| **Normal type sits outside the advantage triangle**, neutral both directions, rare. | Fire → Ice → Lightning → Fire is a clean 3-cycle with no room for a fourth. Normal is the absence of interaction, not a weakness. |
| **~3 rounds per non-boss fight; trash dies in 1–3 hits.** | Keeps the one-thumb promise (~9 decisions per fight) and pins the enemy HP curve to the damage formula. |
| **Status durations count the afflicted unit's own completed turns.** | With a live timeline and per-character speed, only that unit's own cadence is meaningful to it. Rounds and ticks are not well-defined here. |
| **Mid-battle speed changes recompute rate, keep gauge position.** | Frost makes mid-battle recomputes routine, which the timing spec's "compute once" assumed away. Moving the icon would read as teleporting. |
| **Stun freezes the icon for fixed real seconds by tier** (1.0 / 1.5 / 2.0). | Fixed seconds punish fast characters proportionally more, making stun a real answer to a speed advantage. |
| **Speed spec is final as written.** Orphan header line removed. | It opened by claiming to replace sections of an "IP Gauge Turn System design" that does not exist in the project. |
| **Cancel and counter deferred**, with a stub in `combat-core.md`. | Arguably Grandia's defining mechanic. Nothing should be designed as if it exists until specified. |
| **Familiar at 0 HP is out for the rest of the climb**, revivable. | Gives revive items weight and creates real pressure to extract rather than push one more floor. |

---

## 2026-09-11 — Progression

| Decision | Rationale |
| --- | --- |
| **Enemy level: floors 1–5 exactly = floor; floors 6+ = floor ± 3.** | Replaces an earlier flat `enemy level = floor` assumption. The tight early band keeps the opening predictable while the player is relevelling from scratch. |
| **Player tracks floor 1:1 through floor 5, then lags to ~34 by floor 40** (a −6 gap). | The lag is the mechanism of the handoff — Familiars compensate for a weakening player character. |
| **Target a −6 gap, not −10.** | The speed `level_factor` clamps at a 10-level gap. Landing on the clamp at the summit would make further tuning inert and leave no headroom for post-game depth. **General principle: keep level gaps inside the clamps.** |
| **99 caps base stats only; gear and buffs stack above it on every stat.** | Applies the rule the timing spec already states for SPD universally. A hard 99 ceiling would make Blacksmith progression worthless at cap. |
| **No natural MP regen in the tower.** Items and events only; full refill in town. | Makes MP a climb-level resource rather than a per-fight one. |

---

## 2026-09-11 — Items, relics and town

| Decision | Rationale |
| --- | --- |
| **Secure slots are a Leathersmith purchase, not a base feature.** | Resolves an apparent contradiction in the original notes — the "all items can be lost" line described the starting state, before any Leathersmith upgrade. |
| **Relics are climb-only, lost on exit win or lose.** | Lets relics be tuned strong since nothing compounds, gives each climb its own character, and keeps them from becoming a fifth permanent track competing with the four town pillars. |
| **Relics do not occupy inventory slots** and cannot be secured. | They are party-wide boons, not carried objects. |
| **The egg decision is intentional tension**, not an inconsistency: hatch in the tower for a body now, or carry the egg out for a permanent Familiar. | Reframes what looked like a contradiction as a real trade-off. |
| **Four town pillars with strictly separated purposes**: Leathersmith carrying, Oracle abilities and information, Hatchery Familiars, Blacksmith equipment. | The town must not become a dense RPG menu. The player should learn it as four words. |
| **The town is the entire permanent progression surface**, because player level resets. | Makes the four pillars' upgrade curves the real difficulty curve. |

---

## Superseded

**Per-tier ability damage multipliers** (Fast [0.5–0.8], Normal [0.9–1.2], Slow [1.3–1.6]) — proposed in the original working notes, set aside, and now replaced by additive base ATK. They violated §4.3 where the ranges overlapped. Kept on record so they are not reintroduced unexamined; the failure mode is documented in [abilities.md](design/abilities.md).

**"Abilities carry no damage coefficient"** (2026-09-11) — reversed on 2026-09-15. It left the speed tiers with nothing to differentiate them.
