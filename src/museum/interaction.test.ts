import { describe, expect, it } from "vitest";
import { angleTo, nearestInteractable, type Interactable } from "./interaction";

const item = (id: string, x: number, z: number, radius = 2.5): Interactable => ({ id, label: id, verb: "View", x, z, radius });
const facingNorth = { x: 0, z: 0, yaw: 0, pitch: 0 }; // looking down -Z

describe("angleTo", () => {
  it("is zero straight ahead and π behind", () => {
    expect(angleTo(facingNorth, { x: 0, z: -3 })).toBeCloseTo(0);
    expect(angleTo(facingNorth, { x: 0, z: 3 })).toBeCloseTo(Math.PI);
  });

  it("follows the facing direction", () => {
    expect(angleTo({ ...facingNorth, yaw: Math.PI / 2 }, { x: -3, z: 0 })).toBeCloseTo(0);
  });
});

describe("nearestInteractable", () => {
  it("offers an item the visitor is near and facing", () => {
    expect(nearestInteractable(facingNorth, [item("a", 0, -2)])?.id).toBe("a");
  });

  it("ignores items out of range", () => {
    expect(nearestInteractable(facingNorth, [item("a", 0, -4)])).toBeNull();
  });

  it("ignores items behind the visitor", () => {
    expect(nearestInteractable(facingNorth, [item("a", 0, 2)])).toBeNull();
  });

  it("still offers an item when standing right on top of it", () => {
    expect(nearestInteractable(facingNorth, [item("a", 0.1, 0.2)])?.id).toBe("a");
  });

  it("picks the closest of several", () => {
    expect(nearestInteractable(facingNorth, [item("far", 0.5, -2.2), item("near", -0.3, -1)])?.id).toBe("near");
  });
});
