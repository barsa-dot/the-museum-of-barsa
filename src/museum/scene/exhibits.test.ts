import { describe, expect, it } from "vitest";
import { MODES, profile, projects, viewFor, type Profile } from "../../data/profile";
import { overlaps, type Collider } from "../collision";
import { nearestInteractable } from "../interaction";
import { PLAYER_RADIUS } from "../world";
import { buildExhibits } from "./exhibits";
import { FURNISHINGS, FURNISHING_COLLIDERS } from "./furnishings";
import { buildMuseumWorld } from "./museum";
import { ROOM_PLANS, roomCentre } from "./plan";
import { withSampleSkills, withSamples } from "../../test/sampleRecords";

const verified = (p: Profile): Profile => ({
  ...p,
  experience: p.experience.map((r) => ({ ...r, verification: "verified", role: "Content writer" })),
  skills: p.skills.map((r) => ({ ...r, verification: "verified" })),
});

const specsFor = (mode: (typeof MODES)[number], source: Profile = profile) => buildExhibits(viewFor(source, projects, mode));
/**
 * Whether a visitor can walk from a to b inside a room by any route:
 * breadth-first search over a 25 cm grid of positions where they fit.
 */
function walkable(a: { x: number; z: number }, b: { x: number; z: number }, rect: { minX: number; maxX: number; minZ: number; maxZ: number }, colliders: readonly Collider[]): boolean {
  const step = 0.25;
  const cols = Math.floor((rect.maxX - rect.minX) / step) + 1;
  const rows = Math.floor((rect.maxZ - rect.minZ) / step) + 1;
  const cell = (p: { x: number; z: number }) => [Math.round((p.x - rect.minX) / step), Math.round((p.z - rect.minZ) / step)] as const;
  const free = (i: number, j: number) =>
    i >= 0 && j >= 0 && i < cols && j < rows && !colliders.some((c) => overlaps({ x: rect.minX + i * step, z: rect.minZ + j * step }, PLAYER_RADIUS, c));
  const [si, sj] = cell(a);
  const [ti, tj] = cell(b);
  const seen = new Set([si * rows + sj]);
  const queue: [number, number][] = [[si, sj]];
  while (queue.length) {
    const [i, j] = queue.shift()!;
    if (Math.abs(i - ti) <= 1 && Math.abs(j - tj) <= 1) return true;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di!, nj = j + dj!;
      if (!seen.has(ni * rows + nj) && free(ni, nj)) {
        seen.add(ni * rows + nj);
        queue.push([ni, nj]);
      }
    }
  }
  return false;
}

const text = (specs: ReturnType<typeof specsFor>) => JSON.stringify(specs.map((s) => [s.plaque, s.exhibit?.label]));

describe.each(MODES)("exhibits in %s mode", (mode) => {
  const specs = specsFor(mode);
  const inRoom = (room: string) => specs.filter((s) => s.room === room);

  it("hangs one board per verified degree in the Library", () => {
    const boards = inRoom("library").filter((s) => s.kind === "wallPlaque");
    expect(boards.map((s) => s.exhibit?.content)).toEqual(
      viewFor(profile, projects, mode).education.map((e) => ({ type: "education", id: e.id })),
    );
  });

  it("lays the degree boards out left to right, in mode order, as you face the wall", () => {
    const boards = inRoom("library").filter((s) => s.kind === "wallPlaque");
    // Facing the west wall (looking west), left is +Z.
    expect(boards[0]!.z).toBeGreaterThan(boards[1]!.z);
    expect(boards[0]!.plaque.eyebrow).toBe(mode === "developer" ? "B.Tech" : "BBA");
  });

  it("shows published projects on stands, and unfinished ones as sealed doors with their name only", () => {
    const room = inRoom("creation");
    expect(room.filter((s) => s.kind === "stand").map((s) => s.plaque.title)).toEqual(["TaskNest"]);
    const sealed = room.filter((s) => s.kind === "sealedDoor");
    expect(sealed.map((s) => s.plaque.title).sort()).toEqual(["FactCheckAI", "Humanizer"]);
    for (const s of sealed) {
      expect(s.exhibit).toBeNull();
      expect(s.plaque.lines).toEqual([]);
      expect(s.plaque.eyebrow).toBe("Opening soon");
    }
  });

  it("never places unverified records: Archive and Workshop show an honest notice", () => {
    expect(text(specs)).not.toMatch(/ACHIVIA|FastAPI|Python|TypeScript/);
    expect(inRoom("archive").map((s) => s.kind)).toEqual(["noticeBoard"]);
    expect(inRoom("workshop").map((s) => s.kind)).toEqual(["noticeBoard"]);
    expect(inRoom("archive")[0]!.exhibit?.content).toMatchObject({ type: "notice" });
  });

  it("puts the real portrait in the Portrait Room and contact details in the Courtyard", () => {
    expect(inRoom("portrait")[0]).toMatchObject({ kind: "portrait", plaque: { title: "Barsarani Sahoo" } });
    expect(inRoom("portrait")[0]!.exhibit?.content).toEqual({ type: "identity" });
    const sign = inRoom("courtyard")[0]!;
    expect(sign.kind).toBe("signpost");
    expect(sign.plaque.lines).toContain("github.com/barsa-dot");
  });
});

