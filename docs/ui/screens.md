# Screens

> **Status:** five supplied wireframes are available in `ExampleUI/`. They guide screen structure; supplied assets provide the visual materials.

## Supplied references

- `Battle.jpeg`: focused enemy, acting ally and HP, ability carousel, explicit action confirmation.
- `OpeningBattle.jpeg`: enemy overview, party strip, timeline area, lower controls.
- `HomeTown.jpeg`: four town buildings and a large tower-entry button.
- `RewardScreen.jpeg`: items, ability modifier, and gold reward groups.
- `inventory.jpeg`: slot grid, purchasable expansion, and secure-slot explanation.

The town wireframe mentions breeding; breeding remains outside the specified first-pass scope. Exploration has no supplied wireframe yet and can follow the established portrait/tap-to-move rules.

## Supplied assets

`Assets/` contains UI, NovelMix, PatternMix, RpgMix, IconMix 2, VfxMix, and MiniRogue Dungeon Premium. The dungeon pack includes decor, heroes, enemies, tiles, icons, and PNG animation sheets. Select a coherent subset during implementation.

Terms: [glossary.md](../glossary.md) · Rules: [interaction-grammar.md](interaction-grammar.md)

## Screens the systems imply

Derived from the specs, not from the designs. This is a checklist of what must exist, not a description of what was drawn.

### Combat
- The IP gauge with COM and ACT lines, and every combatant's icon
- Ability carousel
- Target selection and override
- Outcome preview before commit
- Party status (HP / MP for player and Familiars)

### Exploration
- The floor view — rooms, corridors, the character, visible enemies
- Chest and pickup interaction
- Stairs prompt
- Minimap, if there is one

### Between fights
- Post-combat rewards
- Event presentation and its choices
- Chest opening and relic grant

### Management
- Inventory, showing equipment, item and secure slots distinctly
- Party and Familiar detail
- Ability and augment management

### Town
- Town overview with the four pillars plus the tower entrance
- One screen per pillar
- Pre-climb Familiar selection

## Open

- Reconcile each design against the systems above. **The screens predate the move to explorable floors**, so anything assuming an abstract between-floor choice needs revisiting, and the whole exploration group is new.
