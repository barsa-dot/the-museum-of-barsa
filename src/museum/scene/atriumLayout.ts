// Grand Atrium layout: pure geometry (no Three.js), shared by the renderer,
// collisions, prompts and tests. Units are metres; north is -Z.

import { circle, roomWalls, type Collider } from "../collision";
import type { PlayerState } from "../movement";
import { ROOMS, type RoomDef, type Side } from "../rooms";

export const ATRIUM = {
  half: 14,
  height: 9,
  wallThickness: 0.5,
  doorWidth: 3,
  /** Height where the doorway's straight sides end and the arch begins. */
  doorSpring: 3.8,
  pool: { radius: 3.2, rim: 0.35 },
  colonnadeRadius: 8.5,
  /** Half-width of the monolith standing in the pool. */
  monolithHalf: 0.5,
  columnRadius: 0.35,
} as const;

export interface Area {
  name: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/** Unit vector pointing out of the atrium through a wall, and along the wall. */
export function sideVectors(side: Side): { out: [number, number]; along: [number, number] } {
  switch (side) {
    case "north":
      return { out: [0, -1], along: [1, 0] };
    case "south":
      return { out: [0, 1], along: [1, 0] };
    case "west":
      return { out: [-1, 0], along: [0, 1] };
    case "east":
      return { out: [1, 0], along: [0, 1] };
  }
}

/** Centre of a room's doorway, on the atrium wall line. */
export function doorCentre(room: RoomDef): { x: number; z: number } {
  const { out, along } = sideVectors(room.side);
  return { x: out[0] * ATRIUM.half + along[0] * room.at, z: out[1] * ATRIUM.half + along[1] * room.at };
}

/** A point `distance` metres through the doorway (positive = outwards). */
export function throughDoor(room: RoomDef, distance: number): { x: number; z: number } {
  const c = doorCentre(room);
  const { out } = sideVectors(room.side);
  return { x: c.x + out[0] * distance, z: c.z + out[1] * distance };
}

/** Angle (radians, Three.js yaw) that faces out through the given side. */
export function yawFacing(side: Side): number {
  return { north: 0, west: Math.PI / 2, south: Math.PI, east: -Math.PI / 2 }[side];
}

/**
 * Column angles around the pool. Columns fill the gaps between the routes to
 * the doors, so every doorway stays visible from the pool.
 */
export function columnPositions(): { x: number; z: number }[] {
  const routes = ROOMS.map((r) => {
    const d = doorCentre(r);
    return Math.atan2(d.z, d.x);
  }).sort((a, b) => a - b);
  const out: { x: number; z: number }[] = [];
  for (let i = 0; i < routes.length; i++) {
    const a = routes[i]!;
    const b = i + 1 < routes.length ? routes[i + 1]! : routes[0]! + Math.PI * 2;
    const gap = b - a;
    const count = gap > (60 * Math.PI) / 180 ? 2 : 1;
    for (let k = 1; k <= count; k++) {
      const angle = a + (gap * k) / (count + 1);
      out.push({ x: Math.cos(angle) * ATRIUM.colonnadeRadius, z: Math.sin(angle) * ATRIUM.colonnadeRadius });
    }
  }
  return out;
}

export function locate(areas: readonly Area[], p: { x: number; z: number }): string | null {
  return areas.find((a) => p.x >= a.minX && p.x <= a.maxX && p.z >= a.minZ && p.z <= a.maxZ)?.name ?? null;
}

export const ATRIUM_AREA: Area = { name: "Grand Atrium", minX: -ATRIUM.half, maxX: ATRIUM.half, minZ: -ATRIUM.half, maxZ: ATRIUM.half };

/**
 * Just inside the south entrance, a little off-centre and turned slightly
 * towards the pool, so the monolith and the north doorway beyond it are both
 * in view.
 */
export const ATRIUM_START: PlayerState = { x: 1.6, z: 12.2, yaw: 0.06, pitch: 0 };

/** The atrium's solid parts: walls (with the six doorways), pool and columns. */
export const ATRIUM_COLLIDERS: readonly Collider[] = [
  ...roomWalls(
    -ATRIUM.half,
    ATRIUM.half,
    -ATRIUM.half,
    ATRIUM.half,
    ATRIUM.wallThickness,
    ROOMS.map((r) => ({ side: r.side, at: r.at, width: ATRIUM.doorWidth })),
  ),
  circle(0, 0, ATRIUM.pool.radius + ATRIUM.pool.rim),
  ...columnPositions().map((c) => circle(c.x, c.z, ATRIUM.columnRadius)),
];
