// 2D collision on the floor plane (x, z). The player is a circle; solid
// geometry is axis-aligned boxes and circles. Floors are flat with no
// gravity, so the player can't fall; this module stops them walking through
// walls, pillars and out of the building.
//
// Resolution pushes the player out along the contact normal, which makes
// them slide along walls rather than stick. Long moves are split into small
// steps so nothing can be tunnelled through.

export interface BoxCollider {
  kind: "box";
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface CircleCollider {
  kind: "circle";
  x: number;
  z: number;
  r: number;
}

export type Collider = BoxCollider | CircleCollider;

export interface Point {
  x: number;
  z: number;
}

/** Maximum distance moved per sub-step; well below the player's radius. */
const MAX_STEP = 0.1;
const PUSH_ITERATIONS = 3;

export const box = (minX: number, maxX: number, minZ: number, maxZ: number): BoxCollider => ({ kind: "box", minX, maxX, minZ, maxZ });
export const circle = (x: number, z: number, r: number): CircleCollider => ({ kind: "circle", x, z, r });

/** A box centred on (x, z) with the given full width and depth. */
export const boxAt = (x: number, z: number, width: number, depth: number): BoxCollider =>
  box(x - width / 2, x + width / 2, z - depth / 2, z + depth / 2);

/** Pushes a circle of `radius` at `p` out of one collider. Returns the corrected point. */
function pushOut(p: Point, radius: number, c: Collider): Point {
  if (c.kind === "circle") {
    const dx = p.x - c.x;
    const dz = p.z - c.z;
    const dist = Math.hypot(dx, dz);
    const min = radius + c.r;
    if (dist >= min) return p;
    if (dist === 0) return { x: c.x + min, z: c.z };
    return { x: c.x + (dx / dist) * min, z: c.z + (dz / dist) * min };
  }
  const cx = Math.max(c.minX, Math.min(p.x, c.maxX));
  const cz = Math.max(c.minZ, Math.min(p.z, c.maxZ));
  const dx = p.x - cx;
  const dz = p.z - cz;
  const dist = Math.hypot(dx, dz);
  if (dist >= radius) return p;
  if (dist > 0) return { x: cx + (dx / dist) * radius, z: cz + (dz / dist) * radius };
  // Centre is inside the box: leave by the nearest face.
  const exits = [
    { x: c.minX - radius, z: p.z, d: p.x - c.minX },
    { x: c.maxX + radius, z: p.z, d: c.maxX - p.x },
    { x: p.x, z: c.minZ - radius, d: p.z - c.minZ },
    { x: p.x, z: c.maxZ + radius, d: c.maxZ - p.z },
  ];
  const best = exits.reduce((a, b) => (b.d < a.d ? b : a));
  return { x: best.x, z: best.z };
}

export function overlaps(p: Point, radius: number, c: Collider): boolean {
  const q = pushOut(p, radius, c);
  return q.x !== p.x || q.z !== p.z;
}

function settle(p: Point, radius: number, colliders: readonly Collider[]): Point {
  let q = p;
  for (let i = 0; i < PUSH_ITERATIONS; i++) {
    let moved = false;
    for (const c of colliders) {
      const next = pushOut(q, radius, c);
      if (next.x !== q.x || next.z !== q.z) {
        q = next;
        moved = true;
      }
    }
    if (!moved) break;
  }
  return q;
}

/** Moves from `from` towards `to`, sliding along anything solid. */
export function moveWithCollisions(from: Point, to: Point, radius: number, colliders: readonly Collider[]): Point {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / MAX_STEP));
  let p = from;
  for (let i = 0; i < steps; i++) {
    p = settle({ x: p.x + dx / steps, z: p.z + dz / steps }, radius, colliders);
  }
  return p;
}

/**
 * Solid walls for a rectangular room, leaving gaps for doorways.
 * Each opening is on one side, centred at `at` (x for north/south walls,
 * z for east/west walls), `width` wide.
 */
export function roomWalls(
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
  thickness: number,
  openings: { side: "north" | "south" | "east" | "west"; at: number; width: number }[] = [],
): BoxCollider[] {
  const walls: BoxCollider[] = [];
  const t = thickness;
  const segments = (start: number, end: number, gaps: { at: number; width: number }[]) => {
    const sorted = [...gaps].sort((a, b) => a.at - b.at);
    const out: [number, number][] = [];
    let cursor = start;
    for (const g of sorted) {
      out.push([cursor, g.at - g.width / 2]);
      cursor = g.at + g.width / 2;
    }
    out.push([cursor, end]);
    return out.filter(([a, b]) => b - a > 1e-6);
  };
  const on = (side: string) => openings.filter((o) => o.side === side);
  for (const [a, b] of segments(minX - t, maxX + t, on("north"))) walls.push(box(a, b, minZ - t, minZ));
  for (const [a, b] of segments(minX - t, maxX + t, on("south"))) walls.push(box(a, b, maxZ, maxZ + t));
  for (const [a, b] of segments(minZ, maxZ, on("west"))) walls.push(box(minX - t, minX, a, b));
  for (const [a, b] of segments(minZ, maxZ, on("east"))) walls.push(box(maxX, maxX + t, a, b));
  return walls;
}
