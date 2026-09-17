import { pathfind } from "../src/dungeon.js";

// Route long test journeys through visible waypoints, just as a player explores.
export async function tapTowerTile(page, x, y) {
  const s = await page.evaluate(() => JSON.parse(window.render_game_to_text()));
  const v = s.viewport;
  const route = pathfind(
    s.map,
    s.path[0] ?? { x: Math.round(s.player.x), y: Math.round(s.player.y) },
    { x, y },
  );
  let target = { x, y };
  for (const step of route) {
    if (
      Math.abs(step.x - s.player.x) > 4.5 ||
      Math.abs(step.y - s.player.y) > 4.5
    )
      break;
    target = step;
  }
  const box = await page.locator("canvas").boundingBox();
  await page.mouse.click(
    box.x +
      ((v.x + v.worldOffset.x + (target.x + 0.5) * v.tileSize) * box.width) /
        440,
    box.y +
      ((v.y + v.worldOffset.y + (target.y + 0.5) * v.tileSize) * box.height) /
        820,
  );
}
