# Abilities

Numbers: [tuning.md](../tuning.md) · Timing: [combat-timing.md](combat-timing.md)

## Approach

Abilities are defined by a **template** rather than an exhaustive list. The goal is a small set of parameters that combine, plus roughly **8–12 test abilities** to validate the system — not dozens of hand-authored entries.

## Template

| Field | Values |
| --- | --- |
| **Speed class** | Fast, Normal, Slow |
| **Base ATK** | Per-ability. Speed class sets its band relative to peers — see below |
| **Type** | Normal, Fire, Ice, Lightning |
| **MP cost** | 0–50 |
| **Target shape** | Single, Branched, All |
| **Status chance** | 0% by default — raised only by augments |
| **Augment slots** | 1 |

Each character has a very small moveset, selected through a left/right swipe carousel.

## Damage

**Each ability carries its own base ATK, and the character's ATK adds to it.** Additive, not multiplicative:

```
EffectiveATK = AbilityATK + CharacterATK
```

Base ATK is a **per-ability value**. Speed class does not set an absolute number — it sets where an ability sits relative to the other abilities the player could be using at that point in progression. A starting Fast ability might be 5; a Slow ability found deep in the tower might be 80.

Values rise across progression the way they do in any JRPG: later abilities are simply bigger.

Full formula in [combat-damage.md](combat-damage.md).

### The authoring rule

What matters is not the absolute value but the **relationship between abilities a player could realistically choose between in the same moment**. §4.3 requires a Slow ability to beat a Fast one by more than 1.56×, and because character ATK is added to both sides, it dilutes the gap. Solving for the Slow value:

```
SlowBase  >  1.56 × FastBase  +  0.56 × CharacterATK
NormalBase >  1.33 × FastBase  +  0.33 × CharacterATK
```

where `CharacterATK` is the ATK the player is expected to have when both abilities are available.

**Worked example.** A player around character ATK 50, choosing between a Fast ability of base 10 and a Slow one:

```
SlowBase > 1.56 × 10 + 0.56 × 50
         > 15.6 + 28
         > 43.6
```

So the Slow ability needs a base of roughly 44 or more to be worth pressing. A Normal one needs `1.33 × 10 + 0.33 × 50` ≈ 30.

The practical consequence for authoring: **the spread between tiers has to widen as the game goes on.** Early abilities can differentiate on a gap of 25; abilities designed for a character with ATK 80 need a much larger one. That is the number to check when writing any new ability, and it is the single formula worth keeping in front of you while building the test set.

### Note on the earlier multiplier ranges

A previous draft proposed per-tier damage *multipliers* of Fast [0.5–0.8], Normal [0.9–1.2], Slow [1.3–1.6]. Those were set aside in favour of additive base ATK.

Worth remembering why they failed, because it is the same class of error: they **violated §4.3 where the ranges overlapped**. A weak Normal (0.9) against a strong Fast (0.8) is only 1.13×, short of the required 1.33×; a weak Slow (1.3) against a strong Normal (1.2) is 1.08×, short of the required 1.17×.

The general rule this yields: **§4.3 must hold at the worst-case comparison, not on average.** Overlapping ranges and converging curves both produce dead options.

## Open

- Base ATK growth as an ability levels, and whether it keeps pace with character ATK.
- Whether target shape correlates with speed class or stays an independent axis.
- The 8–12 test abilities.
- Whether the player and Familiars draw from the same ability pool.
- Moveset size — "very small" is not a number.
- How abilities are acquired and replaced when a moveset is full.
- Whether an ability can be used with insufficient MP, and what happens at 0 MP.
- Healing, buff and utility abilities — currently only offensive abilities are described.
- Whether Branched's second target can be chosen or is always random.
