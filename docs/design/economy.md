# Reward Economy and Difficulty

Numbers: [tuning.md](../tuning.md)

> **Status:** almost entirely open. This file exists to hold the shape of the problem, not to pretend it is solved.

## What the economy has to do

Because the player relevels from 1 every entry, the economy is not primarily about making the player strong within a climb. It funnels into the four town pillars, which are the only permanent power. The questions that matter are therefore:

1. How much gold does a typical climb yield, at each depth band?
2. How long should each town pillar's next upgrade take to afford?
3. How often does the player face a genuine backpack-space decision?

Question 3 is the one that keeps the inventory system alive. If drops are sparse, the tiny inventory never bites and the Leathersmith is pointless. If drops are dense, the player spends the climb managing a bag instead of climbing.

## Difficulty philosophy

A philosophy is needed before any numbers.

The one commitment made so far: **difficulty is the only limiter on depth** (see [vision.md](../vision.md)). There is no time pressure. A player stops climbing because they died or chose to leave.

What that leaves open is the *shape* of the ramp, and specifically whether deeper floors mainly:

- **increase stats** — the same fights, with bigger numbers, or
- **introduce mechanics** — new statuses, combat variants, enemy behaviours

The level curve in [party.md](party.md) already builds in a stat-side ramp via the player's growing level deficit. Whether that is the whole ramp or just its floor is undecided.

## Open

### Gold and drops
- Gold curve by depth.
- Item drop rate, and how much comes from chests versus enemy drops.
- Augment drop frequency.
- Rarity tiers and their drop weights.
- **"Fragment rate"** — the original notes list this with no definition. What is a fragment?
- How often a meaningful backpack-space decision should occur. This should be a stated target, not an emergent accident.

### Difficulty
- How quickly enemy stats scale with depth.
- Whether deeper floors introduce new mechanics or only bigger numbers.
- Elite and boss structure.
- How much stronger a good climb becomes over a bad one.
- **How much permanent progression should matter versus in-the-moment player decision-making.** This is the philosophical core of the whole economy and it is unanswered.
- Enemy stat blocks and HP curves by depth — pinned by the ~3-round fight constraint in [combat-core.md](combat-core.md), but not yet written.
