import { describe, expect, it } from "vitest";
import { moveWithCollisions, overlaps } from "../collision";
import { angleTo } from "../interaction";
import { ROOMS } from "../rooms";
import { PLAYER_RADIUS } from "../world";
import { ATRIUM, ATRIUM_AREA, ATRIUM_COLLIDERS, ATRIUM_START, columnPositions, doorCentre, locate, yawFacing } from "./atriumLayout";

const walk = (from: { x: number; z: number }, to: { x: number; z: number }) => moveWithCollisions(from, to, PLAYER_RADIUS, ATRIUM_COLLIDERS);

describe("Grand Atrium layout", () => {
  it("has a doorway for each of the six rooms", () => {
    expect(ROOMS.map((r) => r.id).sort()).toEqual(["archive", "courtyard", "creation", "library", "portrait", "workshop"]);
  });

  it("starts the visitor in open floor, roughly facing north towards the pool", () => {
    for (const c of ATRIUM_COLLIDERS) expect(overlaps(ATRIUM_START, PLAYER_RADIUS, c)).toBe(false);
    expect(Math.abs(ATRIUM_START.yaw - yawFacing("north"))).toBeLessThan(0.3);
    expect(angleTo(ATRIUM_START, { x: 0, z: 0 })).toBeLessThan(0.35);
  });

  it("keeps the north doorway visible past the monolith from the start (clear sightline)", () => {
    const s = ATRIUM_START;
    const door = doorCentre(ROOMS.find((r) => r.side === "north")!);
    const dx = door.x - s.x;
    const dz = door.z - s.z;
    const t = -(s.x * dx + s.z * dz) / (dx * dx + dz * dz);
    expect(Math.hypot(s.x + dx * t, s.z + dz * t)).toBeGreaterThan(ATRIUM.monolithHalf + 0.3);
    expect(angleTo(s, door)).toBeLessThan((35 * Math.PI) / 180);
  });

  it("does not let visitors walk into the pool", () => {
    const p = walk({ x: 0, z: 8 }, { x: 0, z: 0 });
    expect(Math.hypot(p.x, p.z)).toBeGreaterThanOrEqual(ATRIUM.pool.radius + ATRIUM.pool.rim + PLAYER_RADIUS - 1e-6);
  });

  it("keeps visitors inside the atrium away from doorways", () => {
    const p = walk({ x: 8, z: 8 }, { x: 30, z: 8 });
    expect(p.x).toBeLessThanOrEqual(ATRIUM.half - PLAYER_RADIUS + 1e-6);
  });

  it("places columns off every route to a door", () => {
    const columns = columnPositions();
    expect(columns.length).toBeGreaterThanOrEqual(8);
    for (const room of ROOMS) {
      const d = doorCentre(room);
      const len = Math.hypot(d.x, d.z);
      for (const c of columns) {
        const t = Math.max(0, Math.min(1, (c.x * d.x + c.z * d.z) / (len * len)));
        expect(Math.hypot(c.x - d.x * t, c.z - d.z * t)).toBeGreaterThan(ATRIUM.columnRadius + PLAYER_RADIUS + 0.5);
      }
    }
  });

  it("names where the visitor is", () => {
    expect(locate([ATRIUM_AREA], ATRIUM_START)).toBe("Grand Atrium");
  });
});
