# Items and Inventory

Numbers: [tuning.md](../tuning.md)

## The inventory

The starting inventory has **10 slots total**: three equipment slots and seven item slots.

| Slots | Count | Contents |
| --- | --- | --- |
| Equipment | 3 | Weapon, shield, boots |
| Item | 7 | Consumables, eggs, escape seeds |
| **Secure** | **0** | Purchased from the Leathersmith |

Both backpack slots and secure slots are **Leathersmith upgrades**. A new player has neither. Carrying capacity is a progression track, not a given.

### The escape seed tension

An escape seed is the only voluntary way out of the tower, and it occupies one of seven item slots. **Each seed occupies its own slot.** This is intended: the decision to hold a seed versus one more healing item is the central inventory decision of an early climb, and expanding capacity at the Leathersmith is how that pressure is relieved.

## Equipment

| Slot | Primary stat | Also governs |
| --- | --- | --- |
| Weapon | ATK | — |
| Shield | DEF | — |
| Boots | SPD | **Movement speed on the floor** |

Boots are the one piece of equipment felt outside of battle. Movement speed is a property of the boots item itself, not of the SPD stat — so Frost does not slow the player on the floor, and levelling SPD does not change walking speed.

## Equipment tradeoffs

Equipment is not purely additive. A piece may carry a **tradeoff**: a bonus to a secondary stat paid for with a penalty to its own primary.

| Example | Gives | Costs |
| --- | --- | --- |
| Heavy boots | +HP | −SPD, −movement speed |
| Light boots | +SPD, +movement speed | −HP |
| Heavy blade | +ATK | −SPD |
| Tower shield | +DEF | −SPD |

This turns each slot from a single-axis upgrade into a build decision, and it gives the Blacksmith something to sell other than bigger numbers.

### Why boots are the richest case

Because boots govern both timeline cadence and walking speed, a tradeoff there reaches into both halves of the game at once:

- **Heavy boots** make the player slower on the timeline *and* unable to outrun pursuers. They cannot avoid encounters, so **they fight more** — which means more XP, and a player tracking closer to the level curve.
- **Light boots** let the player skip most of the tower. They arrive **deeper, faster and weaker**, further below the curve at exactly the depth where the deficit bites hardest.

That is a genuine build identity — tank-and-grind versus sprint-and-skip — and it connects the equipment system directly to the XP tension in [party.md](party.md) rather than sitting beside it.

Planned "running boots" are the extreme end of the light branch. See [exploration.md](exploration.md).

**Equipment is player-only.** Familiars cannot equip anything.

Base stat contribution is low — **1 to 10** — but equipment can be levelled further. Because gear bonuses stack above the 99 stat cap (see [party.md](party.md)), equipment keeps mattering at maximum level.

## Item categories

| Category | Notes |
| --- | --- |
| Weapons, shields, boots | Equipment |
| Recovery items | Restore HP and MP |
| **Escape seed** | The only voluntary extraction. Singular category. |
| Egg berry | Makes a monster drop an egg if the battle ends in victory |
| Herbs | Remove status effects |
| Revive item | Restores a Familiar that dropped to 0 HP |
| Type-change item | Changes a Familiar's type. Very expensive. |
| Stat-up item | +1 to a stat, permanently. Very expensive. |
| Equipment-up item | +1 to a weapon, shield or boots' primary stat |
| Event-negation item | Negates the next negative event. **Later addition, not for the first pass.** |
| Running boots | Movement-speed upgrade. **Planned, not specified.** See [exploration.md](exploration.md). |

## Rules

- **Stacking** — only currencies stack. Every other item, including each potion, occupies its own slot.
- **Discarding** — items can be discarded before and after a battle, not during.
- **Death** — everything in an unsecured slot is lost, equipment included. Secure slots survive.
- **Extraction** — loot is permanent if the player leaves the tower without dying.
- **Relics are not items.** They do not occupy slots and cannot be secured. See [relics.md](relics.md).

## Open

- How many backpack and secure slots the Leathersmith can sell in total.
- Whether secure slots hold equipment, consumables, or both.
- Whether a secure slot can be reassigned mid-climb or only in town.
- Item level-up rules — what raises equipment beyond base, and its ceiling.
- Whether a tradeoff penalty can push a stat below its unequipped value, or only cancel the item's own bonus.
- Whether tradeoff gear is a separate rarity track or a property any piece can roll.
- Whether the tradeoff scales when the item is levelled — does upgrading heavy boots make them heavier?
- Whether recovery items can be used mid-combat and whether doing so costs a turn on the gauge.
- Whether eggs occupy a normal item slot (assumed yes).
- Gold costs and drop rates — see [economy.md](economy.md).
