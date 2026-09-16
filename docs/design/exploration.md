# Exploration

Moving through a floor, and how combat starts.

Floor layout: [floor-generation.md](floor-generation.md) · Combat: [combat-core.md](combat-core.md) · Numbers: [tuning.md](../tuning.md)

## The model

The Scroll explores like a traditional JRPG and fights like Grandia. The two never run at once:

```
Explore a floor  →  touch an enemy  →  cut to battle  →  cut back  →  keep exploring
```

The IP gauge exists **only inside battle**. Exploration is real-time and free-moving; nothing advances on the timeline while walking. This clean separation is why the combat spec needs no changes to support exploration — see [combat-timing.md](combat-timing.md), which is unaffected.

## Movement

**Tap-to-move.** The player taps a destination and the character paths there. Tapping again redirects; tapping the character stops it.

This preserves the one-thumb promise. There is no virtual d-pad and no second input surface — the exploration grammar is the same "tap to commit" the rest of the game uses.

Movement speed is governed by the **Boots equipment slot**, the same slot that provides SPD in combat. One slot, two expressions: faster on the timeline and faster on the floor.

Speed comes from the boots **item**, not from the SPD stat. Frost therefore does not slow the player on the floor, and levelling SPD does not change walking speed.

### Boots decide how much of the tower you fight

Because outrunning a pursuer is the whole avoidance mechanic, boots with a tradeoff (see [items-inventory.md](items-inventory.md)) change what kind of climb the player is having:

| | Heavy boots (+HP, −SPD) | Light boots (+SPD, −HP) |
| --- | --- | --- |
| Can outrun pursuers | No | Yes |
| Encounters | Forced to fight | Can skip most |
| Level vs. curve | On or above it | Falling behind |
| Depth per session | Shallower | Deeper |
| Failure mode | Runs out of time | Runs out of levels |

This is the clearest expression of the build identity in the game, and it is worth protecting: **the boots decide whether the player grinds or sprints**, and both should be viable routes to the summit.

## Enemies on the floor

Enemies are **visible and avoidable**. There are no random encounters.

This is deliberate and it follows from permadeath: when death costs the climb, an unavoidable ambush from a patch of grass reads as the game taking something from you. A monster you can see coming is a decision.

### Aggro and chase

| Rule | Behaviour |
| --- | --- |
| **Detection** | An enemy notices the player within an aggro radius |
| **Chase** | Once alerted it pursues directly within its scene |
| **Escape** | The player can outrun it. It gives up and returns to its patrol |
| **Scope** | Aggro is **scene-scoped**, and **a scene is one room** — so enemies do not pursue out of the room they occupy |
| **Trigger** | Contact starts the battle |

The scene boundary is the hard limit on a chase. Because a scene is one room, this makes **rooms dangerous and the corridors between them safe**, giving the floor a legible rhythm: commit to a room, resolve or escape it, breathe on the way out.

It also keeps the veteran victory lap intact — a fast party outruns what it meets and leaves the room.

The rule is written in terms of scenes rather than rooms because the scene boundary is what actually governs pursuit. If a scene ever holds more than one room, the chase widens with it.

### Consequence: the player controls their own level curve

Because encounters are skippable, the XP curve in [party.md](party.md) describes **a player who fights most of what they meet**, not a guarantee.

Ducking fights is a real strategy: arrive deeper, faster and weaker. That trades directly against the deliberate player-level lag, and it compounds — a player who skipped the early tower is further behind than the curve assumes at exactly the depth where the deficit bites hardest.

This is a good tension and should be preserved rather than balanced away. The XP table must tolerate a player who skipped a third of the fights.

## Planned, not yet specified

Both confirmed as wanted, both **later**:

- **Running boots** — a movement-speed upgrade. Fits the Boots slot directly.
- **Dive** — an evasive move that breaks the legs of pursuing monsters, disabling a chase. Needs rules for cost, cooldown, and whether it can be used to escape a fight that has already triggered.

## Open

- Aggro radius, and whether it varies by enemy or depth.
- Player movement speed, enemy chase speed, and the gap between them — the whole avoidance game lives in that ratio.
- Whether enemies patrol routes or idle.
- Whether an enemy that gave up stays alert, and for how long.
- Whether the player can see into a room from the corridor before entering it.
- Whether the player can get a first-strike advantage into the timeline for approaching unseen, and whether enemies get one for catching the player from behind.
- What happens to defeated enemies — gone for the climb, or respawning.
- Whether enemies can be seen from a corridor before entering a room.
- Whether there is any non-combat interaction on the floor (locked doors, switches, breakables).
