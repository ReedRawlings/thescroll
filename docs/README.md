# The Scroll — Documentation

A portrait, one-thumb roguelike RPG. Azure Dreams structure, JRPG exploration, Grandia combat, internet-culture monsters.

**Start here:** [vision.md](vision.md) — the pitch and the seven design pillars.

## The three rules

1. **A fact lives in exactly one file.** Everything else links to it. Never copy a rule between docs.
2. **Every number lives in [tuning.md](tuning.md).** Design docs describe what a rule does and link for the value. The single exception is [design/combat-timing.md](design/combat-timing.md), a final self-contained spec that owns its own constants — `tuning.md` points at it rather than copying it.
3. **Nothing is both spec and open question.** Decided material is spec. Undecided material is a stated question in [open-questions.md](open-questions.md). `OPEN` in a doc means undecided, never zero.

## Map

| File | Owns |
| --- | --- |
| [vision.md](vision.md) | The pitch, the theme, the seven design pillars |
| [glossary.md](glossary.md) | Every term, defined once |
| [tuning.md](tuning.md) | Every number in the game |
| [decisions.md](decisions.md) | What was decided and why. Beats any design doc it contradicts |
| [open-questions.md](open-questions.md) | What is genuinely undecided, ordered by what it blocks |

### Design

| File | Owns |
| --- | --- |
| [design/run-structure.md](design/run-structure.md) | Floors, sessions, tower reset, no-save rule, extraction, death, persistence |
| [design/exploration.md](design/exploration.md) | Tap-to-move, visible enemies, aggro and chase |
| [design/floor-generation.md](design/floor-generation.md) | Room and corridor layout, depth scaling, content placement |
| [design/combat-core.md](design/combat-core.md) | Turn flow, COM/ACT, targeting, fight length, cancel stub |
| [design/enemy-ai.md](design/enemy-ai.md) | Enemy AI research and first-pass proposal (not settled spec) |
| [design/combat-timing.md](design/combat-timing.md) | **Final spec.** IP gauge, speed and tier timing |
| [design/combat-damage.md](design/combat-damage.md) | Damage formula, types, the two level systems |
| [design/status-effects.md](design/status-effects.md) | Stun, Burn, Frost, Shock and the duration unit |
| [design/abilities.md](design/abilities.md) | The ability template |
| [design/augments.md](design/augments.md) | Levelling vs. augmenting, rarity, what augments change |
| [design/party.md](design/party.md) | Stats, the level handoff, Familiars, classes |
| [design/items-inventory.md](design/items-inventory.md) | Slots, secure slots, equipment, item categories |
| [design/relics.md](design/relics.md) | Climb-only party boons found in chests |
| [design/economy.md](design/economy.md) | Gold, drops, rarity, difficulty philosophy |
| [design/town.md](design/town.md) | The four progression pillars |

### UI

| File | Owns |
| --- | --- |
| [ui/interaction-grammar.md](ui/interaction-grammar.md) | Swipe, tap and commit rules |
| [ui/screens.md](ui/screens.md) | Screen inventory |

## Where things go

| Adding… | Goes in |
| --- | --- |
| A number | [tuning.md](tuning.md), always |
| A term | [glossary.md](glossary.md) |
| A rule you have decided | The owning design doc **and** an entry in [decisions.md](decisions.md) |
| A question | [open-questions.md](open-questions.md) |
| A creature | `internet-culture-terms.md` at the project root |
| A floor layout or chunk | [design/floor-generation.md](design/floor-generation.md) |

## Not yet in this tree

- **`internet-culture-terms.md`** — creature briefs and the 105-concept backlog. Left at the project root, untouched, pending the creature pass.
- **`ExampleUI/`** — five supplied screen wireframes; indexed in [ui/screens.md](ui/screens.md).
- **`Assets/`** — supplied monsters, UI, VFX, icons, and MiniRogue dungeon art.
- **`sprites/`** — art source.

## Superseded

`ScrollOverview.md`, `stats.md` and `OpenQuestions andCalculations.md` are the originals. Their content lives in this tree now. They are left in place for review and should be deleted once checked — `OpenQuestions andCalculations.md` in particular contained verbatim copies of the other two, which is the duplication this restructure exists to remove.
