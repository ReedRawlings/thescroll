# Run Structure

Numbers: [tuning.md](../tuning.md) · Terms: [glossary.md](../glossary.md)

## The model

The Scroll follows **Azure Dreams**, not Slay the Spire. The player is not expected to clear the tower in one attempt, or in most attempts. They climb, get as deep as they currently can, and leave or die.

A **session** is a sitting at the game, targeted at ~20 minutes. A **climb** is one entry into the tower. A session may contain several climbs.

## A climb cannot be saved

**There is no saving inside the tower.** A climb begins at floor 1 and ends in extraction, death, or clearing floor 40. It happens in one sitting.

Saving occurs in town, between climbs. Town progress — the four pillars, Familiars, gold, extracted loot — persists normally.

## Climb length

Floors grow with depth (see [floor-generation.md](floor-generation.md)), so a full clear runs roughly **1h45m**: about 65 minutes of exploration plus 40 minutes of combat across ~80 encounters.

Most climbs end far short of that, and that is the intended shape. A ~20 minute session reaches floor 7–10, then the player extracts or dies. The player goes as deep as they currently can, banks what they carried out, and comes back stronger.

There is no timer, no floor clock, and no resource that drains with real time. What limits a climb is difficulty and the player's own willingness to keep pushing.

### Backgrounding is not saving

The app restores exactly where it was when backgrounded, killed by the OS, or closed mid-climb. This is platform behaviour, not a game feature, and it is not in tension with the no-save rule.

The thing being refused is a **save file the player can reload after death**. That would void secure slots, escape seeds and the entire decision to extract. Restoring a suspended app does none of that — there is one live climb state, it is the same climb, and dying still ends it.

## The tower

- **40 floors.** One floor is a **contained set of rooms joined by corridors**, procedurally generated, with stairs up. Floors grow with depth — 3–4 rooms early, 8–10 near the summit.
- **Bosses on floors 10, 20, 30 and 40.** These floors are hand-authored rather than generated. Bosses may also appear from certain events.
- The player **always starts at floor 1.** There are no checkpoints, shortcuts or warps.
- The tower is floors 1 to 40 in order. There is no branching route map above the floor level — **the choices happen inside each floor.**

See [floor-generation.md](floor-generation.md) and [exploration.md](exploration.md).

## Entering and leaving

### Starting a climb

The player enters from the Tower in town, choosing which Familiars to bring from their permanent collection.

### Extraction

Two ways out with your loot:

1. **Escape seed.** A consumable item found during the climb. Using it ends the climb immediately and safely. It occupies one of the player's limited item slots, which is the intended tension: carrying your way out costs carrying capacity.
2. **Clearing floor 40.** The final boss auto-extracts on victory. No escape seed needed and all loot is kept.

Nothing else ends a climb except death.

### Death

If the party wipes:

- All **unsecured** inventory is lost — both item and equipment slots.
- Anything in a **secure slot** survives. Secure slots are purchased from the Leathersmith and there are none by default.
- All **relics** are lost. Relics are climb-only regardless of how the climb ends.
- Any Familiar hatched *inside* the tower is lost.
- Permanent Familiars from the Hatchery are not lost, and keep the levels they gained.

## What persists between climbs

| Persists | Does not persist |
| --- | --- |
| Familiar levels (Hatchery Familiars) | Player character level — resets to 1 every entry |
| Town upgrades (all four pillars) | Relics — always lost on exit |
| Loot carried out via a clean extraction | Tower-hatched Familiars |
| Gold | Unsecured inventory, if you die |
| Secure-slot contents, always | |

The player relevelling from 1 every entry is the defining structural choice. See [party.md](party.md) for why, and for the level curve it produces.

## Open

- **Suspend-resume on mobile.** See above. The sharpest open question in this doc.
- Does the tower offer anything past floor 40 (post-game depth, harder variants)?
- Boss enemy levels — provisionally floor + 3.
- Whether failing a boss has any distinct consequence beyond a normal wipe.
- Whether the player can abandon a climb voluntarily without an escape seed, forfeiting loot.
