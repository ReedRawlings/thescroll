# Combat Core

Turn flow and the rules that are not damage, timing or status.

Timing math: [combat-timing.md](combat-timing.md) · Damage: [combat-damage.md](combat-damage.md) · Numbers: [tuning.md](../tuning.md)

## The loop

Combat runs on a live **IP gauge**. Every combatant advances along it while combat simulation is running.

**Command selection pauses the whole battle timeline.** When a player-controlled party member reaches COM, all gauge movement and combat timers freeze while the player chooses an ability and target. Confirming the command resumes simulation and begins that member’s charge. This applies to Familiar commands as well as the player character.

1. **Wait phase** — the icon advances from 0 toward COM (position 70) at `WAIT_RATE`.
2. **COM** — reaching position 70 prompts a choice. The player picks an ability from a left/right swipe carousel; enemies pick by AI.
3. **Charge phase** — the icon advances from 70 toward ACT (position 100) at the chosen ability's `tier_rate`. A Slow ability spends longer here than a Fast one.
4. **ACT** — reaching position 100 executes the ability. The icon returns to 0.

Because the charge rate is set by the chosen ability, a Slow ability is exposed for a longer share of its own turn. This is the core tension of the system and the reason speed classes are a real decision.

## Fight length

An average non-boss fight is about **3 rounds**, with trash dying in **1–3 hits**. This is a hard design constraint, not an observation:

- It keeps the one-thumb promise intact — roughly 9 player decisions per fight.
- It sets the enemy HP curve against the damage formula. At a mid-game ATK 50 against DEF 20, a hit lands ~41, so trash HP at that tier sits roughly 40–80.
- **Any mechanic that needs 6+ rounds to pay off is mistuned for this game.** See the Shock problem in [status-effects.md](status-effects.md).

Bosses are the exception and run much longer. Boss pacing is `OPEN`.

## Targeting

**Auto-targeting is deferred for the first implementation.** The player manually selects a valid enemy or ally by cycling the focused target sprite before confirming.

The expected outcome is previewed before the player commits.

Future auto-target priority remains undecided and does not block the first implementation.

## Target shapes

| Shape | Effect |
| --- | --- |
| Single | One target |
| Branched | The main target plus one other random target |
| All | Every valid target |

## Death mid-turn

When a combatant dies, they are **removed from the IP gauge immediately** and their queued move does not resolve, even if they were mid-charge.

## Cancel and counter

**Deferred.** In Grandia, striking an opponent during their charge phase knocks them back down the gauge, and this is arguably the defining mechanic of that combat system.

[combat-timing.md](combat-timing.md) §4.2 already publishes the charge-phase durations as "the window in which a cancel is possible," so the timing groundwork exists. The mechanic itself does not.

Nothing else should be designed as if cancel exists until this is specified.

Open within it: what triggers a cancel, how far it knocks the target back, whether enemies can cancel the player, whether it costs anything, and how it is telegraphed on a portrait phone screen.

## Open

- Auto-target priority rules (deferred; not a first-pass blocker).
- Cancel and counter, in full.
- Boss fight pacing and whether bosses use different gauge rules.
- Enemy AI ability selection — [research and first-pass proposal](enemy-ai.md).
- What happens to a queued ability if its target dies before ACT.
- Whether the player can change their mind between COM and ACT.
- Escape / flee from a battle once it has triggered, if it exists at all. Interacts with the planned dive move in [exploration.md](exploration.md).
