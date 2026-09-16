# Party: Player, Familiars and Levelling

Numbers: [tuning.md](../tuning.md)

## Party composition

The party consists of the player and two Familiar slots. Capacity is fixed for the first implementation; see [tuning.md](../tuning.md).

## Stats

| Stat | Meaning |
| --- | --- |
| **HP** | Total health |
| **MP** | Resource spent on abilities |
| **ATK** | Determines damage output for attacks and abilities |
| **DEF** | Determines damage reduction against attacks and abilities |
| **SPD** | Determines position on the live IP timeline |

**Base stats cap at 99.** Gear and buff bonuses stack **above** that cap, on every stat — the rule [combat-timing.md](combat-timing.md) §3.1 states for SPD applies universally. This is what keeps Blacksmith progression meaningful for a maxed character.

| | Player | Familiar |
| --- | --- | --- |
| HP, MP, ATK, DEF, SPD | Yes | Yes |
| Type | No | Yes |
| Species | No | Yes |
| Class | No | Yes |
| Innate abilities | No | Yes |
| Equipment | Yes | No |

MP does not regenerate naturally inside the tower. It is restored by items and events only, and refills fully on returning to town.

## The level handoff

**The player character relevels from 1 on every tower entry. Familiars keep their levels permanently.**

This is the defining structural choice of the game, inherited from Azure Dreams, and it produces a deliberate handoff:

- **Floors 1–5** — the player tracks floor level exactly. The player character carries the party.
- **Floors 6–40** — the player falls progressively behind floor level. Familiars, already levelled from previous climbs, stay level-appropriate and take over.

By the summit the Familiars are doing most of the work. This makes the **Hatchery the late-game progression pillar** by design rather than by accident, and it gives permanent investment a visible, mechanical payoff.

### Enemy levels

Enemy levels work in a **band around the active floor**, not a fixed match:

| Floors | Enemy level |
| --- | --- |
| 1–5 | Exactly the floor number, no variance |
| 6–40 | Floor number **± 2**, minimum 1 |
| Boss floors | `OPEN` |

From floor 6 the band means individual fights on the same floor vary in difficulty — some enemies a level or two above, some below. Encounters are not uniformly scaled, and the player cannot assume a floor is a flat challenge.

Floors 1–5 stay exact, with no variance, so the opening is predictable while the player is weakest and relevelling from scratch.

### The player curve

> **This is a curve, not a cap.** It describes where a player who fights most of what they meet ends up. Nothing stops a player who fights more from arriving higher, and nothing about level bounds their power — base stats cap at 99 but **gear stacks uncapped on top**, so Blacksmith investment keeps raising ATK, DEF and SPD regardless of level. A level-34 player at floor 40 pays a 0.88 damage multiplier; with enough gear that is a tax, not a disqualification. Encounters are visible and avoidable (see [exploration.md](exploration.md)), so the player controls their own level curve. Ducking fights is a real strategy — arrive deeper, faster and weaker — and it compounds against the deliberate lag below. The XP table must tolerate a player who skipped a third of the fights.

Player level tracks 1:1 through floor 5, then gains roughly **0.83 levels per floor**:

| Floor | Player level | Gap | Speed factor | Damage mod |
| --- | --- | --- | --- | --- |
| 5 | 5 | 0 | 1.00 | 1.00 |
| 10 | 9 | −1 | 0.97 | 0.98 |
| 20 | 17 | −3 | 0.91 | 0.94 |
| 30 | 26 | −4 | 0.88 | 0.92 |
| 40 | 34 | −6 | 0.82 | 0.88 |

### Why −6 and not −10

The speed `level_factor` clamps at 0.70, which it reaches at a 10-level gap. **A gap of −10 at floor 40 would put the player exactly on the clamp at the summit, where further tuning would do nothing** — and would leave no headroom for any post-game depth.

Landing at −6 keeps the level math live all the way up. Keeping level gaps inside the clamps is a general tuning principle, not a one-off.

## Familiars

### Obtaining

Familiars come from **eggs** found in the tower — dropped by enemies, granted by events, or produced by a berry that makes a monster drop an egg when the battle ends in victory.

### Hatching: the egg decision

An egg can be hatched two ways, and this is an intentional tension:

| | Hatch in the tower | Carry the egg out to the Hatchery |
| --- | --- | --- |
| Available | Immediately, this climb | Next climb onward |
| Lifespan | **Lost when the climb ends** | **Permanent** |
| Trade-off | A body now, when you need it | Long-term collection growth |

Carrying an egg out also costs an inventory slot for the rest of the climb, and it is lost on death unless secured.

### Level cap

**Familiars cap at level 40** — provisional, to be tuned in play.

Since enemy level tracks the floor and the tower ends at 40, this puts a maxed Familiar at parity with summit enemies and overpowered everywhere below. Investment buys a fast, safe early tower and a fair fight at the top, rather than a trivial one.

Raising the cap would make the summit progressively easier with grinding; lowering it would mean the last ten floors have to be won with gear, relics and play instead. This is exactly the kind of number that only playtesting settles.

### Death

A Familiar reduced to 0 HP is **out for the rest of the climb**, not just the current fight. A revive item restores it.

This is what gives revive items weight and creates genuine pressure to extract rather than push one floor further. A Familiar lost this way is not permanently destroyed — a Hatchery Familiar returns on the next entry with its levels intact.

### Classes

Class sets a Familiar's stat growth bias:

| Class | Growth bias |
| --- | --- |
| **Rogue** | SPD and ATK |
| **Tank** | HP and DEF |
| **Barbarian** | ATK and HP |
| **Mage** | MP and SPD |

The actual growth numbers are `OPEN`. Note that no class currently biases toward HP alone, and Rogue and Barbarian overlap on ATK — worth checking that four classes produce four distinct feels rather than three.

## Open

- The XP table, and how Familiar XP is earned (shared, per-participant, or flat).
- How far below the curve a player can fall by skipping encounters before the tower becomes unwinnable rather than merely hard.
- Class growth numbers per level.
- Whether Familiars can equip anything (currently equipment is player-only).
- Species: what it governs that class and type do not.
- How Familiars acquire abilities beyond innate ones (rewards and the Oracle are mentioned; no rules).
- Whether a Familiar's type can be changed permanently — an item for this exists in [items-inventory.md](items-inventory.md).
