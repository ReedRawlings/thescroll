# Speed and Timing Specification

**Status:** Final. This is the authoritative source for all IP gauge, speed and ability-tier timing.

It gives one speed stat, three ability tiers, and the timing that results from them.

Related: [combat-core.md](combat-core.md) (turn flow and what happens at COM/ACT) · [tuning.md](../tuning.md) · [glossary.md](../glossary.md)

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

