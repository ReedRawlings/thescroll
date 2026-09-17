# MiniRogue tileset assembly study

Open `/?tileset=1`. This isolated art bench compares simple blocks with provisional neighbor-selected wall caps, provides three geometry cases, and exposes source coordinates through a clickable atlas. It does not change the tower generator or exploration behavior.

Source: `Assets/MiniRogue Dungeon Premium/4 - Tiles/Tiles/16x16/Tile Dungeon.png` (160×208). The runtime study uses an unchanged copy at `public/assets/tileset-study.png`. Artist: Matheus Tanuri / Marth. Product reference: https://matheustanuri.itch.io/minirogue-dungeon

## Inspected pieces

Coordinates are zero-based columns and rows on the 16px grid. These are our visual interpretations, not author-provided metadata.

| Cells | Interpretation |
| --- | --- |
| (0–3, 0–1), (0–2, 2), (0–3, 3) | Floor textures and variations |
| (6,4), (7,4), (8,4) | Left, middle, right horizontal wall caps |
| (6,5), (7,5), (8,5) | Corresponding front faces |
| (3,8) | Isolated framed dark cap; provisional corner fallback |
| (5,9), (6,9), (7,9) | Dark cap pieces with left, no side, right border |
| (0,8) | Repeatable front face |
| (1,9), (1,10) | Brick wall face sections |
| (0–3,12) | Low wall strip, with ends and middle pieces |

## Findings and limits

- The three horizontal caps and their faces assemble into a consistent wall strip. The bench shows this at original proportions beneath the plan view.
- The assembly test now uses the same two-row horizontal wall as the reference strip: faces occupy boundary cells and caps project one row upward. Foreground caps can visually overlap floor; production actor occlusion and collision alignment remain to be tested.
- The conventional crop approach supports straight sections and existing floor variations without rotating or repainting art.
- Amber dots identify unresolved corner/junction/isolated-cap assignments. They are not proof that a suitable piece is absent: the sheet lacks semantic metadata, and not every artwork cell has been classified.
- Inward corners, diagonal contact, isolated blocks, and wall elevation at doorways still need production rules or composited artwork. The diagonal case consists of two disconnected floor regions by design; it tests art, not level solvability.
- No complete 16-configuration dual-grid terrain set has been verified. A 16px tile size does not establish dual-grid compatibility. Existing tile outlines are present in the artwork; switching rendering algorithms does not remove them automatically.

## Recommendation

Use conventional layered wall rendering with this pack first. Keep terrain identity separate from walkability and props. Introduce BSP and interior generation through map data independently. Resolve the highlighted geometry cases and test wall height/collision alignment before treating this art study as a production autotiler. Do not rotate directional wall faces to manufacture side walls.

## Verification

Production build passes. The skill Playwright client captured the final canvas. Browser checks exercised all three layouts, both render modes, grid on/off, atlas coordinate selection on desktop/mobile, and responsive page width, with no browser errors. Screenshots and the repeatable browser check are in `artifacts/tileset-study/`.

### User-confirmed upper-corner convention

At horizontal endpoints with a side wall continuing below, replace the face with the appropriate side connector (5,9 on the left; 7,9 on the right). Keep front faces across the interior horizontal span. This follows the user's supplied room screenshot. Other provisional junctions remain marked.
