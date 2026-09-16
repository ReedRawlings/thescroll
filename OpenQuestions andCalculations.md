# Stats

Stats:

* HP: Total amount of health a character has  
* MP: Resource for abilities used  
* ATK: Determines total damage output for an attack or ability  
* DEF: Determines total damage block against an attack or ability  
* SPD: Determines live action turn order (Grandia inspired)

Stats cap at 99 for all stats

**Types**  
Types: Normal, FIre, Ice, Lightning  
Type advantage: Fire \> Ice \> Lightning \> Fire  
Type advantage gives 1.25 damage and type disadvantage comes in at 0.75 damage

Status: Each status can be added to an ability via augments. Augments always give a chance for a status to happen. Augments can give increasing chances for status effects to work. 

* Normal \- Stunned (Pauses movement on the IP timeline for a certain duration)  
* Fire \- Burn (low fire damage over two completed actions)  
* Ice \- Frost (Decreases speed by 20% for one completed action)  
* Lightning \- Shock (Reduces DEF by 20% until takes damage)


  
Player: HP, ATK, DEF, MP, SPD  
Familiars: HP, ATK, DEF, MP, SPD, Type, Species, Class, Innate Abilities

Level Scaling: We’ll give each familiar a “class” (rogue, tank, barbarian, mage)  
Rogue: Higher increase to SPD and ATK  
Tank: Higher increase to HP and DEF  
Barbarian: High increase to ATK and HP  
Mage: Higher increase to MP and SPD

Item Augments (Player Only): 

* Weapon (ATK)  
* Shield (DEF)  
* Boots (SPD)

Grandia Style calculation

# Open Questions

1. **one run structure**  
    Define exactly what a run looks like:  
   * average run length: 20 minutes  
   * number of fights/events: We’re targeting 40 total levels, 80% should be combat.   
   * when bosses appear: Every ten levels and certain random events  
   * how extraction works: You must use an escape seed an item earned during game play.  
   * what is lost vs kept on death: Everything in the inventory is lost on death unless placed in a secure slot.   
   * what ends a run besides death/extraction: Nothing  
2. **Combat rules**  
    You have the shape, but need hard rules for:  
   * damage formula:   
     1. BaseDamage \= STR × 100 / (100 \+ DEF)  
     2. LevelMod \= clamp(1 \+ (CharLevel \- EnemyLevel) × 0.02, 0.5, 1.5)  
     3. Damage \= BaseDamage × LevelMod  
   * MP costs/recovery: items can recover MP, random events can restore MP,   
   * SPD/IP timeline math: See SPD and IP Timeline Math  
   * Quick/Normal/Heavy timing: See SPD and IP Timeline Math  
   * type advantage multiplier: 1.25x advantage, 0.75 disadvantage   
   * status duration/stacking:   
   * targeting priority  
   * what happens when someone dies mid-turn order: They are dropped from the IP timeline and their move does not finish.   
3. **Abilities \- Default Stats**  
    Create an ability template rather than a giant list:

   * damage multiplier: \[0.5 \- 0.8\] Fast, \[0.9 \- 1.2\] Normal, \[1.3 \- 1.6\] Slow  
   * MP cost: \[0-50\]  
   * speed class: \[Fast, Normal, Slow\]  
   * Type: \[fire, ice, lightning\]  
   * target type \[Single, Branched, All\] \- Branched hits the main target and one other random target  
   * status chance: 0%  
   * augment slot: 1  
4. Then design maybe **8–12 test abilities**, not dozens.

5. **Familiars (extended party members)**  
   * how familiars are obtained: Familiars are obtained via eggs inside the tower. Sometimes dropped by enemies, obtained through random events, or by using   
   * Types: Fire, Ice, Lightning, Normal  
   * leveling/growth: Same as the player character  
   * ability acquisition: earned as rewards during the tower or from the Oracle  
   * death rules: when a familiar dies they are no longer available in battle.   
   * whether they persist permanently once hatched: if they are hatched via the hatchery they are permanent if hatched in the tower they are lost on exit.   
6. **Items and inventory**  
    Define:  
   * item categories: swords, shields, boots, recovery items, a single escape item, a berry that makes a monster drop an egg if the battle ends in victory, herbs for removing statuses, revive item, items to change the type of a familiar (very expensive), items to increase stat power by 1 permanently (very expensive), an item to negate the effect of the next negative event (to add later), item to increase stats of sword, shields, boots by \+1 to primary stat  
   * base stat contribution: Base stats are very low for all items; between 1 and 10 starting, but can be leveled up further.   
   * stacking rules: same named items that aren’t equipment stack up to 99  
   * discard rules: items can be discarded from the inventory before and after battle.   
   * secure-slot rules: items placed in a secure slot in the inventory aren’t lost on death  
   * what happens to equipped items on death: The inventory contains three equipment item slots and three item slots. All items can be lost on death.   
   * whether loot is run-only or can become permanent: loot is permanent if you leave the tower without dying.   
