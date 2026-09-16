# Enemy AI — research and first-pass proposal

**Status: proposal, not a settled owner decision.** Requested direction: Dragon Quest-like enemies adapted to The Scroll's live timeline and short fights.

## Research

A firsthand reverse-engineering report on Dragon Quest IX identifies weighted action tables, fixed rotations, alternating action groups, and checks for usable actions. It distinguishes enemy behaviour schemes instead of describing one universal optimizer. The author labels the report AI-assisted; treat its exact implementation claims as provisional, not official series documentation.

Source: [Dragon Quest VIII to IX enemy AI analysis](https://daisukedaisuke.hatenablog.com/entry/2026/08/23/134025), especially the action-weight tables and Schemes sections. Accessed 2026-09-15.

The following is our proposed adaptation, not a claim that Dragon Quest uses these exact rules.

## Recommended behaviour

- **Ordinary monsters:** small, weighted move tables with a recognizable signature move. Species identity comes from the available actions and their weights.
- **Support enemies:** conditional healing or buffs when useful; attack otherwise. Do not spend a healing action on a full-health ally.
- **Bosses:** readable action sequences, changing at authored HP thresholds. Telegraph dangerous charged moves.
- **Targeting:** choose among living valid targets. Ordinary enemies need not perfectly focus the weakest party member; specialized hunters can have an explicit targeting preference.
- **Validity:** exclude unaffordable moves and moves without valid targets. Fall back to a free basic attack; safely wait if there is no valid action.
- **Timeline integration:** choose the action and target at COM, then commit through charge. Do not read the player's unconfirmed selection or repeatedly change the queued move in response to input.
- **Dead target at ACT:** proposed default is a replacement valid target for attacks and healing; if none exists, end the action without effect. Resource-spending timing must be defined alongside this.
- **Pause:** enemy simulation and timers freeze during player command selection, as specified in combat-core.md.
- **Reproducibility:** use the battle's seeded random generator so behaviour can be replayed in debugging.

Use data-driven move tables plus a small state machine; this does not require machine learning or an elaborate planner. Tune weights, healing thresholds, cooldowns and boss phases in the central tuning file when implementing.

## Initial identities

- Brute: mostly attacks, occasionally uses a slower heavy strike.
- Trickster: mixes damage and an augmented status move.
- Support: protects an injured ally, otherwise attacks.
- Boss: a visible buildup followed by a heavy attack and a recovery action.

These are behaviour templates, not additional Familiar classes. Enemy status moves must follow the existing augment rules rather than silently introducing innate status chance.