describe("once records are verified", () => {
  const specs = specsFor("business", verified(profile));

  it("adds them automatically", () => {
    const archive = specs.filter((s) => s.room === "archive");
    expect(archive.map((s) => s.kind)).toEqual(["wallPlaque"]);
    expect(archive[0]!.plaque.lines).toEqual(["ACHIVIA"]);
    expect(specs.find((s) => s.id === "workshop-technical")).toBeDefined();
    expect(specs.find((s) => s.id === "workshop-notice")).toBeUndefined();
  });
});

const SOURCES = [
  ["today's profile", profile],
  ["every wall slot filled", { ...withSamples(10, 5), skills: withSampleSkills().skills }],
] as const;

describe.each(MODES.flatMap((mode) => SOURCES.map(([name, source]) => [mode, name, source] as const)))("placement in %s mode, %s", (mode, _name, source) => {
  const world = buildMuseumWorld(viewFor(source, projects, mode));
  const rectOf = (id: string) => ROOM_PLANS.find((r) => r.room.id === id)!.rect;
  const inside = (p: { x: number; z: number }, id: string, margin = 0) => {
    const r = rectOf(id);
    return p.x >= r.minX - margin && p.x <= r.maxX + margin && p.z >= r.minZ - margin && p.z <= r.maxZ + margin;
  };

  it("keeps every exhibit inside its room", () => {
    for (const s of world.specs) expect(inside(s, s.room, 0.1), s.id).toBe(true);
  });

  it("leaves every viewing spot clear, inside the room and reachable from the room's centre", () => {
    for (const s of world.specs) {
      if (!s.exhibit) continue;
      const spot = { x: s.exhibit.x, z: s.exhibit.z };
      expect(inside(spot, s.room), s.id).toBe(true);
      for (const c of world.colliders) expect(overlaps(spot, PLAYER_RADIUS, c), `${s.id} spot blocked`).toBe(false);
      expect(walkable(roomCentre(s.room), spot, rectOf(s.room), world.colliders), `${s.id} unreachable`).toBe(true);
    }
  });

  it("offers each exhibit's prompt when standing at its spot facing it", () => {
    for (const s of world.specs) {
      if (!s.exhibit) continue;
      // Facing the object: forward (-sin yaw, -cos yaw) points back at it.
      const yaw = Math.atan2(s.exhibit.x - s.x, s.exhibit.z - s.z);
      expect(nearestInteractable({ x: s.exhibit.x, z: s.exhibit.z, yaw, pitch: 0 }, world.exhibits)?.id, s.id).toBe(s.exhibit.id);
    }
  });

  it("keeps furniture off room centres and away from every doorway", () => {
    for (const plan of ROOM_PLANS) {
      for (const c of FURNISHING_COLLIDERS) expect(overlaps(roomCentre(plan.room.id), PLAYER_RADIUS, c), `${plan.room.id} centre`).toBe(false);
      for (const o of plan.openings) {
        const r = plan.rect;
        // A point 1 m inside the room in front of each opening.
        const p =
          o.side === "north" ? { x: o.at, z: r.minZ + 1 } :
          o.side === "south" ? { x: o.at, z: r.maxZ - 1 } :
          o.side === "west" ? { x: r.minX + 1, z: o.at } : { x: r.maxX - 1, z: o.at };
        for (const c of FURNISHING_COLLIDERS) expect(overlaps(p, PLAYER_RADIUS, c), `${plan.room.id} ${o.side} doorway`).toBe(false);
      }
    }
  });

  it("hangs wall boards clear of every doorway and of each other", () => {
    const HALF = 1.6; // half the framed board's width, with a little air
    const boards = world.specs.filter((s) => s.kind === "wallPlaque" || s.kind === "noticeBoard");
    for (const s of boards) {
      const plan = ROOM_PLANS.find((p) => p.room.id === s.room)!;
      const r = plan.rect;
      const side = Math.abs(s.x - r.minX) < 0.2 ? "west" : Math.abs(s.x - r.maxX) < 0.2 ? "east" : Math.abs(s.z - r.minZ) < 0.2 ? "north" : "south";
      const along = side === "west" || side === "east" ? s.z : s.x;
      for (const o of plan.openings.filter((o) => o.side === side)) {
        expect(Math.abs(along - o.at), `${s.id} vs ${side} doorway`).toBeGreaterThanOrEqual(HALF + o.width / 2);
      }
      for (const t of boards) {
        if (t === s || t.room !== s.room || Math.abs(t.face - s.face) > 1e-6) continue;
        const gap = side === "west" || side === "east" ? Math.abs(t.z - s.z) : Math.abs(t.x - s.x);
        const sameWall = side === "west" || side === "east" ? Math.abs(t.x - s.x) < 0.2 : Math.abs(t.z - s.z) < 0.2;
        if (sameWall) expect(gap, `${s.id} overlaps ${t.id}`).toBeGreaterThanOrEqual(2 * HALF);
      }
    }
  });

  it("places every furnishing inside a room", () => {
    for (const f of FURNISHINGS) expect(ROOM_PLANS.some((r) => inside(f, r.room.id)), `${f.kind} at ${f.x},${f.z}`).toBe(true);
  });
});

describe("the path search used above", () => {
  it("reports a route as blocked when a wall cuts the room in two", () => {
    const rect = { minX: 0, maxX: 10, minZ: 0, maxZ: 10 };
    const wall: Collider = { kind: "box", minX: -1, maxX: 11, minZ: 4.9, maxZ: 5.1 };
    expect(walkable({ x: 5, z: 2 }, { x: 5, z: 8 }, rect, [wall])).toBe(false);
    expect(walkable({ x: 5, z: 2 }, { x: 5, z: 8 }, rect, [])).toBe(true);
  });
});
