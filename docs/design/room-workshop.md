# Room workshop

Open `/?editor=1`. Start from an empty room or one of three examples. Paint floor (walls follow automatically), select native-orientation assets, and mark entrances and content. Small tabletop details can share a tile with tables or boards. Undo restores the previous edit or loaded room.

Walk test supports click destinations, arrows and WASD. It tests room geometry and solid furniture; enemy, treasure, key and trap markers are annotations, not active gameplay. Connectivity and entrance checks update as you edit.

Save room stores named rooms in this browser. The current draft also survives reloads. Export file downloads portable JSON; Import file validates its structure, asset names and placements. Use exports to share rooms or keep durable backups. Reference rooms can be saved with unresolved checks; occasional templates must pass checks.

The workspace is 18×18 with margins for automatic walls. Template purpose, usage, weight, design notes, floor variants, native asset placements, and markers are preserved. Template integration into BSP is a future step: the generator does not currently load the saved library. Planned integration should admit at most one compatible room per floor, preserve orientation, and connect declared entrances without changing the authored furniture.

Keyboard history: Cmd/Ctrl Z undoes; Cmd/Ctrl Shift Z or Ctrl Y redoes. Text fields retain native text editing shortcuts. Choose an asset picture in the searchable/category-filtered palette; the current selection is shown above it. Replace asset swaps a clicked item at its original anchor if the selected asset fits. Failed replacements preserve the original.

Additional tile-sheet assets are available under Bridges, Acid pools, Pillars, Carpets, and Stairs. These retain original orientation and use explicit atlas rectangles. Void / gap paints terrain -1: unlike Erase floor, it suppresses automatically assembled walls. Void and acid block walk tests; bridge footprints restore walking over either. Carpets draw below furniture, pillars block at the base, and stair art is walkable without level-transition behavior. Old room files remain importable.

Doorway tool now accepts wall cells beside floor and opens them visually and in collision. Click the north cap or face to select its doorway; floor-edge markers from older files remain supported. Openings are one tile wide; adjacent doorway markers can form wider openings. Remove item restores the wall. These define connection points but do not yet connect separate room files into a generated floor.

For raised platforms, choose independent left/right pieces from Stairs, then drag Raised edge across the front between their lower ends. Raised edges are blocking front faces; stair artwork remains walkable. Raised edges category includes left, middle, and right face variants. This represents elevation visually with collision, not a multi-height simulation. Existing combined stair placements migrate into two native-orientation halves on import/load.

Terrain and placed content are independent layers: Paint void / Erase terrain never delete assets or markers. Use Remove item to remove placed content. Saving and importing preserve assets over changed terrain. Stairs and bridges provide walkable surfaces above void; unsupported markers produce validation warnings instead of being deleted.
