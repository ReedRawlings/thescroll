# Damage and Types

Numbers: [tuning.md](../tuning.md)

## Formula

```
EffectiveATK = AbilityATK + CharacterATK
BaseDamage   = EffectiveATK × 100 / (100 + DEF)
LevelMod     = clamp(1 + (AttackerLevel − DefenderLevel) × 0.02, 0.5, 1.5)
TypeMod      = 1.25 advantage / 1.00 neutral / 0.75 disadvantage

Damage       = BaseDamage × LevelMod × TypeMod
```

**Each ability carries its own base ATK, and the character's ATK adds to it.** The contribution is **additive, not multiplicative** — a Slow ability might have a base ATK of 30 where a Fast one has 5.

This is what differentiates the speed tiers. See [abilities.md](abilities.md) for the tier values and for how the differentiation holds up as character ATK grows.

### Worked example

A level 20 attacker with ATK 50 using a Normal ability of base ATK 15, against a level 20 defender with DEF 20, no type interaction:

```
EffectiveATK = 15 + 50 = 65
BaseDamage   = 65 × 100 / 120 = 54.2
LevelMod     = 1.00
TypeMod      = 1.00
Damage       = 54
```

This is the anchor behind the trash HP range in [combat-core.md](combat-core.md).

## Types

Four types: **Normal, Fire, Ice, Lightning.**

The advantage cycle is three-way:

```
Fire → Ice → Lightning → Fire
```

Each type deals **1.25×** to the type it beats and **0.75×** to the type that beats it.

**Normal sits outside the cycle entirely.** It is neutral in both directions — it deals 1.0× to everything and takes 1.0× from everything. Only a few monsters carry it. It is not a weakness and not a strength; it is the absence of a type interaction.

## Two level systems, deliberately different

The game uses level difference in two places with different scaling. This is intentional, not a leftover:

| | Step per level | Clamp | Reaches clamp at |
| --- | --- | --- | --- |
| **Damage** (`LevelMod`) | 0.02 | 0.50 – 1.50 | ±25 levels |
| **Speed** (`level_factor`) | 0.03 | 0.70 – 1.30 | ±10 levels |

Speed responds to level difference faster and saturates sooner. Note the consequence: **the speed factor stops responding at a 10-level gap.** The player's intended lag reaches −6 at floor 40 specifically so the math stays live at the summit. See [party.md](party.md).

`LevelMod` applies to both sides — an underlevelled player deals less *and* takes more.

## Open

- Whether damage has any variance roll, or is fully deterministic. Deterministic is the better fit for the outcome-preview promise.
- Critical hits — whether they exist at all.
- Whether DEF applies to status-effect damage (Burn).
- Healing and recovery formulas.
- Whether type interaction applies to status chance as well as damage.