7. **Ability augmentation**  
    This deserves its own rules because it could become one of your strongest systems:  
   * level-up vs augment: Abilities can level up to open new augments, but augments change what the ability does.   
   * replacement behavior  
   * augment rarity: bronze, silver, gold  
   * allowed combinations: To start no combinations are banned.   
   * speed-class modification: Can augment speed class to different levels which can speed up or slow down abilities but also increase or decrease damage. Refer to SPD and IP timeline Math  
   * damage-type modification:   
   * status effects: augments can increase the chance for a status effect to occur up from 0%  
   * multi-target effects: Branch/All   
8. **Town/meta progression**  
    Define what each building owns so systems don’t overlap:

   * Leathersmith  
   * ability upgrade shop / Oracle  
   * Hatchery  
   * weapon/item shop  
   * dungeon entry

9. **Reward economy**  
    Work out:  
   * gold curve  
   * item drop rate  
   * fragment rate  
   * augment frequency  
   * rarity tiers  
   * how often the player faces a meaningful backpack-space decision  
10. **Difficulty curve**  
     You need a philosophy before numbers:  
    * how quickly enemies scale  
    * whether deeper floors mainly increase stats or introduce harder mechanics  
    * elite/boss structure  
    * how much stronger a good run becomes  
    * how much permanent progression matters versus player decision-making  
11. **UI interaction rules**  
     You’ve designed the screens; now document the universal grammar:  
* horizontal swipe threshold  
* snap behavior  
* center tap behavior  
* when target swiping is enabled  
* how auto-target works  
* outcome-preview rules  
* when drawers appear  
* no-undo rules  
* what happens on interruption/app suspension

# SPD and IP Timeline Math

# **Speed and Timing Specification**

This document replaces sections 3.1, 4.1 and 5 of the IP Gauge Turn System design. It gives one speed stat, three ability tiers, and the timing that results from them.

---

## **1\. Variables**

| Name | Type | Range | Description |
| ----- | ----- | ----- | ----- |
| `base_spd` | int | 1 to 99 | Natural speed stat. Hard cap at 99\. |
| `bonus` | int | 0 or more | Sum of gear and buff values. No cap. |
| `my_level` | int | — | Level of the party member. |
| `enemy_avg_level` | int | — | Average level of the enemy side at battle start. |
| `core` | float | 31 to 77 | Speed from the natural stat only. |
| `level_factor` | float | 0.70 to 1.30 | Party members only. Enemies always use 1.0. |
| `effective_spd` | float | — | Final speed. The gauge uses this value. |
| `position` | float | 0 to 100 | Position of the icon on the gauge. |
| `tier_rate` | float | — | Set by the ability tier. See section 4\. |

---

## **2\. Constants**

| Name | Value | Description |
| ----- | ----- | ----- |
| `GAUGE_LENGTH` | 100 | Total length of the gauge. |
| `COM_POSITION` | 70 | The command line. |
| `ACT_POSITION` | 100 | The action line. |
| `WAIT_RATE` | 0.80 | Rate in the Wait zone. Same for all tiers. |
| `SPD_FLOOR` | 30 | Lowest possible core speed. |
| `SPD_RANGE` | 70 | Distance from the floor to the ceiling. |
| `SPD_HALF` | 50 | Stat value at which core is equal to the raw stat. |
| `BONUS_SCALE` | 0.25 | Speed for each point of gear or buff. |
| `LEVEL_STEP` | 0.03 | Change in the level factor for each level. |
| `LEVEL_MIN` | 0.70 | Lower limit of the level factor. |
| `LEVEL_MAX` | 1.30 | Upper limit of the level factor. |

---

## **3\. The calculation**

Do steps 1 to 4 one time, at the start of the battle. Do them again only if gear or a buff changes. Do not do them again after a level-up, or the timing will change in the middle of a battle.

1\.  base   \= clamp(base\_spd, 1, 99\)

2\.  core   \= SPD\_FLOOR \+ (SPD\_RANGE x base) / (base \+ SPD\_HALF)  
           \= 30 \+ (70 x base) / (base \+ 50\)

3\.  party member:  
      level\_factor \= clamp(1 \+ 0.03 x (my\_level \- enemy\_avg\_level), 0.70, 1.30)  
    enemy:  
      level\_factor \= 1.0

4\.  effective\_spd \= (core \+ 0.25 x bonus) x level\_factor

