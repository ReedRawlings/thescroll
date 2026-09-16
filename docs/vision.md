# Vision

**The Scroll** is a portrait, one-thumb roguelike RPG built around short, highly readable decisions. The game is inspired by Azure Dreams, with combat inspired by Grandia and turn-based JRPGs.

The player climbs a procedurally generated 40-floor tower, exploring each floor room by room, seeing enemies before they reach them, and fighting on a live timeline.

The player enters the tower with their character and a small party of **Familiars**, exploring floors by tapping where to walk and fighting turn-based battles on a **Grandia-inspired live timeline**. Enemies are visible on the floor and give chase on sight — there are no random encounters. Each character has a very small moveset, selected through a left/right swipe carousel. For the first implementation, the player selects targets manually by swiping the focused target sprite; auto-targeting is deferred. The timeline pauses during player command selection. The game then previews the expected outcome before the player commits.

Combat is intentionally simple to control but built on deeper systems: HP, MP, ATK, DEF and SPD; a variety of types; status effects; ability speed classes; equipment; and ability augments that can change damage, speed, targeting or status behaviour.

Between fights, the player receives gold, items and ability upgrades, and manages a deliberately small inventory. Because the stairs are always available, every extra room explored is a deliberate decision to take on risk for reward. Climbs are about pushing deeper, getting stronger, deciding what loot is worth carrying, and finding a safe way to extract before dying. If the party wipes, unsecured inventory is lost.

Outside the tower, the town provides permanent progression through shops and systems such as inventory upgrades, ability improvements, equipment progression, and hatching Familiars found during climbs.

At the highest level, the goal is:

> **A deep roguelike RPG with the physical simplicity of a true one-thumb mobile game: swipe to choose, tap to commit, and never fight the interface.**

## Theme

The Scroll is based on getting stuck in the internet and facing off against manifestations of the internet, its culture, and personas online.

---

## Design pillars

These are the load-bearing commitments. A rule that contradicts one of these is the rule that is wrong.

### 1. Never fight the interface

Every combat decision is one swipe and one tap. Outcome is previewed before commitment. Exploration is **tap-to-move** — the player taps where to go and the character paths there. There is no virtual d-pad and no second input surface. The thumb never leaves the lower third of the screen.

### 2. This is Azure Dreams, not Slay the Spire

The player is not expected to clear the tower in a sitting. They climb, they get as deep as they can, and they leave or die. **~20 minutes is a session target, not a climb target.** The tower always starts at floor 1.

### 3. A climb is an unbroken commitment

There is no saving inside the tower. A climb begins at floor 1 and ends in extraction, death, or clearing floor 40 — in one sitting.

A full clear runs roughly 1h45m at the intended floor scaling, so most climbs end well short of the summit. That is the intended shape: the player goes as deep as they can, banks what they carried out, and comes back stronger.

There is still no timer and no draining resource. What limits a climb is difficulty and the player's own willingness to keep pushing.

See [run-structure.md](design/run-structure.md).

### 4. The player carries the early tower, Familiars carry the summit

The player character relevels from 1 on every entry and is tuned to **fall behind floor level as depth increases**. Familiars keep their levels permanently and stay level-appropriate. This handoff is deliberate: it makes the Hatchery the late-game progression pillar and gives permanent investment a visible payoff.

See [party.md](design/party.md).

### 5. The town is the player's only persistent power

Because player level resets every entry, the four town pillars are the entire permanent progression surface. Their upgrade curves *are* the difficulty curve.

See [town.md](design/town.md).

### 6. Fights are short and lethal

An average non-boss fight is about 3 rounds. Trash dies in 1–3 hits. Any system that needs 6+ rounds to pay off is mistuned for this game.

This matters more now that encounters are frequent and avoidable: a fight has to resolve fast enough that choosing to take one is never a chore.

See [combat-core.md](design/combat-core.md).

### 7. Early floors are a victory lap, and that is the reward

A veteran with high-level Familiars will flatten floors 1–15. This is intended. Speed through familiar ground is how Hatchery investment is felt. Floors 1–15 are tuned to be *fast*, not to be *challenging*, for an invested player.

Exploration reinforces this: early floors are the smallest (3–4 rooms) and enemies are visible and avoidable, so a strong party outruns what it meets and walks past the early tower rather than grinding through it.
