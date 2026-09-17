# Tuning Constants

**Every number in the game lives here.** Design docs describe *what* a rule does and link to this file for the value. If you find a literal number in a design doc that is not an illustrative example, it belongs here instead.

**One exception:** [combat-timing.md](design/combat-timing.md) is a final, self-contained spec and owns all of its own constants — the gauge positions, the speed curve, and the Fast / Normal / Slow tier rates. Those numbers are inseparable from the derivations that justify them, so this file points at that spec rather than copying it.

`OPEN` marks a value that has not been decided. Do not treat it as zero.

**Everything else here is a starting point, not a law.** These numbers exist so the game can be built and played; they are expected to move once there is something to play. A value being written down is not a commitment to it.

---

## Party

| Constant | Value |
| --- | --- |
| Party capacity | Player + 2 Familiars (3 combatants total) |

## Stats

| Constant | Value | Notes |
| --- | --- | --- |
| Stat cap (base) | 99 | Applies to HP, MP, ATK, DEF, SPD |
| Stat cap (with gear/buffs) | none | Gear and buffs stack above 99 on **every** stat |

## Damage

| Constant | Value |
| --- | --- |
| Type advantage multiplier | 1.25 |
| Type neutral multiplier | 1.00 |
| Type disadvantage multiplier | 0.75 |
| Damage level step | 0.02 per level of difference |
| Damage level clamp | 0.50 – 1.50 |

Formula in [combat-damage.md](design/combat-damage.md).

## IP gauge and speed

**Owned entirely by [combat-timing.md](design/combat-timing.md)** — not reproduced here.

That spec is self-contained and final: it holds its own variables, constants, the `core` / `level_factor` / `effective_spd` calculation, and the Fast / Normal / Slow tier rates and `K` values, together with the derivations that produced them. Splitting those numbers away from the working that justifies them would make both halves harder to trust.

This is the one documented exception to the rule that every number lives in this file.

| Look up | In |
| --- | --- |
| `GAUGE_LENGTH`, `COM_POSITION`, `ACT_POSITION` | [combat-timing.md](design/combat-timing.md) §2 |
| `WAIT_RATE`, `SPD_FLOOR`, `SPD_RANGE`, `SPD_HALF`, `BONUS_SCALE` | §2 |
| `LEVEL_STEP`, `LEVEL_MIN`, `LEVEL_MAX` | §2 |
| Tier rates and `K` — Fast, Normal, Slow | §4 |
| Full turn and charge times by `effective_spd` | §4.1, §4.2 |
| The Fast 1 : Normal 1.33 : Slow 1.56 balance rule | §4.3 |

## Status effects

| Constant | Value |
| --- | --- |
| Burn duration | 2 of the afflicted unit's completed turns |
| Burn damage per tick | `OPEN` |
| Frost SPD reduction | −20% |
| Frost duration | 1 of the afflicted unit's completed turns |
| Shock DEF reduction | −20% |
| Shock duration | Until the afflicted unit takes damage |
| Stun duration — Fast ability | 1.0 s |
| Stun duration — Normal ability | 1.5 s |
| Stun duration — Slow ability | 2.0 s |
| Base status chance (no augment) | 0% |
| Status stacking rules | `OPEN` |

## Run structure

| Constant | Value |
| --- | --- |
| Tower length | 40 floors |
| Boss floors | 10, 20, 30, 40 (hand-authored, not generated) |
| In-tower saving | None — a climb is one sitting |
| Target session length | ~20 minutes (~floor 7–10) |
| Full-clear length (reference) | ~1h45m |
| Average non-boss fight | ~3 rounds |

## Floors and exploration

| Constant | Value |
| --- | --- |
| Rooms per floor, floors 1–10 | 3–4 |
| Rooms per floor, floors 11–25 | 5–7 |
| Rooms per floor, floors 26–40 | 8–10 |
| Traversal, floors 1–10 | ~45–60 s |
| Traversal, floors 11–25 | ~90 s |
| Traversal, floors 26–40 | ~2–3 min |
| Encounter model | Visible, avoidable. No random encounters |
| Pursuit scope | Entire connected floor; no protected room or corridor boundary |
| Player movement speed | `OPEN` — a property of the equipped boots item |
| Enemy chase speed | `OPEN` — must be below player speed |
| Aggro radius | `OPEN` for production; demo defaults below |
| Demo player / chase / return speed | 3.3 / 1.65 / 1.1 tiles/s |
| Demo detection radius | 3.3 tiles, unobstructed line of sight required |
| Demo disengage distance | More than 7 tiles of straight-line separation; return to spawn along walkable paths |
| Demo contact distance | Below 0.63 tile, with no wall between actors |
| Enemies per room | `OPEN` |
| Chest / relic spawn rate | `OPEN` |
| Escape seed spawn rate | `OPEN` |
| Chunk library size | `OPEN` — 20–40 suggested |

## Levelling

| Constant | Value |
| --- | --- |
| Enemy level, floors 1–5 | = floor number, no variance |
| Enemy level, floors 6+ | = floor number ± 2, minimum 1 |
| Boss enemy level | `OPEN` |
| Player level, floors 1–5 | Tracks floor 1:1 |
| Player level, floors 6+ | ~0.83 levels per floor |
| Player level at floor 40 | ~34 (a −6 gap) |
| Familiar levelling | Persistent; same curve as the player within a climb |
| Familiar level cap | 40 (provisional) |
| Class growth rates | `OPEN` |
| XP table | `OPEN` |

## Inventory and items

| Constant | Value |
| --- | --- |
| Base equipment slots | 3 |
| Base item slots | 7 |
| Base secure slots | 0 (purchased from the Leathersmith) |
| Starting inventory slots | 10 (3 equipment + 7 items) |
| Stacking | Currencies only; all other items use one slot each |
| Item base stat contribution | 1–10 |
| Equipment tradeoff magnitudes | `OPEN` |
| Gold curve | `OPEN` |
| Item drop rate | `OPEN` |
| Augment rarity tiers | Bronze, Silver, Gold |
| Augment drop frequency | `OPEN` |

## Abilities

| Constant | Value |
| --- | --- |
| MP cost range | 0–50 |
| Augment slots per ability | 1 |
| Base ATK | Per-ability. Speed class sets its band relative to peers available at the same time |
| Base ATK growth per ability level | `OPEN` |
| Tier-to-target-shape mapping | `OPEN` — Fast Single / Normal Branched / Slow All proposed |

Ability base ATK is **additive** with character ATK, so the authoring constraint is a relationship, not a fixed value:

```
SlowBase   >  1.56 × FastBase + 0.56 × CharacterATK
NormalBase >  1.33 × FastBase + 0.33 × CharacterATK
```

Evaluated at the character ATK a player is expected to have when those abilities are available. See [abilities.md](design/abilities.md).

## Balance rules

The tier time ratio and the balance rule it implies are owned by [combat-timing.md](design/combat-timing.md) §4.3.

Abilities pay for their time cost through their own **base ATK**, added to character ATK. Because the contribution is additive, the required spread between tiers widens as character ATK grows — the authoring rule is in [abilities.md](design/abilities.md).
