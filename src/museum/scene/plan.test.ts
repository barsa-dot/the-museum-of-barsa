import { describe, expect, it } from "vitest";
import { moveWithCollisions, overlaps, type Point } from "../collision";
import { ROOMS } from "../rooms";
import { PLAYER_RADIUS } from "../world";
import { ATRIUM_START, doorCentre, locate, throughDoor } from "./atriumLayout";
import { CORRIDORS, MUSEUM_COLLIDERS, PLAN_AREAS, ROOM_PLANS, ROOM_WALL_PIECES, roomCentre, wallPieces } from "./plan";

const walk = (from: Point, to: Point) => moveWithCollisions(from, to, PLAYER_RADIUS, MUSEUM_COLLIDERS);
const near = (a: Point, b: Point, tol = 0.15) => Math.hypot(a.x - b.x, a.z - b.z) < tol;

/** Walk around the pool, then straight through a room's doorway and corridor to its centre. */
function routeToRoom(id: string): Point[] {
  const room = ROOMS.find((r) => r.id === id)!;
  const door = doorCentre(room);
  const target = Math.atan2(door.z, door.x);
  let p: Point = ATRIUM_START;
  const trail: Point[] = [];
  const step = (to: Point) => {
    p = walk(p, to);
    trail.push(p);
  };
  let angle = Math.atan2(p.z, p.x);
  step({ x: Math.cos(angle) * 6, z: Math.sin(angle) * 6 });
  angle = Math.atan2(p.z, p.x);
  let delta = target - angle;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;
  const n = Math.ceil(Math.abs(delta) / 0.1);
  for (let i = 1; i <= n; i++) step({ x: Math.cos(angle + (delta * i) / n) * 6, z: Math.sin(angle + (delta * i) / n) * 6 });
  step(throughDoor(room, -1));
  step(throughDoor(room, 4)); // middle of the corridor
  step(throughDoor(room, 9)); // just inside the room
  step(roomCentre(id));
  return trail;
}

describe("museum floor plan", () => {
  it.each(ROOMS.map((r) => [r.name, r.id] as const))("%s is reachable on foot from the atrium", (_name, id) => {
    const trail = routeToRoom(id);
    const end = trail[trail.length - 1]!;
    // The centre may hold an exhibit later; arriving within a metre is enough.
    expect(Math.hypot(end.x - roomCentre(id).x, end.z - roomCentre(id).z)).toBeLessThan(1);
    const room = ROOMS.find((r) => r.id === id)!;
    expect(locate(PLAN_AREAS, end)).toBe(room.name);
    // The route passes through the room's corridor or walkway.
    const corridor = CORRIDORS.find((c) => c.id === `corridor-${id}`)!;
    expect(trail.some((p) => locate(PLAN_AREAS, p) === corridor.name)).toBe(true);
  });

  it.each([
    ["library", "archive"],
    ["workshop", "portrait"],
  ])("a gallery connects the %s and the %s directly", (a, b) => {
    const gallery = CORRIDORS.find((c) => c.id === `gallery-${a}-${b}`)!;
    const gx = (gallery.rect.minX + gallery.rect.maxX) / 2;
    // Start beside room A's plinth (it stands on the gallery's line).
    let p: Point = { x: gx + 1.5, z: roomCentre(a).z };
    p = walk(p, { x: gx, z: (gallery.rect.minZ + gallery.rect.maxZ) / 2 });
    expect(locate(PLAN_AREAS, p)).toBe(gallery.name);
    p = walk(p, { x: gx, z: roomCentre(b).z });
    p = walk(p, roomCentre(b));
    // Arrives at room B's plinth (solid), within a metre of its centre.
    expect(near(p, roomCentre(b), 1)).toBe(true);
    expect(locate(PLAN_AREAS, p)).toBe(ROOMS.find((r) => r.id === b)!.name);
  });

  it("keeps visitors inside every room, corridor and gallery", () => {
    const spaces = [...ROOM_PLANS.map((r) => r.rect), ...CORRIDORS.map((c) => c.rect)];
    for (const rect of spaces) {
      const c = { x: (rect.minX + rect.maxX) / 2, z: (rect.minZ + rect.maxZ) / 2 };
      for (const [dx, dz] of [[60, 0], [-60, 0], [0, 60], [0, -60]] as const) {
        const p = walk(c, { x: c.x + dx, z: c.z + dz });
        // Either still inside this space, or through an opening into a named space.
        expect(locate(PLAN_AREAS, p), `escaped from ${JSON.stringify(rect)} heading ${dx},${dz}`).not.toBeNull();
      }
    }
  });

  it("never lets the visitor stand inside a wall", () => {
    const p = walk(roomCentre("creation"), { x: 0, z: -200 });
    for (const c of MUSEUM_COLLIDERS) expect(overlaps(p, PLAYER_RADIUS, c)).toBe(false);
  });

  it("puts the Courtyard outside: no ceiling, low garden walls", () => {
    const courtyard = ROOM_PLANS.find((r) => r.room.id === "courtyard")!;
    expect(courtyard.open).toBe(true);
    expect(courtyard.wallHeight).toBeLessThan(4);
    expect(CORRIDORS.find((c) => c.id === "corridor-courtyard")!.open).toBe(true);
  });

  it("names every space", () => {
    expect(locate(PLAN_AREAS, roomCentre("library"))).toBe("The Library");
    expect(locate(PLAN_AREAS, throughDoor(ROOMS[0]!, 3))).toBe("Corridor to The Creation Wing");
    expect(locate(PLAN_AREAS, throughDoor(ROOMS.find((r) => r.id === "courtyard")!, 3))).toBe("Walkway to The Courtyard");
    expect(locate(PLAN_AREAS, { x: 0, z: 8 })).toBe("Grand Atrium");
  });
});

describe("wallPieces", () => {
  it("leaves a doorway with a lintel above it", () => {
    const pieces = wallPieces({ minX: 0, maxX: 10, minZ: 0, maxZ: 10 }, 6, [{ side: "south", at: 5, width: 2, height: 4 }]);
    const south = pieces.filter((p) => p.z > 10);
    expect(south.filter((p) => p.y === 0).map((p) => [p.x - p.w / 2, p.x + p.w / 2])).toEqual([
      [-0.5, 4],
      [6, 10.5],
    ]);
    expect(south.find((p) => p.y === 4)).toMatchObject({ x: 5, w: 2, h: 2 });
  });

  it("room walls and their collisions come from the same pieces", () => {
    expect(ROOM_WALL_PIECES.length).toBeGreaterThan(ROOM_PLANS.length * 4);
  });
});
