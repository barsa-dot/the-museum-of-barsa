// Exhibits in each room, built from the VERIFIED, mode-ordered profile view.
// Nothing unverified is ever placed: rooms whose records aren't confirmed yet
// show an honest notice instead. New verified records appear automatically.
//
// Pure data (no Three.js). Units: metres; north is -Z. `face` is the
// rotation about Y applied to the object: its front faces (sin face, cos face).

import type { ModeView } from "../../data/profile/selectors";
import { skillFamily, skillFamilyOrder } from "../../data/profile/presentation";
import { SKILL_FAMILY_LABELS } from "../../content/rules";
import { box, circle, type Collider } from "../collision";
import type { Exhibit } from "../world";
import { ROOM_PLANS, type Rect } from "./plan";

export type ExhibitKind = "wallPlaque" | "stand" | "sealedDoor" | "portrait" | "noticeBoard" | "signpost";

export interface Plaque {
  eyebrow: string;
  title: string;
  lines: string[];
}

export interface ExhibitSpec {
  id: string;
  room: string;
  kind: ExhibitKind;
  /** Object position on the floor plan, and the direction its front faces. */
  x: number;
  z: number;
  face: number;
  /** Height of a wall board's centre, if not the usual 2 m (e.g. above furniture). */
  y?: number;
  plaque: Plaque;
  /** Where the visitor stands to interact; null for decorative-only items. */
  exhibit: Exhibit | null;
  collider: Collider | null;
}

const rectOf = (id: string): Rect => ROOM_PLANS.find((r) => r.room.id === id)!.rect;

/** Front-facing rotations for objects against each wall. */
export const FACE = { south: 0, west: -Math.PI / 2, north: Math.PI, east: Math.PI / 2 } as const;

/** Point `d` metres in front of an object. */
export function inFront(x: number, z: number, face: number, d: number): { x: number; z: number } {
  return { x: x + Math.sin(face) * d, z: z + Math.cos(face) * d };
}

function interact(id: string, x: number, z: number, face: number, label: string, verb: string, content: Exhibit["content"], reach = 1.6): Exhibit {
  const p = inFront(x, z, face, reach);
  return { id, label, verb, content, x: p.x, z: p.z, radius: 2.6 };
}

/**
 * Evenly spaced positions along a span, centred. Facing a west wall (looking
 * west), left is +Z, so wall items there are laid out from maxZ to minZ to
 * read left to right in their mode order.
 */
function spread(count: number, from: number, to: number): number[] {
  if (count === 1) return [(from + to) / 2];
  return Array.from({ length: count }, (_, i) => from + ((to - from) * i) / (count - 1));
}

/** A position on a wall for a framed board: object position and facing. */
interface Slot {
  x: number;
  z: number;
  face: number;
  y?: number;
}

/**
 * Wall slots in reading order, clear of every doorway (checked by tests).
 * Archive: west wall, then above the cabinets on the south wall, then the
 * north wall either side of the gallery. Library achievements: either side
 * of the gallery on the south wall, then the east wall.
 */
const ARCHIVE_SLOTS: readonly Slot[] = [
  { x: -35.95, z: 13, face: FACE.east },
  { x: -35.95, z: 8.5, face: FACE.east },
  { x: -35.95, z: 4, face: FACE.east },
  // Hung higher, clear of the 1.3 m filing cabinets below.
  { x: -32.5, z: 15.95, face: FACE.north, y: 2.6 },
  { x: -25.5, z: 15.95, face: FACE.north, y: 2.6 },
  { x: -33.5, z: 1.05, face: FACE.south },
  { x: -24.5, z: 1.05, face: FACE.south },
];
const LIBRARY_ACHIEVEMENT_SLOTS: readonly Slot[] = [
  { x: -33.5, z: -1.05, face: FACE.north },
  { x: -24.5, z: -1.05, face: FACE.north },
  { x: -22.05, z: -12, face: FACE.west },
];

/**
 * Places one board per record. Never hides a record: when there are more
 * records than slots, the last slot shows "More …" and opens the whole
 * section, so every entry stays one step away.
 */
