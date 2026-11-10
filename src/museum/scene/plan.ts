// The museum's floor plan beyond the atrium: corridors to every room, the
// room shells, two side galleries (Library ↔ Archive, Workshop ↔ Portrait
// Room) and the open-air Courtyard.
//
// Walls are described once, as 3D pieces (wallPieces). Rendering draws all
// of them; collision uses the ones standing on the floor. So what you see is
// exactly what stops you.
//
// Units are metres; north is -Z. Pure data, no Three.js.

import { box, type BoxCollider, type Collider } from "../collision";
import { ROOMS, type RoomDef, type Side } from "../rooms";
import { ATRIUM, ATRIUM_AREA, ATRIUM_COLLIDERS, doorCentre, type Area } from "./atriumLayout";

export interface Rect {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface Opening {
  side: Side;
  /** Centre along the wall: x for north/south walls, z for east/west walls. */
  at: number;
  width: number;
  height: number;
}

/** An axis-aligned block of wall. `y` is its base; solid pieces stand on the floor. */
export interface WallPiece {
  x: number;
  y: number;
  z: number;
  w: number; // size along x
  h: number; // height
  d: number; // size along z
}

const T = ATRIUM.wallThickness;
/** Distance from the atrium centre to the near wall of the outer rooms. */
const ROOM_NEAR = 22;
export const CORRIDOR = { width: ATRIUM.doorWidth, height: ATRIUM.doorSpring + ATRIUM.doorWidth / 2 + 0.2 } as const;
export const ROOM_HEIGHT = 6.5;
export const GALLERY = { width: 2.4, height: 3.2 } as const;
export const DOOR_HEIGHT = 4;

/**
 * Walls around a rectangle, with openings. North/south walls run the full
 * width including the corners; east/west walls fill between them (same as
 * roomWalls in collision.ts). Openings leave a gap with a lintel above.
 */
export function wallPieces(rect: Rect, height: number, openings: readonly Opening[] = [], t = T): WallPiece[] {
  const pieces: WallPiece[] = [];
  const run = (side: Side, start: number, end: number) => {
    const gaps = openings.filter((o) => o.side === side).sort((a, b) => a.at - b.at);
    const spans: [number, number, number, number][] = []; // [from, to, base, top]
    let cursor = start;
    for (const g of gaps) {
      const a = g.at - g.width / 2;
      const b = g.at + g.width / 2;
      if (a > cursor) spans.push([cursor, a, 0, height]);
      if (g.height < height) spans.push([a, b, g.height, height]);
      cursor = b;
    }
    if (end > cursor) spans.push([cursor, end, 0, height]);
    for (const [from, to, base, top] of spans) {
      const along = (from + to) / 2;
      const len = to - from;
      const h = top - base;
      const y = base;
      switch (side) {
        case "north":
          pieces.push({ x: along, y, z: rect.minZ - t / 2, w: len, h, d: t });
          break;
        case "south":
          pieces.push({ x: along, y, z: rect.maxZ + t / 2, w: len, h, d: t });
          break;
        case "west":
          pieces.push({ x: rect.minX - t / 2, y, z: along, w: t, h, d: len });
          break;
        case "east":
          pieces.push({ x: rect.maxX + t / 2, y, z: along, w: t, h, d: len });
          break;
      }
    }
  };
  run("north", rect.minX - t, rect.maxX + t);
  run("south", rect.minX - t, rect.maxX + t);
  run("west", rect.minZ, rect.maxZ);
  run("east", rect.minZ, rect.maxZ);
  return pieces;
}

/** Collision footprints of the pieces that stand on the floor. */
export function solidFootprints(pieces: readonly WallPiece[]): BoxCollider[] {
  return pieces.filter((p) => p.y === 0).map((p) => box(p.x - p.w / 2, p.x + p.w / 2, p.z - p.d / 2, p.z + p.d / 2));
}

// ---------- Rooms ----------

export interface RoomPlan {
  room: RoomDef;
  rect: Rect;
  openings: Opening[];
  /** No ceiling: open to the sky. */
  open: boolean;
  wallHeight: number;
}

/** Side of a room that faces back towards the atrium. */
const FACING_ATRIUM: Record<Side, Side> = { north: "south", south: "north", west: "east", east: "west" };

const RECTS: Record<string, Rect> = {
  creation: { minX: -9, maxX: 9, minZ: -38, maxZ: -ROOM_NEAR },
  library: { minX: -36, maxX: -ROOM_NEAR, minZ: -16, maxZ: -1 },
  archive: { minX: -36, maxX: -ROOM_NEAR, minZ: 1, maxZ: 16 },
  workshop: { minX: ROOM_NEAR, maxX: 36, minZ: -16, maxZ: -1 },
  portrait: { minX: ROOM_NEAR, maxX: 36, minZ: 1, maxZ: 16 },
  courtyard: { minX: -12, maxX: 12, minZ: ROOM_NEAR, maxZ: 38 },
};

/** Side galleries: [room, side of that room, position along it]. */
const GALLERIES: { a: [string, Side]; b: [string, Side]; at: number }[] = [
  { a: ["library", "south"], b: ["archive", "north"], at: -29 },
  { a: ["workshop", "south"], b: ["portrait", "north"], at: 29 },
];

export const ROOM_PLANS: readonly RoomPlan[] = ROOMS.map((room) => {
  const openings: Opening[] = [
    { side: FACING_ATRIUM[room.side], at: room.at, width: CORRIDOR.width, height: DOOR_HEIGHT },
  ];
  for (const g of GALLERIES) {
    for (const [id, side] of [g.a, g.b]) {
      if (id === room.id) openings.push({ side, at: g.at, width: GALLERY.width, height: GALLERY.height });
    }
  }
  const open = room.id === "courtyard";
  return { room, rect: RECTS[room.id]!, openings, open, wallHeight: open ? 3 : ROOM_HEIGHT };
});

// ---------- Corridors and galleries ----------

export interface CorridorPlan {
  id: string;
  name: string;
  rect: Rect;
  /** Long axis: walls run along the other sides. */
  axis: "x" | "z";
  height: number;
  /** Open-air walkway (to the Courtyard): low walls, no ceiling. */
  open: boolean;
}

function corridorRect(room: RoomDef): Rect {
  const d = doorCentre(room);
  const w = CORRIDOR.width / 2;
  const inner = ATRIUM.half + T; // atrium wall's outer face
  const outer = ROOM_NEAR - T; // room wall's outer face
  switch (room.side) {
    case "north":
      return { minX: d.x - w, maxX: d.x + w, minZ: -outer, maxZ: -inner };
    case "south":
      return { minX: d.x - w, maxX: d.x + w, minZ: inner, maxZ: outer };
    case "west":
      return { minX: -outer, maxX: -inner, minZ: d.z - w, maxZ: d.z + w };
    case "east":
      return { minX: inner, maxX: outer, minZ: d.z - w, maxZ: d.z + w };
  }
}

export const CORRIDORS: readonly CorridorPlan[] = [
  ...ROOMS.map((room): CorridorPlan => {
    const open = room.id === "courtyard";
    return {
      id: `corridor-${room.id}`,
      name: open ? `Walkway to ${room.name}` : `Corridor to ${room.name}`,
      rect: corridorRect(room),
      axis: room.side === "north" || room.side === "south" ? "z" : "x",
      height: open ? 1.1 : CORRIDOR.height,
      open,
    };
  }),
  ...GALLERIES.map((g): CorridorPlan => {
    const a = RECTS[g.a[0]]!;
    const b = RECTS[g.b[0]]!;
    const names = ROOMS.filter((r) => r.id === g.a[0] || r.id === g.b[0]).map((r) => r.name.replace(/^The /, ""));
    return {
      id: `gallery-${g.a[0]}-${g.b[0]}`,
      name: `Gallery: ${names.join(" ↔ ")}`,
      rect: { minX: g.at - GALLERY.width / 2, maxX: g.at + GALLERY.width / 2, minZ: a.maxZ + T, maxZ: b.minZ - T },
      axis: "z",
      height: GALLERY.height + 0.4,
      open: false,
    };
  }),
];

/** Side walls of a corridor (its ends are open into the spaces it joins). */
export function corridorWallPieces(c: CorridorPlan): WallPiece[] {
  const { rect, height } = c;
  if (c.axis === "x") {
    const len = rect.maxX - rect.minX;
    const x = (rect.minX + rect.maxX) / 2;
    return [
      { x, y: 0, z: rect.minZ - T / 2, w: len, h: height, d: T },
      { x, y: 0, z: rect.maxZ + T / 2, w: len, h: height, d: T },
    ];
  }
  const len = rect.maxZ - rect.minZ;
  const z = (rect.minZ + rect.maxZ) / 2;
  return [
    { x: rect.minX - T / 2, y: 0, z, w: T, h: height, d: len },
    { x: rect.maxX + T / 2, y: 0, z, w: T, h: height, d: len },
  ];
}

// ---------- The whole museum ----------

export const PLAN_AREAS: readonly Area[] = [
  ...CORRIDORS.map((c) => ({ name: c.name, ...c.rect })),
  ...ROOM_PLANS.map((r) => ({ name: r.room.name, ...r.rect })),
  ATRIUM_AREA,
];

export const ROOM_WALL_PIECES: readonly WallPiece[] = ROOM_PLANS.flatMap((r) => wallPieces(r.rect, r.wallHeight, r.openings));
export const CORRIDOR_WALL_PIECES: readonly WallPiece[] = CORRIDORS.flatMap(corridorWallPieces);

/** Walls of the whole museum (atrium, rooms, corridors, galleries). */
export const MUSEUM_COLLIDERS: readonly Collider[] = [
  ...ATRIUM_COLLIDERS,
  ...solidFootprints(ROOM_WALL_PIECES),
  ...solidFootprints(CORRIDOR_WALL_PIECES),
];

export function roomCentre(id: string): { x: number; z: number } {
  const r = RECTS[id]!;
  return { x: (r.minX + r.maxX) / 2, z: (r.minZ + r.maxZ) / 2 };
}
