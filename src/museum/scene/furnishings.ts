// Room furnishings: give each room a character (bookcases, filing cabinets,
// a workbench, a bench, courtyard planters). Pure data with collisions.
// Kept clear of room centres, doorways and the spots where visitors stand
// to look at exhibits (checked by tests).

import { boxAt, type Collider } from "../collision";

export type FurnishingKind = "bookcase" | "cabinet" | "workbench" | "pegboard" | "bench" | "planter";

export interface Furnishing {
  kind: FurnishingKind;
  x: number;
  z: number;
  /** Footprint size (x by z) and height. */
  w: number;
  d: number;
  h: number;
  /** Mounted on a wall: drawn, but the wall already blocks the visitor. */
  wallMounted?: boolean;
}

const range = (from: number, to: number, step: number) => {
  const out: number[] = [];
  for (let v = from; v <= to + 1e-9; v += step) out.push(v);
  return out;
};

export const FURNISHINGS: readonly Furnishing[] = [
  // Library: bookcases along the north wall.
  ...[-34, -30.5, -27, -23.5].map((x): Furnishing => ({ kind: "bookcase", x, z: -15.7, w: 2.2, d: 0.6, h: 3.2 })),
  // Archive: a row of filing cabinets along the south wall.
  ...range(-34.5, -23.5, 1.1).map((x): Furnishing => ({ kind: "cabinet", x, z: 15.7, w: 1, d: 0.6, h: 1.3 })),
  // Workshop: a workbench under a pegboard on the north wall.
  { kind: "workbench", x: 29, z: -14.4, w: 3.4, d: 1, h: 0.95 },
  { kind: "pegboard", x: 29, z: -15.98, w: 4.2, d: 0.04, h: 2, wallMounted: true },
  // Portrait Room: a bench facing the portrait.
  { kind: "bench", x: 31, z: 8.5, w: 0.6, d: 2.4, h: 0.45 },
  // Courtyard: four planted beds and a bench.
  ...[[-8, 26], [8, 26], [-8, 34], [8, 34]].map(([x, z]): Furnishing => ({ kind: "planter", x: x!, z: z!, w: 1.8, d: 1.8, h: 0.6 })),
  { kind: "bench", x: -5, z: 30, w: 2.4, d: 0.6, h: 0.45 },
];

export const FURNISHING_COLLIDERS: readonly Collider[] = FURNISHINGS.filter((f) => !f.wallMounted).map((f) => boxAt(f.x, f.z, f.w, f.d));