function placeRecords<T>(
  records: readonly T[],
  slots: readonly Slot[],
  board: (record: T, slot: Slot) => ExhibitSpec,
  more: (slot: Slot, hidden: number) => ExhibitSpec,
): ExhibitSpec[] {
  if (records.length <= slots.length) return records.map((r, i) => board(r, slots[i]!));
  const direct = slots.length - 1;
  return [...records.slice(0, direct).map((r, i) => board(r, slots[i]!)), more(slots[direct]!, records.length - direct)];
}

export function buildExhibits(view: ModeView): ExhibitSpec[] {
  const specs: ExhibitSpec[] = [];
  const notice = (room: string, x: number, z: number, face: number, title: string) => {
    const id = `${room}-notice`;
    specs.push({
      id,
      room,
      kind: "noticeBoard",
      x,
      z,
      face,
      plaque: { eyebrow: "Notice", title: "Being prepared", lines: ["This collection is being", "prepared and will open soon."] },
      exhibit: interact(id, x, z, face, `${title} (being prepared)`, "Read", {
        type: "notice",
        title,
        text: "This collection is being prepared. Its records will appear here once they have been confirmed.",
      }),
      collider: null,
    });
  };

  // ---------- Library: one framed board per degree on the west wall ----------
  {
    const r = rectOf("library");
    const x = r.minX + 0.05;
    const zs = spread(view.education.length, r.maxZ - 4, r.minZ + 4);
    view.education.forEach((e, i) => {
      const z = zs[i]!;
      const id = `library-${e.id}`;
      specs.push({
        id,
        room: "library",
        kind: "wallPlaque",
        x,
        z,
        face: FACE.east,
        plaque: { eyebrow: e.qualification, title: e.field, lines: [e.institution] },
        exhibit: interact(id, x, z, FACE.east, `${e.qualification}, ${e.institution}`, "View", { type: "education", id: e.id }),
        collider: null,
      });
    });
    if (view.education.length === 0) notice("library", x, (r.minZ + r.maxZ) / 2, FACE.east, "Education");
  }

  // ---------- Creation Wing: a stand per published project, sealed doors for the rest ----------
  {
    const r = rectOf("creation");
    const shown = view.exhibitedProjects;
    const xs = spread(shown.length, r.minX + 4, r.maxX - 4);
    const z = (r.minZ + r.maxZ) / 2 - 2;
    shown.forEach((p, i) => {
      const x = shown.length === 1 ? 0 : xs[i]!;
      const id = `creation-${p.id}`;
      const closed = p.status === "unavailable";
      specs.push({
        id,
        room: "creation",
        kind: "stand",
        x,
        z,
        face: FACE.south,
        plaque: { eyebrow: closed ? "Temporarily closed" : "Now showing", title: p.name, lines: p.tagline ? [p.tagline] : [] },
        exhibit: interact(id, x, z, FACE.south, p.name, "View", { type: "project", id: p.id }, 1.9),
        collider: box(x - 1.1, x + 1.1, z - 0.45, z + 0.45),
      });
    });
    const sealedXs = spread(view.sealedProjects.length, r.minX + 3.5, r.maxX - 3.5);
    view.sealedProjects.forEach((p, i) => {
      // Name only, never details: unfinished projects are not exhibited.
      specs.push({
        id: `creation-sealed-${p.id}`,
        room: "creation",
        kind: "sealedDoor",
        x: sealedXs[i]!,
        z: r.minZ + 0.05,
        face: FACE.south,
        plaque: { eyebrow: "Opening soon", title: p.name, lines: [] },
        exhibit: null,
        collider: null,
      });
    });
  }

  // ---------- Library: verified academic achievements, if any ----------
  specs.push(
    ...placeRecords(
      view.achievements,
      LIBRARY_ACHIEVEMENT_SLOTS,
      (a, slot) => {
        const id = `library-achievement-${a.id}`;
        return {
          id,
          room: "library",
          kind: "wallPlaque",
          ...slot,
          plaque: { eyebrow: a.kind, title: a.title, lines: a.issuer ? [a.issuer] : [] },
          exhibit: interact(id, slot.x, slot.z, slot.face, a.title, "View", { type: "achievement", id: a.id }),
          collider: null,
        };
      },
      (slot, hidden) => ({
        id: "library-achievements-more",
        room: "library",
        kind: "wallPlaque",
        ...slot,
        plaque: { eyebrow: "Achievements", title: `${hidden} more`, lines: ["See every achievement"] },
        exhibit: interact("library-achievements-more", slot.x, slot.z, slot.face, "All achievements", "View", { type: "section", section: "achievements" }),
        collider: null,
      }),
    ),
  );

  // ---------- Archive: every verified experience record, or an honest notice ----------
  {
    const r = rectOf("archive");
    if (view.experience.length === 0) notice("archive", r.minX + 0.05, (r.minZ + r.maxZ) / 2 + 2, FACE.east, "Experience");
    else {
      specs.push(
        ...placeRecords(
          view.experience,
          ARCHIVE_SLOTS,
          (e, slot) => {
            const id = `archive-${e.id}`;
            return {
              id,
              room: "archive",
              kind: "wallPlaque",
              ...slot,
              plaque: { eyebrow: e.kind, title: e.role ?? e.organisation, lines: e.role ? [e.organisation] : [] },
              exhibit: interact(id, slot.x, slot.z, slot.face, e.role ? `${e.role}, ${e.organisation}` : e.organisation, "View", { type: "experience", id: e.id }),
              collider: null,
            };
          },
          (slot, hidden) => ({
            id: "archive-more",
            room: "archive",
            kind: "wallPlaque",
            ...slot,
            plaque: { eyebrow: "Experience", title: `${hidden} more`, lines: ["See the whole collection"] },
            exhibit: interact("archive-more", slot.x, slot.z, slot.face, "All experience", "View", { type: "section", section: "experience" }),
            collider: null,
          }),
        ),
      );
    }
  }
  {
    const r = rectOf("workshop");
    if (view.skills.length === 0) notice("workshop", r.maxX - 0.05, (r.minZ + r.maxZ) / 2, FACE.west, "Skills");
    else {
      // One board per skill family (technical, broader), in the mode's order,
      // left to right as you face the east wall (left is -Z there).
      const x = r.maxX - 0.05;
      const families = skillFamilyOrder(view.mode)
        .map((family) => ({ family, skills: view.skills.filter((s) => skillFamily(s.category) === family) }))
        .filter((f) => f.skills.length > 0);
      const zs = spread(families.length, r.minZ + 4, r.maxZ - 3.5);
      families.forEach(({ family, skills }, i) => {
        const id = `workshop-${family}`;
        const z = zs[i]!;
        // A plaque holds four lines: all names if they fit, else three and a count.
        const names = skills.slice(0, skills.length > 4 ? 3 : 4).map((s) => s.name);
        const rest = skills.length - names.length;
        specs.push({
          id,
          room: "workshop",
          kind: "wallPlaque",
          x,
          z,
          face: FACE.west,
          plaque: { eyebrow: "Skills", title: SKILL_FAMILY_LABELS[family], lines: rest > 0 ? [...names, `and ${rest} more`] : names },
          exhibit: interact(id, x, z, FACE.west, SKILL_FAMILY_LABELS[family], "View", { type: "section", section: "skills" }),
          collider: null,
        });
      });
    }
  }

  // ---------- Portrait Room: the real portrait on the far wall ----------
  if (view.person) {
    const r = rectOf("portrait");
    const x = r.maxX - 0.05;
    const z = (r.minZ + r.maxZ) / 2;
    const id = "portrait-identity";
    specs.push({
      id,
      room: "portrait",
      kind: "portrait",
      x,
      z,
      face: FACE.west,
      plaque: { eyebrow: "Portrait", title: view.person.name, lines: view.person.headline ? [view.person.headline] : [] },
      exhibit: interact(id, x, z, FACE.west, view.person.name, "Meet", { type: "identity" }, 2.4),
      collider: null,
    });
  }

  // ---------- Courtyard: a contact signpost ----------
  if (view.contact) {
    const r = rectOf("courtyard");
    const x = 0;
    const z = r.maxZ - 5;
    const lines = [view.contact.email, view.contact.github?.label, view.contact.linkedin?.label].filter((l): l is string => Boolean(l));
    specs.push({
      id: "courtyard-contact",
      room: "courtyard",
      kind: "signpost",
      x,
      z,
      face: FACE.north,
      plaque: { eyebrow: "Contact", title: "Get in touch", lines },
      exhibit: interact("courtyard-contact", x, z, FACE.north, "Contact", "View", { type: "section", section: "contact" }, 1.8),
      collider: circle(x, z, 0.35),
    });
  }

  return specs;
}