5\.  on each tick:  
      if state \== WAIT:    position \+= effective\_spd x 0.80      x tick\_time  
      if state \== CHARGE:  position \+= effective\_spd x tier\_rate x tick\_time

### **3.1 Why the stat and the bonus are separate**

`core` uses a curve with a floor and a ceiling. A low stat is slow but not broken. The last stat points are worth less than the first.

`bonus` is linear and has no limit. Gear and buffs therefore continue to give real time at the top of the range, and they do not push into a wall.

### **3.2 The level factor**

| Level difference | Factor | Result |
| ----- | ----- | ----- |
| −10 or lower | 0.70 | Enemies act 1.43 times as often. |
| −5 | 0.85 | Enemies act 1.18 times as often. |
| 0 | 1.00 | Normal cadence. |
| \+5 | 1.15 | Party acts 1.15 times as often. |
| \+10 or higher | 1.30 | Party acts 1.30 times as often. |

The factor applies to the party only. Enemy speed does not change with the level difference. This makes an underleveled battle harder, but the player still gets a turn between enemy turns.

---

## **4\. Tier timing**

| Tier | `tier_rate` | `K` |
| ----- | ----- | ----- |
| Fast | 0.560 | 141 |
| Normal | 0.300 | 188 |
| Slow | 0.226 | 220 |

t\_wait   \= 87.5 / effective\_spd              (the same for all tiers)  
t\_charge \= (K \- 87.5) / effective\_spd  
t\_turn   \= K / effective\_spd

### **4.1 Full turn, in seconds**

| `effective_spd` | Fast | Normal | Slow |
| ----- | ----- | ----- | ----- |
| 31 (minimum) | 4.5 | 6.0 | 7.0 |
| 42 | 3.4 | 4.5 | 5.3 |
| 53 | 2.6 | 3.5 | 4.1 |
| 65 | 2.2 | 2.9 | 3.4 |
| 77 (stat 99\) | 1.8 | 2.5 | 2.9 |
| 89 (stat 99, \+50 gear) | 1.6 | 2.1 | 2.5 |
| 127 (stat 99, \+200) | 1.1 | 1.5 | 1.7 |

No fast ability is slower than 4.5 s. No normal ability is slower than 6.0 s. No slow ability is slower than 7.0 s.

### **4.2 Charge phase only, in seconds**

This is the window in which a cancel is possible.

| `effective_spd` | Fast | Normal | Slow |
| ----- | ----- | ----- | ----- |
| 31 | 1.7 | 3.2 | 4.3 |
| 65 | 0.8 | 1.5 | 2.0 |
| 127 | 0.4 | 0.8 | 1.0 |

The charge phase is 38 percent of a fast turn, 53 percent of a normal turn, and 60 percent of a slow turn. A heavy ability is therefore exposed for a longer part of its own turn.

### **4.3 Balance rule**

The time ratio is constant at every speed value:

**Fast 1 : Normal 1.33 : Slow 1.56**

* A normal ability must give more than 1.33 times the effect of a fast ability.  
* A slow ability must give more than 1.56 times the effect of a fast ability.

If it does not, no player selects it.

# The Scroll Overview

**The Scroll** is a portrait, one-thumb roguelike RPG built around short, highly readable decisions rather than map navigation or dense menus. The game is inspired by Azure Dreams with combat inspired by Grandia and turn-based jrpgs. 

The player enters a tower with their character and a small party of **Familiars**, fighting turn-based battles using a **Grandia-inspired live timeline**. Each character has a very small moveset, selected through a left/right swipe carousel. Abilities can auto-target sensible enemies or allies, while the player can override targets by swiping the focused target sprite. The game then previews the expected outcome before the player commits.

Combat is intentionally simple to control but built on deeper systems: HP, MP, ATK, DEF and SPD; a variety of types; status effects; ability speed classes; equipment; and ability augments that can change damage, speed, targeting or status behavior.

Between fights, the player receives gold, items and ability upgrades, manages a deliberately small inventory, and chooses what happens next through irreversible swipe-based event choices instead of navigating a dungeon map. Runs are designed around pushing deeper, getting stronger, deciding what loot is worth carrying, and finding a safe way to extract before dying. If the party wipes, unsecured inventory is lost.

Outside the tower, the town provides permanent progression through shops and systems such as inventory upgrades, ability improvements, equipment progression, and hatching Familiars found during runs.

At the highest level, the goal is:

> **A deep roguelike RPG with the physical simplicity of a true one-thumb mobile game: swipe to choose, tap to commit, and never fight the interface.**

## Theme:

The Scroll is based on getting stuck in the internet and facing off against manifestations of the internet, its culture, and personas online.   
