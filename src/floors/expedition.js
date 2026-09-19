import { generateBspFloor } from "./generated.js";
// Keep floor one reproducible in the standalone generator; subsequent floors vary.
export function generateExpeditionFloor(seed, floor) {
  const map = generateBspFloor(floor === 1 ? seed : `${seed}:floor-${floor}`);
  map.floor = floor;
  if (floor === 3) {
    const room = map.rooms.find((r) => r.role === "stairs");
    const guardian = map.enemies.find((e) => e.roomId === room.id);
    if (!guardian) throw Error("Stair room needs a guardian position");
    Object.assign(guardian, { id: "warden", kind: "boss", boss: true });
  }
  return map;
}
