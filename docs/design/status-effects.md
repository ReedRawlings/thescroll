# Status Effects

Numbers: [tuning.md](../tuning.md)

## Applying status

Status effects are not innate to abilities. An ability's base status chance is **0%**. Status is added through **augments**, which grant a chance for the status to apply and can be improved to raise that chance. See [augments.md](augments.md).

Each type has one associated status.

## The duration unit

Durations count **the afflicted unit's own completed turns**. A "completed turn" means that unit reached ACT and its ability resolved.

This is the only duration unit in the game. Do not express a status duration in rounds, ticks, or gauge distance — with a live timeline and per-character speed, only the afflicted unit's own cadence is meaningful to it.

Stun is the exception, and is measured in real seconds, because its whole purpose is to stop the unit from taking turns at all.

## The four statuses

| Type | Status | Effect | Duration |
| --- | --- | --- | --- |
| Normal | **Stun** | Icon stops advancing on the IP gauge | 1.0 / 1.5 / 2.0 s by the applying ability's tier |
| Fire | **Burn** | Low fire damage at the end of each of its turns | 2 completed turns |
| Ice | **Frost** | −20% SPD | 1 completed turn |
| Lightning | **Shock** | −20% DEF | Until it takes damage |

### Stun

Stun freezes the icon at its current gauge position for a fixed number of **real seconds**, set by the tier of the ability that applied it.

Fixed seconds rather than fixed gauge distance means stun hurts fast characters proportionally more — a fast unit loses a larger share of a turn. This is intended: it makes stun a genuine answer to a speed advantage.

### Frost and mid-battle speed changes

Frost changes `effective_spd`, which [combat-timing.md](combat-timing.md) §3 otherwise computes once at battle start.

The rule: **recompute `effective_spd` immediately, keep the icon's current gauge position, and change only the rate of advance.** The icon does not jump forward or backward. This is the least surprising behaviour and the only one that reads correctly on a live gauge.

### Shock is a known problem

Shock reduces DEF by 20% until the unit takes damage. In a game where an average fight is ~3 rounds and trash dies in 1–3 hits, **the next hit both consumes Shock and probably kills the target.** Shock will almost never deliver its effect.

Burn (2 turns) and Frost (1 turn) survive the short-fight format. Shock does not.

This needs a redesign — a different trigger, a duration instead of a consume-on-hit, or a different effect entirely — or Lightning is left with a dead status slot. Flagged, not fixed.

## Open

- **Shock's redesign.** Highest priority here.
- Burn's damage per tick, and whether it scales with the applier's ATK or is flat.
- **Stacking rules**, entirely undefined: can the same status be reapplied, does it refresh or extend, can a unit hold several different statuses at once, is there a cap?
- Whether status can be applied to allies (there is no beneficial status yet).
- Whether bosses have status resistance or immunity.
- Herbs remove statuses per [items-inventory.md](items-inventory.md) — which ones, and whether one herb clears all.
- Whether status persists between floors or clears after combat.
- Whether type advantage affects status chance as well as damage.
