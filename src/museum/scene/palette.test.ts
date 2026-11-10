import { describe, expect, it } from "vitest";
import { floorGeometry, FLOOR_TILE } from "./floor";
import { scenePalette } from "./palette";

describe("mode-aware museum presentation", () => {
  const dev = scenePalette("developer");
  const biz = scenePalette("business");

  it("differs in architecture, not just colour", () => {
    expect(dev.style).toEqual({ floor: "grid", walls: "crown", columns: "rings", frames: "bezel" });
    expect(biz.style).toEqual({ floor: "tiles", walls: "rails", columns: "classical", frames: "mat" });
    for (const key of Object.keys(dev.style) as (keyof typeof dev.style)[]) expect(dev.style[key]).not.toBe(biz.style[key]);
  });

  it("uses each mode's own colours", () => {
    expect(dev.background).not.toBe(biz.background);
    expect(dev.glow).not.toBe(biz.glow);
  });
});

describe("floorGeometry", () => {
  it("repeats the pattern once per tile, whatever the floor's size", () => {
    const g = floorGeometry(10, 6);
    const uv = g.attributes.uv!;
    const us = Array.from({ length: uv.count }, (_, i) => uv.getX(i));
    const vs = Array.from({ length: uv.count }, (_, i) => uv.getY(i));
    expect(Math.max(...us)).toBeCloseTo(10 / FLOOR_TILE);
    expect(Math.max(...vs)).toBeCloseTo(6 / FLOOR_TILE);
  });
});
