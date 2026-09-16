# UI Interaction Grammar

> **Status:** screen references are available in `ExampleUI/`; remaining interaction details below need implementation defaults.

## The promise

From [vision.md](../vision.md):

> **Swipe to choose, tap to commit, and never fight the interface.**

Everything below serves that sentence. The game is portrait, one-thumb, and every interaction must be reachable without the thumb leaving the lower third of the screen.

## Established

These are implied by systems already specified, not yet by a UI spec:

- Ability selection is a **left/right swipe carousel**.
- Targets are selected manually by **swiping the focused target sprite**. Auto-targeting is deferred.
- The whole combat timeline pauses during player command selection; see [combat-core.md](../design/combat-core.md).
- The expected outcome is **previewed before commitment**.
- Exploration is **tap-to-move** — tap a destination, the character paths there; tap again to redirect; tap the character to stop. No virtual d-pad. See [exploration.md](../design/exploration.md).

## Open

The entire grammar. Every item below was listed in the original notes and none has a rule:

- Horizontal swipe threshold — distance and velocity.
- Snap behaviour on an incomplete swipe.
- Centre-tap behaviour.
- When target-swiping is enabled and when it is locked out.
- Future auto-target priority (deferred; not a first-pass blocker).
- Outcome-preview rules — what is shown, how precise it is, and what happens when the outcome is uncertain.
- When drawers appear and how they are dismissed.
- No-undo rules — where commitment is final and how that is signalled before the fact.
- Interruption and app suspension mid-combat, with a live timeline running.
- How tap-to-move and combat input coexist without the player mistaking one mode for the other.
- Whether the floor has a minimap, and how much of it is revealed.
- Camera behaviour on larger deep floors — follow, snap per room, or free.

On suspension: the app restores exactly where it was, mid-battle included. What needs specifying is the *presentation* — whether the timeline resumes immediately on return or after a brief countdown, so the player is not ambushed by a gauge that kept its position while they were away.
