# Open Questions

**Only undecided rules and directions.** When one is answered it moves into a design doc and gets an entry in [decisions.md](decisions.md).

This file does **not** track content still to be authored — abilities, relics, enemy stat blocks, chunk libraries, the bestiary. That work is listed in each design doc's own Open section, where it has context. Writing an ability is not a question; deciding whether abilities can crit is.

Ordered by how much else is blocked.

---

## Blocking

### 1. The avoidance ratio
Player movement speed against enemy chase speed, plus aggro radius. **The entire avoidance game lives in that gap** — too wide and enemies are scenery, too narrow and visible encounters are random encounters with extra steps.

Now harder: it has to hold across the heavy/light boots range, so light boots feel like freedom without trivialising the tower and heavy boots feel like commitment without feeling like a trap.

→ [exploration.md](design/exploration.md) · Blocks: any feel-testing of exploration.

### 2. Auto-target priority — deferred
Manual targeting is used for the first implementation. Automatic target priority can be revisited later and is not a blocker.

→ [combat-core.md](design/combat-core.md)

### 3. Floor generation approach and content density
**The generation approach is undecided** — how floors are actually assembled. Notes and references are parked in [floor-generation.md](design/floor-generation.md).

Alongside it: enemies, chests and items per room by depth band, and spawn rates for relics and escape seeds. These are system-level tuning decisions, not level content.

→ [floor-generation.md](design/floor-generation.md) · Blocks: the economy, and any feel-testing of exploration.

---

## Rules that must exist and don't

### 4. Cancel and counter
Deferred by decision, but arguably Grandia's defining mechanic, and the timing spec already publishes the charge windows for it. What triggers it, how far it knocks back, whether enemies can use it, how it is telegraphed on a phone screen.

→ [combat-core.md](design/combat-core.md)

### 5. Shock is dead on arrival
−20% DEF until the unit takes damage, in a game where the next hit usually kills. Needs a different trigger, a duration, or a different effect — or Lightning has a dead status slot.

→ [status-effects.md](design/status-effects.md)

### 6. Status stacking
Can a status be reapplied? Does it refresh or extend? Can a unit hold several at once? Is there a cap?

→ [status-effects.md](design/status-effects.md)

### 7. Augment replacement behaviour
What happens when slotting an augment into a full ability — destroyed, returned, or swapped? Named in the original notes and never answered.

→ [augments.md](design/augments.md)

### 8. Relic rules
Do they stack? Is there a cap? Can one carry a downside? Does a chest offer a choice of several or grant one?

→ [relics.md](design/relics.md)

### 9. Blacksmith rules and the Oracle upgrade tree
The two least-defined town pillars, both flagged as such from the start. The Oracle's information branch wants #3 settled first.

→ [town.md](design/town.md)

### 10. UI interaction grammar
Swipe thresholds, snap, centre-tap, drawers, no-undo signalling, outcome-preview precision. Now also tap-to-move, camera behaviour on deep floors, whether a minimap exists, and keeping exploration and combat input modes distinct.

→ [interaction-grammar.md](ui/interaction-grammar.md)

---

## Smaller rule gaps

**Numbers that get picked once, system-wide:**
- Moveset size — "very small" is never given a number.
- Boss enemy levels (provisionally floor + 3) and boss fight pacing.
- How far below the XP curve a player can fall before the tower is unwinnable rather than merely hard.
- Leathersmith ceiling — total backpack and secure slots purchasable.

**Combat rules:**
- Damage variance — deterministic or rolled? Deterministic fits the outcome-preview promise.
- Critical hits — do they exist at all?
- Burn damage per tick, and whether it scales with ATK.
- Using items mid-combat — allowed, and does it cost a turn on the gauge?
- First strike — does approaching unseen grant a timeline advantage, and do enemies get one from behind?

**Exploration rules:**
- Defeated enemies — gone for the climb, or respawning?
- Minimap — does one exist, and how much does it reveal?
- Abandoning a climb voluntarily without an escape seed, forfeiting loot.
- Running boots and dive — both confirmed as wanted, neither specified. Dive needs cost, cooldown, and whether it can break a fight already triggered.

**Progression rules:**
- Equipment tradeoff limits — can a penalty push a stat below its unequipped value, is tradeoff gear a separate rarity track, does the penalty scale on level-up?
- Equipment level-up rules and their ceiling.
- Species — what it governs that class and type do not.
- Familiar ability acquisition beyond innate abilities.
- Class distinctiveness — Rogue and Barbarian both bias ATK and no class biases HP alone. Do four classes produce four feels?
- Post-floor-40 content, if any.

**Inherited from the original notes and never real:**
- "Fragment rate" appears in the economy notes with no definition. What is a fragment?
