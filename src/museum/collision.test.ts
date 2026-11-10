import { describe, expect, it } from "vitest";
import { box, boxAt, circle, moveWithCollisions, overlaps, roomWalls } from "./collision";

const R = 0.35;

describe("moveWithCollisions", () => {
  it("moves freely in open space", () => {
    const p = moveWithCollisions({ x: 0, z: 0 }, { x: 1, z: -2 }, R, []);
    expect(p.x).toBeCloseTo(1);
    expect(p.z).toBeCloseTo(-2);
  });

  it("stops at a wall instead of passing through it", () => {
    const wall = box(-5, 5, -3.2, -3); // thin wall across the path
    const p = moveWithCollisions({ x: 0, z: 0 }, { x: 0, z: -6 }, R, [wall]);
    expect(p.z).toBeCloseTo(-3 + R);
    expect(overlaps(p, R, wall)).toBe(false);
  });

  it("cannot tunnel through a thin wall even with a huge step", () => {
    const wall = box(-5, 5, -1.05, -1);
    const p = moveWithCollisions({ x: 0, z: 0 }, { x: 0, z: -50 }, R, [wall]);
    expect(p.z).toBeGreaterThan(-1);
  });

  it("slides along a wall when walking diagonally into it", () => {
    const wall = box(-10, 10, -2.2, -2);
    const p = moveWithCollisions({ x: 0, z: -1.5 }, { x: 2, z: -3.5 }, R, [wall]);
    expect(p.x).toBeCloseTo(2, 1);
    expect(p.z).toBeCloseTo(-2 + R);
  });

  it("is blocked by round pillars and slides around them", () => {
    const pillar = circle(0, -2, 0.5);
    const p = moveWithCollisions({ x: 0.2, z: 0 }, { x: 0.2, z: -4 }, R, [pillar]);
    expect(Math.hypot(p.x - 0, p.z + 2)).toBeGreaterThanOrEqual(0.5 + R - 1e-6);
  });

  it("is pushed out if it starts inside a box", () => {
    const solid = boxAt(0, 0, 2, 2);
    const p = moveWithCollisions({ x: 0.9, z: 0 }, { x: 0.9, z: 0 }, R, [solid]);
    expect(overlaps(p, R, solid)).toBe(false);
  });

  it("handles inside corners without jitter or escape", () => {
    const walls = [box(-5, 5, -2.2, -2), box(1, 1.2, -5, 5)];
    const p = moveWithCollisions({ x: 0, z: 0 }, { x: 4, z: -4 }, R, walls);
    expect(p.x).toBeCloseTo(1 - R, 2);
    expect(p.z).toBeCloseTo(-2 + R, 2);
  });
});

describe("roomWalls", () => {
  const walls = roomWalls(-5, 5, -5, 5, 0.3, [{ side: "north", at: 0, width: 2 }]);

  it("keeps the player inside a closed side", () => {
    const p = moveWithCollisions({ x: 0, z: 0 }, { x: 0, z: 20 }, R, walls);
    expect(p.z).toBeLessThanOrEqual(5 - R + 1e-6);
  });

  it("lets the player walk through a doorway", () => {
    const p = moveWithCollisions({ x: 0, z: 0 }, { x: 0, z: -8 }, R, walls);
    expect(p.z).toBeCloseTo(-8);
  });

  it("guides a slightly off-centre player through the doorway instead of snagging on the frame", () => {
    const p = moveWithCollisions({ x: 0.9, z: 0 }, { x: 0.9, z: -8 }, R, walls);
    expect(p.z).toBeLessThan(-5.5);
  });

  it("blocks a gap narrower than the player", () => {
    const narrow = roomWalls(-5, 5, -5, 5, 0.3, [{ side: "north", at: 0, width: 0.5 }]);
    const p = moveWithCollisions({ x: 0, z: 0 }, { x: 0, z: -8 }, R, narrow);
    expect(p.z).toBeGreaterThan(-5);
  });
});
